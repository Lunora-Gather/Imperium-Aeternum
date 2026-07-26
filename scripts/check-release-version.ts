import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface PackageLock {
  version?: string;
  packages?: Record<string, { version?: string }>;
}

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const packageJson = JSON.parse(read('package.json')) as { version?: string };
const packageLock = JSON.parse(read('package-lock.json')) as PackageLock;
const buildInfo = read('src/buildInfo.ts');
const readme = read('README.md');

const version = packageJson.version;
const failures: string[] = [];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  failures.push(`package.json must contain a stable semantic version, received ${JSON.stringify(version)}`);
}

if (packageLock.version !== version) {
  failures.push(`package-lock.json version is ${JSON.stringify(packageLock.version)}, expected ${JSON.stringify(version)}`);
}

if (packageLock.packages?.['']?.version !== version) {
  failures.push(
    `package-lock.json root package version is ${JSON.stringify(packageLock.packages?.['']?.version)}, expected ${JSON.stringify(version)}`,
  );
}

const buildMark = buildInfo.match(/BUILD_MARK\s*=\s*['"]([^'"]+)['"]/)?.[1];
if (buildMark !== version) {
  failures.push(`BUILD_MARK is ${JSON.stringify(buildMark)}, expected ${JSON.stringify(version)}`);
}

if (version && !readme.includes(`release-${version}_stable`)) {
  failures.push(`README release badge does not identify ${version} as stable`);
}

if (version && !readme.includes(`版本 | \`${version}\`（stable）`)) {
  failures.push(`README release table does not identify ${version} as stable`);
}

const releaseNotesPath = version ? `docs/release-notes-v${version}.md` : '';
if (releaseNotesPath && !existsSync(resolve(root, releaseNotesPath))) {
  failures.push(`${releaseNotesPath} does not exist`);
} else if (releaseNotesPath) {
  const releaseNotes = read(releaseNotesPath);
  if (!releaseNotes.includes(`# Imperium Aeternum ${version}`)) {
    failures.push(`${releaseNotesPath} does not contain the expected release title`);
  }
}

if (failures.length > 0) {
  console.error('Release identity check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Release identity verified: ${version}`);
}
