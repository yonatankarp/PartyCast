import { describe, it, expect } from 'vitest';
import { CombatantSchema } from '../combatant';

const goblin = {
  id: 'goblin-1',
  name: 'Goblin',
  size: 'small',
  type: 'monster',
  hp: 7,
  maxHp: 7,
  tempHp: 0,
  ac: 15,
  speed: 30,
  abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
  saves: { str: -1, dex: 2, con: 0, int: 0, wis: -1, cha: -1 },
  skills: { stealth: 6 },
  damageResistances: [],
  damageImmunities: [],
  damageVulnerabilities: [],
  conditionImmunities: [],
  resources: {},
  actionIds: ['weapon-shortbow', 'weapon-scimitar'],
  position: { x: 4, y: 7 },
  conditions: [],
  concentration: null,
  equipment: [],
};

describe('CombatantSchema', () => {
  it('accepts a goblin', () => {
    expect(CombatantSchema.parse(goblin)).toMatchObject({ id: 'goblin-1' });
  });

  it('accepts a PC with spell slot resources', () => {
    const wizard = {
      ...goblin,
      id: 'wizard-anya',
      type: 'pc',
      size: 'medium',
      hp: 24,
      maxHp: 24,
      ac: 12,
      abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
      saves: { str: -1, dex: 2, con: 4, int: 5, wis: 1, cha: 0 },
      level: 5,
      resources: {
        'spell-slot-1': { current: 4, max: 4 },
        'spell-slot-2': { current: 3, max: 3 },
        'hit-dice-d6': { current: 5, max: 5 },
      },
      actionIds: ['weapon-quarterstaff', 'spell-fire-bolt', 'spell-magic-missile'],
    };
    expect(CombatantSchema.parse(wizard)).toMatchObject({ type: 'pc', level: 5 });
  });

  it('rejects negative HP', () => {
    expect(CombatantSchema.safeParse({ ...goblin, hp: -1 }).success).toBe(false);
  });

  it('rejects ability score outside 1-30', () => {
    expect(
      CombatantSchema.safeParse({ ...goblin, abilities: { ...goblin.abilities, str: 0 } }).success,
    ).toBe(false);
    expect(
      CombatantSchema.safeParse({ ...goblin, abilities: { ...goblin.abilities, str: 31 } }).success,
    ).toBe(false);
  });

  it('rejects hp greater than maxHp', () => {
    expect(CombatantSchema.safeParse({ ...goblin, hp: 100, maxHp: 7 }).success).toBe(false);
  });

  it('rejects current > max in a resource pool', () => {
    expect(
      CombatantSchema.safeParse({
        ...goblin,
        resources: { 'rage-uses': { current: 5, max: 2 } },
      }).success,
    ).toBe(false);
  });

  it.each([
    ['below-min', 0],
    ['above-max', 21],
    ['non-integer', 4.5],
  ])('rejects level %s (%s)', (_label, level) => {
    expect(CombatantSchema.safeParse({ ...goblin, level }).success).toBe(false);
  });

  it('rejects duplicate actionIds', () => {
    expect(
      CombatantSchema.safeParse({
        ...goblin,
        actionIds: ['weapon-shortbow', 'weapon-shortbow'],
      }).success,
    ).toBe(false);
  });

  it('rejects a combatant with no speed', () => {
    const { speed: _speed, ...withoutSpeed } = goblin;
    expect(CombatantSchema.safeParse(withoutSpeed).success).toBe(false);
  });

  it('rejects a PC without level', () => {
    expect(
      CombatantSchema.safeParse({
        ...goblin,
        type: 'pc',
        id: 'pc-no-level',
      }).success,
    ).toBe(false);
  });
});
