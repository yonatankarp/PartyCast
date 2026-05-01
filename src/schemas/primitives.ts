import { z } from 'zod';

export const DiceExpressionSchema = z
  .string()
  .regex(/^\d+d\d+([+-]\d+)?$/, 'Must be a dice expression like "1d20", "3d6+5", "2d8-1"');
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
