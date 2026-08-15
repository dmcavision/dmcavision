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

No secrets are required for the static site. The contact form currently validates in the browser and is prepared for a future API or form-service integration.
