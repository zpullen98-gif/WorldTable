/**
 * The component fragments through the Brennan's chain (the component deep
 * dive, 5 October 2026): tools/house/build-brennans.mjs reads the fragments
 * (engine.mjs readFragments), resolves every item, term and component name to
 * an id, mints each component's c- id through the ledger, stamps its marks like
 * every other mark and files each item's comparisons; engine.mjs
 * componentProblems holds what was filed to the content rules, countProblems
 * reads its figures from the fragments, and tools/house/check-compare.mjs
 * resolves every in-app ref against the apps' data. Each run is on a copy of
 * the tool tree in a scratch folder with a small fixture fragment written
 * there, so the committed house.json, the ledger and the authors' own files
 * are never touched. The fixture's words are the guide's own lines on Eggs
 * Hussarde, a test fixture and never shipped.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const made: string[] = [];
afterAll(() => {
	for (const d of made) rmSync(d, { recursive: true, force: true });
});

type Rec = Record<string, unknown>;

const EXPLAIN =
	'Marchand de vin means the wine merchant’s sauce. It is a savory red wine reduction, cooked down until it is concentrated and glossy enough to coat a spoon.\n\n' +
	'The kitchen reduces the wine slowly so the sharp alcohol cooks away and the deep, winey flavor stays. Reduced too far it turns bitter; reduced too little it runs thin across the plate.\n\n' +
	'On Eggs Hussarde it sits under the poached eggs with the Canadian bacon, the darker of the two sauces, and it is why the guide offers a light red Burgundy as the second choice.';

function component(over: Rec = {}): Rec {
	return {
		key: 'test-marchand-de-vin',
		kind: 'technique',
		name: 'Marchand de vin',
		say: 'mar-SHAWN duh VAN',
		explain: EXPLAIN,
		card: { front: 'What is marchand de vin?', back: 'The wine merchant’s sauce: a savory red wine reduction, the darker of the two sauces on Eggs Hussarde, so a light red Burgundy suits the dish.' },
		items: ['Eggs Hussarde'],
		terms: ['Marchand de vin'],
		sources: ['guide.txt (Eggs Hussarde)'],
		...over
	};
}
const COMPARE = [
	{
		item: 'Eggs Hussarde',
		entries: [
			{ app: 'table', ref: 'sauce-hollandaise', label: 'The Library hollandaise', same: 'The buttery, lemony emulsion on the Hussarde.', different: 'The Library sauce stands alone; ours shares the plate with marchand de vin.' },
			{ app: 'classic', ref: '', label: 'Eggs Benedict', same: 'Poached eggs, English muffins, Canadian bacon and hollandaise.', different: 'The Hussarde adds marchand de vin under the eggs.' }
		]
	},
	{ item: 'Classic Sazerac', entries: [{ app: 'ledger', ref: 'Sazerac', label: 'The canon Sazerac', same: 'Rye, sugar, bitters and a rinsed glass.', different: 'The house builds to its own spec.' }] }
];

/* The shipped pack carries the authors' components and the videos only their fragments file; a scratch
   build without those fragments would drop them, so the copy keeps only what the overrides file. */
function packWithoutFragments(dir: string): void {
	const at = join(dir, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
	const p = JSON.parse(readFileSync(at, 'utf8'));
	const o = JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'overrides.json'), 'utf8'));
	const ledger = JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'ids.ledger.json'), 'utf8'));
	const filed = new Set(o.entries.filter((e: Record<string, any>) => e.target === 'video:+').map((e: Record<string, any>) => ledger['videos:' + e.value.id]));
	delete p.house.components;
	if (Array.isArray(p.house.videos)) p.house.videos = p.house.videos.filter((v: Record<string, unknown>) => filed.has(v.id));
	writeFileSync(at, JSON.stringify(p));
}

/** A copy of tools/house, the engine, the pack and the Table's data, with the fragments written under frag/. */
function tree(files: Record<string, unknown>): { dir: string; frag: string } {
	const dir = mkdtempSync(join(tmpdir(), 'oot-components-'));
	made.push(dir);
	cpSync(join(ROOT, 'tools', 'house'), join(dir, 'tools', 'house'), { recursive: true });
	rmSync(join(dir, 'tools', 'house', 'brennans', 'components'), { recursive: true, force: true });
	mkdirSync(join(dir, 'static', 'shared', 'packs'), { recursive: true });
	cpSync(join(ROOT, 'static', 'shared', 'oot-house.js'), join(dir, 'static', 'shared', 'oot-house.js'));
	cpSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), join(dir, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'));
	packWithoutFragments(dir);
	mkdirSync(join(dir, 'src', 'lib', 'data'), { recursive: true });
	for (const f of ['recipes.index.json', 'techniques.json']) cpSync(join(ROOT, 'src', 'lib', 'data', f), join(dir, 'src', 'lib', 'data', f));
	const parsed = spawnSync(process.execPath, [join(dir, 'tools', 'house', 'parse-guide.mjs'), '--quiet'], { cwd: dir, encoding: 'utf8' });
	expect(parsed.status, parsed.stderr || parsed.stdout).toBe(0);
	const frag = join(dir, 'frag');
	mkdirSync(frag);
	for (const [name, body] of Object.entries(files)) writeFileSync(join(frag, name), JSON.stringify(body, null, '\t'));
	return { dir, frag };
}

const env = (frag: string) => ({ ...process.env, BRENNANS_COMPONENTS: frag });
function build(dir: string, frag: string) {
	return spawnSync(process.execPath, [join(dir, 'tools', 'house', 'build-brennans.mjs'), '--mint', '--components', frag], { cwd: dir, encoding: 'utf8' });
}
const houseOf = (dir: string) => JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'house.json'), 'utf8'));

describe("the Brennan's builder: the components and the comparisons", () => {
	it('files a component with its c- id, its marks at the build stamp and its ids resolved, and each comparison on its item', async () => {
		const { dir, frag } = tree({
			'dishes.json': { components: [component()], compare: [COMPARE[0]] },
			'drinks.json': { compare: [COMPARE[1]] },
			'videos.json': { videos: [{ id: 'hollandaise-le-cordon-bleu', componentKeys: ['test-marchand-de-vin'] }] }
		});
		const r = build(dir, frag);
		expect(r.status, r.stderr).toBe(0);
		expect(r.stdout).toContain('1 components (0 with a producer, 2 items compared, from 3 fragment file(s)');
		const h = houseOf(dir);
		const ledger = JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'ids.ledger.json'), 'utf8'));
		const [c] = h.components;
		expect(c.id).toBe(ledger['components:test-marchand-de-vin']);
		expect(c.id).toMatch(/^c-[0-9a-z]{8}$/);
		expect(Object.keys(c)).toEqual(['id', 'kind', 'name', 'say', 'explain', 'card', 'itemIds', 'termIds', 'ts']);
		const stamp = h.dishes[0].ts;
		for (const f of ['say', 'explain', 'card']) expect(c[f]).toMatchObject({ by: 'maitre', ts: stamp });
		expect(c.itemIds).toEqual([h.dishes.find((d: Rec) => d.name === 'Eggs Hussarde').id]);
		expect(c.termIds).toEqual([h.lexicon.find((t: Rec) => t.term === 'Marchand de vin').id]);
		/* A Table ref is carried as the address it opens, so every room links it without the Table's data. */
		const entries = COMPARE[0].entries.map((e) => (e.app === 'table' ? { ...e, ref: 'recipe/' + e.ref } : e));
		expect(h.dishes.find((d: Rec) => d.name === 'Eggs Hussarde').compare).toEqual({ value: entries, by: 'maitre', ts: stamp });
		expect(h.cocktails.find((d: Rec) => d.name === 'Classic Sazerac').compare.value[0].ref).toBe('Sazerac');
		expect(h.videos.find((v: Rec) => Array.isArray(v.componentIds)).componentIds).toEqual([c.id]);
		expect(h.videos.filter((v: Rec) => 'componentIds' in v)).toHaveLength(1);
		/* A rebuild is byte for byte the same. */
		const first = readFileSync(join(dir, 'tools', 'house', 'brennans', 'house.json'), 'utf8');
		expect(build(dir, frag).status).toBe(0);
		expect(readFileSync(join(dir, 'tools', 'house', 'brennans', 'house.json'), 'utf8')).toBe(first);
		/* The gates: the content rules, the counts from the fragments, the validator and check-compare. */
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(dir, 'tools', 'house', 'engine.mjs')).href);
		expect(engine.componentProblems(h, engine.noteHay())).toEqual([]);
		expect(engine.fragmentCounts(frag)).toEqual({ components: 1, componentItems: 1, compared: 2, componentVideos: 1, producers: 0 });
		const v = spawnSync(process.execPath, [join(dir, 'tools', 'house', 'validate-pack.mjs')], { cwd: dir, encoding: 'utf8', env: env(frag) });
		expect(v.status, v.stderr).toBe(0);
		const sibling = (name: string) => join(ROOT, '..', name);
		const cc = spawnSync(process.execPath, [join(dir, 'tools', 'house', 'check-compare.mjs')], {
			cwd: dir,
			encoding: 'utf8',
			env: { ...process.env, LEDGER_SRC: existsSync(join(sibling('bartendersledger'), 'js')) ? sibling('bartendersledger') : '', CODEX_SRC: existsSync(join(sibling('sommelierscodex'), 'js')) ? sibling('sommelierscodex') : '' }
		});
		expect(cc.status, cc.stderr).toBe(0);
		expect(cc.stdout).toContain('3 comparison(s), every in-app ref resolves');
	}, 180_000);

	it('carries a codex ref naming a house wine as that wine\'s id, so the Codex opens its card', () => {
		const { dir, frag } = tree({
			'wines.json': { compare: [{ item: 'Charles Lafitte Brut Champagne NV', entries: [{ app: 'codex', ref: 'Brennan’s Essential by Piper-Heidsieck Extra Brut NV', label: 'Our house Champagne', same: 'Dry Champagne, traditional method.', different: 'Ours is Extra Brut, drier still.' }] }] }
		});
		const r = build(dir, frag);
		expect(r.status, r.stderr).toBe(0);
		const h = houseOf(dir);
		const house = h.wines.find((w: Rec) => w.name === 'Brennan’s Essential by Piper-Heidsieck Extra Brut NV');
		expect(h.wines.find((w: Rec) => w.name === 'Charles Lafitte Brut Champagne NV').compare.value[0].ref).toBe(house.id);
	}, 120_000);

	it('refuses an unknown item, term or component key, a key twice, a kind outside the three, a dash, a missing source and a bad comparison', () => {
		const EM = String.fromCharCode(0x2014);
		const cases: Array<[Record<string, unknown>, RegExp]> = [
			[{ 'dishes.json': { components: [component({ items: ['Eggs Nowhere'] })] } }, /Eggs Nowhere is not a dish, drink or wine in the house/],
			[{ 'dishes.json': { components: [component({ terms: ['No such term'] })] } }, /No such term is not a term in the house lexicon/],
			[{ 'dishes.json': { components: [component()] }, 'drinks.json': { components: [component()] } }, /the key test-marchand-de-vin is used twice/],
			[{ 'dishes.json': { components: [component({ kind: 'garnish' })] } }, /kind "garnish" is not one of ingredient, technique, story/],
			[{ 'dishes.json': { components: [component({ name: 'Marchand ' + EM + ' de vin' })] } }, /name carries a dash/],
			[{ 'dishes.json': { components: [component({ sources: [] })] } }, /needs sources/],
			[{ 'dishes.json': { components: [component({ key: 'Bad Key' })] } }, /needs a key, a lowercase ascii slug/],
			[{ 'videos.json': { videos: [{ id: 'hollandaise-le-cordon-bleu', componentKeys: ['nowhere'] }] } }, /nowhere is not a component key in the fragments/],
			[{ 'videos.json': { videos: [{ id: 'no-such-video', componentKeys: ['x'] }] } }, /no video with that id is filed/],
			[{ 'dishes.json': { compare: [COMPARE[0], COMPARE[0]] } }, /Eggs Hussarde is compared twice/],
			[{ 'dishes.json': { compare: [{ item: 'Eggs Hussarde', entries: [COMPARE[0].entries[0], COMPARE[0].entries[1], COMPARE[0].entries[1]] }] } }, /needs one or two entries/],
			[{ 'dishes.json': { compare: [{ item: 'Eggs Hussarde', entries: [{ ...COMPARE[0].entries[1], ref: 'x' }] }] } }, /a classic carries ref ""/],
			[{ 'dishes.json': { compare: [{ item: 'Eggs Hussarde', entries: [{ ...COMPARE[0].entries[0], app: 'menu' }] }] } }, /app "menu" is not one of/],
			[{ 'dishes.json': { compare: [{ item: 'Eggs Hussarde', entries: [{ ...COMPARE[0].entries[0], ref: 'no-such-recipe' }] }] } }, /is neither a recipe slug nor a technique slug/],
			[{ 'dishes.json': { extra: [] } }, /unknown key extra/]
		];
		for (const [files, said] of cases) {
			const { dir, frag } = tree(files);
			const r = build(dir, frag);
			expect(r.status, r.stdout).toBe(1);
			expect(r.stderr).toMatch(said);
		}
	}, 600_000);
});

describe('the component gates', () => {
	it('hold the explanation, the card, the reach, the sources and the comparisons, and leave a house with none alone', async () => {
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		const h = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
		const bare = JSON.parse(JSON.stringify(h));
		delete bare.components;
		for (const l of ['dishes', 'wines', 'cocktails']) for (const r of bare[l]) delete r.compare;
		expect(engine.componentProblems(bare, '')).toEqual([]);
		const mark = (value: unknown) => ({ value, by: 'person', ts: 1 });
		const bad = JSON.parse(JSON.stringify(bare));
		bad.components = [
			{ id: 'c-test0001', kind: 'story', name: 'A test', explain: mark('One paragraph of nine words, invented by Zorbatron in 1666.'), card: mark({ front: 'Q?', back: 'Short.' }), itemIds: [], termIds: [], ts: 1 }
		];
		bad.dishes[0].compare = mark([
			{ app: 'classic', ref: '', label: 'one two three four five six seven eight nine', same: 'It is gluten free.', different: 'x' },
			{ app: 'table', ref: 'x', label: 'L', same: 'S', different: 'D' }
		]);
		const out = engine.componentProblems(bad, engine.noteHay()).join('\n');
		for (const said of [
			'reaches no item',
			'the explanation is 10 words, the range is 80 to 160',
			'the explanation is one paragraph',
			"the card's back is 1 words, the range is 20 to 45",
			'the name Zorbatron is in no source',
			'the in-app comparison comes first, the classic second',
			'the label is 9 words, at most 8',
			'an allergen or diet verdict ("gluten free")'
		]) expect(out).toContain(said);
		/* The year rule itself (the page snapshots print a figure for nearly every year, so it is shown here on a small source). */
		expect(engine.sourceProblems('Opened in 1946 and moved in 1956 by Owen.', 'opened 1946 owen')).toEqual(['the year 1956 is in no source']);
		expect(engine.COMPONENT_DIET_LINE).toBe('Dietary questions go to the service note and the kitchen.');
		const ok = JSON.parse(JSON.stringify(bare));
		ok.components = [{ id: 'c-test0001', kind: 'technique', name: 'Marchand de vin', explain: mark(EXPLAIN + ' Shellfish stock is not in it. ' + engine.COMPONENT_DIET_LINE), card: mark(component().card), itemIds: [ok.dishes[0].id], termIds: [], ts: 1 }];
		expect(engine.componentProblems(ok, engine.noteHay()).join('\n')).toContain('names an allergen or a diet without sending the server');
		ok.components[0].explain = mark(EXPLAIN + ' ' + engine.COMPONENT_DIET_LINE);
		expect(engine.componentProblems(ok, engine.noteHay())).toEqual([]);
	});

	it('count the fragments, and none when the directory is absent', async () => {
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		expect(engine.fragmentCounts(join(tmpdir(), 'oot-no-such-dir-' + Date.now()))).toEqual({ components: 0, componentItems: 0, compared: 0, componentVideos: 0, producers: 0 });
		const dir = mkdtempSync(join(tmpdir(), 'oot-frag-'));
		made.push(dir);
		writeFileSync(join(dir, 'dishes.json'), JSON.stringify({ components: [component(), component({ key: 'b', items: ['Eggs Hussarde', 'Turtle Soup'] })], compare: COMPARE }));
		writeFileSync(join(dir, 'notes.txt'), 'not a fragment');
		expect(engine.fragmentCounts(dir)).toEqual({ components: 2, componentItems: 2, compared: 2, componentVideos: 0, producers: 0 });
		writeFileSync(join(dir, 'broken.json'), '{');
		expect(() => engine.readFragments(dir)).toThrow(/broken.json: does not parse as JSON/);
	});
});

/* ---- the producers (the producer deep dive, 6 October 2026) ---------------------------------------- */

/* The fixture fragment under tools/house/fixtures/producers/: the Leidenheimer and Abita Amber components
   as the authors filed them, one profile attached by a producers entry and one carried inline, every word
   standing in the research files. A test fixture, never shipped. */
const PRODUCER_FIXTURE = join(ROOT, 'tools', 'house', 'fixtures', 'producers');
const fixtureFiles = (): Record<string, any> => ({
	'dishes.json': JSON.parse(readFileSync(join(PRODUCER_FIXTURE, 'dishes.json'), 'utf8')),
	'producers.json': JSON.parse(readFileSync(join(PRODUCER_FIXTURE, 'producers.json'), 'utf8'))
});

describe("the Brennan's builder: the producers", () => {
	it('attaches a profile by a producers entry and one inline, as marks of hers at the build stamp, in the schema\'s key order, and the gates pass', async () => {
		const { dir, frag } = tree(fixtureFiles());
		const r = build(dir, frag);
		expect(r.status, r.stderr).toBe(0);
		expect(r.stdout).toContain('2 components (2 with a producer, 0 items compared, from 2 fragment file(s)');
		const h = houseOf(dir);
		const stamp = h.dishes[0].ts;
		const leid = h.components.find((c: Rec) => c.name === 'Leidenheimer bread');
		const abita = h.components.find((c: Rec) => c.name === 'Abita Amber');
		for (const c of [leid, abita]) {
			expect(Object.keys(c)).toEqual(['id', 'kind', 'name', 'say', 'explain', 'card', 'producer', 'itemIds', 'termIds', 'ts']);
			expect(c.producer).toMatchObject({ by: 'maitre', ts: stamp });
			expect(Object.keys(c.producer.value)).toEqual(['type', 'who', 'where', 'founded', 'history', 'facts', 'notes', 'sayIt', 'askKitchen']);
		}
		expect(leid.producer.value.who).toBe('Leidenheimer Baking Company');
		expect(leid.producer.value.askKitchen).toEqual([]);
		expect(abita.producer.value.founded).toBe('1986');
		/* The gates: the producer's prose and sources, the counts from the fragments, the validator. */
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(dir, 'tools', 'house', 'engine.mjs')).href);
		expect(engine.componentProblems(h, engine.noteHay())).toEqual([]);
		expect(engine.fragmentCounts(frag)).toEqual({ components: 2, componentItems: 2, compared: 0, componentVideos: 0, producers: 2 });
		const v = spawnSync(process.execPath, [join(dir, 'tools', 'house', 'validate-pack.mjs')], { cwd: dir, encoding: 'utf8', env: env(frag) });
		expect(v.status, v.stderr).toBe(0);
		/* keep-all flips the producer to a person's with every mark, and the pack carries it. */
		const k = spawnSync(process.execPath, [join(dir, 'tools', 'house', 'keep-all.mjs'), '--owner-reviewed'], { cwd: dir, encoding: 'utf8', env: env(frag) });
		expect(k.status, k.stderr).toBe(0);
		const pack = JSON.parse(readFileSync(join(dir, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
		for (const c of pack.components) expect(c.producer.by).toBe('person');
		expect(pack.components.find((c: Rec) => c.name === 'Leidenheimer bread').producer.value).toEqual(leid.producer.value);
	}, 240_000);

	it('refuses a producers entry naming no component, a second profile, a type outside the five, a dash, an unknown key and a missing source', () => {
		const EM = String.fromCharCode(0x2014);
		const files = fixtureFiles();
		const entry = files['producers.json'].producers[0];
		const withEntry = (over: Rec, profileOver: Rec = {}) => {
			const f = fixtureFiles();
			f['producers.json'].producers = [{ ...entry, producer: { ...entry.producer, ...profileOver }, ...over }];
			return f;
		};
		const twice = fixtureFiles();
		twice['producers.json'].producers.push({ ...entry, component: 'abita-amber' });
		const cases: Array<[Record<string, unknown>, RegExp]> = [
			[withEntry({ component: 'no-such-component' }), /no-such-component is not a component key in the fragments/],
			[twice, /abita-amber already carries a producer; one profile per component/],
			[withEntry({}, { type: 'brand' }), /type "brand" is not one of maker, farm, fishery, origin, house/],
			[withEntry({}, { who: '' }), /producer: needs who/],
			[withEntry({}, { facts: ['Founded ' + EM + ' 1896.'] }), /facts\[0\] carries a dash/],
			[withEntry({}, { awards: [] }), /producer: unknown key awards/],
			[withEntry({ extra: 1 }), /unknown key extra/],
			[withEntry({ sources: [] }), /needs sources/]
		];
		for (const [f, said] of cases) {
			const { dir, frag } = tree(f);
			const r = build(dir, frag);
			expect(r.status, r.stdout).toBe(1);
			expect(r.stderr).toMatch(said);
		}
	}, 600_000);
});

describe('the producer gate', () => {
	it('holds a profile to the explanation\'s prose rule, its sources and its caps, and agrees with the schema\'s constants', async () => {
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		const schema = await import('./house/house-schema');
		expect(engine.PRODUCER_TYPES).toEqual([...schema.PRODUCER_TYPES]);
		expect(engine.PRODUCER_CAPS).toEqual({ ...schema.PRODUCER_WORDS, ...schema.PRODUCER_MAX });
		const h = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
		const bare = JSON.parse(JSON.stringify(h));
		const good = fixtureFiles()['producers.json'].producers[0].producer;
		const words = (n: number) => Array.from({ length: n }, () => 'bread').join(' ');
		const at = (p: Rec) => {
			const one = JSON.parse(JSON.stringify(bare));
			one.components = [{ ...one.components.find((c: Rec) => c.name === 'Leidenheimer bread'), producer: { value: { ...good, ...p }, by: 'person', ts: 1 } }];
			return engine.componentProblems(one, engine.noteHay()).filter((x: string) => x.includes(' producer '));
		};
		expect(at({})).toEqual([]);
		const out = at({
			type: 'brand',
			who: 'Zorbatron Loaves',
			founded: '1666',
			history: words(301),
			facts: ['It is gluten free.', ...Array(12).fill('A fact.')],
			notes: ['The best ' + String.fromCharCode(0x2014) + ' loaf.', words(61)],
			sayIt: 'A unique bread for a unique table.'
		}).join('\n');
		for (const said of [
			'type "brand" is not one of',
			'history: 301 words, at most 300',
			'facts: 13, at most 12',
			'notes[1]: 61 words, at most 60',
			'who: the name Zorbatron is in no source',
			'facts[0]: an allergen or diet verdict ("gluten free")',
			'notes[0]: a dash',
			'sayIt: the banned word "unique"'
		]) expect(out).toContain(said);
		/* The year rule on a founding year (the snapshots print nearly every year, so it is shown on a small source). */
		expect(engine.sourceProblems('1666', 'founded in 1896')).toEqual(['the year 1666 is in no source']);
		/* An allergen named without sending the server to the kitchen is refused; sent there, it stands. */
		expect(at({ notes: ['There is dairy in the loaf.'] }).join('\n')).toContain('names an allergen or a diet without sending the server');
		expect(at({ notes: ['Dairy questions go to the kitchen at lineup.'] })).toEqual([]);
		/* A question under Ask the kitchen is sent there by its heading; a verdict in it is still refused. */
		expect(at({ askKitchen: ['Is there dairy in the loaf?'] })).toEqual([]);
		expect(at({ askKitchen: ['Is the loaf dairy free?'] }).join('\n')).toContain('an allergen or diet verdict');
	});

	it('counts the components carrying a producer in the fragments, inline or attached, each once', async () => {
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		expect(engine.fragmentCounts(PRODUCER_FIXTURE).producers).toBe(2);
		expect(engine.readFragments(PRODUCER_FIXTURE).producers).toHaveLength(1);
	});
});

/* ---- the Ledger names nobody living, over the producers behind a drink ----------------------------- */

/* engine.mjs drinkProducers and drinkProducerProblems, the gate check-drinks.mjs runs over every fragment and
   componentProblems runs over the shipped edition: a profile whose component (new or attached by key) names a
   drink is held to the living rule, the dash rule and the allergen rule; a food producer is not. Every name here
   is invented for the test, a living one standing in for the people the drink research meets. */
describe("the Ledger's living rule over the drink producers", () => {
	const engineOf = () => import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
	const DRINKS = ['Quay Sazerac', 'Lantern Collins'];
	const profile = (over: Rec = {}): Rec => ({ type: 'maker', who: 'Quay Distilling', where: 'Quay Lane', founded: '', history: 'The still was built on the quay.', facts: [], notes: [], sayIt: '', askKitchen: [], ...over });
	const frags = (key: string, over: Rec = {}, inline?: Rec) => ({
		components: [
			{ at: 'drinks.json components[0]', v: { key: 'bar-bitters', items: ['Quay Sazerac'] } },
			{ at: 'dishes.json components[0]', v: { key: 'food-bread', items: ['Eggs Hussarde'] } },
			...(inline ? [{ at: 'producers.json components[0]', v: inline }] : [])
		],
		producers: key ? [{ at: 'producers.json producers[0]', v: { component: key, producer: profile(over) } }] : []
	});

	it('refuses a living surname in a drink producer, attached by key or inline, and passes the same surname in a food-only producer', async () => {
		const engine = await engineOf();
		const living = engine.livingRegex(engine.LIVING_FLOOR);
		const said = 'producers.json producers[0] (bar-bitters) producer history: names a living person ("Hauck"); the Ledger names nobody living';
		expect(engine.drinkProducerProblems(frags('bar-bitters', { history: 'The still was built by Hauck on the quay.' }), DRINKS, living).join('\n')).toContain(said);
		expect(engine.drinkProducerProblems(frags('food-bread', { history: 'The still was built by Hauck on the quay.' }), DRINKS, living)).toEqual([]);
		/* Every field of the profile is read: who, where, founded, history, each fact and note, sayIt and each question. */
		const each = engine.drinkProducerProblems(frags('bar-bitters', { who: 'Hauck Spirits', where: "Hauck's yard", founded: 'By Hauck', facts: ['Kregar ran it.'], notes: ['Say Underhill.'], sayIt: 'Ask for Patrick.', askKitchen: ['Is Branson in?'] }), DRINKS, living).join('\n');
		for (const f of ['who', 'where', 'founded', 'facts[0]', 'notes[0]', 'sayIt', 'askKitchen[0]']) expect(each).toContain(`(bar-bitters) producer ${f}: names a living person`);
		/* Inline on a new component that names a drink (and a dish), matched folded for case. */
		const inline = { key: 'bar-syrup', items: ['Eggs Hussarde', 'lantern collins'], producer: profile({ notes: ['Murray makes it.'] }) };
		expect(engine.drinkProducerProblems(frags('', {}, inline), DRINKS, living)).toEqual([expect.stringContaining('producers.json components[0] (bar-syrup) producer notes[0]: names a living person ("Murray")')]);
		expect(engine.drinkProducers(frags('', {}, inline), DRINKS).map((p: Rec) => [p.key, p.drinks])).toEqual([['bar-syrup', ['lantern collins']]]);
		expect(engine.drinkProducerProblems(frags('', {}, { ...inline, items: ['Eggs Hussarde'] }), DRINKS, living)).toEqual([]);
		/* A whole word only, and the dead may be named. */
		expect(engine.drinkProducerProblems(frags('bar-bitters', { history: 'Heidelberg bergamot, after Antoine Peychaud.' }), DRINKS, living)).toEqual([]);
		/* A name printed on the menu is the menu's word, read past; outside it the same name is refused. */
		const printed = frags('bar-bitters', { history: 'The coffee in Ralph’s Coffee.' });
		expect(engine.drinkProducerProblems(printed, DRINKS, living, ['Ralph’s Coffee'])).toEqual([]);
		expect(engine.drinkProducerProblems(printed, DRINKS, living).join('\n')).toContain('names a living person ("Ralph")');
	});

	it('holds a drink producer to the dash and allergen rules, and sends a question to the kitchen by its heading', async () => {
		const engine = await engineOf();
		const EM = String.fromCharCode(0x2014);
		const out = engine.drinkProducerProblems(frags('bar-bitters', { facts: ['Founded ' + EM + ' on the quay.', 'It is gluten free.'], notes: ['There is dairy in the syrup.'] }), DRINKS).join('\n');
		for (const s of ['facts[0]: a dash', 'facts[1]: an allergen or diet verdict ("gluten free")', 'notes[0]: names an allergen or a diet without sending the server']) expect(out).toContain(s);
		expect(engine.drinkProducerProblems(frags('bar-bitters', { notes: ['Dairy questions go to the kitchen at lineup.'], askKitchen: ['Is there dairy in the syrup?'] }), DRINKS)).toEqual([]);
		expect(engine.drinkProducerProblems(frags('food-bread', { facts: ['Founded ' + EM + ' on the quay.'] }), DRINKS)).toEqual([]);
	});

	it('extends the floor from living.json beside the fragments, refuses a malformed list, and the fragment reader skips it', async () => {
		const engine = await engineOf();
		const dir = mkdtempSync(join(tmpdir(), 'oot-living-'));
		made.push(dir);
		expect(engine.livingNames(dir)).toEqual(engine.LIVING_FLOOR);
		writeFileSync(join(dir, 'living.json'), JSON.stringify(['Quayside', 'Hauck', "O'Lantern"]));
		writeFileSync(join(dir, 'dishes.json'), JSON.stringify({ components: [component()] }));
		const names = engine.livingNames(dir);
		expect(names).toEqual([...engine.LIVING_FLOOR, 'Quayside', "O'Lantern"]);
		expect(engine.readFragments(dir).files.map((f: string) => f.split(/[\\/]/).pop())).toEqual(['dishes.json']);
		const living = engine.livingRegex(names);
		expect(engine.drinkProducerProblems(frags('bar-bitters', { sayIt: 'Quayside distils it.' }), DRINKS, living).join('\n')).toContain('names a living person ("Quayside")');
		expect(engine.drinkProducerProblems(frags('bar-bitters', { sayIt: 'Quaysides distil it.' }), DRINKS, living)).toEqual([]);
		for (const [bad, said] of [['["quayside"]', /\[0\] "quayside" is not a surname/], ['{"names":[]}', /is a list of surnames/], ['[', /does not parse as JSON/]] as const) {
			writeFileSync(join(dir, 'living.json'), bad);
			expect(() => engine.livingNames(dir)).toThrow(said);
		}
	});

	it("holds the shipped edition too: a living surname in the profile behind a drink is refused, behind a dish it is not the gate's", async () => {
		const engine = await engineOf();
		const h = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
		const drinkIds = new Set(h.cocktails.map((c: Rec) => c.id));
		const bar = h.components.find((c: Rec) => c.producer && (c.itemIds as string[]).some((id) => drinkIds.has(id)));
		const food = h.components.find((c: Rec) => c.name === 'Leidenheimer bread');
		expect(bar, 'a component behind a drink carries a producer').toBeTruthy();
		const at = (c: Rec) => {
			const one = JSON.parse(JSON.stringify(h));
			one.components = [{ ...c, producer: { ...(c.producer as Rec), value: { ...((c.producer as Rec).value as Rec), notes: ['Hauck roasts it.'] } } }];
			return engine.componentProblems(one, engine.noteHay()).filter((x: string) => x.includes('living'));
		};
		expect(at(bar).join('\n')).toContain('producer notes[0]: names a living person ("Hauck")');
		expect(at(food)).toEqual([]);
		expect(engine.componentProblems(h, engine.noteHay())).toEqual([]);
	});

	/* check-drinks.mjs on a copy of the authors' folder: needs the Ledger's and the Codex's data for its compare
	   check, so it is skipped on a machine without those checkouts. */
	const LEDGER = process.env.LEDGER_SRC || join(ROOT, '..', 'bartendersledger');
	const CODEX = process.env.CODEX_SRC || join(ROOT, '..', 'sommelierscodex');
	const sources = existsSync(join(LEDGER, 'js', 'data-core.js')) && existsSync(join(CODEX, 'js', 'data-producers.js'));
	it.skipIf(!sources)('check-drinks refuses a living name from living.json in a drink producer, and passes it in a food-only one', () => {
		const COMP = join(ROOT, 'tools', 'house', 'brennans', 'components');
		const run = (move: (p: Rec) => void) => {
			const dir = mkdtempSync(join(tmpdir(), 'oot-check-drinks-'));
			made.push(dir);
			for (const f of ['dishes.json', 'drinks.json', 'wines.json', 'videos.json']) cpSync(join(COMP, f), join(dir, f));
			const p = JSON.parse(readFileSync(join(COMP, 'producers.json'), 'utf8'));
			move(p);
			writeFileSync(join(dir, 'producers.json'), JSON.stringify(p, null, 1));
			writeFileSync(join(dir, 'living.json'), JSON.stringify(['Quayside']));
			return spawnSync(process.execPath, [join(COMP, 'check-drinks.mjs'), join(dir, 'drinks.json')], { cwd: dir, encoding: 'utf8', env: { ...process.env, BRENNANS_COMPONENTS: dir, LEDGER_SRC: LEDGER, CODEX_SRC: CODEX } });
		};
		const FACT = 'The roastery was founded by Quayside.';
		const entry = (p: Rec, key: string) => (p.producers as Rec[]).find((x) => x.component === key) as Rec & { producer: { facts: string[] } };
		const drink = run((p) => entry(p, 'bar-congregation-coffee').producer.facts.push(FACT));
		expect(drink.status, drink.stdout).toBe(1);
		expect(drink.stderr).toMatch(/producers\.json producers\[\d+\] \(bar-congregation-coffee\) producer facts\[\d+\]: names a living person \("Quayside"\)/);
		const food = run((p) => entry(p, 'creekstone-farms').producer.facts.push(FACT));
		expect(food.status, food.stderr).toBe(0);
		expect(food.stdout).toMatch(/drink producers \d+: bar-congregation-coffee\b[^;\n]*; living names refused 19/);
	}, 60_000);
});

describe("the Brennan's spelling map", () => {
	const engineOf = () => import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);

	it('respells the forms the producer walk-through found in the drink producers, keeps a capital, and leaves the wine called Télégramme whole', async () => {
		const engine = await engineOf();
		const said = (s: string) => engine.americanise(s).out;
		expect(said('It was reorganised as the company.')).toBe('It was reorganized as the company.');
		expect(said('who had learnt absinthe making in France')).toBe('who had learned absinthe making in France');
		expect(said('the city’s 73 neighbourhoods; each takes a neighbourhood’s name')).toBe('the city’s 73 neighborhoods; each takes a neighborhood’s name');
		expect(said('Dealcoholised wine is made as wine first, then dealcoholised.')).toBe('Dealcoholized wine is made as wine first, then dealcoholized.');
		expect(said('Neighbouring villages, an amphitheatre of vines, the alcohol vapour')).toBe('Neighboring villages, an amphitheater of vines, the alcohol vapor');
		expect(said('a re-pressurises stopper')).toBe('a re-pressurizes stopper');
		expect(said('its younger wine is called Télégramme')).toBe('its younger wine is called Télégramme');
		expect(said('savoury, savour and flavour')).toBe('savory, savor and flavor');
		expect(engine.britishWords('It was reorganised; they learnt it.')).toEqual(['reorganised', 'learnt']);
	});
});
