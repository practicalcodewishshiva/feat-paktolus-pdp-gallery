# Premium PDP Image Gallery

Production-oriented React and TypeScript reference implementation for a Product
Detail Page gallery designed for 300 high-resolution images and seven variants
per image.

## Technical design

Read [PDP_IMAGE_GALLERY_TDD.md](./PDP_IMAGE_GALLERY_TDD.md) for architecture,
data contracts, loading strategy, performance budgets, testing, risks, rollout,
and the path to 1,000+ images.

## Run locally

```bash
npm install
npm run dev
```

## Verification

```bash
npm run build
npm run lint
```

The gallery module lives under `src/features/product-gallery`.
