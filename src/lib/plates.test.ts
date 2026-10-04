import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPTION_COUNT, PLATE_QUIZ_LENGTH, displayName, factOf, plateIndexes, plateQuiz } from './plates';
import type { Plate, PlatesData, PlateTeaching } from './types';
import { checkPlate, checkTeaching, plateImagePaths, readImages, readPlate } from '../../tools/derive/plates.mjs';

const authored = JSON.parse(readFileSync(join(__dirname, '../../tools/derive/plates/teaching.json'), 'utf8')) as Record<string, PlateTeaching>;

describe('independent folio editions', () => {
	it('keeps v2 by default and advances only the selected folio, preserving its archive', () => {
		expect(plateImagePaths('beef-cuts')).toEqual({ src: 'plates/beef-cuts-v2.webp', thumb: 'plates/beef-cuts-v2.thumb.webp', archive: 'plates/archive/beef-cuts.webp' });
		expect(plateImagePaths('pacific-fish', 'v3')).toEqual({ src: 'plates/pacific-fish-v3.webp', thumb: 'plates/pacific-fish-v3.thumb.webp', archive: 'plates/archive/pacific-fish.webp' });
		expect(plateImagePaths('beef-cuts').src).toBe('plates/beef-cuts-v2.webp');
	});
	it.each(['', 'v0', 'v03', '3', 'v3/other', '../v3', 'v3.webp', null, 3])('rejects an invalid revision instead of changing the path: %s', revision => {
		expect(() => plateImagePaths('beef-cuts', revision)).toThrow('revision must be');
	});
	it('gates both selected files before publication instead of falling back to v2', () => {
		const { text } = readPlate('beef-cuts');
		const images = new Map([['beef-cuts', { width: 1024, height: 1536, revision: 'v999999' }]]);
		const result = checkPlate('beef-cuts', text, images);
		expect(result.plate).toBeNull();
		expect(result.problems).toEqual([
			'plates/beef-cuts.json: static/plates/beef-cuts-v999999.webp is missing',
			'plates/beef-cuts.json: static/plates/beef-cuts-v999999.thumb.webp is missing'
		]);
	});
});

/** A deterministic generator: the quiz must be a function of its rand. */
function seeded(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

const fixture: Plate = {
	slug: 'test-cuts',
	title: 'Test Cuts',
	tagline: null,
	kind: 'cuts',
	kindTitle: 'The cuts',
	regionLine: null,
	corners: [],
	image: { src: 'plates/test-cuts.webp', thumb: 'plates/test-cuts.thumb.webp', width: 10, height: 10 },
	teaching: authored['beef-cuts'],
	groups: [
		{ title: 'Chuck', note: null, items: [{ name: 'Chuck Roast', sub: null, facts: [['Cook', 'Braised']], links: { deck: 'fd_0001' } }, { name: 'Flat Iron Steak', sub: null, facts: [['Cook', 'Grilled']] }] },
		{ title: 'Rib', note: null, items: [{ name: 'Ribeye', sub: null, facts: [['Cook', 'Grilled']], links: { lexicon: 'ribeye' } }, { name: 'Prime Rib', sub: null, facts: [['Cook', 'Roasted']] }] },
		{ title: 'Brisket', note: null, items: [{ name: 'Brisket', sub: null, facts: [['Cook', 'Smoked, Braised']] }] },
		{ title: 'Round', note: null, items: [{ name: 'Eye of Round', sub: null, facts: [['Cook', 'Roasted']] }, { name: 'Top Round', sub: 'London Broil', facts: [['Cook', 'Marinated']] }] },
		{ title: 'Shank', note: null, items: [{ name: 'Shank Cross Cut', sub: null, facts: [['Cook', 'Braised']] }] }
	],
	panels: [],
	footer: null,
	corrections: [],
	count: 8,
	deckSections: ['cuts'],
	lexiconCategories: ['Beef Cuts & Grades']
};

describe('plateQuiz', () => {
	it('asks each of the six reviewed subjects once, with four distinct reviewed options', () => {
		const qs = plateQuiz(fixture, seeded(7));
		expect(qs).toHaveLength(6);
		expect(PLATE_QUIZ_LENGTH).toBe(6);
		const names = new Set(fixture.teaching.subjects.map((s) => s.name));
		const about = qs.map((q) => q.about);
		expect(new Set(about).size).toBe(about.length);
		for (const q of qs) {
			expect(q.options).toHaveLength(OPTION_COUNT);
			expect(new Set(q.options).size).toBe(OPTION_COUNT);
			expect(q.options).toContain(q.answer);
			for (const option of q.options) expect(names.has(option)).toBe(true);
		}
	});

	it('never uses archival facts, groups or corrections as questions or answers', () => {
		const changed = structuredClone(fixture);
		changed.groups = [{ title: 'WRONG ARCHIVE GROUP', note: null, items: [{name:'WRONG ARCHIVE ITEM',sub:null,facts:[['Cook','WRONG ARCHIVE FACT']]}] }];
		changed.corrections = [{on:'WRONG ARCHIVE ITEM',says:'wrong',should:'Still wrong.',why:'wrong'}];
		expect(plateQuiz(changed, seeded(14))).toEqual(plateQuiz(fixture, seeded(14)));
		expect(JSON.stringify(plateQuiz(changed, seeded(14)))).not.toContain('WRONG ARCHIVE');
	});

	it('teaches hanger steak as diaphragm / short plate even when the archive puts it in Flank', () => {
		const changed = structuredClone(fixture);
		changed.groups = [{ title: 'Flank', note: null, items: [{name:'Hanger Steak',sub:null,facts:[['Cook','Grilled']]}] }];
		const q = plateQuiz(changed, seeded(14)).find(q => q.about === 'Hanger Steak');
		expect(q?.answer).toBe('Hanger Steak');
		expect(q?.prompt).toContain('diaphragm');
		expect(q?.prompt).toContain('short plate rather than the flank');
		expect(q?.options).not.toContain('Flank');
	});

	it('never puts the answer in a fixed slot', () => {
		const slots = new Set<number>();
		for (let seed = 1; seed < 40; seed++) {
			for (const q of plateQuiz(fixture, seeded(seed))) slots.add(q.options.indexOf(q.answer));
		}
		expect(slots.size).toBe(OPTION_COUNT);
	});

	it('is a function of its rand', () => {
		expect(plateQuiz(fixture, seeded(11))).toEqual(plateQuiz(fixture, seeded(11)));
	});

	it('does not fall back to archive-only cached data or an incomplete guide', () => {
		const cached = { ...fixture, teaching: undefined } as unknown as Plate;
		expect(plateQuiz(cached, seeded(5))).toEqual([]);
		const short = { ...fixture, teaching: { ...fixture.teaching, subjects: fixture.teaching.subjects.slice(0,3) } };
		expect(plateQuiz(short, seeded(5))).toEqual([]);
	});

	it('honors a smaller count, caps larger counts at six and does not mutate its input', () => {
		const before = structuredClone(fixture);
		expect(plateQuiz(fixture, seeded(1), 3)).toHaveLength(3);
		expect(plateQuiz(fixture, seeded(1), 99)).toHaveLength(6);
		expect(plateQuiz(fixture, seeded(1), 0)).toEqual([]);
		expect(plateQuiz(fixture, seeded(1), -1)).toEqual([]);
		expect(fixture).toEqual(before);
	});

	it('displayName carries the sub, and factOf reads a fact', () => {
		const it = fixture.groups[3].items[1];
		expect(displayName(it)).toBe('Top Round (London Broil)');
		expect(factOf(it, 'Cook')).toBe('Marinated');
		expect(factOf(it, 'Season')).toBeNull();
	});
});

describe('reviewed teaching gate', () => {
	it('accepts all twenty complete, source-linked six-subject guides', () => {
		expect(Object.keys(authored)).toHaveLength(20);
		for (const [slug, guide] of Object.entries(authored)) expect(checkTeaching(slug, guide), slug).toEqual([]);
	});
	it('rejects missing guides, ambiguous quiz descriptions, duplicate identities and missing sources', () => {
		expect(checkTeaching('missing', null).length).toBeGreaterThan(0);
		const broken = structuredClone(authored['beef-cuts']);
		broken.subjects[1].id = broken.subjects[0].id;
		broken.subjects[1].name = broken.subjects[0].name;
		broken.subjects[1].summary = broken.subjects[0].summary;
		broken.sources = [];
		const problems = checkTeaching('beef-cuts', broken).join(' ');
		expect(problems).toContain('duplicate subject id');
		expect(problems).toContain('duplicate subject name');
		expect(problems).toContain('duplicate quiz description');
		expect(problems).toContain('primary source');
	});
});

describe('plateIndexes', () => {
	it('joins sections, categories, cards and terms to their plates', () => {
		const data: PlatesData = { version: 1, kinds: [{ key: 'cuts', title: 'The cuts', blurb: '' }], plates: [fixture] };
		const ix = plateIndexes(data);
		expect(ix.bySlug.get('test-cuts')?.title).toBe('Test Cuts');
		expect(ix.bySection.get('cuts')?.[0].slug).toBe('test-cuts');
		expect(ix.byCategory.get('Beef Cuts & Grades')?.[0].slug).toBe('test-cuts');
		expect(ix.byCard.get('fd_0001')?.slug).toBe('test-cuts');
		expect(ix.byLexicon.get('ribeye')?.slug).toBe('test-cuts');
	});
});

/* The shipped file, when it exists: the wall is twenty plates in the order
   the build fixes, every one with a picture entry and at least six items,
   and every link a real card or term. */
describe('the emitted plates', () => {
	const data = JSON.parse(readFileSync(join(__dirname, 'data', 'plates.json'), 'utf8')) as PlatesData;
	const deck = JSON.parse(readFileSync(join(__dirname, 'data', 'floor-deck.index.json'), 'utf8')) as { cards: Array<{ id: string }> };
	const lexicon = JSON.parse(readFileSync(join(__dirname, 'data', 'lexicon.json'), 'utf8')) as Array<{ slug: string }>;
	const images = new Map(readImages().map(image => [image.slug, image]));

	it('holds twenty plates, versioned pictures, all 463 archival items, and links that resolve', () => {
		const ids = new Set(deck.cards.map((c) => c.id));
		const slugs = new Set(lexicon.map((e) => e.slug));
		expect(data.plates).toHaveLength(20);
		expect(data.plates.reduce((sum,p)=>sum+p.count,0)).toBe(463);
		for (const p of data.plates) {
			expect(p.image.width).toBeGreaterThan(0);
			const paths = plateImagePaths(p.slug, images.get(p.slug)?.revision);
			expect(p.image.src).toBe(paths.src);
			expect(p.image.thumb).toBe(paths.thumb);
			expect(p.teaching, p.slug).toEqual(authored[p.slug]);
			expect(p.count).toBeGreaterThanOrEqual(6);
			expect(p.count).toBe(p.groups.reduce((n, g) => n + g.items.length, 0));
			for (const g of p.groups) {
				for (const it of g.items) {
					if (it.links?.deck) expect(ids.has(it.links.deck), `${p.slug}: ${it.name} links card ${it.links.deck}`).toBe(true);
					if (it.links?.lexicon) expect(slugs.has(it.links.lexicon), `${p.slug}: ${it.name} links term ${it.links.lexicon}`).toBe(true);
				}
			}
			for (const c of p.corrections) expect(c.should).toMatch(/[.!?]$/);
		}
	});

	it('every plate can field exactly six reviewed questions', () => {
		for (const p of data.plates) {
			const qs = plateQuiz(p, seeded(1));
			expect(qs, p.slug).toHaveLength(6);
			expect(new Set(qs.map(q=>q.answer))).toEqual(new Set(p.teaching.subjects.map(s=>s.name)));
		}
	});

	it('retains original transcriptions and corrections separately from the reviewed guide', () => {
		for (const p of data.plates) {
			const source = JSON.parse(readFileSync(join(__dirname, `../../tools/derive/plates/${p.slug}.json`),'utf8'));
			expect(p.groups.map(g=>({title:g.title,note:g.note,items:g.items.map(({links,...item})=>item)}))).toEqual(source.groups.map((g: Plate['groups'][number])=>({title:g.title.trim(),note:g.note??null,items:g.items.map(i=>({name:i.name.trim(),...(i.printed?{printed:i.printed}:{}),sub:i.sub??null,facts:i.facts}))})));
			expect(p.corrections).toEqual(source.corrections);
			expect(p.panels).toEqual(source.panels);
		}
	});
});
