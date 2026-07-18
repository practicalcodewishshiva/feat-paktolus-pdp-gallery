# Product Detail Page Image Gallery — Frontend Technical Design

**Status:** Proposed  
**Owners:** Frontend Platform / Marketplace Experience  
**Last updated:** 17 July 2026

## 1. Executive summary

This document defines the frontend architecture for a premium Product Detail
Page image gallery containing approximately 300 product images, each available
in seven variants: thumbnail, small, medium, large, XL, zoom, and original.

The design keeps the initial request small, renders only visible thumbnails,
loads responsive modern formats through a CDN, preloads only likely next
actions, and uses a bounded in-memory cache. The number of mounted thumbnail
components and speculative network requests remains constant as the image
collection grows, allowing the same architecture to support 1,000+ images.

## 2. Goals

- Preserve premium image quality without downloading unnecessary pixels.
- Make the first product image usable quickly on mobile and desktop.
- Never download all 300 images during initial page load.
- Provide smooth thumbnail, keyboard, swipe, pan, pinch, and zoom interactions.
- Make zoom feel immediate by loading its asset on user intent.
- Adapt image quality and speculative loading to constrained networks.
- Recover gracefully from CDN or image failures.
- Keep feature logic testable and independent from the surrounding PDP.
- Support CDN changes and future image counts without redesigning components.

## 3. Non-goals

- Product catalogue navigation such as Women, Men, or New Arrivals.
- Product pricing, inventory, cart, recommendations, or checkout behavior.
- Image upload and media-processing pipelines.
- CDN vendor configuration beyond the frontend URL contract.
- Server-side product authoring tools.

## 4. User experience requirements

### Desktop

- The primary image loads progressively from a blur placeholder.
- Previous and next controls change the active image without layout shift.
- Left and right arrow keys navigate while the gallery is focused.
- Hovering the main image begins loading the zoom asset.
- Activating zoom opens a modal viewer with wheel zoom and pointer panning.
- The active thumbnail is always scrolled into view.

### Mobile

- Horizontal swipe changes the active image.
- Touch start begins loading the zoom asset.
- Pinch changes zoom scale; one-finger drag pans while zoomed.
- Controls have touch targets of at least 44 by 44 CSS pixels.
- Native page scrolling is preserved outside an active gallery gesture.

### Accessibility

- Every product image has meaningful alt text supplied by product data.
- Decorative thumbnails use empty alt text because their buttons provide names.
- Current thumbnail state uses `aria-current`.
- Image position changes are announced through an `aria-live` region.
- All controls are keyboard operable and have visible focus indicators.
- The zoom viewer uses dialog semantics and supports Escape dismissal.
- Reduced-motion preferences disable non-essential animation.

## 5. Proposed architecture

The gallery is a feature module and exposes only its public component and types.
The PDP owns product data and the controlled active index.

```text
src/features/product-gallery/
├── components/
│   ├── ImageGallery.tsx
│   ├── MainImage.tsx
│   ├── ThumbnailList.tsx
│   ├── ProgressiveImage.tsx
│   ├── ZoomViewer.tsx
│   └── ImagePlaceholder.tsx
├── hooks/
│   ├── useIntersectionObserver.ts
│   ├── useImageCache.ts
│   ├── useImageLoader.ts
│   └── useImagePreloader.ts
├── services/
│   ├── cdnUrl.ts
│   └── imageCache.ts
├── utils/
│   ├── imagePolicy.ts
│   ├── network.ts
│   └── virtualization.ts
├── types/
│   └── productImage.ts
└── data/
    └── mockProductImages.ts
```

### Responsibility boundaries

- `ImageGallery` coordinates selection, navigation, and adjacent preloading.
- `MainImage` owns keyboard/swipe behavior and zoom intent detection.
- `ThumbnailList` owns fixed-size horizontal virtualization.
- `ProgressiveImage` owns `<picture>`, responsive sources, placeholders,
  loading states, and retry UI.
- `ZoomViewer` owns imperative transform-based zoom and pointer gestures.
- Hooks wrap browser APIs and asynchronous image loading.
- Services contain CDN URL generation and the shared bounded cache.
- Utilities contain pure, unit-testable loading policy and range calculations.

No gallery component knows about price, inventory, cart, or product categories.

## 6. Data contract

```ts
type ProductImageVariant =
  | 'thumbnail'
  | 'small'
  | 'medium'
  | 'large'
  | 'xl'
  | 'zoom'
  | 'original'

interface ProductImageSource {
  url: string
  width: number
  height: number
}

interface ProductImage {
  id: string
  alt: string
  blurPlaceholder: string
  variants: Record<ProductImageVariant, ProductImageSource>
}
```

The API must return stable image IDs, intrinsic dimensions, and URLs for every
variant. Intrinsic dimensions reserve layout space and prevent cumulative layout
shift. The blur placeholder should be a tiny encoded asset or CDN URL, normally
below 2 KB.

The original asset is not used by the normal gallery. It is reserved for
explicit download or future specialist inspection features.

## 7. Rendering and loading strategy

### Initial render

Only these resources are eligible for immediate loading:

1. The active image blur placeholder.
2. One responsive active-image candidate selected by the browser.
3. Thumbnails within or close to the visible virtualized range.
4. Application JavaScript and styles.

The other product images remain data objects and do not create image requests.

### Responsive image selection

The main image renders a `<picture>` with source order:

1. AVIF
2. WebP
3. JPEG fallback

Each source has width descriptors and a `sizes` expression. The browser selects
the smallest candidate that satisfies the rendered CSS width and device pixel
ratio. Example candidate widths are 320, 640, 960, 1440, and 2048 pixels.

The active image uses `fetchpriority="high"` and `loading="eager"`. Thumbnails
use `loading="lazy"` in addition to explicit IntersectionObserver gating.

### Progressive display

The blur placeholder occupies the final image dimensions. The decoded HD image
fades in above it. A skeleton is displayed when no placeholder is available.
The old active image remains mounted until React commits the new selection,
avoiding an intermediate blank frame.

### IntersectionObserver

Virtualized thumbnail rows are observed relative to the thumbnail scroller.
A root margin of approximately two item widths starts loading shortly before
the item becomes visible. Once observed, an item remains eligible so reverse
scrolling does not flash an empty placeholder.

If IntersectionObserver is unavailable, visible virtual items load eagerly.
This fallback favors correctness over an empty gallery.

## 8. Thumbnail virtualization

The list uses fixed-size horizontal virtualization rather than rendering 300
buttons and images.

```text
visibleStart = floor(scrollLeft / itemWidth)
visibleEnd   = ceil((scrollLeft + viewportWidth) / itemWidth)
renderRange  = visible range + small overscan
```

The outer list retains the full logical width. Only items inside `renderRange`
are mounted and each is absolutely positioned using its collection index.

Complexity:

- Range calculation: O(1)
- Mounted DOM nodes: O(viewport items + overscan)
- Navigation by index: O(1)
- Total width: O(1)

For 300 or 1,000 images, a typical desktop viewport still mounts roughly 10–16
thumbnail items.

## 9. Preloading policy

After the active index changes, the gallery preloads the previous and next XL
images. Duplicate URLs are removed before scheduling.

Zoom assets are not loaded for every image. The active zoom image begins loading
only on:

- Main-image mouse hover
- Touch or pen pointer down
- Keyboard activation of zoom

The Network Information API modifies speculative work where available:

- Save-Data: no adjacent preloading; maximum 640 px; reduced quality.
- 2G: one adjacent preload; one worker; maximum 640 px.
- 3G: limited adjacent preload; two workers; maximum 960 px.
- 4G or unknown: premium policy up to 2048 px.

Unsupported browsers receive the default policy. Network information is treated
as a hint, never as a correctness dependency.

## 10. In-memory image cache

The module uses a shared bounded cache keyed by the final CDN URL.

Each entry stores:

- The shared loading promise
- Loading or loaded state
- Last-access timestamp

Concurrent consumers requesting the same URL receive the same promise, avoiding
duplicate requests. Failed entries are removed so a later retry is possible.
Loaded entries use least-recently-used eviction when the default 96-entry limit
is reached. In-flight entries are not evicted because doing so would allow
duplicate requests.

The browser HTTP cache remains the primary byte cache. The JavaScript cache
coordinates requests and preserves decoded image references only for the bounded
working set.

## 11. Zoom implementation

Zoom uses CSS `translate3d` and `scale` applied directly to the image element.
Pointer-move events update mutable refs and schedule one paint through
`requestAnimationFrame`.

This design avoids setting React state for every pointer event, which would
cause component reconciliation during a 60 FPS gesture.

Supported interactions:

- Mouse or wheel zoom
- Pointer drag to pan
- Two-pointer pinch to zoom
- Escape or close-button dismissal

Scale is clamped between 1× and 4×. Production hardening should also clamp pan
coordinates to image bounds, trap focus inside the modal, restore prior focus,
and make the background inert while open.

## 12. State management and rendering performance

Gallery state is intentionally local:

- Active index: controlled or uncontrolled React state.
- Zoom open state: local to `MainImage`.
- Gesture coordinates and transforms: refs.
- Image loading state: local to each progressive image.
- Cache: external singleton service.

Global state management is unnecessary. Product image selection does not need
to invalidate unrelated PDP sections.

`React.memo` isolates gallery subcomponents. `useCallback` stabilizes handlers
passed to memoized children. `useMemo` is used for derived URL lists and virtual
ranges. Background preload progress is not tracked unless requested, preventing
a parent render whenever a speculative request settles.

## 13. CDN contract and global delivery

Images should be delivered through a globally distributed CDN such as
Cloudflare Images or CloudFront backed by an image transformation service.

Required CDN behavior:

- Resize by width while preserving aspect ratio.
- Encode AVIF, WebP, and JPEG.
- Control quality.
- Cache transformed variants at the edge.
- Return immutable cache headers for versioned source assets.
- Normalize query-parameter ordering in the cache key.
- Shield the origin from repeated transformation requests.

Recommended headers:

```http
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/avif
Timing-Allow-Origin: *
```

Product APIs should return a CDN-independent source identifier where possible.
A provider adapter in `cdnUrl.ts` converts that identifier into vendor-specific
URLs, limiting migration cost.

## 14. Failure handling

- A failed image shows a dimension-preserving unavailable state.
- Users can retry the active or zoom image.
- Failed cache entries are removed before retry.
- A thumbnail failure affects only that thumbnail.
- Missing image arrays render a gallery-level placeholder.
- Invalid initial or controlled indexes are clamped.
- Browser API absence uses safe eager-loading fallbacks.
- CDN monitoring distinguishes 4xx source errors from 5xx delivery failures.

Retries should be limited and use backoff. The client must not repeatedly retry
a confirmed 404 because it increases latency and CDN traffic without recovery.

## 15. Performance budgets

Target budgets on a representative mid-tier mobile device:

- Initial gallery JavaScript: under 25 KB gzip excluding React.
- Initial image transfer: one main candidate plus visible thumbnails only.
- Gallery cumulative layout shift: below 0.02.
- Main-thread gesture work: below 8 ms per animation frame.
- Interaction to next-image visual response: below 100 ms when preloaded.
- Zoom activation after intent preload: below 100 ms at p75.
- Mounted thumbnail items: below 20 for normal viewports.
- Concurrent speculative image requests: maximum four on fast networks.

These are release gates measured in production, not assumptions based only on
local development.

## 16. Observability

Emit lightweight Real User Monitoring events:

- Gallery first-image load and decode duration
- Selected responsive candidate width and format
- Thumbnail-to-main navigation latency
- Zoom intent-to-ready latency
- Image error rate grouped by variant, CDN region, and status
- Retry success rate
- Cache hit or shared-request rate
- Effective connection type and Save-Data state, when available

Sample performance marks:

```ts
performance.mark('pdp-gallery-navigation-start')
performance.mark('pdp-gallery-image-ready')
performance.measure(
  'pdp-gallery-navigation',
  'pdp-gallery-navigation-start',
  'pdp-gallery-image-ready',
)
```

Telemetry must not include image URLs containing private customer information.

## 17. Testing strategy

### Unit tests

- Virtual range boundaries, overscan, empty lists, and invalid dimensions
- Network loading policy for Save-Data, 2G, 3G, and unknown connections
- CDN URL generation, width deduplication, ordering, and quality clamping
- Cache request deduplication, failure removal, and LRU eviction
- Active-index clamping

### Component tests

- Only virtualized thumbnails mount
- Intersection enables thumbnail loading
- Selecting a thumbnail updates active state and announcement
- Arrow keys and controls navigate correctly
- Retry replaces an error state
- Zoom opens, closes with Escape, and restores focus

### Interaction tests

- Desktop hover begins zoom preload
- Mobile swipe respects horizontal threshold
- Pinch scale remains within limits
- Panning does not trigger React renders per pointer move
- Reduced-motion mode removes non-essential transitions

### End-to-end tests

- Fast desktop connection
- Throttled mobile 3G
- Save-Data policy
- Broken thumbnail, main, and zoom URLs
- Keyboard-only navigation
- 300-image and 1,000-image fixtures

### Visual regression tests

- Loading skeleton
- Blur-to-HD transition
- Active thumbnail
- Main-image error
- Zoom viewer
- Mobile and desktop layouts

## 18. Security and privacy

- Treat all API-provided URLs as untrusted input.
- Allow only approved CDN origins through Content Security Policy.
- Do not render API-provided HTML in captions or alt text.
- Strip sensitive source metadata during media processing.
- Avoid embedding signed original-image URLs in the initial page response.
- Use expiring signed URLs only when original downloads require authorization.

## 19. Rollout plan

1. Ship behind a product-gallery feature flag.
2. Enable for internal users and synthetic performance tests.
3. Roll out to 5% of PDP traffic by region.
4. Compare LCP, image errors, zoom readiness, and conversion guardrails.
5. Increase gradually to 25%, 50%, and 100%.
6. Retain the previous gallery for immediate rollback during rollout.

Rollback is frontend-only because the proposed API shape is additive.

## 20. Risks and mitigations

### CDN URL mismatch

Risk: preloaded URLs differ from `<picture>` candidates, causing duplicate
downloads. Mitigation: generate preloads through the same CDN source builder
used by rendered images.

### Memory pressure

Risk: decoded high-resolution images consume substantially more memory than
their compressed transfer size. Mitigation: bounded LRU cache, small adjacent
window, and no original-image preloading.

### Excessive device-pixel-ratio candidates

Risk: very high-DPR devices choose expensive images with little visible gain.
Mitigation: cap normal gallery width at 2048 px and reserve original assets for
explicit actions.

### Virtualization accessibility

Risk: unmounted thumbnails are unavailable to sequential keyboard navigation.
Mitigation: support roving focus and arrow-key navigation by logical index,
scrolling the requested item into the virtual range before focusing it.

### Gesture conflicts

Risk: horizontal swipe or pinch interferes with page scrolling. Mitigation:
activate gestures only after direction/scale intent is established and scope
`touch-action: none` to the open zoom viewport.

## 21. Scaling beyond 1,000 images

The component architecture does not change:

- Image metadata remains O(n), but mounted DOM remains O(viewport).
- Cache size remains bounded independently of collection length.
- Adjacent preloading remains a constant-size operation.
- Navigation and virtual range calculations remain O(1).

For very large collections, the product API should paginate metadata. The
frontend can append image descriptors in pages while keeping the same stable
IDs and virtual list. Pagination should begin before the virtual range reaches
the loaded boundary; image bytes remain governed by visibility and intent.

## 22. Alternatives considered

### Render all thumbnails with native lazy loading

Rejected because 300–1,000 buttons and image elements increase DOM size, style
calculation, accessibility-tree cost, and observer work even when image bytes
are deferred.

### Use a third-party carousel and zoom package

Rejected for the reference implementation because the required behavior is
small, the existing fixed-size virtualization is straightforward, and extra
dependencies increase bundle and upgrade risk. A mature internal design-system
gallery should be reused if one exists.

### Canvas-based main gallery

Rejected because responsive `<picture>` elements provide better browser image
selection, accessibility, caching, and simpler failure handling. Canvas is not
required for transform-based pan and zoom.

### Service Worker image cache

Deferred. Browser HTTP caching plus a bounded request cache covers the current
requirements with less operational complexity. A Service Worker becomes useful
only if offline PDP browsing is a product requirement.

## 23. Acceptance criteria

- Initial page load does not request all product images.
- The DOM contains only the visible thumbnail window plus overscan.
- Main images use AVIF/WebP with JPEG fallback, `srcset`, and `sizes`.
- Save-Data and slow-network users receive constrained images and preloading.
- Previous and next likely images are preloaded with bounded concurrency.
- Zoom begins preloading on hover or touch intent.
- Pan and pinch update through transforms without React render loops.
- Keyboard, swipe, thumbnail, and button navigation update the same active index.
- Broken images retain layout and offer a bounded retry path.
- Production metrics verify the stated performance budgets.
- A 1,000-image fixture does not materially increase mounted nodes, cache size,
  or speculative requests.

## 24. Implementation status

The accompanying React and TypeScript reference implements the feature-based
structure, responsive `<picture>` rendering, progressive loading, thumbnail
virtualization, IntersectionObserver gating, bounded caching, adaptive preload
policy, keyboard/swipe navigation, and transform-based zoom.

Before a production rollout, complete the hardening items identified in this
document: modal focus management, pan-bound clamping, logical keyboard
navigation across virtualized thumbnails, CDN adapter tests, cache tests, and
production RUM instrumentation.
