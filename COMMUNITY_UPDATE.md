# REMA Community Update

Adds comments and helpful votes to each resource, using Netlify Functions and Netlify Blobs. No Supabase or Cloudflare required.

## Deployment
Upload the contents of this `rema-library` directory to the **root** of the existing GitHub repository, replacing files. Netlify will deploy automatically. Existing resource submissions remain in Netlify Forms. The existing `REMA_ADMIN_PASSWORD` environment variable is required for comment moderation.

## Notes and limitations
- Comments are stored in Netlify Blobs, not Netlify Forms. No extra form setup required.
- Honeypot and a 60-second per-visitor comment cooldown are implemented, but **there is no CAPTCHA**; determined spam can still get through.
- Anonymous votes are limited using a hashed visitor fingerprint, not verified identity; shared networks and device changes may cause false positives or repeat votes.
- Netlify Blobs uses read-modify-write operations here, so simultaneous submissions can overwrite one another. Before high-traffic public launch, use a transactional database or a serialized write mechanism.
- The admin dashboard has a basic 'Manage comments' prompt-driven control per resource.
- For full moderation, set `REMA_ADMIN_PASSWORD` as a Netlify Functions environment variable.
- Test a comment, vote, duplicate vote, and admin hide after deployment.
