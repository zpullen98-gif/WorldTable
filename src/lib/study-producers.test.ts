/**
 * The study view's producer readers (study.ts producersFor, producerRows and
 * producersLine): kept profiles only, in the house's order, grouped Makers
 * and farms, Where it comes from, then At the bar (a producer behind a drink
 * and no dish), each with the items that use it by name: the dishes and
 * wines as the chips the Table's card opens, the drinks with their Ledger
 * address on the shared origin. The words they print are STUDY_WORDS',
 * walked for dashes by study.test.ts. Every producer here is invented for
 * the fixture's house.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { House, ProducerProfile } from './house/house-schema';
import { PRODUCER_TYPE_WORDS, STUDY_WORDS, atTheBar, producerRows, producersFor, producersLine, say } from './study';

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
			drinks: []
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

	it('keep a producer behind a dish and a drink in its food group, its drinks after the dish chips, and a wine alone in its type', () => {
		const h = house();
		h.components!.find((c) => c.id === 'c-boats001')!.itemIds = ['b-collins1', 'd-beetrt01'];
		h.components!.find((c) => c.id === 'c-house001')!.itemIds = ['w-lantern1'];
		const groups = producerRows(h, '/table');
		expect(groups.map((g) => [g.key, g.rows.map((r) => r.who)])).toEqual([
			['makers', ['Quay Salt Works', 'The Lantern kitchen']],
			['origins', ['Quay Boats']]
		]);
		const boats = groups[1].rows[0];
		expect(boats.chips.map((i) => i.name)).toEqual(['Beetroot and Apple Salad']);
		expect(boats.drinks).toEqual([{ id: 'b-collins1', name: 'The Lantern Collins', href: '/ledger/#drink=b-collins1' }]);
		expect(groups[0].rows[1].chips.map((i) => i.kind)).toEqual(['wine']);
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
