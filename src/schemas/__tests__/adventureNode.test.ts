import { describe, it, expect } from 'vitest';
import { AdventureNodeSchema } from '../adventureNode';

describe('AdventureNodeSchema', () => {
  it('accepts a Combat node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'goblin-ambush',
        kind: 'combat',
        name: 'Goblin Ambush',
        monsters: [
          { combatantTemplateId: 'goblin', count: 4, position: { x: 5, y: 5 } },
        ],
        partyStartPositions: [{ x: 0, y: 5 }],
        terrain: { width: 20, height: 10, features: [] },
      }),
    ).toMatchObject({ kind: 'combat' });
  });

  it('accepts a SkillCheck node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'spot-tracks',
        kind: 'skill-check',
        name: 'Spot Tracks',
        ability: 'wis',
        skill: 'survival',
        dc: 12,
        mode: 'single',
      }),
    ).toMatchObject({ kind: 'skill-check' });
  });

  it('accepts a Branch node with weighted options', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'fight-or-flee',
        kind: 'branch',
        name: 'Fight or Flee',
        options: [
          { id: 'fight', label: 'Fight', weight: 0.7 },
          { id: 'flee', label: 'Flee', weight: 0.3 },
        ],
      }),
    ).toMatchObject({ kind: 'branch' });
  });

  it('accepts a Rest node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'rest-1',
        kind: 'rest',
        name: 'Camp',
        restKind: 'long',
      }),
    ).toMatchObject({ kind: 'rest', restKind: 'long' });
  });

  it('accepts a Loot node', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'loot-cave',
        kind: 'loot',
        name: 'Cave Treasure',
        items: [{ itemId: 'gold-pieces', amount: 50 }],
        distribution: 'even',
      }),
    ).toMatchObject({ kind: 'loot' });
  });

  it('accepts a Travel node with optional random encounters', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'travel-1',
        kind: 'travel',
        name: 'Road to Phandalin',
        hours: 8,
        exhaustionCheck: true,
        randomEncounters: [{ probability: 0.2, combatNodeId: 'wolf-pack' }],
      }),
    ).toMatchObject({ kind: 'travel' });
  });

  it('accepts a Custom node with author script', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'custom-puzzle',
        kind: 'custom',
        name: 'Riddle Door',
        script: 'function run(state) { return { transition: "next" }; }',
      }),
    ).toMatchObject({ kind: 'custom' });
  });

  it('accepts a SkillCheck node in contested mode', () => {
    expect(
      AdventureNodeSchema.parse({
        id: 'arm-wrestle',
        kind: 'skill-check',
        name: 'Arm Wrestle',
        ability: 'str',
        dc: 1,
        mode: 'contested',
      }),
    ).toMatchObject({ kind: 'skill-check', mode: 'contested' });
  });

  it('rejects branch options with duplicate ids', () => {
    expect(
      AdventureNodeSchema.safeParse({
        id: 'dup-options',
        kind: 'branch',
        name: 'Dup',
        options: [
          { id: 'choose', label: 'A', weight: 0.5 },
          { id: 'choose', label: 'B', weight: 0.5 },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects branch options whose weights do not sum to 1', () => {
    expect(
      AdventureNodeSchema.safeParse({
        id: 'bad-branch',
        kind: 'branch',
        name: 'Bad Branch',
        options: [
          { id: 'a', label: 'A', weight: 0.6 },
          { id: 'b', label: 'B', weight: 0.6 },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects travel hours of zero', () => {
    expect(
      AdventureNodeSchema.safeParse({
        id: 'travel-zero',
        kind: 'travel',
        name: 'Zero Hours',
        hours: 0,
      }).success,
    ).toBe(false);
  });

  it('rejects oversized terrain', () => {
    expect(
      AdventureNodeSchema.safeParse({
        id: 'huge-map',
        kind: 'combat',
        name: 'Huge Map',
        monsters: [{ combatantTemplateId: 'goblin', count: 1 }],
        partyStartPositions: [{ x: 0, y: 0 }],
        terrain: { width: 500, height: 500, features: [] },
      }).success,
    ).toBe(false);
  });

  it('rejects unknown kind', () => {
    expect(AdventureNodeSchema.safeParse({ id: 'x', kind: 'mystery', name: 'x' }).success).toBe(
      false,
    );
  });
});
