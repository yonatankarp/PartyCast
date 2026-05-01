import { z } from 'zod';
import {
  CreatureTypeSchema,
  DamageTypeSchema,
  ResourceKeySchema,
  SizeSchema,
} from './primitives';
import { ConditionSchema } from './condition';

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
  conditions: z.array(ConditionSchema).default([]),
  concentration: ConcentrationSchema.nullable().default(null),
  equipment: z.array(z.string()).default([]),
});
export type Combatant = z.infer<typeof CombatantSchema>;
export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type Saves = z.infer<typeof SavesSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type ResourcePool = z.infer<typeof ResourcePoolSchema>;
