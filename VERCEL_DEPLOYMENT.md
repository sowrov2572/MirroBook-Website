# Vercel deployment rules

## API routes and Hobby plan limit

This project intentionally exposes exactly one Vercel API entrypoint: `api/[...path].ts`.
The implementation handlers live under `api/_handlers/`. Vercel ignores underscore-prefixed directories during API route discovery, so these files do not become independent serverless functions.

When adding an API endpoint:
1. Add the implementation under the appropriate `api/_handlers/` subfolder.
2. Register the public path in `api/[...path].ts`.
3. Do not add a new public `.ts`/ `.js` file under `api/`, because it can create another Vercel Function and exceed the Hobby plan limit.
4. Keep local Vite development routing in sync where needed.

## Before deploying AI Studio changes

After exporting changes from Google AI Studio, create a branch or pull request. GitHub Actions checks:
- API entrypoint count/layout
- TypeScript type-check
- Production Vite build

Do not merge a change while these checks fail. Vercel Preview should be tested before production is updated.
