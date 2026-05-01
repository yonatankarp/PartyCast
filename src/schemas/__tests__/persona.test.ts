import { describe, it, expect } from 'vitest';
import { PersonaSchema } from '../persona';

const cautiousCleric = {
  id: 'cautious-cleric',
  name: 'Cautious Cleric',
  description: 'Heal first, AOE second, weapon last.',
  rules: [
    {
      condition: { kind: 'ally-hp-pct-below', threshold: 0.3 },
      actionMatch: { kind: 'tag', tag: 'tag:healing' },
    },
    {
      condition: { kind: 'enemies-in-burst-gte', count: 2 },
      actionMatch: { kind: 'tag', tag: 'tag:aoe-damage' },
    },
    {
      condition: { kind: 'always' },
      actionMatch: { kind: 'tag', tag: 'weapon-attack' },
    },
  ],
};

describe('PersonaSchema', () => {
  it('accepts a multi-rule persona', () => {
    expect(PersonaSchema.parse(cautiousCleric)).toMatchObject({ id: 'cautious-cleric' });
  });

  it('rejects a persona with empty rule list', () => {
    expect(PersonaSchema.safeParse({ ...cautiousCleric, rules: [] }).success).toBe(false);
  });

  it('accepts conditions: self.concentrating, slot-available, has-condition', () => {
    const p = {
      ...cautiousCleric,
      rules: [
        {
          condition: { kind: 'self-concentrating', value: false },
          actionMatch: { kind: 'tag', tag: 'tag:control' },
        },
        {
          condition: { kind: 'slot-available', level: 3, count: 1 },
          actionMatch: { kind: 'action-id', id: 'spell-fireball' },
        },
        {
          condition: { kind: 'target-has-condition', condition: 'prone' },
          actionMatch: { kind: 'tag', tag: 'weapon-attack' },
        },
      ],
    };
    expect(PersonaSchema.parse(p)).toMatchObject({ id: 'cautious-cleric' });
  });

  it('rejects unknown condition kind', () => {
    const p = {
      ...cautiousCleric,
      rules: [
        {
          condition: { kind: 'mood-is-grumpy' },
          actionMatch: { kind: 'tag', tag: 'tag:healing' },
        },
      ],
    };
    expect(PersonaSchema.safeParse(p).success).toBe(false);
  });

  it('rejects malformed action match', () => {
    const p = {
      ...cautiousCleric,
      rules: [
        {
          condition: { kind: 'always' },
          actionMatch: { kind: 'tag', tag: 'NotATag' },
        },
      ],
    };
    expect(PersonaSchema.safeParse(p).success).toBe(false);
  });
});
