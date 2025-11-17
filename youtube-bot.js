const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class YouTubeBot {
    /**
     * Get comments using youtube-comment-downloader Python tool
     */
    async getComments(videoId, limit = 15) {
        try {
            console.log(`📥 Downloading comments for video: ${videoId}`);
            console.log(`🔢 Limit: ${limit} comments`);
            
            const fs = require('fs');
            const path = require('path');
            const outputFile = path.join(__dirname, `comments_${videoId}.json`);
            
            // Use Python module directly with output file
            const command = `python3 -m youtube_comment_downloader --youtubeid ${videoId} --output "${outputFile}" --limit ${limit} --sort 0`;
            
            console.log(`⚙️  Running Python tool...`);
            
            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                cwd: __dirname
            });
            
            // Check if file exists
            if (!fs.existsSync(outputFile)) {
                console.log('⚠️  Output file not created, checking stdout...');
                console.log('stdout:', stdout);
                console.log('stderr:', stderr);
                
                // If no file but video has no comments, return empty
                if (stderr.includes('No comment') || stdout.includes('No comment')) {
                    console.log('ℹ️  Video has no comments available');
                    return [];
                }
                
                throw new Error('Output file not created');
            }
            
            console.log(`✅ Download complete, reading file...`);
            
            // Read the output file
            const fileContent = fs.readFileSync(outputFile, 'utf8');
            
            // Parse JSON lines
            const lines = fileContent.trim().split('\n').filter(line => line.trim());
            const comments = [];
            
            for (const line of lines) {
                try {
                    const comment = JSON.parse(line);
                    if (comment.text && comment.text.length > 10) {
                        comments.push({
                            text: comment.text,
                            author: comment.author || 'Unknown',
                            likes: comment.votes || 0,
                            time: comment.time || ''
                        });
                    }
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }
            
            // Clean up temp file
            try {
                fs.unlinkSync(outputFile);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            console.log(`✅ Downloaded ${comments.length} REAL comments from YouTube!`);
            return comments;
            
        } catch (error) {
            console.error('❌ Error downloading comments:', error.message);
            return [];
        }
    }
    
    /**
     * Close (no-op for this implementation)
     */
    async close() {
        console.log('✅ YouTube Bot closed');
    }
}

module.exports = new YouTubeBot();
