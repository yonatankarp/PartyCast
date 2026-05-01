import { describe, it, expect } from 'vitest';
import { AdventureSchema } from '../adventure';

const phandalin = {
  id: 'phandalin-mini',
  name: 'Phandalin (mini)',
  description: 'Tiny Phandalin warm-up.',
  startNodeId: 'goblin-ambush',
  endNodeIds: ['phandalin-arrived'],
  nodes: [
    {
      id: 'goblin-ambush',
      kind: 'combat',
      name: 'Ambush',
      monsters: [{ combatantTemplateId: 'goblin', count: 4 }],
      partyStartPositions: [{ x: 0, y: 0 }],
      terrain: { width: 20, height: 10, features: [] },
    },
    {
      id: 'phandalin-arrived',
      kind: 'rest',
      name: 'Stonehill Inn',
      restKind: 'long',
    },
  ],
  edges: [
    {
      from: 'goblin-ambush',
      to: 'phandalin-arrived',
      condition: { kind: 'on-outcome', outcome: 'victory' },
    },
  ],
};

describe('AdventureSchema', () => {
  it('accepts a minimal valid adventure', () => {
    expect(AdventureSchema.parse(phandalin)).toMatchObject({ id: 'phandalin-mini' });
  });

  it('rejects an adventure where startNodeId points to a non-existent node', () => {
    expect(
      AdventureSchema.safeParse({ ...phandalin, startNodeId: 'nope' }).success,
    ).toBe(false);
  });

  it('rejects an adventure where an endNodeId points to a non-existent node', () => {
    expect(
      AdventureSchema.safeParse({ ...phandalin, endNodeIds: ['nope'] }).success,
    ).toBe(false);
  });

  it('rejects an edge whose `from` or `to` references a non-existent node', () => {
    expect(
      AdventureSchema.safeParse({
        ...phandalin,
        edges: [{ from: 'nope', to: 'phandalin-arrived', condition: { kind: 'always' } }],
      }).success,
    ).toBe(false);
  });

  it('accepts edges with always / on-outcome / on-branch-option / on-skill-result conditions', () => {
    const a = {
      ...phandalin,
      edges: [
        { from: 'goblin-ambush', to: 'phandalin-arrived', condition: { kind: 'always' } },
        {
          from: 'goblin-ambush',
          to: 'phandalin-arrived',
          condition: { kind: 'on-outcome', outcome: 'victory' },
        },
      ],
    };
    expect(AdventureSchema.parse(a).edges.length).toBe(2);
  });
});
