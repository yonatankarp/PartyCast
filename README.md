# PartyCast

Browser-based, client-only Monte Carlo simulator for D&D 5.5e adventures.

Author parties and adventures, run thousands of simulated playthroughs with per-character automated decision policies, get statistics on outcomes.

## Status

Phase 1: scaffolding + schemas. Engine, services, UI, and content are upcoming phases — see `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Develop

```bash
nvm use
npm install
npm run dev       # dev server with HMR
npm test          # run tests once
npm run test:watch
npm run typecheck
npm run lint
npm run build     # production build
```

## Project layout

```
src/
  schemas/   # Zod schemas + inferred TS types (the spine)
  ...        # engine, services, UI added in later phases
docs/
  superpowers/
    specs/   # design specs
    plans/   # implementation plans
```

## License

Code license: not yet chosen — repo owner to set before V1 ships.
Bundled SRD 5.2 content: CC-BY 4.0 (per Wizards of the Coast).
