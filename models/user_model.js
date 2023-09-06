const mongoose = require('mongoose');

// SCHEMA for the user model.
const userSchema = mongoose.Schema({
    username:       { type: String, required: true, unique: true },
    password:       { type: String, required: true },
    email:          { type: String, required: true },
    firstName:      { type: String, required: false },
    lastName:       { type: String, required: false },
    isAdmin:        { type: Boolean, required: true, default: false },
});

const users = mongoose.model('User', userSchema);

// CREATE user model ****************************************
const createUser = async (username, password, email, firstName, lastName) => {
    const user = new users({ 
        username: username, 
        password: password, 
        email: email,
        firstName: firstName,
        lastName: lastName,
        isAdmin: false
    });
    return user.save();
}

// UPDATE model *****************************************************
const updateUser = async (_id, username, password, email, firstName, lastName, isAdmin) => {
    const user = await users.findById(_id);
    if (username) user.username = username;
    if (password) user.password = password;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (isAdmin) user.isAdmin = isAdmin;
    return user.save();
}

// DELETE model *****************************************************
const deleteUser = async (_id) => {
  const user = await users.findById(_id);
  return user.remove();
}

// Find by username
const getUser = async (username) => {
  return users.findOne({ username: username });
}

const getUserById = async (_id) => {
  return users.findById(_id);
}

const isUserAdmin = async (_id) => {
  const user = await users.findById(_id);
  return user.isAdmin;
}

module.exports = { createUser, updateUser, deleteUser, getUser, getUserById, isUserAdmin };

