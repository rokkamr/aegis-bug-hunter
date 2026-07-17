# Aegis AI Code & Web Tester Agent 🛡️

Aegis is a premium, client-side, AI-powered codebase analysis and E2E website testing assistant. It allows you to:
1.  **Code Scanner**: Select a local project folder, scan its source code for security flaws, bugs, and performance bottlenecks, and automatically **Apply Fixes** back to your files!
2.  **Web Tester (NEW)**: Paste any website link (localhost or deployed), specify a testing goal, and watch an AI agent automatically control a sandbox browser to crawl pages, click buttons, fill forms, capture console exceptions, and report UI and functional bugs.
3.  **Test Writer**: Automatically generate unit tests (Jest, PyTest, JUnit, etc.) for your local files and save them.
4.  **Code Chat**: Chat with individual source files to explain functions or write integrations.

All of this runs locally in your browser with complete privacy using a **free Gemini API key** from Google.

---

## 🚀 How to Run the App

Since browsers block directory access and WebSockets to debugging ports on plain `file://` URLs, Aegis must run through a local web server on `http://localhost:8000`.

### 1. Boot the Web App Server
Open **PowerShell** and run:
```powershell
cd "C:\Users\rajar\.gemini\antigravity\scratch\aegis-bug-hunter"
powershell -ExecutionPolicy Bypass -File .\server.ps1
```
This will start the local HTTP server and automatically open Aegis in your browser at `http://localhost:8000/`.

### 2. Boot the Sandbox Browser (Required for Web Testing)
To use the **Web Tester**, Aegis needs to control Microsoft Edge via the Chrome DevTools Protocol (CDP).
Open a **second PowerShell window** and run:
```powershell
cd "C:\Users\rajar\.gemini\antigravity\scratch\aegis-bug-hunter"
powershell -ExecutionPolicy Bypass -File .\start_edge.ps1
```
This launches a debugged instance of Edge on port `9222`. Keep this Edge window open while running web tests!

---

## 🔑 Setup Gemini API Key (Free)

1.  Click **Settings** in the Aegis sidebar.
2.  Click the link to go to [Google AI Studio](https://aistudio.google.com/) and click **Create API Key**. It is completely free.
3.  Paste the key into settings and click **Save Configurations**. The status indicator in the bottom-left sidebar will change to **Gemini Online**.

---

## 🛠️ Key Features Guide

### 📂 Code Scanner
-   Go to **Dashboard**, click **Choose Local Folder**, select your codebase, and click **View files** to authorize read/write.
-   Click **Run Full Scan**. Aegis will audit files sequentially.
-   In the **Bug Hunter** tab, expand any bug to see the proposed code diff and click **Apply Fix** to write the correction directly back to your physical file!

### 🌐 E2E Web Tester
-   Go to **Web Tester** in the sidebar. (Ensure your Edge debugger is running; the banner will show **Browser Connected**).
-   Enter your **Website Link** (e.g. `http://localhost:3000` or `https://myproduct.com`) and your **Testing Goal**.
-   Click **Start Web Agent**. 
-   Watch the agent work in real-time! It will navigate, take screenshots, log console errors, click around, and report visual/functional bugs under **Bugs Discovered**.
