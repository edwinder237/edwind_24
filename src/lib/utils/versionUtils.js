/**
 * Course Version Utilities
 *
 * Pure utility functions for semantic version manipulation.
 * NO database operations - just string manipulation.
 */

/**
 * Bump semantic version string
 * @param {string} version - Current version (e.g., "1.1.1")
 * @param {string} type - "major", "minor", or "patch"
 * @returns {string} New version
 */
export function bumpVersion(version, type) {
  const [major, minor, patch] = (version || '1.0.0').split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Compare two version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1, v2) {
  const parts1 = (v1 || '0.0.0').split('.').map(Number);
  const parts2 = (v2 || '0.0.0').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

/**
 * Parse version string into components
 * @param {string} version - Version string (e.g., "1.2.3")
 * @returns {object} { major, minor, patch }
 */
export function parseVersion(version) {
  const [major, minor, patch] = (version || '1.0.0').split('.').map(Number);
  return { major, minor, patch };
}

/**
 * Format version for display
 * @param {string} version - Version string
 * @returns {string} Formatted version (e.g., "v1.2.3")
 */
export function formatVersion(version) {
  return version ? `v${version}` : 'v1.0.0';
}
