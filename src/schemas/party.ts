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
    const seen = new Map<string, number>();
    party.members.forEach((m, i) => {
      if (seen.has(m.combatant.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate combatant id "${m.combatant.id}" at index ${i} (also at ${seen.get(m.combatant.id) ?? '?'})`,
          path: ['members', i, 'combatant', 'id'],
        });
      } else {
        seen.set(m.combatant.id, i);
      }
    });
  });
export type Party = z.infer<typeof PartySchema>;
