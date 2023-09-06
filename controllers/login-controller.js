const express = require('express');
const router = express.Router();
const xss = require('xss');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model.js');


// Create account ******************************************
router.post ('/create', sanitizeRequest, async (req,res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  User.createUser(username, passwordHash, email, firstName, lastName)
    .then(user => {
      res.status(201).json({
        message: 'User created successfully.',
        user: user
      })
    })
    .catch(error => {
      res.status(400).json({
        error: error.message
      })
    })
})

// Login ******************************************
router.post ('/login', sanitizeRequest, async (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  // find the user in the database
  try {
    const user = await User.getUser(username);
    const passwordCorrect = user === null ? false : await bcrypt.compare(password, user.password);
    if (!(user && passwordCorrect)) {
      return res.status(401).json({
        error: 'Invalid username or password.'
      })
    }
    const userForToken = {
      username: user.username,
      id: user._id
    }
  
    const token = jwt.sign(userForToken, process.env.SECRET)
    res.status(200).send({token, username: user.username, message: `Logged in as ${user.username}.`, isAdmin: user.isAdmin})

  } catch {
    res.status(401).json({
      error: 'Invalid username or password.'
    })
  }

})

const getTokenFrom = req => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
      return authorization.substring(7);
  }
  return null;
};

// Verify login token ******************************************
router.get ('/login/verify', async (req,res) => {
  const decodedToken = jwt.verify(getTokenFrom(req), process.env.SECRET);
  if (!decodedToken.id) {
      return res.status(401).json({ error: 'Token missing or invalid.' });
  }
  try {
    const user = await User.getUserById(decodedToken.id);
    res.status(200).json({
      username: user.username,
      isAdmin: user.isAdmin,
      message: `Logged in as ${user.username}.`
    })
  } catch {
    res.status(401).json({
      error: 'Token missing or invalid.'
    })
  }
})

function sanitizeRequest(req, res, next) {
  const requiredFields = ['username', 'password',]
  for (let i = 0; i < requiredFields.length; i++) {
      const field = requiredFields[i];
      req.body[field] = xss(req.body[field]);
  }
  next();
}

module.exports = router;