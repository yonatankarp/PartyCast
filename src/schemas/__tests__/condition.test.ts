import { describe, it, expect } from 'vitest';
import { ConditionDefinitionSchema, ConditionSchema, SRD_CONDITION_IDS } from '../condition';

describe('ConditionDefinitionSchema', () => {
  it('accepts a fully specified definition', () => {
    expect(
      ConditionDefinitionSchema.parse({
        id: 'prone',
        name: 'Prone',
        description: "A prone creature's only movement option is to crawl...",
        rules: ['attack-rolls-disadvantage', 'attacker-melee-advantage'],
      }),
    ).toMatchObject({ id: 'prone' });
  });

  it('rejects empty name', () => {
    expect(
      ConditionDefinitionSchema.safeParse({ id: 'foo', name: '', description: 'd', rules: [] })
        .success,
    ).toBe(false);
  });

  it('rejects malformed rule tag', () => {
    expect(
      ConditionDefinitionSchema.safeParse({
        id: 'foo',
        name: 'Foo',
        description: 'd',
        rules: ['Has-Uppercase'],
      }).success,
    ).toBe(false);
  });
});

describe('SRD_CONDITION_IDS', () => {
  it('contains exactly the 5.5e SRD condition list', () => {
    const expected = [
      'blinded',
      'charmed',
      'deafened',
      'exhaustion',
      'frightened',
      'grappled',
      'incapacitated',
      'invisible',
      'paralyzed',
      'petrified',
      'poisoned',
      'prone',
      'restrained',
      'stunned',
      'unconscious',
    ];
    expect([...SRD_CONDITION_IDS].sort()).toEqual([...expected].sort());
  });
});

describe('ConditionSchema', () => {
  it('accepts an instance with optional duration and source', () => {
    expect(
      ConditionSchema.parse({
        id: 'frightened',
        duration: 'until end of next turn',
        sourceId: 'goblin-shaman-1',
      }),
    ).toMatchObject({ id: 'frightened' });
  });

  it('accepts a minimal instance', () => {
    expect(ConditionSchema.parse({ id: 'prone' })).toMatchObject({ id: 'prone' });
  });

  it('accepts exhaustion with level', () => {
    expect(ConditionSchema.parse({ id: 'exhaustion', level: 3 })).toMatchObject({
      id: 'exhaustion',
      level: 3,
    });
  });

  it.each([
    ['below-min', 0],
    ['above-max', 7],
    ['non-integer', 2.5],
  ])('rejects exhaustion level %s (%s)', (_label, level) => {
    expect(ConditionSchema.safeParse({ id: 'exhaustion', level }).success).toBe(false);
  });
});
