
const mongoose = require('mongoose');

// SCHEMA for the blog model.
const blogSchema = mongoose.Schema({
	title:          { type: String, required: true },
    author:         { type: String, required: true },
    preview:        { type: String, required: true},
    content:        { type: String, required: true },
    publishDate:    { type: Date,   required: true, default: Date.now },
    editDate:       { type: Date,   required: false },
    readTime:       { type: Number, default: 1},
    tags:           { type: [String], required: false, set: tags => [...new Set(tags)] },
    relativePath:   { type: String, required: true },
});


const blogs = mongoose.model('Blog', blogSchema);

// CREATE blog model *****************************************
const createBlog = async (title, author, date, preview, content, tags = []) => {
    const wordCount = content.split(/\s+/).length;
    let readTime = Math.ceil(wordCount / 200);
    if (readTime === 0) readTime = 1;

    // Search through the db for the title, and if it exists, set the unique_id number to 1 + the number of instances that exist.

    const blogTitles = await blogs.find({title: title});
    const urlIdentifier = blogTitles.length + 1;
    let url = title.replace(/\s+/g, '-').toLowerCase();
    if (urlIdentifier > 1) {
        url += `-${urlIdentifier}`;
    }
    
    const blog = new blogs({ 
        title: title, 
        author: author, 
        publishDate: date || Date.now(),
        preview: preview,
        content: content,
        readTime: readTime,
        tags: tags,
        relativePath: url
    });
    return blog.save();
}

// UPDATE model *****************************************************
const updateBlog = async (_id, title, author, publishDate, preview, content, tags=[]) => {
    const newWordCount = content.split(/\s+/).length;
    let readTime = Math.ceil(newWordCount / 200);
    if (readTime === 0) readTime = 1;

    const timeNow = Date.now();
    const result = await blogs.replaceOne({_id: _id }, {
        title: title,
        author: author,
        publishDate: publishDate || timeNow,
        preview: preview,
        content: content,
        readTime: readTime,
        editDate: timeNow,
        tags: tags
    });
    return { 
        _id: _id, 
        title: title,
        author: author,
        publishDate: publishDate,
        preview: preview,
        content: content,
        readTime: readTime,
        editDate: new Date(timeNow).toDateString(),
        tags: tags 
    }
}

// RETRIEVE blog *****************************************
const retrieveBlogs = async () => {
    const query = blogs.find();
    
    // sort by date descending
    query.sort({publishDate: 'desc'});
    return query.exec();
}

// RETRIEVE by blog ID
const retrieveBlogByID = async (_id) => {
    const query = blogs.findById({_id: _id});
    return query.exec();
}

// DELETE blog based on _id  *****************************************
const deleteBlogById = async (_id) => {
    const result = await blogs.deleteOne({_id: _id});
    return result.deletedCount;
};

// DELETE ALL blogs (for testing) *****************************************
const deleteAllBlogs = async () => {
    const result = await blogs.deleteMany();
    return result.deletedCount;
};


// EXPORT the variables for use in the controller file.
module.exports = { createBlog, retrieveBlogs, retrieveBlogByID, updateBlog, deleteBlogById, deleteAllBlogs }