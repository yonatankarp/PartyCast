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
  PartyRoleSchema,
  PositionSchema,
  SkillSchema,
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
    ['trailing-dash', 'tag:foo-'],
    ['consecutive-dashes', 'tag:foo--bar'],
    ['bare-trailing-dash', 'foo-'],
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
    ['trailing-dash', 'resource-'],
    ['consecutive-dashes', 'spell--slot'],
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
    ['trailing-dash', 'rule-'],
    ['consecutive-dashes', 'attack--rolls'],
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

describe('PartyRoleSchema', () => {
  it.each(['tank', 'healer', 'damage', 'utility'])('accepts %s', (s) => {
    expect(PartyRoleSchema.parse(s)).toBe(s);
  });
  it('rejects unknown role', () => {
    expect(PartyRoleSchema.safeParse('bard').success).toBe(false);
  });
});

describe('SkillSchema', () => {
  it('accepts the 18 SRD skills', () => {
    const all = [
      'acrobatics',
      'animal-handling',
      'arcana',
      'athletics',
      'deception',
      'history',
      'insight',
      'intimidation',
      'investigation',
      'medicine',
      'nature',
      'perception',
      'performance',
      'persuasion',
      'religion',
      'sleight-of-hand',
      'stealth',
      'survival',
    ];
    for (const s of all) expect(SkillSchema.parse(s)).toBe(s);
  });
  it.each([
    ['uppercase', 'Stealth'],
    ['snake_case', 'animal_handling'],
    ['homebrew', 'lockpicking'],
    ['empty', ''],
  ])('rejects %s (%s)', (_label, s) => {
    expect(SkillSchema.safeParse(s).success).toBe(false);
  });
});

describe('PositionSchema', () => {
  it('accepts integer coordinates including zero and negative', () => {
    expect(PositionSchema.parse({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(PositionSchema.parse({ x: -5, y: 10 })).toEqual({ x: -5, y: 10 });
  });
  it.each([
    ['non-integer-x', { x: 0.5, y: 0 }],
    ['non-integer-y', { x: 0, y: 1.5 }],
    ['missing-y', { x: 0 }],
    ['missing-x', { y: 0 }],
    ['empty', {}],
  ])('rejects %s', (_label, value) => {
    expect(PositionSchema.safeParse(value).success).toBe(false);
  });
});
