# Aegis AI Bug Hunter - Deployment Guide 🌐

Since Aegis is a zero-dependency client-side application, it can be deployed to any static web hosting provider for **100% free**. 

Here are the step-by-step instructions for the easiest free hosting options:

---

## Option 1: GitHub Pages (Recommended)

GitHub Pages is built into GitHub and hosts static sites for free.

1. **Initialize a Git repository** in your project folder:
   Open PowerShell and run:
   ```powershell
   cd "C:\Users\rajar\.gemini\antigravity\scratch\aegis-bug-hunter"
   git init
   git add .
   git commit -m "Initial commit of Aegis Bug Hunter"
   ```
2. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Name it `aegis-bug-hunter` (keep it public or private).
   - Click **Create repository**.
3. **Push your code**:
   - Copy the commands shown on GitHub to push an existing repository:
     ```powershell
     git remote add origin https://github.com/YOUR_USERNAME/aegis-bug-hunter.git
     git branch -M main
     git push -u origin main
     ```
4. **Enable GitHub Pages**:
   - In your GitHub repository, go to **Settings** > **Pages** (under Code and automation).
   - Under **Build and deployment**, set the source to **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)`, then click **Save**.
   - Wait 1-2 minutes. GitHub will provide a link like `https://YOUR_USERNAME.github.io/aegis-bug-hunter/`.

---

## Option 2: Netlify (Drag & Drop)

Netlify is incredibly fast and requires no command-line setups.

1. Open your browser and go to [app.netlify.com](https://app.netlify.com/). Log in or create a free account.
2. Open Windows File Explorer and navigate to the project directory:
   `C:\Users\rajar\.gemini\antigravity\scratch\`
3. Drag the folder `aegis-bug-hunter` and drop it into the Netlify dashboard's **"Drag and drop your site folder here"** upload box.
4. Netlify will deploy it in seconds and give you a free, public URL (e.g., `https://glowing-space-aegis.netlify.app`).

---

## Option 3: Vercel (Instant Deploy)

Vercel is another excellent free platform for static websites.

1. Go to [vercel.com](https://vercel.com/) and sign up for a free Hobby account.
2. Connect your GitHub account.
3. Import the `aegis-bug-hunter` repository you created in Option 1.
4. Click **Deploy**. Vercel will build and serve your app at a free domain (e.g., `https://aegis-bug-hunter.vercel.app`).

---

> [!IMPORTANT]
> **API Key Safety**: When hosting Aegis publicly on GitHub Pages, Netlify, or Vercel, **do not hardcode your Gemini API Key in the files**. Your API key is stored only in the browser's local storage (`localStorage`) of whoever is using the page. It is completely safe to deploy the app publicly, as other visitors will use their own local storage and keys.
