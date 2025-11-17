/**
 * Job Manager for Parallel Comment Fetching
 * Optimized for runtime performance with parallel processing
 */

class JobManager {
    constructor() {
        this.jobs = new Map();
        this.jobTimeouts = new Map();
        this.IDLE_TIMEOUT = 60000; // 1 minute
        this.PHASE1_COMMENT_LIMIT = 10; // Quick fetch: only 10 comments per video
        this.PARALLEL_VIDEOS = 4; // Process 4 videos in parallel
        
        console.log('✅ Job Manager initialized');
    }

    createJob(query, language) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const job = {
            id: jobId,
            query,
            language,
            status: 'initializing',
            phase: 1,
            progress: 0,
            videos: [],
            article: null,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            error: null
        };
        
        this.jobs.set(jobId, job);
        // Don't start idle timer yet - job is about to run
        
        console.log(`📋 Job created: ${jobId}`);
        return jobId;
    }

    getJob(jobId) {
        return this.jobs.get(jobId);
    }

    updateJob(jobId, updates) {
        const job = this.jobs.get(jobId);
        if (job) {
            Object.assign(job, updates);
            job.lastActivity = Date.now();
            // Don't reset idle timer for running jobs
            // Only for paused jobs
        }
    }

    updateProgress(jobId, progress, status) {
        this.updateJob(jobId, { progress, status });
    }

    completePhase1(jobId, videos, article) {
        this.updateJob(jobId, {
            phase: 1,
            status: 'phase1_complete',
            // Don't set progress here - let server control it
            videos,
            article
        });
    }

    pauseJob(jobId) {
        const job = this.jobs.get(jobId);
        if (job && job.status === 'running') {
            this.updateJob(jobId, { status: 'paused' });
            // Start idle timer when paused
            this.startIdleTimer(jobId);
            console.log(`⏸️  Job paused: ${jobId}`);
        }
    }

    resumeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (job && job.status === 'paused') {
            this.updateJob(jobId, { status: 'running' });
            // Clear idle timer when resuming
            this.clearIdleTimer(jobId);
            console.log(`▶️  Job resumed: ${jobId}`);
            return true;
        }
        return false;
    }

    cancelJob(jobId) {
        this.clearIdleTimer(jobId);
        this.jobs.delete(jobId);
        console.log(`❌ Job cancelled: ${jobId}`);
    }

    startIdleTimer(jobId) {
        this.clearIdleTimer(jobId);
        
        const timer = setTimeout(() => {
            const job = this.jobs.get(jobId);
            // Only cancel if paused AND idle for 1 minute
            // Do NOT cancel running jobs!
            if (job && job.status === 'paused') {
                const idleTime = Date.now() - job.lastActivity;
                if (idleTime >= this.IDLE_TIMEOUT) {
                    console.log(`⏱️  Job ${jobId} idle for 1 minute, cancelling...`);
                    this.cancelJob(jobId);
                }
            }
        }, this.IDLE_TIMEOUT);
        
        this.jobTimeouts.set(jobId, timer);
    }

    resetIdleTimer(jobId) {
        this.clearIdleTimer(jobId);
        this.startIdleTimer(jobId);
    }

    clearIdleTimer(jobId) {
        const timer = this.jobTimeouts.get(jobId);
        if (timer) {
            clearTimeout(timer);
            this.jobTimeouts.delete(jobId);
        }
    }

    // Cleanup old jobs (older than 1 hour)
    cleanupOldJobs() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.createdAt < oneHourAgo) {
                this.cancelJob(jobId);
            }
        }
    }

    getJobStats() {
        return {
            total: this.jobs.size,
            running: Array.from(this.jobs.values()).filter(j => j.status === 'running').length,
            paused: Array.from(this.jobs.values()).filter(j => j.status === 'paused').length,
            completed: Array.from(this.jobs.values()).filter(j => j.status === 'phase1_complete').length
        };
    }
}

// Singleton instance
const jobManager = new JobManager();

// Cleanup old jobs every 10 minutes
setInterval(() => {
    jobManager.cleanupOldJobs();
}, 10 * 60 * 1000);

module.exports = jobManager;
