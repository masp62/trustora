---
description: "Use when creating, editing, splitting, or reorganising task files in tasks/. Covers numbering, structure, dependency tracking, and the local-first development principle."
applyTo: "tasks/**"
---

# Task File Conventions

## File naming

- Pattern: `NN-short-kebab-title.md` (e.g. `06-post-creation-form-rate-limiting.md`)
- When splitting a task, append a lowercase letter suffix: `05a-…`, `05b-…`
- Keep the original number prefix so downstream references stay close in sort order

## Required sections (in order)

```
# #N — Human-Readable Title

**Type:** AFK | HITL
**Blocked by:** #X — Title, #Y — Title   (or "None")

## What to build
<prose description>

## Acceptance criteria
- [ ] …

## Blocked by
- #X — Title
```

## Dependency rules

- Reference tasks as `#N` (or `#Na`) in prose and `Blocked by` sections
- When a task is split or renumbered, update **every** downstream file that references it — both the `Blocked by:` header line, the `## Blocked by` list, and any inline mentions in `## What to build`
- Never leave a dangling reference to a deleted task number

## Splitting a task

1. Create the new sub-task files (`Na`, `Nb`, …)
2. Delete the original file
3. grep all `tasks/*.md` for references to the old `#N` and update them to point to the correct sub-task
4. Verify the dependency chain is acyclic

## Local-first development

When a task depends on an external service (Cloudinary, Stripe, email provider, etc.):

- **Split** into a local slice (AFK) and a production/integration slice (HITL)
- The local slice introduces an **abstraction** (interface or function signature) with a local backend (filesystem, in-memory, stub) selected via an **environment variable** (e.g. `IMAGE_PROVIDER=local | cloudinary`)
- The production slice implements the real backend behind the same abstraction — switching requires only an env-var change, no code changes
- Downstream tasks depend on the **local slice**, not the production one, so they are never blocked by manual account setup or credential provisioning
