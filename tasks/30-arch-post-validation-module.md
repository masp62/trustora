# #30 — Deepen the post validation module

**Type:** AFK
**Blocked by:** None

## What to build

Post validation logic for experience posts is currently defined in four separate places:
1. Inline in `createExperiencePost` in `src/lib/post-actions.ts` (field-by-field `fieldErrors` block)
2. Inline in `updateExperiencePost` in `src/lib/post-actions.ts` (near-identical copy)
3. In `validateDraftForPublishing` in `src/lib/post-actions.ts` (same rules, different return shape)
4. In `validateBeforeSubmit` in `src/app/create/create-form.tsx` (client-side copy)

The copies have already silently diverged in error message wording. Adding any new rule (e.g. a profanity check on `propertyName`) requires four coordinated edits.

Extract a single `validatePostInput(fields, mode)` module in `src/lib/post-validation.ts`:
- `mode: 'draft' | 'publish'` controls which rules are required (publish enforces completeness, draft relaxes)
- Returns `{ fieldErrors: Record<string, string>; valid: boolean }` for server actions
- Also exports a client-safe variant (pure function, no DB calls) for the create form
- Consolidates: title length, category rating checks, tag dedup, photo count min/max, slug rules

Remove the four inline validation blocks and replace each with a call to `validatePostInput`.

## Acceptance criteria

- [ ] `src/lib/post-validation.ts` exists and exports `validatePostInput(fields, mode)`
- [ ] `createExperiencePost` calls `validatePostInput` instead of its inline block
- [ ] `updateExperiencePost` calls `validatePostInput` instead of its inline block
- [ ] `validateDraftForPublishing` calls `validatePostInput({ mode: 'publish' })` or is replaced by it
- [ ] `create-form.tsx` imports and calls the same function for client-side pre-validation
- [ ] All existing Playwright tests for post creation, editing, and draft publishing continue to pass
- [ ] Error messages are consistent across create, update, and publish flows

## Blocked by

None
