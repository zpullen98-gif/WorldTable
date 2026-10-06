/**
 * The producers on the House's components: who makes, grows or catches what
 * an item is made of, one profile per component as a mark. Optional
 * everywhere, so an older pack and a wing that never heard of it read
 * unchanged; normalised to its keys, merged as one mark, held by the
 * validator to its type, its who, its caps and the house wide rules (the
 * dash, the key sweep, her allergen talk), carried byte for byte through the
 * pack, dealt as up to three flash cards and as the three producer drills.
 * Every producer here is invented for the fixture's invented house.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KEYS, MARK_FIELDS, PRODUCER_GROUPS, PRODUCER_MAX, PRODUCER_TYPES, PRODUCER_WORDS } from './house-schema';
import type { House, Mark, ProducerProfile } from './house-schema';
import { FORBIDDEN_KEY, markKind, normaliseHouse, normaliseMark } from './house-normalise';
import { validateHouse } from './house-validate';
import { mergeHouse, sameJson } from './house-merge';
import { buildPack, readPack, refreshEdition } from './house-pack';
import { buildFlashcards, dealQuestion, drillableCounts, readyKinds, shortWho, PRODUCER_KINDS } from './house-drills';

const fixture: House = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/house-min.json', import.meta.url)), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const NOW = 1790800000000;
const TS = fixture.components![0].explain!.ts;
const EM = String.fromCharCode(0x2014);

function seeded(seed = 1): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const words = (n: number) => Array.from({ length: n }, (_, i) => 'word' + i).join(' ');

function profile(over: Partial<ProducerProfile> = {}): ProducerProfile {
	return {
		type: 'maker',
		who: 'Quay Salt Works',
		where: 'The Quay',
		founded: '1896',
		history: 'The salt works began on the quay.\n\nIt still packs the salt for the crust by hand.',
		facts: ['It is the oldest firm on the quay.', 'The salt is raked by hand.'],
		notes: ['Say the name slowly; guests ask where the quay is.'],
		sayIt: 'The salt for the crust comes from the Quay Salt Works, down the lane.',
		askKitchen: ['Which week does the salt arrive?'],
		...over
	};
}
const kept = <T>(value: T, ts = TS): Mark<T> => ({ value, by: 'person', ts });
const hers = <T>(value: T, ts = TS): Mark<T> => ({ value, by: 'maitre', ts });

/** The fixture with a producer on its salt crust and a second component carrying one on the beetroot salad. */
function withProducers(): House {
	const h = clone(fixture);
	h.components![0].producer = kept(profile());
	h.components!.push({ id: 'c-orchard1', kind: 'ingredient', name: 'Apples', producer: kept(profile({ type: 'farm', who: 'Orchard Farm', where: 'The Valley', founded: '1920s', facts: ['The apples are picked in October.'] })), itemIds: ['d-beetrt01'], termIds: [], ts: TS });
	/* Through the normaliser once, so every key sits where the schema puts it. */
	return normaliseHouse(h, { rand: seeded() }).house;
}

describe('the constants and the keys', () => {
	it('name five types in two groups, the caps, the mark field and no key the client refuses', () => {
		expect([...PRODUCER_TYPES]).toEqual(['maker', 'farm', 'fishery', 'origin', 'house']);
		expect(PRODUCER_GROUPS.map((g) => [g.label, [...g.types]])).toEqual([
			['Makers and farms', ['maker', 'farm', 'house']],
			['Where it comes from', ['fishery', 'origin']]
		]);
		expect(PRODUCER_GROUPS.flatMap((g) => g.types).sort()).toEqual([...PRODUCER_TYPES].sort());
		expect(PRODUCER_WORDS).toEqual({ history: 300, fact: 35, note: 60, sayIt: 30 });
		expect(PRODUCER_MAX).toEqual({ facts: 12, notes: 8, askKitchen: 6 });
		expect(MARK_FIELDS.components).toContain('producer');
		expect(markKind('producer')).toBe('producer');
		expect([...KEYS.ProducerProfile]).toEqual(['type', 'who', 'where', 'founded', 'history', 'facts', 'notes', 'sayIt', 'askKitchen']);
		for (const k of [...KEYS.ProducerProfile, 'producer']) expect(k).not.toMatch(FORBIDDEN_KEY);
	});
});

describe('the normaliser', () => {
	it('keeps a profile byte for byte, and a house without one keeps its keys', () => {
		const h = withProducers();
		expect(sameJson(normaliseHouse(clone(h), { rand: seeded() }).house, h)).toBe(true);
		const plain = normaliseHouse(clone(fixture), { rand: seeded() }).house;
		for (const c of plain.components!) expect('producer' in c).toBe(false);
	});

	it('rebuilds a profile from its keys: a stray key dropped, a blank list item dropped, a number made text, a type carried for the validator', () => {
		const m = normaliseMark({ value: { ...profile({ type: 'brand' as ProducerProfile['type'] }), founded: 1896, facts: ['One.', '', '  ', 7], stray: 'x' }, by: 'person', ts: 1 }, 'producer') as Mark<ProducerProfile>;
		expect(Object.keys(m.value)).toEqual([...KEYS.ProducerProfile]);
		expect(m.value.type).toBe('brand');
		expect(m.value.founded).toBe('1896');
		expect(m.value.facts).toEqual(['One.']);
		expect('stray' in m.value).toBe(false);
	});

	it('drops a profile with nothing but a type in it, and a value that is not a record', () => {
		expect(normaliseMark({ value: { type: 'maker', who: ' ', facts: [] }, by: 'person', ts: 1 }, 'producer')).toBeUndefined();
		expect(normaliseMark({ value: 'Quay Salt Works', by: 'person', ts: 1 }, 'producer')).toBeUndefined();
		expect(normaliseMark({ value: ['a'], by: 'person', ts: 1 }, 'producer')).toBeUndefined();
	});

	it('sweeps a key the client refuses from inside a profile', () => {
		const h = withProducers();
		(h.components![0].producer!.value as unknown as Record<string, unknown>).allergens = 'x';
		const { house } = normaliseHouse(h, { rand: seeded() });
		expect('allergens' in (house.components![0].producer!.value as unknown as Record<string, unknown>)).toBe(false);
	});
});

describe('the validator', () => {
	it('finds nothing in a well made profile', () => {
		expect(validateHouse(withProducers()).fatalCount).toBe(0);
	});

	it('names a type outside the five and a profile with no who, each fatal', () => {
		const h = withProducers();
		h.components![0].producer = kept(profile({ type: 'brand' as ProducerProfile['type'], who: '' }));
		const out = validateHouse(h).problems.filter((p) => p.path.indexOf('producer') >= 0);
		expect(out.map((p) => [p.path, p.code, p.fatal])).toEqual([
			['house.components[0].producer.value.type', 'component', true],
			['house.components[0].producer.value.who', 'component', true]
		]);
	});

	it('holds the history, each fact, each note and the line to say to their word caps, and the lists to their counts', () => {
		const h = withProducers();
		h.components![0].producer = kept(
			profile({
				history: words(PRODUCER_WORDS.history + 1),
				facts: [...Array(PRODUCER_MAX.facts).fill('A fact.'), words(PRODUCER_WORDS.fact + 1)],
				notes: [words(PRODUCER_WORDS.note + 1)],
				sayIt: words(PRODUCER_WORDS.sayIt + 1),
				askKitchen: Array(PRODUCER_MAX.askKitchen + 1).fill('Which day?')
			})
		);
		const out = validateHouse(h).problems.filter((p) => p.path.indexOf('producer') >= 0).map((p) => p.code + ' ' + p.path.replace('house.components[0].producer.value.', ''));
		expect(out).toEqual([
			'word-cap history',
			'word-cap sayIt',
			'word-cap facts[12]',
			'component facts',
			'word-cap notes[0]',
			'component askKitchen'
		]);
		/* At the caps exactly, nothing. */
		h.components![0].producer = kept(profile({ history: words(PRODUCER_WORDS.history), facts: Array(PRODUCER_MAX.facts).fill(words(PRODUCER_WORDS.fact)), notes: Array(PRODUCER_MAX.notes).fill(words(PRODUCER_WORDS.note)), sayIt: words(PRODUCER_WORDS.sayIt), askKitchen: Array(PRODUCER_MAX.askKitchen).fill('Which day?') }));
		expect(validateHouse(h).problems.filter((p) => p.path.indexOf('producer') >= 0)).toEqual([]);
	});

	it('refuses a dash anywhere in a profile, and her allergen talk the way it refuses it in any line of hers', () => {
		const h = withProducers();
		h.components![0].producer = hers(profile({ facts: ['The salt ' + EM + ' raked by hand.'], notes: ['Ask about allergens before you order.'] }));
		const out = validateHouse(h).problems.filter((p) => p.path.indexOf('producer') >= 0);
		expect(out.some((p) => p.code === 'dash' && p.path.endsWith('facts[0]') && p.fatal)).toBe(true);
		expect(out.some((p) => p.code === 'allergen-talk' && p.path.endsWith('notes[0]') && p.fatal)).toBe(true);
		/* Kept, her words are a person's and the allergen rule reads only hers, as everywhere else. */
		h.components![0].producer = kept(profile({ notes: ['Ask about allergens before you order.'] }));
		expect(validateHouse(h).problems.filter((p) => p.code === 'allergen-talk')).toEqual([]);
	});
});

describe('the merge', () => {
	it('settles the producer as one mark: a person\'s profile beats her newer one, and a newer kept one wins whole', () => {
		const mine = withProducers();
		const theirs = withProducers();
		theirs.components![0].producer = hers(profile({ sayIt: 'Hers, newer.' }), TS + 9);
		expect(mergeHouse(clone(mine), clone(theirs)).house.components![0].producer!.value.sayIt).toBe(profile().sayIt);
		theirs.components![0].producer = kept(profile({ sayIt: 'A newer kept line.', facts: [] }), TS + 9);
		const won = mergeHouse(clone(mine), clone(theirs)).house.components![0].producer!;
		expect(won.value.sayIt).toBe('A newer kept line.');
		expect(won.value.facts).toEqual([]);
	});

	it('brings a profile to a device whose component had none, and leaves a component neither side profiled without the key', () => {
		const mine = clone(fixture);
		const theirs = withProducers();
		const { house } = mergeHouse(mine, theirs);
		expect(house.components![0].producer).toEqual(theirs.components![0].producer);
		expect('producer' in house.components![1]).toBe(false);
	});
});

describe('the pack and the edition', () => {
	it('round trips the profiles byte for byte through buildPack and readPack', () => {
		const h = withProducers();
		const read = readPack(JSON.stringify(buildPack(clone(h), 'tools', NOW)), { rand: seeded() });
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.report).toEqual([]);
		expect(read.fatalCount).toBe(0);
		expect(JSON.stringify(read.house.components)).toBe(JSON.stringify(h.components));
	});

	it('an older pack with no profile reads unchanged, and a new edition\'s profiles arrive on it while a person\'s own survives', () => {
		const old = readPack(JSON.stringify(buildPack(clone(fixture), 'tools', NOW)), { rand: seeded() });
		expect(old.ok).toBe(true);
		const device = clone(fixture);
		device.components![1].producer = kept(profile({ who: 'My own verjus maker' }), TS + 60000);
		const shipped = withProducers();
		shipped.components![1].producer = kept(profile({ who: 'The edition\'s verjus maker' }));
		const { house } = refreshEdition(device, shipped);
		expect(house.components![0].producer!.value.who).toBe('Quay Salt Works');
		expect(house.components![1].producer!.value.who).toBe('My own verjus maker');
		expect(house.components!.find((c) => c.id === 'c-orchard1')!.producer!.value.who).toBe('Orchard Farm');
	});
});

describe('the cards and the drills', () => {
	it('deal up to three cards per kept profile, under the component\'s id, and none from a profile nobody kept', () => {
		const h = withProducers();
		const cards = buildFlashcards(h).filter((c) => c.kind === 'producer');
		expect(cards).toEqual([
			{ kind: 'producer', front: 'Quay Salt Works: where, and since when?', back: 'The Quay. Founded 1896.', itemId: 'c-saltcrs1', n: 0 },
			{ kind: 'producer', front: 'Quay Salt Works: one thing to know', back: 'It is the oldest firm on the quay.', itemId: 'c-saltcrs1', n: 1 },
			{ kind: 'producer', front: 'Quay Salt Works: which dishes?', back: 'Lantern Roast Chicken.', itemId: 'c-saltcrs1', n: 2 },
			{ kind: 'producer', front: 'Orchard Farm: where, and since when?', back: 'The Valley. Founded 1920s.', itemId: 'c-orchard1', n: 0 },
			{ kind: 'producer', front: 'Orchard Farm: one thing to know', back: 'The apples are picked in October.', itemId: 'c-orchard1', n: 1 },
			{ kind: 'producer', front: 'Orchard Farm: which dishes?', back: 'Beetroot and Apple Salad.', itemId: 'c-orchard1', n: 2 }
		]);
		/* No fact: the history's first sentence; no where and no founded: no who card; a drink: Which drinks. */
		const h2 = withProducers();
		h2.components![1].producer = kept(profile({ who: 'Verjus House', where: '', founded: '', facts: [] }));
		const verjus = buildFlashcards(h2).filter((c) => c.itemId === 'c-verjus01');
		expect(verjus.map((c) => [c.n, c.front, c.back])).toEqual([
			[1, 'Verjus House: one thing to know', 'The salt works began on the quay.'],
			[2, 'Verjus House: which drinks?', 'Verjus and Tonic.']
		]);
		h2.components![1].producer = hers(profile());
		expect(buildFlashcards(h2).filter((c) => c.itemId === 'c-verjus01')).toEqual([]);
	});

	it('the producer drills deal from two profiles, never offer a second right answer as a distractor, and deal nothing from a house with none', () => {
		const h = withProducers();
		const counts = drillableCounts(h);
		expect([counts.producerOf, counts.producerWhere, counts.producerDish]).toEqual([2, 2, 2]);
		expect(readyKinds(h)).toEqual(['producerDish']);
		for (let s = 1; s <= 30; s++) {
			const q = dealQuestion(h, 'producerDish', seeded(s))!;
			expect(q.options).toHaveLength(4);
			expect(['Quay Salt Works', 'Orchard Farm']).toContain(q.stem);
			expect(q.answer).toBe(q.stem === 'Orchard Farm' ? 'Beetroot and Apple Salad' : 'Lantern Roast Chicken');
		}
		/* Orchard Farm on both dishes: the other dish is right too and is never a distractor. */
		const both = withProducers();
		both.components!.find((c) => c.id === 'c-orchard1')!.itemIds = ['d-beetrt01', 'd-chicken1'];
		for (let s = 1; s <= 30; s++) {
			const q = dealQuestion(both, 'producerDish', seeded(s))!;
			if (q.stem !== 'Orchard Farm') continue;
			expect(q.options.filter((o) => o === 'Beetroot and Apple Salad' || o === 'Lantern Roast Chicken')).toHaveLength(1);
		}
		for (const kind of PRODUCER_KINDS) expect(dealQuestion(fixture, kind, seeded(1))).toBeNull();
	});

	it('name a producer in a question by its who up to the first bracket or comma, the profile keeping the whole who', () => {
		expect(shortWho('LaPlace andouille, the Andouille Capital of the World')).toBe('LaPlace andouille');
		expect(shortWho("Brennan's honey (source unconfirmed)")).toBe("Brennan's honey");
		expect(shortWho('Louisiana popcorn rice (the Della type, bred by the LSU AgCenter)')).toBe('Louisiana popcorn rice');
		expect(shortWho('Quay Salt Works')).toBe('Quay Salt Works');
		const h = withProducers();
		h.components![0].producer = kept(profile({ who: 'Quay Salt Works (to be confirmed by the chef)' }));
		const fronts = buildFlashcards(h).filter((c) => c.kind === 'producer' && c.itemId === 'c-saltcrs1').map((c) => c.front);
		expect(fronts).toEqual(['Quay Salt Works: where, and since when?', 'Quay Salt Works: one thing to know', 'Quay Salt Works: which dishes?']);
		for (let s = 1; s <= 20; s++) {
			const q = dealQuestion(h, 'producerDish', seeded(s))!;
			expect(q.stem).not.toMatch(/\(/);
		}
		/* No founded: the card asks only where from. */
		h.components![0].producer = kept(profile({ founded: '' }));
		expect(buildFlashcards(h).find((c) => c.itemId === 'c-saltcrs1' && c.n === 0)!.front).toBe('Quay Salt Works: where from?');
	});

	it('offer a food producer the other dishes before any drink or wine, filling from the rest only in a small house', () => {
		const h = withProducers();
		for (let s = 1; s <= 30; s++) {
			const q = dealQuestion(h, 'producerDish', seeded(s))!;
			const other = q.answer === 'Lantern Roast Chicken' ? 'Beetroot and Apple Salad' : 'Lantern Roast Chicken';
			expect(q.options).toContain(other);
		}
	});

	it('never offer as a wrong place one that echoes the stem or the right answer', () => {
		const h = withProducers();
		const add = (id: string, who: string, where: string) =>
			h.components!.push({ id, kind: 'ingredient', name: who, producer: kept(profile({ who, where })), itemIds: [], termIds: [], ts: TS });
		add('c-rice0001', 'Rice country', 'The prairie, centred on Crowley');
		add('c-crawf001', 'Crawfish farmers', 'Rice country and the Atchafalaya Basin');
		add('c-shrmp001', 'Shrimpers', 'Louisiana coast and the Gulf');
		add('c-fishr001', 'Fishermen', 'Gulf waters off Louisiana');
		add('c-hills001', 'Hill Dairy', 'The northern hills');
		add('c-milln001', 'Mill Lane Bakers', 'Old Town');
		for (let s = 1; s <= 60; s++) {
			const q = dealQuestion(h, 'producerWhere', seeded(s))!;
			expect(q.options).toHaveLength(4);
			if (q.stem === 'Rice country') expect(q.options).not.toContain('Rice country and the Atchafalaya Basin');
			if (q.stem === 'Shrimpers') expect(q.options).not.toContain('Gulf waters off Louisiana');
			if (q.stem === 'Fishermen') expect(q.options).not.toContain('Louisiana coast and the Gulf');
		}
	});
});
