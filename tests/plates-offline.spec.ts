import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goto } from './helpers';
import type { Plate } from '../src/lib/types';

const data = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/data/plates.json'), 'utf8')) as { plates: Plate[] };
const plate = data.plates.find(p => p.slug === 'beef-cuts')!;
const currentPath = `/${plate.image.src}`;
const oldPath = `/plates/${plate.slug}.webp`;

async function holdFirstWorker(page: Page) {
	// Deliberately make the image win the installation race. Holding register,
	// rather than sleeping, proves the first image loaded with no controller.
	// The production registration and worker run normally once released.
	await page.addInitScript(() => {
		const container = navigator.serviceWorker;
		const register = container.register.bind(container);
		let release!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		Object.defineProperty(window, '__releasePlateWorker', { value: release });
		container.register = async (...args: Parameters<ServiceWorkerContainer['register']>) => {
			await gate;
			return register(...args);
		};
	});
}

async function releaseFirstWorker(page: Page) {
	await page.evaluate(() => (window as unknown as { __releasePlateWorker: () => void }).__releasePlateWorker());
	await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL === new URL('/sw.js', location.href).href, undefined, { timeout: 40_000 });
}

async function expectCached(page: Page) {
	await expect.poll(() => page.evaluate(async path => !!await (await caches.open('plates-v1')).match(path), currentPath), { timeout: 40_000 }).toBe(true);
}

test('a first direct plate visit keeps its pre-claim illustration and reviewed lesson offline', async ({ page, context }) => {
	test.setTimeout(90_000);
	await holdFirstWorker(page);
	await goto(page, `/plates/${plate.slug}`);
	const picture = page.locator('figure.plate img');
	await expect(picture).toHaveAttribute('src', currentPath);
	await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();

	await page.evaluate(async ({ oldPath, unopened }) => {
		// A previous illustration cache key must not answer the new v2 URL.
		const cache = await caches.open('plates-v1');
		await cache.put(oldPath, new Response('previous illustration', { headers: { 'Content-Type': 'text/plain' } }));
		// A real lazy image far outside the viewport must not be fetched by the
		// post-claim scan. Only pictures which actually loaded are eligible.
		const lazy = document.createElement('img');
		lazy.id = 'unopened-plate';
		lazy.loading = 'lazy';
		lazy.width = 360;
		lazy.height = 540;
		lazy.style.cssText = 'position:absolute;top:100000px;left:0';
		lazy.src = unopened;
		document.body.append(lazy);
	}, { oldPath, unopened: '/plates/pork-cuts-v2.thumb.webp' });
	await releaseFirstWorker(page);
	await expectCached(page);
	const cached = await page.evaluate(async ({ currentPath, oldPath }) => {
		const cache = await caches.open('plates-v1');
		const current = await cache.match(currentPath);
		return {
			old: await (await cache.match(oldPath))?.text(),
			currentType: current?.headers.get('Content-Type'),
			currentBytes: (await current?.arrayBuffer())?.byteLength ?? 0,
			unopened: !!await cache.match('/plates/pork-cuts-v2.thumb.webp'),
			archive: !!await cache.match('/plates/archive/beef-cuts.webp')
		};
	}, { currentPath, oldPath });
	expect(cached.old).toBe('previous illustration');
	expect(cached.currentType).toContain('image/webp');
	expect(cached.currentBytes).toBeGreaterThan(1000);
	expect(cached.unopened).toBe(false);
	expect(cached.archive).toBe(false);

	await context.setOffline(true);
	await page.reload();
	await page.waitForSelector('html[data-hydrated]');
	await expect(page.locator('h1')).toHaveText(plate.teaching.title);
	await expect(page.locator('.subjects > li')).toHaveCount(6);
	await expect(page.locator('.subject h3')).toHaveText(plate.teaching.subjects.map(s => s.name));
	await expect.poll(() => page.locator('figure.plate img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	await expect(page.locator('figure.plate img')).toHaveAttribute('src', currentPath);
	await context.setOffline(false);
});

test('a plate opened during the first install is retained when its image finishes after claim', async ({ page }) => {
	test.setTimeout(90_000);
	await holdFirstWorker(page);
	let releasePicture!: () => void;
	let pictureStarted!: () => void;
	const heldPicture = new Promise<void>(resolve => { releasePicture = resolve; });
	const started = new Promise<void>(resolve => { pictureStarted = resolve; });
	await page.route(`**${currentPath}`, async route => {
		const response = await route.fetch();
		pictureStarted();
		await heldPicture;
		await route.fulfill({ response });
	});
	// Workbox normally waits for window.load before registering. Start from
	// the wall, then use client navigation while the first registration is
	// held: the full picture begins before claim without holding window.load.
	await goto(page, '/plates');
	await page.locator(`ul.wall a[href="/plates/${plate.slug}"]`).click();
	await expect(page).toHaveURL(new RegExp(`/plates/${plate.slug}$`));
	await started;
	expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
	await releaseFirstWorker(page);
	expect(await page.locator('figure.plate img').evaluate((img: HTMLImageElement) => img.complete)).toBe(false);
	expect(await page.evaluate(async path => !!await (await caches.open('plates-v1')).match(path), currentPath)).toBe(false);
	releasePicture();
	await expect.poll(() => page.locator('figure.plate img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	await expectCached(page);
});
