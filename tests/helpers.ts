import type { Page } from '@playwright/test';

/**
 * Navigate and wait for hydration. A prerendered page renders complete HTML
 * long before Svelte attaches a single listener; interacting inside that gap
 * types into dead inputs and clicks buttons wired to nothing. The layout
 * stamps data-hydrated from a browser-only effect — the earliest moment
 * interaction is real.
 */
export async function goto(page: Page, path: string) {
	await page.goto(path);
	await page.waitForSelector('html[data-hydrated]', { timeout: 15_000 });
}
