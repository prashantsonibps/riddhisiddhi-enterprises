# Riddhi Siddhi Enterprises

A responsive speciality chemical website for Riddhi Siddhi Enterprises, South Delhi. A green-and-white supplier identity combines a centered ingredient hero, service benefits, application photography, a nine-product card catalogue, product details, and an enquiry builder.

## Local development

Requires Node.js 20 or newer. No dependencies, API keys, or backend services are needed.

```sh
npm run dev
npm run check
npm run build
```

Preview: http://127.0.0.1:3000. The production build is written to `dist/`. `vercel.json` configures this static output and the security headers used by the local preview.

## Company information

Details transcribed from the owner-supplied company image:

- Company: Riddhi Siddhi Enterprises
- Industry: Speciality Chemical
- Contact: Akash Kashyap
- Phone: +91 7786912354
- Email: ridhisidhient@gmail.com
- Address: D-2-A, Rama Vihar, North Point Block F, South Delhi, India
- GSTIN: 07AAVFR2945L1ZF
- Approximate turnover: ₹71–79 crore, explicitly labelled company-reported

The company spelling was clarified by the owner as Riddhi Siddhi Enterprises. The supplied email address remains ridhisidhient@gmail.com.

## Catalogue

Nine owner-specified ingredients: Sodium hyaluronate; Phenoxyethanol; Ethylhexylglycerin; Phenoxyethanol + ethylhexylglycerin blend; Ambroxide / Ambroxan; Iso E Super; Methyl dihydrojasmonate / Hedione; Galaxolide; Dipropylene Glycol (DPG).

`products.mjs` owns catalogue data and application mappings. `catalogue.mjs` shares escaped product-card rendering between the initial static content and browser filters. Descriptions are introductory; no fixed grade, pricing, stock, certifications, supplier affiliation, or delivery promise is implied. Exact specifications and current supplier documents are confirmed on enquiry.

## Enquiries

The website prepares messages for the visitor to review and send using email or WhatsApp. It does not send messages automatically or store personal form submissions. Only ingredient IDs and requested quantities persist in browser localStorage, under `riddhi-siddhi-enquiry`. Basket changes sync between tabs. Corrupt or outdated selections are filtered out. Long emails offer copy/download fallback. Downloads use formula-safe CSV encoding.

Floating WhatsApp and call buttons provide direct contact access throughout the page; labels appear on hover or keyboard focus. Their destinations match the company contact details.

`core.mjs` owns contact destinations and enquiry helpers. `index.html` contains static contacts, metadata, and a non-JavaScript product list. `policies.mjs` contains privacy and terms text. Update all of these if business details change.

## Design and media

The visual direction is forest green, white, and pale sage, with Manrope and DM Sans served locally. Font license files remain in `assets/fonts/`.

Logo: `assets/logo.svg`, an original flask-and-leaf mark with a reflective green glass finish, reused as the browser favicon. Imagery: `assets/speciality-banner.jpg`, `assets/personal-care.jpg`, `assets/chemistry-hero.jpg`, and `assets/ingredients-editorial.jpg`, generated using the built-in image-generation tool. These are illustrative images, not photographs of company facilities, inventory, or particular chemical grades. Full prompts and provenance are in `assets/IMAGE-NOTES.md`.

Motion includes a staged hero entrance, slow image settling, scroll reveals, and application/product hover effects. The floating liquid-glass navigation has inline destination icons, a shared selection lens that follows hover and keyboard focus, a compact scroll state, and a glass dropdown below 1001px. Opaque fallbacks keep the controls readable where backdrop blur is unavailable. The three hero speciality selectors update the headline and filter the catalogue without an autoplay timer. Reduced-motion preferences disable animations, transforms, and smooth scrolling. Mobile navigation, dialogs, forms, and focus states support keyboard use.

Reference reviewed: https://www.specialitychemicals.in/ for application-led navigation and a direct supply enquiry journey. Layout, imagery, brand identity, and copy were created for Riddhi Siddhi. No reference-company claims or contact details were reused.

## Verification and deployment

`npm run check` verifies enquiry validation, current contact destinations, ingredient coverage, malformed storage, Unicode escaping, long email handling, and CSV safety. `npm run build` checks asset references, duplicate IDs, navigation targets, and organization metadata.

Import `prashantsonibps/riddhisiddhi-enterprises` into Vercel, select the `main` production branch, and use the repository root. The committed `vercel.json` specifies framework `null` (Other), build command `npm run build`, and output directory `dist`. The project has no runtime dependencies, secrets, or environment-variable requirements. `package-lock.json` is included for repeatable installs; `.vercelignore` excludes local review artifacts and scratch files. Set the canonical URL and an absolute social-preview image URL when the production domain is selected. No production domain has been assumed. Local intermediates (`work/`) and user-facing review artifacts (`outputs/`) are ignored by Git.
