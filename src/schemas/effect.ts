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
  // `| undefined` is required because tsconfig has exactOptionalPropertyTypes;
  // Zod's `.optional()` produces `T | undefined`, and the assignment
  // `SaveOrSuckEffectSchema: z.ZodType<SaveOrSuckEffect>` only typechecks if
  // the interface admits the same shape.
  onSuccess?: Effect | undefined;
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

// Uses z.union not z.discriminatedUnion because the latter doesn't compose
// with z.lazy() recursion in Zod 3 (save-or-suck's onFail/onSuccess reference
// Effect recursively). Trade-off: error messages aren't discriminant-aware
// ("no union member matched" rather than "kind=damage, damageType missing").
// Revisit if Zod 4 lifts the restriction, or add a superRefine if error
// quality becomes a real UX problem.
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
