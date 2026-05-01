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
  level: 5,
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

  it('accepts a party with three distinct members', () => {
    const m1 = { combatant: baseCombatant, persona };
    const m2 = { combatant: { ...baseCombatant, id: 'pc-2', name: 'Bren' }, persona };
    const m3 = { combatant: { ...baseCombatant, id: 'pc-3', name: 'Cara' }, persona };
    expect(
      PartySchema.parse({
        id: 'party-1',
        name: 'Trio',
        members: [m1, m2, m3],
      }).members.length,
    ).toBe(3);
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
