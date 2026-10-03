/* engine.mjs: the House engine (oot-house.js, a classic browser script) loaded with node:vm into a
   context whose window has no indexedDB, so OOT.house installs over a Map and OOT.houseLib carries
   every pure function the tools call. Shared by validate-pack, keep-all and check-pack; the builder
   and the parser's check load it the same way on their own.

   Also the counts every gate asserts over the Brennan's house, in one place, the walk that
   collects every string with its path, and the American spelling map: the guide is American
   English and so is every house field, while the research's forThePack sentences are British, so
   the builder maps each British form it knows to the American one as the string enters the pack
   and check-pack refuses any that remains. No dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, '..');
export const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
export const DIR = path.join(HERE, 'brennans');
export const GUIDE = path.join(DIR, 'guide.txt');
export const RESEARCH = path.join(DIR, 'research');
export const HOUSE_JSON = path.join(DIR, 'house.json');
export const PACK = path.join(HERE, '..', '..', 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
export const REL = (p) => (typeof p === 'string' && p ? path.relative(process.cwd(), p) || p : '(none)');

/* The flags a tool knows, against what it was given: any other --flag, and any bare word that is
   not the value of a flag that takes one, is refused with the rule named, so a misspelt flag never
   passes or fails for the wrong reason. `valued` lists the flags whose next argument is a value. */
export function checkArgs(args, known, valued, fail) {
	const take = new Set(valued || []);
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a.startsWith('-')) {
			if (!known.includes(a)) fail(`unknown argument ${a}; see --help`);
			if (take.has(a)) {
				if (i + 1 >= args.length || args[i + 1].startsWith('-')) fail(`${a} needs a value; see --help`);
				i++;
			}
		} else fail(`unexpected argument ${a}; see --help`);
	}
}

export function loadEngine(fail) {
	if (!fs.existsSync(ENGINE)) fail(`${REL(ENGINE)}: the engine is missing`);
	const window = {};
	window.window = window;
	window.self = window;
	const ctx = vm.createContext({ window, console });
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), ctx, { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	if (!lib || typeof lib.validateHouse !== 'function') fail(`${REL(ENGINE)}: window.OOT.houseLib is not there after the script ran`);
	return lib;
}

/* The counts the Brennan's pack must carry: 47 dishes, 5 signature drinks and 2 spirit-free drinks
   (54 in all), 20 wines, 2 tastings, 13 sources, at least 60 terms, at least 28 scenarios, 4 or more
   mix-ups, the must-knows, a lineup register, and the five disputes the plan names. */
export function countProblems(house) {
	const out = [];
	const n = (list) => (Array.isArray(house[list]) ? house[list].length : 0);
	const zero = (house.cocktails || []).filter((c) => c.zeroProof === true).length;
	const eq = (what, got, want) => { if (got !== want) out.push(`${what}: ${got}, expected ${want}`); };
	const ge = (what, got, want) => { if (got < want) out.push(`${what}: ${got}, expected at least ${want}`); };
	eq('dishes', n('dishes'), 47);
	eq('cocktails', n('cocktails'), 7);
	eq('spirit-free cocktails', zero, 2);
	eq('dishes and cocktails in all', n('dishes') + n('cocktails'), 54);
	eq('wines', n('wines'), 20);
	eq('tastings', n('tastings'), 2);
	eq('sources', (house.sources || []).length, 13);
	ge('terms', n('lexicon'), 60);
	ge('scenarios', n('scenarios'), 28);
	ge('mix-ups', n('mixUps'), 4);
	ge('must-knows', n('mustKnows'), 12);
	ge('askAtLineup', n('askAtLineup'), 1);
	const pairings = (house.dishes || []).filter((d) => d.pairing && d.pairing.value && d.pairing.value.wineId).length;
	eq('pairings', pairings, 35);
	const disputeText = JSON.stringify(house.disputes || []).toLowerCase();
	for (const [name, re] of [
		['the Hussarde Champagne', /lafitte/],
		['the lobster pour', /meursault|fichet/],
		['the duck course', /rohan/],
		['the Rare vintage', /2013/],
		['the house Champagne price', /\$30/]
	]) if (!re.test(disputeText)) out.push(`disputes: ${name} is not among them`);
	if (!house.menusReadOn) out.push('menusReadOn is empty');
	if (house.began !== 'pack') out.push(`began is ${house.began}, expected pack`);
	if (!house.pack || house.pack.version !== 1) out.push('pack stamp missing or not version 1');
	for (const step of ['card', 'menus', 'filed', 'formula', 'pairings', 'wines', 'lexicon', 'scenarios']) {
		if (!house.build || typeof house.build[step] !== 'number') out.push(`build.${step} is not stamped`);
	}
	return out;
}

/* The British spellings the research writes and the American forms the house's English wants, as
   whole words, each with its common endings. The list is explicit rather than a rule over every
   -ise or -our, because wise, noise, promise, hour and flour are not British. A capital first
   letter is kept. */
const BRITISH = [
	['litre', 'liter'], ['labelled', 'labeled'], ['labelling', 'labeling'], ['per cent', 'percent'],
	['centre', 'center'], ['centred', 'centered'], ['kilometre', 'kilometer'], ['metre', 'meter'],
	['apologise', 'apologize'], ['apologised', 'apologized'], ['apologises', 'apologizes'], ['apologising', 'apologizing'],
	['moralise', 'moralize'], ['moralising', 'moralizing'], ['favourite', 'favorite'], ['theatre', 'theater'],
	['programme', 'program'], ['organise', 'organize'], ['organised', 'organized'], ['organises', 'organizes'], ['organising', 'organizing'], ['organisation', 'organization'],
	['ageing', 'aging'], ['flavour', 'flavor'], ['flavourful', 'flavorful'], ['flavoured', 'flavored'], ['colour', 'color'], ['coloured', 'colored'],
	['savoury', 'savory'], ['honour', 'honor'], ['humour', 'humor'], ['labour', 'labor'], ['neighbour', 'neighbor'], ['behaviour', 'behavior'],
	['vigour', 'vigor'], ['rigour', 'rigor'], ['odour', 'odor'], ['harbour', 'harbor'], ['candour', 'candor'],
	['realise', 'realize'], ['realised', 'realized'], ['recognise', 'recognize'], ['recognised', 'recognized'],
	['caramelise', 'caramelize'], ['caramelised', 'caramelized'], ['specialise', 'specialize'], ['specialised', 'specialized'],
	['emphasise', 'emphasize'], ['emphasised', 'emphasized'], ['criticise', 'criticize'], ['prioritise', 'prioritize'], ['summarise', 'summarize'],
	['travelled', 'traveled'], ['travelling', 'traveling'], ['cancelled', 'canceled'], ['modelled', 'modeled'],
	['defence', 'defense'], ['licence', 'license'], ['practise', 'practice'], ['practised', 'practiced'],
	['mould', 'mold'], ['draught', 'draft'], ['grey', 'gray'], ['jewellery', 'jewelry'], ['sulphite', 'sulfite'], ['sulphur', 'sulfur'],
	['yoghurt', 'yogurt'], ['sceptical', 'skeptical'], ['catalogue', 'catalog'], ['aluminium', 'aluminum'], ['enquire', 'inquire'], ['enquiry', 'inquiry'],
	['whilst', 'while'], ['amongst', 'among'], ['storey', 'story'], ['tyre', 'tire'], ['kerb', 'curb'], ['cheque', 'check']
];
const BRITISH_RE = new RegExp('\\b(' + BRITISH.map((b) => b[0]).join('|') + ')(s?)\\b', 'gi');
const AMERICAN = new Map(BRITISH);
/* The string with every British form above in its American spelling, and the forms it found. */
export function americanise(s) {
	if (typeof s !== 'string' || !s) return { out: s, found: [] };
	const found = [];
	const out = s.replace(BRITISH_RE, (m, word, plural) => {
		const to = AMERICAN.get(word.toLowerCase());
		if (!to) return m;
		found.push(word + plural);
		const cased = /^[A-Z]/.test(word) ? to.charAt(0).toUpperCase() + to.slice(1) : to;
		return cased + plural;
	});
	return { out, found };
}
/* The British forms a string still carries, for the gate. */
export function britishWords(s) {
	return americanise(s).found;
}

/* Every string in a value, with its path in the client's spelling. */
export function eachString(value, where, visit) {
	if (typeof value === 'string') { visit(where, value); return; }
	if (!value || typeof value !== 'object') return;
	if (Array.isArray(value)) { value.forEach((v, i) => eachString(v, where + '[' + i + ']', visit)); return; }
	for (const k of Object.keys(value)) eachString(value[k], where + '.' + k, visit);
}

/* The record a problem path points at, named for a reader: "dishes[3] Eggs Hussarde .lines.value.s45". */
export function describe(house, problemPath) {
	const m = problemPath.match(/^house\.(\w+)\[(\d+)\](.*)$/);
	if (!m) return problemPath.replace(/^house\./, '');
	const row = (house[m[1]] || [])[Number(m[2])];
	const name = row ? row.name || row.term || row.title || row.question || row.field || row.id : '?';
	return `${m[1]}[${m[2]}] ${name}${m[3]}`;
}

/* The proper-noun flags, each name looked for in the guide and the research so a reader sees which
   were answered by a source and which were not. */
export function answerNames(problems) {
	const sources = [];
	if (fs.existsSync(GUIDE)) sources.push(fs.readFileSync(GUIDE, 'utf8'));
	if (fs.existsSync(RESEARCH)) for (const f of fs.readdirSync(RESEARCH)) sources.push(fs.readFileSync(path.join(RESEARCH, f), 'utf8'));
	const hay = sources.join('\n').replace(/\u2013/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").toLowerCase();
	const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").toLowerCase();
	const names = new Map();
	for (const p of problems) {
		if (p.code !== 'proper-noun') continue;
		const m = p.said.match(/^the name (.+?) is nowhere in the house/);
		if (!m) continue;
		const name = m[1];
		if (!names.has(name)) names.set(name, { name, count: 0, answered: hay.indexOf(fold(name)) >= 0 || hay.indexOf(fold(name.replace(/[\u2019']s?$/, ''))) >= 0, where: [] });
		const r = names.get(name);
		r.count++;
		if (r.where.length < 3) r.where.push(p.path);
	}
	return [...names.values()].sort((a, b) => a.name.localeCompare(b.name));
}
