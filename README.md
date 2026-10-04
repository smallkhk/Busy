# Abuja Life 🏙️

A 3D life sim set in Abuja. You land with ₦45,000 and a self-con in Kubwa. Chop, sleep, hustle, and keep your needs up.

See [SPEC.md](SPEC.md) for the full game design.

## Run locally

```bash
npm install
npm run dev      # open the URL it prints
npm test         # engine unit tests
npm run build    # production build in dist/
```

## Hosting

Every push to `master` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

## Code map

- `src/engine/`: pure game logic (needs, clock), unit-tested
- `src/content/activities.ts`: every object, activity and job. Add content here
- `src/store/game.ts`: game state, tick loop, save/load (localStorage)
- `src/world/`: 3D scene (React Three Fiber)
- `src/ui/`: HUD, action menus, phone
