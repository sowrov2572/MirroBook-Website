# MirrorBook Website Improvement Prompt

You are improving the existing production website for MirrorBook, a Bangladesh-based remote creative agency and digital solutions studio.

## Project context
- Production website: https://mirrorbook.site/
- GitHub repository: sowrov2572/MirroBook-Website
- Production branch: main
- Stack: React 19, TypeScript, Vite, Tailwind CSS v4, Bun, Firebase, Vercel serverless API routes.
- Brand line: “Reflecting Creativity”.
- Visual identity: minimal, premium, dark charcoal/black, white, and signature lemon-lime green (#B7F34A).
- Core services: graphic design, social media creatives, video editing, reels/short-form editing, motion graphics, animation, branding, digital marketing, and web development.
- Other existing business areas include MirrorPOS, creative plugins/software, courses, customer accounts, checkout, admin tools, Firebase authentication, order handling, and payment webhooks.

## Main objective
Improve the website's ability to convert international and Bangladeshi visitors into qualified project inquiries while improving search clarity, accessibility, performance, mobile usability, and trust.

## Design direction
1. Preserve MirrorBook's existing brand identity and recognizable visual language.
2. Make the site feel like a credible, modern creative production partner for brands, e-commerce businesses, agencies, and growing companies.
3. Prioritize clear service positioning, useful hierarchy, readable typography, and direct calls to action.
4. Keep mobile layouts fast, uncluttered, touch-friendly, and easy to navigate.
5. Do not introduce unnecessary animations, generic AI-looking visuals, busy gradients, or decorative UI that weakens clarity.
6. Do not generate or add AI images. Reuse only existing, verified brand and portfolio assets.

## Content and trust rules
1. Never invent clients, client logos, testimonials, case studies, project counts, audience reach, delivery guarantees, conversion rates, awards, or performance statistics.
2. Remove or replace any unsupported numerical claims with honest service/value statements unless the owner provides evidence.
3. Do not imply that a particular client, project, result, or partnership exists unless it is already verifiable in the repository or approved content.
4. Use natural, professional English suitable for international clients. Explain that remote collaboration is available without pretending that MirrorBook has offices or clients in every target country.
5. Make service descriptions concrete: what the service includes, who it helps, and what the visitor should do next.
6. Keep pricing, timelines, packages, and guarantees unchanged unless explicitly confirmed by the owner.

## SEO and discoverability
1. Improve homepage title and meta description around the actual services and international remote collaboration.
2. Keep canonical URLs, Open Graph metadata, Twitter metadata, robots directives, and JSON-LD consistent.
3. Use accurate Organization and WebSite structured data. Do not add fake ratings, reviews, addresses, or business facts.
4. Keep the XML sitemap and robots.txt valid and aligned with public routes.
5. Ensure page headings are semantic and descriptive, with one clear primary H1 per route.
6. Avoid keyword stuffing, duplicate titles, misleading location claims, and metadata that describes products not relevant to the page.
7. Preserve noindex directives for customer account and admin routes.

## Conversion and UX
1. Make the primary “Start a Project” path easy to find on desktop and mobile.
2. Explain the next step for inquiries clearly. Do not create a form that silently discards data or invent a new backend.
3. Ensure service cards, navigation, portfolio links, and CTAs work on both desktop and mobile.
4. Make external links safe with appropriate target and rel attributes.
5. Keep portfolio links clean and remove tracking parameters that are not necessary for the visitor.
6. Maintain keyboard accessibility, visible focus states, descriptive alt text, sufficient contrast, and reduced-motion support.

## Engineering safety
1. Inspect the existing implementation before editing. Prefer small, focused, maintainable changes.
2. Preserve all existing working features: Firebase auth, customer/admin role separation, Firestore rules, payment and order APIs, SMTP email routes, software downloads, MirrorPOS licensing, course access, and admin functions.
3. Do not expose secrets, environment variables, service account data, API keys, or private customer data.
4. Do not modify backend payment/auth/security behavior as part of a visual/SEO refresh unless a verified defect requires it and the change is separately reviewed.
5. Avoid adding dependencies unless essential.
6. Respect the current Vite + Bun setup and Vercel deployment configuration.
7. Keep TypeScript types correct and avoid weakening type safety.
8. Run the existing build and lint/type-check commands where a runtime is available. Inspect the final diff for accidental deletions or security regressions.
9. Never overwrite existing user content or assets without a clear reason.

## Required delivery
- Summarize the issues found with evidence from the current code.
- Implement only verified, low-risk improvements.
- List changed files and explain each change.
- Report build/lint results accurately.
- Deploy through the existing Vercel project connected to this repository, then verify the production deployment and https://mirrorbook.site/.
- If Google AI Studio is not actually connected or cannot be controlled through an available integration, state that plainly. Do not claim to have opened or operated it.
