# AI Chat

18+ AI companion web app. Fictional adult characters only, hard age gate, moderated end to end.
Shipped policy: **romantic, not explicit** (`ALLOW_EXPLICIT=false`).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run typecheck
```

Dev mode uses mocks (`AGE_PROVIDER=mock`, `LLM_PROVIDER=mock`) and an in-memory store, so no keys or DB are needed.

## Safety model (src/lib)

| Control | Where |
|---|---|
| ID-based age gate before characters, chat or spending | `age/verification.ts`, enforced in every route |
| Characters 18+ only (schema and DB `CHECK`), attribute-based builder, no photo upload | `characters/schema.ts`, `db/schema.sql` |
| Input and output moderation: minors, real people / likeness, explicit content | `moderation/index.ts`, `chat.ts` |
| Strikes and auto-ban for minor or real-person attempts | `chat.ts` |
| Crisis routing for self-harm instead of a model reply | `chat.ts` |
| Audit log of every block | `store.ts` (`audit_log` table) |
| Append-only token ledger | `tokens/ledger.ts` |

## Image & video pipeline (src/lib/media)

`requestMedia` checks age verification, charges tokens, builds a prompt only from character attributes and a fixed scene preset, then generates and scans in the background. Tokens are refunded if the output fails or is blocked. Outputs are labelled AI-generated, and users can report any item, which hides it immediately.

**Your GPU server** (`MEDIA_PROVIDER=self_hosted`, `MEDIA_ENDPOINT`, `MEDIA_API_KEY`):
`POST MEDIA_ENDPOINT` with `{ kind, prompt, negativePrompt, contentLevel: "sfw"|"adult", seed }` must return `{ url, mimeType }`.
Always apply `negativePrompt`. Only produce adult output when `contentLevel` is `"adult"`.

**Safety service** (`SAFETY_SCANNER=remote`, `SAFETY_ENDPOINT`, `SAFETY_API_KEY`), required in production:
`POST SAFETY_ENDPOINT` with `{ url, mimeType }` must return `{ csamMatch, minApparentAge, realPersonSimilarity }`.
Use PhotoDNA or Thorn Safer for `csamMatch`, an age-estimation model, and face similarity against a public-figure set.
Output is blocked if apparent age < `MIN_APPARENT_AGE` (21), similarity > 0.6, any hash match, or any scanner error (fails closed).
A CSAM match bans the user and logs `csam_escalation_required`. It must be reviewed by a human and reported as the law requires (e.g. NCMEC in the US).

## Countries (src/lib/jurisdiction.ts)

Explicit mode needs **both** the request country (CDN header) and the verified ID's country to be allowed. An unknown country fails closed.
**India is blocked**: IT Act 2000 s.67/67A make publishing or transmitting sexually explicit material electronically an offence. Indian users get the romantic, non-explicit product only.
Also for India: appoint a Grievance Officer (`GRIEVANCE_OFFICER_*`, shown in the footer). IT Rules 2021 require acknowledgement within 24h, resolution within 15 days, and removal of intimate imagery within 24h. Under the DPDP Act 2023, keep consent records and support deletion requests. Do not store Aadhaar numbers; use a licensed provider (e.g. DigiLocker-based) that returns only an 18+ result.

## Before going live (not done yet)

- **Auth:** the dev cookie identity in `lib/http.ts` must be replaced with real login.
- **Postgres adapter:** `store.ts` is in-memory; implement it against `db/schema.sql`.
- **Age provider:** implement Persona / Veriff / Yoti behind `AgeProvider`, with signed webhooks. Remove the mock.
- **LLM provider:** implement behind `LLMProvider` with a vendor whose policy allows this use; keep `systemPrompt` guardrails.
- **Moderation:** the rule-based filter is a first line only. Add a hosted classifier, a maintained public-figure list, and image checks (age estimation + face similarity) before enabling images.
- **Billing:** no top-ups exist yet. Use a processor that accepts this category. Add chargeback handling.
- **Legal:** ToS, privacy policy, DSAR/erasure, 48-hour takedown flow, jurisdiction review.
