import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	AMERICAN_RE,
	ALLERGEN_CLASS,
	ALLERGEN_POINTER,
	BANNED_WORDS,
	CHAPTER_KEYS,
	CUISINE_COMPLETE,
	DASH_RE,
	GENERATED,
	IZE_OK,
	IZE_RE,
	LIMITS,
	METRIC_AFTER_RE,
	NUMERAL_RE,
	US_QTY_RE,
	VERDICT,
	checkSet,
	foldSauce,
	measureProblems,
	proseProblems,
	temperatureProblems,
	treeNodes,
	type CuisineSet,
	type Loose,
	type Problem,
	type Refs
} from '../../tools/derive/cuisine-contract.mjs';
import {
	ID_RE,
	assignIds,
	build,
	derive,
	emptyLedger,
	loadRefs,
	loadSet,
	mintId,
	readFolios,
	readLedger,
	stale
} from '../../tools/derive/cuisine.mjs';
import { TEACHING_FOLIOS } from './teaching-folios';

/**
 * Cuisine's contract, proved able to fail.
 *
 * The shipped seed passes every rule; the emitted files are what a fresh
 * derivation writes, byte for byte; and each major rule is broken once, on a
 * clone of a real entry, beside a control that breaks nothing. A gate nobody
 * has seen fail is a gate nobody knows works.
 */

const ROOT = join(__dirname, '..', '..');
const TODAY = '2026-10-12';
const seed = loadSet();
const refs: Refs = loadRefs({ roster: false });

const clone = (set: CuisineSet): CuisineSet => ({
	meta: structuredClone(set.meta),
	files: new Map([...set.files].map(([k, v]) => [k, structuredClone(v)])),
	tree: structuredClone(set.tree),
	ladder: structuredClone(set.ladder)
});
const run = (set: CuisineSet, opts: { draft?: boolean; complete?: boolean; refs?: Refs } = {}): Problem[] =>
	checkSet(set, opts.refs ?? refs, { draft: opts.draft, complete: opts.complete, today: TODAY }).problems;
const text = (ps: Problem[]) => ps.map((p) => `${p.path}: ${p.message}`).join('\n');

/** A clone of the set with the Hollandaise entry changed by `fn`. */
function breakHollandaise(fn: (e: Loose) => void): Problem[] {
	const set = clone(seed);
	const ch = set.files.get('mother-sauces') as Loose;
	fn(ch.entries.find((e: Loose) => e.stem === 'hollandaise'));
	return run(set);
}
/** A clone with the chapter file of `key` changed by `fn`. */
function breakChapter(key: string, fn: (c: Loose) => void): Problem[] {
	const set = clone(seed);
	fn(set.files.get(key) as Loose);
	return run(set);
}

describe('the shipped seed', () => {
	it('declares the twelve chapters and passes every rule', () => {
		expect(seed.meta.map((m) => m.key).sort()).toEqual([...CHAPTER_KEYS].sort());
		expect(text(run(seed))).toBe('');
		expect(CUISINE_COMPLETE).toBe(false);
	});

	it('holds Hollandaise and Béarnaise in full, and the holy trinity', () => {
		const ms = seed.files.get('mother-sauces') as Loose;
		expect(ms.entries.map((e: Loose) => e.title)).toEqual(['Hollandaise', 'Béarnaise']);
		expect(ms.steps.map((s: Loose) => s.title)).toContain('Build a hollandaise');
		expect(ms.match.length).toBeGreaterThan(0);
		const cc = seed.files.get('creole-cajun') as Loose;
		expect(cc.entries.map((e: Loose) => e.title)).toEqual(['The holy trinity and the mirepoix']);
		expect(cc.steps.map((s: Loose) => s.title)).toContain('Build a gumbo');
	});

	it("uses the pack's respellings for the terms the pack carries", () => {
		const say = (term: string) => refs.terms.get(term.toLowerCase())?.say;
		const ms = seed.files.get('mother-sauces') as Loose;
		expect(ms.entries[0].say).toBe(say('Hollandaise'));
		expect(ms.entries[1].say).toBe(refs.terms.get('bearnaise')?.say);
	});

	it('links only real dishes through components that name them', () => {
		for (const { e } of seed.meta.flatMap((m) => ((seed.files.get(m.key) as Loose)?.entries ?? []).map((e: Loose) => ({ e })))) {
			for (const b of e.brennans ?? []) {
				expect(refs.dishes.has(b.dish), b.dish).toBe(true);
				for (const c of b.components) expect(refs.components.get(c)?.itemIds.has(b.dish), `${c} on ${b.dish}`).toBe(true);
			}
		}
	});
});

describe('the emitted files', () => {
	const result = build({ today: TODAY, refs, ledger: readLedger() });

	it('are what a fresh derivation writes, byte for byte, with nothing extra on disk', () => {
		expect(text(result.problems)).toBe('');
		expect(stale(result.files)).toEqual([]);
	});

	it('are byte-identical on a rebuild', () => {
		const again = build({ today: TODAY, refs, ledger: readLedger() });
		expect([...again.files.keys()]).toEqual([...result.files.keys()]);
		for (const [p, t] of again.files) expect(t, p).toBe(result.files.get(p));
	});

	it('carry the index shape the screens read', () => {
		const index = JSON.parse(readFileSync(join(ROOT, 'src/lib/data/cuisine/index.json'), 'utf8'));
		expect(index.chapters).toHaveLength(12);
		expect(index.levels).toEqual({ 1: 'Commis', 2: 'Chef de Partie', 3: 'Sous Chef', 4: 'Chef' });
		for (const h of index.entries) expect(Object.keys(h)).toEqual(['id', 'slug', 'chapter', 'title', 'say', 'level', 'kind', 'summary']);
		const ids = new Set(index.entries.map((h: Loose) => h.id));
		for (const [cardId, entryId, level] of index.cards) {
			expect(cardId).toMatch(ID_RE);
			expect(ids.has(entryId)).toBe(true);
			expect([1, 2, 3, 4]).toContain(level);
		}
		for (const [qid, entryId] of index.questions) {
			expect(qid).toMatch(ID_RE);
			expect(ids.has(entryId)).toBe(true);
		}
		expect(Object.keys(index.byTechnique)).toEqual(Object.keys(index.byTechnique).sort());
		expect(index.byDish['d-1q0xk7jv']).toEqual([index.entries.find((h: Loose) => h.slug === 'hollandaise').id]);
		const ms = JSON.parse(readFileSync(join(ROOT, 'src/lib/data/cuisine/ch-mother-sauces.json'), 'utf8'));
		const holl = ms.entries.find((e: Loose) => e.slug === 'hollandaise');
		const cardIds = new Set(holl.cards.map((c: Loose) => c.id));
		for (const q of holl.questions) expect(cardIds.has(q.teaches)).toBe(true);
	});

	it('generate the matches from the tree and the Brennan\'s links, one to one and true', () => {
		const made = result.generated.made;
		const tree = made.find((m) => m.from === 'tree');
		expect(tree?.pairs.length).toBe(LIMITS.mothers);
		const nodes = treeNodes(seed.tree);
		for (const [small, mother] of tree?.pairs ?? []) {
			const node = nodes.find((n) => n.name === small);
			expect(node?.ancestors, small).toContain(mother);
		}
		const brennans = made.find((m) => m.from === 'brennans');
		expect(brennans).toBeDefined();
		const dishId = new Map([...refs.dishes].map(([id, name]) => [name, id]));
		const sauces = new Set((brennans?.pairs ?? []).map(([, s]) => foldSauce(s)));
		for (const [dish, sauce] of brennans?.pairs ?? []) {
			const id = dishId.get(dish) as string;
			const carried = [...refs.components.values()].filter((c) => c.itemIds.has(id)).map((c) => foldSauce(c.name));
			expect(carried, dish).toContain(foldSauce(sauce));
			// no dish carries a second sauce of the set, so no pair can be swapped and stay true
			expect(carried.filter((c) => sauces.has(c)), dish).toEqual([foldSauce(sauce)]);
		}
		for (const s of result.generated.skipped) expect(s.pairs).toBeLessThan(LIMITS.pairs[0]);
	});
});

describe('the ids', () => {
	it('are minted from the chapter path and looked up by stem after', () => {
		const ledger = readLedger();
		expect(ledger.entries.hollandaise).toBe(mintId('mother-sauces/hollandaise'));
		expect(ledger.cards['hollandaise/ratio']).toBe(mintId('mother-sauces/hollandaise/ratio'));
		for (const g of GENERATED) expect(ledger.matches[g.stem]).toBe(mintId(`${g.chapter}/${g.stem}`));
		// an entry that moves chapter keeps its id
		const set = clone(seed);
		const trinity = (set.files.get('creole-cajun') as Loose).entries.pop();
		(set.files.get('mother-sauces') as Loose).entries.push(trinity);
		(set.files.get('creole-cajun') as Loose).steps[0].entry = 'the-holy-trinity';
		const moved = assignIds(set, [], ledger);
		expect(moved.ids.entries.get('the-holy-trinity')).toBe(ledger.entries['the-holy-trinity']);
		expect(moved.problems).toEqual([]);
	});

	it('refuse an unminted key, a collision, a retired id and an orphan', () => {
		const unminted = assignIds(seed, [], emptyLedger());
		expect(text(unminted.problems)).toMatch(/no id: ids are minted, never typed/);
		const ledger = readLedger();
		const twice = structuredClone(ledger);
		twice.cards['hollandaise/ratio'] = twice.entries.hollandaise;
		expect(text(assignIds(seed, [], twice).problems)).toMatch(/one id, one key/);
		const retired = structuredClone(ledger);
		delete retired.entries.bearnaise;
		retired.retired['entries:old-bearnaise'] = { id: mintId('mother-sauces/bearnaise'), reason: 'test' };
		expect(text(assignIds(seed, [], retired, { mint: true }).problems)).toMatch(/was retired .* may never be reused/);
		const orphan = structuredClone(ledger);
		orphan.cards['hollandaise/gone'] = 'cz-zzzzzzzz';
		expect(text(assignIds(seed, [], orphan).problems)).toMatch(/names nothing in the chapters/);
	});
});

describe('every major rule fails once', () => {
	it('the control breaks nothing', () => {
		expect(breakHollandaise(() => {})).toEqual([]);
	});

	it('a dash, in prose or anywhere else', () => {
		expect(text(breakHollandaise((e) => (e.summary = e.summary.replace('. It is', ' \u2014 it is'))))).toMatch(/a dash/);
		expect(text(breakHollandaise((e) => (e.sources[0].title += ' -- reprint')))).toMatch(/sources\[0\].*a dash/);
		expect(text(breakHollandaise((e) => (e.cards[0].back += ' &mdash; always')))).toMatch(/a dash/);
	});

	it('American spelling, but not in a name that keeps its own', () => {
		expect(text(breakHollandaise((e) => (e.sections[0].paras[0] = e.sections[0].paras[0].replace('flavour', 'flavor'))))).toMatch(/American spelling "flavor"/);
		expect(text(breakHollandaise((e) => (e.cards[1].back += ' It will emulsify and stabilize.')))).toMatch(/American -ize spelling "stabilize"/);
		expect(proseProblems("Steen's cane syrup is poured at the National Center for Home Food Preservation.")).toEqual([]);
	});

	it('a missing source, and two wanted for history', () => {
		expect(text(breakHollandaise((e) => (e.sources = [])))).toMatch(/at least 1 source/);
		expect(text(breakHollandaise((e) => (e.kind = 'history')))).not.toMatch(/at least 2/);
		expect(text(breakHollandaise((e) => ((e.kind = 'history'), (e.sources = e.sources.slice(0, 1)))))).toMatch(/at least 2 source\(s\) for a history entry/);
		expect(text(breakHollandaise((e) => (e.sources[1].url = 'http://www.webexhibits.org/butter/')))).toMatch(/full https address/);
		expect(text(breakHollandaise((e) => (e.sources[2].asOf = '2099-01-01')))).toMatch(/after the build date/);
	});

	it('a bad dish id, or a component that does not name the dish', () => {
		expect(text(breakHollandaise((e) => (e.brennans[0].dish = 'd-zzzzzzzz')))).toMatch(/not a dish in the Brennan's pack/);
		expect(text(breakHollandaise((e) => (e.brennans[0].dish = 'hussarde')))).toMatch(/is not a dish id/);
		expect(text(breakHollandaise((e) => (e.brennans[0].components = ['Béarnaise'])))).toMatch(/does not name d-1q0xk7jv/);
		expect(text(breakHollandaise((e) => (e.brennans[0].components = ['Hollandaise sauce'])))).toMatch(/not a component of the Brennan's pack/);
	});

	it('a duplicate distractor, or one that is the answer', () => {
		expect(text(breakHollandaise((e) => (e.questions[0].distractors = ['Reduced cream', 'reduced cream', 'Flour cooked in butter'])))).toMatch(/two distractors are the same/);
		expect(text(breakHollandaise((e) => (e.questions[0].distractors[2] = 'Egg yolk.')))).toMatch(/a distractor is the answer/);
		expect(text(breakHollandaise((e) => e.questions[0].distractors.pop()))).toMatch(/exactly 3/);
		expect(text(breakHollandaise((e) => (e.questions[0].distractors[0] = 'All of the above')))).toMatch(/all of the above/);
	});

	it('an answer that gives itself away by length', () => {
		expect(text(breakHollandaise((e) => (e.questions[5].answer = 'Béarnaise, which is hollandaise built on a sharp tarragon and shallot reduction')))).toMatch(/the longest option is a tell past 1.8 times/);
	});

	it('a level by number, in data or in prose', () => {
		expect(text(breakHollandaise((e) => (e.level = 'Commis')))).toMatch(/integer key 1 to 4/);
		expect(text(breakHollandaise((e) => (e.level = 5)))).toMatch(/integer key 1 to 4/);
		expect(text(breakHollandaise((e) => (e.summary = e.summary.replace('quick to make', 'learnt at level 1'))))).toMatch(/a level by its number/);
	});

	it('an unpaired match, or one that is not one to one', () => {
		expect(text(breakChapter('mother-sauces', (c) => (c.match[0].pairs[1] = ['Choron'])))).toMatch(/a pair is \[left, right\]/);
		expect(text(breakChapter('mother-sauces', (c) => (c.match[0].pairs[2][1] = c.match[0].pairs[1][1])))).toMatch(/on the right twice/);
		expect(text(breakChapter('mother-sauces', (c) => (c.match[0].pairs = c.match[0].pairs.slice(0, 3))))).toMatch(/4 to 8/);
		// a pair that names tree nodes must agree with the tree
		expect(text(breakChapter('mother-sauces', (c) => (c.match[0].pairs[1][1] = 'Meat glaze, glace de viande') && (c.match[0].pairs[2][1] = 'Tomato purée reduced to a paste')))).toMatch(/not of one family in tree.json/);
	});

	it('steps out of shape', () => {
		expect(text(breakChapter('mother-sauces', (c) => (c.steps[0].steps = c.steps[0].steps.slice(0, 3))))).toMatch(/4 to 9 stages/);
		expect(text(breakChapter('mother-sauces', (c) => (c.steps[0].distractor = c.steps[0].steps[2])))).toMatch(/the distractor is one of the stages/);
		expect(text(breakChapter('mother-sauces', (c) => (c.steps[0].distractor = ['a', 'b'])))).toMatch(/ONE string/);
	});

	it("a respelling that is not the pack's", () => {
		expect(text(breakHollandaise((e) => (e.say = 'hol-un-DAYZ')))).toMatch(/say must be exactly that/);
	});

	it('a temperature without its other scale, wrong arithmetic, or a US measure without metric', () => {
		expect(temperatureProblems('Hold it at 60°C.')).not.toEqual([]);
		expect(temperatureProblems('Hold it at 60°C (150°F).')[0]).toMatch(/60°C is 140°F/);
		expect(temperatureProblems('Hold it at 60°C (140°F) or 140°F (60°C).')).toEqual([]);
		expect(measureProblems('Use 8 oz of butter.')).not.toEqual([]);
		expect(measureProblems('Use 8 oz (225 g) or 225 g (8 oz) of butter.')).toEqual([]);
		expect(text(breakHollandaise((e) => (e.temps[0].f = 160)))).toMatch(/65°C is 149°F, not 160°F/);
		expect(text(breakHollandaise((e) => (e.guest = 'Hollandaise is held at 60°C (140°F) and thickened with egg yolk, brightened with lemon for the table.')))).toMatch(/no temperatures at the table/);
	});

	it('a verdict, a superlative, an allergen named without the kitchen', () => {
		expect(text(breakHollandaise((e) => (e.guest = 'Hollandaise is a warm butter sauce that is safe for most guests, thickened with yolk and brightened with lemon.')))).toMatch(/verdict/);
		expect(text(breakHollandaise((e) => (e.summary = e.summary.replace('quick to make', 'perfect to make'))))).toMatch(/banned word "perfect"/);
		expect(text(breakHollandaise((e) => (e.sections[4].paras[0] += ' It holds gluten in no form.')))).toMatch(/names an allergen/);
		expect(proseProblems('Questions about gluten go to the kitchen.')).toEqual([]);
	});

	it('cross references that resolve nowhere, and a question that teaches nothing', () => {
		expect(text(breakHollandaise((e) => e.seeAlso.techniques.push('not-a-technique')))).toMatch(/not in techniques/);
		expect(text(breakHollandaise((e) => e.seeAlso.folios.push('not-a-folio')))).toMatch(/not in folios/);
		expect(text(breakHollandaise((e) => e.seeAlso.deck.push('fd_9999')))).toMatch(/not in deck/);
		expect(text(breakHollandaise((e) => e.seeAlso.entries.push('veloute')))).toMatch(/"veloute" is not a written Cuisine entry/);
		expect(text(breakHollandaise((e) => (e.questions[0].teaches = 'nowhere')))).toMatch(/teaches "nowhere" is the stem of a card/);
	});

	it('draft mode accepts a slug planned in the roster, and only then', () => {
		const set = clone(seed);
		((set.files.get('mother-sauces') as Loose).entries[0].seeAlso.entries as string[]).push('veloute');
		const planned: Refs = { ...refs, roster: [{ chapter: 'mother-sauces', stem: 'veloute', slug: 'veloute', title: 'Velouté' }] };
		expect(text(run(set, { refs: planned }))).toMatch(/planned in the roster: validate with --draft/);
		expect(run(set, { refs: planned, draft: true })).toEqual([]);
		expect(text(run(set, { draft: true }))).toMatch(/draft mode needs tools\/cuisine\/roster.json/);
	});

	it('the safety chapter: two sources, and every figure in their evidence', () => {
		const set = clone(seed);
		const entry = structuredClone((seed.files.get('mother-sauces') as Loose).entries[0]);
		Object.assign(entry, { stem: 'holding-sauces', slug: 'holding-sauces', title: 'Holding warm sauces', say: 'As it reads: holding warm sauces.', kind: 'safety', brennans: [] });
		entry.seeAlso = {};
		entry.sources = [
			{ title: 'Kitchen note one', url: 'https://example.org/one', evidence: 'Yolks thicken near 65°C or 149°F and set past 70°C or 158°F.' },
			{ title: 'Kitchen note two', url: 'https://example.org/two', evidence: 'Hold at 60°C, which is 140°F.' }
		];
		const meta = set.meta.find((m) => m.key === 'safety') as { key: string; title: string; intro: string };
		set.files.set('safety', { key: 'safety', title: meta.title, intro: meta.intro, entries: [entry], steps: [], match: [] });
		expect(text(run(set))).toBe('');
		entry.sources[1].evidence = 'Hold it warm.';
		expect(text(run(set))).toMatch(/the figure 60 stands in no source's evidence/);
		entry.sources = entry.sources.slice(0, 1);
		expect(text(run(set))).toMatch(/at least 2 source\(s\) in the safety chapter/);
	});

	it('once complete: every chapter written and fifteen entries a level', () => {
		const problems = text(run(seed, { complete: true }));
		expect(problems).toMatch(/CUISINE_COMPLETE: every chapter is written/);
		expect(problems).toMatch(/Sous Chef holds 0 entries; every level holds at least 15/);
		expect(problems).toMatch(/every mother links its entry/);
	});

	it('a chapter with no Commis entry', () => {
		expect(text(breakChapter('mother-sauces', (c) => c.entries.forEach((e: Loose) => (e.level = 2))))).toMatch(/holds no Commis entry/);
	});

	it('a duplicate stem or slug across chapters', () => {
		const set = clone(seed);
		const copy = structuredClone((seed.files.get('mother-sauces') as Loose).entries[1]);
		(set.files.get('creole-cajun') as Loose).entries.push(copy);
		const problems = text(run(set));
		expect(problems).toMatch(/the stem "bearnaise" is also mother-sauces\/bearnaise/);
		expect(problems).toMatch(/the slug "bearnaise" is also/);
	});
});

describe('the borrowed rules have not drifted from their sources', () => {
	const training = readFileSync(join(ROOT, 'tools/kitchen/check-training.mjs'), 'utf8');
	const engine = readFileSync(join(ROOT, 'tools/house/engine.mjs'), 'utf8');
	/* Our copies spell a dash as \u2014 so this repository's tools carry no dash character;
	   the comparison reads both spellings as the one code point. */
	const unescape = (s: string | undefined) => s?.replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
	const literal = (src: string, name: string) => unescape(src.match(new RegExp(`^(?:export )?const ${name} = (/.+/[a-z]*);$`, 'm'))?.[1]);

	it('matches tools/kitchen/check-training.mjs', () => {
		const ours: Record<string, RegExp> = { DASH_RE, NUMERAL_RE, AMERICAN_RE, IZE_RE, US_QTY_RE, METRIC_AFTER_RE };
		for (const [name, re] of Object.entries(ours)) expect(literal(training, name), name).toBe(unescape(re.toString()));
		const ize = training.match(/^const IZE_OK = new Set\((\[.*\])\);$/m)?.[1] ?? '[]';
		expect(JSON.parse(ize.replace(/'/g, '"'))).toEqual([...IZE_OK]);
	});

	it('matches tools/house/engine.mjs', () => {
		const ours: Record<string, RegExp> = { BANNED_WORDS, ALLERGEN_CLASS, ALLERGEN_POINTER, VERDICT };
		for (const [name, re] of Object.entries(ours)) expect(literal(engine, name), name).toBe(unescape(re.toString()));
	});

	it('reads the teaching folio ids the app ships', () => {
		expect(readFolios().map((f) => f.id)).toEqual(TEACHING_FOLIOS.map((f) => f.id));
		expect(readFolios().map((f) => f.title)).toEqual(TEACHING_FOLIOS.map((f) => f.title));
	});
});

describe('derive', () => {
	it('emits a chapter file only for a chapter that holds something', () => {
		const result = build({ today: TODAY, refs, ledger: readLedger() });
		const files = [...derive(result.set, result.generated.made, result.ids).keys()].map((p) => p.split(/[\\/]/).pop());
		expect(files).toContain('index.json');
		expect(files).toContain('ch-mother-sauces.json');
		expect(files).not.toContain('ch-safety.json');
	});
});
