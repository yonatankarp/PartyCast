import { describe, it, expect } from 'vitest';
import { RunResultSchema, RunEventSchema, RunStateSchema } from '../run';

describe('RunEventSchema', () => {
  it('accepts a dice-roll event', () => {
    expect(
      RunEventSchema.parse({
        kind: 'dice-roll',
        roundIndex: 1,
        actorId: 'goblin-1',
        purpose: 'attack',
        expression: '1d20+4',
        rolls: [12],
        total: 16,
      }),
    ).toMatchObject({ kind: 'dice-roll' });
  });

  it('accepts an action-taken event', () => {
    expect(
      RunEventSchema.parse({
        kind: 'action-taken',
        roundIndex: 1,
        actorId: 'pc-anya',
        actionId: 'spell-magic-missile',
        targetIds: ['goblin-1'],
      }),
    ).toMatchObject({ kind: 'action-taken' });
  });

  it('accepts a damage-dealt event', () => {
    expect(
      RunEventSchema.parse({
        kind: 'damage-dealt',
        roundIndex: 1,
        targetId: 'goblin-1',
        amount: 9,
        damageType: 'force',
        sourceId: 'pc-anya',
      }),
    ).toMatchObject({ kind: 'damage-dealt' });
  });

  it('accepts a node-entered / node-exited event', () => {
    expect(
      RunEventSchema.parse({ kind: 'node-entered', roundIndex: 0, nodeId: 'goblin-ambush' }),
    ).toMatchObject({ kind: 'node-entered' });
    expect(
      RunEventSchema.parse({
        kind: 'node-exited',
        roundIndex: 5,
        nodeId: 'goblin-ambush',
        outcome: 'victory',
      }),
    ).toMatchObject({ kind: 'node-exited', outcome: 'victory' });
  });
});

describe('RunResultSchema', () => {
  it('accepts a complete run result', () => {
    expect(
      RunResultSchema.parse({
        runId: 'run-0001',
        seed: 'master:1',
        adventureId: 'phandalin-mini',
        partyId: 'party-1',
        outcome: 'victory',
        deaths: [],
        nodePath: ['goblin-ambush', 'phandalin-arrived'],
        events: [],
        finalParty: [],
        rounds: 7,
      }),
    ).toMatchObject({ outcome: 'victory' });
  });

  it('rejects unknown outcome', () => {
    expect(
      RunResultSchema.safeParse({
        runId: 'run-0001',
        seed: 'master:1',
        adventureId: 'phandalin-mini',
        partyId: 'party-1',
        outcome: 'meh',
        deaths: [],
        nodePath: [],
        events: [],
        finalParty: [],
        rounds: 0,
      }).success,
    ).toBe(false);
  });
});

describe('RunStateSchema', () => {
  it('accepts a snapshot', () => {
    expect(
      RunStateSchema.parse({
        runId: 'run-0001',
        currentNodeId: 'goblin-ambush',
        roundIndex: 3,
        partyState: [],
      }),
    ).toMatchObject({ runId: 'run-0001' });
  });
});
