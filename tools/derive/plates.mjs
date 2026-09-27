/**
 * The Plates: twenty illustrated reference plates, transcribed in full.
 *
 * ## What it is
 *
 * The owner drew twenty posters, one subject each: the three cut charts
 * (chicken, pork, beef), the three fish cases (Pacific, Atlantic, Gulf), the
 * larder of five regions (a vegetable plate and a fruit plate each), the
 * spice rack, the mushrooms, the cheese board and the charcuterie board. Each
 * ships as an image the reader opens on demand (static/plates/<slug>.webp,
 * never precached: six megabytes of pictures do not belong in the install)
 * and as a TRANSCRIPTION that does install with the app: every card on the
 * plate, its facts as the plate prints them, the side panels, the corners
 * and the footer, so the plate can be searched, read by a screen reader,
 * quizzed, and read at all when the picture has not arrived.
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

/** The kinds, and how the wall groups them, in wall order. */
export const KINDS = [
	{ key: 'cuts', title: 'The cuts', blurb: 'Where on the animal a cut comes from, and how that decides the cooking.' },
	{ key: 'fish', title: 'The fish case', blurb: 'Three waters, the fish that come out of each, how they are cut and how they eat.' },
	{ key: 'produce', title: 'The larder by region', blurb: 'What grows where and when: five regions, a vegetable plate and a fruit plate each.' },
	{ key: 'pantry', title: 'The pantry', blurb: 'The spice rack and the mushroom basket, with what each one tastes of and where it goes.' },
	{ key: 'board', title: 'The board', blurb: 'The cheese board and the charcuterie board by name, country and character.' }
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

/** @returns {Array<{ slug: string, width: number, height: number, full: number, thumb: number }>} */
export function readImages() {
	const file = join(PLATES_DIR, 'images.json');
	if (!existsSync(file)) throw new Error(`BUILD INPUT MISSING: ${file} (run the plate encoder)`);
	return JSON.parse(readFileSync(file, 'utf8'));
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
 * @param {Map<string, { width: number, height: number }>} images
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
	for (const f of [`${slug}.webp`, `${slug}.thumb.webp`]) {
		if (!existsSync(join(IMAGES_DIR, f))) err(`static/plates/${f} is missing`);
	}

	if (problems.length) return { problems, notes, plate: null };
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
			image: { src: `plates/${slug}.webp`, thumb: `plates/${slug}.thumb.webp`, width: image?.width ?? 0, height: image?.height ?? 0 },
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

	/** @type {Map<string, { width: number, height: number }>} */
	let images = new Map();
	try {
		images = new Map(readImages().map((r) => [r.slug, { width: r.width, height: r.height }]));
	} catch (e) {
		problems.push(String(/** @type {any} */ (e)?.message ?? e));
	}

	/* the links' targets, folded once; a name may reach several cards or
	   entries (a Tenderloin of beef and one of pork), and the kind decides */
	/** @type {Map<string, Array<{ id: string, section: string, text: string }>>} */
	const deckByName = new Map();
	for (const c of ctx.deck) {
		const text = [c.term, ...(c.aliases ?? []), c.gist, c.why, c.note, c.origin].filter(Boolean).join(' ');
		for (const n of [c.term, ...(c.aliases ?? [])]) {
			const k = foldName(n);
			(deckByName.get(k) ?? deckByName.set(k, []).get(k)).push({ id: c.id, section: c.section, text });
		}
	}
	/** @type {Map<string, Array<{ slug: string, category: string, text: string }>>} */
	const lexByName = new Map();
	for (const e of ctx.lexicon) {
		const k = foldName(e.term);
		(lexByName.get(k) ?? lexByName.set(k, []).get(k)).push({ slug: e.slug, category: e.category, text: `${e.term} ${e.definition ?? ''}` });
	}

	const seen = new Set(ORDER);
	if (seen.size !== ORDER.length) problems.push('plates: ORDER lists a slug twice');

	const plates = [];
	for (const slug of ORDER) {
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
		if (!r.plate) continue;

		/** @type {Record<string, number>} */
		const sectionHits = {};
		/** @type {Record<string, number>} */
		const categoryHits = {};
		const may = LINKABLE[/** @type {keyof typeof LINKABLE} */ (r.plate.kind)];
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
			deckSections: Object.keys(sectionHits).filter((s) => sectionHits[s] >= SECTION_HITS),
			lexiconCategories: Object.keys(categoryHits).filter((c) => categoryHits[c] >= SECTION_HITS)
		});
	}

	return { plates: { version: 1, kinds: KINDS, plates }, problems, notes };
}
