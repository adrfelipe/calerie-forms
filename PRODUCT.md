# Product

## Register

product

## Users

**Admins (internal Calerie team)**: Staff members who create and manage passenger forms. Mixed technical comfort — the UI must be intuitive, with clear affordances for creating forms, managing vagas (spots), and tracking submissions.

**Passengers (general public)**: Cruise passengers of all ages and tech comfort levels filling out personal data forms. The form must be dead simple, clear, and forgiving — many will be using mobile phones.

## Product Purpose

A form management system for Calerie Brasil's Black cruise that allows admins to create passenger data collection forms tied to specific vagas (spots). Passengers fill out their personal details, upload document photos (CPF, Passport), and provide emergency contact info. All data is sent to a Google Sheet. The system handles two workflows:
1. Admin creates a form for a single vaga with pre-filled buyer name.
2. Admin creates a form for multiple vagas — the passenger selects their vaga and fills data for each spot (unlimited number of spots per form).

## Brand Personality

Clean, Modern, Trustworthy. The interface should feel frictionless and premium — like a well-designed travel tool, not a bureaucratic government form. FluentUI-inspired design language with Microsoft's design principles: natural, efficient, and inclusive.

## Anti-references

- **Avoid cluttered/dated forms**: No dense tables, tiny fonts, busy backgrounds, or old-fashioned form layouts. No side-stripe borders, glassmorphism, or gradient text.
- **Avoid cold/corporate look**: This is a cruise experience tool — it should feel warm and inviting, not like a banking portal. Human-friendly copy and approachable visuals.

## Design Principles

1. **Frictionless by default**: The form requires significant data entry. Every interaction optimization (auto-CEP lookup, clear validation, progress indication) matters.
2. **Mobile-first, responsive always**: Passengers fill forms on phones. Every layout must work from 320px to desktop.
3. **Confidence through clarity**: The confirmation modal is the most critical moment — data review must be unambiguous. Clear labels, grouped sections, and visible field state.
4. **Inclusive by design**: WCAG 2.1 AAA. High contrast, clear focus indicators, screen-reader ready, reduced motion support. Forms used by diverse passengers of all ages.
5. **Trustworthy data handling**: Document photos are sensitive PII. Storage, upload, and transmission must be secure. The Google Sheet integration is the source of truth for the business.

## Accessibility & Inclusion

WCAG 2.1 Level AAA. Full keyboard navigation, proper ARIA labels, high color contrast (4.5:1 body, 3:1 large text), clear error announcements via aria-live, reduced motion support, and screen-reader compatible confirmation flow.

## Language

Portuguese (Brazil) — all UI copy, labels, error messages, and the confirmation modal in PT-BR.
