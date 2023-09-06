
const express = require('express');
const router = express.Router();
const xss = require('xss');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// OAuth2 client *********************************************
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Send email *********************************************
async function sendMail(email, subject, message) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_ADDRESS,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        const mailOptions = {
            from: `Bogdan Gevko <${process.env.EMAIL_ADDRESS}>`,
            to: email,
            subject: subject,
            text: message,
            html: `<p>${message}</p>`
        };

        const result = await transport.sendMail(mailOptions);
        return result;

    } catch (error) {
        return new Error(error);
    }
}

// CREATE controller ******************************************
router.post ('/contact', sanitizeRequest, validateContactRequest, async (req,res) => { 
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    try {
        // Send email to myself
        const subject_str = `www.bgevko.com - ${subject}`;
        const mail1 = await sendMail(process.env.EMAIL_ADDRESS, subject_str, message);
        console.log(mail1);

        // Send email to user
        const message_str = `Hi ${name},\n\ You contacted me recently at www.bgevko.com. I will get back to you as soon as possible. If you're receiving this messsage in error, please ignore it.\n\nBest,\nBogdan`
        const mail2 = await sendMail(email, 'www.bgevko.com - Message Sent', message_str);

        console.log(mail2);
        // Send a confirmation response to the user
        return res.status(201).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Count not send message.' });
    }
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