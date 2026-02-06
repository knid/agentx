/**
 * Lightweight semver utilities for version comparison and range matching.
 */

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+[a-zA-Z0-9.]+)?$/;

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | undefined;
}

/**
 * Parse a semver version string into its components.
 * Returns null if the string is not a valid semver version.
 */
export function parseVersion(version: string): ParsedVersion | null {
  const match = version.match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || undefined,
  };
}

/**
 * Compare two semver version strings.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (!va || !vb) return 0;

  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  if (va.patch !== vb.patch) return va.patch - vb.patch;

  // Pre-release versions have lower precedence than release
  if (va.prerelease && !vb.prerelease) return -1;
  if (!va.prerelease && vb.prerelease) return 1;

  // Compare pre-release strings lexicographically
  if (va.prerelease && vb.prerelease) {
    return va.prerelease < vb.prerelease ? -1 : va.prerelease > vb.prerelease ? 1 : 0;
  }

  return 0;
}

/**
 * Check if version `a` is strictly newer than version `b`.
 */
export function isNewerThan(a: string, b: string): boolean {
  return compareVersions(a, b) > 0;
}

/**
 * Check if a version satisfies a version range.
 *
 * Supported range formats:
 * - Exact: `1.0.0`
 * - Caret: `^1.0.0` (>=1.0.0, <2.0.0)
 * - Tilde: `~1.0.0` (>=1.0.0, <1.1.0)
 * - Greater-equal: `>=1.0.0`
 * - Wildcard: `*` or `latest`
 */
export function satisfiesRange(version: string, range: string): boolean {
  if (range === '*' || range === 'latest') return true;

  const v = parseVersion(version);
  if (!v) return false;

  // Caret range: ^major.minor.patch
  if (range.startsWith('^')) {
    const r = parseVersion(range.slice(1));
    if (!r) return false;
    if (v.major !== r.major) return false;
    return compareVersions(version, range.slice(1)) >= 0;
  }

  // Tilde range: ~major.minor.patch
  if (range.startsWith('~')) {
    const r = parseVersion(range.slice(1));
    if (!r) return false;
    if (v.major !== r.major || v.minor !== r.minor) return false;
    return v.patch >= r.patch;
  }

  // Greater-equal range: >=major.minor.patch
  if (range.startsWith('>=')) {
    return compareVersions(version, range.slice(2)) >= 0;
  }

  // Exact match
  return compareVersions(version, range) === 0;
}

/**
 * Sort an array of version strings in descending order (newest first).
 */
export function sortVersions(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareVersions(b, a));
}
