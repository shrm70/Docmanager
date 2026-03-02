# System Overview

- Frontend: React + TypeScript + Vite on GitHub Pages
- Backend: API for auth, translation proxying, exports, and sync orchestration
- Worker: background jobs for variant sync, translations, thumbnails, and export generation
- Storage: canonical rich document plus derived `en`, `ne-unicode`, and `ne-preeti` variants
