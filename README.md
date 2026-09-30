# AI Chat

18+ AI companion web app. Fictional adult characters only, hard age gate, moderated end to end.
Shipped policy: **romantic, not explicit** (`ALLOW_EXPLICIT=false`).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 48 unit tests
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

## Before going live (not done yet)

- **Auth:** the dev cookie identity in `lib/http.ts` must be replaced with real login.
- **Postgres adapter:** `store.ts` is in-memory; implement it against `db/schema.sql`.
- **Age provider:** implement Persona / Veriff / Yoti behind `AgeProvider`, with signed webhooks. Remove the mock.
- **LLM provider:** implement behind `LLMProvider` with a vendor whose policy allows this use; keep `systemPrompt` guardrails.
- **Moderation:** the rule-based filter is a first line only. Add a hosted classifier, a maintained public-figure list, and image checks (age estimation + face similarity) before enabling images.
- **Billing:** no top-ups exist yet. Use a processor that accepts this category. Add chargeback handling.
- **Legal:** ToS, privacy policy, DSAR/erasure, 48-hour takedown flow, jurisdiction review.
