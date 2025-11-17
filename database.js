const Database = require('better-sqlite3');
const path = require('path');

class ArticleDatabase {
    constructor() {
        const dbPath = path.join(__dirname, 'articles.db');
        this.db = new Database(dbPath);
        this.initTables();
        console.log('✅ Database initialized:', dbPath);
    }

    initTables() {
        // Articles table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                editorial TEXT,
                category TEXT,
                language TEXT,
                videoId TEXT,
                videoUrl TEXT,
                thumbnails TEXT,
                tags TEXT,
                keyPoints TEXT,
                sentiment TEXT,
                comments TEXT,
                views TEXT,
                videoGallery TEXT,
                source TEXT,
                createdAt TEXT,
                generatedAt TEXT
            )
        `);

        // Video comments cache table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS video_comments (
                videoId TEXT NOT NULL,
                language TEXT NOT NULL,
                comments TEXT,
                sentiment TEXT,
                cachedAt TEXT,
                PRIMARY KEY (videoId, language)
            )
        `);

        console.log('✅ Database tables ready');
    }

    // Save article
    saveArticle(article) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO articles 
            (id, title, subtitle, editorial, category, language, videoId, videoUrl, 
             thumbnails, tags, keyPoints, sentiment, comments, views, videoGallery, 
             source, createdAt, generatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            article.id,
            article.title,
            article.subtitle,
            article.editorial,
            article.category,
            article.language,
            article.videoId,
            article.videoUrl,
            JSON.stringify(article.thumbnails),
            JSON.stringify(article.tags),
            JSON.stringify(article.keyPoints),
            JSON.stringify(article.sentiment),
            JSON.stringify(article.comments),
            article.views,
            JSON.stringify(article.videoGallery),
            article.source,
            article.createdAt,
            article.generatedAt
        );

        console.log(`✅ Article saved to DB: ${article.id}`);
    }

    // Get all articles
    getAllArticles() {
        const stmt = this.db.prepare('SELECT * FROM articles ORDER BY createdAt DESC');
        const rows = stmt.all();
        
        return rows.map(row => ({
            ...row,
            thumbnails: JSON.parse(row.thumbnails),
            tags: JSON.parse(row.tags),
            keyPoints: JSON.parse(row.keyPoints),
            sentiment: JSON.parse(row.sentiment),
            comments: JSON.parse(row.comments),
            videoGallery: JSON.parse(row.videoGallery)
        }));
    }

    // Get article by ID
    getArticleById(id) {
        const stmt = this.db.prepare('SELECT * FROM articles WHERE id = ?');
        const row = stmt.get(id);
        
        if (!row) return null;
        
        return {
            ...row,
            thumbnails: JSON.parse(row.thumbnails),
            tags: JSON.parse(row.tags),
            keyPoints: JSON.parse(row.keyPoints),
            sentiment: JSON.parse(row.sentiment),
            comments: JSON.parse(row.comments),
            videoGallery: JSON.parse(row.videoGallery)
        };
    }

    // Delete article
    deleteArticle(id) {
        const stmt = this.db.prepare('DELETE FROM articles WHERE id = ?');
        stmt.run(id);
        console.log(`✅ Article deleted from DB: ${id}`);
    }

    // Cache video comments
    cacheVideoComments(videoId, language, comments, sentiment) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO video_comments 
            (videoId, language, comments, sentiment, cachedAt)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            videoId,
            language,
            JSON.stringify(comments),
            JSON.stringify(sentiment),
            new Date().toISOString()
        );

        console.log(`✅ Comments cached for video ${videoId} (${language})`);
    }

    // Get cached comments
    getCachedComments(videoId, language) {
        const stmt = this.db.prepare(`
            SELECT * FROM video_comments 
            WHERE videoId = ? AND language = ?
        `);
        
        const row = stmt.get(videoId, language);
        
        if (!row) return null;
        
        return {
            comments: JSON.parse(row.comments),
            sentiment: JSON.parse(row.sentiment),
            cachedAt: row.cachedAt
        };
    }

    // Clear old cache (older than 7 days)
    clearOldCache() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const stmt = this.db.prepare('DELETE FROM video_comments WHERE cachedAt < ?');
        const result = stmt.run(sevenDaysAgo);
        console.log(`✅ Cleared ${result.changes} old cache entries`);
    }

    close() {
        this.db.close();
    }
}

module.exports = new ArticleDatabase();
