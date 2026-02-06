import { describe, it, expect } from 'vitest';

describe('semver utilities', () => {
  describe('parseVersion', () => {
    it('should parse a simple version string', async () => {
      const { parseVersion } = await import('../../src/utils/semver.js');
      const v = parseVersion('1.2.3');
      expect(v).toEqual({ major: 1, minor: 2, patch: 3, prerelease: undefined });
    });

    it('should parse a version with pre-release', async () => {
      const { parseVersion } = await import('../../src/utils/semver.js');
      const v = parseVersion('1.0.0-beta.1');
      expect(v).toEqual({ major: 1, minor: 0, patch: 0, prerelease: 'beta.1' });
    });

    it('should return null for invalid version strings', async () => {
      const { parseVersion } = await import('../../src/utils/semver.js');
      expect(parseVersion('abc')).toBeNull();
      expect(parseVersion('1.2')).toBeNull();
      expect(parseVersion('')).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', async () => {
      const { compareVersions } = await import('../../src/utils/semver.js');
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should compare major versions correctly', async () => {
      const { compareVersions } = await import('../../src/utils/semver.js');
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions correctly', async () => {
      const { compareVersions } = await import('../../src/utils/semver.js');
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '1.1.0')).toBeLessThan(0);
    });

    it('should compare patch versions correctly', async () => {
      const { compareVersions } = await import('../../src/utils/semver.js');
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '1.0.3')).toBeLessThan(0);
    });

    it('should rank pre-release lower than release', async () => {
      const { compareVersions } = await import('../../src/utils/semver.js');
      expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBeLessThan(0);
      expect(compareVersions('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0);
    });
  });

  describe('isNewerThan', () => {
    it('should return true when first version is newer', async () => {
      const { isNewerThan } = await import('../../src/utils/semver.js');
      expect(isNewerThan('2.0.0', '1.0.0')).toBe(true);
      expect(isNewerThan('1.1.0', '1.0.0')).toBe(true);
      expect(isNewerThan('1.0.1', '1.0.0')).toBe(true);
    });

    it('should return false when first version is equal or older', async () => {
      const { isNewerThan } = await import('../../src/utils/semver.js');
      expect(isNewerThan('1.0.0', '1.0.0')).toBe(false);
      expect(isNewerThan('1.0.0', '2.0.0')).toBe(false);
    });
  });

  describe('satisfiesRange', () => {
    it('should match exact version', async () => {
      const { satisfiesRange } = await import('../../src/utils/semver.js');
      expect(satisfiesRange('1.0.0', '1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.0', '1.0.1')).toBe(false);
    });

    it('should match caret range (^)', async () => {
      const { satisfiesRange } = await import('../../src/utils/semver.js');
      expect(satisfiesRange('1.2.3', '^1.0.0')).toBe(true);
      expect(satisfiesRange('1.9.9', '^1.0.0')).toBe(true);
      expect(satisfiesRange('2.0.0', '^1.0.0')).toBe(false);
      expect(satisfiesRange('0.9.0', '^1.0.0')).toBe(false);
    });

    it('should match tilde range (~)', async () => {
      const { satisfiesRange } = await import('../../src/utils/semver.js');
      expect(satisfiesRange('1.0.5', '~1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.9', '~1.0.0')).toBe(true);
      expect(satisfiesRange('1.1.0', '~1.0.0')).toBe(false);
    });

    it('should match >= range', async () => {
      const { satisfiesRange } = await import('../../src/utils/semver.js');
      expect(satisfiesRange('2.0.0', '>=1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.0', '>=1.0.0')).toBe(true);
      expect(satisfiesRange('0.9.0', '>=1.0.0')).toBe(false);
    });

    it('should match * (any version)', async () => {
      const { satisfiesRange } = await import('../../src/utils/semver.js');
      expect(satisfiesRange('1.0.0', '*')).toBe(true);
      expect(satisfiesRange('99.99.99', '*')).toBe(true);
    });

    it('should match latest as any version', async () => {
      const { satisfiesRange } = await import('../../src/utils/semver.js');
      expect(satisfiesRange('1.0.0', 'latest')).toBe(true);
    });
  });

  describe('sortVersions', () => {
    it('should sort versions in descending order', async () => {
      const { sortVersions } = await import('../../src/utils/semver.js');
      const versions = ['1.0.0', '2.0.0', '1.5.0', '0.1.0'];
      expect(sortVersions(versions)).toEqual(['2.0.0', '1.5.0', '1.0.0', '0.1.0']);
    });

    it('should handle pre-release versions correctly', async () => {
      const { sortVersions } = await import('../../src/utils/semver.js');
      const versions = ['1.0.0', '1.0.0-beta', '1.0.0-alpha'];
      const sorted = sortVersions(versions);
      expect(sorted[0]).toBe('1.0.0');
    });
  });
});
