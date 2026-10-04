/**
 * The Plates: twenty reviewed six-subject guides and their original archives.
 *
 * ## What it is
 *
 * The owner drew twenty posters, one subject each: the three cut charts
 * (chicken, pork, beef), the three fish cases (Pacific, Atlantic, Gulf), the
 * larder of five regions (a vegetable plate and a fruit plate each), the
 * spice rack, the mushrooms, the cheese board and the charcuterie board. Each
 * now ships a versioned six-subject illustration opened on demand, plus a
 * reviewed text guide that installs with the app. The original picture is
 * preserved in static/plates/archive/. Its complete transcription, panels,
 * corrections and links remain a separately presented archive. Only the
 * reviewed teaching guide supplies the quiz; old printed errors never do.
 *
 * ## The authored files
 *
 * tools/derive/plates/<slug>.json, one per plate, written by the
 * transcription run (an agent reads the image and writes the file, a second
 * re-reads the image against it, two fact-checkers hunt the plate's own
 * errors, a judge confirms each correction) and hand-editable afterwards.
 * images.json beside them is written by the encoder and records each image's
 * pixel size, which the page needs for a box that does not jump. The build
 * reads the files and never writes them.
 * teaching.json beside them contains a map from every plate slug to its
 * current title, intro, scope, six subjects in image order and primary source
 * links. It is independently validated and never inferred from the archive.
 *
 *   slug, title, kind      kind is one of KINDS
 *   tagline, corners,      the plate's own words around the subject, as
 *   regionLine, footer     printed, dots and bullets made commas
 *   groups[].items[]       every card on the plate: name (Title Case), an
 *                          optional sub (the parenthetical), an optional
 *                          printed (the plate's spelling when it is a
 *                          misprint of an evident item), and facts as
 *                          [label, value] pairs with the labels the kind
 *                          allows (FACT_LABELS)
 *   panels[]               the boxed lists: a title and its lines
 *   corrections[]          what the plate gets WRONG, confirmed: on (an item,
 *                          group or panel name on the plate, or one of its
 *                          parts: title, tagline, footer, corners), says (what it
 *                          prints), should (one plain sentence), why (one
 *                          sentence of evidence). Printed under the plate,
 *                          because a poster that teaches a wrong fact to a
 *                          new hire is worse than no poster, and the owner
 *                          would rather ship the picture with its errors
 *                          named than wait on a redraw
 *   illegible[]            what could not be read with confidence; reported
 *                          at build, never failed, never shown
 *
 * ## The gate
 *
 * The shape above, exactly; a kind from KINDS; fact labels from the kind's
 * list; no dash of any kind anywhere in the file (the app's rule: ranges are
 * "April to June"); no item named twice on one plate unless its sub differs;
 * every correction anchored to something on the plate; an image entry and
 * both image files on disk for every plate; every plate in ORDER and every
 * file in ORDER, so a plate cannot be added without a place on the wall.
 *
 * ## The links
 *
 * Every item is matched by name against the Floor Deck's terms and aliases
 * and the Lexicon's terms, folded the way slugs are, singular and plural
 * both, and only within the deck sections and Lexicon categories a plate of
 * that kind may draw from (LINKABLE): the oyster mushroom is not the oyster
 * in the fish case, and a lobster mushroom is not a lobster. On the three
 * cut charts a hit must also name the plate's own animal somewhere in its
 * text (ANIMAL), so a chicken tenderloin never lands on the beef card. A
 * hit gives the item a link: the reader taps "Ribeye" on the beef plate and
 * lands on the card. From the links, each plate learns which deck sections
 * and Lexicon categories it illustrates (two hits or more), and those pages
 * link back to the plate. Nothing is hand-mapped.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../slugify.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PLATES_DIR = join(HERE, 'plates');
export const IMAGES_DIR = join(HERE, '..', '..', 'static', 'plates');
export const PLATE_IMAGE_REVISION = 'v2';

/** Each folio may advance independently. Old URLs stay immutable for offline readers.
 *  @param {string} slug
 *  @param {unknown} [revision]
 */
export function plateImagePaths(slug, revision = PLATE_IMAGE_REVISION) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('plate image: invalid slug');
	if (typeof revision !== 'string' || !/^v[1-9]\d*$/.test(revision)) throw new Error(`plate image ${slug}: revision must be v followed by a positive integer`);
	return {
		src: `plates/${slug}-${revision}.webp`,
		thumb: `plates/${slug}-${revision}.thumb.webp`,
		archive: `plates/archive/${slug}.webp`
	};
}

/** The kinds, and how the wall groups them, in wall order. */
export const KINDS = [
	{ key: 'cuts', title: 'The cuts', blurb: 'Connect familiar portions to their place on the animal and the distinctions that matter in the kitchen.' },
	{ key: 'fish', title: 'The fish case', blurb: 'Compare selected fish and shellfish through body shape, markings and market names.' },
	{ key: 'produce', title: 'The larder by region', blurb: 'Five regional study selections: recognize the crop, its edible part and useful distinctions.' },
	{ key: 'pantry', title: 'The pantry', blurb: 'Look closely at spice forms and culinary mushrooms, with clear distinctions between familiar names.' },
	{ key: 'board', title: 'The board', blurb: 'Explore cheese through milk and maturation, and charcuterie through the cut and its preparation.' }
];

/** The fact labels each kind may use, in the order the page prints them. */
export const FACT_LABELS = {
	cuts: ['Cook'],
	fish: ['Cuts', 'Flavor', 'Best prep'],
	produce: ['Season', 'Where', 'Flavor'],
	pantry: ['Flavor', 'Use', 'Latin', 'Best uses'],
	board: ['Country', 'Style', 'Character']
};

/** The wall's order: kind by kind, and within a kind as listed. */
export const ORDER = [
	'chicken-cuts', 'pork-cuts', 'beef-cuts',
	'pacific-fish', 'atlantic-fish', 'gulf-coast-fish',
	'northwest-vegetables', 'northwest-fruits', 'southwest-vegetables', 'southwest-fruits',
	'midwest-vegetables', 'midwest-fruits', 'northeastern-vegetables', 'northeastern-fruits',
	'southeastern-vegetables', 'southeastern-fruits',
	'culinary-spices', 'culinary-mushrooms',
	'great-cheeses', 'charcuterie'
];

const DASH = /[\u2012\u2013\u2014\u2015]|--/;

/** Where a plate of each kind may link: deck sections and Lexicon categories. */
const LINKABLE = {
	cuts: { deck: ['cuts', 'cured', 'meats'], lexicon: ['Beef Cuts & Grades', 'Pork, Lamb & Poultry', 'Charcuterie Atlas'] },
	fish: { deck: ['fish'], lexicon: ['Fish & Shellfish'] },
	produce: { deck: [], lexicon: ['The Vegetable Atlas', 'The Fruit Atlas', 'The Herb & Chile Atlas', 'Vegetables & Produce', 'The Seasonal Larder', 'The Fungi Atlas'] },
	pantry: { deck: ['mushrooms', 'pantry', 'sauces'], lexicon: ['Spice Atlas', 'The Herb & Chile Atlas', 'The Fungi Atlas', 'The Global Pantry Atlas', 'Dairy, Cheese & Pantry'] },
	board: { deck: ['cured', 'dairy'], lexicon: ['Cheese Atlas', 'Charcuterie Atlas', 'Dairy, Cheese & Pantry'] }
};

/** The cut charts link only to a card or entry that names their animal at
 *  least as often as any other, or names none: a Flat Iron card that never
 *  says beef still links, the beef Tenderloin card that mentions pork once
 *  stays the beef plate's, and the pork plate's tenderloin links nowhere
 *  rather than there. */
const ANIMAL = {
	'chicken-cuts': { own: /\b(chicken|poultry|bird|hen)\b/gi, other: /\b(beef|steer|pork|pig|hog|lamb|veal|duck)\b/gi },
	'pork-cuts': { own: /\b(pork|pig|hog|swine)\b/gi, other: /\b(beef|steer|cattle|chicken|poultry|lamb|veal|duck)\b/gi },
	'beef-cuts': { own: /\b(beef|steer|cattle|cow|bovine)\b/gi, other: /\b(pork|pig|hog|chicken|poultry|lamb|veal|duck)\b/gi }
};

/** How many of a plate's items must link into a deck section or a Lexicon
 *  category before the plate is said to illustrate it. */
const SECTION_HITS = 2;

/**
 * One authored plate, as it is on disk. Missing is fatal: the wall lists
 * ORDER, and a plate on the wall with no file would 404.
 * @param {string} slug
 */
export function readPlate(slug) {
	const file = join(PLATES_DIR, `${slug}.json`);
	if (!existsSync(file)) throw new Error(`BUILD INPUT MISSING: ${file}`);
	return { file, text: readFileSync(file, 'utf8') };
}

/** An omitted revision retains the v2 edition; a new entry selects only that folio.
 *  @returns {Array<{ slug: string, revision?: string, width: number, height: number, full: number, thumb: number }>}
 */
export function readImages() {
	const file = join(PLATES_DIR, 'images.json');
	if (!existsSync(file)) throw new Error(`BUILD INPUT MISSING: ${file} (run the plate encoder)`);
	return JSON.parse(readFileSync(file, 'utf8'));
}

/** Reviewed copy is authored separately so no archive correction can silently
 *  become a current lesson. Missing or invalid guides stop data publication.
 *  @returns {Record<string, import('../../src/lib/types').PlateTeaching>}
 */
export function readTeaching() {
	const file = join(PLATES_DIR, 'teaching.json');
	if (!existsSync(file)) throw new Error(`BUILD INPUT MISSING: ${file}`);
	return JSON.parse(readFileSync(file, 'utf8'));
}

/** @param {string} slug @param {unknown} value @returns {string[]} */
export function checkTeaching(slug, value) {
	/** @type {string[]} */
	const problems = [];
	/** @param {string} message */
	const err = (message) => problems.push(`plates/${slug} teaching: ${message}`);
	/** @param {unknown} s */
	const nonempty = (s) => typeof s === 'string' && !!s.trim();
	if (!value || typeof value !== 'object' || Array.isArray(value)) return [`plates/${slug} teaching: guide must be an object`];
	const guide = /** @type {import('../../src/lib/types').PlateTeaching} */ (value);
	for (const key of Object.keys(guide)) if (!['title', 'intro', 'scope', 'subjects', 'sources'].includes(key)) err(`unknown key ${key}`);
	for (const key of ['title', 'intro', 'scope']) if (!nonempty(guide[/** @type {'title' | 'intro' | 'scope'} */ (key)])) err(`${key} must be non-empty`);
	if (DASH.test(JSON.stringify(guide))) err('use plain punctuation rather than long or doubled dashes');
	if (!Array.isArray(guide.subjects) || guide.subjects.length !== 6) err('exactly six subjects required in illustration order');
	const ids = new Set();
	const names = new Set();
	const summaries = new Set();
	for (const [i, s] of (Array.isArray(guide.subjects) ? guide.subjects : []).entries()) {
		if (!s || typeof s !== 'object') { err(`subject ${i + 1} must be an object`); continue; }
		for (const key of Object.keys(s)) if (!['id', 'name', 'summary', 'distinction', 'image', 'facts'].includes(key)) err(`subject ${i + 1}: unknown key ${key}`);
		for (const key of ['id', 'name', 'summary', 'distinction', 'image']) if (!nonempty(s[/** @type {'id' | 'name' | 'summary' | 'distinction' | 'image'} */ (key)])) err(`subject ${i + 1}: ${key} must be non-empty`);
		if (typeof s.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id)) err(`subject ${i + 1}: invalid id`);
		if (ids.has(s.id)) err(`duplicate subject id ${s.id}`);
		if (names.has(s.name)) err(`duplicate subject name ${s.name}`);
		if (summaries.has(s.summary)) err(`duplicate quiz description for ${s.name}`);
		ids.add(s.id); names.add(s.name); summaries.add(s.summary);
		if (!Array.isArray(s.facts) || !s.facts.length || s.facts.some((f) => !Array.isArray(f) || f.length !== 2 || !f.every(nonempty))) err(`subject ${i + 1}: facts must be non-empty label/value pairs`);
	}
	if (!Array.isArray(guide.sources) || !guide.sources.length) err('at least one primary source required');
	const urls = new Set();
	for (const source of Array.isArray(guide.sources) ? guide.sources : []) {
		if (!source || !nonempty(source.title) || !nonempty(source.url)) { err('source title and URL required'); continue; }
		try { if (new URL(source.url).protocol !== 'https:') err(`source must use HTTPS: ${source.url}`); }
		catch { err(`invalid source URL: ${source.url}`); }
		if (urls.has(source.url)) err(`duplicate source URL: ${source.url}`);
		urls.add(source.url);
	}
	return problems;
}

/**
 * Fold a name to the key the links are matched on: the slug, with a trailing
 * plural taken off so "Blueberries" meets "blueberry" and "Peppers" meets
 * "pepper". Names of one word under four letters are left alone.
 * @param {string} s
 */
export function foldName(s) {
	const slug = slugify(s);
	if (slug.length < 4) return slug;
	if (slug.endsWith('ies')) return slug.slice(0, -3) + 'y';
	if (/(?:ches|shes|sses|xes|oes)$/.test(slug)) return slug.slice(0, -2);
	if (slug.endsWith('s') && !slug.endsWith('ss')) return slug.slice(0, -1);
	return slug;
}

/**
 * Check one plate's authored file. Returns problems, notes (illegible bits,
 * reported and never failed) and, when clean, the emitted plate without
 * its links.
 *
 * @param {string} slug
 * @param {string} text the file's bytes
 * @param {Map<string, { width: number, height: number, revision?: string }>} images
 */
export function checkPlate(slug, text, images) {
	/** @type {string[]} */
	const problems = [];
	/** @type {string[]} */
	const notes = [];
	const where = `plates/${slug}.json`;
	const err = (/** @type {string} */ m) => problems.push(`${where}: ${m}`);

	if (DASH.test(text)) err('carries a dash (U+2013, U+2014 or a double hyphen): ranges are "April to June", clauses take a comma');

	/** @type {any} */
	let p;
	try {
		p = JSON.parse(text);
	} catch (e) {
		err(`not JSON: ${/** @type {Error} */ (e).message}`);
		return { problems, notes, plate: null };
	}
	if (!p || typeof p !== 'object') { err('not an object'); return { problems, notes, plate: null }; }

	const KEYS = ['slug', 'title', 'tagline', 'corners', 'kind', 'regionLine', 'groups', 'panels', 'footer', 'illegible', 'corrections'];
	for (const k of Object.keys(p)) if (!KEYS.includes(k)) err(`unknown key "${k}"`);
	for (const k of ['slug', 'title', 'kind', 'groups', 'panels', 'corners', 'corrections', 'illegible']) if (p[k] === undefined) err(`missing "${k}"`);
	if (p.slug !== slug) err(`slug is ${JSON.stringify(p.slug)}, the file is ${slug}`);
	if (typeof p.title !== 'string' || !p.title.trim()) err('title must be a non-empty string');
	const kind = KINDS.find((k) => k.key === p.kind);
	if (!kind) err(`kind ${JSON.stringify(p.kind)} is not one of ${KINDS.map((k) => k.key).join(', ')}`);
	const str = (/** @type {unknown} */ v) => v === null || v === undefined || typeof v === 'string';
	if (!str(p.tagline)) err('tagline must be a string or null');
	if (!str(p.regionLine)) err('regionLine must be a string or null');
	if (!str(p.footer)) err('footer must be a string or null');
	const strings = (/** @type {unknown} */ v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.trim());
	if (!strings(p.corners)) err('corners must be an array of non-empty strings');
	if (!strings(p.illegible)) err('illegible must be an array of strings');
	for (const line of p.illegible ?? []) notes.push(`${where}: could not read ${line}`);

	const allowed = new Set(kind ? FACT_LABELS[/** @type {keyof typeof FACT_LABELS} */ (kind.key)] : []);
	/** @type {Set<string>} */
	const names = new Set();
	/** @type {string[]} */
	const anchors = [];
	let count = 0;
	if (!Array.isArray(p.groups) || !p.groups.length) err('groups must be a non-empty array');
	for (const [gi, g] of (Array.isArray(p.groups) ? p.groups : []).entries()) {
		const gw = `groups[${gi}]`;
		if (!g || typeof g !== 'object') { err(`${gw}: not an object`); continue; }
		if (typeof g.title !== 'string') err(`${gw}: title must be a string (empty is allowed)`);
		else if (g.title.trim()) anchors.push(g.title.trim());
		if (!str(g.note)) err(`${gw}: note must be a string or null`);
		if (!Array.isArray(g.items) || !g.items.length) { err(`${gw}: items must be a non-empty array`); continue; }
		for (const [ii, it] of g.items.entries()) {
			const iw = `${gw}.items[${ii}]`;
			if (!it || typeof it !== 'object') { err(`${iw}: not an object`); continue; }
			for (const k of Object.keys(it)) if (!['name', 'printed', 'sub', 'facts'].includes(k)) err(`${iw}: unknown key "${k}"`);
			if (typeof it.name !== 'string' || !it.name.trim()) { err(`${iw}: name must be a non-empty string`); continue; }
			if (!/^[A-Z0-9À-Þ]/.test(it.name.trim())) err(`${iw}: "${it.name}" does not start with a capital: names are Title Case`);
			if (it.printed !== undefined && (typeof it.printed !== 'string' || it.printed === it.name)) err(`${iw}: printed is given only when the plate's spelling differs from the name`);
			if (!str(it.sub)) err(`${iw}: sub must be a string or null`);
			const key = `${it.name.trim().toLowerCase()}|${(it.sub ?? '').toLowerCase()}`;
			if (names.has(key)) err(`${iw}: "${it.name}" is on the plate twice with the same sub`);
			names.add(key);
			anchors.push(it.name.trim());
			count++;
			if (!Array.isArray(it.facts)) { err(`${iw}: facts must be an array of [label, value] pairs`); continue; }
			/** @type {Set<string>} */
			const labels = new Set();
			for (const f of it.facts) {
				if (!Array.isArray(f) || f.length !== 2 || typeof f[0] !== 'string' || typeof f[1] !== 'string') { err(`${iw}: a fact is not [label, value]`); continue; }
				if (!allowed.has(f[0])) err(`${iw}: fact label "${f[0]}" is not one of ${[...allowed].join(', ')} for a ${p.kind} plate`);
				if (labels.has(f[0])) err(`${iw}: fact "${f[0]}" given twice`);
				labels.add(f[0]);
				if (!f[1].trim()) err(`${iw}: fact "${f[0]}" is empty`);
			}
		}
	}
	if (count < 6) err(`${count} items: a plate holds at least six`);

	if (!Array.isArray(p.panels)) err('panels must be an array');
	for (const [pi, pan] of (Array.isArray(p.panels) ? p.panels : []).entries()) {
		const pw = `panels[${pi}]`;
		if (!pan || typeof pan !== 'object') { err(`${pw}: not an object`); continue; }
		for (const k of Object.keys(pan)) if (!['title', 'lines'].includes(k)) err(`${pw}: unknown key "${k}"`);
		if (typeof pan.title !== 'string' || !pan.title.trim()) err(`${pw}: title must be a non-empty string`);
		else anchors.push(pan.title.trim());
		if (!strings(pan.lines) || !pan.lines.length) err(`${pw}: lines must be a non-empty array of strings`);
	}

	if (!Array.isArray(p.corrections)) err('corrections must be an array');
	/* a correction may also be about the plate's own parts: its title line,
	   its tagline, its footer, or the words in its corners */
	const anchorSet = new Set([...anchors.map((a) => a.toLowerCase()), 'title', 'tagline', 'footer', 'corners', 'regionline']);
	for (const [ci, c] of (Array.isArray(p.corrections) ? p.corrections : []).entries()) {
		const cw = `corrections[${ci}]`;
		if (!c || typeof c !== 'object') { err(`${cw}: not an object`); continue; }
		for (const k of Object.keys(c)) if (!['on', 'says', 'should', 'why'].includes(k)) err(`${cw}: unknown key "${k}"`);
		for (const k of ['on', 'says', 'should', 'why']) if (typeof c[k] !== 'string' || !c[k].trim()) err(`${cw}: "${k}" must be a non-empty string`);
		if (typeof c.on === 'string' && !anchorSet.has(c.on.trim().toLowerCase())) err(`${cw}: "on" names ${JSON.stringify(c.on)}, which is not an item, group or panel on this plate`);
		if (typeof c.should === 'string' && !/[.!?]$/.test(c.should.trim())) err(`${cw}: "should" is a sentence and ends in a full stop`);
	}

	const image = images.get(slug);
	if (!image) err('no entry in plates/images.json: run the encoder');
	let paths;
	try {
		paths = plateImagePaths(slug, image?.revision);
		for (const path of Object.values(paths)) {
			if (!existsSync(join(IMAGES_DIR, '..', path))) err(`static/${path} is missing`);
		}
	} catch (e) {
		err(String(/** @type {Error} */ (e).message));
	}

	if (problems.length || !paths) return { problems, notes, plate: null };
	return {
		problems,
		notes,
		plate: {
			slug,
			title: p.title.trim(),
			tagline: p.tagline ?? null,
			kind: p.kind,
			kindTitle: kind?.title ?? p.kind,
			regionLine: p.regionLine ?? null,
			corners: p.corners,
			image: { src: paths.src, thumb: paths.thumb, width: image?.width ?? 0, height: image?.height ?? 0 },
			groups: p.groups.map((/** @type {any} */ g) => ({
				title: g.title.trim(),
				note: g.note ?? null,
				items: g.items.map((/** @type {any} */ it) => ({
					name: it.name.trim(),
					...(it.printed ? { printed: it.printed } : {}),
					sub: it.sub ?? null,
					facts: it.facts
				}))
			})),
			panels: p.panels.map((/** @type {any} */ pan) => ({ title: pan.title.trim(), lines: pan.lines })),
			footer: p.footer ?? null,
			corrections: p.corrections,
			count
		}
	};
}

/**
 * The twenty plates: read, gated, linked, in wall order.
 *
 * @param {{
 *   deck: Array<{ id: string, term: string, section: string, aliases?: string[], gist?: string, why?: string, note?: string, origin?: string }>,
 *   lexicon: Array<{ slug: string, term: string, category: string, definition?: string }>
 * }} ctx
 */
	export function buildPlates(ctx) {
	/** @type {string[]} */
	const problems = [];
	/** @type {string[]} */
	const notes = [];

	/** @type {Map<string, { width: number, height: number, revision?: string }>} */
	let images = new Map();
	try {
		images = new Map(readImages().map((r) => [r.slug, { width: r.width, height: r.height, revision: r.revision }]));
	} catch (e) {
		problems.push(String(/** @type {any} */ (e)?.message ?? e));
	}
	/** @type {Record<string, import('../../src/lib/types').PlateTeaching>} */
	let teaching = {};
	try {
		teaching = readTeaching();
		if (!teaching || typeof teaching !== 'object' || Array.isArray(teaching)) throw new Error('plates teaching: expected a map of plate slugs');
		for (const slug of Object.keys(teaching)) if (!ORDER.includes(slug)) problems.push(`plates teaching: unknown plate ${slug}`);
	} catch (e) {
		problems.push(String(/** @type {any} */ (e)?.message ?? e));
		teaching = {};
	}

	/* the links' targets, folded once; a name may reach several cards or
	   entries (a Tenderloin of beef and one of pork), and the kind decides */
	/** @type {Map<string, Array<{ id: string, section: string, text: string }>>} */
	const deckByName = new Map();
	for (const c of ctx.deck) {
		const text = [c.term, ...(c.aliases ?? []), c.gist, c.why, c.note, c.origin].filter(Boolean).join(' ');
		for (const n of [c.term, ...(c.aliases ?? [])]) {
			const k = foldName(n);
			const matches = deckByName.get(k) ?? [];
			matches.push({ id: c.id, section: c.section, text });
			deckByName.set(k, matches);
		}
	}
	/** @type {Map<string, Array<{ slug: string, category: string, text: string }>>} */
	const lexByName = new Map();
	for (const e of ctx.lexicon) {
		const k = foldName(e.term);
		const matches = lexByName.get(k) ?? [];
		matches.push({ slug: e.slug, category: e.category, text: `${e.term} ${e.definition ?? ''}` });
		lexByName.set(k, matches);
	}

	const seen = new Set(ORDER);
	if (seen.size !== ORDER.length) problems.push('plates: ORDER lists a slug twice');

	const plates = [];
	for (const slug of ORDER) {
		const teachingProblems = checkTeaching(slug, teaching[slug]);
		problems.push(...teachingProblems);
		let text = '';
		try {
			text = readPlate(slug).text;
		} catch (e) {
			problems.push(String(/** @type {any} */ (e)?.message ?? e));
			continue;
		}
		const r = checkPlate(slug, text, images);
		problems.push(...r.problems);
		notes.push(...r.notes);
		if (!r.plate || teachingProblems.length) continue;

		/** @type {Record<string, number>} */
		const sectionHits = {};
		/** @type {Record<string, number>} */
		const categoryHits = {};
		const may = /** @type {{deck: string[], lexicon: string[]}} */ (LINKABLE[/** @type {keyof typeof LINKABLE} */ (r.plate.kind)]);
		const animal = ANIMAL[/** @type {keyof typeof ANIMAL} */ (slug)];
		/** @param {string} text */
		const ownAnimal = (text) => {
			if (!animal) return true;
			const own = (text.match(animal.own) ?? []).length;
			const other = (text.match(animal.other) ?? []).length;
			return (own === 0 && other === 0) || (own > 0 && own >= other);
		};
		for (const g of r.plate.groups) {
			for (const it of g.items) {
				const keys = [foldName(it.name)];
				if (it.sub) keys.push(foldName(`${it.name} ${it.sub}`));
				/* a short sub is the plate's own alias ("Butter Beans (Lima Beans)",
				   "Southern Peas (Field Peas)"): a name in its own right, tried last */
				if (it.sub && it.sub.split(/\s+/).length <= 3 && !/[,:;]/.test(it.sub)) keys.push(foldName(it.sub));
				/** @type {{ deck?: string, lexicon?: string }} */
				const links = {};
				for (const k of keys) {
					const d = (deckByName.get(k) ?? []).find((c) => may.deck.includes(c.section) && ownAnimal(c.text));
					if (d && !links.deck) { links.deck = d.id; sectionHits[d.section] = (sectionHits[d.section] ?? 0) + 1; }
					const l = (lexByName.get(k) ?? []).find((e) => may.lexicon.includes(e.category) && ownAnimal(e.text));
					if (l && !links.lexicon) { links.lexicon = l.slug; categoryHits[l.category] = (categoryHits[l.category] ?? 0) + 1; }
				}
				if (Object.keys(links).length) /** @type {any} */ (it).links = links;
			}
		}
		plates.push({
			...r.plate,
			teaching: teaching[slug],
			deckSections: Object.keys(sectionHits).filter((s) => sectionHits[s] >= SECTION_HITS),
			lexiconCategories: Object.keys(categoryHits).filter((c) => categoryHits[c] >= SECTION_HITS)
		});
	}

	return { plates: { version: 1, kinds: KINDS, plates }, problems, notes };
}
