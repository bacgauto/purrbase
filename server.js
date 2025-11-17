require('dotenv').config();
const express = require('express');
const path = require('path');
const videoMagazine = require('./video-magazine');
const db = require('./database');
const jobManager = require('./job-manager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve magazine as default BEFORE static middleware
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'magazine.html'));
});

// Static files (after route handlers)
app.use(express.static('public'));

// API Routes
app.post('/api/generate-article', async (req, res) => {
    try {
        const { query, language } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(`\n📰 Generating video-based article for: ${query} (Language: ${language || 'vi'})`);
        console.log('🤖 Bot will automatically scrape real comments from YouTube');
        const article = await videoMagazine.generateArticleFromVideo(query, language || 'vi');
        
        console.log(`✅ Article sent to client\n`);
        res.json({ success: true, article });
    } catch (error) {
        console.error('❌ Error generating article:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ 
            error: 'Failed to generate article',
            details: error.message 
        });
    }
});

// OPTIMIZED: Async article generation with job tracking
app.post('/api/generate-article-async', async (req, res) => {
    try {
        const { query, language } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Create job
        const jobId = jobManager.createJob(query, language || 'vi');
        
        // Return job ID immediately
        res.json({ success: true, jobId });
        
        // Start background processing (non-blocking)
        processArticleJobAsync(jobId, query, language || 'vi');
        
    } catch (error) {
        console.error('❌ Error creating job:', error.message);
        res.status(500).json({ error: 'Failed to create job', details: error.message });
    }
});

// Get job status
app.get('/api/job-status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobManager.getJob(jobId);
    
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({
        success: true,
        status: job.status,
        progress: job.progress,
        phase: job.phase,
        article: job.article,
        error: job.error
    });
});

// Pause job (when user closes window)
app.post('/api/pause-job/:jobId', (req, res) => {
    const { jobId } = req.params;
    jobManager.pauseJob(jobId);
    res.json({ success: true });
});

// Resume job
app.post('/api/resume-job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const resumed = jobManager.resumeJob(jobId);
    
    if (resumed) {
        // Continue processing
        const job = jobManager.getJob(jobId);
        processArticleJobAsync(jobId, job.query, job.language);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Cannot resume job' });
    }
});

// Cancel job
app.delete('/api/cancel-job/:jobId', (req, res) => {
    const { jobId } = req.params;
    jobManager.cancelJob(jobId);
    res.json({ success: true });
});

// Translate full article endpoint
app.post('/api/translate-article', async (req, res) => {
    try {
        const { article, targetLanguage } = req.body;
        
        if (!article || !targetLanguage) {
            return res.status(400).json({ error: 'Missing article or targetLanguage' });
        }
        
        console.log(`🌐 Translating article to ${targetLanguage}: "${article.title}"`);
        
        const { translate: googleTranslate } = require('@vitalets/google-translate-api');
        
        const translated = {
            title: article.title,
            subtitle: article.subtitle,
            editorial: article.editorial,
            comments: article.comments || [],
            tags: article.tags || [],
            keyPoints: article.keyPoints || []
        };
        
        // Translate title
        if (article.title) {
            try {
                const titleResult = await googleTranslate(article.title, { to: targetLanguage });
                translated.title = titleResult.text;
                console.log(`  ✅ Title translated`);
            } catch (err) {
                console.error(`  ❌ Title translation failed:`, err.message);
            }
        }
        
        // Translate subtitle
        if (article.subtitle) {
            try {
                const subtitleResult = await googleTranslate(article.subtitle, { to: targetLanguage });
                translated.subtitle = subtitleResult.text;
                console.log(`  ✅ Subtitle translated`);
            } catch (err) {
                console.error(`  ❌ Subtitle translation failed:`, err.message);
            }
        }
        
        // Translate editorial
        if (article.editorial) {
            try {
                const editorialResult = await googleTranslate(article.editorial, { to: targetLanguage });
                translated.editorial = editorialResult.text;
                console.log(`  ✅ Editorial translated`);
            } catch (err) {
                console.error(`  ❌ Editorial translation failed:`, err.message);
            }
        }
        
        // Translate comments
        if (article.comments && article.comments.length > 0) {
            try {
                translated.comments = await videoMagazine.translateComments(article.comments, targetLanguage);
                console.log(`  ✅ ${article.comments.length} comments translated`);
            } catch (err) {
                console.error(`  ❌ Comments translation failed:`, err.message);
            }
        }
        
        // Translate tags
        if (article.tags && article.tags.length > 0) {
            try {
                translated.tags = await Promise.all(
                    article.tags.map(async (tag) => {
                        try {
                            const result = await googleTranslate(tag, { to: targetLanguage });
                            return result.text;
                        } catch {
                            return tag;
                        }
                    })
                );
                console.log(`  ✅ ${article.tags.length} tags translated`);
            } catch (err) {
                console.error(`  ❌ Tags translation failed:`, err.message);
            }
        }
        
        // Translate key points
        if (article.keyPoints && article.keyPoints.length > 0) {
            try {
                translated.keyPoints = await Promise.all(
                    article.keyPoints.map(async (point) => {
                        try {
                            const result = await googleTranslate(point, { to: targetLanguage });
                            return result.text;
                        } catch {
                            return point;
                        }
                    })
                );
                console.log(`  ✅ ${article.keyPoints.length} key points translated`);
            } catch (err) {
                console.error(`  ❌ Key points translation failed:`, err.message);
            }
        }
        
        console.log(`✅ Article translation complete`);
        res.json({ success: true, translated });
    } catch (error) {
        console.error('❌ Translation error:', error);
        res.status(500).json({ error: 'Translation failed', details: error.message });
    }
});

// New endpoint: Get comments for specific video
app.post('/api/get-video-comments', async (req, res) => {
    try {
        const { videoId, language } = req.body;
        const lang = language || 'vi';
        
        console.log(`\n💬 Fetching comments for video: ${videoId} (Language: ${lang})`);
        
        // Check cache first
        const cached = db.getCachedComments(videoId, lang);
        if (cached) {
            console.log(`✅ Using cached comments from database`);
            return res.json({ success: true, comments: cached });
        }
        
        // Fetch new comments (returns immediately with placeholder sentiment)
        const result = await videoMagazine.getCommentsForVideo(videoId, lang, true);
        
        // Cache immediately with placeholder (will be updated by background analysis)
        db.cacheVideoComments(videoId, lang, result.comments, result.sentiment);
        
        // Return immediately
        res.json({ success: true, comments: result });
        
        // Background analysis will update the comments in-place
        // After analysis completes, update cache
        setTimeout(async () => {
            try {
                // Wait for background analysis to complete (max 30 seconds)
                for (let i = 0; i < 30; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check if analysis is done (sentiment is no longer 'analyzing')
                    if (result.comments.length > 0 && result.comments[0].sentiment !== 'analyzing') {
                        console.log(`✅ Background analysis complete for ${videoId}, updating cache...`);
                        
                        // Recalculate sentiment from updated comments
                        const positive = result.comments.filter(c => c.sentiment === 'positive').length;
                        const negative = result.comments.filter(c => c.sentiment === 'negative').length;
                        const neutral = result.comments.filter(c => c.sentiment === 'neutral').length;
                        const mixed = result.comments.filter(c => c.sentiment === 'mixed').length;
                        const total = result.comments.length;
                        
                        const updatedSentiment = {
                            overall: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
                            positive: Math.round((positive / total) * 100),
                            negative: Math.round((negative / total) * 100),
                            neutral: Math.round((neutral / total) * 100),
                            mixed: Math.round((mixed / total) * 100),
                            summary: `Analysis complete: ${positive} positive, ${negative} negative, ${neutral} neutral`,
                            totalComments: total,
                            analyzing: false
                        };
                        
                        // Update cache with real sentiment
                        db.cacheVideoComments(videoId, lang, result.comments, updatedSentiment);
                        console.log(`💾 Cache updated for video ${videoId}`);
                        break;
                    }
                }
            } catch (error) {
                console.error(`❌ Error updating cache for ${videoId}:`, error.message);
            }
        }, 0);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Database endpoints
app.get('/api/articles', (req, res) => {
    try {
        const articles = db.getAllArticles();
        res.json({ success: true, articles });
    } catch (error) {
        console.error('Error getting articles:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/articles', (req, res) => {
    try {
        const { article } = req.body;
        db.saveArticle(article);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving article:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/articles/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        db.deleteArticle(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: error.message });
    }
});

// Translate single text endpoint
app.post('/api/translate-text', async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        
        if (!text || !targetLanguage) {
            return res.status(400).json({ error: 'Missing text or targetLanguage' });
        }
        
        const { translate: googleTranslate } = require('@vitalets/google-translate-api');
        const result = await googleTranslate(text, { to: targetLanguage });
        
        res.json({ success: true, translated: result.text });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed', details: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        geminiReady: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    });
});

// OPTIMIZED: Two-phase async article processing
async function processArticleJobAsync(jobId, query, language) {
    try {
        jobManager.updateProgress(jobId, 10, 'running');
        
        console.log(`\n🚀 [Job ${jobId}] Starting TWO-PHASE processing for: ${query}`);
        
        // PHASE 1: Generate article with raw comments (FAST!)
        jobManager.updateProgress(jobId, 30, 'generating_article');
        const article = await videoMagazine.generateArticleFromVideo(query, language);
        
        // Mark Phase 1 complete (progress 50%, article ready for display)
        jobManager.completePhase1(jobId, article.videoGallery, article);
        jobManager.updateProgress(jobId, 50, 'phase1_complete');
        
        console.log(`✅ [Job ${jobId}] Phase 1 complete - Article ready!`);
        
        // PHASE 2: Wait a bit for frontend to poll and see phase1_complete status
        // Then run sentiment analysis in SEPARATE async process (non-blocking!)
        setTimeout(() => {
            console.log(`🔄 [Job ${jobId}] Starting Phase 2 in background...`);
            processPhase2InBackground(jobId, article, language);
        }, 3000); // Wait 3 seconds for frontend to poll
        
    } catch (error) {
        console.error(`❌ [Job ${jobId}] Error:`, error.message);
        jobManager.updateJob(jobId, {
            status: 'error',
            error: error.message
        });
    }
}

// PHASE 2: Separate async function that runs in background
async function processPhase2InBackground(jobId, article, language) {
    try {
        console.log(`🧠 [Job ${jobId}] Phase 2 starting...`);
        jobManager.updateProgress(jobId, 60, 'analyzing_sentiment');
        
        const sentiment = await videoMagazine.runSentimentAnalysisInBackground(
            article.comments,
            language,
            (progress) => {
                // Update job progress
                const progressPercent = 60 + (progress.progress * 0.4); // 60-100%
                jobManager.updateProgress(jobId, progressPercent, `sentiment_${progress.status}`);
                
                if (progress.eta) {
                    console.log(`⏱️  [Job ${jobId}] ETA: ${progress.eta}s`);
                }
            }
        );
        
        // Update article with real sentiment
        article.sentiment = sentiment;
        article.comments = article.comments.map((comment, index) => ({
            ...comment,
            sentiment: sentiment.comments?.[index]?.sentiment || comment.sentiment,
            category: sentiment.comments?.[index]?.category || 'General',
            confidence: sentiment.comments?.[index]?.confidence || 50
        }));
        
        jobManager.updateProgress(jobId, 100, 'complete');
        jobManager.updateJob(jobId, { 
            status: 'complete',
            article 
        });
        
        console.log(`✅ [Job ${jobId}] Phase 2 complete - Sentiment analysis done!`);
        
    } catch (error) {
        console.error(`❌ [Job ${jobId}] Phase 2 error:`, error.message);
        jobManager.updateJob(jobId, {
            status: 'error',
            error: error.message
        });
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`\n🌸 Beauty Tech Magazine`);
    console.log(`📰 Server running on http://localhost:${PORT}`);
    console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Ready' : '❌ Not configured'}`);
    console.log(`⚡ Job Manager: Ready for parallel processing\n`);
});
