# REMA Measurement Library — Netlify-only edition

React/Vite website with three main views: searchable library, public contribution form, and resource detail pages. Uses **Netlify Forms** for submission and optional PDF upload, **Netlify Functions** to read submissions through the Netlify API, and **Netlify Blobs** to store administrator hide/delete decisions. No Supabase or Cloudflare account needed.

## Deploy

1. Push the contents of this folder to a GitHub repository.
2. In Netlify, choose **Add new project → Import from Git**, select the repository and deploy. Build command `npm run build`, publish directory `dist`.
3. After the first deploy, Netlify should detect the hidden `rema-resources` form in `index.html`. Check **Forms** in your Netlify dashboard and enable form detection if necessary. Redeploy after enabling.
4. In Netlify, create a **personal access token** under user settings → Applications → Personal access tokens. Keep it secret. Find the `rema-resources` **form ID** in the Netlify dashboard or Netlify API.
5. Under **Project configuration → Environment variables**, add `NETLIFY_API_TOKEN`, `NETLIFY_FORM_ID`, and `REMA_ADMIN_PASSWORD` (choose a long, unique password). Redeploy. Do **not** prefix these variables with `VITE_`.
6. Test a contribution with a small PDF and/or a link. Check that the resource appears in Browse. Open `/#/admin` to test hiding and restoring it.

## Important limitations

- New submissions may take a short time to appear because Netlify processes the form before its API lists it. The public library fetches current entries when loaded or refreshed.
- Netlify Forms accepts a single file per upload field, with a **maximum of 8 MB for the entire submission**. This interface restricts PDFs to 5 MB to leave room for text fields. Use a link for larger files.
- PDF upload links returned by Netlify may have access restrictions; **test public downloads** with a non-admin browser before launch. If Netlify does not expose a usable public URL, PDFs will need an alternative public storage workflow. Do not assume private uploaded files are publicly accessible.
- Public submissions are displayed automatically; they are **not validated or endorsed**. Netlify's built-in spam detection is helpful but not foolproof. This version does not include dedicated CAPTCHA, rate limiting, or malware scanning. A public form with uploads carries abuse risks.
- Admin hide/restore/delete is a library visibility control. **Delete does not erase the underlying Netlify Forms submission or uploaded file.** To remove those permanently, delete the submission in the Netlify dashboard as well. If an item is already deleted there, it no longer appears in the library.
- The shared admin password is a lightweight convenience, not robust multi-user authentication. Use a strong password, avoid sharing it widely, and upgrade authentication if needed.
- The library fetches up to 1,000 latest submissions. Pagination/search should be revisited for a larger collection.
- Netlify Forms and function usage may incur costs based on plan and traffic.

## Development

Run `npm install`, `npm run build`, and `npx netlify dev` for local testing. A plain Vite dev server cannot emulate Netlify Forms or functions.
