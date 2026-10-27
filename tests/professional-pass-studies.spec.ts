import { test, expect } from '@playwright/test';
import { PROFESSIONAL_PASS_TEACHING_FOLIOS } from '../src/lib/teaching-folios-professional-pass';
import { goto } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('the professional pass opens four complete studies without loading closed artwork or revealing recall answers', async ({ page }) => {
	test.setTimeout(90_000);
	await goto(page, '/plates#folio-group-professional-pass');
	for (const study of PROFESSIONAL_PASS_TEACHING_FOLIOS) {
		const folio = page.locator('#folio-' + study.id);
		await expect(folio.locator('img')).toHaveCount(0);
		await folio.locator(':scope > summary').click();
		await expect(folio.locator('.folio-key > li')).toHaveCount(study.subjects.length);
		await expect.poll(() => folio.locator('.illustration-box > img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
		for (const service of ['day', 'night']) {
			const width = service === 'day' ? 390 : 320;
			await page.evaluate(value => document.documentElement.setAttribute('data-service', value), service);
			await page.setViewportSize({ width, height: 844 });
			for (let view = 1; view <= study.subjects.length; view++) {
				await folio.getByRole('button', { name: 'View ' + view, exact: true }).click();
				await expect(folio.locator('.folio-art')).toHaveAttribute('data-focus-view', String(view));
			}
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		}
		await folio.getByRole('button', { name: 'Practise recall', exact: true }).click();
		await expect(folio.locator('.folio-key')).toBeHidden();
		await expect(folio.locator('.folio-learning')).toHaveCount(0);
		await expect(folio.locator('.recall-answer')).toHaveCount(0);
		await folio.getByRole('button', { name: 'Reveal this view', exact: true }).click();
		await expect(folio.locator('.recall-answer')).toContainText(study.subjects[0].name);
		await folio.getByRole('button', { name: 'Next view', exact: true }).click();
		await expect(folio.locator('.recall-answer')).toHaveCount(0);
		await expect(folio.locator('.recall-prompt')).toContainText('Name view 2');
		await folio.getByRole('button', { name: 'Return to the full key', exact: true }).click();
		await folio.locator('.learning-question > summary').click();
		await expect(folio.locator('.learning-answer > p')).toBeHidden();
		await folio.locator('.learning-answer > summary').click();
		await expect(folio.locator('.learning-answer > p')).toHaveText(study.learning!.answer);
		await folio.locator(':scope > summary').click();
	}
});

for (const [chapter, entry, study] of [
	['foundations', 'mise-en-place', 'mise-to-pass'],
	['safety', 'cooking-temperatures', 'thermometer-placement'],
	['safety', 'allergen-conversation', 'allergy-handoff'],
	['brennans', 'bananas-foster-at-the-table', 'foster-readiness']
]) {
	test(`${entry} connects its lesson and revealed flashcard to ${study} without grading or losing position`, async ({ page }) => {
		await goto(page, '/cuisine?ch=' + chapter + '&e=' + entry);
		const folio = page.locator('#folio-' + study);
		await expect(folio).toBeVisible();
		await expect(folio.locator('img')).toHaveCount(0);
		await page.getByRole('link', { name: 'Flash this entry', exact: true }).click();
		const frame = page.locator('.deckframe');
		await expect(frame.locator('.folio-links')).toHaveCount(0);
		const position = await frame.locator('.where').textContent();
		await page.getByRole('button', { name: 'Flip', exact: true }).click();
		await frame.locator('a[href$="#folio-' + study + '"]').click();
		await expect(page.locator('#folio-' + study)).toHaveAttribute('open');
		await page.goBack();
		await expect(frame).toHaveAttribute('data-flipped', 'yes');
		await expect(frame.locator('.where')).toHaveText(position!);
		await expect(page.locator('.tally')).toHaveText('0 got it, 0 to see again.');
	});
}
