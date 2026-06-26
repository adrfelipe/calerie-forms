# Design

## Visual Theme

Inspired by Microsoft FluentUI: natural, efficient, inclusive. Clean teal identity on neutral surfaces with system-preference dark mode support.

## Color Strategy

**Committed** — teal (from seed, crisp + modern) carries surfaces as the identity color. Dark mode mirrors the same roles.

### Palette (Light)

| Role | Value | Usage |
|---|---|---|
| `--bg` | `oklch(1 0 0)` | Page background, pure white |
| `--surface` | `oklch(0.965 0.003 160)` | Cards, panels, form sections |
| `--surface-hover` | `oklch(0.955 0.005 160)` | Hovered cards, dropdown items |
| `--ink` | `oklch(0.17 0.01 160)` | Body text |
| `--ink-muted` | `oklch(0.5 0.012 160)` | Secondary/placeholder text |
| `--primary` | `oklch(0.55 0.095 180)` | Primary buttons, active states, brand elements |
| `--primary-hover` | `oklch(0.5 0.095 180)` | Button hover |
| `--primary-soft` | `oklch(0.9 0.03 180)` | Soft backgrounds for selected/chip states |
| `--accent` | `oklch(0.65 0.12 80)` | Call-to-action highlights, confirmation (warm gold) |
| `--border` | `oklch(0.88 0.005 160)` | Input borders, dividers |
| `--border-focus` | `oklch(0.55 0.095 180)` | Focus ring |
| `--error` | `oklch(0.55 0.15 30)` | Error text, borders |
| `--success` | `oklch(0.55 0.12 150)` | Success states |
| `--warning` | `oklch(0.7 0.12 85)` | Warning states |
| `--white` | `oklch(1 0 0)` | Text on primary buttons, chips |

### Palette (Dark)

| Role | Value |
|---|---|
| `--bg` | `oklch(0.08 0 0)` |
| `--surface` | `oklch(0.16 0.008 180)` |
| `--surface-hover` | `oklch(0.19 0.01 180)` |
| `--ink` | `oklch(0.92 0.005 160)` |
| `--ink-muted` | `oklch(0.65 0.008 160)` |
| `--primary` | `oklch(0.65 0.095 180)` |
| `--primary-hover` | `oklch(0.7 0.095 180)` |
| `--primary-soft` | `oklch(0.25 0.04 180)` |
| `--accent` | `oklch(0.75 0.12 80)` |
| `--border` | `oklch(0.28 0.01 180)` |
| `--border-focus` | `oklch(0.65 0.095 180)` |
| `--error` | `oklch(0.68 0.14 30)` |
| `--success` | `oklch(0.68 0.12 150)` |
| `--warning` | `oklch(0.78 0.12 85)` |
| `--white` | `oklch(1 0 0)` |

## Typography

- **Primary font**: `Segoe UI Variable` or `Segoe UI`, fallback to system-ui stack
- **Scale**: Fixed rem scale (product default, no fluid clamp)
  - `--text-xs`: 0.75rem
  - `--text-sm`: 0.875rem
  - `--text-base`: 1rem
  - `--text-lg`: 1.125rem
  - `--text-xl`: 1.25rem
  - `--text-2xl`: 1.5rem
  - `--text-3xl`: 1.875rem
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Line length**: 65–75ch on prose content
- **Line height**: 1.5 body, 1.25 headings, 1 compacter inputs

## Spacing

FluentUI-inspired 4px grid:
- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- `--space-5`: 1.25rem (20px)
- `--space-6`: 1.5rem (24px)
- `--space-8`: 2rem (32px)
- `--space-10`: 2.5rem (40px)
- `--space-12`: 3rem (48px)
- `--space-16`: 4rem (64px)

## Border Radius

- `--radius-sm`: 4px
- `--radius-md`: 6px
- `--radius-lg`: 8px
- `--radius-xl`: 12px
- `--radius-full`: 9999px

## Shadows

- `--shadow-sm`: 0 1px 2px oklch(0 0 0 / 0.06)
- `--shadow-md`: 0 4px 6px oklch(0 0 0 / 0.08)
- `--shadow-lg`: 0 10px 25px oklch(0 0 0 / 0.12)
- `--shadow-xl`: 0 20px 40px oklch(0 0 0 / 0.16)

Dark mode shadows use oklch(0 0 0 / 0.4) at the same multipliers.

## Z-Index Scale

- `--z-dropdown`: 100
- `--z-sticky`: 200
- `--z-modal-backdrop`: 300
- `--z-modal`: 400
- `--z-toast`: 500
- `--z-tooltip`: 600

## Motion

- Duration: 150–250ms for all state transitions
- Easing: ease-out (standard FluentUI deceleration)
- No decorative motion or page-load sequences
- Reduced motion: `@media (prefers-reduced-motion: reduce)` → 0ms or crossfade
- Only motion that conveys state: hover, focus, active, disabled, loading, error

## Components

Every interactive component has: default, hover, focus, active, disabled, loading, error states.

- **Buttons**: FluentUI-style rectangle with rounded corners (6px). Primary (teal fill, white text) and secondary (outline/border).
- **Inputs**: Clean bordered rectangles, 2px focus ring in teal. FluentUI label-on-top pattern.
- **Form sections**: Grouped with subtle surface background and border, section headers with teal left border accent.
- **Cards**: Subtle surface background, no elevation nesting. Never nested cards.
- **Modals**: Dialog-based (native `<dialog>`), backdrop scrim, XL shadow, rounded corners.
- **Tabs/Steps**: Top-aligned tabs or step indicator for multi-passenger flows. Teal active indicator.
- **File upload**: Drag-and-drop zone with teal dashed border, preview thumbnails for uploaded images.
- **Select/Dropdown**: Styled select or combobox matching FluentUI dropdown pattern.

## Empty States

- Forms with no submissions: illustration + copy explaining how to share the form
- No vagas configured: CTA to create first vaga
- Loading states: skeleton placeholders matching form field dimensions (not spinners)

## Responsive Breakpoints

- Mobile: < 640px (single column form)
- Tablet: 640px–1024px (two-column fields where appropriate)
- Desktop: > 1024px (wider form, side panels)
