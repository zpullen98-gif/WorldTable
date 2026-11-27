/* rules.mjs: the rules every Kitchen Fieldbook entry is held to, read by check-foundations.mjs and
   merge-staging.mjs alike, so the gate and the merger can never disagree about what a sound entry is.

   The Fieldbook is src/lib/data/culinary-foundations.json, "Your culinary terms": the owner's own
   hand written terms, read by src/lib/foundations.ts. It is not derived from the house pack, so what
   is written there survives any edition. published.json beside this file lists every entry that has
   been published, with its id, term and ref, which never change once published; people.json lists
   the living people no entry may name. No dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');
export const MAIN = path.join(ROOT, 'src', 'lib', 'data', 'culinary-foundations.json');
export const PUBLISHED = path.join(HERE, 'published.json');
export const PEOPLE = path.join(HERE, 'people.json');
export const STAGING = path.join(HERE, 'staging');
export const REL = (p) => path.relative(process.cwd(), p) || p;

/* The fields an entry may carry, and the ones it must. A new entry from staging must also carry the
   three the Thanksgiving work added: say, background and metAt. */
export const KNOWN_FIELDS = ['id', 'term', 'category', 'aliases', 'ref', 'relatedLexiconSlug', 'definition', 'guest', 'kitchen', 'compare', 'correction', 'sources', 'reviewedOn', 'say', 'background', 'metAt'];
export const REQUIRED_TEXT = ['id', 'term', 'category', 'definition', 'guest', 'kitchen', 'compare', 'reviewedOn'];
export const NEW_REQUIRED = ['say', 'background', 'metAt'];
/* A deepen patch may also carry sources, each { title, url }: they are appended to the entry's own,
   matched by url, and never take one away. */
export const DEEPEN_FIELDS = ['id', 'say', 'background', 'metAt', 'guest', 'sources'];
export const FIXED_FIELDS = ['id', 'term', 'ref'];
export const BACKGROUND_WORDS = [60, 200];

/* Every dash but the hyphen that joins a word: the hyphen, figure, en, em and bar dashes, the minus,
   the small and full width hyphens, their entities, a spaced hyphen and a doubled one. */
const DASH = new RegExp('[\\u2010-\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]|&[mn]dash;|&#821[12];|&#x201[34];|\\s-\\s|\\s-$|^-\\s|-{2}', 'i');
export const hasDash = (s) => DASH.test(s);

/* A price figure in any currency sign or word. */
const PRICE = /[$€£¥]\s?\d|\b\d+(?:[.,]\d+)?\s?(?:dollars?|cents?|usd|euros?)\b/i;
export const hasPrice = (s) => PRICE.test(s);

/* A plain respelling: words of syllables joined by single hyphens, each syllable all small letters or
   all capitals (the stressed one), words parted by single spaces, at least one stressed syllable. */
const SYLLABLE = '(?:[a-z]+|[A-Z]+)';
const WORD = `${SYLLABLE}(?:-${SYLLABLE})*`;
const SAY = new RegExp(`^${WORD}(?: ${WORD})*$`);
export const sayProblem = (s) => {
	if (!SAY.test(s)) return 'is not a plain respelling (letters, single spaces, hyphens joining syllables, each syllable all small or all capitals)';
	if (!/(?:^|[ -])[A-Z]+(?=$|[ -])/.test(s)) return 'marks no stress (write the stressed syllable in capitals)';
	return '';
};

export const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

/* The id a new entry must wear: its category, a hyphen, its term with every accent, space and mark
   squashed out. */
export const squash = (term) => term.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const idFor = (category, term) => `${category}-${squash(term)}`;

export function readJson(file, fail) {
	if (!fs.existsSync(file)) fail(`${REL(file)}: missing`);
	try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
	catch (e) { return fail(`${REL(file)}: not JSON: ${e.message}`); }
}
export const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

/* Arguments: every flag known, every valued flag followed by its value. */
export function parseArgs(args, flags, valued, fail) {
	const out = { _: [] };
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (!a.startsWith('-')) fail(`unexpected argument ${a}; see --help`);
		if (!flags.includes(a) && !valued.includes(a)) fail(`unknown argument ${a}; see --help`);
		if (valued.includes(a)) {
			if (i + 1 >= args.length || args[i + 1].startsWith('-')) fail(`${a} needs a value; see --help`);
			out[a] = path.resolve(args[++i]);
		} else out[a] = true;
	}
	return out;
}

/* The living people no entry may name, read from people.json: { "comment": "...", "names": [] }. */
export function peopleIn(people) {
	const names = Array.isArray(people?.names) ? people.names.filter((n) => typeof n === 'string' && n.trim()) : [];
	return names.map((name) => ({ name, re: new RegExp(`(?:^|[^\\p{L}])${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?=$|[^\\p{L}])`, 'iu') }));
}

/* The prose rules on one string: no dash, no price figure, nobody living named. */
function textProblems(where, s, people, push) {
	if (hasDash(s)) push(where, 'no dash', 'carries a dash; write it with a comma, a colon or a full stop');
	if (hasPrice(s)) push(where, 'no price', 'carries a price figure');
	for (const p of people) if (p.re.test(s)) push(where, 'nobody living', `names ${p.name}, who is on people.json`);
}

/* Every string in a value except a source's url, with its field path. */
function eachText(value, where, visit) {
	if (typeof value === 'string') return visit(where, value);
	if (Array.isArray(value)) return value.forEach((v, i) => eachText(v, `${where}[${i}]`, visit));
	if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (k !== 'url') eachText(v, where ? `${where}.${k}` : k, visit);
}

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().startsWith(v);

/* A source's url in one spelling, so two spellings of one page count as one: the URL parser's own form,
   host in small letters, or '' when it is no https url. */
export const sourceKey = (url) => { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };

/* A list of sources: each an object with a title and an https url and nothing else, no url twice. */
function sourceProblems(sources, label, push) {
	const urls = new Set();
	sources.forEach((s, i) => {
		if (!s || typeof s !== 'object' || Array.isArray(s)) return push(label, 'sources', `source ${i + 1} is not an object`);
		for (const k of Object.keys(s)) if (!['title', 'url'].includes(k)) push(label, 'sources', `source ${i + 1} carries an unknown field "${k}"`);
		if (!nonEmpty(s.title)) push(label, 'sources', `source ${i + 1} has no title`);
		const key = sourceKey(s.url);
		if (!key) push(label, 'sources', `source ${i + 1} has no https url`);
		else if (urls.has(key)) push(label, 'sources', `source ${i + 1} repeats the url ${s.url}`);
		else urls.add(key);
	});
}

/* The three optional fields' own rules, shared by a full entry and a deepen patch. */
function deepFieldProblems(e, label, push) {
	if (e.say !== undefined) {
		if (!nonEmpty(e.say)) push(label, 'say', 'is empty');
		else { const p = sayProblem(e.say); if (p) push(label, 'say', `"${e.say}" ${p}`); }
	}
	if (e.background !== undefined) {
		if (!nonEmpty(e.background)) push(label, 'background', 'is empty');
		else {
			const n = words(e.background);
			if (n < BACKGROUND_WORDS[0] || n > BACKGROUND_WORDS[1]) push(label, 'background', `runs ${n} words; it must run ${BACKGROUND_WORDS[0]} to ${BACKGROUND_WORDS[1]}`);
		}
	}
	if (e.metAt !== undefined && !nonEmpty(e.metAt)) push(label, 'metAt', 'is empty');
	if (e.guest !== undefined && !nonEmpty(e.guest)) push(label, 'guest', 'is empty');
}

/* One full entry. ctx: { categories: Set, published: Map id to {term, ref}, people, strict }. A
   published entry keeps the id it was published with; any other id must be idFor(category, term). */
export function entryProblems(e, ctx, push) {
	const label = e && typeof e === 'object' && nonEmpty(e.id) ? e.id : '(an entry without an id)';
	if (!e || typeof e !== 'object' || Array.isArray(e)) return push(label, 'shape', 'is not an object');
	for (const k of Object.keys(e)) if (!KNOWN_FIELDS.includes(k)) push(label, 'known fields', `carries an unknown field "${k}"`);
	for (const f of REQUIRED_TEXT) if (!nonEmpty(e[f])) push(label, 'required', `${f} is missing or empty`);
	if (ctx.strict) for (const f of NEW_REQUIRED) if (!nonEmpty(e[f])) push(label, 'required', `${f} is missing or empty (a new entry carries say, background and metAt)`);
	if (nonEmpty(e.reviewedOn) && !isDate(e.reviewedOn)) push(label, 'reviewedOn', `"${e.reviewedOn}" is not a date written YYYY MM DD with hyphens`);
	if (!Array.isArray(e.aliases) || e.aliases.some((a) => !nonEmpty(a))) push(label, 'aliases', 'must be a list of names, empty when there are none');
	if (e.correction !== undefined && typeof e.correction !== 'string') push(label, 'correction', 'must be text');
	if (e.ref !== undefined && !/^[ct]:\S+$/.test(e.ref)) push(label, 'ref', `"${e.ref}" is not c:<card id> or t:<lexicon slug>`);
	if (nonEmpty(e.category) && !ctx.categories.has(e.category)) push(label, 'category', `"${e.category}" is not a category of the file`);
	if (nonEmpty(e.id)) {
		if (!/^[a-z]+-[a-z0-9]+$/.test(e.id)) push(label, 'id', 'must be <category>-<squashed term>, small letters and digits');
		else if (nonEmpty(e.category) && !e.id.startsWith(e.category + '-')) push(label, 'id', `must begin with its category, "${e.category}-"`);
		else if (!ctx.published.has(e.id) && nonEmpty(e.category) && nonEmpty(e.term) && e.id !== idFor(e.category, e.term)) push(label, 'id', `must be "${idFor(e.category, e.term)}", its category and its squashed term`);
	}
	if (!Array.isArray(e.sources) || !e.sources.length) push(label, 'sources', 'there must be at least one source');
	else sourceProblems(e.sources, label, push);
	deepFieldProblems(e, label, push);
	eachText(e, '', (where, s) => textProblems(where, s, ctx.people, (w, rule, said) => push(label, rule, `${w} ${said}`)));
}

/* The whole file: categories sound and unique, ids unique, every entry sound, entries kept in their
   category's order, and every published entry still there with the term and ref it was published with. */
export function fileProblems(data, published, people, push) {
	if (!data || !Array.isArray(data.categories) || !Array.isArray(data.entries)) return push('(the file)', 'shape', 'needs categories and entries lists');
	const categories = new Set();
	for (const c of data.categories) {
		const label = `category ${c?.id ?? '(no id)'}`;
		if (!nonEmpty(c?.id) || !/^[a-z]+$/.test(c.id)) push(label, 'category', 'needs an id of small letters');
		else if (categories.has(c.id)) push(label, 'category', 'is listed twice');
		else categories.add(c.id);
		for (const f of ['title', 'intro']) if (!nonEmpty(c?.[f])) push(label, 'category', `${f} is missing or empty`);
		eachText({ title: c?.title, intro: c?.intro }, '', (where, s) => textProblems(where, s, people, (w, rule, said) => push(label, rule, `${w} ${said}`)));
	}
	const ctx = { categories, published, people, strict: false };
	const seen = new Set();
	for (const e of data.entries) {
		entryProblems(e, ctx, push);
		if (nonEmpty(e?.id)) { if (seen.has(e.id)) push(e.id, 'unique ids', 'is used twice'); seen.add(e.id); }
	}
	const order = data.categories.map((c) => c?.id);
	let last = -1;
	for (const e of data.entries) {
		const at = order.indexOf(e?.category);
		if (at < 0) continue;
		if (at < last) { push(e.id, 'category order', `sits after a later category's entries; entries are kept in the categories' order`); break; }
		last = at;
	}
	const byId = new Map(data.entries.filter((e) => nonEmpty(e?.id)).map((e) => [e.id, e]));
	for (const [id, was] of published) {
		const now = byId.get(id);
		if (!now) { push(id, 'published', 'was published and is gone; a published id never changes'); continue; }
		if (now.term !== was.term) push(id, 'published', `term reads "${now.term}", published as "${was.term}"; a published term never changes`);
		if ((now.ref ?? null) !== (was.ref ?? null)) push(id, 'published', `ref reads ${now.ref ?? 'none'}, published as ${was.ref ?? 'none'}; a published ref never changes`);
	}
}

/* published.json read into a map. */
export function publishedMap(published) {
	return new Map((Array.isArray(published?.entries) ? published.entries : []).map((p) => [p.id, { term: p.term, ref: p.ref ?? null }]));
}

/* One staging file against the main file: { chunk, new: [full entries], deepen: [patches] }. A new
   entry already in the main file with the same content is merged already; with other content its id
   is taken. A deepen patch names an entry of the main file by its id, carries say, background and
   metAt and perhaps guest and sources, and never touches term or ref. */
export function stagingProblems(staging, data, published, people, push) {
	if (!staging || typeof staging !== 'object' || Array.isArray(staging)) return push('(the staging file)', 'shape', 'is not an object');
	for (const k of Object.keys(staging)) if (!['chunk', 'new', 'deepen'].includes(k)) push('(the staging file)', 'shape', `carries an unknown key "${k}"`);
	if (!nonEmpty(staging.chunk) || !/^[a-z0-9]+$/i.test(staging.chunk)) push('(the staging file)', 'chunk', 'needs a chunk name of letters and digits, for example "t1"');
	for (const k of ['new', 'deepen']) if (staging[k] !== undefined && !Array.isArray(staging[k])) push('(the staging file)', 'shape', `${k} must be a list`);
	const categories = new Set((data.categories || []).map((c) => c.id));
	const byId = new Map((data.entries || []).map((e) => [e.id, e]));
	const ctx = { categories, published, people, strict: true };
	const seen = new Set();
	for (const e of Array.isArray(staging.new) ? staging.new : []) {
		entryProblems(e, ctx, push);
		if (!nonEmpty(e?.id)) continue;
		if (seen.has(e.id)) push(e.id, 'unique ids', 'is staged twice');
		seen.add(e.id);
		if (byId.has(e.id) && JSON.stringify(byId.get(e.id)) !== JSON.stringify(e)) push(e.id, 'unique ids', 'is already an entry of the file with other content; deepen it instead');
	}
	for (const d of Array.isArray(staging.deepen) ? staging.deepen : []) {
		const label = nonEmpty(d?.id) ? d.id : '(a deepen patch without an id)';
		if (!d || typeof d !== 'object' || Array.isArray(d)) { push(label, 'shape', 'is not an object'); continue; }
		for (const k of Object.keys(d)) {
			if (FIXED_FIELDS.includes(k) && k !== 'id') push(label, 'fixed fields', `a deepen patch never touches ${k}`);
			else if (!DEEPEN_FIELDS.includes(k)) push(label, 'deepen fields', `carries "${k}"; a patch carries id, say, background, metAt and perhaps guest and sources`);
		}
		if (d.sources !== undefined) {
			if (!Array.isArray(d.sources) || !d.sources.length) push(label, 'sources', 'must be a list of at least one { title, url } when a patch carries it');
			else sourceProblems(d.sources, label, push);
		}
		if (!nonEmpty(d.id)) push(label, 'required', 'id is missing or empty');
		else if (!byId.has(d.id)) push(label, 'deepen', 'names no entry of the file');
		if (seen.has(d.id)) push(label, 'deepen', 'is deepened twice, or staged new and deepened, in one file');
		if (nonEmpty(d.id)) seen.add(d.id);
		for (const f of NEW_REQUIRED) if (!nonEmpty(d[f])) push(label, 'required', `${f} is missing or empty`);
		deepFieldProblems(d, label, push);
		eachText(Object.fromEntries(Object.entries(d).filter(([k]) => k !== 'id')), '', (where, s) => textProblems(where, s, people, (w, rule, said) => push(label, rule, `${w} ${said}`)));
	}
}
