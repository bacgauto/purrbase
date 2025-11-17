# 🌸 Beauty Tech Magazine

**AI-Powered Magazine That Writes Beautiful Tech Articles**

## What It Does

Enter any tech product name → AI generates a beautiful magazine-style article about it!

The AI:
- Searches online for information
- Focuses on aesthetics and design
- Writes elegant editorial content
- Highlights materials, colors, design
- Suggests who would love it
- Tells you how to pair it in a setup

## Quick Start

### 1. Setup
```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env and add your Gemini API key
GEMINI_API_KEY=your_actual_key_here
```

**Get your Gemini API key:** https://aistudio.google.com/app/apikey (FREE!)

### 2. Run
```bash
npm start
```

### 3. Use
1. Open: http://localhost:3000
2. Type a product (e.g., "Sony WH-1000XM5")
3. Click "Generate Article"
4. AI writes a beautiful article!

## Examples

Try these:
- "Sony WH-1000XM5"
- "Apple MacBook Pro M3"
- "Logitech MX Master 3S"
- "Herman Miller Aeron Chair"
- "Keychron K8 Pro"

## Features

✅ AI-generated magazine articles
✅ Focus on aesthetics & design
✅ Beautiful, clean UI
✅ Instant generation
✅ No database needed
✅ Super simple

## Cost

Gemini API is **FREE** for moderate use:
- ~$0.001 per article
- 1500 free requests/day
- Perfect for personal use!

## Future Features

Coming soon:
- Save favorite articles
- Compare products
- Generate images
- Share articles
- Custom styling

## Tech Stack

- Node.js + Express
- Google Gemini AI
- Vanilla JavaScript
- Clean, modern CSS

---

## 🌸 Beautynism Magazine

An AI-powered tech magazine that automatically generates articles about beautiful tech products using YouTube videos, real user comments, and advanced sentiment analysis.

## ✨ Features

- 🤖 **AI-Powered Content:** Gemini AI generates professional editorials
- 📹 **YouTube Integration:** Analyzes 10 videos per product
- 💬 **Real Comments:** Fetches 100+ real user comments
- 🧠 **Smart Sentiment Analysis:** Two-tier system (HuggingFace + Gemini)
- 🌐 **10 Languages:** Vietnamese, English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian
- ⚡ **Fast Performance:** Phase 1 displays article in 8 seconds
- 🎨 **Beautiful UI:** Modern, responsive design
- 💾 **Smart Caching:** Instant loading on repeat visits
- 🔄 **Background Processing:** Sentiment analysis runs in background

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   pip install youtube-comment-downloader
   ```

2. **Create `.env` file:**
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

3. **Run server:**
   ```bash
   npm start
   ```

4. **Open browser:**
   ```bash
   http://localhost:3000
   ```

## 📦 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

**Recommended:** Deploy to [Render.com](https://render.com) (free tier, supports Node.js + Python)

**Quick Deploy:**
1. Push to GitHub
2. Connect to Render.com
3. Add `GEMINI_API_KEY` environment variable
4. Deploy!

## 🛠️ Tech Stack

- **Backend:** Node.js, Express
- **AI:** Google Gemini AI
- **Sentiment:** HuggingFace Datasets + Gemini
- **Database:** SQLite (better-sqlite3)
- **YouTube:** youtube-comment-downloader (Python)
- **Translation:** Google Translate API
- **Frontend:** Vanilla JS, CSS3

## 📊 Architecture

### Two-Phase Processing
- **Phase 1 (8s):** Fetch videos → Download comments → Display article
- **Phase 2 (20s):** Run sentiment analysis in background → Update UI

### Two-Tier Sentiment Analysis
- **Tier 1 (Free):** HuggingFace keyword matching
- **Tier 2 (Gemini):** Deep AI analysis for uncertain cases

## 🎯 Performance

- ✅ Article generation: **8 seconds** (75% faster)
- ✅ Background videos: **2 seconds** (90% faster)
- ✅ Sentiment analysis: **20 seconds** (background)
- ✅ Cached articles: **Instant**

## 📝 License

MIT

## 🙏 Credits

Built with ❤️ using Gemini AI, YouTube, and open-source tools.

---

**Made with 💄 for beauty-first tech enthusiasts**
