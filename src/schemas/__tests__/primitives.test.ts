import { describe, it, expect } from 'vitest';
import {
  DiceExpressionSchema,
  TagSchema,
  ResourceKeySchema,
  RuleTagSchema,
  AbilityScoreSchema,
  DamageTypeSchema,
  SizeSchema,
  CreatureTypeSchema,
} from '../primitives';

describe('DiceExpressionSchema', () => {
  it.each(['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '3d6+5', '2d8-1', '4d6+12'])(
    'accepts %s',
    (s) => {
      expect(DiceExpressionSchema.parse(s)).toBe(s);
    },
  );
  it.each([
    ['empty', ''],
    ['no-count', 'd20'],
    ['no-sides', '1d'],
    ['trailing-plus', '3d6+'],
    ['bad-operator', '1d20*2'],
    ['non-numeric', 'foo'],
    ['zero-count', '0d20'],
    ['leading-zero-count', '01d20'],
    ['non-dnd-die-d7', '1d7'],
    ['non-dnd-die-d2', '1d2'],
  ])('rejects %s (%s)', (_label, s) => {
    expect(DiceExpressionSchema.safeParse(s).success).toBe(false);
  });
});

describe('TagSchema', () => {
  it.each([
    'tag:healing',
    'tag:aoe-damage',
    'tag:single-target',
    'tag:control-1',
    'weapon-attack',
    'dash',
    'disengage',
  ])('accepts %s', (s) => {
    expect(TagSchema.parse(s)).toBe(s);
  });
  it.each([
    ['empty-body-after-prefix', 'tag:'],
    ['uppercase-after-prefix', 'tag:Healing'],
    ['uppercase-bare', 'Healing'],
    ['leading-underscore', 'tag:_under'],
    ['contains-space', 'tag:has space'],
    ['leading-digit', '1-bad'],
    ['empty', ''],
  ])('rejects %s (%s)', (_label, s) => {
    expect(TagSchema.safeParse(s).success).toBe(false);
  });
});

describe('ResourceKeySchema', () => {
  it.each(['spell-slot-1', 'rage-uses', 'action-surge', 'channel-divinity'])(
    'accepts %s',
    (s) => {
      expect(ResourceKeySchema.parse(s)).toBe(s);
    },
  );
  it.each([
    ['uppercase', 'Spell-Slot'],
    ['leading-digit', '1-leading-digit'],
    ['contains-space', 'has space'],
    ['empty', ''],
  ])('rejects %s (%s)', (_label, s) => {
    expect(ResourceKeySchema.safeParse(s).success).toBe(false);
  });
});

describe('RuleTagSchema', () => {
  it.each(['attack-rolls-disadvantage', 'attacker-melee-advantage', 'death-save-fail'])(
    'accepts %s',
    (s) => {
      expect(RuleTagSchema.parse(s)).toBe(s);
    },
  );
  it.each([
    ['uppercase', 'Attack-Rolls'],
    ['leading-digit', '1-rule'],
    ['contains-space', 'has space'],
    ['empty', ''],
  ])('rejects %s (%s)', (_label, s) => {
    expect(RuleTagSchema.safeParse(s).success).toBe(false);
  });
});

describe('AbilityScoreSchema', () => {
  it.each(['str', 'dex', 'con', 'int', 'wis', 'cha'])('accepts %s', (s) => {
    expect(AbilityScoreSchema.parse(s)).toBe(s);
  });
  it('rejects unknown ability', () => {
    expect(AbilityScoreSchema.safeParse('luck').success).toBe(false);
  });
});

describe('DamageTypeSchema', () => {
  it('accepts all 13 5.5e damage types', () => {
    const all = [
      'acid',
      'bludgeoning',
      'cold',
      'fire',
      'force',
      'lightning',
      'necrotic',
      'piercing',
      'poison',
      'psychic',
      'radiant',
      'slashing',
      'thunder',
    ];
    for (const t of all) expect(DamageTypeSchema.parse(t)).toBe(t);
  });
  it('rejects unknown damage type', () => {
    expect(DamageTypeSchema.safeParse('arcane').success).toBe(false);
  });
});

describe('SizeSchema', () => {
  it.each(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'])('accepts %s', (s) => {
    expect(SizeSchema.parse(s)).toBe(s);
  });
});

describe('CreatureTypeSchema', () => {
  it.each(['pc', 'monster'])('accepts %s', (s) => {
    expect(CreatureTypeSchema.parse(s)).toBe(s);
  });
});
