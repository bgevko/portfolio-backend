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
    // let decodedToken;
    // try {
    //     decodedToken = jwt.verify(getTokenFrom(req), process.env.SECRET);
    // } catch (error) {
    //     return res.status(401).json({ error: 'Invalid credentials.' });
    // }
    
    // if (!decodedToken.id) {
    //     return res.status(401).json({ error: 'Invalid credentials.' });
    // }

    // const isAdmin = await User.isUserAdmin(decodedToken.id);
    // if (!isAdmin) {
    //     return res.status(401).json({ error: 'Only authorized users can create blog posts.' });
    // }
    
    // Convert date to an object compatible with MongoDB date format
    const date = new Date(req.body.publishDate);
    const todayDate = new Date();
    date.setHours(todayDate.getHours(), todayDate.getMinutes(), todayDate.getSeconds());
    
    blog.addArticle(
        req.body.title, 
        req.body.author,
        date,
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

router.put('/blog/:_id', sanitizeBlogRequest, validateBlogRequest, async(req, res) => {
    // let decodedToken;
    // try {
    //     decodedToken = jwt.verify(getTokenFrom(req), process.env.SECRET);
    // } catch (error) {
    //     return res.status(401).json({ error: 'Invalid credentials.' });
    // }

    // if (!decodedToken.id) {
    //     return res.status(401).json({ error: 'Invalid credentials.' });
    // }

    // const isAdmin = await User.isUserAdmin(decodedToken.id);
    // if (!isAdmin) {
    //     return res.status(401).json({ error: 'Only authorized users can update blog posts.' });
    // }

    blog.updateArticle(
        req.params._id, 
        req.body.title, 
        req.body.author,
        req.body.publishDate,
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
router.delete('/blog/:_id', async (req, res) => {
    // let decodedToken;
    // try {
    //     decodedToken = jwt.verify(getTokenFrom(req), process.env.SECRET);
    // } catch (error) {
    //     return res.status(401).json({ error: 'Invalid credentials.' });
    // }

    // if (!decodedToken.id) {
    //     return res.status(401).json({ error: 'Invalid credentials.' });
    // }

    // const isAdmin = await User.isUserAdmin(decodedToken.id);
    // if (!isAdmin) {
    //     return res.status(401).json({ error: 'Only authorized users can delete blog posts.' });
    // }

    blog.deleteArticleById(req.params._id)
        .then(deletedCount => {
            if (deletedCount === 1) {
                return res.status(204).send({ success: `Successfully deleted blog with id ${req.params._id}.` });
            } else {
                return res.status(404).json({ error: `Could not delete blog with id ${req.params._id}, blog not found.` });
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

    // Format tags to be capitalized and have no leading or trailing whitespace, and store them as an array
    let tags = req.body.tags.split(',').map(tag => {
        const formattedTag = tag.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()).trim();
        return formattedTag;
    });

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