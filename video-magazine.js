const { GoogleGenerativeAI } = require('@google/generative-ai');
const youtubeSearch = require('youtube-search-api');
const axios = require('axios');
const cheerio = require('cheerio');
const { translate } = require('@vitalets/google-translate-api');
const youtubeBot = require('./youtube-bot');

class VideoMagazine {
    constructor() {
        this.genAI = null;
        this.model = null;
        // Trusted tech review channels (partial names - case insensitive)
        this.trustedChannels = [
            'mkbhd', 'marques brownlee',
            'unbox therapy', 'linus tech tips',
            'dave2d', 'the verge',
            'mrwhosetheboss', 'austin evans',
            'techradar', 'engadget',
            'cnet', 'techno buffalo',
            'supersaf', 'flossy carter',
            'tech spurt', 'mobile tech review',
            'hardware canucks', 'digital trends',
            'jenna ezarik', 'iJustine'
        ];
        this.initialize();
    }

    initialize() {
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            console.log('✅ Video Magazine AI initialized');
        } else {
            console.warn('⚠️  Gemini API key not configured');
        }
    }

    /**
     * Translate Vietnamese query to English using Gemini
     */
    async translateQueryToEnglish(query) {
        try {
            // Detect if query contains Vietnamese characters
            const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
            
            if (!vietnameseRegex.test(query)) {
                console.log('✅ Query is already in English');
                return query;
            }
            
            console.log(`🌐 Translating Vietnamese query to English: "${query}"`);
            
            const prompt = `Translate this Vietnamese product name/query to English. Return ONLY the English translation, nothing else.

Vietnamese: ${query}

English:`;

            const result = await this.model.generateContent(prompt);
            const englishQuery = result.response.text().trim();
            
            console.log(`✅ Translated to: "${englishQuery}"`);
            return englishQuery;
            
        } catch (error) {
            console.error('Translation error:', error.message);
            return query; // Return original if translation fails
        }
    }

    /**
     * Search YouTube for beautiful tech videos
     */
    async searchBeautifulTechVideos(query, limit = 5) {
        try {
            // Translate Vietnamese to English first
            const englishQuery = await this.translateQueryToEnglish(query);
            
            console.log(`🎬 Searching YouTube for: ${englishQuery} (English only)`);
            
            // Enhance query with beauty keywords + English language
            const enhancedQuery = `${englishQuery} review unboxing english`;
            
            const results = await youtubeSearch.GetListByKeyword(enhancedQuery, false, limit);
            
            if (!results.items || results.items.length === 0) {
                console.log('❌ No videos found');
                return [];
            }

            // Filter by trusted channels and sort by view count
            const trustedVideos = results.items
                .filter(v => v.id && v.title && v.channelTitle)
                .filter(v => {
                    const channelLower = v.channelTitle.toLowerCase();
                    return this.trustedChannels.some(trusted => channelLower.includes(trusted));
                });

            // If we have trusted channel videos, use them
            let videosToUse = trustedVideos.length > 0 ? trustedVideos : results.items.filter(v => v.id && v.title);
            
            // Sort by view count
            const sortedVideos = videosToUse.sort((a, b) => {
                const viewsA = this.parseViewCount(a.viewCount);
                const viewsB = this.parseViewCount(b.viewCount);
                return viewsB - viewsA;
            });

            console.log(`✅ Found ${sortedVideos.length} videos (${trustedVideos.length} from trusted channels)`);
            return sortedVideos.slice(0, limit);

        } catch (error) {
            console.error('YouTube search error:', error);
            return [];
        }
    }

    /**
     * Parse view count from text like "1.2M views"
     */
    parseViewCount(viewCountText) {
        if (!viewCountText) return 0;
        const text = viewCountText.toString().toLowerCase();
        const match = text.match(/([\d,.]+)([km]?)/);
        if (!match) return 0;
        
        let num = parseFloat(match[1].replace(/,/g, ''));
        if (match[2] === 'k') num *= 1000;
        if (match[2] === 'm') num *= 1000000;
        return num;
    }

    /**
     * Get video thumbnails (multiple quality levels)
     */
    getVideoThumbnails(videoId) {
        return {
            maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            default: `https://i.ytimg.com/vi/${videoId}/default.jpg`
        };
    }

    /**
     * Fetch REAL comments from hadzy.com API
     */
    async fetchRealCommentsFromHadzy(videoId) {
        try {
            console.log(`📡 Fetching REAL comments from hadzy.com for video: ${videoId}`);
            
            // Hadzy.com API endpoint
            const apiUrl = `https://hadzy.com/api/comments?videoId=${videoId}`;
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && response.data.comments) {
                const comments = response.data.comments.slice(0, 15); // Get top 15
                console.log(`✅ Got ${comments.length} REAL comments from hadzy.com`);
                
                // Format comments
                const formattedComments = comments.map(c => ({
                    text: c.text || c.textDisplay || c.snippet?.topLevelComment?.snippet?.textDisplay || '',
                    author: c.author || c.authorDisplayName || c.snippet?.topLevelComment?.snippet?.authorDisplayName || 'Unknown',
                    sentiment: this.detectSentiment(c.text || c.textDisplay || '')
                }));

                // Translate to Vietnamese
                const translatedComments = await this.translateComments(formattedComments, 'vi');
                return translatedComments;
            }

            console.warn('⚠️  No comments from hadzy.com');
            return [];

        } catch (error) {
            console.error('❌ Hadzy.com fetch error:', error.message);
            return [];
        }
    }

    /**
     * Simple sentiment detection
     */
    async detectSentimentWithDatasets(comments) {
        try {
            const { spawn } = require('child_process');
            const path = require('path');
            
            return new Promise((resolve, reject) => {
                const pythonScript = path.join(__dirname, 'sentiment_analyzer.py');
                const commentsJson = JSON.stringify(comments);
                
                const python = spawn('python', [pythonScript, commentsJson]);
                
                let output = '';
                let errorOutput = '';
                
                python.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                python.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                    console.log(data.toString()); // Show progress
                });
                
                python.on('close', (code) => {
                    if (code !== 0) {
                        console.error('Python error:', errorOutput);
                        reject(new Error('Sentiment analysis failed'));
                        return;
                    }
                    
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('Failed to parse sentiment results'));
                    }
                });
            });
        } catch (error) {
            console.error('Error in dataset sentiment analysis:', error);
            // Fallback to simple detection
            return this.detectSentimentFallback(comments);
        }
    }
    
    detectSentimentFallback(comments) {
        // Fallback simple sentiment detection
        const results = comments.map(comment => {
            const text = comment.text.toLowerCase();
            
            const positiveWords = ['tốt', 'hay', 'đẹp', 'xuất sắc', 'tuyệt vời', 'good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best', 'perfect', 'fantastic'];
            const negativeWords = ['tệ', 'xấu', 'kém', 'thất vọng', 'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'disappointing'];
            
            const positiveCount = positiveWords.filter(word => text.includes(word)).length;
            const negativeCount = negativeWords.filter(word => text.includes(word)).length;
            
            let sentiment = 'neutral';
            if (positiveCount > negativeCount) sentiment = 'positive';
            else if (negativeCount > positiveCount) sentiment = 'negative';
            else if (positiveCount > 0 && negativeCount > 0) sentiment = 'mixed';
            
            return {
                ...comment,
                sentiment
            };
        });
        
        const sentiments = results.map(r => r.sentiment);
        const stats = {
            positive: sentiments.filter(s => s === 'positive').length,
            negative: sentiments.filter(s => s === 'negative').length,
            neutral: sentiments.filter(s => s === 'neutral').length,
            mixed: sentiments.filter(s => s === 'mixed').length,
            total: sentiments.length
        };
        
        return { comments: results, stats };
    }
    
    detectSentiment(text) {
        const lowerText = text.toLowerCase();
        
        // Positive keywords
        const positiveWords = ['tốt', 'hay', 'đẹp', 'xuất sắc', 'tuyệt vời', 'good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best', 'perfect', 'fantastic'];
        const negativeWords = ['tệ', 'xấu', 'kém', 'thất vọng', 'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'disappointing'];
        
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        if (positiveCount > 0 && negativeCount > 0) return 'mixed';
        return 'neutral';
    }

    /**
     * Generate fallback comments when API fails
     */
    generateFallbackComments() {
        return [
            { text: 'Sản phẩm này trông rất đẹp!', author: 'User1', sentiment: 'positive' },
            { text: 'Thiết kế tuyệt vời, chất lượng cao', author: 'User2', sentiment: 'positive' },
            { text: 'Giá hơi cao nhưng xứng đáng', author: 'User3', sentiment: 'neutral' },
            { text: 'Màu sắc đẹp, vật liệu tốt', author: 'User4', sentiment: 'positive' },
            { text: 'Không thích lắm, hơi đắt', author: 'User5', sentiment: 'negative' }
        ];
    }

    /**
     * Translate comments using Google Translate API (FREE)
     */
    async translateComments(comments, targetLang = 'vi') {
        if (!comments || comments.length === 0) return [];

        try {
            console.log(`🌐 Translating ${comments.length} comments to ${targetLang} (Google Translate)...`);
            
            const translatedComments = [];
            
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                try {
                    const result = await translate(comment.text, { to: targetLang });
                    translatedComments.push({
                        ...comment,
                        text: result.text,
                        originalText: comment.text // Keep original
                    });
                    
                    // Add delay every 5 translations to avoid rate limiting
                    if ((i + 1) % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (err) {
                    console.warn(`⚠️  Translation failed for comment ${i + 1}: ${err.message}`);
                    // If translation fails, keep original
                    translatedComments.push({
                        ...comment,
                        originalText: comment.text
                    });
                }
            }
            
            console.log(`✅ Comments translated to ${targetLang}`);
            return translatedComments;
            
        } catch (error) {
            console.error('Translation error:', error.message);
            return comments; // Return original if error
        }
    }

    /**
     * TIER 1: Quick keyword-based triage (Cost-saving filter)
     */
    async tier1QuickTriage(comment) {
        const positiveKeywords = ['excellent', 'must-buy', 'best ever', 'love this', 'fantastic', 'great value', 'amazing', 'perfect', 'highly recommend', 'worth it'];
        const negativeKeywords = ['disappointed', 'waste of money', 'terrible', 'awful design', 'scam', 'too expensive', 'worst', 'garbage', 'broken', 'regret'];
        const offTopicKeywords = ['spam', 'subscribe for subscribe', 'check out my channel', 'sub4sub', 'follow me', 'click here'];
        
        const textLower = comment.text.toLowerCase();
        
        // Check for keywords
        for (const keyword of positiveKeywords) {
            if (textLower.includes(keyword)) {
                return { quick_sentiment: 'positive', trigger_keyword: keyword, proceed_to_tier_2: false };
            }
        }
        
        for (const keyword of negativeKeywords) {
            if (textLower.includes(keyword)) {
                return { quick_sentiment: 'negative', trigger_keyword: keyword, proceed_to_tier_2: false };
            }
        }
        
        for (const keyword of offTopicKeywords) {
            if (textLower.includes(keyword)) {
                return { quick_sentiment: 'off_topic', trigger_keyword: keyword, proceed_to_tier_2: false };
            }
        }
        
        // No clear keywords found - needs Tier 2 analysis
        return { quick_sentiment: 'uncertain', trigger_keyword: null, proceed_to_tier_2: true };
    }

    /**
     * TIER 2: Deep Gemini AI analysis (Only for uncertain cases)
     */
    async tier2DeepAnalysis(batch, targetLanguage = 'en') {
        const languageMap = {
            'vi': 'Vietnamese (Tiếng Việt)',
            'en': 'English',
            'zh-CN': 'Chinese (中文)',
            'ja': 'Japanese (日本語)',
            'ko': 'Korean (한국어)',
            'es': 'Spanish (Español)',
            'fr': 'French (Français)',
            'de': 'German (Deutsch)',
            'pt': 'Portuguese (Português)',
            'ru': 'Russian (Русский)'
        };
        
        const targetLangName = languageMap[targetLanguage] || 'English';
        
        const prompt = `[CRITICAL LANGUAGE INSTRUCTION]
**ALL category names MUST be in ${targetLangName.toUpperCase()}**
Language Code: ${targetLanguage}
Target Language: ${targetLangName}

[TASK]
Perform Sentiment Analysis and Categorization on ${batch.length} user comments. Analyze each comment individually.

[OUTPUT_FORMAT_INSTRUCTION]
Output a JSON array with ${batch.length} objects. Each object must have: "sentiment", "category", and "confidence_score".

[SENTIMENT_DEFINITION]
"sentiment" must be one of: POSITIVE, NEGATIVE, NEUTRAL, or MIXED

[CATEGORY_DEFINITION]
"category" identifies the topic in ${targetLangName}: Price, Performance, Battery Life, Design, Sound Quality, Build Quality, Value for Money, or General Experience
**IMPORTANT: Category names MUST be in ${targetLangName}, NOT in English or any other language.**

[CONFIDENCE_SCORE_DEFINITION]
"confidence_score" is 0-100 (integer, no % sign)

[INPUT_COMMENTS]
${batch.map((c, i) => `${i + 1}. ${c.text}`).join('\n')}

[EXPECTED_JSON_OUTPUT]
[
  {"sentiment": "POSITIVE", "category": "Category in ${targetLangName}", "confidence_score": 85},
  {"sentiment": "NEGATIVE", "category": "Category in ${targetLangName}", "confidence_score": 90},
  ...
]

**CRITICAL: All "category" values MUST be in ${targetLangName}. NO English, NO Vietnamese, NO other languages unless ${targetLangName}.**

Output ONLY the JSON array, no markdown, no explanation.`;

        const result = await this.model.generateContent(prompt);
        let responseText = result.response.text().trim();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(responseText);
    }

    /**
     * Generate sentiment analysis from comments using TWO-TIER system
     */
    async generateSentimentAnalysis(comments, targetLanguage = 'vi') {
        if (!comments || comments.length === 0) {
            const noCommentsMsg = {
                'vi': 'Không có bình luận để phân tích',
                'en': 'No comments to analyze',
                'zh-CN': '没有评论可分析',
                'ja': '分析するコメントがありません',
                'ko': '분석할 댓글이 없습니다',
                'es': 'No hay comentarios para analizar',
                'fr': 'Aucun commentaire à analyser',
                'de': 'Keine Kommentare zu analysieren',
                'pt': 'Nenhum comentário para analisar',
                'ru': 'Нет комментариев для анализа'
            };
            
            return {
                overall: 'neutral',
                positive: 0,
                negative: 0,
                neutral: 0,
                summary: noCommentsMsg[targetLanguage] || noCommentsMsg['en'],
                totalComments: 0,
                tier1Count: 0,
                tier2Count: 0
            };
        }

        try {
            console.log(`🤖 TWO-TIER Sentiment Analysis: ${comments.length} comments`);
            
            // TIER 1: Quick triage for all comments
            console.log('⚡ TIER 1: Quick keyword triage...');
            const tier1Results = [];
            const tier2Batch = [];
            
            for (const comment of comments) {
                const triage = await this.tier1QuickTriage(comment);
                
                if (triage.proceed_to_tier_2) {
                    // Uncertain - needs Tier 2
                    tier2Batch.push(comment);
                } else {
                    // Clear sentiment from keywords
                    tier1Results.push({
                        ...comment,
                        sentiment: triage.quick_sentiment,
                        category: 'General Experience',
                        confidence: 95,
                        tier: 1
                    });
                }
            }
            
            console.log(`✅ TIER 1: ${tier1Results.length} clear, ${tier2Batch.length} uncertain`);
            
            // TIER 2: Deep analysis for uncertain comments (batch mode)
            const analyzedComments = [...tier1Results];
            
            if (tier2Batch.length > 0) {
                console.log(`🧠 TIER 2: Deep Gemini analysis for ${tier2Batch.length} uncertain comments...`);
                const batchSize = 20; // Increased from 10 to 20 for faster processing
            
                for (let batchStart = 0; batchStart < tier2Batch.length; batchStart += batchSize) {
                    const batch = tier2Batch.slice(batchStart, batchStart + batchSize);
                
                    try {
                        const analyses = await this.tier2DeepAnalysis(batch, targetLanguage);
                        
                        batch.forEach((comment, index) => {
                            const analysis = analyses[index] || { sentiment: 'NEUTRAL', category: 'General Experience', confidence_score: 50 };
                            analyzedComments.push({
                                ...comment,
                                sentiment: analysis.sentiment.toLowerCase(),
                                category: analysis.category,
                                confidence: analysis.confidence_score,
                                tier: 2
                            });
                        });
                        
                    } catch (error) {
                        console.error(`Error analyzing Tier 2 batch:`, error.message);
                        // Fallback for failed batch
                        batch.forEach(comment => {
                            analyzedComments.push({
                                ...comment,
                                sentiment: this.detectSentiment(comment.text),
                                category: 'General Experience',
                                confidence: 50,
                                tier: 2
                            });
                        });
                    }
                    
                    console.log(`✅ TIER 2 batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(tier2Batch.length / batchSize)}`);
                }
            }
            
            // Calculate overall statistics
            const positive = analyzedComments.filter(c => c.sentiment === 'positive').length;
            const negative = analyzedComments.filter(c => c.sentiment === 'negative').length;
            const neutral = analyzedComments.filter(c => c.sentiment === 'neutral').length;
            const mixed = analyzedComments.filter(c => c.sentiment === 'mixed').length;
            const total = analyzedComments.length;
            
            // Determine overall sentiment
            let overall = 'neutral';
            const maxCount = Math.max(positive, negative, neutral, mixed);
            if (positive === maxCount) overall = 'positive';
            else if (negative === maxCount) overall = 'negative';
            else if (mixed === maxCount) overall = 'mixed';
            
            // Generate summary in target language
            const languageMap = {
                'vi': 'Vietnamese (Tiếng Việt)',
                'en': 'English',
                'zh-CN': 'Chinese (中文)',
                'ja': 'Japanese (日本語)',
                'ko': 'Korean (한국어)',
                'es': 'Spanish (Español)',
                'fr': 'French (Français)',
                'de': 'German (Deutsch)',
                'pt': 'Portuguese (Português)',
                'ru': 'Russian (Русский)'
            };
            
            const targetLangName = languageMap[targetLanguage] || 'English';
            
            const summaryPrompt = `Based on analysis of ${total} comments:
- ${positive} positive comments
- ${negative} negative comments
- ${neutral} neutral comments
- ${mixed} mixed comments

Write a 2-3 sentence summary in ${targetLangName} about the general user feedback on this tech product. Focus on main trends and highlights.

Return ONLY the summary in ${targetLangName}, no explanation.`;

            const summaryResult = await this.model.generateContent(summaryPrompt);
            const summary = summaryResult.response.text().trim();
            
            // Update original comments array
            comments.splice(0, comments.length, ...analyzedComments);
            
            console.log(`📊 Sentiment: ${positive} positive, ${negative} negative, ${neutral} neutral, ${mixed} mixed`);
            console.log(`💰 Cost Savings: ${tier1Results.length} via Tier 1 (free), ${tier2Batch.length} via Tier 2 (Gemini)`);
            
            return {
                overall,
                positive: Math.round((positive / total) * 100),
                negative: Math.round((negative / total) * 100),
                neutral: Math.round((neutral / total) * 100),
                mixed: Math.round((mixed / total) * 100),
                summary,
                totalComments: total,
                tier1Count: tier1Results.length,
                tier2Count: tier2Batch.length
            };

        } catch (error) {
            console.error('❌ Sentiment analysis failed:', error.message);
            throw new Error('⏳ Still analyzing comments... AI tool is running. Please wait.');
        }
    }

    /**
     * Generate complete magazine article from YouTube video
     */
    async generateArticleFromVideo(query, targetLanguage = 'vi') {
        if (!this.model) {
            throw new Error('AI not initialized');
        }

        try {
            console.log(`\n📰 Creating magazine article for: ${query} (Language: ${targetLanguage})`);

            // Step 1: Search for 10 videos sorted by views
            const videos = await this.searchBeautifulTechVideos(query, 10);
            if (videos.length === 0) {
                throw new Error('No videos found');
            }

            console.log(`📊 Found ${videos.length} videos, sorted by views`);
            
            // Return all videos for gallery
            const videoGallery = videos.map(v => ({
                id: v.id,
                title: v.title,
                channelTitle: v.channelTitle,
                viewCount: v.viewCount,
                thumbnail: v.thumbnail,
                url: `https://www.youtube.com/watch?v=${v.id}`
            }));

            // Step 2: Get real comments using Python tool - try multiple videos if needed
            console.log('🐍 Getting comments with YouTube Comment Downloader (Python)...');
            let comments = null;
            let selectedVideoIndex = 0;
            
            // Try up to 3 videos to find one with comments
            while (!comments && selectedVideoIndex < Math.min(3, videos.length)) {
                const currentVideo = videos[selectedVideoIndex];
                const currentVideoId = currentVideo.id;
                
                console.log(`📥 Trying video ${selectedVideoIndex + 1}: ${currentVideo.title}`);
                const downloadedComments = await youtubeBot.getComments(currentVideoId, 100); // Increased to 100
                
                if (downloadedComments && downloadedComments.length > 0) {
                    console.log(`✅ Downloaded ${downloadedComments.length} REAL comments from video ${selectedVideoIndex + 1}!`);
                    
                    // Sort by likes (highest first) to get most valuable comments
                    downloadedComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                    console.log(`🔝 Top comment has ${downloadedComments[0].likes || 0} likes`);
                    
                    // FAST PATH: Return comments immediately without sentiment analysis
                    // Sentiment analysis will run in background (Phase 2)
                    comments = downloadedComments.map(comment => ({
                        text: comment.text,
                        author: comment.author,
                        likes: comment.likes || 0,
                        sentiment: 'analyzing', // Placeholder
                        originalText: comment.text
                    }));
                    
                    console.log(`⚡ FAST PATH: Returning ${comments.length} comments immediately (sentiment analysis will run in background)`);
                    
                    // Update to use this video as main video
                    if (selectedVideoIndex > 0) {
                        videoGallery[0] = videoGallery[selectedVideoIndex];
                        videoGallery[selectedVideoIndex] = videos[0];
                        console.log(`✅ Switched to video ${selectedVideoIndex + 1} as main video`);
                    }
                    
                    // NO AUTO-TRANSLATION! Keep original comments
                    // User can translate on-demand with translate buttons
                    break;
                } else {
                    console.log(`⚠️  Video ${selectedVideoIndex + 1} has no comments, trying next...`);
                    selectedVideoIndex++;
                }
            }
            
            // If still no comments after trying 3 videos, throw error
            if (!comments) {
                throw new Error('⏳ Still loading comments... Tool is running. Please wait or try another product.');
            }
            
            // Update video info to the one with comments
            const topVideo = videoGallery[0];
            const videoId = topVideo.id;
            const videoTitle = topVideo.title;
            const videoUrl = topVideo.url;
            const thumbnails = this.getVideoThumbnails(videoId);
            
            // Step 3: Return placeholder sentiment (will be updated in Phase 2)
            const sentiment = {
                overall: 'analyzing',
                positive: 0,
                negative: 0,
                neutral: 0,
                mixed: 0,
                summary: 'Sentiment analysis in progress...',
                totalComments: comments.length,
                analyzing: true
            };

            // Step 4: Generate professional editorial in target language
            const languageMap = {
                'vi': 'Vietnamese (Tiếng Việt)',
                'en': 'English',
                'zh-CN': 'Chinese (中文)',
                'ja': 'Japanese (日本語)',
                'ko': 'Korean (한국어)',
                'es': 'Spanish (Español)',
                'fr': 'French (Français)',
                'de': 'German (Deutsch)',
                'pt': 'Portuguese (Português)',
                'ru': 'Russian (Русский)'
            };
            
            const targetLangName = languageMap[targetLanguage] || 'English';
            
            const editorialPrompt = `[CRITICAL LANGUAGE INSTRUCTION]
**YOU MUST WRITE EVERYTHING IN ${targetLangName.toUpperCase()}**
Language Code: ${targetLanguage}
Target Language: ${targetLangName}

DO NOT use Vietnamese, Chinese, or any other language. ONLY use ${targetLangName}.

[Role/Persona]
You are a professional tech journalist with sharp analysis and market understanding. Your writing must be **Refined, Fact-based, and Logically Cold**, focusing on **core value** and **ROI (Return on Investment)** for busy readers. Avoid flowery language, empty emotions, or exaggeration.

[Task Objective]
Write an Editorial analyzing the product "${query}" with the main goal of helping readers decide whether to buy/upgrade this product.

[Structure & Length Requirements]
1. **Length:** Maximum 550 words (equivalent to 3 minutes reading)
2. **Structure:** Must have Introduction, 3 Body Paragraphs, and Conclusion
3. **Title:** Concise, direct, action-oriented

[Style & Content Requirements]
1. **Market Context:** Analysis must be based on real market conditions
2. **Focus on Core Value:** Analysis must focus on **opportunity cost**, **marginal benefit**, and **bottlenecks** of the product
3. **Language:** Concise, powerful, direct. Avoid redundant adverbs or emotional adjectives
4. **Credibility:** Use at least 2 internal citations (e.g., "[According to Counterpoint Research]") to increase credibility

[Specific Information]
* **Product:** ${query}
* **Reference Video:** ${videoTitle}
* **User Comments:** ${comments.length} real comments from YouTube
* **Sentiment:** ${sentiment.positive}% positive, ${sentiment.negative}% negative

[Output Format]
Return JSON in this format:
{
  "title": "Editorial title in ${targetLangName}",
  "editorial": "Full editorial content in ${targetLangName} (550 words)",
  "tags": ["tag1 in ${targetLangName}", "tag2 in ${targetLangName}", "tag3 in ${targetLangName}", "tag4 in ${targetLangName}", "tag5 in ${targetLangName}"],
  "category": "dep" or "manh" or "re",
  "keyPoints": ["key point 1 in ${targetLangName}", "key point 2 in ${targetLangName}", "key point 3 in ${targetLangName}"]
}

**CRITICAL: EVERY SINGLE WORD in title, editorial, tags, and keyPoints MUST be in ${targetLangName}. NO Vietnamese, NO Chinese, NO other languages. ONLY ${targetLangName}.**

Return ONLY valid JSON, no markdown, no explanation.`;

            const editorialResult = await this.model.generateContent(editorialPrompt);
            let editorialText = editorialResult.response.text().trim();
            
            // Clean JSON response
            editorialText = editorialText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            let editorialData;
            try {
                editorialData = JSON.parse(editorialText);
            } catch (e) {
                console.error('Failed to parse editorial JSON:', e);
                // Fallback with target language
                const fallbackTitles = {
                    'vi': `Đánh Giá ${query}`,
                    'en': `Review: ${query}`,
                    'zh-CN': `评测：${query}`,
                    'ja': `レビュー：${query}`,
                    'ko': `리뷰: ${query}`,
                    'es': `Reseña: ${query}`,
                    'fr': `Critique: ${query}`,
                    'de': `Bewertung: ${query}`,
                    'pt': `Análise: ${query}`,
                    'ru': `Обзор: ${query}`
                };
                const fallbackKeyPoints = {
                    'vi': ['Thiết kế', 'Hiệu năng', 'Giá trị'],
                    'en': ['Design', 'Performance', 'Value'],
                    'zh-CN': ['设计', '性能', '价值'],
                    'ja': ['デザイン', 'パフォーマンス', '価値'],
                    'ko': ['디자인', '성능', '가치'],
                    'es': ['Diseño', 'Rendimiento', 'Valor'],
                    'fr': ['Design', 'Performance', 'Valeur'],
                    'de': ['Design', 'Leistung', 'Wert'],
                    'pt': ['Design', 'Desempenho', 'Valor'],
                    'ru': ['Дизайн', 'Производительность', 'Ценность']
                };
                editorialData = {
                    title: fallbackTitles[targetLanguage] || fallbackTitles['en'],
                    editorial: editorialText,
                    tags: [query.toLowerCase()],
                    category: 'dep',
                    keyPoints: fallbackKeyPoints[targetLanguage] || fallbackKeyPoints['en']
                };
            }

            // Mark first video with cached language
            videoGallery[0].comments = comments;
            videoGallery[0].sentiment = sentiment;
            videoGallery[0].cachedLanguage = targetLanguage;
            
            // Step 5: Create article with editorial data
            const article = {
                title: editorialData.title || `Đánh Giá ${query}`,
                subtitle: videoTitle,
                videoUrl,
                videoId,
                thumbnails,
                images: [thumbnails.maxres, thumbnails.high, thumbnails.medium],
                editorial: editorialData.editorial,
                tags: editorialData.tags || [query.toLowerCase()],
                category: editorialData.category || 'dep',
                keyPoints: editorialData.keyPoints || [],
                sentiment,
                comments: comments, // All comments (up to 50)
                views: topVideo.viewCount || 'N/A',
                videoGallery, // All 10 videos with first one cached
                source: 'YouTube Analysis',
                generatedAt: new Date().toISOString()
            };

            console.log(`✅ Article created successfully!\n`);
            return article;

        } catch (error) {
            console.error('Article generation error:', error);
            throw error;
        }
    }

    /**
     * Get comments for a specific video (FAST PATH - returns immediately, deep analysis in background)
     */
    async getCommentsForVideo(videoId, targetLanguage = 'vi', runDeepAnalysis = true) {
        try {
            console.log(`🐍 Getting comments for video: ${videoId} (Language: ${targetLanguage})`);
            const downloadedComments = await youtubeBot.getComments(videoId, 50); // Increased to 50
            
            if (downloadedComments && downloadedComments.length > 0) {
                console.log(`✅ Downloaded ${downloadedComments.length} comments`);
                
                // Sort by likes (highest first) to get most valuable comments
                downloadedComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                console.log(`🔝 Top comment has ${downloadedComments[0].likes || 0} likes`);
                
                // FAST PATH: Return comments immediately without deep sentiment analysis
                const comments = downloadedComments.map(comment => ({
                    text: comment.text,
                    author: comment.author,
                    likes: comment.likes || 0,
                    sentiment: 'analyzing', // Placeholder
                    originalText: comment.text
                }));
                
                console.log(`⚡ FAST PATH: Returning ${comments.length} comments for background video`);
                
                // Placeholder sentiment (will be updated by background analysis)
                const placeholderSentiment = {
                    overall: 'analyzing',
                    positive: 0,
                    negative: 0,
                    neutral: 0,
                    mixed: 0,
                    summary: 'Sentiment analysis in progress...',
                    totalComments: comments.length,
                    analyzing: true
                };
                
                // Run deep analysis in background if requested
                if (runDeepAnalysis) {
                    // Don't await - let it run in background
                    this.runSentimentAnalysisInBackground(comments, targetLanguage, (progress) => {
                        console.log(`📊 Background video ${videoId}: ${progress.status} - ${progress.progress}%`);
                    }).then(sentiment => {
                        console.log(`✅ Background sentiment complete for video ${videoId}`);
                        // Update comments with real sentiment
                        comments.forEach((comment, index) => {
                            if (sentiment.comments && sentiment.comments[index]) {
                                comment.sentiment = sentiment.comments[index].sentiment;
                                comment.category = sentiment.comments[index].category;
                                comment.confidence = sentiment.comments[index].confidence;
                            }
                        });
                    }).catch(error => {
                        console.error(`❌ Background sentiment failed for video ${videoId}:`, error.message);
                    });
                }
                
                return { comments, sentiment: placeholderSentiment };
            } else {
                console.log('ℹ️  No comments found');
                return { 
                    comments: [], 
                    sentiment: {
                        overall: 'neutral',
                        positive: 0,
                        negative: 0,
                        neutral: 0,
                        mixed: 0,
                        summary: 'No comments available',
                        totalComments: 0
                    }
                };
            }
        } catch (error) {
            console.error('Error getting comments:', error);
            throw error;
        }
    }

    /**
     * PHASE 2: Run sentiment analysis in background
     * This is called after article is displayed to user
     */
    async runSentimentAnalysisInBackground(comments, targetLanguage = 'vi', progressCallback = null) {
        try {
            console.log(`\n🔄 PHASE 2: Starting background sentiment analysis for ${comments.length} comments...`);
            
            const startTime = Date.now();
            
            // Estimate time: ~2 seconds per batch of 20
            const estimatedBatches = Math.ceil(comments.length / 20);
            const estimatedSeconds = estimatedBatches * 2;
            
            if (progressCallback) {
                progressCallback({
                    status: 'analyzing',
                    progress: 0,
                    eta: estimatedSeconds,
                    message: `Analyzing ${comments.length} comments...`
                });
            }
            
            // Run full sentiment analysis
            const sentiment = await this.generateSentimentAnalysis(comments, targetLanguage);
            
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`✅ PHASE 2 complete in ${elapsed}s`);
            
            if (progressCallback) {
                progressCallback({
                    status: 'complete',
                    progress: 100,
                    sentiment,
                    message: 'Analysis complete!'
                });
            }
            
            return sentiment;
            
        } catch (error) {
            console.error('❌ Background sentiment analysis failed:', error);
            if (progressCallback) {
                progressCallback({
                    status: 'error',
                    progress: 0,
                    error: error.message
                });
            }
            throw error;
        }
    }
}

module.exports = new VideoMagazine();
