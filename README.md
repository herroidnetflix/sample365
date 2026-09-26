# Our Family — secure Netlify gallery

## Deploy

1. Keep this GitHub repository **PRIVATE** because `setup-assets/` contains the original family photos and MP3.
2. Connect the repo to Netlify.
3. In Netlify -> Project configuration -> Environment variables, create:
   - `FAMILY_USERNAME` = `Thumpati`
   - `FAMILY_PASSWORD` = your private password
4. For `FAMILY_PASSWORD`, enable **Contains secret values**.
5. Make sure both variables have the **Functions** scope. The "Available in local development" toggle is optional for local testing and can stay OFF.
6. Save the variables.
7. Trigger a **new deploy** after saving/changing environment variables. Function environment variables are injected at deploy time.
8. Open the deployed URL in an incognito window.

## Important
- Never put the password in HTML/JS or commit it to Git.
- Do not make the GitHub repo public.
- The username is `Thumpati`.
- The gallery media is served through an authenticated Netlify Function from the deploy-scoped Netlify Blob store named `family-private`.
- Session is explicitly logged out by the Logout control, with a one-year browser expiry as a security backstop.

## If login says "Incorrect username or password"
Check the exact keys:
`FAMILY_USERNAME`
`FAMILY_PASSWORD`

Then confirm the Functions scope is enabled and trigger a fresh deploy. Do not put quotes around the values.

If the login response says "Authentication is not configured", the deployed Function does not have the required environment variables; fix the scope/settings and redeploy.

## Media build
The build script uploads `setup-assets/photo-01.jpg` ... `photo-10.jpg` and `setup-assets/family.mp3` into the deploy's Netlify Blob store. They are not copied into `public/`.


## Login form behavior
The username field is intentionally blank. `Thumpati` is the configured server-side username, not a value embedded in the page. Browser autofill may still offer saved credentials depending on the browser; the form itself no longer pre-populates the username.

## Media storage
The build creates `.netlify/v1/blobs/deploy/family-private/` from `setup-assets/`. Netlify turns those files into a deploy-specific Blob store. The media Function reads the same deploy-specific store with `getDeployStore("family-private")`.
