import { describe, it, expect } from 'vitest';
import { ConditionSchema, ActiveConditionSchema, SRD_CONDITION_IDS } from '../condition';

describe('ConditionSchema', () => {
  it('accepts a fully specified condition', () => {
    expect(
      ConditionSchema.parse({
        id: 'prone',
        name: 'Prone',
        description: 'A prone creature\'s only movement option is to crawl...',
        rules: ['attack-rolls-disadvantage', 'attacker-melee-advantage'],
      }),
    ).toMatchObject({ id: 'prone' });
  });

  it('rejects empty name', () => {
    expect(
      ConditionSchema.safeParse({ id: 'foo', name: '', description: 'd', rules: [] }).success,
    ).toBe(false);
  });
});

describe('SRD_CONDITION_IDS', () => {
  it('contains the full 5.5e SRD condition list', () => {
    expect(SRD_CONDITION_IDS).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });
});

describe('ActiveConditionSchema', () => {
  it('accepts active condition with optional duration and source', () => {
    expect(
      ActiveConditionSchema.parse({
        id: 'frightened',
        duration: 'until end of next turn',
        sourceId: 'goblin-shaman-1',
      }),
    ).toMatchObject({ id: 'frightened' });
  });

  it('accepts minimal active condition', () => {
    expect(ActiveConditionSchema.parse({ id: 'prone' })).toMatchObject({ id: 'prone' });
  });
});
