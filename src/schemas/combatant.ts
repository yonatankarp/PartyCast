import { z } from 'zod';
import {
  CreatureTypeSchema,
  DamageTypeSchema,
  PositionSchema,
  ResourceKeySchema,
  SizeSchema,
  SkillSchema,
} from './primitives';
import { ConditionSchema } from './condition';

const ResourcePoolSchema = z
  .object({
    current: z.number().int().min(0),
    max: z.number().int().min(0),
  })
  .refine((v) => v.current <= v.max, {
    message: 'current must be <= max',
    path: ['current'],
  });

const ConcentrationSchema = z.object({
  spellId: z.string().min(1),
  targets: z.array(z.string().min(1)),
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
  // No default: 25/30/35 are all common (halflings 25, dwarves 25, humans 30,
  // tabaxi 30, monks 30+). A silent default would produce wrong-but-valid
  // combatants Monte Carlo could mask for hours.
  speed: z.number().int().min(0),
  // Optional because monsters use CR rather than level; PCs always set it.
  level: z.number().int().min(1).max(20).optional(),
  abilities: AbilityScoresSchema,
  saves: SavesSchema,
  skills: z.record(SkillSchema, z.number().int()).default({}),
  damageResistances: z.array(DamageTypeSchema).default([]),
  damageImmunities: z.array(DamageTypeSchema).default([]),
  damageVulnerabilities: z.array(DamageTypeSchema).default([]),
  conditionImmunities: z.array(z.string().min(1)).default([]),
  // Resource pools (spell slots, rage uses, channel divinity, hit dice, etc.).
  // PC hit dice live here keyed by die size: 'hit-dice-d6', 'hit-dice-d8', ...
  // Multi-classed PCs have multiple hit-dice entries.
  resources: z.record(ResourceKeySchema, ResourcePoolSchema).default({}),
  actionIds: z
    .array(z.string().min(1))
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate action id "${item}"`,
            path: [index],
          });
        }
        seen.add(item);
      });
    })
    .default([]),
  position: PositionSchema.optional(),
  conditions: z.array(ConditionSchema).default([]),
  concentration: ConcentrationSchema.nullable().default(null),
  // Equipment IDs; resolved against the item catalog when that schema lands
  // (deferred past Phase 1).
  equipment: z.array(z.string().min(1)).default([]),
})
  .refine((v) => v.hp <= v.maxHp, {
    message: 'hp must be <= maxHp',
    path: ['hp'],
  });
export type Combatant = z.infer<typeof CombatantSchema>;
export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type Saves = z.infer<typeof SavesSchema>;
export type ResourcePool = z.infer<typeof ResourcePoolSchema>;
