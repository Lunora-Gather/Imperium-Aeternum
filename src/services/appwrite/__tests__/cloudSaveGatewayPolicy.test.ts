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

  it('keeps every authoritative table and bucket free of browser write grants', () => {
    const resources = [...config.tables, ...config.buckets];
    const unsafe = resources.flatMap((resource) =>
      (resource.$permissions ?? [])
        .filter((permission) => /^(create|update|delete|write)\(/.test(permission))
        .map((permission) => `${resource.$id}:${permission}`),
    );
    expect(unsafe).toEqual([]);
    expect(config.buckets.every((bucket) => (bucket.$permissions ?? []).length === 0)).toBe(true);
  });

  it('keeps privileged functions user-gated and limits account writes to the recovery gateway', () => {
    expect(config.functions.every((entry) => entry.execute?.includes('users'))).toBe(true);
    const userWriters = config.functions.filter((entry) => entry.scopes?.includes('users.write')).map((entry) => entry.$id);
    expect(userWriters).toEqual(['account-gateway']);
  });
});
