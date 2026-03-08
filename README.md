# Interactive Stats Textbook (Next.js + MDX)

Public, no-login interactive textbook app with MDX lessons and embedded React demos.

## Features

- Home page with module cards + tagline
- Modules index page
- Dynamic lesson route: `/modules/[slug]`
- MDX lessons loaded by slug from `content/modules/*.mdx`
- Reusable `ConceptDemo` pattern (controls, charts, interpretation)
- `QuickCheck` MCQ component with instant session-only feedback
- Lessons included:
  - `sampling-clt.mdx` with `SamplingCLTDemo`
  - `law-large-numbers.mdx` with `LawOfLargeNumbersDemo`
  - `confidence-intervals.mdx` with `ConfidenceIntervalDemo`
  - `p-hacking.mdx` with `PHackingDemo`
  - `meta-analysis.mdx` with `MetaAnalysisDemo`
  - `bayesian-diagnostic-inference.mdx` with `BayesianDiagnosticDemo`
  - `hypothesis-testing.mdx` with `HypothesisTestingDemo`
  - `regression.mdx` with `RegressionDemo`
  - `anova-family.mdx` with `AnovaFamilyDemo`
  - `efa.mdx` with `EFADemo`
  - `multilevel-modeling.mdx` with `MultilevelModelingDemo`
  - `composite-measures.mdx` with `CompositeMeasuresDemo`

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000/learnstats](http://localhost:3000/learnstats).

## Deploy Under `braindynamicslab.com/learnstats`

This app is configured with Next.js `basePath: "/learnstats"` in `/Users/dmor625/Documents/New project/next.config.mjs`.

1. Build and run the app on your server:

```bash
npm install
npm run build
npm run start
```

2. Reverse-proxy only `/learnstats` traffic to this app (example Nginx):

```nginx
server {
  server_name braindynamicslab.com;

  location /learnstats/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

3. Link from your main site/apps to:
- `https://braindynamicslab.com/learnstats`
- `https://braindynamicslab.com/learnstats/modules`

## Structure

- `app/` Next.js routes
- `content/modules/` lesson MDX files
- `components/` interactive + MDX components
- `lib/` module metadata, MDX loader, RNG + stats helpers
