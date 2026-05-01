import { z } from 'zod';
import { AbilityScoreSchema, PositionSchema, SkillSchema } from './primitives';

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
  // 100x100 cap is generous: largest published 5e battle maps top out around
  // 60x60. Bigger grids in Monte Carlo would OOM workers without paying off
  // any real authoring use case.
  terrain: z.object({
    width: z.number().int().min(1).max(100),
    height: z.number().int().min(1).max(100),
    features: z.array(TerrainFeatureSchema).default([]),
  }),
});

const SkillCheckNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('skill-check'),
  name: z.string().min(1),
  description: z.string().default(''),
  ability: AbilityScoreSchema,
  skill: SkillSchema.optional(),
  dc: z.number().int().min(1),
  mode: z.enum(['single', 'group', 'contested']),
});

// Option weights are probabilities: must sum to 1 (within float epsilon).
// Catches the "two options at 0.6 each" authoring bug at parse time instead
// of letting Monte Carlo silently sample a non-distribution.
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
    .min(2)
    .superRefine((options, ctx) => {
      const sum = options.reduce((acc, o) => acc + o.weight, 0);
      if (Math.abs(sum - 1) > 1e-9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Branch option weights must sum to 1 (got ${sum})`,
        });
      }
    }),
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
  // itemId resolved against the item catalog when that schema lands
  // (deferred past Phase 1; matches Combatant.equipment).
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
  hours: z.number().positive(),
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
  // Script body validated structurally only. Semantic checks happen at
  // Worker load time per the spec's sandbox contract (no DOM, no network,
  // no storage). 100KB cap is generous for any legitimate authoring use.
  script: z.string().min(1).max(100_000),
});

// Uses z.discriminatedUnion (not z.union like EffectSchema) because nodes
// don't recurse - cross-node references are by ID, not by embedding - so
// the lazy-recursion constraint that forced union in effect.ts doesn't
// apply. Discriminated union gives precise path-aware errors.
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
