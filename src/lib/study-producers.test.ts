/**
 * The study view's producer readers (study.ts producersFor, producerRows and
 * producersLine): kept profiles only, in the house's order, grouped Makers
 * and farms, Where it comes from, At the bar (a producer behind a drink and
 * no dish), then In the cellar (one behind a wine and no dish or drink) by
 * region, each with the items that use it by name: the dishes as the chips
 * the Table's card opens, the drinks with their Ledger address and the
 * cellar's wines with their Codex address on the shared origin. And the
 * Table's own producers (tableProducerIds): the ones behind a dish. The
 * words they print are STUDY_WORDS', walked for dashes by study.test.ts.
 * Every producer and place here is invented for the fixture's house.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { House, ProducerProfile } from './house/house-schema';
import { PRODUCER_TYPE_WORDS, STUDY_WORDS, atTheBar, behindADish, inTheCellar, producerRows, producersFor, producersLine, regionHead, say, tableProducerIds } from './study';

const fixture: House = JSON.parse(readFileSync(fileURLToPath(new URL('./house/fixtures/house-min.json', import.meta.url)), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const TS = 1790672400000;

function profile(over: Partial<ProducerProfile> = {}): ProducerProfile {
	return {
		type: 'maker',
		who: 'Quay Salt Works',
		where: 'The Quay',
		founded: '1896',
		history: 'The salt works began on the quay.\n\nIt still packs the salt by hand.',
		facts: ['The salt is raked by hand.', ' '],
		notes: ['Say the name slowly.'],
		sayIt: 'The salt is from the Quay Salt Works.',
		askKitchen: ['Which week does the salt arrive?'],
		...over
	};
}

function house(): House {
	const h = clone(fixture);
	h.components![0].producer = { value: profile(), by: 'person', ts: TS };
	h.components!.push(
		{ id: 'c-boats001', kind: 'ingredient', name: 'Day boat fish', producer: { value: profile({ type: 'fishery', who: 'Quay Boats', where: 'The harbour', founded: '' }), by: 'person', ts: TS }, itemIds: ['d-beetrt01', 'd-chicken1', 'd-nowhere1'], termIds: [], ts: TS },
		{ id: 'c-hers0001', kind: 'ingredient', name: 'Apples', producer: { value: profile({ who: 'Orchard Farm' }), by: 'maitre', ts: TS }, itemIds: ['d-chicken1'], termIds: [], ts: TS },
		{ id: 'c-house001', kind: 'technique', name: 'The bread', producer: { value: profile({ type: 'house', who: 'The Lantern kitchen', where: '', founded: '', facts: [], notes: [], askKitchen: [] }), by: 'person', ts: TS }, itemIds: ['b-verjus01'], termIds: [], ts: TS }
	);
	return h;
}

describe('producersFor', () => {
	it("lists an item's kept producers in the house's order, each in full, and leaves out one nobody kept", () => {
		const rows = producersFor(house(), 'd-chicken1');
		expect(rows.map((r) => r.who)).toEqual(['Quay Salt Works', 'Quay Boats']);
		expect(rows[0]).toEqual({
			id: 'c-saltcrs1',
			supplies: 'Salt crust',
			suppliesShown: 'Salt crust',
			type: 'maker',
			typeLabel: 'Maker',
			who: 'Quay Salt Works',
			where: 'The Quay',
			founded: '1896',
			sayIt: 'The salt is from the Quay Salt Works.',
			facts: ['The salt is raked by hand.'],
			paragraphs: ['The salt works began on the quay.', 'It still packs the salt by hand.'],
			notes: ['Say the name slowly.'],
			askKitchen: ['Which week does the salt arrive?'],
			items: [{ id: 'd-chicken1', name: 'Lantern Roast Chicken', kind: 'dish' }],
			chips: [{ id: 'd-chicken1', name: 'Lantern Roast Chicken', kind: 'dish' }],
			drinks: [],
			wines: []
		});
		/* The items by name, an id the house lacks left out. */
		expect(rows[1].items.map((i) => i.name)).toEqual(['Beetroot and Apple Salad', 'Lantern Roast Chicken']);
		expect(producersFor(house(), 'b-collins1')).toEqual([]);
		expect(producersFor(fixture, 'd-chicken1')).toEqual([]);
	});

	it('leaves the supplies line empty when the who already says it', () => {
		const h = house();
		const salt = h.components!.find((c) => c.id === 'c-saltcrs1')!;
		salt.name = 'Quay Salt Works salt';
		expect(producersFor(h, 'd-chicken1')[0].suppliesShown).toBe('');
		salt.name = 'quay salt works';
		expect(producersFor(h, 'd-chicken1')[0].suppliesShown).toBe('');
		salt.name = 'Sea salt';
		expect(producersFor(h, 'd-chicken1')[0].suppliesShown).toBe('Sea salt');
	});
});

describe('the drinks a producer reaches', () => {
	it("split the items into the Table's chips and the drinks, each drink with its Ledger address on the shared origin only", () => {
		const h = house();
		h.components!.find((c) => c.id === 'c-saltcrs1')!.itemIds = ['b-collins1', 'd-chicken1', 'w-lantern1', 'b-verjus01'];
		const [salt] = producersFor(h, 'd-chicken1', '/table');
		expect(salt.items.map((i) => i.id)).toEqual(['b-collins1', 'd-chicken1', 'w-lantern1', 'b-verjus01']);
		expect(salt.chips).toEqual([
			{ id: 'd-chicken1', name: 'Lantern Roast Chicken', kind: 'dish' },
			{ id: 'w-lantern1', name: 'Quay Lane Harbour White 2024', kind: 'wine' }
		]);
		expect(salt.drinks).toEqual([
			{ id: 'b-collins1', name: 'The Lantern Collins', href: '/ledger/#drink=b-collins1' },
			{ id: 'b-verjus01', name: 'Verjus and Tonic', href: '/ledger/#drink=b-verjus01' }
		]);
		/* Off the shared origin (the standalone build) a drink is words: no address. */
		expect(producersFor(h, 'd-chicken1')[0].drinks.map((d) => d.href)).toEqual(['', '']);
		expect(producersFor(h, 'd-chicken1', '/elsewhere')[0].drinks.map((d) => d.href)).toEqual(['', '']);
	});

	it('put a producer At the bar when it reaches a drink and no dish, and leave a wine alone to its type', () => {
		expect(atTheBar({ items: [{ id: 'b-verjus01', name: 'Verjus and Tonic', kind: 'cocktail' }] })).toBe(true);
		expect(atTheBar({ items: [{ id: 'b-verjus01', name: 'Verjus and Tonic', kind: 'cocktail' }, { id: 'w-lantern1', name: 'White', kind: 'wine' }] })).toBe(true);
		expect(atTheBar({ items: [{ id: 'b-verjus01', name: 'Verjus and Tonic', kind: 'cocktail' }, { id: 'd-chicken1', name: 'Chicken', kind: 'dish' }] })).toBe(false);
		expect(atTheBar({ items: [{ id: 'w-lantern1', name: 'White', kind: 'wine' }] })).toBe(false);
		expect(atTheBar({ items: [] })).toBe(false);
	});
});

describe('producerRows and producersLine', () => {
	it('group the kept profiles Makers and farms, Where it comes from, then At the bar, a group with none left out', () => {
		const groups = producerRows(house());
		expect(groups.map((g) => [g.key, g.label, g.rows.map((r) => r.who)])).toEqual([
			['makers', 'Makers and farms', ['Quay Salt Works']],
			['origins', 'Where it comes from', ['Quay Boats']],
			['bar', 'At the bar', ['The Lantern kitchen']]
		]);
		/* At the bar whatever its type: the house's own, said as such. */
		expect(groups[2].rows[0].typeLabel).toBe('Made in house');
		expect(groups[2].rows[0].chips).toEqual([]);
		expect(groups[2].rows[0].drinks).toEqual([{ id: 'b-verjus01', name: 'Verjus and Tonic', href: '' }]);
		expect(producerRows(house(), '/table')[2].rows[0].drinks[0].href).toBe('/ledger/#drink=b-verjus01');
		const makersOnly = house();
		makersOnly.components = makersOnly.components!.filter((c) => c.id !== 'c-boats001');
		expect(producerRows(makersOnly).map((g) => g.key)).toEqual(['makers', 'bar']);
		expect(producerRows(fixture)).toEqual([]);
	});

	it('keep a producer behind a dish and a drink in its food group, its drinks after the dish chips, and a dish and a wine in its type', () => {
		const h = house();
		h.components!.find((c) => c.id === 'c-boats001')!.itemIds = ['b-collins1', 'd-beetrt01'];
		h.components!.find((c) => c.id === 'c-house001')!.itemIds = ['w-lantern1', 'd-chicken1'];
		const groups = producerRows(h, '/table');
		expect(groups.map((g) => [g.key, g.rows.map((r) => r.who)])).toEqual([
			['makers', ['Quay Salt Works', 'The Lantern kitchen']],
			['origins', ['Quay Boats']]
		]);
		const boats = groups[1].rows[0];
		expect(boats.chips.map((i) => i.name)).toEqual(['Beetroot and Apple Salad']);
		expect(boats.drinks).toEqual([{ id: 'b-collins1', name: 'The Lantern Collins', href: '/ledger/#drink=b-collins1' }]);
		/* Behind a dish, its wine stays a chip the Table's card opens, never a Codex link. */
		expect(groups[0].rows[1].chips.map((i) => i.kind)).toEqual(['wine', 'dish']);
		expect(groups[0].rows[1].wines).toEqual([]);
	});

	it('say how many producers stand behind how many items, singular when one, and nothing when none', () => {
		expect(producersLine(house())).toBe('3 producers behind 3 items on the menu');
		const one = clone(fixture);
		one.components![0].producer = { value: profile(), by: 'person', ts: TS };
		expect(producersLine(one)).toBe('1 producer behind 1 item on the menu');
		expect(producersLine(fixture)).toBe('');
	});

	it('name every type in words, and the words carry no dash', () => {
		for (const key of Object.values(PRODUCER_TYPE_WORDS)) expect(say(key)).toMatch(/^[A-Z]/);
		for (const k of ['whoMakes', 'flashProducers', 'allProducers', 'producers', 'askKitchen', 'askBar'] as const) expect(STUDY_WORDS[k]).not.toMatch(new RegExp('[\\u2013\\u2014]|\\s' + '--' + '\\s'));
		expect(STUDY_WORDS.whoMakes).toBe('Who makes it');
		/* the questions of a producer At the bar are the bar's, as the Ledger heads them (ProducerBody.svelte) */
		expect(STUDY_WORDS.askBar).toBe('Ask the bar');
		expect(STUDY_WORDS.askKitchen).toBe('Ask the kitchen');
	});
});

/* ---------------------------------------------------------------------------
 * In the cellar
 * ------------------------------------------------------------------------ */

/** A wine of the invented house, its name the producer's and its region as given. */
function wine(id: string, producer: string, region: string) {
	return { ...clone(fixture.wines[0]), id, name: producer + ' Cuvée 2020', producer, wine: 'Cuvée', vintage: '2020', region };
}

/** A component behind wines only, with a kept profile: a producer In the cellar. */
function cellarComp(id: string, who: string, itemIds: string[], over: Partial<ProducerProfile> = {}) {
	return {
		id,
		kind: 'ingredient' as const,
		name: who + ' wines',
		producer: { value: profile({ who, where: '', founded: '', askKitchen: ['Which vintage is open tonight?'], ...over }), by: 'person' as const, ts: TS },
		itemIds,
		termIds: [],
		ts: TS
	};
}

function cellarHouse(): House {
	const h = house();
	h.wines.push(
		wine('w-ridge001', 'Ridge Hill Estate', 'Upper Slope, Ridge Hill, Harbour Valley, Lanternland'),
		wine('w-ridge002', 'Ridge Hill Estate', 'Lower Slope, Harbour Valley, Lanternland'),
		wine('w-abbey001', 'Abbey Cellars', 'Abbey Rise, Harbour Valley, Lanternland'),
		wine('w-chalk001', 'Chalk Down', 'Chalk Coast, Lanternland'),
		wine('w-blank001', 'Nameless Vines', ''),
		wine('w-ec01ir01', 'Écluse Vineyards', 'Écluse, Chalk Coast, Lanternland')
	);
	h.components!.push(
		cellarComp('c-ridge001', 'Ridge Hill Estate', ['w-ridge001', 'w-ridge002']),
		cellarComp('c-chalk001', 'Chalk Down', ['w-chalk001'], { type: 'origin' }),
		cellarComp('c-abbey001', 'Abbey Cellars', ['w-abbey001']),
		cellarComp('c-blank001', 'Nameless Vines', ['w-blank001']),
		cellarComp('c-ecl00001', 'Écluse Vineyards', ['w-ec01ir01']),
		/* hers, never kept: left out of every group */
		{ ...cellarComp('c-hers0002', 'Unkept Estate', ['w-abbey001']), producer: { value: profile({ who: 'Unkept Estate' }), by: 'maitre', ts: TS } }
	);
	return h;
}

describe('In the cellar', () => {
	it('is a producer behind a wine and no dish or drink, whatever its type, and the Table drills only a producer behind a dish', () => {
		const w = { id: 'w-lantern1', name: 'White', kind: 'wine' as const };
		const d = { id: 'd-chicken1', name: 'Chicken', kind: 'dish' as const };
		const b = { id: 'b-verjus01', name: 'Verjus and Tonic', kind: 'cocktail' as const };
		expect(inTheCellar({ items: [w] })).toBe(true);
		expect(inTheCellar({ items: [w, d] })).toBe(false);
		expect(inTheCellar({ items: [w, b] })).toBe(false);
		expect(inTheCellar({ items: [d] })).toBe(false);
		expect(inTheCellar({ items: [] })).toBe(false);
		expect(behindADish({ items: [d] })).toBe(true);
		expect(behindADish({ items: [b, d] })).toBe(true);
		expect(behindADish({ items: [w, d] })).toBe(true);
		expect(behindADish({ items: [w] })).toBe(false);
		expect(behindADish({ items: [b] })).toBe(false);
		expect(behindADish({ items: [] })).toBe(false);
		/* Each producer belongs to one room: a row is never both At the bar and In the cellar. */
		for (const items of [[w], [b], [d], [w, b], [w, d], [b, d], [w, b, d]]) {
			expect([atTheBar({ items }), inTheCellar({ items }), behindADish({ items })].filter(Boolean).length).toBeLessThanOrEqual(1);
		}
	});

	it('heads a region by its last two places, and adds nothing the list does not print', () => {
		expect(regionHead('Meursault, Côte de Beaune, Burgundy, France')).toBe('Burgundy, France');
		expect(regionHead('Oakville, Napa Valley, California')).toBe('Napa Valley, California');
		expect(regionHead('Champagne, France')).toBe('Champagne, France');
		expect(regionHead('California')).toBe('California');
		expect(regionHead('')).toBe('');
		expect(regionHead(' , ')).toBe('');
	});

	it('heads one region under one name: another tongue, an appellation inside it, a place said twice, a direction passed over', () => {
		/* The Brennan's list prints these regions two ways; each pair stood under two headings. */
		expect(regionHead('Piemonte, Italy')).toBe(regionHead('Barolo, Piedmont, Italy'));
		expect(regionHead('Piemonte, Italy')).toBe('Piedmont, Italy');
		expect(regionHead('Val de Loire, France')).toBe('Loire Valley, France');
		expect(regionHead('Côtes de Provence, France')).toBe('Provence, France');
		expect(regionHead('Côtes de Provence, Provence, France')).toBe('Provence, France');
		expect(regionHead('Rías Baixas, Spain')).toBe('Galicia, Spain');
		expect(regionHead('Rías Baixas, Galicia, Spain')).toBe('Galicia, Spain');
		/* 'near Arles' says where, not which region: the place before it heads. */
		expect(regionHead('Camargue, near Arles, France')).toBe('Camargue, France');
		expect(regionHead(' near Arles ,  France ')).toBe('France');
		/* Nothing else is renamed. */
		expect(regionHead('Rhône Valley, France')).toBe('Rhône Valley, France');
		expect(regionHead('North Coast, California')).toBe('North Coast, California');
	});

	it("files a producer under the heading its own where names, its where's heading too when another wine prints it", () => {
		const h = cellarHouse();
		/* Ridge Hill Estate's first wine is Chalk Coast; its where names Harbour Valley, which its second wine prints */
		h.components!.find((c) => c.id === 'c-ridge001')!.itemIds = ['w-chalk001', 'w-ridge001'];
		(h.components!.find((c) => c.id === 'c-ridge001')!.producer!.value as ProducerProfile).where = 'Ridge Hill, Harbour Valley, Lanternland; and a second slope on the Chalk Coast';
		let cellar = producerRows(h).find((g) => g.key === 'cellar')!;
		expect(cellar.regions!.find((r) => r.label === 'Harbour Valley, Lanternland')!.rows.map((r) => r.who)).toContain('Ridge Hill Estate');
		/* after a semicolon a where says more than where the house is: Chalk Coast there decides nothing */
		/* a wine that prints only the broad region stands under the heading its where names, another wine printing it */
		h.wines.find((w) => w.id === 'w-abbey001')!.region = 'Lanternland';
		(h.components!.find((c) => c.id === 'c-abbey001')!.producer!.value as ProducerProfile).where = 'Abbey Rise, Chalk Coast, Lanternland';
		cellar = producerRows(h).find((g) => g.key === 'cellar')!;
		expect(cellar.regions!.find((r) => r.label === 'Chalk Coast, Lanternland')!.rows.map((r) => r.who)).toContain('Abbey Cellars');
		expect(cellar.regions!.some((r) => r.label === 'Lanternland')).toBe(false);
		/* a where's heading no wine prints is no heading: the wine's own stands */
		(h.components!.find((c) => c.id === 'c-abbey001')!.producer!.value as ProducerProfile).where = 'Abbey Rise, Misty Fen, Lanternland';
		cellar = producerRows(h).find((g) => g.key === 'cellar')!;
		expect(cellar.regions!.find((r) => r.label === 'Lanternland')!.rows.map((r) => r.who)).toEqual(['Abbey Cellars']);
	});

	it('says a wine estate and a wine house in the cellar as the cellar says them, never Farm or Made in house', () => {
		const h = cellarHouse();
		(h.components!.find((c) => c.id === 'c-abbey001')!.producer!.value as ProducerProfile).type = 'farm';
		(h.components!.find((c) => c.id === 'c-ridge001')!.producer!.value as ProducerProfile).type = 'house';
		const cellar = producerRows(h).find((g) => g.key === 'cellar')!;
		expect(cellar.rows.find((r) => r.who === 'Abbey Cellars')!.typeLabel).toBe('Estate');
		expect(cellar.rows.find((r) => r.who === 'Ridge Hill Estate')!.typeLabel).toBe('Wine house');
		/* the kitchen's suppliers keep their own words */
		expect(producerRows(house())[0].rows.every((r) => r.typeLabel !== 'Estate' && r.typeLabel !== 'Wine house')).toBe(true);
		expect(STUDY_WORDS.typeHouse).toBe('Made in house');
	});

	it('is the fourth group, by region in the order of the headings, each region by name, a region not given last', () => {
		const groups = producerRows(cellarHouse());
		expect(groups.map((g) => g.key)).toEqual(['makers', 'origins', 'bar', 'cellar']);
		const cellar = groups[3];
		expect(cellar.label).toBe('In the cellar');
		expect(STUDY_WORDS.producersInCellar).toBe('In the cellar');
		expect(cellar.regions!.map((r) => [r.key, r.label, r.rows.map((x) => x.who)])).toEqual([
			['chalk-coast-lanternland', 'Chalk Coast, Lanternland', ['Chalk Down', 'Écluse Vineyards']],
			['harbour-valley-lanternland', 'Harbour Valley, Lanternland', ['Abbey Cellars', 'Ridge Hill Estate']],
			['region-not-given', 'Region not given', ['Nameless Vines']]
		]);
		/* The group's rows are the regions' in the order they are drawn; hers, unkept, is in none. */
		expect(cellar.rows.map((r) => r.who)).toEqual(['Chalk Down', 'Écluse Vineyards', 'Abbey Cellars', 'Ridge Hill Estate', 'Nameless Vines']);
		expect(JSON.stringify(groups)).not.toContain('Unkept Estate');
		/* Only the cellar is drawn by region. */
		for (const g of groups.slice(0, 3)) expect(g.regions).toBeUndefined();
		/* The other groups are as they were. */
		expect(groups.slice(0, 3).map((g) => g.rows.map((r) => r.who))).toEqual([['Quay Salt Works'], ['Quay Boats'], ['The Lantern kitchen']]);
		/* A cellar of one region still draws its heading; a house with none draws no cellar. */
		const one = cellarHouse();
		one.components = one.components!.filter((c) => !['c-chalk001', 'c-blank001', 'c-ecl00001'].includes(c.id));
		expect(producerRows(one)[3].regions!.map((r) => r.label)).toEqual(['Harbour Valley, Lanternland']);
		expect(producerRows(house()).map((g) => g.key)).not.toContain('cellar');
	});

	it('files a producer under the first of its wines whose region is printed', () => {
		const h = cellarHouse();
		h.components!.find((c) => c.id === 'c-ridge001')!.itemIds = ['w-blank001', 'w-chalk001', 'w-ridge001'];
		const cellar = producerRows(h).find((g) => g.key === 'cellar')!;
		expect(cellar.regions!.find((r) => r.label === 'Chalk Coast, Lanternland')!.rows.map((r) => r.who)).toEqual(['Chalk Down', 'Écluse Vineyards', 'Ridge Hill Estate']);
	});

	it("lists a cellar producer's wines with their Codex card address on the shared origin, words off it, and no chip for the Table's card", () => {
		const onSite = producerRows(cellarHouse(), '/table').find((g) => g.key === 'cellar')!;
		const ridge = onSite.rows.find((r) => r.who === 'Ridge Hill Estate')!;
		expect(ridge.chips).toEqual([]);
		expect(ridge.drinks).toEqual([]);
		expect(ridge.wines).toEqual([
			{ id: 'w-ridge001', name: 'Ridge Hill Estate Cuvée 2020', href: '/codex/#wine=w-ridge001' },
			{ id: 'w-ridge002', name: 'Ridge Hill Estate Cuvée 2020', href: '/codex/#wine=w-ridge002' }
		]);
		/* Every cellar wine's address is the Codex card's, the room's own #wine= door. */
		for (const r of onSite.rows) for (const w of r.wines) expect(w.href).toBe(`/codex/#wine=${w.id}`);
		/* Off the shared origin (the standalone build, or another base) a wine is words. */
		for (const base of ['', '/elsewhere']) {
			const off = producerRows(cellarHouse(), base).find((g) => g.key === 'cellar')!;
			expect(off.rows.flatMap((r) => r.wines.map((w) => w.href)).every((x) => x === '')).toBe(true);
		}
		/* On a card, the wine's own producer reads the same way. */
		expect(producersFor(cellarHouse(), 'w-chalk001', '/table')[0].wines).toEqual([{ id: 'w-chalk001', name: 'Chalk Down Cuvée 2020', href: '/codex/#wine=w-chalk001' }]);
		expect(producersFor(cellarHouse(), 'w-chalk001', '/table')[0].typeLabel).toBe('Origin');
	});

	it("names the cellar's words without a dash", () => {
		const DASH = new RegExp('[\\u2013\\u2014]|\\s' + '--' + '\\s');
		for (const k of ['producersInCellar', 'onTheList', 'askSommelier', 'producersJump', 'cellarRegions', 'regionNotGiven', 'flashAllProducers', 'quizProducers'] as const) expect(STUDY_WORDS[k]).not.toMatch(DASH);
		expect(say('cellarRegions', { n: 3 })).toBe('Jump to a region (3)');
		expect(STUDY_WORDS.askSommelier).toBe('Ask the sommelier');
		/* The Table's deck and quiz deal the producers behind the dishes, and the links say so. */
		expect(STUDY_WORDS.flashAllProducers).toBe('Flash the producers behind the dishes');
		expect(STUDY_WORDS.quizProducers).toBe('Quiz the producers behind the dishes');
	});
});

describe('tableProducerIds', () => {
	it("is every kept producer behind a dish, in the house's order: never one At the bar, In the cellar, unkept or behind nothing", () => {
		const h = cellarHouse();
		/* the salt crust behind the chicken and the Collins: behind a dish, so the Table's */
		h.components!.find((c) => c.id === 'c-saltcrs1')!.itemIds = ['b-collins1', 'd-chicken1'];
		h.components!.push({ ...cellarComp('c-nowhere1', 'Idle Mill', ['d-nowhere1']) });
		expect([...tableProducerIds(h)]).toEqual(['c-saltcrs1', 'c-boats001']);
		expect([...tableProducerIds(fixture)]).toEqual([]);
	});
});
