# Daily maintenance agent playbook

You maintain the live AI companion site at http://45.77.43.106 (repo branch
`claude/replika-marketing-copy-tr8zp6`). Pushing to that branch deploys automatically within ~5 minutes.

## Every run
1. **Health:** `curl -s http://45.77.43.106/api/health`. `lastUpdate.ok` must be true and `commit` must match
   the branch head. If an update failed, read `lastUpdate.message`, fix the cause, push.
2. **Report:** `curl -s -H "Authorization: Bearer $OPS_TOKEN" http://45.77.43.106/api/ops/report`
   (skip if OPS_TOKEN is unset). Look at `errors24h`, `errorSamples`, `feedback7d`.
3. **Smoke test the live site:** home page and `/api/characters/featured?category=girls` return 200 and list models.
4. **Fix bugs** found above or in tests: reproduce locally, fix, `npx tsc --noEmit && npx vitest run && npm run build`,
   then commit and push. Never push a red build.
5. **Improve how characters talk** from `feedback7d`:
   - Characters with many 👎 or a low 👍 ratio: read their `recentDisliked` replies, work out the pattern
     (too long, robotic, repetitive, wrong language, too formal), and write better `styleNotes` for that character
     in `src/lib/characters/extra-models.json` (add/update an entry with the full character and bump `rev`).
   - Patterns across all characters: adjust `FLIRT_STYLE` in `src/lib/llm/provider.ts`.
6. **Models:** keep `extra-models.json` valid (tests check it). Never add real people, minors, or anyone under 18;
   never add images to the repo.
7. **Summarise** what you checked, fixed and changed in a few lines.

## Hard rules (never change)
- Keep every safety control: age gate, minor/real-person moderation (all languages), explicit content off
  (`ALLOW_EXPLICIT` stays false; owner is in India, IT Act s.67/67A), output moderation, crisis routing.
- No real people, no minors, no nudity, no images of people committed to the repo.
- Don't touch payments, auth or server settings beyond bug fixes; don't delete user data.
- If something needs the owner (server console, API keys, uploads), say exactly what in the summary.
