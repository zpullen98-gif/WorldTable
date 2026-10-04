import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BOTTLE_TIERS, BOTTLE_WORDS, HALF_SIZE, KEYS, foldSize, inBottleBand, printedDollars, wineListOf } from './house-schema';
import type { House, Pairing } from './house-schema';
import { normaliseHouse } from './house-normalise';
import { validateHouse } from './house-validate';
import { mergeHouse } from './house-merge';
import { buildPack, readPack, refreshEdition } from './house-pack';

/**
 * The bottle list and the tiers (the wine deep dive, 4 October 2026): a
 * house wine may be sold from the bottle list ('bottle') with its bin and
 * its size, and a dish's pairing may carry bottles by tier (value, the
 * sweet spot, the celebration, a half bottle). What is under test: the
 * keys as data, the normaliser keeping what is there and writing nothing
 * that was not (so an older edition reads as it did), references that
 * follow a re-minted id, each validator rule provoked once, the merge
 * carrying the tiers whole inside the pairing mark, the pack round trip and
 * a refresh by a newer edition.
 */

const FIXTURE_PATH = fileURLToPath(new URL('./fixtures/house-min.json', import.meta.url));
const NOW = Date.parse('2026-10-04T12:00:00.000Z');

type Raw = Record<string, any>;
const fixture = (): Raw => JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function seeded(start = 99): () => number {
	let s = start;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x80000000;
	};
}

/** The fixture with four bottle wines and all four tiers on the chicken's pairing. */
function bottled(): Raw {
	const h = fixture();
	const base = h.wines[0];
	const bottle = (id: string, name: string, price: string, bin: string, size: string) =>
		Object.assign(clone(base), { id, name, wine: name, glass: '', bottle: price, price, prices: [], list: 'bottle', bin, size });
	h.wines.push(
		bottle('w-bvalue01', 'Quay Lane Value Red', '$68', '1101', '750ml'),
		bottle('w-bclass01', 'Quay Lane Reserve', '$140', '1102', '750ml'),
		bottle('w-bsplur01', 'Quay Lane Grand Vin', '$1,250', '1103', '1.5L'),
		bottle('w-bhalf001', 'Quay Lane Half', '$54', '1104', '375 ml')
	);
	const pick = (wineId: string) => ({ wineId, why: 'It meets the roast with the same weight.', sayIt: 'This one sits right beside the chicken.' });
	h.dishes[0].pairing.value.bottles = { value: pick('w-bvalue01'), classic: pick('w-bclass01'), splurge: pick('w-bsplur01'), half: pick('w-bhalf001') };
	return h;
}

const norm = (h: Raw): House => normaliseHouse(h, { rand: seeded() }).house;
const bottlesOf = (h: House): NonNullable<Pairing['bottles']> => (h.dishes[0].pairing!.value.bottles as NonNullable<Pairing['bottles']>);
const codes = (h: House) => validateHouse(h).problems.map((p) => p.code + ' ' + p.path);

describe('the keys and the helpers', () => {
	it('names the new keys as data', () => {
		expect(KEYS.HouseWine).toEqual(expect.arrayContaining(['list', 'bin', 'size']));
		expect(KEYS.Pairing).toContain('bottles');
		expect(KEYS.PairingBottles).toEqual([...BOTTLE_TIERS]);
		expect(KEYS.BottlePick).toEqual(['wineId', 'why', 'sayIt']);
		expect(BOTTLE_TIERS).toEqual(['value', 'classic', 'splurge', 'half']);
		expect(HALF_SIZE).toBe('375ml');
		expect(BOTTLE_WORDS).toBe(25);
	});

	it('reads a printed price, a size and the list', () => {
		expect(printedDollars('$1,250')).toBe(1250);
		expect(printedDollars('$80 half-bottle')).toBe(80);
		expect(printedDollars('MP')).toBeNaN();
		expect(foldSize('375 ML')).toBe('375ml');
		expect(wineListOf({})).toBe('glass');
		expect(wineListOf({ list: 'bottle' })).toBe('bottle');
		expect(wineListOf({ list: 'cellar' })).toBe('glass');
	});

	it('draws the bands at 100 and 250, both ends of the sweet spot in', () => {
		expect(inBottleBand('value', 99)).toBe(true);
		expect(inBottleBand('value', 100)).toBe(false);
		expect(inBottleBand('classic', 100)).toBe(true);
		expect(inBottleBand('classic', 250)).toBe(true);
		expect(inBottleBand('classic', 251)).toBe(false);
		expect(inBottleBand('splurge', 250)).toBe(false);
		expect(inBottleBand('splurge', 251)).toBe(true);
		expect(inBottleBand('half', 40)).toBe(true);
		expect(inBottleBand('value', 0)).toBe(false);
	});
});

describe('the normaliser', () => {
	it('keeps a bottle wine and the four tiers as they came', () => {
		const h = norm(bottled());
		expect(h.wines[1]).toMatchObject({ list: 'bottle', bin: '1101', size: '750ml' });
		expect(Object.keys(bottlesOf(h))).toEqual([...BOTTLE_TIERS]);
		expect(bottlesOf(h).half).toEqual({ wineId: 'w-bhalf001', why: 'It meets the roast with the same weight.', sayIt: 'This one sits right beside the chicken.' });
	});

	it('writes nothing new on an edition without the fields', () => {
		const f = fixture();
		const h = norm(f);
		expect('list' in h.wines[0]).toBe(false);
		expect('bin' in h.wines[0]).toBe(false);
		expect('size' in h.wines[0]).toBe(false);
		expect('bottles' in h.dishes[0].pairing!.value).toBe(false);
		expect(JSON.parse(JSON.stringify(h))).toEqual(f);
	});

	it("drops 'glass' (the default), blanks, a stray tier, a stray key and an empty tier", () => {
		const raw = bottled();
		Object.assign(raw.wines[0], { list: 'glass', bin: '  ', size: '' });
		raw.wines[1].bin = 31122;
		const b = raw.dishes[0].pairing.value.bottles;
		b.magnum = { wineId: 'w-bvalue01', why: 'x', sayIt: 'y' };
		b.value.allergens = 'none';
		b.half = { wineId: '', why: '', sayIt: '' };
		const h = normaliseHouse(raw, { rand: seeded() });
		expect(Object.keys(h.house.wines[0])).not.toEqual(expect.arrayContaining(['list']));
		expect('bin' in h.house.wines[0]).toBe(false);
		expect(h.house.wines[1].bin).toBe('31122');
		expect(Object.keys(bottlesOf(h.house))).toEqual(['value', 'classic', 'splurge']);
		expect(Object.keys(bottlesOf(h.house).value!)).toEqual(['wineId', 'why', 'sayIt']);
		expect(h.report.some((r) => r.code === 'forbidden' && r.path.endsWith('bottles.value.allergens'))).toBe(true);
	});

	it('drops a bottles block with nothing in it', () => {
		const raw = fixture();
		raw.dishes[0].pairing.value.bottles = { value: { wineId: '', why: '', sayIt: '' } };
		expect('bottles' in norm(raw).dishes[0].pairing!.value).toBe(false);
	});

	it("follows a re-minted wine id into every tier", () => {
		const raw = bottled();
		raw.wines[1].id = 'bad id:one';
		raw.dishes[0].pairing.value.bottles.value.wineId = 'bad id:one';
		const h = norm(raw);
		expect(h.wines[1].id).not.toBe('bad id:one');
		expect(bottlesOf(h).value!.wineId).toBe(h.wines[1].id);
	});
});

describe('the validator', () => {
	it('passes a house whose tiers keep every rule', () => {
		expect(validateHouse(norm(bottled()))).toEqual({ problems: [], fatalCount: 0 });
	});

	it('refuses a tier naming no house wine, as a ref', () => {
		const raw = bottled();
		raw.dishes[0].pairing.value.bottles.value.wineId = 'w-nowhere1';
		expect(codes(norm(raw))).toContain('ref house.dishes[0].pairing.value.bottles.value.wineId');
	});

	it('refuses a glass wine in a tier', () => {
		const raw = bottled();
		raw.dishes[0].pairing.value.bottles.value.wineId = raw.wines[0].id;
		const { problems, fatalCount } = validateHouse(norm(raw));
		expect(problems.map((p) => p.code + ' ' + p.path)).toEqual(['tier house.dishes[0].pairing.value.bottles.value.wineId']);
		expect(fatalCount).toBe(1);
	});

	it('refuses a bottle outside its band, each way', () => {
		const raw = bottled();
		const b = raw.dishes[0].pairing.value.bottles;
		b.value.wineId = 'w-bclass01';
		b.classic.wineId = 'w-bsplur01';
		b.splurge.wineId = 'w-bvalue01';
		const said = validateHouse(norm(raw)).problems.filter((p) => p.code === 'tier').map((p) => p.said);
		expect(said).toEqual([
			'Quay Lane Reserve at 140 dollars is outside the value band',
			'Quay Lane Grand Vin at 1250 dollars is outside the classic band',
			'Quay Lane Value Red at 68 dollars is outside the splurge band'
		]);
	});

	it('refuses a half that is not 375ml, and a bottle with no figure', () => {
		const raw = bottled();
		raw.dishes[0].pairing.value.bottles.half.wineId = 'w-bvalue01';
		raw.wines[2].bottle = 'Ask';
		const said = validateHouse(norm(raw)).problems.filter((p) => p.code === 'tier').map((p) => p.said);
		expect(said).toEqual(['Quay Lane Reserve prints no bottle price', 'Quay Lane Value Red is not a 375ml half bottle']);
	});

	it('caps the why and the line at 25 words and refuses a missing one', () => {
		const raw = bottled();
		raw.dishes[0].pairing.value.bottles.value.why = Array.from({ length: 26 }, (_, i) => 'word' + i).join(' ');
		raw.dishes[0].pairing.value.bottles.classic.sayIt = '';
		expect(codes(norm(raw))).toEqual([
			'word-cap house.dishes[0].pairing.value.bottles.value.why',
			'tier house.dishes[0].pairing.value.bottles.classic.sayIt'
		]);
	});
});

describe('the merge, the pack and a refresh', () => {
	it('carries the tiers whole inside the pairing mark, kept beating hers', () => {
		const mine = norm(bottled());
		const theirs = clone(mine);
		theirs.dishes[0].pairing = { value: { ...clone(mine.dishes[0].pairing!.value), bottles: { value: clone(bottlesOf(mine).value!) } }, by: 'maitre', ts: NOW + 50 };
		mine.dishes[0].pairing!.by = 'person';
		const a = mergeHouse(mine, theirs).house;
		expect(Object.keys(bottlesOf(a))).toEqual([...BOTTLE_TIERS]);
		const b = mergeHouse(theirs, mine).house;
		expect(bottlesOf(b)).toEqual(bottlesOf(a));
		expect(mergeHouse(a, a).house).toEqual(a);
	});

	it('survives the pack round trip byte for byte', () => {
		const h = norm(bottled());
		const text = JSON.stringify(buildPack(h, 'tools', NOW));
		const read = readPack(text, { rand: seeded() });
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.fatalCount).toBe(0);
		expect(read.house).toEqual(h);
	});

	it('a newer edition brings the bottles and the tiers to a device on the old one', () => {
		const old = norm(fixture());
		const shipped = norm(bottled());
		const { house, counts } = refreshEdition(old, shipped);
		expect(house.wines.map((w) => w.id)).toEqual(shipped.wines.map((w) => w.id));
		expect(bottlesOf(house)).toEqual(bottlesOf(shipped));
		expect(counts.added).toBe(4);
		const again = refreshEdition(house, shipped);
		expect(again.house).toEqual(house);
	});
});
