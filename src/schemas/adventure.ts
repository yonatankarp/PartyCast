import { z } from 'zod';
import { AdventureNodeSchema } from './adventureNode';

// `on-skill-result` collapses group-check thresholds and contested-check
// margins to a binary success/failure for V1. Richer outcome types
// (degree-of-success, margin) are deferred to whenever a real authoring
// case needs them.
const TransitionConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('always') }),
  z.object({ kind: z.literal('on-outcome'), outcome: z.enum(['victory', 'defeat', 'fled']) }),
  z.object({ kind: z.literal('on-branch-option'), optionId: z.string().min(1) }),
  z.object({ kind: z.literal('on-skill-result'), result: z.enum(['success', 'failure']) }),
]);
export type TransitionCondition = z.infer<typeof TransitionConditionSchema>;

const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  condition: TransitionConditionSchema,
});
export type AdventureEdge = z.infer<typeof EdgeSchema>;

export const AdventureSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().default(''),
    startNodeId: z.string().min(1),
    endNodeIds: z.array(z.string().min(1)).min(1),
    nodes: z.array(AdventureNodeSchema).min(1),
    edges: z.array(EdgeSchema).default([]),
  })
  // Cross-checks run only after all field-level validation passes (Zod gates
  // superRefine on field success). Authors fixing malformed nodes will see
  // referential errors on the next parse.
  .superRefine((adv, ctx) => {
    const seen = new Map<string, number>();
    adv.nodes.forEach((n, i) => {
      if (seen.has(n.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate node id "${n.id}" at index ${i} (also at ${seen.get(n.id) ?? '?'})`,
          path: ['nodes', i, 'id'],
        });
      } else {
        seen.set(n.id, i);
      }
    });
    const ids = new Set(adv.nodes.map((n) => n.id));
    if (!ids.has(adv.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `startNodeId "${adv.startNodeId}" not in nodes`,
        path: ['startNodeId'],
      });
    }
    adv.endNodeIds.forEach((eid, i) => {
      if (!ids.has(eid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `endNodeId "${eid}" not in nodes`,
          path: ['endNodeIds', i],
        });
      }
    });
    adv.edges.forEach((e, i) => {
      if (!ids.has(e.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge[${i}].from "${e.from}" not in nodes`,
          path: ['edges', i, 'from'],
        });
      }
      if (!ids.has(e.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge[${i}].to "${e.to}" not in nodes`,
          path: ['edges', i, 'to'],
        });
      }
    });
  });
export type Adventure = z.infer<typeof AdventureSchema>;
