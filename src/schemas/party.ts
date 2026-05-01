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
    const ids = new Set<string>();
    party.members.forEach((m, i) => {
      if (ids.has(m.combatant.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate combatant id "${m.combatant.id}"`,
          path: ['members', i, 'combatant', 'id'],
        });
      }
      ids.add(m.combatant.id);
    });
  });
export type Party = z.infer<typeof PartySchema>;
