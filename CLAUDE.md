# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — TypeScript check + production build
- `npm run start` — Start production server
- `npm run lint` — Run Next.js linter

## Project Structure

```
src/
├── app/
│   ├── (public)/f/[slug]/   — Passenger form page (SSR)
│   ├── admin/               — Admin panel (dashboard, create forms, submissions)
│   ├── api/
│   │   ├── forms/[slug]        — GET form + vagas
│   │   ├── forms/[slug]/submit — POST passenger submission (Zod validated)
│   │   ├── upload              — POST generate signed upload URL for photos
│   │   └── cep/[cep]           — GET proxy to BrasilAPI CEP lookup
│   └── layout.tsx              — Root layout (pt-BR, CSS import)
├── components/
│   ├── ui/        — Primitives: Button, Input, Select, Modal, FileUpload
│   └── forms/     — FormShell, CepField, ConfirmationModal
├── lib/
│   ├── supabase/  — client.ts (browser), server.ts (service_role)
│   └── validation/ — Zod schemas shared client/server
├── types/          — Form, Vaga, Passenger, etc.
└── styles/         — Tailwind CSS with design tokens
```

## Key Architecture

- **Supabase**: `forms` → `vagas` → `passengers` → `document_photos`. RLS: anon key for public, service_role for admin.
- **Service role client**: Used in SSR pages and API routes for simplicity (no auth middleware needed for MVP).
- **Form flow**: Single = direct form. Multi = vaga selector → one passenger at a time via step indicator.
- **Confirmation**: Native `<dialog>` modal with required checkbox before final DB write.
- **Photos**: Client requests signed upload URL from `/api/upload`, PUTs directly to Supabase Storage.
- **CEP**: Client calls `/api/cep/[cep]` proxy → BrasilAPI v2, auto-fills address fields.
- **Design tokens**: Tailwind CSS v4 `@theme` in `globals.css`. Teal OKLCH palette, Segoe UI font, light/dark mode.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET=calerie-admin-2026
```

## Common Tasks

- **Add a form field**: Update Zod schema in `lib/validation/schemas.ts`, add input in `FormShell.tsx`, add column migration
- **Create Supabase migration**: Write SQL with `CREATE TABLE`/`ALTER TABLE`, apply via `supabase apply_migration`
- **New form type**: Extend `form_type` enum, add flow branch in `FormShell.tsx`
- **Google Sheets**: Build `src/app/api/sheets/export/route.ts` + Supabase Edge Function

## PT-BR UI

All UI copy, labels, error messages, and modals are in Portuguese (Brazil). New UI text must be in PT-BR.
