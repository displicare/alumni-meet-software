const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const csv = require('csvtojson')
const ejs = require('ejs');
var expressLayouts = require('express-ejs-layouts');
var html_to_pdf = require('html-pdf-node');
let options = { format: 'A5', landscape: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

app.use(bodyParser.json());
app.use(cookieParser())

//serve public
app.use(express.static('public'));

//use ejs
app.set('view engine', 'ejs');
app.use(expressLayouts);
var QRCode = require('qrcode')

app.get('/', async (req, res) => {
    csv().fromFile('./alum1.csv').then((jsonObj) => {
        res.render('passes', { passes: jsonObj });
    });
});
// var opts = {
//     errorCorrectionLevel: 'H',
//     type: 'image/png',
//     quality: 0.95,
//     margin: 1
// }

app.get('/pass/:id', async (req, res) => {
    var decodedNum = Buffer.from(req.params.id, "base64").toString().trim();
    csv().fromFile('./alum.csv').then(async (jsonObj) => {
        var pass = await jsonObj.find(pass => {
            return pass.Number == decodedNum
        });
        QRCode.toDataURL(pass.Number, async function (err, url) {
            await ejs.renderFile('views/pass.ejs', { pass: pass, qr: url }).then(async (html) => {
                await html_to_pdf.generatePdf({content: html}, options).then(pdfBuffer => {
                    res.contentType("application/pdf");
                    res.send(pdfBuffer);
                });
            })
        })
    });

})

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

async function sendMail(to, subject, text, html) {
    var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    let x;
    try {
        x = await transporter.sendMail(mailOptions);
    } catch (err) {
        x = err;
    }
    return x;
}

const renderFile = (file, data) => {
    return new Promise((resolve) => {
        ejs.renderFile(file, data, (err, result) => {
            if (err) {
                console.log(err);
                return err;
            }
            resolve(result);
        });
    });
};


module.exports = { sendMail, renderFile };
// app.get('/test', async (req, res) => {

// })

// //make a endpoint for new people to register
// app.post('/register', (req, res) => {
//     res.send('Hello World!');
// });

//admin endpoint
app.get('/admin', (req, res) => {
    if (req.hasOwnProperty('cookies') && req.cookies.login != undefined && req.cookies.login == "verysecurelyloggedinandthisisarandomstringnow142138512433442") {
        res.render('admin');
    } else {
        res.render('adminLogin');
    }
})

//dummy login
app.post('/auth/login', (req, res) => {
    console.log(req.body);
    var {email, password} = req.body;
    if(email == "hello.world@aisg46.net" && password == "HeyThereComplexxWorld@SecurePass"){
        res.cookie("login", "verysecurelyloggedinandthisisarandomstringnow142138512433442", { maxAge: 1000 * 60 * 60 * 24 * 7 }).send({ sucess: true, msg: "Logged in"});
    }else {
        res.send({ sucess: false, msg: "Wrong Password" })
    }
})

app.get('/admin/checkedin', isAdmin, (req, res) => {
    res.render('checkedin');
})

app.get('/auth/logout', (req, res) => {
    res.clearCookie("login").send({ sucess: true, msg: "Logged out"});
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})

function isAdmin(req, res, next) {
    if (req.hasOwnProperty('cookies') && req.cookies.login != undefined && req.cookies.login == "verysecurelyloggedinandthisisarandomstringnow142138512433442") {
        next();
    } else {
        res.redirect('/');
    }
}