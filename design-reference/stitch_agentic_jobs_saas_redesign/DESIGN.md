---
name: Agentic Precision
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c1cab0'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#8b947d'
  outline-variant: '#424936'
  surface-tint: '#91db2a'
  primary: '#9ee939'
  on-primary: '#1f3700'
  primary-container: '#84cc16'
  on-primary-container: '#315200'
  inverse-primary: '#416900'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#5fedb0'
  on-tertiary: '#003824'
  tertiary-container: '#3cd096'
  on-tertiary-container: '#005438'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acf847'
  primary-fixed-dim: '#91db2a'
  on-primary-fixed: '#102000'
  on-primary-fixed-variant: '#304f00'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-score:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.02em
  code-meta:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes an ultra-refined, professional, and deterministic interface for autonomous job discovery, resume intelligence, and executive career pipelines. Drawing aesthetic discipline from Linear, Stripe, and Notion, the visual philosophy rejects superficial AI clichés—strictly eliminating generic sparkle icons, pulsating halos, blurred neon gradients, and floating decorative blobs.

Instead, intelligence is communicated through mathematical density, micro-typography, surgical border execution, and low-latency tactical layouts. The emotional tone evokes calm mastery, executive clarity, and programmatic reliability. The platform presents career data not as speculative matchmaking, but as transparent, verifiable telemetry.

## Colors

The palette relies on a balanced neutral canvas with selective, high-contrast focal points. While default light tokens are available for daylight workflows, the core environment defaults to an engineered, low-strain dark state.

### Core Architecture
- **Backgrounds**: Slate Dark `#0A0A0B` (Canvas), `#141416` (Card / Modal Surface), `#1C1C1F` (Hover / Raised Containers).
- **Light Surfaces**: Off-White Canvas `#FAFAFA`, Crisp Elevation `#FFFFFF`, Hover `#F4F4F5`.
- **Structural Lines**: Micro-borders use `#27272A` in dark mode and `#E4E4E7` in light mode for strict visual demarcation without visual noise.
- **Typography Tiers**: Foreground primary at `#F4F4F5` (`#09090B` light) and muted descriptive foreground at `#A1A1AA` (`#71717A` light).

### Accent & Feedback
- **Primary Brand Accent (`#84CC16`)**: A calibrated electric lime tuned specifically against `#0F172A` and `#0A0A0B` for key actions, interactive states, and high-confidence match scores.
- **Secondary Anchor (`#0F172A`)**: Deep cold slate employed for high-contrast tag fills, contrasting button text, and inverted badge caps.
- **Status Semantics**:
  - Success / Match Certified: `#10B981` (Emerald)
  - Warning / Under Review: `#F59E0B` (Restrained Amber)
  - Error / Disqualified: `#EF4444` (Crimson)
  - Info / Automated Sync: `#3B82F6` (Slate Blue)

Accents must never exceed 10% of total screen real estate.

## Typography

The type system prioritizes legibility, compact information density, and data precision.

- **Primary Stack**: `Geist`, backed by `Inter` and native system UI fonts. Characterised by neutral terminals and tight geometric bounds suited for high-density tables and cards.
- **Monospace Stack**: `JetBrains Mono` handles telemetry metrics, tabular score percentages, parsing timestamps, and technical requirements.
- **Tabular Figures**: All percentages (e.g., `98.4% Match`), salary bands, and pipeline durations must enforce CSS `font-variant-numeric: tabular-nums` to prevent horizontal jitter during live score recalculation.

## Layout & Spacing

Layouts adhere strictly to a 4px/8px coordinate baseline to enforce predictable density.

### Fluid Grid Architecture
- **Desktop (1024px+)**: 12-column dynamic grid with `1.5rem` gutters and max-width containers anchored at `1440px`. Split-screen view maintains a 40/60 ratio between the list feed and telemetry detail workspace.
- **Tablet (768px - 1023px)**: 8-column layout with `1rem` gutters. Slide-over inspector panels replace split screens.
- **Mobile (< 768px)**: 4-column layout with `1rem` outer canvas padding. Views transition to continuous stacked vertical feeds with sticky action anchors.

### Spacing Usage
- `space-xs` (4px): Micro gaps between icons and badge text; metric tags.
- `space-sm` (8px): Inner padding for badges, tight chips, and vertical stack offsets within compact cards.
- `space-md` (12px): Standard form element gap, chip clusters, and list item spacing.
- `space-lg` (16px): Card internal padding, dialog gutters, and segmented tab spacing.
- `space-xl` (24px): Structural component margins and distinct section dividers.

## Elevation & Depth

Visual hierarchy uses tonal surface stacking and crisp, low-contrast structural outlines rather than physical drop shadows.

- **Surface Tiers**:
  - `Base`: Canvas tone (`#0A0A0B`).
  - `Tier 1`: Cards, kanban lanes, and list items (`#141416`) with a 1px border (`#27272A`).
  - `Tier 2`: Popovers, contextual menus, and dropdowns (`#1C1C1F`) with a 1px border (`#3F3F46`).
- **Shadow Behavior**: Deep drop shadows are restricted to floating modal overlays and pinned mobile sheets (`0px 12px 32px rgba(0, 0, 0, 0.45)`). Standard inline cards use flat surfaces with 1px hairline borders (`box-shadow: none`).
- **State Changes**: Interactive elements on hover never elevate upward via translate keys; instead, their border lightens (`#27272A` to `#3F3F46`) alongside a subtle surface luminance step (`#141416` to `#18181B`).

## Shapes

The geometric framework balances technical precision with modern software design using controlled corner radii.

- **Inner Interactive Tokens (Buttons, Form Inputs, Filter Pills)**: Standardized at `6px` to maintain an architectural, tooling aesthetic.
- **Containers & Surfaces (Cards, Modals, Kanban Columns)**: Scaled to `8px` (`rounded-lg`) and `12px` (`rounded-xl`).
- **Badges & Match Pills**: Kept strictly rectangular with small radius caps (`4px` to `6px`); circular pills are forbidden except for status dot indicators to avoid casual consumer tropes.

## Components

### Buttons
- **Primary CTA**: Electric Lime `#84CC16` background with dark contrast slate `#0F172A` label, medium weight, 6px radius. No gradient; 1px subtle inset edge highlight on focus.
- **Secondary**: Surface `#141416`, 1px border `#27272A`, text `#F4F4F5`. On hover: surface `#1C1C1F`, border `#3F3F46`.
- **Tertiary / Ghost**: Transparent fill, muted text `#A1A1AA`. Hover text `#F4F4F5`, hover background `#18181B`.

### Match Confidence Badges
- Structured horizontal cluster displaying matching accuracy.
- Numeric container utilizes tabular monospace (`JetBrains Mono`). High match (>85%) shows `#84CC16` font on a `#84CC1615` fill with a `#84CC1630` border.
- Includes a direct skill-reasoning tag list adjacent to the score (e.g., `TypeScript • 4 yrs`, `Distributed Systems`), surfaced as flat inline badges with `#1C1C1F` fills.

### Filter Pills & Segmented Tabs
- **Segmented Tabs**: Single pill container `#141416` with 1px border `#27272A`. Active segment sits on `#27272A` with `#F4F4F5` text; inactive segments show `#71717A` with no container shadow.
- **Filter Pills**: Compact `28px` height, 6px radius, neutral background with low-contrast border. Active filters append a monospace count indicator (e.g., `Location [3]`).

### Mobile SaaS Job Cards
- Border-defined `#141416` card container with `16px` padding.
- Top bar: Company identity, role title, timestamp, and instant match indicator badge.
- Middle body: Role metadata (Salary range, remote tier, clearance) rendered in `label-sm` monospace tokens.
- Footer: Automation stage and contextual quick actions (e.g., "Review Tailored Resume", "Dispatch Agent").

### Kanban Stage Badges
- Low-saturation status indicators displaying stage velocity:
  - `Drafting`: Slate `#A1A1AA` badge, neutral outline.
  - `Queued`: Slate Blue `#3B82F6` badge.
  - `Applied`: Lime `#84CC16` badge.
  - `Interviewing`: Emerald `#10B981` badge.
  - `Archived`: Muted zinc `#52525B`.

### Mobile Bottom Navigation Bar
- Anchored to bottom safe area; height `56px`.
- Solid `#0A0A0B` surface with hairline top border `1px solid #27272A` (no glass blur).
- Fixed 4-slot layout (Jobs, Agents, Pipeline, Settings) using mono-weighted iconography, active indicator using `#84CC16` micro-pip underneath active item.