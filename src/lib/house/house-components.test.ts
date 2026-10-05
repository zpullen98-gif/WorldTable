/**
 * The House's components and comparisons: the ingredients, techniques and
 * stories an item is made of (one card per component, shared by every item
 * that uses it), an item's one or two comparisons, and the videos that teach
 * a component. The optional list, the marks' shapes, the validator's refs,
 * kinds and caps, the merge, the pack round trip and the edition refresh: a
 * new edition's components arrive and a person's marks survive.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	COMPARE_APPS,
	COMPARE_MAX,
	COMPARE_WORDS,
	COMPONENT_KINDS,
	COMPONENT_LABELS,
	COMPONENT_WORDS,
	ID_PREFIXES,
	KEYS,
	componentGroups,
	componentVideos,
	componentsFor,
	isMark
} from './house-schema';
import type { CompareEntry, House, HouseComponent, Mark } from './house-schema';
import { FORBIDDEN_KEY, markKind, normaliseHouse, normaliseMark } from './house-normalise';
import { validateHouse } from './house-validate';
import { mergeHouse, sameJson } from './house-merge';
import { buildPack, readPack, refreshEdition } from './house-pack';
import { buildFlashcards } from './house-drills';

const fixture: House = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/house-min.json', import.meta.url)), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const NOW = 1790800000000;
const EDITION = fixture.components![0].explain!.ts;

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
const problemsAt = (h: House, code: string) => validateHouse(h).problems.filter((p) => p.code === code).map((p) => p.path);

describe('the constants and the keys', () => {
	it('name three kinds, four apps, the caps and the c- prefix, and no key the client refuses', () => {
		expect([...COMPONENT_KINDS]).toEqual(['ingredient', 'technique', 'story']);
		expect(COMPONENT_LABELS).toEqual({ ingredient: 'Ingredients', technique: 'Techniques', story: 'Stories' });
		expect([...COMPARE_APPS]).toEqual(['table', 'ledger', 'codex', 'classic']);
		expect(COMPARE_MAX).toBe(2);
		expect(COMPONENT_WORDS).toEqual({ explain: 160, front: 14, back: 45 });
		expect(COMPARE_WORDS).toEqual({ label: 8, same: 30, different: 30 });
		expect(ID_PREFIXES.components).toBe('c-');
		for (const k of [...KEYS.HouseComponent, ...KEYS.ComponentCard, ...KEYS.CompareEntry, 'componentIds', 'components', 'compare']) expect(k).not.toMatch(FORBIDDEN_KEY);
		expect(markKind('card')).toBe('card');
		expect(markKind('compare')).toBe('compare');
		expect(markKind('explain')).toBe('text');
	});

	it('take a list of comparisons as a mark value, and never a list that mixes strings and records', () => {
		expect(isMark({ value: [{ app: 'classic' }], by: 'person', ts: 1 })).toBe(true);
		expect(isMark({ value: ['a', 'b'], by: 'person', ts: 1 })).toBe(true);
		expect(isMark({ value: ['a', { app: 'x' }], by: 'person', ts: 1 })).toBe(false);
		expect(isMark({ value: [['a']], by: 'person', ts: 1 })).toBe(false);
	});
});

describe('the normaliser', () => {
	it('keeps the fixture byte for byte: the components, the comparisons and a video\'s componentIds', () => {
		const { house, report } = normaliseHouse(clone(fixture), { rand: seeded() });
		expect(report).toEqual([]);
		expect(JSON.stringify(house.components)).toBe(JSON.stringify(fixture.components));
		expect(JSON.stringify(house.dishes[0].compare)).toBe(JSON.stringify(fixture.dishes[0].compare));
		expect(house.videos![0].componentIds).toEqual(['c-saltcrs1']);
		expect(sameJson(house, fixture)).toBe(true);
	});

	it('leaves the list and the field out when nothing is in them, so an older record keeps its keys', () => {
		const bare = clone(fixture) as Partial<House>;
		delete bare.components;
		delete bare.videos![0].componentIds;
		delete bare.dishes![0].compare;
		const { house } = normaliseHouse(bare, { rand: seeded() });
		expect('components' in house).toBe(false);
		expect('componentIds' in house.videos![0]).toBe(false);
		expect('compare' in house.dishes[0]).toBe(false);
		const emptied = clone(fixture);
		emptied.components = [];
		emptied.videos![0].componentIds = [];
		expect('components' in normaliseHouse(emptied, { rand: seeded() }).house).toBe(false);
		expect('componentIds' in normaliseHouse(emptied, { rand: seeded() }).house.videos![0]).toBe(false);
	});

	it('brings a component to its shape: a wrong prefix re-minted with its references following, a stray key gone, a kind carried for the validator', () => {
		const h = clone(fixture);
		h.components![0] = { ...h.components![0], id: 'q-wrong001', extra: 'drop me', kind: 'garnish' } as unknown as HouseComponent;
		h.videos![0].componentIds = ['q-wrong001'];
		const { house, report } = normaliseHouse(h, { rand: seeded() });
		const c = house.components![0];
		expect(c.id).toMatch(/^c-[0-9a-z]{8}$/);
		expect(report.some((r) => r.code === 'id' && r.path === 'house.components[0].id')).toBe(true);
		expect(house.videos![0].componentIds).toEqual([c.id]);
		expect('extra' in c).toBe(false);
		expect(c.kind).toBe('garnish');
		expect(Object.keys(c).sort()).toEqual([...KEYS.HouseComponent].sort());
	});

	it('rebuilds a card and the comparisons from their keys, drops an empty entry, and cuts none for the count', () => {
		const card = normaliseMark({ value: { front: 'Q', back: 'A', extra: 'x' }, by: 'person', ts: 1 }, 'card');
		expect(card).toEqual({ value: { front: 'Q', back: 'A' }, by: 'person', ts: 1 });
		expect(normaliseMark({ value: { front: ' ', back: '' }, by: 'person', ts: 1 }, 'card')).toBeUndefined();
		const entry = (over: Partial<CompareEntry> = {}) => ({ app: 'classic', ref: '', label: 'L', same: 'S', different: 'D', ...over });
		const m = normaliseMark({ value: [entry(), { app: 'table', ref: '', label: '', same: '', different: '' }, entry({ app: 'nowhere' as CompareEntry['app'] }), entry(), 'text', { ...entry(), stray: 1 }], by: 'maitre', ts: 2 }, 'compare') as Mark<CompareEntry[]>;
		expect(m.value).toHaveLength(4);
		expect(m.value[1].app).toBe('nowhere');
		for (const e of m.value) expect(Object.keys(e).sort()).toEqual([...KEYS.CompareEntry].sort());
		expect(normaliseMark({ value: [], by: 'person', ts: 1 }, 'compare')).toBeUndefined();
	});

	it('follows a re-minted house wine id into a codex comparison', () => {
		const h = clone(fixture);
		h.wines[0].id = 'x-notawine';
		h.dishes[0].pairing!.value.wineId = 'x-notawine';
		h.dishes[0].compare!.value = [{ app: 'codex', ref: 'x-notawine', label: 'Our white', same: 'S', different: 'D' }];
		const { house } = normaliseHouse(h, { rand: seeded() });
		expect(house.dishes[0].compare!.value[0].ref).toBe(house.wines[0].id);
		expect(house.wines[0].id).toMatch(/^w-/);
	});
});

describe('the validator', () => {
	it('finds nothing in the fixture', () => {
		const { problems, fatalCount } = validateHouse(clone(fixture));
		expect(fatalCount).toBe(0);
		expect(problems.filter((p) => p.code === 'component' || p.code === 'compare' || p.path.indexOf('components') >= 0)).toEqual([]);
	});

	it('names a kind outside the three, a component with no name and a card missing a side, each fatal', () => {
		const h = clone(fixture);
		h.components![0].kind = 'garnish' as HouseComponent['kind'];
		h.components![1].name = ' ';
		h.components![0].card!.value.back = '';
		const found = validateHouse(h).problems.filter((p) => p.code === 'component');
		expect(found.map((p) => p.path)).toEqual(['house.components[0].kind', 'house.components[0].card.value.back', 'house.components[1].name']);
		expect(found.every((p) => p.fatal)).toBe(true);
	});

	it('holds the explanation and the card to their caps, and leaves the floors to the pack builder', () => {
		const h = clone(fixture);
		h.components![0].explain!.value = words(161);
		h.components![0].card!.value = { front: words(15), back: words(46) };
		expect(problemsAt(h, 'word-cap')).toEqual(['house.components[0].explain.value', 'house.components[0].card.value.front', 'house.components[0].card.value.back']);
		const short = clone(fixture);
		short.components![0].explain!.value = 'Short.';
		short.components![0].card!.value = { front: 'Q?', back: 'A.' };
		expect(validateHouse(short).fatalCount).toBe(0);
	});

	it('names a component or a video pointing at nothing in the house', () => {
		const h = clone(fixture);
		h.components![0].itemIds = ['d-nowhere1'];
		h.components![0].termIds = ['x-nowhere1'];
		h.videos![0].componentIds = ['c-nowhere1'];
		expect(problemsAt(h, 'ref')).toEqual(['house.videos[0].componentIds[0]', 'house.components[0].itemIds[0]', 'house.components[0].termIds[0]']);
	});

	it('holds the comparisons to two, a known app, a ref only in app, and the three lines within their caps', () => {
		const e = (over: Partial<CompareEntry> = {}): CompareEntry => ({ app: 'classic', ref: '', label: 'A classic', same: 'Same.', different: 'Different.', ...over });
		const h = clone(fixture);
		h.dishes[0].compare!.value = [e(), e({ app: 'table', ref: '' }), e({ ref: 'eggs-benedict' })];
		h.dishes[1].compare = { value: [e({ app: 'menu' as CompareEntry['app'], ref: 'x' }), e({ label: '', same: words(31), different: words(31) })], by: 'person', ts: 1 };
		h.wines[0].compare = { value: [e({ label: words(9) })], by: 'person', ts: 1 };
		expect(problemsAt(h, 'compare')).toEqual([
			'house.dishes[0].compare.value',
			'house.dishes[0].compare.value[1].ref',
			'house.dishes[0].compare.value[2].ref',
			'house.dishes[1].compare.value[0].app',
			'house.dishes[1].compare.value[1].label'
		]);
		expect(problemsAt(h, 'word-cap')).toEqual(['house.dishes[1].compare.value[1].same', 'house.dishes[1].compare.value[1].different', 'house.wines[0].compare.value[0].label']);
	});

	it('resolves a codex comparison naming a house wine id, and leaves every other ref to check-compare', () => {
		const h = clone(fixture);
		h.dishes[0].compare!.value = [
			{ app: 'codex', ref: 'w-lantern1', label: 'Our white', same: 'S', different: 'D' },
			{ app: 'codex', ref: 'w-nowhere1', label: 'Not ours', same: 'S', different: 'D' }
		];
		h.cocktails[0].compare = { value: [{ app: 'ledger', ref: 'Tom Collins', label: 'The canon Collins', same: 'S', different: 'D' }], by: 'person', ts: 1 };
		expect(problemsAt(h, 'ref')).toEqual(['house.dishes[0].compare.value[1].ref']);
	});
});

describe('the helpers a card reads', () => {
	it('list an item\'s components in the house\'s order, grouped by kind in the order of the three, and a component\'s videos', () => {
		const h = clone(fixture);
		h.components!.push(
			{ id: 'c-story001', kind: 'story', name: 'The quay', itemIds: ['d-chicken1'], termIds: [], ts: 1 },
			{ id: 'c-ingred01', kind: 'ingredient', name: 'Coarse salt', itemIds: ['d-chicken1'], termIds: [], ts: 1 }
		);
		expect(componentsFor(h, 'd-chicken1').map((c) => c.id)).toEqual(['c-saltcrs1', 'c-story001', 'c-ingred01']);
		expect(componentGroups(h, 'd-chicken1').map((g) => [g.label, g.components.map((c) => c.id)])).toEqual([
			['Ingredients', ['c-ingred01']],
			['Techniques', ['c-saltcrs1']],
			['Stories', ['c-story001']]
		]);
		expect(componentGroups(h, 'w-lantern1')).toEqual([]);
		expect(componentVideos(h, 'c-saltcrs1').map((v) => v.id)).toEqual(['v-saltbak1']);
		expect(componentVideos(h, 'c-verjus01')).toEqual([]);
		const bare = clone(h) as Partial<House>;
		delete bare.components;
		delete bare.videos;
		expect(componentsFor(bare as House, 'd-chicken1')).toEqual([]);
		expect(componentVideos(bare as House, 'c-saltcrs1')).toEqual([]);
	});

	it('a component card is one flash card however many items share it', () => {
		const h = clone(fixture);
		h.components![0].itemIds = ['d-chicken1', 'd-beetrt01', 'b-collins1'];
		expect(buildFlashcards(h).filter((c) => c.kind === 'component')).toHaveLength(1);
	});
});

describe('the merge', () => {
	it('settles a component by id with its marks one by one: a person\'s card beats her newer one, a newer plain field travels', () => {
		const mine = clone(fixture);
		const theirs = clone(fixture);
		mine.components![0].card = { value: { front: 'Mine?', back: 'Mine, kept.' }, by: 'person', ts: EDITION + 5 };
		theirs.components![0].card = { value: { front: 'Hers?', back: 'Hers, newer.' }, by: 'maitre', ts: EDITION + 9 };
		theirs.components![0].name = 'Salt crust, renamed';
		theirs.components![0].ts = EDITION + 9;
		const { house } = mergeHouse(mine, theirs);
		expect(house.components![0].card!.value.front).toBe('Mine?');
		expect(house.components![0].name).toBe('Salt crust, renamed');
	});

	it('carries the comparisons as one mark, and a list only one side holds', () => {
		const mine = clone(fixture) as Partial<House>;
		delete mine.components;
		const theirs = clone(fixture);
		theirs.dishes[0].compare = { value: [{ app: 'classic', ref: '', label: 'Newer', same: 'S', different: 'D' }], by: 'person', ts: EDITION + 3 };
		const { house } = mergeHouse(mine as House, theirs);
		expect(house.components!.map((c) => c.id)).toEqual(['c-saltcrs1', 'c-verjus01']);
		expect(house.dishes[0].compare!.value[0].label).toBe('Newer');
	});
});

describe('the pack and the edition', () => {
	it('round trips the components and the comparisons byte for byte through buildPack and readPack', () => {
		const read = readPack(JSON.stringify(buildPack(clone(fixture), 'tools', NOW)), { rand: seeded() });
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.report).toEqual([]);
		expect(read.fatalCount).toBe(0);
		expect(JSON.stringify(read.house.components)).toBe(JSON.stringify(fixture.components));
		expect(JSON.stringify(read.house.dishes[0].compare)).toBe(JSON.stringify(fixture.dishes[0].compare));
		expect(read.house.videos![0].componentIds).toEqual(['c-saltcrs1']);
	});

	it('a new edition\'s components and comparisons arrive on a device that had none, and a second refresh changes nothing', () => {
		const device = clone(fixture) as Partial<House>;
		delete device.components;
		delete device.dishes![0].compare;
		delete device.videos![0].componentIds;
		const shipped = clone(fixture);
		const first = refreshEdition(device as House, shipped);
		expect(first.house.components!.map((c) => c.id)).toEqual(['c-saltcrs1', 'c-verjus01']);
		expect(first.house.dishes[0].compare).toEqual(fixture.dishes[0].compare);
		expect(first.house.videos![0].componentIds).toEqual(['c-saltcrs1']);
		expect(first.counts.added).toBe(2);
		const again = refreshEdition(first.house, clone(shipped));
		expect(sameJson(again.house, first.house)).toBe(true);
		expect(again.counts).toEqual({ added: 0, updated: 0, kept: 0, removed: 0 });
	});

	it('a person\'s edited card and comparison survive a newer edition, while an untouched component takes the new words', () => {
		const device = clone(fixture);
		device.components![0].card = { value: { front: 'My cue?', back: 'My own answer, kept.' }, by: 'person', ts: EDITION + 60000 };
		device.dishes[0].compare = { value: [{ app: 'classic', ref: '', label: 'Mine', same: 'S', different: 'D' }], by: 'person', ts: EDITION + 60000 };
		const shipped = clone(fixture);
		shipped.components![0].card!.value.back = 'The new edition\'s answer.';
		shipped.components![0].explain!.value = 'The new edition explains it again, in other words.';
		shipped.dishes[0].compare!.value[0].label = 'The new label';
		const { house, counts } = refreshEdition(device, shipped);
		expect(house.components![0].card!.value.front).toBe('My cue?');
		expect(house.components![0].explain!.value).toBe('The new edition explains it again, in other words.');
		expect(house.dishes[0].compare!.value[0].label).toBe('Mine');
		expect(counts.kept).toBeGreaterThan(0);
	});

	it('a component the edition retires by tombstone goes from a device that never touched it, and the list goes when empty', () => {
		const device = clone(fixture);
		const next = clone(fixture);
		next.components = [];
		next.videos![0].componentIds = [];
		next.removed = { 'c-saltcrs1': NOW, 'c-verjus01': NOW };
		const { house } = refreshEdition(device, normaliseHouse(next).house);
		expect('components' in house).toBe(false);
	});
});
