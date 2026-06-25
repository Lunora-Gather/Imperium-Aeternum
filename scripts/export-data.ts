// F2: 数据格式中立化——导出所有数据表为 JSON 到 dist/data/
// 运行：npx tsx scripts/export-data.ts
// 验收：所有数据表可导出为 JSON；引擎可从 JSON 加载（为 Godot/Unity 读 JSON 铺路）
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NATIONS, AI_NATIONS, PLAYER_ID } from '../src/data/nations';
import { PROVINCES } from '../src/data/provinces';
import { BUILDINGS, BUILDING_LIST } from '../src/data/buildings';
import { EVENTS, EVENT_BY_ID } from '../src/data/events';
import { TECHNOLOGIES, TECH_BY_ID } from '../src/data/technologies';
import { POLICIES, POLICY_BY_ID } from '../src/data/policies';
import { LAWS, LAW_BY_ID } from '../src/data/laws';
import { GOVERNMENTS } from '../src/data/governments';
import { NATIONAL_CHARACTERS, BEHAVIOR_MAPPINGS } from '../src/data/national-characters';
import { FACTIONS } from '../src/data/factions';
import { TRADE_ROUTES, TRADE_ROUTE_BY_ID } from '../src/data/trade-routes';
import { REGIONS } from '../src/data/regions';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'dist', 'data');

function writeJson(name: string, data: unknown): void {
  const path = resolve(OUT_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ ${name}.json (${Math.round(JSON.stringify(data).length / 1024)} KB)`);
}

mkdirSync(OUT_DIR, { recursive: true });
console.log('F2: 导出数据表为 JSON 到 dist/data/');

writeJson('nations', { nations: NATIONS, aiNations: AI_NATIONS, playerId: PLAYER_ID });
writeJson('provinces', { provinces: PROVINCES });
writeJson('buildings', { buildings: BUILDING_LIST, buildingById: BUILDINGS });
writeJson('events', { events: EVENTS, eventById: EVENT_BY_ID });
writeJson('technologies', { technologies: TECHNOLOGIES, techById: TECH_BY_ID });
writeJson('policies', { policies: POLICIES, policyById: POLICY_BY_ID });
writeJson('laws', { laws: LAWS, lawById: LAW_BY_ID });
writeJson('governments', { governments: GOVERNMENTS });
writeJson('national-characters', { characters: NATIONAL_CHARACTERS, behaviorMappings: BEHAVIOR_MAPPINGS });
writeJson('factions', { factions: FACTIONS });
writeJson('trade-routes', { routes: TRADE_ROUTES, routeById: TRADE_ROUTE_BY_ID });
writeJson('regions', { regions: REGIONS });

console.log('\n✅ F2 数据导出完成——12 数据表已中立化为 JSON，可被 Godot/Unity 直接读取');
console.log(`   输出目录：${OUT_DIR}`);
