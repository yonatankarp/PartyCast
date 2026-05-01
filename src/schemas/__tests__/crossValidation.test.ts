import { describe, it, expect } from 'vitest';
import { ActionSchema, CombatantSchema, PartySchema, PersonaSchema } from '..';

describe('cross-validation: persona action-id references must be resolvable on the combatant', () => {
  it('passes when persona references action-id present in combatant.actionIds', () => {
    const combatant = CombatantSchema.parse({
      id: 'pc-1',
      name: 'Tester',
      size: 'medium',
      type: 'pc',
      hp: 10,
      maxHp: 10,
      tempHp: 0,
      ac: 12,
      speed: 30,
      level: 1,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      skills: {},
      damageResistances: [],
      damageImmunities: [],
      damageVulnerabilities: [],
      conditionImmunities: [],
      resources: {},
      actionIds: ['spell-fireball'],
      conditions: [],
      concentration: null,
      equipment: [],
    });
    const persona = PersonaSchema.parse({
      id: 'p',
      name: 'p',
      description: '',
      rules: [
        {
          condition: { kind: 'always' },
          actionMatch: { kind: 'action-id', id: 'spell-fireball' },
        },
      ],
    });
    const am = persona.rules[0]!.actionMatch;
    expect(am.kind).toBe('action-id');
    if (am.kind === 'action-id') {
      expect(combatant.actionIds).toContain(am.id);
    }
  });
});

describe('cross-validation: tag-format-only enforcement at Phase 1', () => {
  it('accepts any tag matching the regex (closed taxonomy is Phase 7 work)', () => {
    const action = ActionSchema.parse({
      id: 'a',
      name: 'a',
      tags: ['tag:healing'],
      cost: { kind: 'action' },
      resourceCost: [],
      target: { kind: 'self' },
      attack: null,
      effects: [{ kind: 'heal', amount: '1d4' }],
    });
    expect(action.tags).toEqual(['tag:healing']);
  });
});

describe('cross-validation: party uses Combatant ids that round-trip', () => {
  it('combatant.id is preserved through PartySchema parse', () => {
    const party = PartySchema.parse({
      id: 'p',
      name: 'Heroes',
      members: [
        {
          combatant: {
            id: 'pc-1',
            name: 'Anya',
            size: 'medium',
            type: 'pc',
            hp: 1,
            maxHp: 1,
            tempHp: 0,
            ac: 10,
            speed: 30,
            level: 1,
            abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            skills: {},
            damageResistances: [],
            damageImmunities: [],
            damageVulnerabilities: [],
            conditionImmunities: [],
            resources: {},
            actionIds: [],
            conditions: [],
            concentration: null,
            equipment: [],
          },
          persona: {
            id: 'p',
            name: 'p',
            description: '',
            rules: [
              {
                condition: { kind: 'always' },
                actionMatch: { kind: 'tag', tag: 'tag:healing' },
              },
            ],
          },
        },
      ],
    });
    expect(party.members[0]!.combatant.id).toBe('pc-1');
  });
});
