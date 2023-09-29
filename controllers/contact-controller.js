
const express = require('express');
const router = express.Router();
const xss = require('xss');

const MailJet = require('node-mailjet')
const mailjet = MailJet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE,
);

// CREATE controller ******************************************
router.post ('/contact', sanitizeRequest, validateContactRequest, async (req,res) => { 
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    const confirmation = mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "notification@bgevko.com",
                Name: "bgevko.com"
              },
              To: [
                {
                  Email: email,
                  Name: name
                }
              ],
                Subject: "Your message has been received!",
                TextPart: `Dear ${name},\n\ Thank you for contacting me at www.bgevko.com. I'll get back to you as soon as possible. \n\nBest,\nBogdan`,
                HTMLPart: `<h3>Dear ${name},</h3><br />Thank you for contacting me at www.bgevko.com. I'll get back to you as soon as possible. <br /><br />Best,<br />Bogdan`,
            },
          ]
        })
    confirmation
      .then((result) => {
          console.log(result.body)
      })
      .catch((err) => {
          console.log(err.statusCode)
      })
    
    const forMe = mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "notification@bgevko.com",
                Name: "bgevko.com"
              },
              To: [
                {
                  Email: "bgevko@gmail.com",
                  Name: "Bogdan Gevko"
                }
              ],
                Subject: "New message from bgevko.com",
                TextPart: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
                HTMLPart: `Name: ${name}<br />Email: ${email}<br />Subject: ${subject}<br />Message: ${message}`,
            },
          ]
        })
    forMe
      .then((result) => {
          console.log(result.body)
          return res.status(201).json({ message: 'Message sent successfully.' });
      })
      .catch((err) => {
          console.log(err.statusCode)
          return res.status(500).json({ error: 'Something went wrong.' });
      })
  
});

// Validate contact request
function validateContactRequest(req, res, next) {
    const requiredFields = ['name', 'email', 'subject', 'message'];

    // contactTime is optional
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            return res.status(400).json({ error: `Request body is missing ${field}.` });
        }
    }

    const isNotString = (field, errorMessage) => {
        if (typeof req.body[field] !== 'string') {
            return res.status(400).json({ error: errorMessage });
        }
    };

    isNotString('name', 'Name must be a string.');
    isNotString('email', 'Email must be a string.');
    isNotString('subject', 'Subject must be a string.');
    isNotString('message', 'Message must be a string.');
    next();
}

function sanitizeRequest(req, res, next) {
    const requiredFields = ['name', 'email', 'subject', 'message']
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        req.body[field] = xss(req.body[field]);
    }
    next();
}


module.exports = router;
