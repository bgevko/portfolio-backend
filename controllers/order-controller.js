const xss = require('xss');
const express = require('express');

const router = express.Router();

// CREATE controller ******************************************
router.post ('/order', sanitizeRequest, validateOrderRequest, (req,res) => { 
    const name = req.body.name;
    const email = req.body.email;
    const address = req.body.address;
    const deliveryInstructions = req.body.deliveryInstructions
    const product = req.body.product;
    const quantity = req.body.quantity;

    res.status(201).json({ message: 'Message sent successfully!' });

});

// Validate contact request
function validateOrderRequest(req, res, next) {
    const requiredFields = ['name', 'email', 'address', 'product', 'quantity']

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
    isNotString('address', 'Subject must be a string.');
    isNotString('product', 'Message must be a string.');

    next();
}

function sanitizeRequest(req, res, next) {
    const requiredFields = ['name', 'email', 'address', 'deliveryInstructions', 'product', 'quantity']
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        req.body[field] = xss(req.body[field]);
    }
    next();
}

module.exports = router;