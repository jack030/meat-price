# Publish Meat Pricing Calculator with GitHub Pages

GitHub Pages hosts this static React/Vite application; Docker and your Ubuntu server are not required.

## Publish using Git

1. Log in to https://github.com/new and create a **public**, **empty** repository named `meat-price` (do not initialize it with README/license/.gitignore).
2. Extract this ZIP and run the following commands **from inside the extracted `meat-price-github-pages` folder** (substitute your real GitHub username):

```bash
git init
git add .
git commit -m "Initial Meat Pricing Calculator"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/meat-price.git
git push -u origin main
```

If Git asks you to authenticate, use GitHub's browser/credential-manager flow or your configured SSH key. Never post a personal access token in a chat.

3. Go to the repository on GitHub: **Settings → Pages**. Under **Build and deployment**, set **Source: GitHub Actions**.
4. Visit **Actions**. The `Deploy Meat Price to GitHub Pages` workflow should execute when you push to `main`. If it ran before Pages was enabled, click **Run workflow** from its page to redeploy.
5. Your site will appear at `https://YOUR-USERNAME.github.io/meat-price/` when deployment finishes.

## What if my repository is named differently?

The deployment workflow automatically sets Vite's base URL to `/<repository-name>/` during a GitHub Actions build. Thus any normal GitHub project repository name works. The example above uses `meat-price`.

## Future updates

```bash
git add .
git commit -m "Update calculator"
git push
```

Every push to `main` triggers a new build and deployment.

## Test locally

```bash
npm install
npm test
npm run dev
```

## Important

- Do **not** upload just the ZIP file into the repository: GitHub Actions needs the **extracted project files**, including hidden `.github/workflows/deploy.yml`.
- Do **not** choose "Deploy from a branch". Choose **GitHub Actions** because Vite/React requires a build.
- GitHub Pages is public hosting. This app stores each user's settings in their **own browser's localStorage** and does not synchronize them between devices.
- For deployment to `/meat-price/` on your **Ubuntu IP**, use the separate Docker/Nginx configuration instead. GitHub Pages itself hosts at a `github.io` (or configured custom-domain) URL.
- The included `vite.config.js` defaults to `/meat-price/` for the Docker deployment. The GitHub Actions command overrides it dynamically with the repository name.
