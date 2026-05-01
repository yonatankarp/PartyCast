import { describe, it, expect } from 'vitest';
import {
  DiceExpressionSchema,
  TagSchema,
  ResourceKeySchema,
  AbilityScoreSchema,
  DamageTypeSchema,
  SizeSchema,
  CreatureTypeSchema,
} from '../primitives';

describe('DiceExpressionSchema', () => {
  it.each(['1d20', '3d6', '2d8+5', '1d4-1', '4d6+12'])('accepts %s', (s) => {
    expect(DiceExpressionSchema.parse(s)).toBe(s);
  });
  it.each(['', 'd20', '1d', '3d6+', '1d20*2', 'foo'])('rejects %s', (s) => {
    expect(DiceExpressionSchema.safeParse(s).success).toBe(false);
  });
});

describe('TagSchema', () => {
  it.each(['tag:healing', 'tag:aoe-damage', 'tag:single-target', 'tag:control-1'])(
    'accepts %s',
    (s) => {
      expect(TagSchema.parse(s)).toBe(s);
    },
  );
  it.each(['healing', 'tag:', 'tag:Healing', 'tag:_under', 'tag:has space'])(
    'rejects %s',
    (s) => {
      expect(TagSchema.safeParse(s).success).toBe(false);
    },
  );
});

describe('ResourceKeySchema', () => {
  it.each(['spell-slot-1', 'rage-uses', 'action-surge', 'channel-divinity'])(
    'accepts %s',
    (s) => {
      expect(ResourceKeySchema.parse(s)).toBe(s);
    },
  );
  it.each(['Spell-Slot', '1-leading-digit', 'has space', ''])('rejects %s', (s) => {
    expect(ResourceKeySchema.safeParse(s).success).toBe(false);
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
