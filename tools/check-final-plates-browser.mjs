// FINAL_PLATES_URL may point at a development server or published /table base.
// FINAL_PLATES_OFFLINE=1 requires the built production service worker.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const { items } = JSON.parse(readFileSync(new URL('../src/lib/data/brennans-final-dishes.json', import.meta.url)));
const houseToFall = JSON.parse(readFileSync(new URL('../src/lib/data/brennans-final-dish-links.json', import.meta.url)));
const base = (process.env.FINAL_PLATES_URL || 'http://127.0.0.1:8780').replace(/\/$/, '');
const output = process.env.FINAL_PLATES_OUTPUT;
const offline = process.env.FINAL_PLATES_OFFLINE === '1';
const browser = await chromium.launch({ headless: true });
const errors = [];
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
const gallery = `${base}/menu?view=plates`;
const isImage = url => /\/house\/brennans\/final-plates\/.+-v1\.webp(?:\?|$)/.test(url);
try {
  if (output) mkdirSync(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1120, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  const requested = [];
  page.on('request', request => { if (isImage(request.url())) requested.push(request.url()); });
  await page.goto(gallery);
  await page.locator('.plate-tile').first().waitFor();
  ok(await page.locator('.plate-tile').count() === items.length, 'Every reviewed dish is available in the gallery');
  ok(requested.length === 0, 'Gallery thumbnails do not prefetch the full-size collection');
  for (const [index, art] of items.entries()) {
    await page.locator(`[data-plate="${art.collection}:${art.itemId}"] .plate-preview`).click();
    const section = page.locator(`[data-final-dish="${art.itemId}"]`);
    await section.locator('figure img').waitFor();
    await page.waitForFunction(id => document.querySelector(`[data-final-dish="${id}"] figure img`)?.naturalWidth === 1200, art.itemId);
    ok(await section.locator('figure img').getAttribute('alt') === art.alt, `${art.itemId}: reviewed alternative text`);
    ok(await section.locator('.plate-reading li').count() === art.ingredientCues.length, `${art.itemId}: complete ingredient cues`);
    const theme = index % 2 ? 'day' : 'night';
    await page.evaluate(value => document.documentElement.setAttribute('data-service', value), theme);
    await page.setViewportSize({ width: index % 2 ? 320 : 1120, height: 900 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${art.itemId}: responsive ${theme} layout`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Find a dish or ingredient').fill('Hussarde');
  ok(await page.locator('.plate-tile').count() === 1, 'Dish search isolates a single plate');
  const hussarde = page.locator('[data-plate="house:d-1q0xk7jv"]');
  if (await hussarde.locator('.plate-preview').getAttribute('aria-expanded') !== 'true') await hussarde.locator('.plate-preview').click();
  await hussarde.getByRole('button', { name: 'Read this dish', exact: true }).click();
  await page.locator('.studyslot [data-final-dish="d-1q0xk7jv"] figure img').waitFor();
  ok(await page.locator('.studyslot').innerText().then(text => text.includes('Eggs Hussarde')), 'Gallery opens the matching canonical dish lesson');
  await page.goBack();
  await hussarde.waitFor({ state: 'visible' });
  ok(await page.getByLabel('Find a dish or ingredient').inputValue() === 'Hussarde', 'Back preserves gallery search');
  ok(await hussarde.locator('.plate-preview').getAttribute('aria-expanded') === 'true', 'Back preserves expanded presentation');
  await page.getByRole('button', { name: 'Enlarge illustration', exact: true }).click();
  await page.locator('dialog[open] .viewer-canvas').focus();
  await page.keyboard.press('+');
  ok(await page.locator('dialog[open] .zoom-value').innerText() === '150%', 'Keyboard enlargement works');
  await page.keyboard.press('Escape');
  ok(await page.getByRole('button', { name: 'Enlarge illustration', exact: true }).evaluate(el => el === document.activeElement), 'Closing the viewer restores focus');
  if (output) {
    for (const theme of ['day', 'night']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-service', value), theme);
      await page.screenshot({ path: resolve(output, `final-plate-phone-${theme}.png`), fullPage: true });
    }
  }
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByLabel('Menu collection', { exact: true }).selectOption('fall');
  ok(await page.locator('.plate-tile').count() === items.filter(art => art.collection === 'fall').length, 'Fall filter includes every seasonal food');
  const firstFall = items.find(art => art.collection === 'fall');
  if (firstFall) {
    await page.locator(`[data-plate="fall:${firstFall.itemId}"] .plate-preview`).click();
    const canonicalRead = page.getByRole('button', { name: 'Read this dish', exact: true });
    await canonicalRead.click();
    const canonicalFallId = Object.keys(houseToFall).find(id => houseToFall[id] === firstFall.itemId);
    await page.locator(`.studyslot [data-final-dish="${canonicalFallId}"] figure img`).waitFor();
    ok(await page.locator('.studyslot').innerText().then(text => text.includes(firstFall.name)), 'Seasonal plate opens the canonical fall dish lesson');
    await page.goBack();
    await page.getByRole('link', { name: 'Fall ingredient notes', exact: true }).click();
    await page.locator(`.fall-folio [data-final-dish="${firstFall.itemId}"] figure img`).waitFor();
    ok(await page.locator('details.fall-art').count() === 1, 'Fall lesson retains its separate ingredient study');
    ok(!await page.locator('details.fall-art').evaluate(el => el.open), 'Ingredient study starts folded beside the finished dish');
  }
  // Cold contexts prove flashcard recall never downloads or reveals the image.
  const fallHouseId = firstFall && Object.keys(houseToFall).find(id => houseToFall[id] === firstFall.itemId);
  for (const [deck, id] of [['item:d-1q0xk7jv', 'd-1q0xk7jv'], ...(firstFall ? [[`fall:item:${firstFall.itemId}`, firstFall.itemId], [`item:${fallHouseId}`, fallHouseId]] : [])]) {
    const recall = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
    const card = await recall.newPage(), imageRequests = [];
    card.on('request', request => { if (isImage(request.url())) imageRequests.push(request.url()); });
    card.on('pageerror', error => errors.push(error.message));
    await card.goto(`${base}/flashcards?deck=${encodeURIComponent(deck)}`);
    await card.getByRole('button', { name: 'Start', exact: true }).click();
    ok(await card.locator('[data-final-dish]').count() === 0 && imageRequests.length === 0, `${deck}: no visual answer leak`);
    await card.getByRole('button', { name: 'Flip', exact: true }).click();
    const disclosure = card.locator(`details[data-final-dish="${id}"]`);
    await disclosure.waitFor();
    ok(!await disclosure.evaluate(el => el.open) && imageRequests.length === 0, `${deck}: reveal keeps image optional`);
    await disclosure.locator('summary').click();
    await card.waitForFunction(dishId => document.querySelector(`[data-final-dish="${dishId}"] figure img`)?.naturalWidth === 1200, id);
    const progress = await card.locator('.deckframe .where').innerText();
    const grade = await card.evaluate(() => localStorage.getItem('oot-house-drilled-v1'));
    await disclosure.getByRole('button', { name: 'Enlarge illustration', exact: true }).click();
    await card.locator('dialog[open] .viewer-canvas').focus();
    await card.keyboard.press('1');
    ok(await card.locator('.deckframe .where').innerText() === progress, `${deck}: viewer cannot advance card`);
    ok(await card.evaluate(() => localStorage.getItem('oot-house-drilled-v1')) === grade, `${deck}: viewer cannot save a grade`);
    await recall.close();
  }
  const failItem = firstFall || items[0];
  const failureUrl = `${base}/${failItem.src}`;
  await page.route(failureUrl, route => route.abort());
  await page.goto(gallery);
  await page.getByLabel('Find a dish or ingredient').fill(failItem.name);
  await page.locator(`[data-plate="${failItem.collection}:${failItem.itemId}"] .plate-preview`).click();
  await page.getByText('The illustration is not available', { exact: true }).waitFor();
  ok(await page.locator('.plate-reading li').count() === failItem.ingredientCues.length, 'Image failure preserves the complete teaching text');
  await page.unroute(failureUrl);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.waitForFunction(id => document.querySelector(`[data-final-dish="${id}"] figure img`)?.naturalWidth === 1200, failItem.itemId);
  checks++;
  await context.close();
  if (offline) {
    const saved = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const tab = await saved.newPage();
    tab.on('pageerror', error => errors.push(error.message));
    const sample = [items.find(art => art.itemId === 'd-1q0xk7jv'), firstFall].filter(Boolean);
    for (const art of sample) {
      await tab.goto(gallery);
      await tab.getByLabel('Find a dish or ingredient').fill(art.name);
      await tab.locator(`[data-plate="${art.collection}:${art.itemId}"] .plate-preview`).click();
      await tab.waitForFunction(id => document.querySelector(`[data-final-dish="${id}"] figure img`)?.naturalWidth === 1200, art.itemId);
      await tab.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 60000 });
      await tab.waitForFunction(async url => !!await (await caches.open('plates-v1')).match(url), `${base}/${art.src}`, { timeout: 30000 });
    }
    await saved.route('**/*', route => route.abort());
    await saved.setOffline(true);
    ok(await tab.evaluate(async () => { try { await fetch('/uncached-offline-control-' + Date.now()); return false; } catch { return true; } }), 'Offline negative control blocks uncached network');
    for (const art of sample) {
      await tab.goto(gallery);
      await tab.getByLabel('Find a dish or ingredient').fill(art.name);
      await tab.locator(`[data-plate="${art.collection}:${art.itemId}"] .plate-preview`).click();
      await tab.waitForFunction(id => document.querySelector(`[data-final-dish="${id}"] figure img`)?.naturalWidth === 1200, art.itemId);
      ok(await tab.locator('.plate-reading li').count() === art.ingredientCues.length, `${art.itemId}: saved image and teaching work offline`);
    }
    await saved.close();
  }
  ok(errors.length === 0, 'No browser errors');
  const result = { status: 'passed', base, offline, items: items.length, checks, errors };
  if (output) writeFileSync(resolve(output, 'final-plates-browser.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
