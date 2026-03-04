# BI Dashboard (React + Vite)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Deployment (Vercel)

Deploy with **Vercel** (one project). The app works with or without the AI validation feature.

**Without the AI agent (simplest):**

- Deploy as usual (connect repo, build: `npm run build`, output: `dist`). Do **not** set `OPENROUTER_API_KEY`.
- To hide the “Vérifier avec l’IA” button entirely, add in Vercel **Environment Variables**:
  - `VITE_HIDE_AI_VALIDATION` = `true`
- Everything else (ventes, achats, marge, import, add row) works normally.

**With the AI agent:**

1. In **Project → Settings → Environment Variables**, add:
   - `OPENROUTER_API_KEY` = your [OpenRouter](https://openrouter.ai) API key.
2. Do **not** set `VITE_HIDE_AI_VALIDATION` (or set it to `false`).

The `/api` folder is deployed as serverless functions. The frontend calls `/api/validate-import` for AI checks; the key stays on the server.

### AI validation in local dev

To use **"Vérifier avec l'IA"** locally without `vercel dev`, add in `.env` at project root:

- `VITE_OPENROUTER_API_KEY` = your OpenRouter key

The app will call OpenRouter from the browser when the serverless API is unavailable. Do not commit `.env`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
