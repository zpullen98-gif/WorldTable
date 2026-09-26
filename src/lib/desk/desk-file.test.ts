import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	DESK_FORMAT,
	DESK_MAX_ITEMS,
	DESK_MAX_STRING,
	deskFilename,
	deskSource,
	downloadDesk,
	emptyDesk,
	mintDeskId,
	readDeskFile,
	toParsedDish,
	type DeskCocktail,
	type DeskDish,
	type DeskFile,
	type DeskItem,
	type DeskUnsure,
	type DeskWine
} from './desk-file';

/**
 * The desk file is a draft other people's devices will open, so the two
 * things under test are the shape (pinned key by key, with no allergen field
 * on any of them) and the reader's refusal to throw or to trust: every string
 * capped, every price part a substring of the printed price, every id well
 * formed, and a file this build does not understand left alone.
 */

const NOW = Date.parse('2026-09-25T14:02:00.000Z');
const ISO = new Date(NOW).toISOString();

const src = () => deskSource('paste', 'table', 'STARTERS\nSoup 9', { now: new Date(NOW) });

const base = {
	id: 'k-00000001',
	section: 'STARTERS',
	name: 'Soup',
	price: { printed: '9', parts: [{ amount: '9', label: '' }] },
	marks: [] as string[],
	confidence: 'high' as const,
	why: [] as string[],
	raw: 'Soup 9',
	lines: [1, 1] as [number, number]
};

const dish = (over: Partial<DeskDish> = {}): DeskDish => ({
	...base,
	kind: 'dish',
	description: '',
	ingredientsNamed: [],
	...over
});
const wine = (over: Partial<DeskWine> = {}): DeskWine => ({
	...base,
	id: 'k-00000002',
	kind: 'wine',
	name: 'Ployez-Jacquemart',
	producer: 'Ployez-Jacquemart',
	wine: '',
	vintage: '2010',
	region: 'Champagne',
	country: 'France',
	grapes: [],
	style: 'Extra-Brut',
	bin: '',
	pours: [
		{ price: '45.00', size: '5 oz' },
		{ price: '22.50', size: '2.5 oz' }
	],
	bottle: '',
	descriptors: 'Extra-Brut, Champagne, France',
	...over
});
const cocktail = (over: Partial<DeskCocktail> = {}): DeskCocktail => ({
	...base,
	id: 'k-00000003',
	kind: 'cocktail',
	name: 'Holy Trinity',
	spec: ['trinity infused gin', 'benedictine', 'lime'],
	description: '',
	baseSpirit: 'gin',
	...over
});
const unsure = (over: Partial<DeskUnsure> = {}): DeskUnsure => ({
	...base,
	id: 'k-00000004',
	kind: 'unsure',
	name: 'Kiss the Crab',
	confidence: 'low',
	could: ['cocktail', 'dish'],
	...over
});

const file = (items: DeskItem[], over: Partial<DeskFile> = {}): DeskFile => ({
	...emptyDesk(src(), new Date(NOW)),
	items,
	...over
});

/** Every key at every depth, so an allergen field cannot hide inside a row. */
function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

describe('the shapes, pinned key by key', () => {
	const BASE_KEYS = ['confidence', 'id', 'kind', 'lines', 'marks', 'name', 'price', 'raw', 'section', 'why'];

	it('a dish', () => {
		expect(Object.keys(dish()).sort()).toEqual([...BASE_KEYS, 'description', 'ingredientsNamed'].sort());
	});

	it('a wine', () => {
		expect(Object.keys(wine()).sort()).toEqual(
			[
				...BASE_KEYS,
				'bin',
				'bottle',
				'country',
				'descriptors',
				'grapes',
				'pours',
				'producer',
				'region',
				'style',
				'vintage',
				'wine'
			].sort()
		);
	});

	it('a cocktail', () => {
		expect(Object.keys(cocktail()).sort()).toEqual([...BASE_KEYS, 'baseSpirit', 'description', 'spec'].sort());
	});

	it('an unsure row', () => {
		expect(Object.keys(unsure()).sort()).toEqual([...BASE_KEYS, 'could'].sort());
	});

	it('has no allergen field on any shape, and the reader does not let one in', () => {
		const smuggled = file([
			{ ...dish(), allergens: ['nuts'], allergensCheckedAt: 1 } as never,
			{ ...wine(), allergens: [] } as never,
			{ ...cocktail(), contains: ['egg'] } as never,
			{ ...unsure(), allergens: [] } as never
		]);
		const read = readDeskFile(smuggled, NOW)!;
		expect(read).not.toBeNull();
		for (const key of keysDeep(read)) expect(key).not.toMatch(/allerg|contains/i);
	});
});

describe('readDeskFile', () => {
	it('reads back what a reader would write, unchanged', () => {
		const written = file([dish(), wine(), cocktail(), unsure()], {
			venue: "Commander's Palace",
			notice: 'Only the first 200,000 characters were read.',
			taken: { wine: ISO }
		});
		expect(readDeskFile(JSON.parse(JSON.stringify(written)), NOW)).toEqual(written);
	});

	it('takes the JSON text as well as the parsed object', () => {
		const written = file([dish()]);
		expect(readDeskFile(JSON.stringify(written), NOW)).toEqual(written);
	});

	it('refuses what is not a desk file, and never throws', () => {
		for (const bad of [
			null,
			undefined,
			1,
			'x',
			'{',
			'[]',
			[],
			{},
			{ format: 'world-table-session', version: 1, items: [] },
			{ format: DESK_FORMAT },
			{ format: DESK_FORMAT, version: '1', items: [] },
			{ format: DESK_FORMAT, version: 1 },
			{ format: DESK_FORMAT, version: 1, items: 'Soup 9' }
		]) {
			expect(readDeskFile(bad, NOW)).toBeNull();
		}
	});

	it('refuses a version this build does not know, so it never persists over a newer one', () => {
		expect(readDeskFile({ ...file([]), version: 2 }, NOW)).toBeNull();
	});

	it('refuses more rows than a menu can have, and takes exactly the cap', () => {
		const rows = (n: number) => Array.from({ length: n }, (_, i) => dish({ id: `k-${String(i).padStart(8, '0')}` }));
		expect(readDeskFile(file(rows(DESK_MAX_ITEMS + 1)), NOW)).toBeNull();
		expect(readDeskFile(file(rows(DESK_MAX_ITEMS)), NOW)!.items).toHaveLength(DESK_MAX_ITEMS);
	});

	it('caps every string at the limit', () => {
		const long = 'x'.repeat(DESK_MAX_STRING + 50);
		const read = readDeskFile(
			file([
				dish({ name: long, section: long, description: long, raw: long, why: [long], marks: [long] }),
				wine({ descriptors: long, producer: long }),
				cocktail({ spec: [long], baseSpirit: long })
			]),
			NOW
		)!;
		const d = read.items[0] as DeskDish;
		for (const s of [d.name, d.section, d.description, d.raw, d.why[0], d.marks[0]]) {
			expect(s).toHaveLength(DESK_MAX_STRING);
		}
		const w = read.items[1] as DeskWine;
		expect(w.descriptors).toHaveLength(DESK_MAX_STRING);
		expect(w.producer).toHaveLength(DESK_MAX_STRING);
		const c = read.items[2] as DeskCocktail;
		expect(c.spec[0]).toHaveLength(DESK_MAX_STRING);
		expect(c.baseSpirit).toHaveLength(DESK_MAX_STRING);
	});

	it('drops a price part that is not a substring of the printed price', () => {
		// 1244 is what the old strip-the-digits rule made of "12 / 44", and a
		// file carrying it is carrying a figure the menu never printed.
		const read = readDeskFile(
			file([
				dish({
					price: {
						printed: '12 / 44',
						parts: [
							{ amount: '12', label: '' },
							{ amount: '1244', label: '' },
							{ amount: '44', label: 'large' }
						]
					}
				})
			]),
			NOW
		)!;
		expect(read.items[0].price).toEqual({
			printed: '12 / 44',
			parts: [
				{ amount: '12', label: '' },
				{ amount: '44', label: 'large' }
			]
		});
	});

	it('keeps a nameless row visible as unsorted rather than dropping it, and drops one with nothing at all', () => {
		const read = readDeskFile(
			file([dish({ name: '  ', raw: '9.50', lines: [4, 4] }), dish({ name: '', raw: '' })]),
			NOW
		)!;
		expect(read.items).toEqual([]);
		expect(read.unsorted).toEqual([{ raw: '9.50', line: 4, reason: 'no-name' }]);
	});

	it('makes a kind it does not know unsure, and says so on the row', () => {
		const read = readDeskFile(file([{ ...dish(), kind: 'spirit' } as never]), NOW)!;
		const row = read.items[0] as DeskUnsure;
		expect(row.kind).toBe('unsure');
		expect(row.could).toEqual([]);
		expect(row.why.some((w) => /kind the desk does not know/.test(w))).toBe(true);
		expect(row.raw).toBe('Soup 9');
	});

	it('keeps only wing kinds in could, once each, in order', () => {
		const read = readDeskFile(
			file([unsure({ could: ['wine', 'unsure', 'wine', 'dish', 'beer'] as never })]),
			NOW
		)!;
		expect((read.items[0] as DeskUnsure).could).toEqual(['wine', 'dish']);
	});

	it('mints an id for a row without a well-formed one, and re-mints a duplicate', () => {
		const read = readDeskFile(
			file([dish({ id: 'k-00000001' }), dish({ id: 'k-00000001', name: 'Stew' }), dish({ id: 'd-abcdefgh', name: 'Pie' }), dish({ id: '', name: 'Tart' })]),
			NOW
		)!;
		const ids = read.items.map((i) => i.id);
		expect(ids[0]).toBe('k-00000001');
		for (const id of ids) expect(id).toMatch(/^k-[0-9a-z]{8}$/);
		expect(new Set(ids).size).toBe(4);
	});

	it('reads confidence as low for anything but high', () => {
		const read = readDeskFile(file([dish({ confidence: 'medium' as never }), dish({ confidence: 'high' })]), NOW)!;
		expect(read.items.map((i) => i.confidence)).toEqual(['low', 'high']);
	});

	it('lower-cases the printed marks and drops what is not a string', () => {
		const read = readDeskFile(file([dish({ marks: ['V', 'GF', 3, ''] as never })]), NOW)!;
		expect(read.items[0].marks).toEqual(['v', 'gf']);
	});

	it('repairs a clock it cannot read to now, on the file and on the source', () => {
		const read = readDeskFile(
			{ ...file([]), createdAt: 'yesterday', source: { ...src(), at: 5 } },
			NOW
		)!;
		expect(read.createdAt).toBe(ISO);
		expect(read.source.at).toBe(ISO);
	});

	it('reads the source field by field, falling back on each alone', () => {
		const read = readDeskFile(
			{ ...file([]), source: { kind: 'fax', readIn: 'hub', reader: 7, hash: null, url: '' } },
			NOW
		)!;
		expect(read.source).toEqual({ kind: 'paste', at: ISO, reader: 'desk-reader/1', readIn: 'table', hash: '' });
		const linked = readDeskFile(
			{ ...file([]), source: deskSource('link', 'codex', 'x', { url: 'https://a.test/menu', reader: 'maitre/claude-haiku-4-5', now: new Date(NOW) }) },
			NOW
		)!;
		expect(linked.source).toEqual({
			kind: 'link',
			at: ISO,
			url: 'https://a.test/menu',
			reader: 'maitre/claude-haiku-4-5',
			readIn: 'codex',
			hash: linked.source.hash
		});
		expect(linked.source.hash).toMatch(/^[0-9a-f]{8}$/);
	});

	it('keeps venue, notice and taken only when they are real', () => {
		const read = readDeskFile(
			{
				...file([]),
				venue: '   ',
				notice: '',
				taken: { dish: ISO, wine: 'not a date', beer: ISO }
			},
			NOW
		)!;
		expect('venue' in read).toBe(false);
		expect('notice' in read).toBe(false);
		expect(read.taken).toEqual({ dish: ISO });
		expect('taken' in readDeskFile({ ...file([]), taken: { wine: 'never' } }, NOW)!).toBe(false);
	});

	it('takes lines only as two ordered non-negative integers', () => {
		const read = readDeskFile(
			file([dish({ lines: [3, 1] }), dish({ lines: [2, 5] }), dish({ lines: [-1, 2] }), dish({ lines: '2' as never })]),
			NOW
		)!;
		expect(read.items.map((i) => i.lines)).toEqual([
			[0, 0],
			[2, 5],
			[0, 0],
			[0, 0]
		]);
	});

	it('keeps unsorted lines with a raw, and drops the rest', () => {
		const read = readDeskFile(
			{
				...file([]),
				unsorted: [{ raw: '9.50', line: 3, reason: 'orphan-price' }, { raw: '', line: 1 }, 'x', { raw: '~Finished~', line: -2 }]
			},
			NOW
		)!;
		expect(read.unsorted).toEqual([
			{ raw: '9.50', line: 3, reason: 'orphan-price' },
			{ raw: '~Finished~', line: 0, reason: '' }
		]);
	});

	it('keeps raw on every row, whatever else was repaired', () => {
		const read = readDeskFile(
			file([dish({ id: 'bad' }), wine({ confidence: 'x' as never }), cocktail({ marks: 'v' as never }), unsure({ could: 'wine' as never })]),
			NOW
		)!;
		expect(read.items).toHaveLength(4);
		for (const row of read.items) expect(row.raw).toBe('Soup 9');
	});
});

describe('minting, naming, building', () => {
	it('mints k- and eight base36 characters', () => {
		expect(mintDeskId()).toMatch(/^k-[0-9a-z]{8}$/);
	});

	it('steps past an id already taken', () => {
		let n = 0;
		// the first eight draws spell k-00000000, the next eight k-11111111
		const rand = () => (n++ < 8 ? 0 : 1 / 36);
		expect(mintDeskId(['k-00000000'], rand)).toBe('k-11111111');
	});

	it('names the file by the day', () => {
		expect(deskFilename(new Date(NOW))).toBe('menu-desk-2026-09-25.json');
	});

	it('builds a source with the stamp, the reader, the room and the hash, and a url only when given', () => {
		const s = src();
		expect(s).toEqual({ kind: 'paste', at: ISO, reader: 'desk-reader/1', readIn: 'table', hash: s.hash });
		expect('url' in s).toBe(false);
		expect(deskSource('link', 'ledger', 'x', { url: 'https://a.test', now: new Date(NOW) }).url).toBe('https://a.test');
	});

	it('starts an empty desk in the format, with no rows and nothing set aside', () => {
		expect(emptyDesk(src(), new Date(NOW))).toEqual({
			format: DESK_FORMAT,
			version: 1,
			createdAt: ISO,
			source: src(),
			items: [],
			unsorted: []
		});
	});
});

describe('downloadDesk', () => {
	const originalCreate = URL.createObjectURL;
	const originalRevoke = URL.revokeObjectURL;

	afterEach(() => {
		URL.createObjectURL = originalCreate;
		URL.revokeObjectURL = originalRevoke;
		vi.unstubAllGlobals();
	});

	it('hands the browser a JSON blob named by the day, clicks it, and revokes the URL', async () => {
		let blob: Blob | null = null;
		URL.createObjectURL = vi.fn((b: Blob) => {
			blob = b;
			return 'blob:desk';
		});
		URL.revokeObjectURL = vi.fn();
		const anchor = { href: '', download: '', click: vi.fn() };
		vi.stubGlobal('document', { createElement: vi.fn(() => anchor) });

		downloadDesk(file([dish()]), new Date(NOW));

		expect(anchor.download).toBe('menu-desk-2026-09-25.json');
		expect(anchor.href).toBe('blob:desk');
		expect(anchor.click).toHaveBeenCalledTimes(1);
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:desk');
		expect(blob).not.toBeNull();
		expect(blob!.type).toBe('application/json');
		const text = await blob!.text();
		// Two-space indented, so it is diffable and hand-editable.
		expect(text.startsWith('{\n  "format": "oot-menu-desk"')).toBe(true);
		expect(readDeskFile(text, NOW)).toEqual(file([dish()]));
	});
});

describe('toParsedDish, the adapter to the old shape', () => {
	it('returns exactly the seven pinned keys, whatever the kind', () => {
		for (const item of [dish(), wine(), cocktail(), unsure()]) {
			expect(Object.keys(toParsedDish(item)).sort()).toEqual([
				'confidence',
				'description',
				'name',
				'price',
				'raw',
				'section',
				'tags'
			]);
		}
	});

	it('a dish: its description, the printed price, the marks as tags', () => {
		expect(
			toParsedDish(dish({ description: 'Slow cooked stock', marks: ['gf'], price: { printed: '12', parts: [] } }))
		).toEqual({
			section: 'STARTERS',
			name: 'Soup',
			description: 'Slow cooked stock',
			price: '12',
			tags: ['gf'],
			confidence: 'high',
			raw: 'Soup 9'
		});
	});

	it('a cocktail: the prose when it had prose, else the parts joined', () => {
		expect(toParsedDish(cocktail()).description).toBe('trinity infused gin, benedictine, lime');
		expect(toParsedDish(cocktail({ description: 'Our take on the Sazerac', spec: [] })).description).toBe(
			'Our take on the Sazerac'
		);
	});

	it('a wine: the descriptor line, with the vintage in front only when it is printed nowhere else', () => {
		expect(toParsedDish(wine()).description).toBe('2010 Extra-Brut, Champagne, France');
		expect(toParsedDish(wine({ name: 'Ch. Margaux 2015', vintage: '2015', descriptors: 'Margaux, Bordeaux' })).description).toBe(
			'Margaux, Bordeaux'
		);
		expect(toParsedDish(wine({ vintage: '', descriptors: 'Chardonnay' })).description).toBe('Chardonnay');
		expect(toParsedDish(wine({ vintage: 'NV', descriptors: '' })).description).toBe('NV');
	});

	it('an unsure row: no description, still low, raw kept', () => {
		const p = toParsedDish(unsure({ raw: 'Kiss the Crab\nZacapa No. 23 Solera, dry vermouth' }));
		expect(p.description).toBe('');
		expect(p.confidence).toBe('low');
		expect(p.raw).toBe('Kiss the Crab\nZacapa No. 23 Solera, dry vermouth');
	});
});
