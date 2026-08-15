# DMCA Vision

Production-ready static Astro website for DMCA Vision LLC.

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Astro (typically `http://localhost:4321`).

## Production build

```bash
npm run build
```

The static production output is generated in `dist/`. To preview it locally, run `npm run preview`.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Vercel should detect Astro automatically. If prompted, use `npm run build` as the build command and `dist` as the output directory.
3. Deploy the project.
4. In **Project Settings → Domains**, add `dmcavision.com` and `www.dmcavision.com`.
5. Follow Vercel’s DNS instructions for the domain.
6. Set `dmcavision.com` as the primary domain and configure `www.dmcavision.com` to redirect to it.

The marketing site remains statically generated. Its contact form posts to the standalone Vercel Function at `api/contact.ts`.

## Contact Form Backend

The infringement-review form uses [Resend](https://resend.com) to deliver an internal notification and a confirmation email. You need a Resend account, an API key, and a sending domain verified in Resend before production mail can be delivered.

Copy `.env.example` to `.env.local` for local Vercel testing and supply your own values:

```text
RESEND_API_KEY=
CONTACT_TO_EMAIL=contact@dmcavision.com
CONTACT_FROM_EMAIL=DMCA Vision <notifications@notify.dmcavision.com>
```

- `RESEND_API_KEY` is the server-only Resend API key.
- `CONTACT_TO_EMAIL` receives internal infringement-review notifications.
- `CONTACT_FROM_EMAIL` must use a sender/domain authorized in Resend. The submitter’s address is used only as Reply-To.

Never prefix these variables with `PUBLIC_`, expose them to browser code, or commit populated environment files.

### Local development

`npm run dev` remains available for normal frontend work. Because Astro serves the marketing site statically and does not emulate the standalone root-level Vercel Function, use Vercel’s project-local CLI for an end-to-end form test:

```bash
npx vercel dev
```

The Vercel CLI can load `.env.local`. That file is ignored by Git. Automated validation and failure-path tests do not require real credentials or send email:

```bash
npm test
```

### Vercel configuration

1. Verify `notify.dmcavision.com` or the selected sending domain in Resend.
2. Add `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` under **Project Settings → Environment Variables**.
3. Configure the values for Production and any Preview environments used for form testing.
4. Redeploy after changing environment variables.
5. Submit a controlled production request and confirm both the internal notification and submitter confirmation arrive as expected.

No credentials are stored in the repository. The endpoint accepts JSON only, validates all fields server-side, checks allowed browser origins, limits request size, and does not accept file uploads.
