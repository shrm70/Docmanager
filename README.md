# DocManager

DocManager is a web-first document studio scaffold for rich document editing, Nepali script workflows, translation, and multi-variant document storage.

## Current state

- Monorepo scaffold for `web`, `api`, `worker`, and shared packages
- Deployable frontend shell configured for GitHub Pages at `/Docmanager/`
- Editor studio layout with two top ribbons, left navigation pane, central document canvas, and right properties panel
- Local autosave, gallery, page thumbnails, search, and variant sync status
- File-based API persistence with document and job storage
- Worker loop for queued variant sync jobs
- Optional shared-token auth gate for protecting the live API and editor access
- Real `Preeti <-> Unicode` conversion package backed by tested libraries
- Architecture docs for Unicode master storage, Preeti support, translation, and admin sync

## Commands

```bash
npm install
npm run dev:web
npm run dev:api
npm run dev:worker
npm run build
npm run test:nepali
```

## Local services

- Frontend: `npm run dev:web`
- API: `npm run dev:api`
- Worker: `npm run dev:worker`
- API default URL: `http://127.0.0.1:8787`

## Implemented backend endpoints

- `GET /health`
- `GET /api/auth/status`
- `POST /api/auth/session`
- `GET /api/config`
- `GET /api/documents`
- `GET /api/documents/:documentId`
- `POST /api/documents`
- `PUT /api/documents/:documentId`
- `POST /api/documents/:documentId/sync`
- `GET /api/jobs`
- `POST /api/conversion/detect`
- `POST /api/conversion/preeti-to-unicode`
- `POST /api/conversion/unicode-to-preeti`
- `POST /api/translation/translate`

## Translation

The API supports `mock`, `google`, `azure`, and `deepl` provider modes. Without a real key, translation returns mock output so the rest of the workflow can be developed safely.

## Access control

Set `DOCMANAGER_ACCESS_TOKEN` in the API environment when you want the live deployment to require a shared access token.

Example:

```bash
openssl rand -hex 32
```

Then put that value in `/home/docmanager/docmanager/.env`:

```bash
DOCMANAGER_ACCESS_TOKEN=your-generated-token
```

After updating the env file, restart services:

```bash
sudo systemctl restart docmanager-api docmanager-worker
```

The frontend will show a login screen automatically when the backend reports that auth is required.

## GitHub Pages target

The frontend is already configured for:

`https://shrm70.github.io/Docmanager/`

I could not publish it from this machine because there is no GitHub CLI, no remote configured, and no authenticated GitHub session in the workspace. Once credentials are available, the repository is ready for a `Docmanager` remote and the Pages workflow in `.github/workflows/deploy-pages.yml`.
