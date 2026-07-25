---
name: DRID Proposal Portal
description: A warm, reassuring academic research-funding portal for the University of Benin (DRID).
colors:
  aubergine: "#6d035c"
  aubergine-deep: "#4a0340"
  aubergine-darkest: "#37012f"
  gold-antique: "#b8860b"
  gold-warm: "#e9c96b"
  gold-pale: "#f3e7d0"
  paper: "#faf7fc"
  ink: "#2b1229"
  ink-muted: "#6b5566"
  mauve-placeholder: "#a48fa0"
  surface: "#ffffff"
  border-soft: "#e6d9e6"
  border-input: "#e0d3e0"
  divider: "#ecdfec"
  success-ink: "#1f5b34"
  success-bg: "#f2faf3"
  success-border: "#cfe6d4"
  danger: "#b91c1c"
  danger-bg: "#fef2f2"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  input: "0.5rem"
  card: "1rem"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.5rem"
  lg: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.aubergine}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
  button-primary-hover:
    backgroundColor: "{colors.aubergine-deep}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.aubergine-deep}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0.625rem 0.75rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  chip:
    backgroundColor: "{colors.gold-pale}"
    textColor: "{colors.aubergine-deep}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
---

# Design System: DRID Proposal Portal

## Overview

**Creative North Star: "The Warm Registrar"**

This is the digital front desk of a university research office. It should feel like a calm, well-lit room where a helpful registrar walks a nervous first-time applicant through their submission — warm, human, and quietly authoritative, never sterile or "SaaS-generic." The system is built on a deep aubergine drawn from academic regalia, warmed by antique gold and set on a soft lilac-tinted paper. Serifs (Fraunces) carry the voice at headline moments; a clean sans (Geist) does the working typography so forms stay legible and fast.

The same warmth must reach every corner of the product — the public submission pages, the researcher dashboard, the reviewer workspace, and the admin console — so a user never feels they've crossed from a "designed" marketing page into a raw internal tool. Depth is gentle and tinted, not a hard drop shadow. Color is used with restraint: the aubergine leads, gold accents sparingly, and greens/reds appear only to signal success or error.

Explicitly rejected: the stock shadcn blue-gray theme, generic `purple-600`/`purple-800` Tailwind ramps, untinted `gray-*` neutrals, hard black-on-white, and the purple→blue gradient look of AI-generated dashboards.

**Key Characteristics:**
- Deep aubergine primary with antique-gold accents on a lilac-tinted paper ground.
- Fraunces serif for headlines; Geist sans for all working text.
- Pill-shaped primary actions, softly rounded cards, gently tinted shadows.
- Restraint: one dominant color voice, sparse gold, semantic green/red only.

## Colors

A warm academic palette: regal aubergine, antique gold, and a lilac-tinted paper — never cold blue-gray.

### Primary
- **Aubergine** (`#6d035c`): The core brand color. Primary buttons, active nav, links, focus rings, selected states, and key headings. This is the system's single dominant voice.
- **Aubergine Deep** (`#4a0340`): Hover/pressed state for aubergine surfaces, section headings, and the darker stop of the header gradient.
- **Aubergine Darkest** (`#37012f`): The top of full-bleed hero gradients only.

### Secondary
- **Antique Gold** (`#b8860b`): The accent voice — small emphasis marks, eyebrow rules, active underlines, and iconography that needs to feel "official." Used sparingly.
- **Warm Gold** (`#e9c96b`): Eyebrow/label text sitting on a dark aubergine band.
- **Pale Gold** (`#f3e7d0`): Chip/badge fills and faint highlights.

### Neutral
- **Paper** (`#faf7fc`): The default page background — a lilac-tinted off-white, never pure white or gray-50.
- **Surface** (`#ffffff`): Cards and inputs sit on white above the paper ground.
- **Ink** (`#2b1229`): Primary body text — a warm near-black tinted toward aubergine, never `#000`.
- **Ink Muted** (`#6b5566`): Secondary text, helper copy, captions.
- **Mauve Placeholder** (`#a48fa0`): Input placeholder text.
- **Border Soft** (`#e6d9e6`) / **Border Input** (`#e0d3e0`) / **Divider** (`#ecdfec`): Tinted hairlines for cards, inputs, and section rules.

### Tertiary (semantic only)
- **Success** — ink `#1f5b34`, bg `#f2faf3`, border `#cfe6d4`: confirmation cards and success toasts.
- **Danger** — `#b91c1c` on bg `#fef2f2`: validation errors and destructive confirmation.

### Named Rules
**The One Voice Rule.** Aubergine is the only brand color that leads. Gold is an accent used on ≤10% of a screen; green and red appear *only* to mean success or error. If a screen has more than one "hero" color, it's wrong.

**The No-Stock-Purple Rule.** Never use Tailwind's `purple-*`, `violet-*`, `indigo-*`, or `blue-*` utilities, and never the default shadcn blue-gray tokens. Warmth comes from the exact aubergine/gold hexes (or the CSS tokens that hold them), not a generic purple ramp.

## Typography

**Display Font:** Fraunces (with Georgia, serif fallback) — via the `font-serif` utility.
**Body Font:** Geist (with system-ui sans fallback) — the default sans.

**Character:** Fraunces brings a literary, slightly old-world warmth to headline moments; Geist keeps the dense form and table work crisp and neutral. The contrast between the two is the point — serif for voice, sans for work.

### Hierarchy
- **Display** (Fraunces, 600, `clamp(1.75rem,3.5vw,2.5rem)`, line-height 1.1): Page/hero titles inside gradient bands. `font-serif`.
- **Headline** (Fraunces, 600, ~1.25rem): Card titles and major section headers. `font-serif`.
- **Title** (Geist, 600, 1rem, tracking-tight): Sub-section headers like "Basic Information", table group headers.
- **Body** (Geist, 400, 0.875rem, line-height 1.6): All form fields, paragraphs, table cells. Cap prose at ~65–75ch.
- **Label** (Geist, 600, 0.75rem, letter-spacing 0.16em, UPPERCASE): Eyebrows and metadata tags, e.g. "TETFund IBR · Concept Note".

### Named Rules
**The Serif-For-Voice Rule.** Fraunces is reserved for display and headline moments (hero titles, card titles). Never set body copy, form labels, table cells, or buttons in the serif — that's Geist's job.

## Layout

Content lives in a centered column: `container mx-auto px-4` with a `max-w-4xl` reading measure for forms and single-record views, widening to `max-w-6xl`/`max-w-7xl` for admin tables and dashboards. Vertical rhythm is generous — `py-8` page padding, `mb-8` between form sections, `gap-6` within grids. Forms use a `grid grid-cols-1 md:grid-cols-2 gap-6` on desktop, collapsing to a single column on mobile. Density rises in admin tables but the tinted paper ground and hairline dividers keep them calm.

## Elevation & Depth

Depth is soft, diffuse, and **aubergine-tinted** — never a hard neutral drop shadow. Cards rest on the paper ground with a subtle tinted glow and a hairline border doing most of the separation work.

### Shadow Vocabulary
- **Card ambient** (`box-shadow: 0 20px 60px -40px rgba(109,3,92,0.5)`): The signature diffuse aubergine glow under primary cards.
- **Input rest** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`): The default `shadow-sm` on inputs.

### Named Rules
**The Tinted-Shadow Rule.** Shadows carry a trace of aubergine, never pure black. Borders (tinted hairlines) do the primary separating; shadows only add lift.

## Shapes

A friendly, rounded form language. Inputs and small surfaces use `rounded-lg` (0.5rem); cards and panels use `rounded-2xl` (1rem); primary buttons, chips, and badges are fully pill-shaped (`rounded-full`). Separation between sections is a tinted hairline (`border-b border-[#ecdfec]`), not a heavy rule. Corners are never sharp (0px) except full-bleed gradient bands that meet the card edge.

## Components

### Buttons
- **Shape:** Fully pill-shaped (`rounded-full`).
- **Primary:** Aubergine fill `#6d035c`, white text, `px-7 py-3`, `text-sm font-semibold`.
- **Hover / Focus:** Darkens to `#4a0340`; focus ring `ring-2 ring-[#6d035c]/30 ring-offset-2`.
- **Secondary/Ghost:** White (or transparent) fill, aubergine-deep text, same pill + padding; used for "Clear form", "Cancel", "Back".
- **Destructive:** Danger `#b91c1c` fill or text; only for delete/reject actions.

### Chips / Badges
- **Style:** Pill; pale-gold `#f3e7d0` fill with aubergine-deep text for neutral tags; on a dark band, `bg-white/10` with `ring-1 ring-white/20`.
- **State:** Status badges map to semantics — success green, danger red, pending gold, neutral aubergine-tint.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (1rem).
- **Background:** White surface (or `bg-white/80`) on the paper ground.
- **Shadow Strategy:** The card-ambient tinted glow (see Elevation).
- **Border:** Tinted hairline `border border-[#e6d9e6]`.
- **Internal Padding:** `p-6` to `p-7`.
- **Header band (optional):** A `bg-gradient-to-br from-[#4a0340] to-[#6d035c] text-white` band with an uppercase gold eyebrow and a serif title.

### Inputs / Fields
- **Style:** White fill, `rounded-lg`, tinted border `border-[#e0d3e0]`, `px-3 py-2.5 text-sm text-[#2b1229]`, `shadow-sm`, placeholder `text-[#a48fa0]`.
- **Focus:** Border shifts to aubergine `#6d035c` with `ring-2 ring-[#6d035c]/20`.
- **Error:** Border `#b91c1c`; message in danger red with an inline `AlertCircle` icon.
- **Disabled:** Reduced opacity; used for dependent selects (e.g. Department before Faculty).

### Navigation
- **Style:** Context-aware top header with the DRID `logo-header.png` icon; links in Geist. Default state ink-muted, hover/active aubergine. On mobile, labels shorten (e.g. "Staff", "Master's").
- **Admin/dashboard sidebar:** Aubergine-family surface; active item marked with an aubergine fill or gold left-rule, not a blue highlight.

### Section Header (signature)
An uppercase, aubergine-deep `text-base font-semibold tracking-tight` label with a tinted bottom divider (`pb-2 border-b border-[#ecdfec]`). Used to open each form/section block.

## Do's and Don'ts

### Do:
- **Do** ground every page in paper `#faf7fc` with white cards on top.
- **Do** use the exact aubergine/gold hexes (or the shared CSS tokens holding them) for all brand color.
- **Do** set headline/hero titles in `font-serif` (Fraunces) and everything else in Geist.
- **Do** make primary actions pill-shaped aubergine buttons with the `#4a0340` hover.
- **Do** convey status with the semantic green/red/gold, and keep the aubergine as the single lead voice.
- **Do** carry the tinted card shadow + hairline border pattern into admin/reviewer/researcher screens, not just the public pages.

### Don't:
- **Don't** use Tailwind `purple-*`, `violet-*`, `indigo-*`, `blue-*`, or the default shadcn blue-gray tokens anywhere — replace them with the aubergine/gold system.
- **Don't** use untinted `gray-*` for large surfaces or body text; use paper/ink/ink-muted/mauve instead. (Pure gray is acceptable only for truly neutral element chrome like a file-drop dashed border.)
- **Don't** use pure black `#000` text or pure-neutral hard drop shadows.
- **Don't** introduce a second competing brand color or a multi-hue gradient; one aubergine voice, gold accent only.
- **Don't** set body text, labels, buttons, or table content in the serif.
