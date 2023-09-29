
const mongoose = require('mongoose');

// SCHEMA for the blog model.
const articleSchema = mongoose.Schema({
	title:          { type: String, required: true },
  publishDate:    { type: Date,   required: true },
  editDate:       { type: Date,   required: true },
  preview:        { type: String, required: true},
  content:        { type: String, required: true },
  tags:           { type: [String], required: true, set: tags => [...new Set(tags)] },
  readTime:       { type: Number, default: 1},
  relativePath:   { type: String, required: true },
  relatedArticles:{ type: [String], required: true },
});


const articles = mongoose.model('Article', articleSchema);

// CREATE 
const addArticle = async (title, publishDate, editDate, preview, content, tags, relatedArticles ) => {
    const wordCount = content.split(/\s+/).length;
    let readTime = Math.ceil(wordCount / 200);
    if (readTime === 0) readTime = 1;

    let url = title.replace(/\s+/g, '-').toLowerCase();
    
    const article = new articles({ 
        title: title,
        publishDate: publishDate,
        editDate: editDate,
        preview: preview,
        content: content,
        tags: tags,
        readTime: readTime,
        relativePath: url,
        relatedArticles: relatedArticles
    });
    return article.save();
}

// UPDATE 
const updateArticle = async (title, new_title, publishDate, editDate, preview, content, tags, relatedArticles) => {
    const newWordCount = content.split(/\s+/).length;
    let readTime = Math.ceil(newWordCount / 200);
    if (readTime === 0) readTime = 1;

    let url = title.replace(/\s+/g, '-').toLowerCase();

    const result = await articles.replaceOne({title: title}, {
        title: new_title,
        publishDate: publishDate,
        editDate: editDate,
        preview: preview,
        content: content,
        tags: tags,
        readTime: readTime,
        relativePath: url,
        relatedArticles: relatedArticles
    });
    return { 
        title: title,
        publishDate: publishDate,
        editDate: editDate,
        preview: preview,
        content: content,
        tags: tags,
        readTime: readTime,
        relativePath: url,
        relatedArticles: relatedArticles
    }
}

// GET ALL
const getArticles = async () => {
    const query = articles.find();
    
    // sort by date descending
    query.sort({publishDate: 'desc'});
    return query.exec();
}

// Get by title
const getArticleByTitle = async (title) => {
  query = articles.findOne({title: title});
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

// Get recommended article
const getRecommendedArticles = async (currentRelativePath) => {
  const mainArticle = await articles.findOne({relativePath: currentRelativePath}).exec();

  if (!mainArticle) {
    return [];
  }

  const relatedArticleTitles = mainArticle.relatedArticles;
  const relatedArticleQueries = relatedArticleTitles.map(title => articles.findOne({ title }).exec());

  return Promise.all(relatedArticleQueries);
}

// DELETE 
const deleteArticleById = async (_id) => {
    const result = await articles.deleteOne({_id: _id});
    return result.deletedCount;
};

// DELETE by title
const deleteArticleTitle = async (title) => {
    const result = await articles.deleteOne({title: title});
    return result.deletedCount;
};

// DELETE ALL
const deleteAllArticles = async () => {
    const result = await articles.deleteMany();
    return result.deletedCount;
};


// EXPORT the variables for use in the controller file.
module.exports = { addArticle, updateArticle, getArticles, getArticleByTitle, getArticleByPath, getLatestArticle, getRecommendedArticles, deleteArticleById, deleteArticleTitle, deleteAllArticles}
