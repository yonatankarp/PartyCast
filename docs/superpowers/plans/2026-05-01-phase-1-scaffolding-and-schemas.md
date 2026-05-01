# PartyCast Phase 1: Project Scaffolding and V1 Schemas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working Vite + React + TypeScript + Vitest project for PartyCast and define every V1 Zod schema (with TypeScript types derived) so subsequent phases have a stable spine.

**Architecture:** Single-package layout (`src/schemas`, `src/engine` later, etc.). Strict TypeScript. Zod for runtime validation; types inferred from schemas. Vitest for unit + integration tests. Tests colocated under `src/schemas/__tests__/`. CI runs typecheck + lint + test + build on every push.

**Tech Stack:** Node 20.x LTS, npm, TypeScript 5.x (strict), Vite 5.x, React 18, Vitest, Zod, ESLint + Prettier.

---

## File structure produced by this plan

```
PartyCast/
├── .editorconfig
├── .eslintrc.json
├── .gitignore
├── .nvmrc
├── .prettierrc
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   └── superpowers/
│       ├── specs/2026-05-01-dnd-adventure-simulator-design.md  (already committed)
│       └── plans/2026-05-01-phase-1-scaffolding-and-schemas.md (this file)
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── src/
│   ├── App.tsx
│   ├── App.test.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
│   └── schemas/
│       ├── action.ts
│       ├── adventure.ts
│       ├── adventureNode.ts
│       ├── combatant.ts
│       ├── condition.ts
│       ├── effect.ts
│       ├── index.ts
│       ├── party.ts
│       ├── persona.ts
│       ├── primitives.ts
│       ├── run.ts
│       └── __tests__/
│           ├── action.test.ts
│           ├── adventure.test.ts
│           ├── adventureNode.test.ts
│           ├── combatant.test.ts
│           ├── condition.test.ts
│           ├── crossValidation.test.ts
│           ├── effect.test.ts
│           ├── party.test.ts
│           ├── persona.test.ts
│           ├── primitives.test.ts
│           └── run.test.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

Files split by responsibility (one schema per file). Tests colocated under `__tests__/`. Each file is small and focused.

---

## Task 1: Initialize package.json and install runtime dependencies

**Files:**
- Create: `package.json`
- Create: `package-lock.json` (generated)
- Create: `.nvmrc`

- [ ] **Step 1: Pin Node version**

Create `.nvmrc`:

```
20
```

- [ ] **Step 2: Initialize package.json**

Run: `npm init -y` from the repo root.

- [ ] **Step 3: Replace generated package.json with the canonical one**

Overwrite `package.json` with:

```json
{
  "name": "partycast",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.7",
    "jsdom": "^24.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` populated, `package-lock.json` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add .nvmrc package.json package-lock.json
git commit -m "chore: initialize npm project with React + Vite + Vitest + Zod"
```

---

## Task 2: Add tooling configs (gitignore, editorconfig, prettier, eslint, tsconfig)

**Files:**
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.prettierrc`
- Create: `.eslintrc.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

- [ ] **Step 1: Create .gitignore**

Write `.gitignore`:

```
node_modules/
dist/
coverage/
*.log
.DS_Store
.idea/
.vscode/
.superpowers/
```

- [ ] **Step 2: Create .editorconfig**

Write `.editorconfig`:

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 3: Create .prettierrc**

Write `.prettierrc`:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true
}
```

- [ ] **Step 4: Create .eslintrc.json**

Write `.eslintrc.json`:

```json
{
  "root": true,
  "env": { "browser": true, "es2022": true, "node": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module", "ecmaFeatures": { "jsx": true } },
  "plugins": ["@typescript-eslint", "react", "react-hooks", "react-refresh"],
  "settings": { "react": { "version": "detect" } },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }]
  },
  "ignorePatterns": ["dist", "coverage", "node_modules"]
}
```

- [ ] **Step 5: Create tsconfig.json (strict)**

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: Create tsconfig.node.json**

Write `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 7: Run typecheck to confirm config is valid**

Run: `npm run typecheck`
Expected: PASS (no source files yet, but config must parse cleanly).

- [ ] **Step 8: Commit**

```bash
git add .gitignore .editorconfig .prettierrc .eslintrc.json tsconfig.json tsconfig.node.json
git commit -m "chore: add lint/format/typecheck configs"
```

---

## Task 3: Configure Vite and Vitest

**Files:**
- Create: `vite.config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vite.config.ts**

Write `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 2: Create vitest.config.ts**

Write `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 3: Create src/test-setup.ts**

Write `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts vitest.config.ts src/test-setup.ts
git commit -m "chore: configure Vite and Vitest"
```

---

## Task 4: Add minimal app boot (hello world UI) and smoke-test it

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Create index.html**

Write `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PartyCast</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create src/index.css**

Write `src/index.css`:

```css
:root {
  font-family: system-ui, -apple-system, sans-serif;
  color-scheme: light dark;
}
body {
  margin: 0;
  min-height: 100vh;
}
```

- [ ] **Step 3: Create src/vite-env.d.ts**

Write `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 4: Create src/main.tsx**

Write `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Write the failing test for App**

Write `src/App.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the project name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /PartyCast/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `App` not defined / file not found.

- [ ] **Step 7: Implement App**

Write `src/App.tsx`:

```typescript
export function App(): JSX.Element {
  return (
    <main>
      <h1>PartyCast</h1>
      <p>D&amp;D 5.5e adventure simulator. Phase 1 scaffolding complete.</p>
    </main>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 9: Smoke-test dev server**

Run: `npm run dev` and open the printed localhost URL in a browser.
Expected: Page shows "PartyCast" heading. Stop the server with Ctrl+C.

- [ ] **Step 10: Smoke-test production build**

Run: `npm run build`
Expected: SUCCESS — `dist/` produced, no errors.

- [ ] **Step 11: Commit**

```bash
git add index.html src/main.tsx src/App.tsx src/App.test.tsx src/index.css src/vite-env.d.ts
git commit -m "feat: add minimal app boot with hello-world UI"
```

---

## Task 5: Add CI workflow (typecheck + lint + test + build)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

Write `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add typecheck/lint/test/build workflow"
```

---

## Task 6: Define primitive schemas (DiceExpression, Tag, ResourceKey, AbilityScore, DamageType, Size, CreatureType)

**Files:**
- Create: `src/schemas/primitives.ts`
- Create: `src/schemas/__tests__/primitives.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/primitives.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  DiceExpressionSchema,
  TagSchema,
  ResourceKeySchema,
  AbilityScoreSchema,
  DamageTypeSchema,
  SizeSchema,
  CreatureTypeSchema,
} from '../primitives';

describe('DiceExpressionSchema', () => {
  it.each(['1d20', '3d6', '2d8+5', '1d4-1', '4d6+12'])('accepts %s', (s) => {
    expect(DiceExpressionSchema.parse(s)).toBe(s);
  });
  it.each(['', 'd20', '1d', '3d6+', '1d20*2', 'foo'])('rejects %s', (s) => {
    expect(DiceExpressionSchema.safeParse(s).success).toBe(false);
  });
});

describe('TagSchema', () => {
  it.each(['tag:healing', 'tag:aoe-damage', 'tag:single-target', 'tag:control-1'])(
    'accepts %s',
    (s) => {
      expect(TagSchema.parse(s)).toBe(s);
    },
  );
  it.each(['healing', 'tag:', 'tag:Healing', 'tag:_under', 'tag:has space'])(
    'rejects %s',
    (s) => {
      expect(TagSchema.safeParse(s).success).toBe(false);
    },
  );
});

describe('ResourceKeySchema', () => {
  it.each(['spell-slot-1', 'rage-uses', 'action-surge', 'channel-divinity'])(
    'accepts %s',
    (s) => {
      expect(ResourceKeySchema.parse(s)).toBe(s);
    },
  );
  it.each(['Spell-Slot', '1-leading-digit', 'has space', ''])('rejects %s', (s) => {
    expect(ResourceKeySchema.safeParse(s).success).toBe(false);
  });
});

describe('AbilityScoreSchema', () => {
  it.each(['str', 'dex', 'con', 'int', 'wis', 'cha'])('accepts %s', (s) => {
    expect(AbilityScoreSchema.parse(s)).toBe(s);
  });
  it('rejects unknown ability', () => {
    expect(AbilityScoreSchema.safeParse('luck').success).toBe(false);
  });
});

describe('DamageTypeSchema', () => {
  it('accepts all 13 5.5e damage types', () => {
    const all = [
      'acid',
      'bludgeoning',
      'cold',
      'fire',
      'force',
      'lightning',
      'necrotic',
      'piercing',
      'poison',
      'psychic',
      'radiant',
      'slashing',
      'thunder',
    ];
    for (const t of all) expect(DamageTypeSchema.parse(t)).toBe(t);
  });
  it('rejects unknown damage type', () => {
    expect(DamageTypeSchema.safeParse('arcane').success).toBe(false);
  });
});

describe('SizeSchema', () => {
  it.each(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'])('accepts %s', (s) => {
    expect(SizeSchema.parse(s)).toBe(s);
  });
});

describe('CreatureTypeSchema', () => {
  it.each(['pc', 'monster'])('accepts %s', (s) => {
    expect(CreatureTypeSchema.parse(s)).toBe(s);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/primitives.test.ts`
Expected: FAIL — `primitives` module not found.

- [ ] **Step 3: Implement primitives**

Write `src/schemas/primitives.ts`:

```typescript
import { z } from 'zod';

export const DiceExpressionSchema = z
  .string()
  .regex(/^\d+d\d+([+\-]\d+)?$/, 'Must be a dice expression like "1d20", "3d6+5", "2d8-1"');
export type DiceExpression = z.infer<typeof DiceExpressionSchema>;

export const TagSchema = z
  .string()
  .regex(/^tag:[a-z][a-z0-9-]*$/, 'Tags must look like "tag:healing"');
export type Tag = z.infer<typeof TagSchema>;

export const ResourceKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'Resource keys must be lowercase kebab-case');
export type ResourceKey = z.infer<typeof ResourceKeySchema>;

export const AbilityScoreSchema = z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']);
export type AbilityScore = z.infer<typeof AbilityScoreSchema>;

export const DamageTypeSchema = z.enum([
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
]);
export type DamageType = z.infer<typeof DamageTypeSchema>;

export const SizeSchema = z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']);
export type Size = z.infer<typeof SizeSchema>;

export const CreatureTypeSchema = z.enum(['pc', 'monster']);
export type CreatureType = z.infer<typeof CreatureTypeSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/primitives.test.ts`
Expected: PASS — all describe blocks green.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/primitives.ts src/schemas/__tests__/primitives.test.ts
git commit -m "feat(schemas): add primitive schemas (dice, tag, resource key, ability, damage, size)"
```

---

## Task 7: Define Effect schema (discriminated union of damage / heal / apply-condition / remove-condition / resource-cost / movement / save-or-suck)

**Files:**
- Create: `src/schemas/effect.ts`
- Create: `src/schemas/__tests__/effect.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/effect.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { EffectSchema } from '../effect';

describe('EffectSchema', () => {
  it('accepts a damage effect', () => {
    expect(
      EffectSchema.parse({ kind: 'damage', amount: '3d6', damageType: 'fire' }),
    ).toMatchObject({ kind: 'damage' });
  });

  it('accepts a heal effect', () => {
    expect(EffectSchema.parse({ kind: 'heal', amount: '2d4+2' })).toMatchObject({ kind: 'heal' });
  });

  it('accepts an apply-condition effect with optional duration', () => {
    expect(
      EffectSchema.parse({
        kind: 'apply-condition',
        condition: 'prone',
        duration: '1 round',
      }),
    ).toMatchObject({ kind: 'apply-condition', condition: 'prone' });
  });

  it('accepts a remove-condition effect', () => {
    expect(
      EffectSchema.parse({ kind: 'remove-condition', condition: 'frightened' }),
    ).toMatchObject({ kind: 'remove-condition' });
  });

  it('accepts a resource-cost effect', () => {
    expect(
      EffectSchema.parse({ kind: 'resource-cost', resource: 'spell-slot-3', amount: 1 }),
    ).toMatchObject({ kind: 'resource-cost' });
  });

  it('accepts a movement effect', () => {
    expect(
      EffectSchema.parse({ kind: 'movement', distance: 30, direction: 'forced' }),
    ).toMatchObject({ kind: 'movement' });
  });

  it('accepts a save-or-suck effect with on-fail and on-success', () => {
    expect(
      EffectSchema.parse({
        kind: 'save-or-suck',
        ability: 'dex',
        dc: 15,
        onFail: { kind: 'damage', amount: '8d6', damageType: 'fire' },
        onSuccess: { kind: 'damage', amount: '4d6', damageType: 'fire' },
      }),
    ).toMatchObject({ kind: 'save-or-suck', ability: 'dex' });
  });

  it('rejects an unknown effect kind', () => {
    expect(EffectSchema.safeParse({ kind: 'teleport' }).success).toBe(false);
  });

  it('rejects damage with missing damageType', () => {
    expect(EffectSchema.safeParse({ kind: 'damage', amount: '1d6' }).success).toBe(false);
  });

  it('rejects damage with invalid dice expression', () => {
    expect(
      EffectSchema.safeParse({ kind: 'damage', amount: 'not-dice', damageType: 'fire' }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/effect.test.ts`
Expected: FAIL — `effect` module not found.

- [ ] **Step 3: Implement Effect**

Write `src/schemas/effect.ts`:

```typescript
import { z } from 'zod';
import { AbilityScoreSchema, DamageTypeSchema, DiceExpressionSchema, ResourceKeySchema } from './primitives';

const DamageEffectSchema = z.object({
  kind: z.literal('damage'),
  amount: DiceExpressionSchema,
  damageType: DamageTypeSchema,
});

const HealEffectSchema = z.object({
  kind: z.literal('heal'),
  amount: DiceExpressionSchema,
});

const ApplyConditionEffectSchema = z.object({
  kind: z.literal('apply-condition'),
  condition: z.string().min(1),
  duration: z.string().optional(),
});

const RemoveConditionEffectSchema = z.object({
  kind: z.literal('remove-condition'),
  condition: z.string().min(1),
});

const ResourceCostEffectSchema = z.object({
  kind: z.literal('resource-cost'),
  resource: ResourceKeySchema,
  amount: z.number().int().positive(),
});

const MovementEffectSchema = z.object({
  kind: z.literal('movement'),
  distance: z.number().int(),
  direction: z.enum(['forced', 'free']),
});

export type DamageEffect = z.infer<typeof DamageEffectSchema>;
export type HealEffect = z.infer<typeof HealEffectSchema>;
export type ApplyConditionEffect = z.infer<typeof ApplyConditionEffectSchema>;
export type RemoveConditionEffect = z.infer<typeof RemoveConditionEffectSchema>;
export type ResourceCostEffect = z.infer<typeof ResourceCostEffectSchema>;
export type MovementEffect = z.infer<typeof MovementEffectSchema>;

export interface SaveOrSuckEffect {
  kind: 'save-or-suck';
  ability: z.infer<typeof AbilityScoreSchema>;
  dc: number;
  onFail: Effect;
  onSuccess?: Effect;
}

export type Effect =
  | DamageEffect
  | HealEffect
  | ApplyConditionEffect
  | RemoveConditionEffect
  | ResourceCostEffect
  | MovementEffect
  | SaveOrSuckEffect;

const SaveOrSuckEffectSchema: z.ZodType<SaveOrSuckEffect> = z.lazy(() =>
  z.object({
    kind: z.literal('save-or-suck'),
    ability: AbilityScoreSchema,
    dc: z.number().int().min(1),
    onFail: EffectSchema,
    onSuccess: EffectSchema.optional(),
  }),
);

export const EffectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.union([
    DamageEffectSchema,
    HealEffectSchema,
    ApplyConditionEffectSchema,
    RemoveConditionEffectSchema,
    ResourceCostEffectSchema,
    MovementEffectSchema,
    SaveOrSuckEffectSchema,
  ]),
);
```

Note on the recursive type: `save-or-suck` references `Effect` recursively (`onFail`, `onSuccess`), which requires `z.lazy()`. We use `z.union` rather than `z.discriminatedUnion` because the latter doesn't compose cleanly with `z.lazy` recursion. Validation is slightly slower but correct; if perf becomes an issue we can revisit at the engine layer.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/effect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/effect.ts src/schemas/__tests__/effect.test.ts
git commit -m "feat(schemas): add Effect union (damage/heal/condition/resource/movement/save-or-suck)"
```

---

## Task 8: Define Condition schema (well-known SRD conditions plus custom)

**Files:**
- Create: `src/schemas/condition.ts`
- Create: `src/schemas/__tests__/condition.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/condition.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ConditionSchema, ActiveConditionSchema, SRD_CONDITION_IDS } from '../condition';

describe('ConditionSchema', () => {
  it('accepts a fully specified condition', () => {
    expect(
      ConditionSchema.parse({
        id: 'prone',
        name: 'Prone',
        description: 'A prone creature\'s only movement option is to crawl...',
        rules: ['attack-rolls-disadvantage', 'attacker-melee-advantage'],
      }),
    ).toMatchObject({ id: 'prone' });
  });

  it('rejects empty name', () => {
    expect(
      ConditionSchema.safeParse({ id: 'foo', name: '', description: 'd', rules: [] }).success,
    ).toBe(false);
  });
});

describe('SRD_CONDITION_IDS', () => {
  it('contains the full 5.5e SRD condition list', () => {
    expect(SRD_CONDITION_IDS).toEqual(
      expect.arrayContaining([
        'blinded',
        'charmed',
        'deafened',
        'exhaustion',
        'frightened',
        'grappled',
        'incapacitated',
        'invisible',
        'paralyzed',
        'petrified',
        'poisoned',
        'prone',
        'restrained',
        'stunned',
        'unconscious',
      ]),
    );
  });
});

describe('ActiveConditionSchema', () => {
  it('accepts active condition with optional duration and source', () => {
    expect(
      ActiveConditionSchema.parse({
        id: 'frightened',
        duration: 'until end of next turn',
        sourceId: 'goblin-shaman-1',
      }),
    ).toMatchObject({ id: 'frightened' });
  });

  it('accepts minimal active condition', () => {
    expect(ActiveConditionSchema.parse({ id: 'prone' })).toMatchObject({ id: 'prone' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/condition.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Condition**

Write `src/schemas/condition.ts`:

```typescript
import { z } from 'zod';

export const SRD_CONDITION_IDS = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
] as const;
export type SrdConditionId = (typeof SRD_CONDITION_IDS)[number];

export const ConditionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  rules: z.array(z.string()).default([]),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const ActiveConditionSchema = z.object({
  id: z.string().min(1),
  duration: z.string().optional(),
  sourceId: z.string().optional(),
});
export type ActiveCondition = z.infer<typeof ActiveConditionSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/condition.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/condition.ts src/schemas/__tests__/condition.test.ts
git commit -m "feat(schemas): add Condition + ActiveCondition + SRD condition ID list"
```

---

## Task 9: Define Action schema (with tags, costs, target shape, effects)

**Files:**
- Create: `src/schemas/action.ts`
- Create: `src/schemas/__tests__/action.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/action.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ActionSchema } from '../action';

const fireball = {
  id: 'spell-fireball',
  name: 'Fireball',
  tags: ['tag:aoe-damage', 'tag:fire'],
  cost: { kind: 'action' },
  resourceCost: [{ resource: 'spell-slot-3', amount: 1 }],
  target: { kind: 'sphere', radius: 20, range: 150 },
  attack: null,
  effects: [
    {
      kind: 'save-or-suck',
      ability: 'dex',
      dc: 15,
      onFail: { kind: 'damage', amount: '8d6', damageType: 'fire' },
      onSuccess: { kind: 'damage', amount: '4d6', damageType: 'fire' },
    },
  ],
};

const longsword = {
  id: 'weapon-longsword',
  name: 'Longsword',
  tags: ['weapon-attack', 'tag:single-target-damage'],
  cost: { kind: 'action' },
  resourceCost: [],
  target: { kind: 'single', range: 5 },
  attack: { abilityMod: 'str', proficient: true, bonus: 0 },
  effects: [{ kind: 'damage', amount: '1d8+3', damageType: 'slashing' }],
};

describe('ActionSchema', () => {
  it('accepts a spell action (Fireball)', () => {
    expect(ActionSchema.parse(fireball)).toMatchObject({ id: 'spell-fireball' });
  });

  it('accepts a weapon action (Longsword)', () => {
    expect(ActionSchema.parse(longsword)).toMatchObject({ id: 'weapon-longsword' });
  });

  it('rejects an action with no tags', () => {
    expect(ActionSchema.safeParse({ ...longsword, tags: [] }).success).toBe(false);
  });

  it('rejects an action with malformed tag', () => {
    expect(ActionSchema.safeParse({ ...longsword, tags: ['Healing'] }).success).toBe(false);
  });

  it('rejects an action with unknown cost kind', () => {
    expect(
      ActionSchema.safeParse({ ...longsword, cost: { kind: 'mega-action' } }).success,
    ).toBe(false);
  });

  it('accepts cone, line, cube, cylinder targets', () => {
    for (const target of [
      { kind: 'cone', length: 15, range: 0 },
      { kind: 'line', length: 30, width: 5, range: 0 },
      { kind: 'cube', side: 20, range: 60 },
      { kind: 'cylinder', radius: 10, height: 40, range: 60 },
    ]) {
      expect(ActionSchema.parse({ ...fireball, target }).target.kind).toBe(target.kind);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/action.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Action**

Write `src/schemas/action.ts`:

```typescript
import { z } from 'zod';
import { AbilityScoreSchema, ResourceKeySchema, TagSchema } from './primitives';
import { EffectSchema } from './effect';

const ActionCostSchema = z.object({
  kind: z.enum(['action', 'bonus-action', 'reaction', 'free', 'movement', 'no-action']),
});

const TargetShapeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('single'), range: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('multiple'), count: z.number().int().positive(), range: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('self') }),
  z.object({ kind: z.literal('cone'), length: z.number().int().positive(), range: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('line'),
    length: z.number().int().positive(),
    width: z.number().int().positive(),
    range: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal('sphere'),
    radius: z.number().int().positive(),
    range: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal('cube'), side: z.number().int().positive(), range: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('cylinder'),
    radius: z.number().int().positive(),
    height: z.number().int().positive(),
    range: z.number().int().nonnegative(),
  }),
]);

const AttackSchema = z.object({
  abilityMod: AbilityScoreSchema,
  proficient: z.boolean(),
  bonus: z.number().int().default(0),
});

export const ActionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tags: z.array(TagSchema).min(1),
  cost: ActionCostSchema,
  resourceCost: z
    .array(z.object({ resource: ResourceKeySchema, amount: z.number().int().positive() }))
    .default([]),
  target: TargetShapeSchema,
  attack: AttackSchema.nullable(),
  effects: z.array(EffectSchema).min(1),
});
export type Action = z.infer<typeof ActionSchema>;
export type TargetShape = z.infer<typeof TargetShapeSchema>;
export type ActionCost = z.infer<typeof ActionCostSchema>;
export type Attack = z.infer<typeof AttackSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/action.ts src/schemas/__tests__/action.test.ts
git commit -m "feat(schemas): add Action schema with tags, costs, target shapes, attack, effects"
```

---

## Task 10: Define Combatant schema (PCs and monsters share)

**Files:**
- Create: `src/schemas/combatant.ts`
- Create: `src/schemas/__tests__/combatant.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/combatant.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CombatantSchema } from '../combatant';

const goblin = {
  id: 'goblin-1',
  name: 'Goblin',
  size: 'small',
  type: 'monster',
  hp: 7,
  maxHp: 7,
  tempHp: 0,
  ac: 15,
  speed: 30,
  abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
  saves: { str: -1, dex: 2, con: 0, int: 0, wis: -1, cha: -1 },
  skills: { stealth: 6 },
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
  resources: {},
  actionIds: ['weapon-shortbow', 'weapon-scimitar'],
  position: { x: 4, y: 7 },
  conditions: [],
  concentration: null,
  equipment: [],
};

describe('CombatantSchema', () => {
  it('accepts a goblin', () => {
    expect(CombatantSchema.parse(goblin)).toMatchObject({ id: 'goblin-1' });
  });

  it('accepts a PC with spell slot resources', () => {
    const wizard = {
      ...goblin,
      id: 'wizard-anya',
      type: 'pc',
      size: 'medium',
      hp: 24,
      maxHp: 24,
      ac: 12,
      abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
      saves: { str: -1, dex: 2, con: 4, int: 5, wis: 1, cha: 0 },
      resources: {
        'spell-slot-1': { current: 4, max: 4 },
        'spell-slot-2': { current: 3, max: 3 },
      },
      actionIds: ['weapon-quarterstaff', 'spell-fire-bolt', 'spell-magic-missile'],
    };
    expect(CombatantSchema.parse(wizard)).toMatchObject({ type: 'pc' });
  });

  it('rejects negative HP', () => {
    expect(CombatantSchema.safeParse({ ...goblin, hp: -1 }).success).toBe(false);
  });

  it('rejects ability score outside 1-30', () => {
    expect(
      CombatantSchema.safeParse({ ...goblin, abilities: { ...goblin.abilities, str: 0 } }).success,
    ).toBe(false);
    expect(
      CombatantSchema.safeParse({ ...goblin, abilities: { ...goblin.abilities, str: 31 } }).success,
    ).toBe(false);
  });

  it('rejects current > max in a resource pool', () => {
    expect(
      CombatantSchema.safeParse({
        ...goblin,
        resources: { 'rage-uses': { current: 5, max: 2 } },
      }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/combatant.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Combatant**

Write `src/schemas/combatant.ts`:

```typescript
import { z } from 'zod';
import {
  AbilityScoreSchema,
  CreatureTypeSchema,
  DamageTypeSchema,
  ResourceKeySchema,
  SizeSchema,
} from './primitives';
import { ActiveConditionSchema } from './condition';

const ResourcePoolSchema = z
  .object({
    current: z.number().int().min(0),
    max: z.number().int().min(0),
  })
  .refine((v) => v.current <= v.max, { message: 'current must be <= max' });

const PositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

const ConcentrationSchema = z.object({
  spellId: z.string().min(1),
  targets: z.array(z.string()),
});

const AbilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
});

const SavesSchema = z.object({
  str: z.number().int(),
  dex: z.number().int(),
  con: z.number().int(),
  int: z.number().int(),
  wis: z.number().int(),
  cha: z.number().int(),
});

export const CombatantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  size: SizeSchema,
  type: CreatureTypeSchema,
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  tempHp: z.number().int().min(0).default(0),
  ac: z.number().int().min(0),
  speed: z.number().int().min(0).default(30),
  abilities: AbilityScoresSchema,
  saves: SavesSchema,
  skills: z.record(z.string(), z.number().int()).default({}),
  damageResistances: z.array(DamageTypeSchema).default([]),
  damageImmunities: z.array(DamageTypeSchema).default([]),
  damageVulnerabilities: z.array(DamageTypeSchema).default([]),
  conditionImmunities: z.array(z.string()).default([]),
  resources: z.record(ResourceKeySchema, ResourcePoolSchema).default({}),
  actionIds: z.array(z.string().min(1)).default([]),
  position: PositionSchema.optional(),
  conditions: z.array(ActiveConditionSchema).default([]),
  concentration: ConcentrationSchema.nullable().default(null),
  equipment: z.array(z.string()).default([]),
});
export type Combatant = z.infer<typeof CombatantSchema>;
export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type Saves = z.infer<typeof SavesSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type ResourcePool = z.infer<typeof ResourcePoolSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/combatant.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/combatant.ts src/schemas/__tests__/combatant.test.ts
git commit -m "feat(schemas): add Combatant schema (shared by PCs and monsters)"
```

---

## Task 11: Define Persona schema (priority list with conditions and action matches)

**Files:**
- Create: `src/schemas/persona.ts`
- Create: `src/schemas/__tests__/persona.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/persona.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PersonaSchema } from '../persona';

const cautiousCleric = {
  id: 'cautious-cleric',
  name: 'Cautious Cleric',
  description: 'Heal first, AOE second, weapon last.',
  rules: [
    {
      condition: { kind: 'ally-hp-pct-below', threshold: 0.3 },
      actionMatch: { kind: 'tag', tag: 'tag:healing' },
    },
    {
      condition: { kind: 'enemies-in-burst-gte', count: 2 },
      actionMatch: { kind: 'tag', tag: 'tag:aoe-damage' },
    },
    {
      condition: { kind: 'always' },
      actionMatch: { kind: 'tag', tag: 'weapon-attack' },
    },
  ],
};

describe('PersonaSchema', () => {
  it('accepts a multi-rule persona', () => {
    expect(PersonaSchema.parse(cautiousCleric)).toMatchObject({ id: 'cautious-cleric' });
  });

  it('rejects a persona with empty rule list', () => {
    expect(PersonaSchema.safeParse({ ...cautiousCleric, rules: [] }).success).toBe(false);
  });

  it('accepts conditions: self.concentrating, slot-available, has-condition', () => {
    const p = {
      ...cautiousCleric,
      rules: [
        {
          condition: { kind: 'self-concentrating', value: false },
          actionMatch: { kind: 'tag', tag: 'tag:control' },
        },
        {
          condition: { kind: 'slot-available', level: 3, count: 1 },
          actionMatch: { kind: 'action-id', id: 'spell-fireball' },
        },
        {
          condition: { kind: 'target-has-condition', condition: 'prone' },
          actionMatch: { kind: 'tag', tag: 'weapon-attack' },
        },
      ],
    };
    expect(PersonaSchema.parse(p)).toMatchObject({ id: 'cautious-cleric' });
  });

  it('rejects unknown condition kind', () => {
    const p = {
      ...cautiousCleric,
      rules: [
        {
          condition: { kind: 'mood-is-grumpy' },
          actionMatch: { kind: 'tag', tag: 'tag:healing' },
        },
      ],
    };
    expect(PersonaSchema.safeParse(p).success).toBe(false);
  });

  it('rejects malformed action match', () => {
    const p = {
      ...cautiousCleric,
      rules: [
        {
          condition: { kind: 'always' },
          actionMatch: { kind: 'tag', tag: 'NotATag' },
        },
      ],
    };
    expect(PersonaSchema.safeParse(p).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/persona.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Persona**

Write `src/schemas/persona.ts`:

```typescript
import { z } from 'zod';
import { TagSchema } from './primitives';

const PersonaConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('always') }),
  z.object({ kind: z.literal('ally-hp-pct-below'), threshold: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('self-hp-pct-below'), threshold: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('enemies-in-burst-gte'), count: z.number().int().min(1) }),
  z.object({ kind: z.literal('enemies-in-melee-gte'), count: z.number().int().min(1) }),
  z.object({ kind: z.literal('self-concentrating'), value: z.boolean() }),
  z.object({
    kind: z.literal('slot-available'),
    level: z.number().int().min(1).max(9),
    count: z.number().int().min(1),
  }),
  z.object({ kind: z.literal('target-has-condition'), condition: z.string().min(1) }),
  z.object({ kind: z.literal('combat-round-gte'), round: z.number().int().min(1) }),
]);
export type PersonaCondition = z.infer<typeof PersonaConditionSchema>;

const PersonaActionMatchSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('tag'), tag: TagSchema }),
  z.object({ kind: z.literal('action-id'), id: z.string().min(1) }),
]);
export type PersonaActionMatch = z.infer<typeof PersonaActionMatchSchema>;

const PersonaRuleSchema = z.object({
  condition: PersonaConditionSchema,
  actionMatch: PersonaActionMatchSchema,
});
export type PersonaRule = z.infer<typeof PersonaRuleSchema>;

export const PersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  rules: z.array(PersonaRuleSchema).min(1),
});
export type Persona = z.infer<typeof PersonaSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/persona.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/persona.ts src/schemas/__tests__/persona.test.ts
git commit -m "feat(schemas): add Persona schema (priority list of condition/action-match rules)"
```

---

## Task 12: Define AdventureNode schema (discriminated union of node kinds)

**Files:**
- Create: `src/schemas/adventureNode.ts`
- Create: `src/schemas/__tests__/adventureNode.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/adventureNode.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AdventureNodeSchema } from '../adventureNode';

describe('AdventureNodeSchema', () => {
  it('accepts a Combat node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'goblin-ambush',
        kind: 'combat',
        name: 'Goblin Ambush',
        monsters: [
          { combatantTemplateId: 'goblin', count: 4, position: { x: 5, y: 5 } },
        ],
        partyStartPositions: [{ x: 0, y: 5 }],
        terrain: { width: 20, height: 10, features: [] },
      }),
    ).toMatchObject({ kind: 'combat' });
  });

  it('accepts a SkillCheck node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'spot-tracks',
        kind: 'skill-check',
        name: 'Spot Tracks',
        ability: 'wis',
        skill: 'survival',
        dc: 12,
        mode: 'single',
      }),
    ).toMatchObject({ kind: 'skill-check' });
  });

  it('accepts a Branch node with weighted options', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'fight-or-flee',
        kind: 'branch',
        name: 'Fight or Flee',
        options: [
          { id: 'fight', label: 'Fight', weight: 0.7 },
          { id: 'flee', label: 'Flee', weight: 0.3 },
        ],
      }),
    ).toMatchObject({ kind: 'branch' });
  });

  it('accepts a Rest node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'rest-1',
        kind: 'rest',
        name: 'Camp',
        restKind: 'long',
      }),
    ).toMatchObject({ kind: 'rest', restKind: 'long' });
  });

  it('accepts a Loot node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'loot-cave',
        kind: 'loot',
        name: 'Cave Treasure',
        items: [{ itemId: 'gold-pieces', amount: 50 }],
        distribution: 'even',
      }),
    ).toMatchObject({ kind: 'loot' });
  });

  it('accepts a Travel node with optional random encounters', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'travel-1',
        kind: 'travel',
        name: 'Road to Phandalin',
        hours: 8,
        exhaustionCheck: true,
        randomEncounters: [{ probability: 0.2, combatNodeId: 'wolf-pack' }],
      }),
    ).toMatchObject({ kind: 'travel' });
  });

  it('accepts a Custom node with author script', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'custom-puzzle',
        kind: 'custom',
        name: 'Riddle Door',
        script: 'function run(state) { return { transition: "next" }; }',
      }),
    ).toMatchObject({ kind: 'custom' });
  });

  it('rejects unknown kind', () => {
    expect(AdventureNodeSchema.safeParse({ id: 'x', kind: 'mystery', name: 'x' }).success).toBe(
      false,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/adventureNode.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement AdventureNode**

Write `src/schemas/adventureNode.ts`:

```typescript
import { z } from 'zod';
import { AbilityScoreSchema } from './primitives';

const PositionSchema = z.object({ x: z.number().int(), y: z.number().int() });

const TerrainFeatureSchema = z.object({
  kind: z.enum(['cover-half', 'cover-three-quarters', 'cover-full', 'difficult-terrain']),
  cells: z.array(PositionSchema).min(1),
});

const CombatNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('combat'),
  name: z.string().min(1),
  description: z.string().default(''),
  monsters: z
    .array(
      z.object({
        combatantTemplateId: z.string().min(1),
        count: z.number().int().min(1),
        position: PositionSchema.optional(),
      }),
    )
    .min(1),
  partyStartPositions: z.array(PositionSchema).min(1),
  terrain: z.object({
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    features: z.array(TerrainFeatureSchema).default([]),
  }),
});

const SkillCheckNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('skill-check'),
  name: z.string().min(1),
  description: z.string().default(''),
  ability: AbilityScoreSchema,
  skill: z.string().optional(),
  dc: z.number().int().min(1),
  mode: z.enum(['single', 'group']),
});

const BranchNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('branch'),
  name: z.string().min(1),
  description: z.string().default(''),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        weight: z.number().min(0).max(1),
      }),
    )
    .min(2),
});

const RestNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('rest'),
  name: z.string().min(1),
  description: z.string().default(''),
  restKind: z.enum(['short', 'long']),
});

const LootNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('loot'),
  name: z.string().min(1),
  description: z.string().default(''),
  items: z
    .array(z.object({ itemId: z.string().min(1), amount: z.number().int().min(1) }))
    .min(1),
  distribution: z.enum(['even', 'random', 'class-fit']),
});

const TravelNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('travel'),
  name: z.string().min(1),
  description: z.string().default(''),
  hours: z.number().min(0),
  exhaustionCheck: z.boolean().default(false),
  randomEncounters: z
    .array(
      z.object({
        probability: z.number().min(0).max(1),
        combatNodeId: z.string().min(1),
      }),
    )
    .default([]),
});

const CustomNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('custom'),
  name: z.string().min(1),
  description: z.string().default(''),
  script: z.string().min(1),
});

export const AdventureNodeSchema = z.discriminatedUnion('kind', [
  CombatNodeSchema,
  SkillCheckNodeSchema,
  BranchNodeSchema,
  RestNodeSchema,
  LootNodeSchema,
  TravelNodeSchema,
  CustomNodeSchema,
]);
export type AdventureNode = z.infer<typeof AdventureNodeSchema>;
export type CombatNode = z.infer<typeof CombatNodeSchema>;
export type SkillCheckNode = z.infer<typeof SkillCheckNodeSchema>;
export type BranchNode = z.infer<typeof BranchNodeSchema>;
export type RestNode = z.infer<typeof RestNodeSchema>;
export type LootNode = z.infer<typeof LootNodeSchema>;
export type TravelNode = z.infer<typeof TravelNodeSchema>;
export type CustomNode = z.infer<typeof CustomNodeSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/adventureNode.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/adventureNode.ts src/schemas/__tests__/adventureNode.test.ts
git commit -m "feat(schemas): add AdventureNode discriminated union (combat/skill/branch/rest/loot/travel/custom)"
```

---

## Task 13: Define Adventure schema (graph: nodes + edges with conditional transitions)

**Files:**
- Create: `src/schemas/adventure.ts`
- Create: `src/schemas/__tests__/adventure.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/adventure.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AdventureSchema } from '../adventure';

const phandalin = {
  id: 'phandalin-mini',
  name: 'Phandalin (mini)',
  description: 'Tiny Phandalin warm-up.',
  startNodeId: 'goblin-ambush',
  endNodeIds: ['phandalin-arrived'],
  nodes: [
    {
      id: 'goblin-ambush',
      kind: 'combat',
      name: 'Ambush',
      monsters: [{ combatantTemplateId: 'goblin', count: 4 }],
      partyStartPositions: [{ x: 0, y: 0 }],
      terrain: { width: 20, height: 10, features: [] },
    },
    {
      id: 'phandalin-arrived',
      kind: 'rest',
      name: 'Stonehill Inn',
      restKind: 'long',
    },
  ],
  edges: [
    {
      from: 'goblin-ambush',
      to: 'phandalin-arrived',
      condition: { kind: 'on-outcome', outcome: 'victory' },
    },
  ],
};

describe('AdventureSchema', () => {
  it('accepts a minimal valid adventure', () => {
    expect(AdventureSchema.parse(phandalin)).toMatchObject({ id: 'phandalin-mini' });
  });

  it('rejects an adventure where startNodeId points to a non-existent node', () => {
    expect(
      AdventureSchema.safeParse({ ...phandalin, startNodeId: 'nope' }).success,
    ).toBe(false);
  });

  it('rejects an adventure where an endNodeId points to a non-existent node', () => {
    expect(
      AdventureSchema.safeParse({ ...phandalin, endNodeIds: ['nope'] }).success,
    ).toBe(false);
  });

  it('rejects an edge whose `from` or `to` references a non-existent node', () => {
    expect(
      AdventureSchema.safeParse({
        ...phandalin,
        edges: [{ from: 'nope', to: 'phandalin-arrived', condition: { kind: 'always' } }],
      }).success,
    ).toBe(false);
  });

  it('accepts edges with always / on-outcome / on-branch-option / on-skill-result conditions', () => {
    const a = {
      ...phandalin,
      edges: [
        { from: 'goblin-ambush', to: 'phandalin-arrived', condition: { kind: 'always' } },
        {
          from: 'goblin-ambush',
          to: 'phandalin-arrived',
          condition: { kind: 'on-outcome', outcome: 'victory' },
        },
      ],
    };
    expect(AdventureSchema.parse(a).edges.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/adventure.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Adventure**

Write `src/schemas/adventure.ts`:

```typescript
import { z } from 'zod';
import { AdventureNodeSchema } from './adventureNode';

const TransitionConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('always') }),
  z.object({ kind: z.literal('on-outcome'), outcome: z.enum(['victory', 'defeat', 'fled']) }),
  z.object({ kind: z.literal('on-branch-option'), optionId: z.string().min(1) }),
  z.object({ kind: z.literal('on-skill-result'), result: z.enum(['success', 'failure']) }),
]);
export type TransitionCondition = z.infer<typeof TransitionConditionSchema>;

const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  condition: TransitionConditionSchema,
});
export type AdventureEdge = z.infer<typeof EdgeSchema>;

export const AdventureSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().default(''),
    startNodeId: z.string().min(1),
    endNodeIds: z.array(z.string().min(1)).min(1),
    nodes: z.array(AdventureNodeSchema).min(1),
    edges: z.array(EdgeSchema).default([]),
  })
  .superRefine((adv, ctx) => {
    const ids = new Set(adv.nodes.map((n) => n.id));
    if (!ids.has(adv.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `startNodeId "${adv.startNodeId}" not in nodes`,
        path: ['startNodeId'],
      });
    }
    for (const eid of adv.endNodeIds) {
      if (!ids.has(eid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `endNodeId "${eid}" not in nodes`,
          path: ['endNodeIds'],
        });
      }
    }
    adv.edges.forEach((e, i) => {
      if (!ids.has(e.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge[${i}].from "${e.from}" not in nodes`,
          path: ['edges', i, 'from'],
        });
      }
      if (!ids.has(e.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge[${i}].to "${e.to}" not in nodes`,
          path: ['edges', i, 'to'],
        });
      }
    });
  });
export type Adventure = z.infer<typeof AdventureSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/adventure.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/adventure.ts src/schemas/__tests__/adventure.test.ts
git commit -m "feat(schemas): add Adventure schema (graph with referential validation)"
```

---

## Task 14: Define Party schema (combatants paired with personas)

**Files:**
- Create: `src/schemas/party.ts`
- Create: `src/schemas/__tests__/party.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/party.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PartySchema } from '../party';

const baseCombatant = {
  id: 'pc-1',
  name: 'Anya',
  size: 'medium',
  type: 'pc',
  hp: 24,
  maxHp: 24,
  tempHp: 0,
  ac: 12,
  speed: 30,
  abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
  saves: { str: -1, dex: 2, con: 4, int: 5, wis: 1, cha: 0 },
  skills: {},
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
  resources: {},
  actionIds: ['weapon-quarterstaff'],
  conditions: [],
  concentration: null,
  equipment: [],
};

const persona = {
  id: 'cautious',
  name: 'Cautious',
  description: '',
  rules: [
    {
      condition: { kind: 'always' },
      actionMatch: { kind: 'tag', tag: 'weapon-attack' },
    },
  ],
};

describe('PartySchema', () => {
  it('accepts a party with one member', () => {
    expect(
      PartySchema.parse({
        id: 'party-1',
        name: 'The Heroes',
        members: [{ combatant: baseCombatant, persona }],
      }),
    ).toMatchObject({ id: 'party-1' });
  });

  it('rejects a party with no members', () => {
    expect(
      PartySchema.safeParse({ id: 'party-1', name: 'Empty', members: [] }).success,
    ).toBe(false);
  });

  it('rejects a party with duplicate combatant ids', () => {
    expect(
      PartySchema.safeParse({
        id: 'party-1',
        name: 'Dupes',
        members: [
          { combatant: baseCombatant, persona },
          { combatant: baseCombatant, persona },
        ],
      }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/party.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Party**

Write `src/schemas/party.ts`:

```typescript
import { z } from 'zod';
import { CombatantSchema } from './combatant';
import { PersonaSchema } from './persona';

const PartyMemberSchema = z.object({
  combatant: CombatantSchema,
  persona: PersonaSchema,
});
export type PartyMember = z.infer<typeof PartyMemberSchema>;

export const PartySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    members: z.array(PartyMemberSchema).min(1),
  })
  .superRefine((party, ctx) => {
    const ids = new Set<string>();
    party.members.forEach((m, i) => {
      if (ids.has(m.combatant.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate combatant id "${m.combatant.id}"`,
          path: ['members', i, 'combatant', 'id'],
        });
      }
      ids.add(m.combatant.id);
    });
  });
export type Party = z.infer<typeof PartySchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/party.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/party.ts src/schemas/__tests__/party.test.ts
git commit -m "feat(schemas): add Party schema (combatants paired with personas)"
```

---

## Task 15: Define Run, RunResult, RunEvent schemas

**Files:**
- Create: `src/schemas/run.ts`
- Create: `src/schemas/__tests__/run.test.ts`

- [ ] **Step 1: Write the failing test**

Write `src/schemas/__tests__/run.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { RunResultSchema, RunEventSchema, RunStateSchema } from '../run';

describe('RunEventSchema', () => {
  it('accepts a dice-roll event', () => {
    expect(
      RunEventSchema.parse({
        kind: 'dice-roll',
        roundIndex: 1,
        actorId: 'goblin-1',
        purpose: 'attack',
        expression: '1d20+4',
        rolls: [12],
        total: 16,
      }),
    ).toMatchObject({ kind: 'dice-roll' });
  });

  it('accepts an action-taken event', () => {
    expect(
      RunEventSchema.parse({
        kind: 'action-taken',
        roundIndex: 1,
        actorId: 'pc-anya',
        actionId: 'spell-magic-missile',
        targetIds: ['goblin-1'],
      }),
    ).toMatchObject({ kind: 'action-taken' });
  });

  it('accepts a damage-dealt event', () => {
    expect(
      RunEventSchema.parse({
        kind: 'damage-dealt',
        roundIndex: 1,
        targetId: 'goblin-1',
        amount: 9,
        damageType: 'force',
        sourceId: 'pc-anya',
      }),
    ).toMatchObject({ kind: 'damage-dealt' });
  });

  it('accepts a node-entered / node-exited event', () => {
    expect(
      RunEventSchema.parse({ kind: 'node-entered', roundIndex: 0, nodeId: 'goblin-ambush' }),
    ).toMatchObject({ kind: 'node-entered' });
    expect(
      RunEventSchema.parse({
        kind: 'node-exited',
        roundIndex: 5,
        nodeId: 'goblin-ambush',
        outcome: 'victory',
      }),
    ).toMatchObject({ kind: 'node-exited', outcome: 'victory' });
  });
});

describe('RunResultSchema', () => {
  it('accepts a complete run result', () => {
    expect(
      RunResultSchema.parse({
        runId: 'run-0001',
        seed: 'master:1',
        adventureId: 'phandalin-mini',
        partyId: 'party-1',
        outcome: 'victory',
        deaths: [],
        nodePath: ['goblin-ambush', 'phandalin-arrived'],
        events: [],
        finalParty: [],
        rounds: 7,
      }),
    ).toMatchObject({ outcome: 'victory' });
  });

  it('rejects unknown outcome', () => {
    expect(
      RunResultSchema.safeParse({
        runId: 'run-0001',
        seed: 'master:1',
        adventureId: 'phandalin-mini',
        partyId: 'party-1',
        outcome: 'meh',
        deaths: [],
        nodePath: [],
        events: [],
        finalParty: [],
        rounds: 0,
      }).success,
    ).toBe(false);
  });
});

describe('RunStateSchema', () => {
  it('accepts a snapshot', () => {
    expect(
      RunStateSchema.parse({
        runId: 'run-0001',
        currentNodeId: 'goblin-ambush',
        roundIndex: 3,
        partyState: [],
      }),
    ).toMatchObject({ runId: 'run-0001' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/run.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Run**

Write `src/schemas/run.ts`:

```typescript
import { z } from 'zod';
import { CombatantSchema } from './combatant';
import { DamageTypeSchema } from './primitives';

export const RunEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('dice-roll'),
    roundIndex: z.number().int().min(0),
    actorId: z.string().min(1),
    purpose: z.string().min(1),
    expression: z.string().min(1),
    rolls: z.array(z.number().int().min(1)),
    total: z.number().int(),
  }),
  z.object({
    kind: z.literal('action-taken'),
    roundIndex: z.number().int().min(0),
    actorId: z.string().min(1),
    actionId: z.string().min(1),
    targetIds: z.array(z.string()).default([]),
  }),
  z.object({
    kind: z.literal('damage-dealt'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    amount: z.number().int().min(0),
    damageType: DamageTypeSchema,
    sourceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('healed'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    amount: z.number().int().min(0),
    sourceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('condition-applied'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    conditionId: z.string().min(1),
    sourceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('condition-removed'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    conditionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('death'),
    roundIndex: z.number().int().min(0),
    combatantId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('node-entered'),
    roundIndex: z.number().int().min(0),
    nodeId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('node-exited'),
    roundIndex: z.number().int().min(0),
    nodeId: z.string().min(1),
    outcome: z.enum(['victory', 'defeat', 'fled', 'success', 'failure', 'completed']),
  }),
]);
export type RunEvent = z.infer<typeof RunEventSchema>;

export const RunResultSchema = z.object({
  runId: z.string().min(1),
  seed: z.string().min(1),
  adventureId: z.string().min(1),
  partyId: z.string().min(1),
  outcome: z.enum(['victory', 'defeat', 'fled']),
  deaths: z.array(z.string()),
  nodePath: z.array(z.string().min(1)),
  events: z.array(RunEventSchema),
  finalParty: z.array(CombatantSchema),
  rounds: z.number().int().min(0),
});
export type RunResult = z.infer<typeof RunResultSchema>;

export const RunStateSchema = z.object({
  runId: z.string().min(1),
  currentNodeId: z.string().min(1),
  roundIndex: z.number().int().min(0),
  partyState: z.array(CombatantSchema),
});
export type RunState = z.infer<typeof RunStateSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/run.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/run.ts src/schemas/__tests__/run.test.ts
git commit -m "feat(schemas): add Run, RunResult, RunEvent schemas"
```

---

## Task 16: Cross-validation tests + schemas index + README

**Files:**
- Create: `src/schemas/index.ts`
- Create: `src/schemas/__tests__/crossValidation.test.ts`
- Modify: `README.md` (currently doesn't exist — create)

- [ ] **Step 1: Create schemas/index.ts re-exporting everything**

Write `src/schemas/index.ts`:

```typescript
export * from './primitives';
export * from './effect';
export * from './condition';
export * from './action';
export * from './combatant';
export * from './persona';
export * from './adventureNode';
export * from './adventure';
export * from './party';
export * from './run';
```

- [ ] **Step 2: Write cross-validation tests**

Write `src/schemas/__tests__/crossValidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ActionSchema, CombatantSchema, PartySchema, PersonaSchema } from '..';

describe('cross-validation: persona action-id references must be resolvable on the combatant', () => {
  it('passes when persona references action-id present in combatant.actionIds', () => {
    const combatant = CombatantSchema.parse({
      id: 'pc-1',
      name: 'Tester',
      size: 'medium',
      type: 'pc',
      hp: 10,
      maxHp: 10,
      tempHp: 0,
      ac: 12,
      speed: 30,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      skills: {},
      damageResistances: [],
      damageImmunities: [],
      damageVulnerabilities: [],
      conditionImmunities: [],
      resources: {},
      actionIds: ['spell-fireball'],
      conditions: [],
      concentration: null,
      equipment: [],
    });
    const persona = PersonaSchema.parse({
      id: 'p',
      name: 'p',
      description: '',
      rules: [
        {
          condition: { kind: 'always' },
          actionMatch: { kind: 'action-id', id: 'spell-fireball' },
        },
      ],
    });
    const am = persona.rules[0]!.actionMatch;
    expect(am.kind).toBe('action-id');
    if (am.kind === 'action-id') {
      expect(combatant.actionIds).toContain(am.id);
    }
  });
});

describe('cross-validation: tag-format-only enforcement at Phase 1', () => {
  it('accepts any tag matching the regex (closed taxonomy is Phase 7 work)', () => {
    const action = ActionSchema.parse({
      id: 'a',
      name: 'a',
      tags: ['tag:healing'],
      cost: { kind: 'action' },
      resourceCost: [],
      target: { kind: 'self' },
      attack: null,
      effects: [{ kind: 'heal', amount: '1d4' }],
    });
    expect(action.tags).toEqual(['tag:healing']);
  });
});

describe('cross-validation: party uses Combatant ids that round-trip', () => {
  it('combatant.id is preserved through PartySchema parse', () => {
    const party = PartySchema.parse({
      id: 'p',
      name: 'Heroes',
      members: [
        {
          combatant: {
            id: 'pc-1',
            name: 'Anya',
            size: 'medium',
            type: 'pc',
            hp: 1,
            maxHp: 1,
            tempHp: 0,
            ac: 10,
            speed: 30,
            abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            skills: {},
            damageResistances: [],
            damageImmunities: [],
            damageVulnerabilities: [],
            conditionImmunities: [],
            resources: {},
            actionIds: [],
            conditions: [],
            concentration: null,
            equipment: [],
          },
          persona: {
            id: 'p',
            name: 'p',
            description: '',
            rules: [
              {
                condition: { kind: 'always' },
                actionMatch: { kind: 'tag', tag: 'tag:healing' },
              },
            ],
          },
        },
      ],
    });
    expect(party.members[0]!.combatant.id).toBe('pc-1');
  });
});
```

- [ ] **Step 3: Run cross-validation tests**

Run: `npm test -- src/schemas/__tests__/crossValidation.test.ts`
Expected: PASS.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: ALL pass.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: PASS (with no warnings; if any, fix before continuing).

- [ ] **Step 7: Run production build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 8: Create README.md**

Write `README.md`:

```markdown
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
```

- [ ] **Step 9: Commit**

```bash
git add src/schemas/index.ts src/schemas/__tests__/crossValidation.test.ts README.md
git commit -m "feat(schemas): add index re-exports, cross-validation tests, project README"
```

- [ ] **Step 10: Final smoke test — verify a fresh clone runs cleanly**

Run (in a temp directory, optional but recommended):

```bash
git clone <repo-url> /tmp/partycast-smoke
cd /tmp/partycast-smoke
nvm use
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

Expected: every step passes. Cleanup: `rm -rf /tmp/partycast-smoke`.

---

## Roadmap (subsequent phases — each gets its own plan when ready)

| Phase | Scope | Depends on |
|-------|-------|------------|
| 2 | Engine: dice/RNG, grid geometry, basic combat (no reactions/spells) | Phase 1 |
| 3 | Engine: condition tracker, resource manager, rest engine | Phase 2 |
| 4 | Engine: spells, AOE geometry, reactions event-bus (the hardest piece) | Phase 3 |
| 5 | Application services: character builder service + progression rules + random party generator | Phase 1 (schemas), can parallelize with Phases 2-4 |
| 6 | Application services: adventure runner + node resolvers | Phases 2-4 |
| 7 | Application services: persona evaluator + tag taxonomy | Phases 2-4, 6 |
| 8 | Application services: Monte Carlo orchestrator + Web Worker pool | Phase 6, 7 |
| 9 | SRD 5.2 content authoring (data, no code) | Phase 1 (schemas); parallelizable per content category |
| 10 | UI: character builder | Phase 5 |
| 11 | UI: adventure editor + encounter editor (incl. grid map editor) | Phase 1 |
| 12 | UI: sim runner + stats dashboard + animated playback viewer | Phase 8 |
| 13 | UI: persona editor + library browser | Phases 1, 7 |
| 14 | Persistence: IndexedDB + ZIP import/export + share-via-URL | Phase 1 |

After Phase 1 ships, Phases 2 / 5 / 9 / 11 / 14 can be picked up in parallel by separate agents — they share the schemas dependency only. Phases 3, 4, 6, 7, 8, 10, 12, 13 have linear dependencies that should be respected.

The exit criteria for "V1 done" is roughly: Phases 1-9 complete (engine + content + services), Phases 10-13 with at least minimal UI for each surface, Phase 14 for save/load. Stretch features (richer persona DSL, Rust/WASM engine, DMG-only rules) are out of V1.
