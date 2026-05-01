import { z } from 'zod';

export const DiceExpressionSchema = z
  .string()
  .regex(
    /^[1-9]\d*d(4|6|8|10|12|20|100)([+-]\d+)?$/,
    'Must be a dice expression using d4/d6/d8/d10/d12/d20/d100 like "1d20", "3d6+5", "2d8-1"',
  );
export type DiceExpression = z.infer<typeof DiceExpressionSchema>;

// `tag:` prefix is optional: prefixed forms (`tag:healing`) are persona-matching
// classifications; bare forms (`weapon-attack`, `dash`) are built-in SRD action
// categories. Both share the kebab-case shape and live under a single primitive.
// The regex enforces strict kebab-case: no leading/trailing/consecutive dashes
// (so `tag:foo-` and `foo--bar` both fail).
export const TagSchema = z
  .string()
  .regex(
    /^(tag:)?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    'Tags must be lowercase kebab-case, optionally prefixed with "tag:"',
  );
export type Tag = z.infer<typeof TagSchema>;

export const ResourceKeySchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    'Resource keys must be lowercase kebab-case',
  );
export type ResourceKey = z.infer<typeof ResourceKeySchema>;

// Distinct domain concept from ResourceKey/Tag despite the shared shape:
// rule tags are interpreted by the engine to apply mechanical effects of
// a condition (e.g. "attack-rolls-disadvantage"), whereas Tag identifies
// actions for persona matching and ResourceKey names a resource bucket.
export const RuleTagSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    'Rule tags must be lowercase kebab-case',
  );
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

// Closed taxonomy used by the Random Party Generator for role-balance
// heuristics and by personas via the `party-has-role` predicate.
export const PartyRoleSchema = z.enum(['tank', 'healer', 'damage', 'utility']);
export type PartyRole = z.infer<typeof PartyRoleSchema>;

// Integer grid coordinates. Used by combatants on the combat grid and by
// adventure-node terrain/start-position layouts.
export const PositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});
export type Position = z.infer<typeof PositionSchema>;

// Closed taxonomy of 5.5e SRD skills. The Skill/Save Resolver engine module
// owns the canonical lookup table; making this a closed enum at the schema
// boundary catches casing/whitespace authoring typos and prevents homebrew
// skill names from silently leaking into engine code.
export const SkillSchema = z.enum([
  'acrobatics',
  'animal-handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight-of-hand',
  'stealth',
  'survival',
]);
export type Skill = z.infer<typeof SkillSchema>;
