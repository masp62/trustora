# #23g — Draft Save Validation Relaxation

**Type:** AFK
**Blocked by:** #23d — Draft Experience & Later Publish

## What to build

Follow-up to Story 23d: make draft saving less strict than publishing.

Current behavior uses almost the same validation for draft save and publish, which blocks partially complete drafts. This follow-up should allow users to store an incomplete draft and continue later, while keeping strict validation when publishing.

Target behavior:

- Saving as draft should require only minimal fields needed to persist a useful draft record
- Publishing (explicit publish action) must still enforce full publish validation
- Existing published-flow validation and quality gates must remain unchanged

## Acceptance criteria

- [ ] Save as draft works with incomplete content (for example: missing some ratings/tags/photos)
- [ ] Draft save enforces only minimal constraints (for example: author/session + basic title/body presence + safe field lengths)
- [ ] Draft publish still enforces full publish rules (same strictness as normal publish)
- [ ] Error messages distinguish clearly between draft-save validation and publish validation
- [ ] Drafts created under relaxed validation remain editable and can later be published after completion
- [ ] Existing tests for published posts and publish validation continue to pass unchanged
- [ ] Add/adjust Playwright coverage to verify relaxed draft save and strict publish behavior

## Blocked by

- #23d — Draft Experience & Later Publish
