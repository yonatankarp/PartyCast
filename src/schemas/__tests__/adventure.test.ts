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
      id: 'multi-cond',
      name: 'Multi-condition',
      description: '',
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
          id: 'fork',
          kind: 'branch',
          name: 'Fork',
          options: [
            { id: 'fight', label: 'Fight', weight: 0.7 },
            { id: 'flee', label: 'Flee', weight: 0.3 },
          ],
        },
        {
          id: 'spot',
          kind: 'skill-check',
          name: 'Spot',
          ability: 'wis',
          dc: 12,
          mode: 'single',
        },
        { id: 'phandalin-arrived', kind: 'rest', name: 'Inn', restKind: 'long' },
      ],
      edges: [
        { from: 'goblin-ambush', to: 'phandalin-arrived', condition: { kind: 'always' } },
        {
          from: 'goblin-ambush',
          to: 'phandalin-arrived',
          condition: { kind: 'on-outcome', outcome: 'victory' },
        },
        {
          from: 'fork',
          to: 'phandalin-arrived',
          condition: { kind: 'on-branch-option', optionId: 'fight' },
        },
        {
          from: 'spot',
          to: 'phandalin-arrived',
          condition: { kind: 'on-skill-result', result: 'success' },
        },
      ],
    };
    expect(AdventureSchema.parse(a).edges.length).toBe(4);
  });

  it('rejects on-outcome edge from non-combat source', () => {
    expect(
      AdventureSchema.safeParse({
        ...phandalin,
        edges: [
          {
            from: 'phandalin-arrived',
            to: 'phandalin-arrived',
            condition: { kind: 'on-outcome', outcome: 'victory' },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects on-branch-option with unknown optionId', () => {
    expect(
      AdventureSchema.safeParse({
        id: 'bad-option',
        name: 'Bad Option',
        startNodeId: 'fork',
        endNodeIds: ['phandalin-arrived'],
        nodes: [
          {
            id: 'fork',
            kind: 'branch',
            name: 'Fork',
            options: [
              { id: 'fight', label: 'Fight', weight: 0.5 },
              { id: 'flee', label: 'Flee', weight: 0.5 },
            ],
          },
          { id: 'phandalin-arrived', kind: 'rest', name: 'Inn', restKind: 'long' },
        ],
        edges: [
          {
            from: 'fork',
            to: 'phandalin-arrived',
            condition: { kind: 'on-branch-option', optionId: 'parley' },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects an adventure with duplicate node ids', () => {
    expect(
      AdventureSchema.safeParse({
        ...phandalin,
        nodes: [
          ...phandalin.nodes,
          {
            id: 'goblin-ambush',
            kind: 'rest',
            name: 'Duplicate',
            restKind: 'short',
          },
        ],
      }).success,
    ).toBe(false);
  });
});
