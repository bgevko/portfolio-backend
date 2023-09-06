// This is the main entry point for the backend.

require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT;
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const blogRoutes = require('./controllers/blog-controller.js');
const contactRoutes = require('./controllers/contact-controller.js');
const orderRoutes = require('./controllers/order-controller.js');
const loginRoutes = require('./controllers/login-controller.js');

// Connect to the database.
mongoose.connect(
    process.env.MONGODB_CONNECT_STRING,
    { useNewUrlParser: true }
);
const db = mongoose.connection;

// Confirm that the database has connected and print a message in the console.
db.once("open", (err) => {
    if(err) {
        console.log('Error connecting to MangoDB.');
    } else  {
        console.log('Successfully connected to MangoDB.');
    }
});

// Middleware
app.use(cors())
app.use(express.json());

// Routes
app.use(blogRoutes);
app.use(contactRoutes);
app.use(orderRoutes);
app.use(loginRoutes);

// 404 error handler
app.use((req, res) => {
    res.status(404).json({ error: 'Page not found. Invalid request URL.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});