// Isolated browser checks; FALL_ART_URL includes /table for the published build.
// FALL_ART_OFFLINE=1 additionally verifies the production service worker.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const art = JSON.parse(readFileSync(new URL('../src/lib/data/fall-menu-art-2026.json', import.meta.url)));
const base = (process.env.FALL_ART_URL || 'http://127.0.0.1:8770').replace(/\/$/, '');
const output = process.env.FALL_ART_OUTPUT;
const offline = process.env.FALL_ART_OFFLINE === '1';
const browser = await chromium.launch({ headless: true });
let checks = 0;
const errors = [], requests = [];
const ok = (value, label) => { assert.ok(value, label); checks++; };
const href = item => `${base}/menu?view=fall&item=${item}`;
try {
	if (output) mkdirSync(output, { recursive: true });
	const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
	const page = await context.newPage();
	page.setDefaultTimeout(15000);
	page.on('pageerror', error => errors.push(error.message));
	page.on('request', req => { if (/\/house\/brennans\/fall-/.test(req.url())) requests.push(req.url()); });
	await page.goto(`${base}/flashcards?deck=fall%3Atoday`);
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	ok(requests.length === 0, 'Cold Today practice never requests an image before recall');
	ok(await page.locator('.fall-art').count() === 0, 'Question front has no image, caption or visual key');
	await page.getByRole('button', { name: 'Flip', exact: true }).click();
	const disclosure = page.locator('details.fall-art');
	ok(!await disclosure.evaluate(el => el.open), 'Revealed answer starts with its image disclosure closed');
	ok(requests.length === 0, 'A closed answer disclosure downloads no image');
	await disclosure.locator('summary').click();
	await page.waitForFunction(() => document.querySelector('.fall-art figure img')?.naturalWidth === 1200);
	ok(await disclosure.locator('.art-cues li').count() >= 3, 'The revealed image has an accessible teaching key');
	const position = await page.locator('.deckframe .where').innerText();
	const record = await page.evaluate(() => localStorage.getItem('oot-house-drilled-v1'));
	await page.getByRole('button', { name: 'Enlarge illustration', exact: true }).click();
	await page.locator('dialog[open] .viewer-canvas').focus();
	await page.keyboard.press('1');
	ok(await page.locator('.deckframe .where').innerText() === position, 'Viewer keyboard cannot grade or advance the card');
	ok(await page.evaluate(() => localStorage.getItem('oot-house-drilled-v1')) === record, 'Viewing artwork never writes a grade');
	await page.keyboard.press('+');
	ok(await page.locator('dialog[open] .zoom-value').innerText() === '150%', 'Keyboard zoom works');
	await page.keyboard.press('Escape');
	ok(await page.getByRole('button', { name: 'Enlarge illustration', exact: true }).evaluate(el => el === document.activeElement), 'Closing restores focus');
	await page.getByRole('link', { name: 'Read this item', exact: true }).click();
	await page.locator('section.fall-art').waitFor();
	await page.goBack();
	await page.getByRole('button', { name: 'Again', exact: true }).click();
	ok(await page.locator('.fall-art').count() === 0, 'Next question has no visual hints');
	for (const [i, item] of art.items.entries()) {
		await page.goto(href(item.itemId));
		await page.waitForFunction(() => document.querySelector('section.fall-art figure img')?.naturalWidth === 1200);
		ok(await page.locator('section.fall-art figure img').getAttribute('alt') === item.alt, `${item.itemId}: reviewed alternative text`);
		ok(await page.locator('section.fall-art .art-cues li').count() === item.cues.length, `${item.itemId}: all teaching cues`);
		for (const service of ['day', 'night']) {
			await page.evaluate(s => document.documentElement.setAttribute('data-service', s), service);
			await page.setViewportSize({ width: i % 2 ? 320 : 1120, height: 900 });
			ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${item.itemId}: ${service} fits`);
		}
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${base}/menu?view=fall&kind=all`);
	await page.locator('.folio-thumb').first().waitFor();
	ok(await page.locator('.folio-thumb').count() === 17, 'All menu cards have a decorative thumbnail');
	if (output) await page.screenshot({ path: resolve(output, 'table-fall-art-phone.png'), fullPage: true });
	await page.setViewportSize({ width: 320, height: 700 });
	const fail = '**/house/brennans/fall-' + art.items[0].itemId + '-v1.webp';
	await page.route(fail, route => route.abort());
	await page.goto(href(art.items[0].itemId));
	await page.getByText('The illustration is not available', { exact: true }).waitFor();
	ok(await page.locator('.art-cues li').count() >= 3, 'Readable teaching remains when an image fails');
	const retry = page.getByRole('button', { name: 'Try again', exact: true });
	ok(await retry.evaluate(button => {
		const control = button.getBoundingClientRect();
		const box = button.closest('.illustration-box').getBoundingClientRect();
		return control.top >= box.top && control.bottom <= box.bottom && control.left >= box.left && control.right <= box.right;
	}), 'At 320px the failed-image retry control stays inside its visible container');
	await page.unroute(fail);
	await retry.click();
	await page.waitForFunction(() => document.querySelector('section.fall-art figure img')?.naturalWidth === 1200);
	checks++;
	await context.close();
	if (offline) {
		const saved = await browser.newContext({ viewport: { width: 390, height: 844 } });
		const tab = await saved.newPage();
		tab.on('pageerror', e => errors.push(e.message));
		for (const item of art.items) {
			await tab.goto(href(item.itemId));
			await tab.waitForFunction(() => document.querySelector('section.fall-art figure img')?.naturalWidth === 1200);
			const image = await tab.locator('section.fall-art figure img').getAttribute('src');
			await tab.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 60000 });
			await tab.waitForFunction(async src => !!await (await caches.open('plates-v1')).match(src), image, { timeout: 30000 });
		}
		await saved.setOffline(true);
		for (const item of art.items) {
			await tab.goto(href(item.itemId));
			await tab.waitForFunction(() => document.querySelector('section.fall-art figure img')?.naturalWidth === 1200);
			ok(await tab.locator('.art-cues li').count() === item.cues.length, `${item.itemId}: image and notes available offline`);
		}
		await saved.close();
	}
	ok(errors.length === 0, 'No browser errors');
	const result = { checks, errors, base, offline, items: art.items.length, status: 'passed' };
	if (output) writeFileSync(resolve(output, 'table-browser.json'), JSON.stringify(result, null, 2) + '\n');
	console.log(JSON.stringify(result));
} finally { await browser.close(); }
