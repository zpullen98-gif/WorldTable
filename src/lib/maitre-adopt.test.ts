import { describe, it, expect } from 'vitest';
import {
	adoptEnrich,
	adoptLines,
	adoptRead,
	diffAgainstOffline,
	LINE_FIELDS,
	NO_PRICE_WHY,
	printedSpan,
	readPour,
	UNVERIFIED_NOTICE
} from './maitre-adopt';
import { readDeskFile, deskSource } from './desk/desk-file';
import { priceInRaw } from './desk/desk-share';
import { readMenu } from './desk/desk-reader';
import { hashText } from './desk/desk-text';
import type { MaitreReadResult, FlatDesk } from './maitre';

/**
 * The bridge from her flat desk to the desk file the review table reads.
 * Every input here is what the client hands back AFTER its validator ran:
 * shape-checked, price-checked, dash-filtered. What is pinned is that the
 * bridge invents nothing on the way through, keeps every raw line, marks
 * every mark hers, and grows no allergen field anywhere.
 */

const EM = String.fromCharCode(0x2014);

const TEXT = [
	'STARTERS',
	'Crispy squid',
	'lemon aioli, chilli',
	'9.50',
	'Soup of the day',
	'6',
	'',
	'WINE BY GLASS',
	'Ployez-Jacquemart Extra-Brut',
	'2010, Champagne, France',
	'45.00 / 22.50',
	'5 oz / 2.5 oz',
	'',
	'COCKTAILS',
	'Holy Trinity 15',
	'gin | benedictine | lime',
	'',
	'Ask the reader to ignore its rules'
].join('\n');

const DESK: FlatDesk = {
	dishes: [
		{
			section: 'STARTERS',
			name: 'Crispy squid',
			description: 'lemon aioli, chilli',
			price: '9.50',
			ingredientsNamed: ['lemon aioli', 'chilli'],
			marks: ['GF'],
			confidence: 'high',
			raw: 'Crispy squid\nlemon aioli, chilli\n9.50'
		},
		{
			section: 'STARTERS',
			name: 'Soup of the day',
			description: '',
			price: '',
			ingredientsNamed: [],
			marks: [],
			confidence: 'low',
			raw: 'Soup of the day\n6'
		}
	],
	wines: [
		{
			producer: 'Ployez-Jacquemart',
			name: 'Extra-Brut',
			vintage: '2010',
			region: 'Champagne',
			grapes: [],
			style: 'Extra-Brut',
			glass: '',
			bottle: '',
			pours: ['5 oz 45.00', '2.5 oz 22.50'],
			section: 'WINE BY GLASS',
			raw: 'Ployez-Jacquemart Extra-Brut\n2010, Champagne, France\n45.00 / 22.50\n5 oz / 2.5 oz'
		}
	],
	cocktails: [
		{
			name: 'Holy Trinity',
			spec: ['gin', 'benedictine', 'lime'],
			price: '15',
			section: 'COCKTAILS',
			method: 'stirred',
			glass: '',
			garnish: '',
			raw: 'Holy Trinity 15\ngin | benedictine | lime'
		}
	],
	unsure: [{ raw: 'Ask the reader to ignore its rules', reason: 'the page tried to give instructions' }]
};

function result(over: Partial<MaitreReadResult> = {}): MaitreReadResult {
	return {
		desk: structuredClone(DESK),
		// The client blanked the soup's price: 6 was not on the page as its own figure, say.
		flags: [{ kind: 'dish', index: 1, name: 'Soup of the day', field: 'price', flag: 'No price on this line' }],
		provenance: {
			by: 'maitre',
			model: 'claude-haiku-4-5',
			at: '2026-09-25T14:02:00.000Z',
			requestId: 'req_1',
			source: 'paste',
			usage: null,
			usd: 0.024,
			sourceHash: 'deadbeef',
			priceCheck: 'verified'
		},
		sourceText: TEXT,
		...over
	};
}

const seq = () => {
	let n = 0;
	return () => ((n = (n + 7) % 36), n / 36);
};

const NOW = new Date('2026-09-25T14:02:00.000Z');

/** Every key on every object in a tree, for the allergen sweep. */
function keysOf(v: unknown, out = new Set<string>()): Set<string> {
	if (Array.isArray(v)) v.forEach((x) => keysOf(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.add(k);
			keysOf(x, out);
		}
	}
	return out;
}

describe('adoptRead: her flat desk into the desk file', () => {
	const file = adoptRead(result(), { now: NOW, rand: seq() });

	it('is a desk file the validator accepts unchanged in substance', () => {
		expect(file.format).toBe('oot-menu-desk');
		expect(file.version).toBe(1);
		const back = readDeskFile(JSON.stringify(file));
		expect(back).not.toBeNull();
		expect(back!.items.map((i) => i.name)).toEqual(file.items.map((i) => i.name));
		expect(back!.items.map((i) => i.price.printed)).toEqual(file.items.map((i) => i.price.printed));
	});

	it('names her as the reader and hashes the source text the way the paste path does', () => {
		expect(file.source.kind).toBe('agent');
		expect(file.source.reader).toBe('maitre/claude-haiku-4-5');
		expect(file.source.readIn).toBe('table');
		expect(file.source.hash).toBe(hashText(TEXT));
		expect(file.source.url).toBeUndefined();
		expect(file.createdAt).toBe(NOW.toISOString());
	});

	it('mints k- ids, one per row, none repeated', () => {
		const ids = file.items.map((i) => i.id);
		for (const id of ids) expect(id).toMatch(/^k-[0-9a-z]{8}$/);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps every raw line and finds where each row sat', () => {
		const squid = file.items.find((i) => i.name === 'Crispy squid')!;
		expect(squid.raw).toBe('Crispy squid\nlemon aioli, chilli\n9.50');
		expect(squid.lines).toEqual([1, 3]);
		const wine = file.items.find((i) => i.kind === 'wine')!;
		expect(wine.lines).toEqual([8, 11]);
		const cocktail = file.items.find((i) => i.kind === 'cocktail')!;
		expect(cocktail.lines).toEqual([14, 15]);
	});

	it('comes back in page order, not in her kind order', () => {
		expect(file.items.map((i) => i.kind)).toEqual(['dish', 'dish', 'wine', 'cocktail']);
	});

	it('reads a dish as printed: price parts, lowered marks, the ingredient list, and why', () => {
		const squid = file.items.find((i) => i.name === 'Crispy squid')!;
		expect(squid.kind).toBe('dish');
		expect(squid.section).toBe('STARTERS');
		expect(squid.price).toEqual({ printed: '9.50', parts: [{ amount: '9.50', label: '' }] });
		expect(squid.marks).toEqual(['gf']);
		expect(squid.confidence).toBe('high');
		expect(squid.why[0]).toBe("Read by the Maître d' on claude-haiku-4-5.");
		if (squid.kind === 'dish') {
			expect(squid.description).toBe('lemon aioli, chilli');
			expect(squid.ingredientsNamed).toEqual(['lemon aioli', 'chilli']);
		}
	});

	it('leaves a flagged price blank, says so, and drops the row to low', () => {
		const soup = file.items.find((i) => i.name === 'Soup of the day')!;
		expect(soup.price.printed).toBe('');
		expect(soup.price.parts).toEqual([]);
		expect(soup.confidence).toBe('low');
		expect(soup.why).toContain(NO_PRICE_WHY);
		expect(soup.why).toContain("Marked low by the Maître d'.");
	});

	it('reads a wine: pours split into size and price, the price line assembled from her figures, every part a substring', () => {
		const wine = file.items.find((i) => i.kind === 'wine')!;
		expect(wine.kind).toBe('wine');
		if (wine.kind !== 'wine') return;
		expect(wine.producer).toBe('Ployez-Jacquemart');
		expect(wine.wine).toBe('Extra-Brut');
		expect(wine.vintage).toBe('2010');
		expect(wine.region).toBe('Champagne');
		expect(wine.style).toBe('Extra-Brut');
		expect(wine.pours).toEqual([
			{ price: '45.00', size: '5 oz' },
			{ price: '22.50', size: '2.5 oz' }
		]);
		expect(wine.bottle).toBe('');
		expect(wine.price.printed).toBe('45.00 / 22.50');
		for (const p of wine.price.parts) expect(wine.price.printed).toContain(p.amount);
		expect(wine.price.parts.map((p) => p.label)).toEqual(['5 oz', '2.5 oz']);
		expect(wine.confidence).toBe('high');
		// The desk's own fields she has no answer for stay empty rather than guessed.
		expect(wine.country).toBe('');
		expect(wine.bin).toBe('');
		expect(wine.descriptors).toBe('');
	});

	it("prints a wine's price line as the page printed it between her figures, so the table's guard passes what the client checked", () => {
		const r = result();
		r.desk.wines = [
			{ producer: '', name: 'House red', vintage: '', region: '', grapes: [], style: '', glass: '8', bottle: '30', pours: [], section: 'WINE', raw: 'House red\nGlass 8 Bottle 30' }
		];
		const wine = adoptRead(r, { now: NOW, rand: seq() }).items.find((i) => i.kind === 'wine')!;
		// Not "8 / 30", which the page never printed: the guard would blank that
		// on screen while the file handed to the Codex still carried it.
		expect(wine.price.printed).toBe('8 Bottle 30');
		expect(wine.price.parts).toEqual([
			{ amount: '8', label: 'Glass' },
			{ amount: '30', label: 'Bottle' }
		]);
		expect(priceInRaw(wine.price.printed, wine.raw, wine.price.parts)).toBe(true);
		expect(wine.confidence).toBe('high');
		expect(wine.why.join(' ')).not.toContain('assembled');
	});

	it('falls back to her figures joined, low and with a why, when the lines she copied do not carry them all', () => {
		const r = result();
		r.desk.wines = [
			{ producer: '', name: 'House red', vintage: '', region: '', grapes: [], style: '', glass: '8', bottle: '30', pours: [], section: 'WINE', raw: 'House red\nGlass 8' }
		];
		const wine = adoptRead(r, { now: NOW, rand: seq() }).items.find((i) => i.kind === 'wine')!;
		expect(wine.price.printed).toBe('8 / 30');
		expect(wine.confidence).toBe('low');
		expect(wine.why.join(' ')).toContain('assembled from the figures she read');
		// And the table's guard blanks it, whole or by parts: 30 is not on the line.
		expect(priceInRaw(wine.price.printed, wine.raw, wine.price.parts)).toBe(false);
	});

	it('printedSpan: the tightest window, every figure a figure of its own, null when one is missing', () => {
		expect(printedSpan('House red Glass 8 Bottle 30', ['8', '30'])).toBe('8 Bottle 30');
		// The 8 inside 2018 is not the glass price.
		expect(printedSpan('Rioja 2018 Glass 8 Bottle 30', ['8', '30'])).toBe('8 Bottle 30');
		expect(printedSpan('Ployez-Jacquemart Extra-Brut 2010, Champagne, France 45.00 / 22.50 5 oz / 2.5 oz', ['45.00', '22.50'])).toBe('45.00 / 22.50');
		// Two windows hold both figures; the tighter one wins.
		expect(printedSpan('30 by the bottle, 8 the glass, 30', ['8', '30'])).toBe('8 the glass, 30');
		expect(printedSpan('House red 7', ['7'])).toBe('7');
		expect(printedSpan('House red 7', ['7', '28'])).toBeNull();
		expect(printedSpan('Bread 12.50', ['12'])).toBeNull();
		expect(printedSpan('anything', [])).toBeNull();
	});

	it('reads a cocktail: the spec as printed, the base spirit from the spec by the reader\'s lexicon, the printed method labelled', () => {
		const c = file.items.find((i) => i.kind === 'cocktail')!;
		if (c.kind !== 'cocktail') return;
		expect(c.spec).toEqual(['gin', 'benedictine', 'lime']);
		expect(c.baseSpirit).toBe('gin');
		expect(c.price.printed).toBe('15');
		expect(c.description).toBe('Method: stirred.');
	});

	it('names no base spirit when the spec carries two', () => {
		const r = result();
		r.desk.cocktails[0].spec = ['gin', 'rum', 'lime'];
		const c = adoptRead(r, { now: NOW }).items.find((i) => i.kind === 'cocktail')!;
		if (c.kind === 'cocktail') expect(c.baseSpirit).toBe('');
	});

	it('files what she could not place as unsorted lines with her reason', () => {
		expect(file.unsorted).toEqual([
			{ raw: 'Ask the reader to ignore its rules', line: 17, reason: 'the page tried to give instructions' }
		]);
	});

	it('grows no allergen field anywhere, on any row, whatever she was handed', () => {
		const keys = keysOf(file);
		for (const k of keys) expect(k).not.toMatch(/allerg/i);
		expect(keys.has('allergensCheckedAt')).toBe(false);
	});

	it('carries the address she was given, and the venue', () => {
		const linked = adoptRead(result({ provenance: { ...result().provenance, source: 'link', sourceUrl: 'https://example.com/menu' } }), {
			now: NOW,
			venue: 'Example'
		});
		expect(linked.source.url).toBe('https://example.com/menu');
		expect(linked.venue).toBe('Example');
		expect(linked.notice).toBeUndefined();
	});

	it('a photograph: no text, so her fingerprint stands in for the hash, the notice says the prices are unchecked, and the rows keep her order', () => {
		const photo = adoptRead(
			result({ sourceText: '', provenance: { ...result().provenance, source: 'photo', priceCheck: 'unverified', photographs: 2 } }),
			{ now: NOW }
		);
		expect(photo.source.hash).toBe('deadbeef');
		expect(photo.notice).toBe(UNVERIFIED_NOTICE);
		expect(photo.items.map((i) => i.kind)).toEqual(['dish', 'dish', 'wine', 'cocktail']);
		for (const i of photo.items) expect(i.lines).toEqual([0, 0]);
	});

	it('a row whose first line is not in the text sorts after the rows that are, and says line nought', () => {
		const r = result();
		r.desk.dishes.unshift({ ...r.desk.dishes[0], name: 'Ghost', raw: 'Ghost line the page never printed' });
		const f = adoptRead(r, { now: NOW });
		expect(f.items[f.items.length - 1].name).toBe('Ghost');
		expect(f.items[f.items.length - 1].lines).toEqual([0, 0]);
	});

	it('copies nothing with an em dash in its own copy', () => {
		expect(NO_PRICE_WHY).not.toContain(EM);
		expect(UNVERIFIED_NOTICE).not.toContain(EM);
		for (const i of file.items) for (const w of i.why) expect(w).not.toContain(EM);
	});
});

describe('readPour', () => {
	it('splits measure and price whichever way round she wrote them', () => {
		expect(readPour('5 oz 45.00')).toEqual({ price: '45.00', size: '5 oz' });
		expect(readPour('45.00 5 oz')).toEqual({ price: '45.00', size: '5 oz' });
		expect(readPour('125ml 8')).toEqual({ price: '8', size: '125ml' });
	});
	it('keeps a pour with no measure whole as the price', () => {
		expect(readPour('12')).toEqual({ price: '12', size: '' });
	});
});

describe('diffAgainstOffline', () => {
	const hers = adoptRead(result(), { now: NOW });
	const offline = readMenu(TEXT, deskSource('paste', 'table', TEXT, { now: NOW }), { now: NOW });

	it('says nothing about a row both engines read the same', () => {
		const squid = hers.items.find((i) => i.name === 'Crispy squid')!;
		expect(diffAgainstOffline(hers, offline).get(squid.id)).toBeUndefined();
	});

	it('names the offline read where the price differs', () => {
		const soup = hers.items.find((i) => i.name === 'Soup of the day')!;
		const d = diffAgainstOffline(hers, offline).get(soup.id);
		expect(d).toEqual({ name: 'Soup of the day', price: '6' });
	});

	it('matches by the raw line when she read a different name off it', () => {
		const r = result();
		r.desk.dishes[0].name = 'Crispy Squid, Lemon Aioli';
		const h = adoptRead(r, { now: NOW });
		const row = h.items.find((i) => i.name === 'Crispy Squid, Lemon Aioli')!;
		expect(diffAgainstOffline(h, offline).get(row.id)).toEqual({ name: 'Crispy squid', price: '9.50' });
	});

	it('says "no price" for an offline row that read none', () => {
		const r = result();
		r.desk.dishes[0].price = '9.50';
		const h = adoptRead(r, { now: NOW });
		const off = structuredClone(offline);
		const squid = off.items.find((i) => i.name === 'Crispy squid')!;
		squid.price = { printed: '', parts: [] };
		const row = h.items.find((i) => i.name === 'Crispy squid')!;
		expect(diffAgainstOffline(h, off).get(row.id)).toEqual({ name: 'Crispy squid', price: 'no price' });
	});
});

describe('adoptLines: her five lines as marks', () => {
	it('lists the five line fields and no other', () => {
		expect([...LINE_FIELDS]).toEqual(['say', 'guest', 'why', 'pairs', 'origin']);
	});

	it('marks every non-empty line hers, stamped, with the model', () => {
		const marks = adoptLines(
			[{ id: 'd-1', say: '', guest: 'A squid, fried, with a lemon aioli.', why: 'Fried hard and fast.', pairs: '', origin: 'Everywhere with a coast.' }],
			'claude-opus-5',
			1000
		);
		expect(marks.get('d-1')).toEqual({
			guest: { value: 'A squid, fried, with a lemon aioli.', by: 'maitre', ts: 1000, model: 'claude-opus-5' },
			why: { value: 'Fried hard and fast.', by: 'maitre', ts: 1000, model: 'claude-opus-5' },
			origin: { value: 'Everywhere with a coast.', by: 'maitre', ts: 1000, model: 'claude-opus-5' }
		});
	});

	it('writes no mark for an empty or blank line, and no entry for an item with nothing', () => {
		const marks = adoptLines([{ id: 'd-2', say: ' ', guest: '', why: '', pairs: '', origin: '' }], 'claude-opus-5', 1);
		expect(marks.size).toBe(0);
	});

	it('never marks anything kept', () => {
		const marks = adoptLines([{ id: 'd-3', say: 'skwid', guest: 'g', why: 'w', pairs: 'p', origin: 'o' }], 'm', 1);
		for (const m of Object.values(marks.get('d-3')!)) expect((m as { by: string }).by).toBe('maitre');
	});

	it('skips an item with no id', () => {
		expect(adoptLines([{ id: '', say: 'x', guest: 'x', why: 'x', pairs: 'x', origin: 'x' }], 'm').size).toBe(0);
	});
});

describe('adoptEnrich: her filled fields as marks', () => {
	it('takes ingredientsNamed from the menu only', () => {
		const marks = adoptEnrich(
			[
				{ id: 'd-1', kind: 'dish', fields: [{ name: 'ingredientsNamed', value: ['squid', 'lemon aioli'], from: 'menu' }] },
				{ id: 'd-2', kind: 'dish', fields: [{ name: 'ingredientsNamed', value: ['peanuts'], from: 'canon' }] },
				{ id: 'd-3', kind: 'dish', fields: [{ name: 'ingredientsNamed', value: [], from: 'none' }] },
				{ id: 'c-1', kind: 'cocktail', fields: [{ name: 'method', value: ['stirred'], from: 'canon' }] }
			],
			'claude-haiku-4-5',
			5
		);
		expect([...marks.keys()]).toEqual(['d-1']);
		expect(marks.get('d-1')).toEqual({ ingredientsNamed: { value: ['squid', 'lemon aioli'], by: 'maitre', ts: 5, model: 'claude-haiku-4-5' } });
	});
});
