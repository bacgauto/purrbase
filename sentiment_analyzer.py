#!/usr/bin/env python3
"""
Enhanced Sentiment Analyzer using HuggingFace datasets
Datasets:
1. Sp1786/multiclass-sentiment-analysis-dataset
2. AmaanP314/youtube-comment-sentiment
"""

import sys
import json
import os
from collections import Counter

class SentimentAnalyzer:
    def __init__(self):
        print("🤖 Loading sentiment keywords from cache...", file=sys.stderr)
        
        # Try to load from cached pickle file
        cache_file = 'sentiment_keywords.pkl'
        if os.path.exists(cache_file):
            try:
                import pickle
                with open(cache_file, 'rb') as f:
                    sentiment_data = pickle.load(f)
                
                self.positive_keywords = set(sentiment_data['positive_keywords'])
                self.negative_keywords = set(sentiment_data['negative_keywords'])
                self.neutral_keywords = set(sentiment_data['neutral_keywords'])
                
                print(f"✅ Loaded from cache: {cache_file}", file=sys.stderr)
                print(f"   Positive keywords: {len(self.positive_keywords)}", file=sys.stderr)
                print(f"   Negative keywords: {len(self.negative_keywords)}", file=sys.stderr)
                print(f"   Neutral keywords: {len(self.neutral_keywords)}", file=sys.stderr)
                return
            except Exception as e:
                print(f"⚠️  Cache load failed: {e}", file=sys.stderr)
        
        # Fallback: use basic keywords
        print("⚠️  No cache found, using basic keywords", file=sys.stderr)
        print("   Run 'python prepare_datasets.py' to build cache", file=sys.stderr)
        
        self.positive_keywords = set([
            'good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best',
            'perfect', 'fantastic', 'wonderful', 'beautiful', 'nice', 'quality',
            'recommend', 'happy', 'satisfied', 'impressed', 'worth', 'value',
            'solid', 'reliable', 'sturdy', 'durable', 'comfortable', 'smooth'
        ])
        
        self.negative_keywords = set([
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor',
            'disappointing', 'disappointed', 'waste', 'useless', 'broken',
            'defective', 'issue', 'problem', 'fail', 'failed', 'regret',
            'cheap', 'flimsy', 'uncomfortable', 'slow', 'laggy', 'buggy'
        ])
        
        self.neutral_keywords = set([
            'okay', 'fine', 'average', 'normal', 'standard', 'typical',
            'decent', 'acceptable', 'moderate', 'fair', 'alright'
        ])
    
    def is_product_related(self, text):
        """Check if comment mentions product (not video/channel)"""
        text_lower = text.lower()
        
        # VIDEO-RELATED keywords (should be IGNORED)
        video_keywords = [
            'video', 'watch', 'watching', 'view', 'views', 'viewer',
            'subscribe', 'subscriber', 'like', 'liked', 'dislike',
            'comment', 'channel', 'upload', 'uploaded', 'content',
            'youtuber', 'creator', 'thanks for', 'thank you for',
            'first', 'second', 'third', 'early', 'notification',
            'bell', 'algorithm', 'recommended', 'suggestion',
            'thumbnail', 'title', 'description', 'playlist',
            'sub4sub', 'follow', 'check out my', 'visit my',
            'link in bio', 'click here', 'spam', 'bot'
        ]
        
        # If comment is about video/channel, NOT product
        if any(keyword in text_lower for keyword in video_keywords):
            return False
        
        # PRODUCT-RELATED keywords (should be ANALYZED)
        product_keywords = [
            'product', 'item', 'quality', 'price', 'buy', 'purchase',
            'bought', 'ordered', 'order', 'shipping', 'delivery',
            'use', 'using', 'used', 'work', 'works', 'working',
            'feature', 'features', 'design', 'build', 'material',
            'performance', 'battery', 'screen', 'display', 'camera',
            'sound', 'audio', 'speaker', 'microphone', 'keyboard',
            'mouse', 'trackpad', 'touchscreen', 'charging', 'charger',
            'phone', 'laptop', 'tablet', 'device', 'gadget', 'tech',
            'specs', 'specification', 'model', 'version', 'generation',
            'worth', 'value', 'money', 'expensive', 'cheap', 'affordable',
            'recommend', 'recommendation', 'upgrade', 'downgrade',
            'better than', 'worse than', 'compared to', 'vs',
            'fast', 'slow', 'heavy', 'light', 'compact', 'portable',
            'durable', 'sturdy', 'fragile', 'broken', 'defective',
            'warranty', 'return', 'refund', 'customer service'
        ]
        
        # Must mention product to be analyzed
        return any(keyword in text_lower for keyword in product_keywords)
    
    def analyze_sentiment(self, text):
        """
        Analyze sentiment of text using dataset-trained keywords
        Returns: 'positive', 'negative', 'neutral', or 'mixed'
        """
        
        # Check if product-related
        if not self.is_product_related(text):
            return 'neutral'
        
        text_lower = text.lower()
        words = set(w.strip('.,!?;:') for w in text_lower.split())
        
        # Count sentiment indicators
        positive_count = len(words & self.positive_keywords)
        negative_count = len(words & self.negative_keywords)
        neutral_count = len(words & self.neutral_keywords)
        
        # Determine sentiment
        if positive_count == 0 and negative_count == 0:
            return 'neutral'
        
        if positive_count > negative_count * 1.5:
            return 'positive'
        elif negative_count > positive_count * 1.5:
            return 'negative'
        elif positive_count > 0 and negative_count > 0:
            return 'mixed'
        else:
            return 'neutral'
    
    def analyze_batch(self, comments):
        """Analyze a batch of comments"""
        results = []
        filtered_count = 0
        
        for comment in comments:
            text = comment.get('text', '')
            sentiment = self.analyze_sentiment(text)
            
            # Track filtered comments
            if sentiment == 'neutral' and not self.is_product_related(text):
                filtered_count += 1
            
            results.append({
                'text': text,
                'author': comment.get('author', 'Unknown'),
                'sentiment': sentiment
            })
        
        if filtered_count > 0:
            print(f"🔍 Filtered {filtered_count} video-related comments (marked as neutral)", file=sys.stderr)
        
        return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No comments provided'}))
        sys.exit(1)
    
    try:
        # Parse input comments
        comments_json = sys.argv[1]
        comments = json.loads(comments_json)
        
        # Initialize analyzer
        analyzer = SentimentAnalyzer()
        
        # Analyze comments
        results = analyzer.analyze_batch(comments)
        
        # Calculate statistics
        sentiments = [r['sentiment'] for r in results]
        sentiment_counts = Counter(sentiments)
        total = len(sentiments)
        
        output = {
            'comments': results,
            'stats': {
                'positive': sentiment_counts.get('positive', 0),
                'negative': sentiment_counts.get('negative', 0),
                'neutral': sentiment_counts.get('neutral', 0),
                'mixed': sentiment_counts.get('mixed', 0),
                'total': total
            }
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
