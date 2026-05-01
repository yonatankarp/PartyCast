import { describe, it, expect } from 'vitest';
import { EffectSchema } from '../effect';

describe('EffectSchema', () => {
  it('accepts a damage effect', () => {
    expect(
      EffectSchema.parse({ kind: 'damage', amount: '3d6', damageType: 'fire' }),
    ).toMatchObject({ kind: 'damage' });
  });

  it('accepts a heal effect', () => {
    expect(EffectSchema.parse({ kind: 'heal', amount: '2d4+2' })).toMatchObject({ kind: 'heal' });
  });

  it('accepts an apply-condition effect with optional duration', () => {
    expect(
      EffectSchema.parse({
        kind: 'apply-condition',
        condition: 'prone',
        duration: '1 round',
      }),
    ).toMatchObject({ kind: 'apply-condition', condition: 'prone' });
  });

  it('accepts a remove-condition effect', () => {
    expect(
      EffectSchema.parse({ kind: 'remove-condition', condition: 'frightened' }),
    ).toMatchObject({ kind: 'remove-condition' });
  });

  it('accepts a resource-cost effect', () => {
    expect(
      EffectSchema.parse({ kind: 'resource-cost', resource: 'spell-slot-3', amount: 1 }),
    ).toMatchObject({ kind: 'resource-cost' });
  });

  it('accepts a movement effect', () => {
    expect(
      EffectSchema.parse({ kind: 'movement', distance: 30, direction: 'forced' }),
    ).toMatchObject({ kind: 'movement' });
  });

  it('accepts a save-or-suck effect with on-fail and on-success', () => {
    expect(
      EffectSchema.parse({
        kind: 'save-or-suck',
        ability: 'dex',
        dc: 15,
        onFail: { kind: 'damage', amount: '8d6', damageType: 'fire' },
        onSuccess: { kind: 'damage', amount: '4d6', damageType: 'fire' },
      }),
    ).toMatchObject({ kind: 'save-or-suck', ability: 'dex' });
  });

  it('rejects an unknown effect kind', () => {
    expect(EffectSchema.safeParse({ kind: 'teleport' }).success).toBe(false);
  });

  it('rejects damage with missing damageType', () => {
    expect(EffectSchema.safeParse({ kind: 'damage', amount: '1d6' }).success).toBe(false);
  });

  it('rejects damage with invalid dice expression', () => {
    expect(
      EffectSchema.safeParse({ kind: 'damage', amount: 'not-dice', damageType: 'fire' }).success,
    ).toBe(false);
  });

  it('rejects movement with negative distance', () => {
    expect(
      EffectSchema.safeParse({ kind: 'movement', distance: -10, direction: 'forced' }).success,
    ).toBe(false);
  });
});
