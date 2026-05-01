import { z } from 'zod';
import { PartyRoleSchema, ResourceKeySchema, TagSchema } from './primitives';

const PersonaConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('always') }),
  z.object({ kind: z.literal('ally-hp-pct-below'), threshold: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('self-hp-pct-below'), threshold: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('enemies-in-burst-gte'), count: z.number().int().min(1) }),
  z.object({ kind: z.literal('enemies-in-melee-gte'), count: z.number().int().min(1) }),
  z.object({ kind: z.literal('self-concentrating'), value: z.boolean() }),
  z.object({
    kind: z.literal('self-has-resource'),
    resource: ResourceKeySchema,
    value: z.boolean(),
  }),
  z.object({
    kind: z.literal('slot-available'),
    level: z.number().int().min(1).max(9),
    count: z.number().int().min(1),
  }),
  z.object({ kind: z.literal('target-has-condition'), condition: z.string().min(1) }),
  z.object({ kind: z.literal('combat-round-eq'), round: z.number().int().min(1) }),
  z.object({ kind: z.literal('combat-round-gte'), round: z.number().int().min(1) }),
  z.object({ kind: z.literal('party-has-role'), role: PartyRoleSchema }),
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
