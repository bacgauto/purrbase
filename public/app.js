// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const generateBtn = document.getElementById('generate-btn');
    const loading = document.getElementById('loading');
    const article = document.getElementById('article');
    const videoGalleryNav = document.getElementById('video-gallery-nav');
    const savedBtn = document.getElementById('saved-btn');
    const savedModal = document.getElementById('saved-modal');
    const closeModal = document.getElementById('close-modal');

    let currentArticle = null;
    let currentVideoIndex = 0;
    let savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
    let currentPreference = 'all';

    // Update saved count
    updateSavedCount();

    // Event listeners
    generateBtn.addEventListener('click', generateArticle);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateArticle();
    });

    // Preference tags
    document.querySelectorAll('.pref-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            document.querySelectorAll('.pref-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentPreference = tag.dataset.pref;
        });
    });

    // Pin button
    document.getElementById('pin-btn').addEventListener('click', pinArticle);

    // Saved button
    savedBtn.addEventListener('click', () => savedModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => savedModal.classList.add('hidden'));

    // Video navigation
    document.getElementById('prev-video').addEventListener('click', () => navigateVideo(-1));
    document.getElementById('next-video').addEventListener('click', () => navigateVideo(1));

    async function generateArticle() {
        const query = searchInput.value.trim();
        
        if (!query) {
            alert('Vui lòng nhập tên sản phẩm!');
            return;
        }

        // Show loading
        article.classList.add('hidden');
        videoGalleryNav.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            console.log('🔍 Generating article for:', query, 'Preference:', currentPreference);
            
            const response = await fetch('/api/generate-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query,
                    preference: currentPreference
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate article');
            }

            console.log('✅ Article received:', data);
            currentArticle = data.article;
            currentVideoIndex = 0;
            displayArticle(data.article);

        } catch (error) {
            console.error('❌ Error:', error);
            alert('Không thể tạo bài viết: ' + error.message);
            loading.classList.add('hidden');
        }
    }

    function displayArticle(data) {
        loading.classList.add('hidden');
        article.classList.remove('hidden');

        // Display video gallery
        if (data.videoGallery && data.videoGallery.length > 0) {
            displayVideoGallery(data.videoGallery);
            videoGalleryNav.classList.remove('hidden');
        }

        // Set title and subtitle
        document.getElementById('title').textContent = data.title;
        document.getElementById('subtitle').textContent = data.subtitle;
        
        // Display current video
        displayCurrentVideo(data);

        // Beauty description
        document.getElementById('beauty-description').textContent = data.beautyDescription || 'Đang tải mô tả...';

        // Sentiment analysis
        if (data.sentiment) {
            document.getElementById('sentiment-summary').innerHTML = `
                <p class="sentiment-text ${data.sentiment.overall}">
                    ${data.sentiment.summary}
                </p>
                <p class="total-comments">${data.sentiment.totalComments} bình luận đã phân tích</p>
            `;

            document.getElementById('sentiment-bars').innerHTML = `
                <div class="sentiment-bar">
                    <span class="label">Tích cực</span>
                    <div class="bar"><div class="fill positive" style="width: ${data.sentiment.positive}%"></div></div>
                    <span class="percentage">${data.sentiment.positive}%</span>
                </div>
                <div class="sentiment-bar">
                    <span class="label">Tiêu cực</span>
                    <div class="bar"><div class="fill negative" style="width: ${data.sentiment.negative}%"></div></div>
                    <span class="percentage">${data.sentiment.negative}%</span>
                </div>
                <div class="sentiment-bar">
                    <span class="label">Trung lập</span>
                    <div class="bar"><div class="fill neutral" style="width: ${data.sentiment.neutral}%"></div></div>
                    <span class="percentage">${data.sentiment.neutral}%</span>
                </div>
            `;
        }

        // Display comments
        displayComments(data);

        // Scroll to article
        article.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function displayVideoGallery(videos) {
        const galleryGrid = document.getElementById('gallery-grid');
        galleryGrid.innerHTML = videos.map((video, index) => `
            <div class="gallery-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}" alt="${video.title}">
                <div class="gallery-item-info">
                    <div class="gallery-item-title">${video.title}</div>
                    <div class="gallery-item-views">👁️ ${video.viewCount || 'N/A'}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                switchToVideo(index);
            });
        });
    }

    function displayCurrentVideo(data) {
        const videoContainer = document.getElementById('video-container');
        const videoId = data.videoGallery ? data.videoGallery[currentVideoIndex].id : data.videoId;
        
        videoContainer.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;

        // Update counter
        if (data.videoGallery) {
            document.getElementById('video-counter').textContent = 
                `${currentVideoIndex + 1} / ${data.videoGallery.length}`;
        }

        // Update active gallery item
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            item.classList.toggle('active', index === currentVideoIndex);
        });
    }

    function navigateVideo(direction) {
        if (!currentArticle || !currentArticle.videoGallery) return;

        const newIndex = currentVideoIndex + direction;
        if (newIndex >= 0 && newIndex < currentArticle.videoGallery.length) {
            switchToVideo(newIndex);
        }
    }

    async function switchToVideo(index) {
        currentVideoIndex = index;
        displayCurrentVideo(currentArticle);
        
        // Auto-fetch comments for this video
        const videoId = currentArticle.videoGallery[index].id;
        console.log(`📥 Fetching comments for video ${index + 1}:`, videoId);
        
        try {
            const response = await fetch('/api/get-video-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            });
            
            const data = await response.json();
            
            if (data.success && data.comments) {
                // Update comments and sentiment
                currentArticle.comments = data.comments.comments;
                currentArticle.sentiment = data.comments.sentiment;
                
                // Re-display comments and sentiment
                if (currentArticle.sentiment) {
                    document.getElementById('sentiment-summary').innerHTML = `
                        <p class="sentiment-text ${currentArticle.sentiment.overall}">
                            ${currentArticle.sentiment.summary}
                        </p>
                        <p class="total-comments">${currentArticle.sentiment.totalComments} bình luận đã phân tích</p>
                    `;

                    document.getElementById('sentiment-bars').innerHTML = `
                        <div class="sentiment-bar">
                            <span class="label">Tích cực</span>
                            <div class="bar"><div class="fill positive" style="width: ${currentArticle.sentiment.positive}%"></div></div>
                            <span class="percentage">${currentArticle.sentiment.positive}%</span>
                        </div>
                        <div class="sentiment-bar">
                            <span class="label">Tiêu cực</span>
                            <div class="bar"><div class="fill negative" style="width: ${currentArticle.sentiment.negative}%"></div></div>
                            <span class="percentage">${currentArticle.sentiment.negative}%</span>
                        </div>
                        <div class="sentiment-bar">
                            <span class="label">Trung lập</span>
                            <div class="bar"><div class="fill neutral" style="width: ${currentArticle.sentiment.neutral}%"></div></div>
                            <span class="percentage">${currentArticle.sentiment.neutral}%</span>
                        </div>
                    `;
                }
                
                displayComments(currentArticle);
                console.log('✅ Comments updated for new video');
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
        
        // Scroll to video
        document.getElementById('video-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }


    function displayComments(data) {
        const commentsList = document.getElementById('comments-list');
        if (data.comments && data.comments.length > 0) {
            const commentsHeader = `
                <div class="comments-header">
                    <p><strong>Đã phân tích ${data.comments.length} bình luận</strong> từ video</p>
                    <a href="${data.videoUrl}" target="_blank" class="view-all-btn">👁️ Xem tất cả trên YouTube</a>
                </div>
            `;
            
            const commentsHTML = data.comments.map(comment => `
                <div class="comment ${comment.sentiment}">
                    <div class="comment-header">
                        <span class="author">${comment.author}</span>
                        <span class="sentiment-badge ${comment.sentiment}">${comment.sentiment}</span>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                    <a href="${data.videoUrl}" target="_blank" class="read-more">Đọc trên YouTube →</a>
                </div>
            `).join('');
            
            commentsList.innerHTML = commentsHeader + commentsHTML;
        } else {
            commentsList.innerHTML = '<p>Không có bình luận.</p>';
        }
    }

    function pinArticle() {
        if (!currentArticle) return;

        const pinBtn = document.getElementById('pin-btn');
        const articleData = {
            id: Date.now(),
            title: currentArticle.title,
            query: searchInput.value,
            savedAt: new Date().toISOString(),
            data: currentArticle
        };

        // Check if already saved
        const existingIndex = savedArticles.findIndex(a => a.query === articleData.query);
        
        if (existingIndex >= 0) {
            // Remove (unpin)
            savedArticles.splice(existingIndex, 1);
            pinBtn.textContent = '📌 Lưu Bài Viết';
            pinBtn.classList.remove('pinned');
        } else {
            // Add (pin)
            savedArticles.push(articleData);
            pinBtn.textContent = '✅ Đã Lưu';
            pinBtn.classList.add('pinned');
        }

        localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
        updateSavedCount();
        updateSavedList();
    }

    function updateSavedCount() {
        document.getElementById('saved-count').textContent = savedArticles.length;
    }

    function updateSavedList() {
        const savedList = document.getElementById('saved-list');
        
        if (savedArticles.length === 0) {
            savedList.innerHTML = '<p style="text-align: center; color: #666;">Chưa có bài viết nào được lưu</p>';
            return;
        }

        savedList.innerHTML = savedArticles.map(article => `
            <div class="saved-item" onclick="loadSavedArticle(${article.id})">
                <h3>${article.title}</h3>
                <p style="color: #666; font-size: 0.9rem;">
                    Lưu lúc: ${new Date(article.savedAt).toLocaleString('vi-VN')}
                </p>
            </div>
        `).join('');
    }

    // Make loadSavedArticle global
    window.loadSavedArticle = (id) => {
        const article = savedArticles.find(a => a.id === id);
        if (article) {
            currentArticle = article.data;
            currentVideoIndex = 0;
            displayArticle(article.data);
            savedModal.classList.add('hidden');
        }
    };

    // Initialize saved list
    updateSavedList();
});
