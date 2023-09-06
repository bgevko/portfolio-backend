
const mongoose = require('mongoose');

// SCHEMA for the blog model.
const articleSchema = mongoose.Schema({
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


const articles = mongoose.model('Article', articleSchema);

// CREATE 
const addArticle = async (title, author, date, preview, content, tags = []) => {
    const wordCount = content.split(/\s+/).length;
    let readTime = Math.ceil(wordCount / 200);
    if (readTime === 0) readTime = 1;

    // Search through the db for the title, and if it exists, set the unique_id number to 1 + the number of instances that exist.

    const titles = await articles.find({title: title});
    const urlIdentifier = titles.length + 1;
    let url = title.replace(/\s+/g, '-').toLowerCase();
    if (urlIdentifier > 1) {
        url += `-${urlIdentifier}`;
    }
    
    const article = new articles({ 
        title: title, 
        author: author, 
        publishDate: date || Date.now(),
        preview: preview,
        content: content,
        readTime: readTime,
        tags: tags,
        relativePath: url,
    });
    return article.save();
}

// UPDATE 
const updateArticle = async (_id, title, author, publishDate, preview, content, tags=[]) => {
    const newWordCount = content.split(/\s+/).length;
    let readTime = Math.ceil(newWordCount / 200);
    if (readTime === 0) readTime = 1;

    const titles = await articles.find({title: title});
    const urlIdentifier = titles.length + 1;
    let url = title.replace(/\s+/g, '-').toLowerCase();
    if (urlIdentifier > 1) {
        url += `-${urlIdentifier}`;
    }

    const timeNow = Date.now();
    const result = await articles.replaceOne({_id: _id }, {
        title: title,
        author: author,
        publishDate: publishDate || timeNow,
        preview: preview,
        content: content,
        readTime: readTime,
        editDate: timeNow,
        tags: tags,
        relativePath: url
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
        tags: tags,
        relativePath: url
    }
}

// GET ALL
const getArticles = async () => {
    const query = articles.find();
    
    // sort by date descending
    query.sort({publishDate: 'desc'});
    return query.exec();
}

// Get by ID
const getArticleById = async (_id) => {
    const query = articles.findById({_id: _id});
    return query.exec();
}

// Get by relative path
const getArticleByPath = async (path) => {
    const query = articles.findOne({relativePath: path});
    return query.exec();
}

// Get latest
const getLatestArticle = async () => {
    const query = articles.find();
    query.sort({publishDate: 'desc'});
    query.limit(1);
    const result = await query.exec();
    if (result.length > 0) {
        return result[0];
    }
    return null;
}

// Get random
const getRandomArticle = async (exclude) => {
    const result = await articles.aggregate([
        { $match: { _id: { $ne: exclude } } },
        { $sample: { size: 1 } }
    ])

    if (result.length > 0) {
        return result[0];
    }
    return null;
}

// DELETE 
const deleteArticleById = async (_id) => {
    const result = await articles.deleteOne({_id: _id});
    return result.deletedCount;
};

// DELETE ALL
const deleteAllArticles = async () => {
    const result = await articles.deleteMany();
    return result.deletedCount;
};


// EXPORT the variables for use in the controller file.
module.exports = { addArticle, updateArticle, getArticles, getArticleById, getArticleByPath, getLatestArticle, getRandomArticle, deleteArticleById, deleteAllArticles}