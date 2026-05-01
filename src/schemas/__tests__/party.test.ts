import { describe, it, expect } from 'vitest';
import { PartySchema } from '../party';

const baseCombatant = {
  id: 'pc-1',
  name: 'Anya',
  size: 'medium',
  type: 'pc',
  hp: 24,
  maxHp: 24,
  tempHp: 0,
  ac: 12,
  speed: 30,
  abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
  saves: { str: -1, dex: 2, con: 4, int: 5, wis: 1, cha: 0 },
  skills: {},
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
  resources: {},
  actionIds: ['weapon-quarterstaff'],
  conditions: [],
  concentration: null,
  equipment: [],
};

const persona = {
  id: 'cautious',
  name: 'Cautious',
  description: '',
  rules: [
    {
      condition: { kind: 'always' },
      actionMatch: { kind: 'tag', tag: 'weapon-attack' },
    },
  ],
};

describe('PartySchema', () => {
  it('accepts a party with one member', () => {
    expect(
      PartySchema.parse({
        id: 'party-1',
        name: 'The Heroes',
        members: [{ combatant: baseCombatant, persona }],
      }),
    ).toMatchObject({ id: 'party-1' });
  });

  it('rejects a party with no members', () => {
    expect(
      PartySchema.safeParse({ id: 'party-1', name: 'Empty', members: [] }).success,
    ).toBe(false);
  });

  it('rejects a party with duplicate combatant ids', () => {
    expect(
      PartySchema.safeParse({
        id: 'party-1',
        name: 'Dupes',
        members: [
          { combatant: baseCombatant, persona },
          { combatant: baseCombatant, persona },
        ],
      }).success,
    ).toBe(false);
  });
});
