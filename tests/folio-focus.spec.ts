import { test, expect } from '@playwright/test';
import { TEACHING_FOLIOS } from '../src/lib/teaching-folios';
import { goto } from './helpers';

const study = TEACHING_FOLIOS.find(folio => folio.id === 'brown-butter-study')!;
test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

test('a keyboard-selected view enlarges one region while the zoom dialog keeps the complete source', async ({ page }) => {
	expect(study, 'the release includes a focused learning study').toBeTruthy();
	await goto(page, '/plates');
	const folio = page.locator(`#folio-${study.id}`);
	await expect(folio.locator('img')).toHaveCount(0);
	await folio.locator(':scope > summary').press('Enter');
	const full = folio.getByRole('button', { name: 'Whole illustration', exact: true });
	await full.click();
	await full.press('Tab');
	const first = folio.getByRole('button', { name: 'View 1', exact: true });
	await expect(first).toBeFocused();
	await first.press('Enter');
	await expect(first).toHaveAttribute('aria-pressed', 'true');
	await expect(folio.locator('.folio-art')).toHaveAttribute('data-focus-view', '1');
	const image = folio.locator('.illustration-box > img');
	await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	const crop = study.focus![0];
	const ratio = await image.evaluate(img => img.getBoundingClientRect().width / img.parentElement!.clientWidth);
	expect(ratio).toBeCloseTo(1 / crop.width, 1);
	await folio.getByRole('button', { name: 'Enlarge illustration', exact: true }).click();
	const modalImage = page.locator('dialog[open] .viewer-canvas img');
	await expect(modalImage).toHaveAttribute('src', `/${study.image.src}`);
	await expect(modalImage).toHaveAttribute('width', String(study.image.width));
	await page.keyboard.press('Escape');
	await expect(folio.getByRole('button', { name: 'Enlarge illustration', exact: true })).toBeFocused();
	for (const service of ['day', 'night']) {
		await page.evaluate(value => document.documentElement.setAttribute('data-service', value), service);
		await expect(folio.getByRole('button', { name: 'View 2', exact: true })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
		const buttons = await folio.locator('.folio-focus-controls button').evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
		for (const button of buttons) { expect(button.width).toBeGreaterThanOrEqual(44); expect(button.height).toBeGreaterThanOrEqual(44); }
	}
	await folio.getByRole('button', { name: 'Practise recall', exact: true }).click();
	await expect(folio.locator('.folio-key')).toBeHidden();
	await expect(folio.locator('.folio-learning')).toHaveCount(0);
	await expect(first).toHaveAttribute('aria-pressed', 'true');
	await folio.getByRole('button', { name: 'View 2', exact: true }).click();
	await expect(folio.locator('.recall-prompt')).toContainText('Name view 2');
	await expect(folio.locator('.recall-answer')).toHaveCount(0);
	await expect(image).not.toHaveAttribute('alt', new RegExp(study.subjects[1].name));
	await folio.getByRole('button', { name: 'Reveal this view', exact: true }).click();
	await expect(folio.locator('.recall-answer')).toContainText(study.subjects[1].name);
	await expect(image).toHaveAttribute('alt', new RegExp(study.subjects[1].name));
	await folio.getByRole('button', { name: 'Return to the full key', exact: true }).click();
	await expect(folio.locator('.folio-learning')).toBeVisible();
	await folio.locator('.learning-question > summary').click();
	await expect(folio.locator('.learning-answer > p')).toBeHidden();
	await folio.locator('.learning-answer > summary').click();
	await expect(folio.locator('.learning-answer > p')).toHaveText(study.learning!.answer);
});

test('a focused view with unavailable artwork keeps its recovery control and readable key', async ({ page }) => {
	const path = `**/${study.image.src}`;
	await page.route(path, route => route.abort());
	await goto(page, `/plates#folio-${study.id}`);
	const folio = page.locator(`#folio-${study.id}`);
	await folio.getByRole('button', { name: 'View 2', exact: true }).click();
	await expect(folio.locator('.image-unavailable')).toBeVisible();
	await expect(folio.locator('.folio-key > li')).toHaveCount(study.subjects.length);
	const height = await folio.locator('.illustration-box').evaluate(box => ({ client: box.clientHeight, scroll: box.scrollHeight }));
	expect(height.scroll).toBeLessThanOrEqual(height.client + 1);
	await page.unroute(path);
	await folio.getByRole('button', { name: 'Try again', exact: true }).click();
	await expect.poll(() => folio.locator('.illustration-box > img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	await expect(folio.locator('.folio-art')).toHaveAttribute('data-focus-view', '2');
	await folio.getByRole('button', { name: 'Whole illustration', exact: true }).click();
	await expect(folio.locator('.folio-art')).toHaveAttribute('data-focus-view', 'whole');
});
