# Production Deployment Guide

This application is split into two parts:
1.  **Frontend**: React (Vite) - Optimal for **Vercel** or **Netlify**.
2.  **Backend**: Node.js (Express + Puppeteer + Tesseract) - Optimal for **Render**, **Railway**, or a **VPS**.

---

## 🚀 1. Deploying the Backend (API)

The backend requires a runtime that supports **Puppeteer (Chrome)** and **Tesseract (OCR)**.

### Option A: Render.com (Recommended for ease)
1.  Push your code to GitHub.
2.  Create a newly **Web Service** on Render.
3.  Connect your repository and select the `server` folder as the **Root Directory**.
4.  **Settings**:
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
5.  **Environment Variables (Add these in Render Dashboard)**:
    *   `PORT`: `10000` (Render default)
    *   `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/digital-card?retryWrites=true&w=majority`
        *   *Get a free cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).*
    *   `FRONTEND_URL`: `https://your-frontend-app.vercel.app` (Add this later after deploying frontend)
6.  **Critical for Puppeteer**:
    *   In Environment Variables, add `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `true` (if using Render's native Chrome) or ensure dependencies are installed.
    *   *Note*: On free tiers, Puppeteer might run out of memory. If it crashes, upgrade to the Starter plan ($7/mo).

### Option B: VPS (DigitalOcean / EC2 / Hetzner)
1.  Provision a Ubuntu server.
2.  Install Node.js & Dependencies:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install Chrome dependencies for Puppeteer
    sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
    ```
3.  Clone repo and setup:
    ```bash
    git clone <your-repo-url>
    cd server
    npm install
    # Use PM2 to keep it running
    npm install -g pm2
    pm2 start index.js --name "backend"
    ```

---

## 🌐 2. Deploying the Frontend

### Option A: Vercel (Recommended)
1.  Go to Vercel Dashboard -> Add New Project.
2.  Import your Git Repository.
3.  **Framework Preset**: Vite.
4.  **Root Directory**: Click "Edit" and select `.` (current directory / root).
    *   *Note*: Ensure `package.json` for frontend is in the root. If it's in a subfolder, select that.
5.  **Environment Variables**:
    *   `VITE_API_URL`: `https://your-backend-app.onrender.com` (The URL from Step 1)
6.  Click **Deploy**.

---

## 📝 3. Final Verification Checklist

1.  **Database**: Ensure `MONGO_URI` points to a real Atlas cluster.
    *   *Why?* The local version uses In-Memory DB (wiped on restart). Atlas is persistent.
2.  **CORS**: Update `server/index.js` to allow only your frontend domain in production if needed (`app.use(cors({ origin: process.env.FRONTEND_URL }))`).
3.  **OCR**: The backend uses `sharp` and `tesseract.js`. These are CPU intensive. A tiny free-tier server might be slow (10-15s response). A basic paid VPS ($5-$10) is recommended for speed.
4.  **Downloads**: Check that the generated PDF download link works in production (it depends on the backend URL).

---

## 🛠 Troubleshooting

*   **Error: "Extension 'sharp' not found"**: Run `npm install sharp` on the server.
*   **Error: "Could not launch browser"**: Missing system dependencies for Puppeteer. See step 1B.
*   **MongoDB Connection Error**: Check IP Whitelist in Atlas. Allow `0.0.0.0/0` or the specific IP of your server.
