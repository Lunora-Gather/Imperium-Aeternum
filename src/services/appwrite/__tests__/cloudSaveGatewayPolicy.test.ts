import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Resource { $id: string; $permissions?: string[]; execute?: string[]; scopes?: string[] }
interface AppwriteConfig { tables: Resource[]; buckets: Resource[]; functions: Resource[] }

const config = JSON.parse(readFileSync(new URL('../../../../appwrite.config.json', import.meta.url), 'utf8')) as AppwriteConfig;

describe('cloud save gateway infrastructure policy', () => {
  it('does not allow browsers to create cloud save rows or files directly', () => {
    expect(config.tables.find((entry) => entry.$id === 'cloud_saves')?.$permissions).toEqual([]);
    expect(config.buckets.find((entry) => entry.$id === 'cloud_saves')?.$permissions).toEqual([]);
  });

  it('allows only signed-in users to invoke the scoped gateway', () => {
    const gateway = config.functions.find((entry) => entry.$id === 'cloud-save-gateway');
    expect(gateway?.execute).toEqual(['users']);
    expect(gateway?.scopes).toEqual(expect.arrayContaining(['rows.read', 'rows.write', 'files.read', 'files.write']));
  });
});
