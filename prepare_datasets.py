#!/usr/bin/env python3
"""
Pre-download and prepare sentiment datasets locally
Run this ONCE to cache datasets on disk
"""

import sys
import json
from datasets import load_dataset
from collections import Counter
import pickle
import os

def prepare_datasets():
    print("🤖 Preparing sentiment analysis datasets...")
    print("⏳ This will take 2-3 minutes but only needs to run ONCE\n")
    
    # Load datasets (will cache to disk)
    print("📥 Loading multiclass dataset...")
    multiclass_ds = load_dataset("Sp1786/multiclass-sentiment-analysis-dataset", split="train")
    print(f"✅ Loaded {len(multiclass_ds)} samples\n")
    
    print("📥 Loading YouTube dataset...")
    youtube_ds = load_dataset("AmaanP314/youtube-comment-sentiment", split="train")
    print(f"✅ Loaded {len(youtube_ds)} samples\n")
    
    # Extract keywords from datasets
    print("🔍 Extracting sentiment keywords...")
    positive_keywords = set()
    negative_keywords = set()
    neutral_keywords = set()
    
    # Sample from multiclass dataset (use 5000 samples for speed)
    print("   Processing multiclass dataset...")
    for i, item in enumerate(multiclass_ds):
        if i >= 5000:
            break
        
        text = item.get('text', '').lower()
        sentiment = item.get('sentiment', '').lower()
        
        words = [w.strip('.,!?;:') for w in text.split() if len(w) > 3 and w.isalpha()]
        
        if 'positive' in sentiment or sentiment == '1':
            positive_keywords.update(words[:3])
        elif 'negative' in sentiment or sentiment == '0':
            negative_keywords.update(words[:3])
        elif 'neutral' in sentiment or sentiment == '2':
            neutral_keywords.update(words[:3])
    
    # Sample from YouTube dataset (use 10000 samples for speed)
    print("   Processing YouTube dataset...")
    for i, item in enumerate(youtube_ds):
        if i >= 10000:
            break
        
        text = item.get('comment', '').lower()
        sentiment = item.get('sentiment', '').lower()
        
        words = [w.strip('.,!?;:') for w in text.split() if len(w) > 3 and w.isalpha()]
        
        if 'positive' in sentiment or sentiment == '1':
            positive_keywords.update(words[:3])
        elif 'negative' in sentiment or sentiment == '0':
            negative_keywords.update(words[:3])
        elif 'neutral' in sentiment or sentiment == '2':
            neutral_keywords.update(words[:3])
    
    # Remove video-related keywords (these should NOT be in sentiment analysis)
    video_related = {
        'video', 'watch', 'watching', 'view', 'views', 'viewer',
        'subscribe', 'subscriber', 'like', 'liked', 'dislike',
        'comment', 'channel', 'upload', 'uploaded', 'content',
        'youtuber', 'creator', 'thanks', 'thank', 'first', 'second',
        'third', 'early', 'notification', 'bell', 'algorithm'
    }
    
    positive_keywords -= video_related
    negative_keywords -= video_related
    neutral_keywords -= video_related
    
    # Add common PRODUCT-SPECIFIC keywords
    positive_keywords.update([
        'good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best',
        'perfect', 'fantastic', 'wonderful', 'beautiful', 'nice', 'quality',
        'recommend', 'happy', 'satisfied', 'impressed', 'worth', 'value',
        'solid', 'reliable', 'sturdy', 'durable', 'comfortable', 'smooth',
        'fast', 'powerful', 'efficient', 'premium', 'sleek', 'elegant'
    ])
    
    negative_keywords.update([
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor',
        'disappointing', 'disappointed', 'waste', 'useless', 'broken',
        'defective', 'issue', 'problem', 'fail', 'failed', 'regret',
        'cheap', 'flimsy', 'uncomfortable', 'slow', 'laggy', 'buggy',
        'overpriced', 'expensive', 'faulty', 'unreliable', 'fragile'
    ])
    
    neutral_keywords.update([
        'okay', 'fine', 'average', 'normal', 'standard', 'typical',
        'decent', 'acceptable', 'moderate', 'fair', 'alright', 'basic'
    ])
    
    # Save to pickle file for fast loading
    sentiment_data = {
        'positive_keywords': list(positive_keywords),
        'negative_keywords': list(negative_keywords),
        'neutral_keywords': list(neutral_keywords)
    }
    
    cache_file = 'sentiment_keywords.pkl'
    with open(cache_file, 'wb') as f:
        pickle.dump(sentiment_data, f)
    
    print(f"\n✅ Sentiment keywords cached to: {cache_file}")
    print(f"   Positive keywords: {len(positive_keywords)}")
    print(f"   Negative keywords: {len(negative_keywords)}")
    print(f"   Neutral keywords: {len(neutral_keywords)}")
    print("\n🎯 Setup complete! Sentiment analysis will now be FAST!")

if __name__ == '__main__':
    prepare_datasets()
