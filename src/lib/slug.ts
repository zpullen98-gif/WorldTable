/**
 * The app-side door to the ONE slug implementation, which lives in
 * tools/slugify.mjs because the build pipeline needs it under plain Node.
 * Re-exported rather than copied: a forked slug rule is a forked URL space,
 * and every persisted reference is keyed by these strings.
 */
export { slugify, qualifiedSlugs } from '../../tools/slugify.mjs';
