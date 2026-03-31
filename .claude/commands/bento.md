# Bento Card System

## Types
- `link` — URL card with metadata. Fields: id, type, href, clicks, size, position
- `note` — Text card. Fields: id, type, text, size, position
- `image` — Image card. Fields: id, type, url, caption?, size, position
- `video` — Video card. Fields: id, type, url, caption?, size, position

## Sizes: 2x2, 4x1, 2x4, 4x2, 4x4 (separate sm/md breakpoints)
## Grid: react-grid-layout, 2 cols mobile, 4 cols desktop

## Key Files
- Schema: `src/types.ts` (BentoSchema, SizeSchema, PositionSchema)
- Components: `src/components/bento/`
- CRUD: `src/server/db/utils/link.ts`
- tRPC: `src/server/api/routers/profile-link.ts`

## Adding a New Card Type
1. Add type to BentoSchema union in `src/types.ts`
2. Create renderer in `src/components/bento/`
3. Add case to BentoCard dispatcher
