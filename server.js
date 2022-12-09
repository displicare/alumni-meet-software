const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const csv = require('csvtojson')
const ejs = require('ejs');
var expressLayouts = require('express-ejs-layouts');
var html_to_pdf = require('html-pdf-node');
let options = { format: 'A5', landscape: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };

//use ejs
app.set('view engine', 'ejs');
app.use(expressLayouts);
var QRCode = require('qrcode')

app.get('/', async (req, res) => {
    csv().fromFile('./alum.csv').then((jsonObj) => {
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
    var decodedNum = atob(req.params.id).trim();
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

//make a endpoint for new people to register
app.post('/register', (req, res) => {
    res.send('Hello World!');
});

//admin endpoint

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})