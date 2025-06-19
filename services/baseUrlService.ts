/**
 * Helper service to determine the base URL for the application
 * Useful for handling both local development and GitHub Pages deployment
 */

export const getBaseUrl = (): string => {
  // The GITHUB_PAGES environment variable will be set at build time
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  
  return isGitHubPages ? '/Bytsea_Ledger/' : '/';
};
