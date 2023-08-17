
const express = require('express');
const router = express.Router();
const xss = require('xss');

// CREATE controller ******************************************
router.post ('/contact', sanitizeRequest, validateContactRequest, (req,res) => { 
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const contactMethod = req.body.contactMethod;
    const contactTime = req.body.contactTime;

    // TODO: send email

    // Send a confirmation response to the user
    res.status(201).json({ message: 'Message sent successfully!' });
});

// Validate contact request
function validateContactRequest(req, res, next) {
    const requiredFields = ['name', 'email', 'subject', 'message', 'contactMethod'];

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
    isNotString('contactMethod', 'Contact method must be a string.');

    next();
}

function sanitizeRequest(req, res, next) {
    const requiredFields = ['name', 'email', 'subject', 'message', 'contactMethod', 'contactTime']
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        req.body[field] = xss(req.body[field]);
    }
    next();
}


module.exports = router;