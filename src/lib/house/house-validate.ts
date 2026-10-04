/**
 * house-validate.ts: what is wrong with a House, named by path and code,
 * and which of it stops a pack.
 *
 * Every comment in this file ships inside the ported static/shared/oot-house.js
 * (tools/port-house.mjs transpiles with comments kept, and its assertClean
 * refuses any dash spelling, a carriage return and a regex literal outside
 * ASCII), so the comments here are dash-free and every regex is ASCII.
 *
 * PURE AND PORTABLE: no import from outside src/lib/house, no DOM, no Node.
 * The port joins every house module inside one IIFE, so each top-level name
 * here is unique across the directory.
 *
 * THE CODES. 'forbidden' is a key the client would refuse; 'dash' a dash in
 * any spelling in any string the house owns; 'word-cap' a timed line over
 * its cap; 'ref' an id that points at nothing in this house; 'principles' a
 * pairing principle outside the nine; 'price' a printed price that does not
 * stand on the page it was read from, by the client's own rule; and
 * 'allergen-talk' a line of hers that speaks of allergens; and 'tier' a
 * bottle tier that breaks its rule (a wine not on the bottle list, a price
 * outside the tier's band, a half bottle that is not HALF_SIZE, a tier with
 * no why or no line to say); and 'video' a video whose link is not a video
 * link by videoUrlOk, or that has no title or no why; 'component' a
 * component whose kind is outside COMPONENT_KINDS, or with no name, or whose
 * card lacks a front or a back; and 'compare' an item's comparisons past
 * COMPARE_MAX, an entry whose app is outside COMPARE_APPS, a classic that
 * carries a ref, an in-app entry with none, or an entry with no label, same
 * or different. Those eleven are FATAL_CODES, the default list, and a pack builder passes exactly that. A
 * tier's why and line over BOTTLE_WORDS are 'word-cap', and so is a video's
 * why over VIDEO_WHY_WORDS; a tier naming no house wine is 'ref', and so is
 * a video's item or term that is not in the house; a component's explanation
 * over COMPONENT_WORDS.explain, its card's front or back over theirs, and a
 * comparison's label, same or different over COMPARE_WORDS are 'word-cap';
 * a component's item or term, a video's component and a codex comparison
 * naming a house wine id that the house lacks are 'ref'.
 * Three more are advisory and NEVER fatal, whatever list a caller hands in:
 * 'service-note', a person's note that names an allergen without the word
 * confirm (the note is theirs and stands; the flag reminds them to confirm
 * it at lineup); 'proper-noun', a capitalised word in a line of hers that
 * appears nowhere in the house's own words (a name she may have invented);
 * and 'quote', a quoted span of eight words or more in a line of hers (only
 * the bank may be quoted, and a reader should look).
 *
 * The validator reads a House the normaliser has already shaped; it names
 * problems and changes nothing. Three rules are the client's, copied here so
 * the same code decides in a wing, in the Table and in a Node check: the key
 * sweep (forbiddenKeys, in house-normalise.ts), the dash (house-lines.ts)
 * and onPage, the rule that 12 is not on a page that prints only 12.50.
 */
import { BOTTLE_TIERS, BOTTLE_WORDS, COMPARE_APPS, COMPARE_MAX, COMPARE_WORDS, COMPONENT_KINDS, COMPONENT_WORDS, HALF_SIZE, HOUSE_LISTS, MARK_FIELDS, PRINCIPLES, VIDEO_WHY_WORDS, foldSize, inBottleBand, isMark, printedDollars, videoUrlOk, wineListOf } from './house-schema';
import type { House, HouseList, Lines, Mark } from './house-schema';
import { forbiddenKeys } from './house-normalise';
import { hasDash, lineProblems, wordCount } from './house-lines';

/* -------------------------------------------------------------------------
 * The codes, the rules
 * ---------------------------------------------------------------------- */

export type ProblemCode =
	| 'forbidden'
	| 'dash'
	| 'word-cap'
	| 'ref'
	| 'principles'
	| 'price'
	| 'allergen-talk'
	| 'tier'
	| 'video'
	| 'component'
	| 'compare'
	| 'service-note'
	| 'proper-noun'
	| 'quote';

export interface Problem {
	path: string;
	code: ProblemCode;
	said: string;
	fatal: boolean;
}

/** The codes that stop a pack, and the default `fatal` list. */
export const FATAL_CODES: readonly ProblemCode[] = ['forbidden', 'dash', 'word-cap', 'ref', 'principles', 'price', 'allergen-talk', 'tier', 'video', 'component', 'compare'];

/** The codes that are advice and never fatal, whatever list a caller hands in. */
export const NEVER_FATAL: readonly ProblemCode[] = ['service-note', 'proper-noun', 'quote'];

/** The client's ALLERGEN_TALK: a line of hers that strays onto allergens is refused, by the code and not the prompt. */
export const ALLERGEN_TALK = /allerg|intoleran/i;

/**
 * The words a person's service note may carry that should end in a confirm:
 * the allergen names a floor hears. Wide on purpose (it also catches minute,
 * veggie and selfish), because the flag is advice and never fatal.
 */
export const ALLERGEN_WORD = /allerg|gluten|dairy|nut|shellfish|egg|soy|sesame|peanut|fish|celery|mustard|lupin|sulph/i;

/** A quoted span this long or longer in a line of hers is flagged for a reader to check against the bank. */
export const QUOTE_WORDS = 8;

/* -------------------------------------------------------------------------
 * The client's price rule, copied
 * ---------------------------------------------------------------------- */

function foldSpace(s: unknown): string {
	return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

function isDigit(c: string): boolean {
	return c >= '0' && c <= '9';
}

/**
 * A price is on the page only when it stands on its own digits: 12 is not
 * on a page that prints only 12.50, and a 5 oz pour is not on a page that
 * prints only 15 oz, though both are substrings. Every occurrence is
 * walked, and one counts when the character before it is not a digit and
 * not a separator sitting between digits (the 50 inside 9.50; a comma
 * after a word, as in "Bread,12", binds nothing), and the character after
 * it is not a digit and not a separator with a digit behind it (the 12
 * inside 12.50). Copied from the client's onPage; the test holds it against
 * the client's source.
 */
export function onPage(hay: string, needle: string): boolean {
	if (needle === '') return true;
	let from = 0;
	let at: number;
	while ((at = hay.indexOf(needle, from)) >= 0) {
		const before = at > 0 ? hay.charAt(at - 1) : '';
		const before2 = at > 1 ? hay.charAt(at - 2) : '';
		const after = hay.charAt(at + needle.length);
		const after2 = hay.charAt(at + needle.length + 1);
		const leftOk = !isDigit(before) && !((before === '.' || before === ',') && isDigit(before2));
		const rightOk = !isDigit(after) && !((after === '.' || after === ',') && isDigit(after2));
		if (leftOk && rightOk) return true;
		from = at + 1;
	}
	return false;
}

/* -------------------------------------------------------------------------
 * Walking the house
 * ---------------------------------------------------------------------- */

type Add = (path: string, code: ProblemCode, said: string) => void;
type Raw = Record<string, unknown>;

/** A list on the house, or nothing when a hand-made record left it out. */
function listOf(house: House, list: HouseList): Raw[] {
	const v = (house as unknown as Raw)[list];
	return Array.isArray(v) ? (v as Raw[]) : [];
}

/** Every string at every depth, with its path in the client's spelling: house.dishes[0].lines.value.s45. */
function eachString(value: unknown, path: string, visit: (path: string, s: string) => void): void {
	if (typeof value === 'string') {
		visit(path, value);
		return;
	}
	if (!value || typeof value !== 'object') return;
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) eachString(value[i], path + '[' + i + ']', visit);
		return;
	}
	for (const k of Object.keys(value)) eachString((value as Raw)[k], path + '.' + k, visit);
}

const ITEM_LISTS: readonly HouseList[] = ['dishes', 'wines', 'cocktails'];

/** Every dish, wine and cocktail with its path and list. */
function eachItem(house: House, visit: (item: Raw, path: string, list: HouseList) => void): void {
	for (const list of ITEM_LISTS) {
		const rows = listOf(house, list);
		for (let i = 0; i < rows.length; i++) visit(rows[i], 'house.' + list + '[' + i + ']', list);
	}
}

/** Every mark on the house (the card's history and every mark field of every list), with its path and the record it sits on. */
function eachMark(house: House, visit: (mark: Mark<unknown>, path: string, owner: Raw, list: HouseList | 'house') => void): void {
	const card = house as unknown as Raw;
	for (const field of MARK_FIELDS.house) {
		const m = card[field];
		if (isMark(m)) visit(m, 'house.' + field, card, 'house');
	}
	for (const list of HOUSE_LISTS) {
		const fields: readonly string[] = MARK_FIELDS[list];
		if (!fields.length) continue;
		const rows = listOf(house, list);
		for (let i = 0; i < rows.length; i++) {
			for (const field of fields) {
				const m = rows[i][field];
				if (isMark(m)) visit(m, 'house.' + list + '[' + i + '].' + field, rows[i], list);
			}
		}
	}
}

function idSet(rows: Raw[]): Set<string> {
	const out = new Set<string>();
	for (const r of rows) if (typeof r.id === 'string') out.add(r.id);
	return out;
}

/* -------------------------------------------------------------------------
 * The checks, one per code
 * ---------------------------------------------------------------------- */

function checkForbidden(house: House, add: Add): void {
	for (const p of forbiddenKeys(house, 'house', [])) add(p, 'forbidden', 'a key the client refuses');
}

function checkDashes(house: House, add: Add): void {
	eachString(house, 'house', (path, s) => {
		if (hasDash(s)) add(path, 'dash', 'carries a dash; the house takes a comma or a colon');
	});
}

function checkWordCaps(house: House, add: Add): void {
	eachItem(house, (item, path) => {
		const lines = item.lines;
		if (!isMark(lines) || !lines.value || typeof lines.value !== 'object') return;
		for (const p of lineProblems(lines.value as Lines)) {
			add(path + '.lines.value.' + p.field, 'word-cap', p.words + ' words; the cap on ' + p.field + ' is ' + p.cap);
		}
	});
}

/**
 * Every id in the house that must point at something in the house. Empty is
 * allowed only where the plan allows it: a second pick, a zero-proof pick,
 * a course's pour and a dispute's item.
 */
function checkRefs(house: House, add: Add): void {
	const dishes = idSet(listOf(house, 'dishes'));
	const wines = idSet(listOf(house, 'wines'));
	const cocktails = idSet(listOf(house, 'cocktails'));
	const zero = new Set<string>();
	for (const c of listOf(house, 'cocktails')) if (typeof c.id === 'string' && c.zeroProof === true) zero.add(c.id);
	const items = new Set<string>([...dishes, ...wines, ...cocktails]);
	const pours = new Set<string>([...wines, ...cocktails]);

	const ref = (path: string, id: unknown, pool: Set<string>, what: string, emptyOk: boolean): void => {
		if (id === '' && emptyOk) return;
		if (typeof id !== 'string' || !id) {
			add(path, 'ref', 'needs ' + what + ' and has none');
			return;
		}
		if (!pool.has(id)) add(path, 'ref', id + ' is not ' + what + ' in this house');
	};
	const refs = (path: string, ids: unknown, pool: Set<string>, what: string): void => {
		if (!Array.isArray(ids)) return;
		for (let i = 0; i < ids.length; i++) ref(path + '[' + i + ']', ids[i], pool, what, false);
	};

	eachItem(house, (item, path, list) => {
		if (list === 'dishes' && isMark(item.pairing) && item.pairing.value && typeof item.pairing.value === 'object') {
			const p = item.pairing.value as Raw;
			const at = path + '.pairing.value.';
			ref(at + 'wineId', p.wineId, wines, 'a house wine', false);
			ref(at + 'secondId', p.secondId, wines, 'a house wine', true);
			ref(at + 'zeroProofId', p.zeroProofId, zero, 'a zero-proof house cocktail', true);
			const bottles = p.bottles;
			if (bottles && typeof bottles === 'object') {
				for (const tier of BOTTLE_TIERS) {
					const pick = (bottles as Raw)[tier];
					if (pick && typeof pick === 'object') ref(at + 'bottles.' + tier + '.wineId', (pick as Raw).wineId, wines, 'a house wine', false);
				}
			}
		}
		if (list === 'wines' && isMark(item.firstPickIds)) refs(path + '.firstPickIds.value', item.firstPickIds.value, dishes, 'a house dish');
		if (list === 'cocktails' && isMark(item.upsells)) refs(path + '.upsells.value', item.upsells.value, cocktails, 'a house cocktail');
	});
	const tastings = listOf(house, 'tastings');
	for (let i = 0; i < tastings.length; i++) {
		const courses = Array.isArray(tastings[i].courses) ? (tastings[i].courses as Raw[]) : [];
		for (let j = 0; j < courses.length; j++) {
			const at = 'house.tastings[' + i + '].courses[' + j + ']';
			refs(at + '.dishIds', courses[j].dishIds, dishes, 'a house dish');
			ref(at + '.pourId', courses[j].pourId, pours, 'a house wine or cocktail', true);
		}
	}
	const byItems: readonly HouseList[] = ['lexicon', 'scenarios', 'askAtLineup'];
	for (const list of byItems) {
		const rows = listOf(house, list);
		for (let i = 0; i < rows.length; i++) refs('house.' + list + '[' + i + '].itemIds', rows[i].itemIds, items, 'a house item');
	}
	const mixUps = listOf(house, 'mixUps');
	for (let i = 0; i < mixUps.length; i++) {
		const at = 'house.mixUps[' + i + '].';
		ref(at + 'aId', mixUps[i].aId, items, 'a house item', false);
		ref(at + 'bId', mixUps[i].bId, items, 'a house item', false);
		if (typeof mixUps[i].aId === 'string' && mixUps[i].aId && mixUps[i].aId === mixUps[i].bId) {
			add(at + 'bId', 'ref', 'a mix-up of an item with itself');
		}
	}
	const disputes = listOf(house, 'disputes');
	for (let i = 0; i < disputes.length; i++) {
		if (disputes[i].itemId !== undefined) ref('house.disputes[' + i + '].itemId', disputes[i].itemId, items, 'a house item', true);
	}
	const terms = idSet(listOf(house, 'lexicon'));
	const components = listOf(house, 'components');
	const componentIds = idSet(components);
	const videos = listOf(house, 'videos');
	for (let i = 0; i < videos.length; i++) {
		refs('house.videos[' + i + '].itemIds', videos[i].itemIds, items, 'a house item');
		refs('house.videos[' + i + '].termIds', videos[i].termIds, terms, 'a house term');
		if (videos[i].componentIds !== undefined) refs('house.videos[' + i + '].componentIds', videos[i].componentIds, componentIds, 'a house component');
	}
	for (let i = 0; i < components.length; i++) {
		refs('house.components[' + i + '].itemIds', components[i].itemIds, items, 'a house item');
		refs('house.components[' + i + '].termIds', components[i].termIds, terms, 'a house term');
	}
	/* A codex comparison naming a house wine by its id must name one this house holds; any other ref is a key in another app, check-compare's to resolve. */
	eachItem(house, (item, path) => {
		const compare = item.compare;
		if (!isMark(compare) || !Array.isArray(compare.value)) return;
		const entries = compare.value as Raw[];
		for (let j = 0; j < entries.length; j++) {
			const e = entries[j];
			if (e && e.app === 'codex' && typeof e.ref === 'string' && HOUSE_WINE_ID.test(e.ref) && !wines.has(e.ref)) {
				add(path + '.compare.value[' + j + '].ref', 'ref', e.ref + ' is not a house wine in this house');
			}
		}
	});
}

/** The shape of a house wine id, the one comparison ref the validator resolves itself. */
const HOUSE_WINE_ID = /^w-[a-z0-9]{8}$/;

/**
 * Every component: its kind one of COMPONENT_KINDS, a name, an explanation
 * within its cap, and a card, when there is one, with a front and a back
 * each within its cap. The floors are the pack builder's, never a device's.
 */
function checkComponents(house: House, add: Add): void {
	const known: readonly string[] = COMPONENT_KINDS;
	const components = listOf(house, 'components');
	for (let i = 0; i < components.length; i++) {
		const c = components[i];
		const at = 'house.components[' + i + ']';
		if (known.indexOf(c.kind as string) < 0) add(at + '.kind', 'component', String(c.kind) + ' is not one of ' + COMPONENT_KINDS.join(', '));
		if (typeof c.name !== 'string' || !c.name.trim()) add(at + '.name', 'component', 'the component has no name');
		const explain = c.explain;
		if (isMark(explain) && typeof explain.value === 'string' && wordCount(explain.value) > COMPONENT_WORDS.explain) {
			add(at + '.explain.value', 'word-cap', wordCount(explain.value) + ' words; the cap on an explanation is ' + COMPONENT_WORDS.explain);
		}
		const card = c.card;
		if (isMark(card) && card.value && typeof card.value === 'object') {
			const v = card.value as Raw;
			for (const side of ['front', 'back'] as const) {
				const text = typeof v[side] === 'string' ? (v[side] as string) : '';
				if (!text.trim()) add(at + '.card.value.' + side, 'component', 'the card has no ' + side);
				else if (wordCount(text) > COMPONENT_WORDS[side]) add(at + '.card.value.' + side, 'word-cap', wordCount(text) + ' words; the cap on a card\'s ' + side + ' is ' + COMPONENT_WORDS[side]);
			}
		}
	}
}

/**
 * Every item's comparisons: at most COMPARE_MAX, each with an app from
 * COMPARE_APPS, a ref for an in-app entry and none for a classic, and a
 * label, a same and a different, each within its cap.
 */
function checkCompare(house: House, add: Add): void {
	const apps: readonly string[] = COMPARE_APPS;
	eachItem(house, (item, path) => {
		const compare = item.compare;
		if (!isMark(compare)) return;
		const at = path + '.compare.value';
		if (!Array.isArray(compare.value)) {
			add(at, 'compare', 'the comparisons are not a list');
			return;
		}
		const entries = compare.value as Raw[];
		if (entries.length > COMPARE_MAX) add(at, 'compare', entries.length + ' comparisons; an item carries at most ' + COMPARE_MAX);
		for (let j = 0; j < entries.length; j++) {
			const e = entries[j] || {};
			const here = at + '[' + j + ']';
			const app = typeof e.app === 'string' ? e.app : '';
			if (apps.indexOf(app) < 0) add(here + '.app', 'compare', (app || 'nothing') + ' is not one of ' + COMPARE_APPS.join(', '));
			const ref = typeof e.ref === 'string' ? e.ref.trim() : '';
			if (app === 'classic' && ref) add(here + '.ref', 'compare', 'a classic is written out and carries no ref');
			if (app !== 'classic' && apps.indexOf(app) >= 0 && !ref) add(here + '.ref', 'compare', 'an in-app comparison needs the ref it opens');
			for (const k of ['label', 'same', 'different'] as const) {
				const text = typeof e[k] === 'string' ? (e[k] as string) : '';
				if (!text.trim()) add(here + '.' + k, 'compare', 'the comparison has no ' + k);
				else if (wordCount(text) > COMPARE_WORDS[k]) add(here + '.' + k, 'word-cap', wordCount(text) + ' words; the cap on a comparison\'s ' + k + ' is ' + COMPARE_WORDS[k]);
			}
		}
	});
}

/**
 * Every video: its link a video link (videoUrlOk, the normaliser's rule,
 * asked again because a validator may be handed a house nobody normalised),
 * a title, and a why within VIDEO_WHY_WORDS. Where each video points is
 * checkRefs' to name.
 */
function checkVideos(house: House, add: Add): void {
	const videos = listOf(house, 'videos');
	for (let i = 0; i < videos.length; i++) {
		const v = videos[i];
		const at = 'house.videos[' + i + ']';
		if (!videoUrlOk(v.url)) add(at + '.url', 'video', 'the link is not a secure link on YouTube or Vimeo');
		const title = typeof v.title === 'string' ? v.title : '';
		if (!title.trim()) add(at + '.title', 'video', 'the video has no title');
		const why = typeof v.why === 'string' ? v.why : '';
		if (!why.trim()) add(at + '.why', 'video', 'the video has no line saying why it helps');
		else if (wordCount(why) > VIDEO_WHY_WORDS) add(at + '.why', 'word-cap', wordCount(why) + ' words; the cap on why a video helps is ' + VIDEO_WHY_WORDS);
	}
}

/**
 * Every bottle tier on every pairing: the wine is a house wine with list
 * 'bottle' (a wine that is not in the house at all is checkRefs' to name),
 * its printed bottle price sits in the tier's band, a half bottle is
 * HALF_SIZE, and the why and the line to say are there and within
 * BOTTLE_WORDS.
 */
function checkBottles(house: House, add: Add): void {
	const wines = new Map<string, Raw>();
	for (const w of listOf(house, 'wines')) if (typeof w.id === 'string') wines.set(w.id, w);
	const dishes = listOf(house, 'dishes');
	for (let i = 0; i < dishes.length; i++) {
		const pairing = dishes[i].pairing;
		if (!isMark(pairing) || !pairing.value || typeof pairing.value !== 'object') continue;
		const bottles = (pairing.value as Raw).bottles;
		if (!bottles || typeof bottles !== 'object') continue;
		for (const tier of BOTTLE_TIERS) {
			const pick = (bottles as Raw)[tier];
			if (!pick || typeof pick !== 'object') continue;
			const at = 'house.dishes[' + i + '].pairing.value.bottles.' + tier;
			const p = pick as Raw;
			for (const k of ['why', 'sayIt']) {
				const text = typeof p[k] === 'string' ? (p[k] as string) : '';
				if (!text.trim()) add(at + '.' + k, 'tier', 'the ' + tier + ' bottle has no ' + (k === 'why' ? 'why' : 'line to say'));
				else if (wordCount(text) > BOTTLE_WORDS) add(at + '.' + k, 'word-cap', wordCount(text) + ' words; the cap on a bottle tier is ' + BOTTLE_WORDS);
			}
			const w = typeof p.wineId === 'string' ? wines.get(p.wineId) : undefined;
			if (!w) continue;
			const name = typeof w.name === 'string' ? w.name : String(p.wineId);
			if (wineListOf(w) !== 'bottle') {
				add(at + '.wineId', 'tier', name + ' is not on the bottle list');
				continue;
			}
			if (tier === 'half') {
				if (foldSize(typeof w.size === 'string' ? w.size : '') !== HALF_SIZE) add(at + '.wineId', 'tier', name + ' is not a ' + HALF_SIZE + ' half bottle');
				continue;
			}
			const dollars = printedDollars(typeof w.bottle === 'string' ? w.bottle : '');
			if (!Number.isFinite(dollars)) add(at + '.wineId', 'tier', name + ' prints no bottle price');
			else if (!inBottleBand(tier, dollars)) add(at + '.wineId', 'tier', name + ' at ' + dollars + ' dollars is outside the ' + tier + ' band');
		}
	}
}

function checkPrinciples(house: House, add: Add): void {
	const known: readonly string[] = PRINCIPLES;
	const dishes = listOf(house, 'dishes');
	for (let i = 0; i < dishes.length; i++) {
		const pairing = dishes[i].pairing;
		if (!isMark(pairing) || !pairing.value || typeof pairing.value !== 'object') continue;
		const principles = (pairing.value as Raw).principles;
		if (!Array.isArray(principles)) continue;
		for (let j = 0; j < principles.length; j++) {
			if (known.indexOf(principles[j]) < 0) {
				add('house.dishes[' + i + '].pairing.value.principles[' + j + ']', 'principles', String(principles[j]) + ' is not one of the nine principles');
			}
		}
	}
}

/**
 * Every printed figure the house carries, against the page it was read
 * from: an item's price and each of its printed prices, a wine's glass and
 * bottle and each figure in each pour, a tasting's price. Whitespace is
 * folded on both sides, as the client folds it. An empty price is not a
 * claim and passes.
 */
function checkPrices(house: House, sourceText: string, add: Add): void {
	const hay = foldSpace(sourceText);
	const present = (p: unknown): boolean => onPage(hay, foldSpace(p));
	const price = (path: string, v: unknown): void => {
		if (typeof v !== 'string') return;
		if (!present(v)) add(path, 'price', 'the price ' + v + ' is not printed on the page as it stands');
	};
	eachItem(house, (item, path, list) => {
		price(path + '.price', item.price);
		const prices = Array.isArray(item.prices) ? (item.prices as Raw[]) : [];
		for (let i = 0; i < prices.length; i++) price(path + '.prices[' + i + '].printed', prices[i].printed);
		if (list !== 'wines') return;
		price(path + '.glass', item.glass);
		price(path + '.bottle', item.bottle);
		const pours = Array.isArray(item.pours) ? item.pours : [];
		for (let i = 0; i < pours.length; i++) {
			const figures = String(pours[i]).match(/\d+(?:[.,]\d+)?/g) || [];
			for (const f of figures) {
				if (!onPage(hay, f)) {
					add(path + '.pours[' + i + ']', 'price', 'the figure ' + f + ' in the pour ' + String(pours[i]) + ' is not printed on the page');
					break;
				}
			}
		}
	});
	const tastings = listOf(house, 'tastings');
	for (let i = 0; i < tastings.length; i++) price('house.tastings[' + i + '].price', tastings[i].price);
}

/**
 * The house's own words, lower case: everything on the card, every item's
 * name and every term. A capitalised word in a line of hers that is in
 * neither this pool nor the item's own plain fields is a name she may have
 * invented, and is flagged for a reader.
 */
function houseWords(house: House): Set<string> {
	const pool = new Set<string>();
	const card = house as unknown as Raw;
	const cardFields = ['name', 'address', 'phone', 'site', 'dressCode', 'menusReadOn'];
	for (const f of cardFields) addWords(pool, card[f]);
	addWords(pool, card.meals);
	addWords(pool, card.sources);
	if (isMark(card.history)) addWords(pool, card.history.value);
	for (const list of ITEM_LISTS) for (const row of listOf(house, list)) addWords(pool, row.name);
	for (const row of listOf(house, 'lexicon')) addWords(pool, row.term);
	return pool;
}

/** The plain fields of one record: every string and list of strings that is not a mark and not the kept notes. */
function ownWords(owner: Raw, list: HouseList | 'house'): Set<string> {
	const pool = new Set<string>();
	const marks: readonly string[] = list === 'house' ? MARK_FIELDS.house : MARK_FIELDS[list];
	for (const k of Object.keys(owner)) {
		if (marks.indexOf(k) >= 0 || k === 'kept') continue;
		const v = owner[k];
		if (typeof v === 'string' || Array.isArray(v)) addWords(pool, v);
	}
	return pool;
}

function addWords(pool: Set<string>, v: unknown): void {
	eachString(v, '', (_path, s) => {
		const found = s.match(WORD_ALL);
		if (found) for (const w of found) pool.add(w.toLowerCase());
	});
}

/** The word rule house-lines.ts counts by, as a global for a sweep, and the same rule starting on a capital. */
const WORD_PIECE = "[A-Za-z0-9\\u00C0-\\u024F'\\u2019]+(?:-[A-Za-z0-9\\u00C0-\\u024F'\\u2019]+)*";
const WORD_ALL = new RegExp(WORD_PIECE, 'g');
const CAPITAL_SOURCE = "[A-Z\\u00C0-\\u00DE][A-Za-z0-9\\u00C0-\\u024F'\\u2019]+(?:-[A-Za-z0-9\\u00C0-\\u024F'\\u2019]+)*";

/** The end of a sentence: its last mark, then any closing quote or bracket (the curly one as an escape), then space to the edge. */
const SENTENCE_END = new RegExp("(^|[.!?][\"')\\]\\u201d]*)\\s*$");

/** True when what sits before `at` is the start of the text or the end of a sentence, so a capital there is the sentence's and not a name's. */
function sentenceStart(s: string, at: number): boolean {
	return SENTENCE_END.test(s.slice(0, at));
}

/** A quoted span: straight double quotes, or the curly pair, written as escapes so the literal stays ASCII. */
const QUOTE_SOURCE = '"([^"]+)"|\\u201c([^\\u201d]+)\\u201d';

/**
 * Every line of hers (a mark with by 'maitre'), each string inside its
 * value: allergen talk is fatal by default; a capitalised name the house
 * does not know and a long quoted span are advice.
 */
function checkMarks(house: House, add: Add): void {
	const known = houseWords(house);
	eachMark(house, (mark, path, owner, list) => {
		if (mark.by !== 'maitre') return;
		const own = ownWords(owner, list);
		eachString(mark.value, path + '.value', (at, s) => {
			if (ALLERGEN_TALK.test(s)) add(at, 'allergen-talk', 'a line of hers speaks of allergens');
			const capitals = new RegExp(CAPITAL_SOURCE, 'g');
			const flagged = new Set<string>();
			let m: RegExpExecArray | null;
			while ((m = capitals.exec(s))) {
				const word = m[0];
				const low = word.toLowerCase();
				if (sentenceStart(s, m.index) || known.has(low) || own.has(low) || flagged.has(low)) continue;
				flagged.add(low);
				add(at, 'proper-noun', 'the name ' + word + ' is nowhere in the house; a reader should check it');
			}
			const quotes = new RegExp(QUOTE_SOURCE, 'g');
			let q: RegExpExecArray | null;
			while ((q = quotes.exec(s))) {
				const span = q[1] !== undefined ? q[1] : q[2];
				const words = wordCount(span);
				if (words >= QUOTE_WORDS) add(at, 'quote', 'a quoted span of ' + words + ' words; only the bank may be quoted, and a reader should check it');
			}
		});
	});
}

function checkServiceNotes(house: House, add: Add): void {
	eachItem(house, (item, path) => {
		const note = item.serviceNote;
		if (typeof note !== 'string' || !note) return;
		if (ALLERGEN_WORD.test(note) && !/confirm/i.test(note)) {
			add(path + '.serviceNote', 'service-note', 'names an allergen without the word confirm; it stands as yours, so confirm it at lineup');
		}
	});
}

/* -------------------------------------------------------------------------
 * The door
 * ---------------------------------------------------------------------- */

export interface ValidateOptions {
	/** The page the prices were read from; with it, every printed figure is checked by onPage. Without it, no price is checked. */
	sourceText?: string;
	/** The codes that count as fatal; FATAL_CODES when absent. The three advisory codes are never fatal whatever this says. */
	fatal?: readonly string[];
}

/**
 * Every problem with the house, in the order of the codes, each saying
 * whether it is fatal, and the count of the fatal ones. Changes nothing.
 */
export function validateHouse(house: House, opts: ValidateOptions = {}): { problems: Problem[]; fatalCount: number } {
	const fatalList: readonly string[] = opts.fatal || FATAL_CODES;
	const problems: Problem[] = [];
	const add: Add = (path, code, said) => {
		problems.push({ path, code, said, fatal: fatalList.indexOf(code) >= 0 && NEVER_FATAL.indexOf(code) < 0 });
	};
	checkForbidden(house, add);
	checkDashes(house, add);
	checkWordCaps(house, add);
	checkRefs(house, add);
	checkPrinciples(house, add);
	checkBottles(house, add);
	checkVideos(house, add);
	checkComponents(house, add);
	checkCompare(house, add);
	if (typeof opts.sourceText === 'string') checkPrices(house, opts.sourceText, add);
	checkMarks(house, add);
	checkServiceNotes(house, add);
	let fatalCount = 0;
	for (const p of problems) if (p.fatal) fatalCount++;
	return { problems, fatalCount };
}
