import { z } from 'zod';

export const DiceExpressionSchema = z
  .string()
  .regex(
    /^[1-9]\d*d(4|6|8|10|12|20|100)([+-]\d+)?$/,
    'Must be a dice expression using d4/d6/d8/d10/d12/d20/d100 like "1d20", "3d6+5", "2d8-1"',
  );
export type DiceExpression = z.infer<typeof DiceExpressionSchema>;

export const TagSchema = z
  .string()
  .regex(/^tag:[a-z][a-z0-9-]*$/, 'Tags must look like "tag:healing"');
export type Tag = z.infer<typeof TagSchema>;

export const ResourceKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'Resource keys must be lowercase kebab-case');
export type ResourceKey = z.infer<typeof ResourceKeySchema>;

// Distinct domain concept from ResourceKey/Tag despite the shared shape:
// rule tags are interpreted by the engine to apply mechanical effects of
// a condition (e.g. "attack-rolls-disadvantage"), whereas Tag identifies
// actions for persona matching and ResourceKey names a resource bucket.
export const RuleTagSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, 'Rule tags must be lowercase kebab-case');
export type RuleTag = z.infer<typeof RuleTagSchema>;

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
