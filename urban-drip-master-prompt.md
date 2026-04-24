# Urban Drip — Full Stack Build Prompt

Copy everything below the line and paste it as your first message when starting a new Claude conversation (or in VS Code with Claude extension). Attach the `urban-drip-project-blueprint.md` file along with this prompt.

---

## PROMPT START — COPY FROM HERE ↓

You are building a full-stack e-commerce application for **Urban Drip** (urbandrip.net) — an Indian anime streetwear, gymwear, and sports clothing brand. I've attached the complete project blueprint (`urban-drip-project-blueprint.md`) — read it fully before proceeding.

### Project context

- **Brand:** Urban Drip — "Wear the legend. Live the drip."
- **Verticals:** Anime streetwear (Itachi, Vegeta, Akatsuki, etc.), Gymwear & activewear, Pickleball sports clothing
- **Target:** Gen Z / millennials in India, mobile-first audience
- **This replaces Shopify entirely** — we're building a fully independent platform

### Tech stack (finalized)

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (Route Handlers) — no separate server
- **Database:** PostgreSQL via Supabase (free tier)
- **Auth:** Supabase Auth (email + Google + phone OTP)
- **Payments:** Razorpay (UPI, cards, net banking — 2% per txn)
- **Images:** Cloudinary (auto-optimization, CDN, free 25 GB) — NOT Supabase Storage (it lags)
- **Shipping:** Shiprocket API (label generation, tracking, rate calculation)
- **Deployment:** Vercel (frontend + API routes) + Supabase (DB + auth)
- **Total monthly cost:** ₹0/mo to start

### What to build (in order)

Follow the 6-phase build plan from the blueprint. Start with Phase 1 (foundation) and proceed sequentially. For each phase:

1. **Generate production-ready code** — not pseudocode or snippets. Full working files I can paste into VS Code.
2. **Use TypeScript strictly** — proper interfaces, no `any` types.
3. **Follow the exact project structure** from the blueprint — `app/`, `components/`, `lib/`, `hooks/`, `types/`.
4. **Mobile-first responsive design** — 80%+ of Indian e-commerce traffic is mobile.
5. **Dark theme** — black/charcoal backgrounds, anime-inspired bold typography, high contrast. Use the design system colors from the blueprint.
6. **SEO built-in** — proper meta tags, JSON-LD, semantic HTML on every page.

### Design direction

- **Theme:** Dark, anime-inspired, Japanese streetwear aesthetic
- **Fonts:** Bebas Neue / Oswald for headings, DM Sans / Plus Jakarta Sans for body
- **Style:** Sharp angles, bold type, glitch hover effects, neon accents on dark backgrounds
- **Mobile UX:** Bottom navigation, smooth transitions, touch-friendly controls
- **Social proof:** Show ratings, order count badges, trending indicators
- **No generic AI look** — this should feel like a premium streetwear brand, not a template

### Database schema

The complete SQL schema is in the blueprint. Use it exactly. Tables: `profiles`, `products`, `product_variants`, `addresses`, `orders`, `order_items`, `reviews`, `loyalty_transactions`, `cart_items`.

### Pricing rules

- Regular fit (6 sizes: XS, S, M, L, XL, 2XL): ₹499 / MRP ₹999
- Oversized (5 sizes: S, M, L, XL, 2XL): ₹599 / MRP ₹1,299
- Default stock: 100 units per size variant

### Integration details

- **Razorpay:** Create order → checkout popup → webhook verification → mark paid
- **Cloudinary:** Upload high-res → serve auto-optimized WebP via URL transforms
- **Shiprocket:** Auto-create shipment on order confirm → generate AWB → tracking
- **Loyalty:** 1 point per ₹10 spent, 100 points = ₹50 discount, 50 bonus on first order

### How to work with me

- I'll tell you which phase/component to build next
- Generate complete, working files — I'll paste them into my VS Code project
- If a file is long, break it into logical sections but give me the full code
- After each phase, I'll test and report issues for you to fix
- Don't web search for anything — use the blueprint and your knowledge
- When I say "next", move to the next component in the current phase

### Let's start

Begin with **Phase 1: Foundation**. Give me:
1. The terminal commands to initialize the Next.js project with all dependencies
2. `tailwind.config.ts` with the Urban Drip design system
3. `app/globals.css` with custom styles
4. `lib/supabase/client.ts` and `lib/supabase/server.ts`
5. `lib/cloudinary.ts`
6. `lib/razorpay.ts`
7. `types/index.ts` with all TypeScript interfaces
8. `middleware.ts` for auth protection
9. `.env.local` template

Generate each file completely. Let's build this.

## PROMPT END — COPY UP TO HERE ↑
