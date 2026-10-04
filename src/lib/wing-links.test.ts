import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { House } from './house/house-schema';
import { roomHref, roomListHref, wingInstalled } from './wing-links';

const PACK: House = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
const CHAMPAGNE = 'w-dbz9e960';
const CATALINA = 'b-uzw5oty7';
const HUSSARDE = 'd-1q0xk7jv';

describe('roomHref', () => {
	it('draws nothing off the shared origin', () => {
		expect(roomHref('codex', CHAMPAGNE, '', PACK)).toBe('');
		expect(roomHref('ledger', CATALINA, '', PACK)).toBe('');
		expect(roomListHref('codex', '')).toBe('');
	});
	it('gives the three address shapes under /table, for items in the house', () => {
		expect(roomHref('codex', CHAMPAGNE, '/table', PACK)).toBe('/codex/#wine=w-dbz9e960');
		expect(roomHref('ledger', CATALINA, '/table', PACK)).toBe('/ledger/#drink=b-uzw5oty7');
		expect(roomHref('table', HUSSARDE, '/table', PACK)).toBe('/table/menu#d-1q0xk7jv');
		expect(roomListHref('codex', '/table')).toBe('/codex/#list');
		expect(roomListHref('ledger', '/table')).toBe('/ledger/#/menu');
	});
	it('draws nothing for an id not in the house, a malformed id or the wrong room', () => {
		expect(roomHref('codex', 'w-zzzzzzzz', '/table', PACK)).toBe('');
		expect(roomHref('codex', 'w-dbz9e96', '/table', PACK)).toBe('');
		expect(roomHref('codex', CATALINA, '/table', PACK)).toBe('');
		expect(roomHref('codex', CHAMPAGNE, '/table', null)).toBe('');
	});
	it('reads no room as installed where there are no caches', async () => {
		expect(await wingInstalled('codex')).toBe(false);
	});
});
