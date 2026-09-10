# Publish Stoic V1

GitHub destination: `Coddiction-101/SideQuest`, branch `Main`, folder `Stoic`.

## Upload

On GitHub, open the existing `Stoic/` folder, then **Add file → Upload files**.
Drag the contents of the prepared upload folder onto the upload area and commit to `Main`.
Upload the files and folders themselves, not the ZIP file and not a second enclosing `Stoic` folder.

The result should include:

```text
SideQuest/
  Stoic/
    src/
    public/
    scripts/
    tests/
    .gitignore
    index.html
    package.json
    package-lock.json
    vercel.json
    README.md
    DEPLOY.md
```

The `scripts/` folder is required: it generates the app icons and offline service worker during the build.
Exclude `node_modules/`, `dist/`, `artifacts/`, `release/`, browser profiles, and local screenshots.

Replace the old GitHub README with this release's README. The app uses React, Vite, JavaScript, and CSS.

## Deploy with Vercel

1. Choose **Add New → Project** and import `Coddiction-101/SideQuest`.
2. Set **Root Directory** to `Stoic` (case-sensitive).
3. Use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | Stoic |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | dist |
| Node.js Version | 24.x |
| Production Branch | Main |
| Environment variables | None required |

4. Deploy. If needed, set the production branch to `Main` under the project's Git/environment settings.

The included `vercel.json` records the build settings and ensures browsers revalidate the service worker when checking for updates. Set Root Directory in Vercel; it is relative to the repository and is not the public URL path. Stoic will be served at your Vercel domain's `/`.

Sources: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [monorepo root directories](https://vercel.com/docs/monorepos), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## First live use

Open the resulting HTTPS production address and check all four sections. Add an item and refresh to verify saving. In App options, wait for **Ready for offline use**, then choose **Install Stoic**.

To move your existing data: export a backup from the localhost app, then restore it on the live site. Localhost and the deployed domain have separate browser storage. Install the live site if you want the hosted version in your app launcher.

When a newer release is ready, use **App options → Update app** if shown. No authentication, database, API key, or paid backend is needed for V1.
