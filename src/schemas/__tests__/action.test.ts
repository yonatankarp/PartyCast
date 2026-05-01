import { describe, it, expect } from 'vitest';
import { ActionSchema } from '../action';

const fireball = {
  id: 'spell-fireball',
  name: 'Fireball',
  tags: ['tag:aoe-damage', 'tag:fire'],
  cost: { kind: 'action' },
  resourceCost: [{ resource: 'spell-slot-3', amount: 1 }],
  target: { kind: 'sphere', radius: 20, range: 150 },
  attack: null,
  effects: [
    {
      kind: 'save-or-suck',
      ability: 'dex',
      dc: 15,
      onFail: { kind: 'damage', amount: '8d6', damageType: 'fire' },
      onSuccess: { kind: 'damage', amount: '4d6', damageType: 'fire' },
    },
  ],
};

const longsword = {
  id: 'weapon-longsword',
  name: 'Longsword',
  tags: ['weapon-attack', 'tag:single-target-damage'],
  cost: { kind: 'action' },
  resourceCost: [],
  target: { kind: 'single', range: 5 },
  attack: { abilityMod: 'str', proficient: true, bonus: 0 },
  effects: [{ kind: 'damage', amount: '1d8+3', damageType: 'slashing' }],
};

describe('ActionSchema', () => {
  it('accepts a spell action (Fireball)', () => {
    expect(ActionSchema.parse(fireball)).toMatchObject({ id: 'spell-fireball' });
  });

  it('accepts a weapon action (Longsword)', () => {
    expect(ActionSchema.parse(longsword)).toMatchObject({ id: 'weapon-longsword' });
  });

  it('rejects an action with no tags', () => {
    expect(ActionSchema.safeParse({ ...longsword, tags: [] }).success).toBe(false);
  });

  it('rejects an action with malformed tag', () => {
    expect(ActionSchema.safeParse({ ...longsword, tags: ['Healing'] }).success).toBe(false);
  });

  it('rejects an action with duplicate resourceCost keys', () => {
    expect(
      ActionSchema.safeParse({
        ...fireball,
        resourceCost: [
          { resource: 'spell-slot-3', amount: 1 },
          { resource: 'spell-slot-3', amount: 2 },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects an action with unknown cost kind', () => {
    expect(
      ActionSchema.safeParse({ ...longsword, cost: { kind: 'mega-action' } }).success,
    ).toBe(false);
  });

  it('accepts cone, line, cube, cylinder targets', () => {
    for (const target of [
      { kind: 'cone', length: 15, range: 0 },
      { kind: 'line', length: 30, width: 5, range: 0 },
      { kind: 'cube', side: 20, range: 60 },
      { kind: 'cylinder', radius: 10, height: 40, range: 60 },
    ]) {
      expect(ActionSchema.parse({ ...fireball, target }).target.kind).toBe(target.kind);
    }
  });
});
