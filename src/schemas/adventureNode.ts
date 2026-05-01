import { z } from 'zod';
import { AbilityScoreSchema, PositionSchema } from './primitives';

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
