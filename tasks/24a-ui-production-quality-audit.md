# #24a — UI Production-Quality Audit & Fixes

**Type:** AFK
**Blocked by:** #24 — Responsive Design Polish

## What to build

Address all gaps identified in the production-quality UI audit against the frontend-ui-engineering skill. The current UI is solid in many areas (design system, forms, empty states, responsive layout) but has critical missing infrastructure (loading/error states), minor accessibility gaps, and image handling concerns.

## Audit Summary

### ✅ Already Production-Quality
- **Design system adherence** — Consistent CSS variable tokens, no hardcoded hex colors, proper spacing scale
- **Form accessibility** — All inputs labeled, error messages shown, autocomplete hints, fieldset/legend for groups
- **Empty states** — Three well-designed variants with icons, descriptions, and CTAs
- **Responsive design** — Mobile-first with proper breakpoint scaling, no overflow at 320px
- **Color contrast** — All themes pass WCAG AAA for text
- **Component architecture** — Lean (~74 lines avg), composable, no over-configured components
- **Semantic HTML** — Proper use of header, main, section, nav, article elements
- **No AI aesthetic** — Real brand palette, purpose-driven layouts, subtle styling

### ❌ Critical Gaps
- No `loading.tsx` files anywhere in the app
- No `error.tsx` error boundaries anywhere in the app
- `Suspense` boundaries without fallback UI

### ⚠️ Moderate Issues
- Plain `<img>` tags instead of `next/image` (9 instances, all with eslint-disable)
- No `loading="lazy"` for below-fold images
- No image error fallbacks when Cloudinary URLs fail
- Filter panel toggle buttons missing `aria-pressed` state
- Tag filter buttons missing `aria-pressed` state
- Theme toggle has no indication of current theme for assistive tech
- Like/Follow optimistic UI lacks visible loading indicator beyond `disabled`

---

## Acceptance criteria

### Loading States
- [x] `src/app/explore/loading.tsx` exists with `PostCardSkeletonGrid` and filter panel skeleton
- [x] `src/app/post/[id]/[slug]/loading.tsx` exists with post detail skeleton (image placeholder, text lines, comment placeholders)
- [x] `src/app/u/[username]/loading.tsx` exists with profile header skeleton and post grid skeleton
- [x] `src/app/search/loading.tsx` exists with search results skeleton
- [ ] `src/app/admin/loading.tsx` exists with dashboard skeleton
- [x] Existing `<Suspense>` in explore page has proper fallback component

### Error Boundaries
- [x] `src/app/error.tsx` root error boundary with "Something went wrong" UI and retry button
- [x] `src/app/explore/error.tsx` with contextual error message and retry
- [x] `src/app/post/[id]/[slug]/error.tsx` with "Post could not be loaded" and back link
- [x] `src/app/u/[username]/error.tsx` with "Profile could not be loaded" and back link
- [x] All error boundaries use `"use client"`, accept `error` and `reset` props, log error

### Image Handling
- [ ] Migrate from plain `<img>` to `next/image` in `post-card.tsx` (or add `loading="lazy"` + error fallback)
- [ ] Add image error fallback (placeholder/broken-image state) to post card and photo gallery
- [ ] Hero/above-fold images use `priority` or `loading="eager"`
- [ ] Below-fold images use `loading="lazy"`

### Accessibility Fixes
- [x] Filter panel trip-type buttons have `aria-pressed={active}` attribute
- [x] Filter panel tag buttons have `aria-pressed={active}` attribute
- [ ] Theme toggle shows current theme via `aria-label` (e.g. "Switch theme, currently Tropical")
- [ ] Empty-state icons have `aria-hidden="true"` (decorative) so screen readers skip them
- [ ] Post comment list items use `role="article"` or semantic `<article>` wrapper

### Polish
- [ ] Like button shows subtle loading spinner or opacity change during transition
- [ ] Follow button shows subtle loading indicator during transition (beyond just disabled)
- [ ] Mobile filter panel state change announces via `aria-live="polite"` region

---

## Implementation Notes

### Loading skeletons pattern:
```tsx
// src/app/explore/loading.tsx
import { PostCardSkeletonGrid } from "@/components/explore/post-card-skeleton";

export default function Loading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Filter skeleton */}
        <div className="mb-8 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        <PostCardSkeletonGrid count={9} />
      </div>
    </main>
  );
}
```

### Error boundary pattern:
```tsx
// src/app/explore/error.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <AlertTriangle className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn't load the explore feed. Please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
```

### Image migration pattern:
```tsx
import Image from "next/image";

// Replace plain <img> with:
<Image
  src={post.leadImageUrl}
  alt={post.title}
  width={400}
  height={240}
  className="h-52 w-full object-cover transition group-hover:scale-[1.02] sm:h-60"
  loading="lazy"
  onError={(e) => {
    e.currentTarget.src = "/placeholder-post.svg";
  }}
/>
```

## Blocked by

- #24 — Responsive Design Polish
