const xss = require('xss');
const blog = require('../models/blog_model.js');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model.js');


const router = express.Router();

const getTokenFrom = (request) => {
    const authorization = request.get('authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer')) {
        return authorization.substring(7);
    }
    return null;
};

// CREATE ARTICLE
router.post ('/blog', sanitizeBlogRequest, validateBlogRequest, async(req,res) => {
    
    
    blog.addArticle(
        req.body.title, 
        req.body.publishDate,
        req.body.editDate,
        req.body.preview,
        req.body.content,
        req.body.tags
        )
        .then(article => {
            return res.status(201).json(article);
        })
        .catch(error => {
            console.log(error);
            return res.status(400).json({ error: 'Failed to create blog post. A required field is either missing or invalid.' });
        });
});

// UPDATE
router.put('/blog/:encoded_title', sanitizeBlogRequest, validateBlogRequest, async(req, res) => {
    const decodedTitle = decodeURIComponent(req.params.encoded_title);
    blog.updateArticle(
        decodedTitle,
        req.body.title, 
        req.body.publishDate,
        req.body.editDate,
        req.body.preview,
        req.body.content,
        req.body.tags
    )
    .then(article => {
        return res.status(200).json(article);
    })
    .catch(error => {
        console.log(error);
        return res.status(400).json({ error: 'Could not update blog. Something went wrong with the request.' });
    });
});

// Get latest
router.get('/blog/latest', (req, res) => {
    blog.getLatestArticle()
    .then(article => {
        if (article !== null) {
            return res.status(200).json(article);
        } else {
            return res.status(404).json({error: 'No blog posts found.' });
        }
    })
    .catch(error => {
        console.log(error);
        return res.status(400).json({error: 'Cannot retrieve blog posts, something went wrong with the request.' });
    });
});

// Get by relative path
router.get('/blog/relative/:path', (req, res) => {
    blog.getArticleByPath(req.params.path)
    .then(article => {
        if (article !== null) {
            return res.status(200).json(article);
        } else {
            return res.status(404).json({error: `Blog with path ${req.params.path} not found.` });
        }
    })
    .catch(error => {
        console.log(error);
        return res.status(400).json({error: 'Could not find blog, something went wrong with the request.' });
    });
});

// Get random
router.get('/blog/random', (req, res) => {
    const exclude = req.query.exclude;
    if (exclude === undefined) {
        return res.status(400).json({error: 'Exclude parameter is missing.' });
    }
    blog.getRandomArticle(req.query.exclude)
    .then(article => {
        if (article !== null) {
            return res.status(200).json(article);
        } else {
            return res.status(404).json({error: 'No blog posts found.' });
        }
    })
    .catch(error => {
        console.log(error);
        return res.status(400).json({error: 'Cannot retrieve blog posts, something went wrong with the request.' });
    });
})

// Get by id
router.get('/blog/:_id', (req, res) => {
    blog.getArticleById(req.params._id)
    .then(article => { 
        if (article !== null) {
            return res.status(200).json(article);
        } else {
            return res.status(404).json({error: `Blog with id ${req.params._id} not found.` });
        }         
     })
    .catch(error => {
        console.log(error);
        return res.status(400).json({error: 'Could not find blog, something went wrong with the request.' });
    });
});

// Get all
router.get('/blog', (req, res) => {
    blog.getArticles()
        .then(articles => { 
            if (articles !== null) {
                return res.status(200).json(articles);
            } else {
                return res.status(404).json({error: 'No blogs found.' });
            }         
         })
        .catch(error => {
            console.log(error);
            return res.status(400).json({error: 'Cannot retrieve blogs, something went wrong with the request.' });
        });
});


// DELETE 
router.delete('/blog/:decoded_title', async (req, res) => {
    const decodedTitle = decodeURIComponent(req.params.decoded_title);
    blog.deleteArticleTitle(decodedTitle)
        .then(deletedCount => {
            if (deletedCount === 1) {
                return res.status(204).send({ success: `Successfully deleted blog with id ${req.params._id}.` });
            } else {
                return res.status(404).json({ error: `Could not delete blog. Db issue.` });
            }
        })
        .catch(error => {
            console.error(error);
            return res.status(400).json({ error: 'Could not delete blog, something went wrong with the request.' });
        });
});

// DELETE ALL
router.delete('/all_articles_test_only', (req, res) => {
    blog.deleteAllArticles()
        .then(deletedCount => {
            if (deletedCount > 0) {
                return res.status(204).send({ success: `Successfully deleted ${deletedCount} blogs.` });
            } else {
                return res.status(404).json({ error: `Could not delete blogs, no blogs found.` });
            }
        })
        .catch(error => {
            console.error(error);
            return res.send({ error: 'Could not delete blogs, something went wrong with the request.' });
        });
});

function validateBlogRequest(req, res, next) {
    const requiredFields = ['title', 'publishDate', 'editDate', 'preview', 'content', 'tags'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            return res.status(400).json({ error: `Request body is missing ${field}.` });
        }
    }

    // Format tags to be capitalized and have no leading or trailing whitespace, and store them as an array
    let tags = req.body.tags.split(',').map(tag => {
        const formattedTag = tag.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).trim();
        return formattedTag;
    });

    req.body.tags = tags;
    next();
}

function sanitizeBlogRequest(req, res, next) {
    const requiredFields = ['title', 'publishDate', 'preview', 'tags'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        req.body[field] = xss(req.body[field]);
    }
    next();
}

module.exports = router;
