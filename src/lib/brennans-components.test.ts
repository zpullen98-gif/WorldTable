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
		expect(r.stdout).toContain('1 components (2 items compared, from 3 fragment file(s)');
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
		expect(engine.fragmentCounts(frag)).toEqual({ components: 1, componentItems: 1, compared: 2, componentVideos: 1 });
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
		expect(engine.fragmentCounts(join(tmpdir(), 'oot-no-such-dir-' + Date.now()))).toEqual({ components: 0, componentItems: 0, compared: 0, componentVideos: 0 });
		const dir = mkdtempSync(join(tmpdir(), 'oot-frag-'));
		made.push(dir);
		writeFileSync(join(dir, 'dishes.json'), JSON.stringify({ components: [component(), component({ key: 'b', items: ['Eggs Hussarde', 'Turtle Soup'] })], compare: COMPARE }));
		writeFileSync(join(dir, 'notes.txt'), 'not a fragment');
		expect(engine.fragmentCounts(dir)).toEqual({ components: 2, componentItems: 2, compared: 2, componentVideos: 0 });
		writeFileSync(join(dir, 'broken.json'), '{');
		expect(() => engine.readFragments(dir)).toThrow(/broken.json: does not parse as JSON/);
	});
});
