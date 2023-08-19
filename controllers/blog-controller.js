const xss = require('xss');
const blog = require('../models/blog_model.js');
const express = require('express');

const router = express.Router();

// CREATE controller ******************************************

// Create new blog post
router.post ('/blog', sanitizeBlogRequest, validateBlogRequest, (req,res) => {

    // Convert date to an object compatible with MongoDB date format
    const date = new Date(req.body.publishDate);
    const todayDate = new Date();
    date.setHours(todayDate.getHours(), todayDate.getMinutes(), todayDate.getSeconds());
    
    blog.createBlog(
        req.body.title, 
        req.body.author,
        date,
        req.body.preview,
        req.body.content,
        req.body.tags
        )
        .then(post => {
            res.status(201).json(post);
            // error test
            // res.status(400).json({ error: 'Failed to create blog post. A required field is either missing or invalid.' })
        })
        .catch(error => {
            console.log(error);
            res.status(400).json({ error: 'Failed to create blog post. A required field is either missing or invalid.' });
        });
});

// UPDATE controller ************************************

router.put('/blog/:_id', sanitizeBlogRequest, validateBlogRequest, (req, res) => {
    blog.updateBlog(
        req.params._id, 
        req.body.title, 
        req.body.author,
        req.body.publishDate,
        req.body.preview,
        req.body.content,
        req.body.tags
    )
    .then(post => {
        console.log(post)
        res.status(200).json(post);
        // error test
        // res.status(400).json({ error: 'Failed to create blog post. A required field is either missing or invalid.' })
    })
    .catch(error => {
        console.log(error);
        res.status(400).json({ error: 'Could not update blog. Something went wrong with the request.' });
    });
});

// RETRIEVE controller ****************************************************
router.get('/blog', (req, res) => {
    blog.retrieveBlogs()
        .then(post => { 
            if (post !== null) {
                console.log(post)
                console.log("this should show up on the server")
                res.json(post);
            } else {
                res.status(404).json({error: 'No blogs found.' });
            }         
         })
        .catch(error => {
            console.log(error);
            res.status(400).json({error: 'Cannot retrieve blogs, something went wrong with the request.' });
        });
});


// RETRIEVE by ID controller
router.get('/blog/:_id', (req, res) => {
    blog.retrieveBlogByID(req.params._id)
    .then(post => { 
        if (post !== null) {
            res.json(post);
        } else {
            res.status(404).json({error: `Blog with id ${req.params._id} not found.` });
        }         
     })
    .catch(error => {
        console.log(error);
        res.status(400).json({error: 'Could not find blog, something went wrong with the request.' });
    });
});


// DELETE Controller ******************************
router.delete('/blog/:_id', (req, res) => {
    blog.deleteBlogById(req.params._id)
        .then(deletedCount => {
            if (deletedCount === 1) {
                res.status(204).send({ success: `Successfully deleted blog with id ${req.params._id}.` });
                // error test
                // res.status(400).json({ error: `Could not delete blog with id ${req.params._id}, something went wrong with the request.` });
            } else {
                res.status(404).json({ error: `Could not delete blog with id ${req.params._id}, blog not found.` });
            }
        })
        .catch(error => {
            console.error(error);
            res.status(400).json({ error: 'Could not delete blog, something went wrong with the request.' });
        });
});

// DELETE ALL Controller ******************************
router.delete('/all_blogs_test_only', (req, res) => {
    blog.deleteAllBlogs()
        .then(deletedCount => {
            if (deletedCount > 0) {
                res.status(204).send({ success: `Successfully deleted ${deletedCount} blogs.` });
            } else {
                res.status(404).json({ error: `Could not delete blogs, no blogs found.` });
            }
        })
        .catch(error => {
            console.error(error);
            res.send({ error: 'Could not delete blogs, something went wrong with the request.' });
        });
});

function validateBlogRequest(req, res, next) {
    const requiredFields = ['title', 'author', 'publishDate', 'preview', 'content', 'tags'];
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

    isNotString('title', 'Title must be a string.');
    isNotString('author', 'Author must be a string.');
    isNotString('publishDate', 'Publish date must be a string.');
    isNotString('preview', 'Preview must be a string.');
    isNotString('content', 'Content must be a string.');
    isNotString('tags', 'Tags must be a string.');

    // Date validtor from https://rgxdb.com/r/2V9BOC58
    const dateRegex = /^(?:(?:(?:(?:(?:[1-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:[2468][048]|[13579][26])00))(\/|-|\.)(?:0?2\1(?:29)))|(?:(?:[1-9]\d{3})(\/|-|\.)(?:(?:(?:0?[13578]|1[02])\2(?:31))|(?:(?:0?[13-9]|1[0-2])\2(?:29|30))|(?:(?:0?[1-9])|(?:1[0-2]))\2(?:0?[1-9]|1\d|2[0-8])))))$/
    if (!dateRegex.test(req.body.publishDate)) {
        return res.status(400).json({ error: 'Publish date must be a valid date in the format YYYY-MM-DD.' });
    }

    // convert publishDate to a date object
    req.body.publishDate = new Date(req.body.publishDate);

    // Seperate by commas and convert to array
    let tags = req.body.tags.split(',').map(tag => tag.trim());

    req.body.tags = tags;
    next();
}

function sanitizeBlogRequest(req, res, next) {
    const requiredFields = ['title', 'author', 'publishDate', 'preview', 'tags'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        req.body[field] = xss(req.body[field]);
    }
    next();
}

module.exports = router;