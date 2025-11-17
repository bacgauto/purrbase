// Magazine App
let articles = [];
let currentCategory = 'all';
let selectedCategory = 'dep';
let currentArticle = null;
let currentVideoIndex = 0;
let currentLanguage = localStorage.getItem('language') || 'vi';
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Load articles from database on startup
async function loadArticlesFromDB() {
    try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        if (data.success) {
            articles = data.articles;
            console.log(`✅ Loaded ${articles.length} articles from database`);
        }
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

// UI Translations
const uiTranslations = {
    vi: {
        all: 'Tất cả',
        dep: 'Đẹp',
        manh: 'Mạnh',
        re: 'Rẻ',
        createArticle: '+ Tạo Bài Viết',
        noArticles: 'Chưa có bài viết nào',
        createFirst: '+ Tạo Bài Viết Đầu Tiên',
        createNew: 'Tạo Bài Viết Mới',
        productName: 'Tên sản phẩm',
        enterProduct: 'Nhập tên sản phẩm...',
        category: 'Danh mục',
        generate: 'Tạo Bài Viết',
        loading: 'Đang tạo bài viết...',
        noComments: 'Chưa có bình luận',
        videos: 'videos',
        comments: 'comments',
        commentsAbout: 'Bình luận nói gì về sản phẩm',
        videoReviews: 'Video Reviews',
        keyPoints: 'Điểm chính',
        sentimentAnalysis: 'Phân Tích Cảm Xúc',
        positive: 'Tích cực',
        negative: 'Tiêu cực',
        neutral: 'Trung lập',
        mixed: 'Hỗn hợp',
        commentsAnalyzed: 'bình luận được phân tích',
        translateComment: 'Dịch',
        translateAll: 'Dịch tất cả',
        showOriginal: 'Bản gốc',
        emotionFeedback: 'Bạn có cảm xúc như thế nào? Muốn nói rõ ra không? Tại sao mua không mua?',
        welcomeTitle: 'Chào mừng đến với MỸ MÈO Tech Magazine',
        welcomeSubtitle: 'Đánh giá sản phẩm bằng AI từ bình luận YouTube thực tế',
        errorCreating: 'Không thể tạo bài viết',
        loadingVideo: 'Đang tải video'
    },
    en: {
        all: 'All',
        dep: 'Beautiful',
        manh: 'Powerful',
        re: 'Affordable',
        createArticle: '+ Create Article',
        noArticles: 'No articles yet',
        createFirst: '+ Create First Article',
        createNew: 'Create New Article',
        productName: 'Product Name',
        enterProduct: 'Enter product name...',
        category: 'Category',
        generate: 'Generate Article',
        loading: 'Generating article...',
        noComments: 'No comments',
        videos: 'videos',
        comments: 'comments',
        commentsAbout: 'What Comments Say About the Product',
        videoReviews: 'Video Reviews',
        keyPoints: 'Key Points',
        sentimentAnalysis: 'Sentiment Analysis',
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral',
        mixed: 'Mixed',
        commentsAnalyzed: 'comments analyzed',
        translateComment: 'Translate',
        translateAll: 'Translate All',
        showOriginal: 'Show Original',
        emotionFeedback: 'How do you feel? Want to share? Why buy or not buy?',
        welcomeTitle: 'Welcome to MỸ MÈO Tech Magazine',
        welcomeSubtitle: 'AI-Powered Product Reviews from Real YouTube Comments',
        errorCreating: 'Cannot create article',
        loadingVideo: 'Loading video'
    },
    'zh-CN': {
        all: '全部',
        dep: '美观',
        manh: '强大',
        re: '实惠',
        createArticle: '+ 创建文章',
        noArticles: '暂无文章',
        createFirst: '+ 创建第一篇文章',
        createNew: '创建新文章',
        productName: '产品名称',
        enterProduct: '输入产品名称...',
        category: '类别',
        generate: '生成文章',
        loading: '正在生成文章...',
        noComments: '暂无评论',
        videos: '视频',
        comments: '评论',
        commentsAbout: '评论对产品的看法',
        videoReviews: '视频评测',
        keyPoints: '要点'
    },
    ja: {
        all: 'すべて',
        dep: '美しい',
        manh: '強力',
        re: '手頃',
        createArticle: '+ 記事を作成',
        noArticles: '記事がありません',
        createFirst: '+ 最初の記事を作成',
        createNew: '新しい記事を作成',
        productName: '製品名',
        enterProduct: '製品名を入力...',
        category: 'カテゴリー',
        generate: '記事を生成',
        loading: '記事を生成中...',
        noComments: 'コメントなし',
        videos: '動画',
        comments: 'コメント',
        commentsAbout: '製品についてのコメント',
        videoReviews: 'ビデオレビュー',
        keyPoints: 'ポイント'
    },
    ko: {
        all: '전체',
        dep: '아름다운',
        manh: '강력한',
        re: '저렴한',
        createArticle: '+ 기사 작성',
        noArticles: '기사가 없습니다',
        createFirst: '+ 첫 기사 작성',
        createNew: '새 기사 작성',
        productName: '제품명',
        enterProduct: '제품명 입력...',
        category: '카테고리',
        generate: '기사 생성',
        loading: '기사 생성 중...',
        noComments: '댓글 없음',
        videos: '동영상',
        comments: '댓글',
        commentsAbout: '제품에 대한 댓글',
        videoReviews: '비디오 리뷰',
        keyPoints: '주요 포인트'
    },
    es: {
        all: 'Todo',
        dep: 'Hermoso',
        manh: 'Potente',
        re: 'Asequible',
        createArticle: '+ Crear Artículo',
        noArticles: 'No hay artículos',
        createFirst: '+ Crear Primer Artículo',
        createNew: 'Crear Nuevo Artículo',
        productName: 'Nombre del Producto',
        enterProduct: 'Ingrese nombre del producto...',
        category: 'Categoría',
        generate: 'Generar Artículo',
        loading: 'Generando artículo...',
        noComments: 'Sin comentarios',
        videos: 'videos',
        comments: 'comentarios',
        commentsAbout: 'Qué dicen los comentarios sobre el producto',
        videoReviews: 'Reseñas en video',
        keyPoints: 'Puntos clave'
    },
    fr: {
        all: 'Tout',
        dep: 'Beau',
        manh: 'Puissant',
        re: 'Abordable',
        createArticle: '+ Créer Article',
        noArticles: 'Aucun article',
        createFirst: '+ Créer Premier Article',
        createNew: 'Créer Nouvel Article',
        productName: 'Nom du Produit',
        enterProduct: 'Entrez le nom du produit...',
        category: 'Catégorie',
        generate: 'Générer Article',
        loading: 'Génération en cours...',
        noComments: 'Aucun commentaire',
        videos: 'vidéos',
        comments: 'commentaires',
        commentsAbout: 'Ce que disent les commentaires sur le produit',
        videoReviews: 'Critiques vidéo',
        keyPoints: 'Points clés'
    },
    de: {
        all: 'Alle',
        dep: 'Schön',
        manh: 'Leistungsstark',
        re: 'Erschwinglich',
        createArticle: '+ Artikel Erstellen',
        noArticles: 'Keine Artikel',
        createFirst: '+ Ersten Artikel Erstellen',
        createNew: 'Neuen Artikel Erstellen',
        productName: 'Produktname',
        enterProduct: 'Produktname eingeben...',
        category: 'Kategorie',
        generate: 'Artikel Generieren',
        loading: 'Artikel wird generiert...',
        noComments: 'Keine Kommentare',
        videos: 'Videos',
        comments: 'Kommentare',
        commentsAbout: 'Was Kommentare über das Produkt sagen',
        videoReviews: 'Video-Bewertungen',
        keyPoints: 'Hauptpunkte'
    },
    pt: {
        all: 'Todos',
        dep: 'Bonito',
        manh: 'Poderoso',
        re: 'Acessível',
        createArticle: '+ Criar Artigo',
        noArticles: 'Sem artigos',
        createFirst: '+ Criar Primeiro Artigo',
        createNew: 'Criar Novo Artigo',
        productName: 'Nome do Produto',
        enterProduct: 'Digite o nome do produto...',
        category: 'Categoria',
        generate: 'Gerar Artigo',
        loading: 'Gerando artigo...',
        noComments: 'Sem comentários',
        videos: 'vídeos',
        comments: 'comentários',
        commentsAbout: 'O que os comentários dizem sobre o produto',
        videoReviews: 'Análises em vídeo',
        keyPoints: 'Pontos-chave'
    },
    ru: {
        all: 'Все',
        dep: 'Красивый',
        manh: 'Мощный',
        re: 'Доступный',
        createArticle: '+ Создать Статью',
        noArticles: 'Нет статей',
        createFirst: '+ Создать Первую Статью',
        createNew: 'Создать Новую Статью',
        productName: 'Название Продукта',
        enterProduct: 'Введите название продукта...',
        category: 'Категория',
        generate: 'Создать Статью',
        loading: 'Создание статьи...',
        noComments: 'Нет комментариев',
        videos: 'видео',
        comments: 'комментарии',
        commentsAbout: 'Что говорят комментарии о продукте',
        videoReviews: 'Видео обзоры',
        keyPoints: 'Ключевые моменты'
    }
};

function t(key) {
    return uiTranslations[currentLanguage]?.[key] || uiTranslations['vi'][key] || key;
}

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    updateUILanguage();
    await loadArticlesFromDB();
    renderMagazineGrid();
    setupEventListeners();
});

function updateUILanguage() {
    console.log(`🌐 Updating UI to ${currentLanguage}...`);
    
    // Update welcome message
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.querySelector('h1').textContent = t('welcomeTitle');
        welcomeMsg.querySelector('p').textContent = t('welcomeSubtitle');
    }
    
    // Update navigation buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        const category = btn.dataset.category;
        if (category) {
            btn.textContent = t(category);
        }
    });
    
    // Update create article button
    const createBtn = document.getElementById('create-article-btn');
    if (createBtn) createBtn.textContent = t('createArticle');
    
    // Update modal title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = t('createNew');
    
    // Update product label
    const productLabel = document.getElementById('product-label');
    if (productLabel) productLabel.textContent = t('productName');
    
    // Update product input placeholder
    const productInput = document.getElementById('product-input');
    if (productInput) productInput.placeholder = t('enterProduct');
    
    // Update category label
    const categoryLabel = document.getElementById('category-label');
    if (categoryLabel) categoryLabel.textContent = t('category');
    
    // Update generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) generateBtn.textContent = t('generate');
    
    // Update loading text
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.textContent = t('loading');
    
    // Update category pills
    document.querySelectorAll('.pill').forEach(pill => {
        const cat = pill.dataset.cat;
        if (cat) pill.textContent = t(cat);
    });
    
    // Re-render grid to update UI
    renderMagazineGrid();
    
    console.log(`✅ UI updated to ${currentLanguage}`);
}

function setupEventListeners() {
    // Category navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderMagazineGrid();
        });
    });

    // Create article button
    document.getElementById('create-article-btn').addEventListener('click', openCreateModal);
    
    // Language selector
    const languageSelector = document.getElementById('language-selector');
    languageSelector.value = currentLanguage;
    languageSelector.addEventListener('change', async (e) => {
        const newLanguage = e.target.value;
        if (newLanguage !== currentLanguage) {
            currentLanguage = newLanguage;
            localStorage.setItem('language', currentLanguage);
            console.log(`🌐 Language changed to: ${currentLanguage}`);
            
            // Update UI immediately
            updateUILanguage();
            
            // Re-translate all cached articles
            if (articles.length > 0) {
                const shouldTranslate = confirm(t('confirmTranslate') || `Translate all ${articles.length} articles?`);
                if (shouldTranslate) {
                    await translateAllArticles(newLanguage);
                }
            }
        }
    });

    // Category pills in modal
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedCategory = pill.dataset.cat;
        });
    });

    // Generate button
    document.getElementById('generate-btn').addEventListener('click', generateArticle);

    // Enter key in input
    document.getElementById('product-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateArticle();
    });
}

function openCreateModal() {
    document.getElementById('create-modal').classList.remove('hidden');
    document.getElementById('product-input').focus();
}

function closeCreateModal() {
    document.getElementById('create-modal').classList.add('hidden');
    document.getElementById('product-input').value = '';
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('generate-btn').style.display = 'block';
}

function closeArticleModal() {
    document.getElementById('article-modal').classList.add('hidden');
}

// OPTIMIZED: Async article generation with progress tracking
let currentJobId = null;

async function generateArticle() {
    const query = document.getElementById('product-input').value.trim();
    
    if (!query) {
        alert(t('enterProduct') || 'Please enter product name!');
        return;
    }

    // Show loading
    document.getElementById('generate-btn').style.display = 'none';
    document.getElementById('loading-state').classList.remove('hidden');
    
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = '🚀 Starting job...';

    try {
        // Start async job
        const response = await fetch('/api/generate-article-async', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, language: currentLanguage })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to start job');
        }

        currentJobId = data.jobId;
        console.log(`✅ Job started: ${currentJobId}`);
        
        // Save job ID for resume
        localStorage.setItem('currentJob', currentJobId);
        
        // Poll for progress
        await pollJobProgress(currentJobId);

    } catch (error) {
        console.error('Error:', error);
        alert((t('errorCreating') || 'Cannot create article') + ': ' + error.message);
        document.getElementById('generate-btn').style.display = 'block';
        document.getElementById('loading-state').classList.add('hidden');
    }
}

// Poll job progress
async function pollJobProgress(jobId) {
    const loadingText = document.getElementById('loading-text');
    let phase1Displayed = false; // Track if we've shown the article
    
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/job-status/${jobId}`);
            const data = await response.json();
            
            if (!response.ok) {
                clearInterval(pollInterval);
                throw new Error('Job not found');
            }
            
            // Update progress with better messages
            let statusMessage = data.status;
            if (data.status.startsWith('sentiment_')) {
                statusMessage = 'Analyzing sentiment...';
            } else if (data.status === 'phase1_complete') {
                statusMessage = 'Article ready! Analyzing sentiment...';
            } else if (data.status === 'generating_article') {
                statusMessage = 'Generating article...';
            } else if (data.status === 'complete') {
                statusMessage = 'Complete!';
            }
            
            loadingText.textContent = `⚡ Progress: ${Math.round(data.progress)}% - ${statusMessage}`;
            
            console.log(`📊 Poll: status=${data.status}, progress=${data.progress}, phase1Displayed=${phase1Displayed}, hasArticle=${!!data.article}`);
            
            // PHASE 1 COMPLETE: Show article immediately!
            if (data.status === 'phase1_complete' && !phase1Displayed && data.article) {
                console.log('✅ PHASE 1 DETECTED - Showing article!');
                phase1Displayed = true; // Mark as displayed
                
                // Show notification
                showNotification('✅ Article ready! Sentiment analysis running...');
                
                // Save article (use jobId as article ID for tracking)
                const article = {
                    id: jobId,  // Use jobId instead of Date.now() for tracking
                    category: data.article.category || selectedCategory,
                    createdAt: new Date().toISOString(),
                    cached: true,
                    language: currentLanguage,
                    sentimentAnalyzing: true, // Flag for UI
                    ...data.article
                };

                // Save to database
                await fetch('/api/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ article })
                });

                articles.unshift(article);

                // Close create modal
                closeCreateModal();

                // Render grid
                renderMagazineGrid();

                // Open article
                openArticle(article);
                
                // Show sentiment analysis timer in article
                showSentimentAnalysisTimer(article.id, jobId);
                
                // Continue polling for Phase 2 completion
                console.log('📊 Article displayed, waiting for sentiment analysis...');
                
            } else if (data.status === 'complete') {
                // PHASE 2 COMPLETE: Update sentiment
                console.log('✅ PHASE 2 DETECTED - Updating sentiment!');
                clearInterval(pollInterval);
                
                showNotification('✅ Sentiment analysis complete!');
                
                // Update article with new sentiment data
                const articleIndex = articles.findIndex(a => a.id === jobId);
                console.log(`🔍 Looking for article with ID: ${jobId}, found index: ${articleIndex}`);
                
                if (articleIndex !== -1 && data.article) {
                    console.log('📝 Updating article with sentiment data');
                    articles[articleIndex] = {
                        ...articles[articleIndex],
                        ...data.article,
                        sentimentAnalyzing: false
                    };
                    
                    // Re-render if article is currently open
                    if (currentArticle && currentArticle.id === jobId) {
                        console.log('🔄 Re-rendering open article');
                        openArticle(articles[articleIndex]);
                    }
                } else {
                    console.warn('⚠️ Article not found for update');
                }
                
                // Clear job
                localStorage.removeItem('currentJob');
                currentJobId = null;
                
                // Hide sentiment timer
                hideSentimentAnalysisTimer();
                
            } else if (data.status === 'error') {
                clearInterval(pollInterval);
                throw new Error(data.error || 'Job failed');
            }
            
        } catch (error) {
            clearInterval(pollInterval);
            console.error('Poll error:', error);
            alert('Error: ' + error.message);
            document.getElementById('generate-btn').style.display = 'block';
            document.getElementById('loading-state').classList.add('hidden');
        }
    }, 2000); // Poll every 2 seconds
}

// Show floating notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'floating-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Resume job on page load
window.addEventListener('load', async () => {
    const pausedJob = localStorage.getItem('currentJob');
    if (pausedJob) {
        const resume = confirm('You have a paused job. Resume?');
        if (resume) {
            try {
                const response = await fetch(`/api/resume-job/${pausedJob}`, { method: 'POST' });
                if (response.ok) {
                    currentJobId = pausedJob;
                    document.getElementById('create-modal').classList.remove('hidden');
                    document.getElementById('generate-btn').style.display = 'none';
                    document.getElementById('loading-state').classList.remove('hidden');
                    await pollJobProgress(pausedJob);
                }
            } catch (error) {
                console.error('Resume error:', error);
                localStorage.removeItem('currentJob');
            }
        } else {
            // Cancel job
            await fetch(`/api/cancel-job/${pausedJob}`, { method: 'DELETE' });
            localStorage.removeItem('currentJob');
        }
    }
});

// Pause job on page close
window.addEventListener('beforeunload', (e) => {
    if (currentJobId) {
        navigator.sendBeacon(`/api/pause-job/${currentJobId}`);
    }
});

// Idle timeout removed - backend handles it only for paused jobs
// Running jobs should never be cancelled by idle timer

// Sentiment analysis timer UI
function showSentimentAnalysisTimer(articleId, jobId) {
    const timer = document.createElement('div');
    timer.id = 'sentiment-timer';
    timer.className = 'sentiment-timer';
    timer.innerHTML = `
        <div class="timer-content">
            <div class="spinner-small"></div>
            <span>📊 Sentiment analysis in progress... ETA: <span id="eta-seconds">calculating</span>s</span>
        </div>
    `;
    
    const articleModal = document.getElementById('article-modal');
    if (articleModal) {
        articleModal.appendChild(timer);
    }
    
    // Start ETA countdown (estimate based on comment count)
    let eta = 30; // Default 30 seconds
    const etaElement = document.getElementById('eta-seconds');
    
    const countdown = setInterval(() => {
        eta--;
        if (etaElement && eta > 0) {
            etaElement.textContent = eta;
        } else {
            clearInterval(countdown);
            if (etaElement) {
                etaElement.textContent = 'almost done';
            }
        }
    }, 1000);
    
    // Store interval for cleanup
    timer.dataset.countdown = countdown;
}

function hideSentimentAnalysisTimer() {
    const timer = document.getElementById('sentiment-timer');
    if (timer) {
        // Clear countdown
        if (timer.dataset.countdown) {
            clearInterval(parseInt(timer.dataset.countdown));
        }
        timer.remove();
    }
}

async function fetchRemainingCommentsInBackground(article) {
    const indicator = document.getElementById('fetch-indicator');
    const fetchText = document.getElementById('fetch-text');
    
    // Show indicator
    indicator.classList.remove('hidden');
    
    // Skip first video (already has comments)
    for (let i = 1; i < article.videoGallery.length; i++) {
        const video = article.videoGallery[i];
        
        // Update indicator text
        fetchText.textContent = `${t('loadingVideo') || 'Loading video'} ${i}/${article.videoGallery.length - 1}...`;
        
        try {
            console.log(`📥 Background: Fetching comments for video ${i + 1}/${article.videoGallery.length}`);
            
            const response = await fetch('/api/get-video-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    videoId: video.id,
                    language: currentLanguage 
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.comments) {
                // Store comments in video object with language
                video.comments = data.comments.comments;
                video.sentiment = data.comments.sentiment;
                video.cachedLanguage = currentLanguage;
                
                // Update article in storage
                const articleIndex = articles.findIndex(a => a.id === article.id);
                if (articleIndex >= 0) {
                    articles[articleIndex] = article;
                    localStorage.setItem('articles', JSON.stringify(articles));
                }
                
                console.log(`✅ Background: Video ${i + 1} comments cached (${currentLanguage})`);
            }
        } catch (error) {
            console.error(`❌ Background: Failed to fetch comments for video ${i + 1}:`, error);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Hide indicator
    fetchText.textContent = '✅ Hoàn thành!';
    setTimeout(() => {
        indicator.classList.add('hidden');
    }, 2000);
    
    console.log('✅ All background comment fetching complete!');
}

function renderMagazineGrid() {
    const grid = document.getElementById('magazine-grid');
    
    // Filter articles
    const filtered = currentCategory === 'all' 
        ? articles 
        : articles.filter(a => a.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>${t('noArticles')}</p>
                <button class="create-btn-large" onclick="openCreateModal()">
                    ${t('createFirst')}
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(article => `
        <div class="article-card lumia-card">
            <div class="article-card-thumb" onclick="openArticleById(${article.id})">
                <img src="https://i.ytimg.com/vi/${article.videoId}/maxresdefault.jpg" 
                     onerror="this.src='https://i.ytimg.com/vi/${article.videoId}/hqdefault.jpg'">
                <div class="article-card-category">${getCategoryName(article.category)}</div>
            </div>
            <div class="article-card-body" onclick="openArticleById(${article.id})">
                <h3 class="article-card-title">${article.title}</h3>
                <p class="article-card-subtitle">${article.subtitle}</p>
                ${article.tags && article.tags.length > 0 ? `
                    <div class="article-card-tags">
                        ${article.tags.slice(0, 3).map(tag => `<span class="mini-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="article-card-meta">
                    <span>📹 ${article.videoGallery ? article.videoGallery.length : 1} ${t('videos')}</span>
                    <span>💬 ${article.comments ? article.comments.length : 0} ${t('comments')}</span>
                </div>
            </div>
            ${currentUser ? `
                <button class="delete-pin-btn" onclick="event.stopPropagation(); deleteArticle(${article.id})" title="Delete">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            ` : ''}
        </div>
    `).join('');
}

function getCategoryName(cat) {
    const names = { dep: 'Đẹp', manh: 'Mạnh', re: 'Rẻ' };
    return names[cat] || cat;
}

function openArticleById(id) {
    const article = articles.find(a => a.id === id);
    if (article) openArticle(article);
}

function openArticle(article) {
    currentArticle = article;
    currentVideoIndex = 0;
    
    const modal = document.getElementById('article-modal');
    const content = document.getElementById('article-content');
    
    content.innerHTML = `
        <div class="article-header">
            <h1 class="article-title">${article.title}</h1>
            <p class="article-subtitle">${article.subtitle}</p>
        </div>

        ${renderHeroImage(article)}

        <div class="article-body">
            ${renderTags(article)}
            ${renderKeyPoints(article)}
            <div class="editorial-content">${formatEditorial(article.editorial || article.beautyDescription || '')}</div>
        </div>

        <div class="comments-video-section">
            <h2 class="section-title">💬 ${t('commentsAbout')}</h2>
            
            ${renderVideoGallery(article)}
            
            ${renderSentiment(article)}

            <div id="comments-container">
                ${renderComments(article)}
            </div>
            
            <div class="emotion-feedback">
                <button class="emotion-btn" onclick="openEmotionFeedback('${article.id}')">
                    💭 ${t('emotionFeedback')}
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setupVideoGallery(article);
}

function renderHeroImage(article) {
    // Use first video thumbnail as hero image
    const videoId = article.videoGallery && article.videoGallery.length > 0 
        ? article.videoGallery[0].id 
        : article.videoId;
    
    return `
        <div class="hero-image">
            <img src="https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg" 
                 onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'"
                 alt="${article.title}">
        </div>
    `;
}

function renderVideoGallery(article) {
    if (!article.videoGallery || article.videoGallery.length === 0) {
        return `
            <div class="video-main">
                <iframe src="https://www.youtube.com/embed/${article.videoId}" 
                        frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }

    const videos = article.videoGallery;
    
    return `
        <div class="video-gallery">
            <div class="video-gallery-label">${videos.length} ${t('videoReviews')}</div>
            
            <div class="video-main" id="video-main">
                <iframe src="https://www.youtube.com/embed/${videos[0].id}" 
                        frameborder="0" allowfullscreen></iframe>
            </div>

            <div class="video-carousel">
                <div class="carousel-track" id="carousel-track">
                    ${videos.map((video, index) => `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}" 
                             data-index="${index}"
                             onclick="switchVideo(${index})">
                            <img src="https://i.ytimg.com/vi/${video.id}/mqdefault.jpg" 
                                 alt="${video.title}">
                            <div class="carousel-item-title">${video.title}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function setupVideoGallery(article) {
    if (!article.videoGallery) return;
    
    // Scroll carousel to show active item
    const track = document.getElementById('carousel-track');
    if (track) {
        const activeItem = track.querySelector('.carousel-item.active');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

async function switchVideo(index) {
    if (!currentArticle || !currentArticle.videoGallery) return;
    
    currentVideoIndex = index;
    const video = currentArticle.videoGallery[index];
    
    // Update video iframe
    const videoMain = document.getElementById('video-main');
    videoMain.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${video.id}" 
                frameborder="0" allowfullscreen></iframe>
    `;
    
    // Update active state
    document.querySelectorAll('.carousel-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    // Scroll to active
    const track = document.getElementById('carousel-track');
    const activeItem = track.querySelector('.carousel-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    // Show loading state immediately
    const commentsContainer = document.getElementById('comments-container');
    if (commentsContainer) {
        commentsContainer.innerHTML = `
            <div class="comments-loading">
                <div class="loading-spinner"></div>
                <p>⏳ ${t('loading')}...</p>
            </div>
        `;
    }
    
    // Check if comments are cached AND in the correct language
    const cachedLanguage = video.cachedLanguage || 'vi';
    const needsRefetch = !video.comments || !video.sentiment || cachedLanguage !== currentLanguage;
    
    if (!needsRefetch) {
        console.log(`✅ Using cached comments for video ${index + 1} (${currentLanguage})`);
        currentArticle.comments = video.comments;
        currentArticle.sentiment = video.sentiment;
        
        // Update UI
        const sentimentSection = document.querySelector('.sentiment-section');
        if (sentimentSection) {
            sentimentSection.outerHTML = renderSentiment(currentArticle);
        }
        
        if (commentsContainer) {
            commentsContainer.innerHTML = renderComments(currentArticle);
        }
        return;
    }
    
    console.log(`🔄 Refetching comments for video ${index + 1} (language changed: ${cachedLanguage} → ${currentLanguage})`);
    
    // Fetch new comments if not cached
    console.log(`📥 Fetching comments for video ${index + 1}:`, video.id);
    
    try {
        const response = await fetch('/api/get-video-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                videoId: video.id,
                language: currentLanguage 
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.comments) {
            currentArticle.comments = data.comments.comments;
            currentArticle.sentiment = data.comments.sentiment;
            
            // Cache in video object with language
            video.comments = data.comments.comments;
            video.sentiment = data.comments.sentiment;
            video.cachedLanguage = currentLanguage;
            
            // Update UI
            const sentimentSection = document.querySelector('.sentiment-section');
            if (sentimentSection) {
                sentimentSection.outerHTML = renderSentiment(currentArticle);
            }
            
            if (commentsContainer) {
                commentsContainer.innerHTML = renderComments(currentArticle);
            }
            
            console.log('✅ Comments updated');
        }
    } catch (error) {
        console.error('Error fetching comments:', error);
        if (commentsContainer) {
            commentsContainer.innerHTML = `<div class="no-comments">${t('noComments')}</div>`;
        }
    }
}

function renderTags(article) {
    if (!article.tags || article.tags.length === 0) return '';
    
    return `
        <div class="article-tags">
            ${article.tags.map(tag => `<span class="article-tag">#${tag}</span>`).join('')}
        </div>
    `;
}

function renderKeyPoints(article) {
    if (!article.keyPoints || article.keyPoints.length === 0) return '';
    
    const keyPointsTitle = {
        'vi': 'Điểm Chính',
        'en': 'Key Points',
        'zh-CN': '要点',
        'ja': 'キーポイント',
        'ko': '핵심 포인트',
        'es': 'Puntos Clave',
        'fr': 'Points Clés',
        'de': 'Hauptpunkte',
        'pt': 'Pontos-Chave',
        'ru': 'Ключевые Моменты'
    };
    
    return `
        <div class="key-points">
            <h3>🎯 ${keyPointsTitle[currentLanguage] || keyPointsTitle['en']}</h3>
            <ul>
                ${article.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>
    `;
}

function formatEditorial(text) {
    if (!text) return '';
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
}

function renderSentiment(article) {
    if (!article.sentiment) return '';
    
    const s = article.sentiment;
    
    return `
        <div class="sentiment-section">
            <h3>📊 ${t('sentimentAnalysis')}</h3>
            <p class="sentiment-summary">${s.summary || ''}</p>
            <div class="sentiment-bar">
                <span class="label">${t('positive')}</span>
                <div class="bar"><div class="fill positive" style="width: ${s.positive}%"></div></div>
                <span class="percentage">${s.positive}%</span>
            </div>
            <div class="sentiment-bar">
                <span class="label">${t('negative')}</span>
                <div class="bar"><div class="fill negative" style="width: ${s.negative}%"></div></div>
                <span class="percentage">${s.negative}%</span>
            </div>
            <div class="sentiment-bar">
                <span class="label">${t('neutral')}</span>
                <div class="bar"><div class="fill neutral" style="width: ${s.neutral}%"></div></div>
                <span class="percentage">${s.neutral}%</span>
            </div>
            ${s.mixed ? `
            <div class="sentiment-bar">
                <span class="label">${t('mixed')}</span>
                <div class="bar"><div class="fill mixed" style="width: ${s.mixed}%"></div></div>
                <span class="percentage">${s.mixed}%</span>
            </div>
            ` : ''}
            <p class="total-comments">${s.totalComments} ${t('commentsAnalyzed')}</p>
        </div>
    `;
}

function renderComments(article) {
    // Show loading state if comments are being fetched
    if (!article.comments) {
        return `
            <div class="comments-loading">
                <div class="loading-spinner"></div>
                <p>⏳ ${t('loading')}...</p>
            </div>
        `;
    }

    if (article.comments.length === 0) {
        return `<div class="no-comments">${t('noComments')}</div>`;
    }

    return `
        <div class="comments-section">
            <div class="comments-header">
                <h3>💬 ${t('comments')} (${article.comments.length})</h3>
                <button class="translate-all-btn" onclick="translateAllComments()">
                    🌐 ${t('translateAll')}
                </button>
            </div>
            ${article.comments.map((comment, index) => `
                <div class="comment ${comment.sentiment}" id="comment-${index}">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <div class="comment-meta">
                            ${comment.category ? `<span class="comment-category">${comment.category}</span>` : ''}
                            <span class="sentiment-badge ${comment.sentiment}">${t(comment.sentiment)}</span>
                            ${comment.confidence ? `<span class="confidence">${comment.confidence}%</span>` : ''}
                            ${comment.tier ? `<span class="tier-badge">T${comment.tier}</span>` : ''}
                        </div>
                    </div>
                    <p class="comment-text" data-original="${escapeHtml(comment.originalText || comment.text)}">${comment.text}</p>
                    <button class="translate-comment-btn" onclick="translateSingleComment(${index})">
                        🌐 ${t('translateComment')}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function translateSingleComment(index) {
    const commentEl = document.getElementById(`comment-${index}`);
    const textEl = commentEl.querySelector('.comment-text');
    const btn = commentEl.querySelector('.translate-comment-btn');
    const original = textEl.dataset.original;
    const current = textEl.textContent;
    
    // Toggle between original and translated
    if (current === original) {
        // Translate
        btn.textContent = '⏳ Translating...';
        btn.disabled = true;
        
        try {
            const response = await fetch('/api/translate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: original,
                    targetLanguage: currentLanguage 
                })
            });
            
            const data = await response.json();
            if (data.success) {
                textEl.textContent = data.translated;
                btn.textContent = `🌐 ${t('showOriginal')}`;
            } else {
                alert('Translation failed');
            }
        } catch (error) {
            console.error('Translation error:', error);
            alert('Translation failed');
        } finally {
            btn.disabled = false;
        }
    } else {
        // Show original
        textEl.textContent = original;
        btn.textContent = `🌐 ${t('translateComment')}`;
    }
}

async function translateAllComments() {
    const comments = document.querySelectorAll('.comment');
    for (let i = 0; i < comments.length; i++) {
        await translateSingleComment(i);
        // Small delay to avoid rate limiting
        if (i % 5 === 4) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function openEmotionFeedback(articleId) {
    const feedback = prompt(`💭 ${t('emotionFeedback')}`);
    
    if (feedback && feedback.trim()) {
        console.log(`📝 Emotion feedback for article ${articleId}:`, feedback);
        alert('Cảm ơn bạn đã chia sẻ! 💙');
        
        // TODO: Save feedback to database or send to analytics
        // For now, just log it
        const feedbackData = {
            articleId,
            feedback: feedback.trim(),
            timestamp: new Date().toISOString(),
            language: currentLanguage
        };
        
        // Save to localStorage for now
        const allFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
        allFeedback.push(feedbackData);
        localStorage.setItem('userFeedback', JSON.stringify(allFeedback));
    }
}

// Authentication functions
function checkAuth() {
    if (!currentUser) {
        // Mock login prompt
        const username = prompt('🔐 Mock Login\nEnter username (or cancel for guest mode):');
        if (username && username.trim()) {
            currentUser = {
                username: username.trim(),
                id: Date.now()
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('✅ Logged in as:', currentUser.username);
        } else {
            console.log('👤 Guest mode');
        }
    } else {
        console.log('✅ Already logged in as:', currentUser.username);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    alert('👋 Logged out!');
    location.reload();
}

async function deleteArticle(articleId) {
    if (!currentUser) {
        alert('🔐 Please login to delete articles');
        return;
    }
    
    if (confirm('🗑️ Delete this article?')) {
        // Delete from database
        await fetch(`/api/articles/${articleId}`, {
            method: 'DELETE'
        });
        
        articles = articles.filter(a => a.id !== articleId);
        renderMagazineGrid();
        console.log(`🗑️ Article ${articleId} deleted from database`);
    }
}

async function translateAllArticles(targetLang) {
    console.log(`🌐 Starting translation of ${articles.length} articles to ${targetLang}...`);
    
    if (articles.length === 0) {
        alert('No articles to translate!');
        return;
    }
    
    let translated = 0;
    let failed = 0;
    
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`📝 Translating article ${i + 1}/${articles.length}: "${article.title}"`);
        
        try {
            const response = await fetch('/api/translate-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    article: {
                        title: article.title,
                        subtitle: article.subtitle,
                        editorial: article.editorial,
                        comments: article.comments || [],
                        tags: article.tags || [],
                        keyPoints: article.keyPoints || []
                    },
                    targetLanguage: targetLang
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.translated) {
                // Update article with translations
                article.title = data.translated.title || article.title;
                article.subtitle = data.translated.subtitle || article.subtitle;
                article.editorial = data.translated.editorial || article.editorial;
                article.comments = data.translated.comments || article.comments;
                article.tags = data.translated.tags || article.tags;
                article.keyPoints = data.translated.keyPoints || article.keyPoints;
                article.language = targetLang;
                translated++;
                console.log(`✅ Article ${i + 1} translated successfully`);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            failed++;
            console.error(`❌ Failed to translate article ${i + 1}:`, error.message);
        }
    }
    
    localStorage.setItem('articles', JSON.stringify(articles));
    renderMagazineGrid();
    
    console.log(`🎯 Translation complete: ${translated} success, ${failed} failed`);
    alert(`✅ Translation complete!\n${translated} articles translated\n${failed} failed`);
}

// Make functions global
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.closeArticleModal = closeArticleModal;
window.openArticleById = openArticleById;
window.switchVideo = switchVideo;
window.openEmotionFeedback = openEmotionFeedback;
window.deleteArticle = deleteArticle;
window.logout = logout;
