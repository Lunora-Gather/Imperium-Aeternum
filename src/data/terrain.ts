import type { Terrain } from './provinces';

export const TERRAIN_LABELS: Record<Terrain, string> = {
  plain: '平原', hill: '丘陵', mountain: '山地', coast: '海岸', forest: '森林', desert: '沙漠',
  tundra: '苔原', jungle: '丛林', swamp: '沼泽', ocean: '海洋', island: '岛屿',
};

export function terrainLabel(terrain: Terrain): string {
  return TERRAIN_LABELS[terrain] ?? terrain;
}
