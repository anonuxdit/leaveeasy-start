# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**LeaveEasy** — a plain HTML/CSS/vanilla JS prototype of an online leave-request system, built incrementally over ADT-RAISE Module 2 (weeks 6–9). `leaveeasy-spec.md` is the source of truth for requirements, data model, and — critically — **the week-by-week scope boundary** (section 8: what each week adds; section 9: what must NOT be built ahead of schedule). Always check that file before adding a feature; do not implement something the spec marks as a later week's work just because it seems like a natural next step.

No framework, no bundler, no server of its own. `package.json` only wraps `serve` for local static hosting — there is no build/lint/test command in this repo.

## Running it locally

`npm run dev` (runs `serve -l 3000 .`), then open `http://localhost:3000`.

Pages that talk to Firestore load their script as `<script type="module">` (see below) — **ES modules will not execute over `file://`**, only over `http(s)://`. Always serve the folder; don't open the HTML files directly by double-clicking them.

## Architecture

- Each screen is one static HTML file + one same-named file in `js/`. Shared helpers (`esc`, `ป้ายสถานะ`, `ค่าจากURL`, `เวลาตอนนี้`) live in `js/util.js` and `js/nav.js` renders the nav bar — both are loaded as classic `<script defer>` globals on every page.
- `js/firebase-init.js` is the single Firestore connection point (`initializeApp` + `getFirestore`, config inline — see Security note below). Any page/script that needs Firestore imports `{ db }` from it.
- `js/data.js` (`window.LEAVE_DATA`) holds the same seed dataset as Firestore, used by pages that haven't been migrated to real reads yet. Check each page's own script before assuming which source it reads from — migration is happening incrementally per the weekly plan, not all at once.
- `seed.html` / `js/seed.js` is a one-time, unlinked setup utility that writes the seed dataset into Firestore (client SDK, `setDoc`) — not part of the app's normal navigation flow.

### Firestore layout

There are exactly 4 collections/subcollections in this project — no others exist, don't invent new ones without checking `leaveeasy-spec.md` §7 first:

- `users/{id}`
- `leaveTypes/{id}`
- `leaveRequests/{id}`
- `leaveRequests/{id}/approvals/{id}` (subcollection, nested per request — not a top-level collection)

```
users/{id}                 { name, email, role }        role ∈ employee | manager | hr
leaveTypes/{id}             { name }
leaveRequests/{id}          { title, reason, status, startDate, endDate, createdAt,
                              requesterId, requesterName,   ← FK + denormalized name
                              approverId,  approverName,    ← FK + denormalized name
                              leaveTypeId, leaveTypeName }  ← FK + denormalized name
  leaveRequests/{id}/approvals/{id}   { authorId, authorName, message, createdAt }
```

Firestore has no JOIN, so `*Name` fields are intentionally denormalized copies of the referenced doc's name — always write both the id and the name together, never just the id. Field names are case-sensitive and must match exactly everywhere (`status` ≠ `Status`).

### Leave status — exactly 3 values, one-way transition

```
รอพิจารณา (pending) → อนุมัติ (approved)
                    → ไม่อนุมัติ (rejected)
```

- Every new request starts at `รอพิจารณา`; never let a user set the initial status.
- `อนุมัติ` and `ไม่อนุมัติ` are terminal — no further transitions once set.
- Changing status must touch only the `status` field, never overwrite the rest of the document.
- Transitioning to `ไม่อนุมัติ` requires at least one existing doc in that request's `approvals` subcollection.

## Security

The `firebaseConfig` in `js/firebase-init.js` (including `apiKey`) is a Firebase **Web SDK client config**, not a secret — it is meant to be public and is expected to be committed and pushed. Access control comes from Firestore Security Rules, not from hiding this config.

**Rule: never write a real secret key into any file that gets pushed to GitHub** — e.g. the OpenRouter API key that week 8 introduces for the AI assistant feature must live outside the pushed tree (local-only config, environment variable, etc.), never hardcoded into a JS/HTML file. `.gitignore` already blocks `.env`, `*.key`, `*.pem`, service-account JSON files, and similar — but the gitignore only stops *untracked* files, so also never paste a live key directly into source that's already tracked.

## Other notes

- `docs/` holds checkpoint submission screenshots for the course, not project documentation.
