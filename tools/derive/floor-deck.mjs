/**
 * The Floor Deck: a staff-training deck, authored here and gated like
 * everything else this build emits.
 *
 * ## What it is
 *
 * The menu words a new hire has to be able to say at a table: a restaurant's
 * hand-filled training packet (photographed 19 September 2026, transcribed in
 * full in the plan that started this work), corrected where its handwritten
 * answers were wrong, and widened to each term's neighbours. It shipped at 300
 * cards in fifteen sections; with the Southern section removed it is 281 cards
 * in 14 sections, each card at one of four brigade levels (DECK_LEVELS).
 *
 * ## Why it is not the Lexicon
 *
 * The Lexicon could not take it. The original 479 entries are sealed at
 * word-identity with the archive, with a door for correcting a fact and none
 * for deepening one. Five categories are frozen to the term by the service
 * track, and eleven of the packet's cured meats live in them. The supplement
 * shape is an INGREDIENT (season, choosing, keeping, prep), which hollandaise
 * and "braised" are not. And a Lexicon entry is an essay of 325 to 1,200
 * characters, where a card opens on one sentence a server can say aloud.
 *
 * So the deck is its own data set, linked both ways with the Lexicon: a card
 * names its long entry with `lexiconSlug`, and the build emits the reverse map
 * so the Lexicon can point back, with no edit to anything sealed.
 *
 * ## A card's four layers, in the order the back shows them
 *
 *   THE GUEST LINE  `guest`     what you say at the table
 *   THE WHY         `why`       how it is made, how it eats, what it is like
 *   SERVICE FACTS   `madeWith`, `note`   never a verdict; see the contract
 *   CONTEXT         `origin`, `pairs`, `notThis`
 *
 * plus `gist`, a term-free one-liner that is the written test's key and the
 * Lineup's answer key, and `line`, a dish line carrying the term for "what
 * does this word on the menu mean". TRAPS are the wrong answers people really
 * give; they are emitted to their own file, read by the written test alone,
 * and never shown on a card.
 *
 * ## Identity
 *
 * An id is minted once by tools/deck/mint-ids.mjs into the committed ledger
 * beside this file and is never typed, changed or reused: a reader's progress
 * is filed under it. The build reads the ledger and never writes it, because
 * build-integrity.test.ts pins this build to exactly two writeFileSync sites.
 *
 * ## The contract
 *
 * tools/derive/floor-deck-contract.mjs, shared with the authoring validator.
 * The respelling key for `say`, for the writer: ah ay ee eh oh oo uh ow eye
 * zh, stressed syllable in CAPITALS, hyphens between syllables.
 */

import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redact, significantWords, MAX_REDACTED_SHARE } from './drills.mjs';
import {
	LIMITS,
	LEVELS,
	checkDeck,
	checkLevels,
	assertNoDeckVerdict,
	isStub,
	genericWords,
	identifyingWords,
	leakCount,
	leakNames,
	recipeProblems
} from './floor-deck-contract.mjs';
import { wrongAnswersFor, seeded, foldText } from '../../src/lib/floor-deck-core.mjs';

import methods from './floor-deck/methods.mjs';
import meats from './floor-deck/meats.mjs';
import cured from './floor-deck/cured.mjs';
import cuts from './floor-deck/cuts.mjs';
import fish from './floor-deck/fish.mjs';
import mushrooms from './floor-deck/mushrooms.mjs';
import dairy from './floor-deck/dairy.mjs';
import starches from './floor-deck/starches.mjs';
import sauces from './floor-deck/sauces.mjs';
import preparations from './floor-deck/preparations.mjs';
import bread from './floor-deck/bread.mjs';
import custards from './floor-deck/custards.mjs';
import pantry from './floor-deck/pantry.mjs';
import language from './floor-deck/language.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const LEDGER_PATH = join(HERE, 'floor-deck.ledger.json');

/** The three emitted files together may not pass this, gzipped.
 *
 *  First set at 128,000 from a pilot measurement (300 cards at the contract's
 *  aims came to 127.6 KB) when the precache cap went to 2.65 MB. Moved to
 *  140,000 when the owner took the cap to 2.70 (verify-build.mjs has the
 *  argument): three written sections projected 126.8 KB at 300 on the straight
 *  line, ~121 KB at the last section's marginal rate, and the owner asked for
 *  depth over trimming. This leaves ~16 KB for sections that run long and
 *  still keeps the deck's growth well inside what the cap raise bought, so the
 *  producer screens and the study routes are never squeezed by prose. */
export const DECK_GZ_CEILING = 140_000;

/** Flip to true when the last planned card is written. From then on a stub, a
 *  missing packet term or a packet error with no trap fails the build. */
export const DECK_COMPLETE = true;

/**
 * The four brigade levels, and the ONLY place their names are written. A card
 * carries the numeric key (the contract's LEVELS); the page reads the name
 * from the emitted `levels`, so a level can be renamed here without touching
 * a card, a saved link or anyone's progress.
 *
 * Nothing is locked. A new reader is GUIDED: new cards come from level 1
 * across all its sections, then level 2, and so on (floor-deck.ts
 * teachingOrder), and any level, or all of them, can be opened at any time.
 * The standard each card was placed against is in tools/deck/README.md,
 * "Levels"; why each card sits where it does is tools/deck/audit/levels.json.
 *
 * A blurb describes the WORDS at that level, never the reader: the landing
 * shows it under the name, and "for beginners" would tell a ten-year captain
 * that the Commis cards are beneath them.
 *
 * @type {import('./floor-deck-contract.mjs').AuthoredLevel[]}
 */
export const DECK_LEVELS = [
	{ level: 1, name: 'Commis',
		blurb: 'The everyday words on most American menus: the ones a guest assumes any server already knows on the first day.' },
	{ level: 2, name: 'Chef de Partie',
		blurb: 'Common at a good restaurant and worth a sentence to explain, with the pairs of words that are easiest to mix up.' },
	{ level: 3, name: 'Sous Chef',
		blurb: 'Fine-dining vocabulary: the classical sauces and preparations, and the specialist cuts and products behind them.' },
	{ level: 4, name: 'Chef',
		blurb: 'The rare, specialist and deeply classical words a senior server is expected to own and explain without notes.' }
];

/**
 * In teaching order WITHIN a level: a new hire meets level 1's cards section
 * by section in this order, then level 2's, and so on (the engine sorts by
 * level, stably, over this order; the emitted file keeps this order because
 * sorting it level-first cost about 4 KB gzipped for nothing the app needs).
 *
 * `madeWith` is 'optional' where a card is a verb or a word about the menu
 * rather than a food.
 */
/** @type {import('./floor-deck-contract.mjs').AuthoredSection[]} */
export const DECK_SECTIONS = [
	/* The Southern Table (fd_0001..fd_0024) was removed on the owner's decision,
	   2026-09-19: the words any American menu uses moved to their natural
	   sections with their ids (Chicken-Fried to methods, Coleslaw and Hash to
	   preparations, Hominy to starches, Cornbread to bread), and the 19 regional
	   ones are retired in the ledger. tools/deck/audit/southern.json keeps why
	   each read as it did. */
	{ key: 'methods', title: 'Cooking Methods', madeWith: 'optional', cards: methods,
		blurb: 'The verbs on the menu. What each one does to the food, how it shows on the plate, and how to tell the near neighbors apart.' },
	{ key: 'meats', title: 'Poultry, Game & Offal', madeWith: 'required', cards: meats,
		blurb: 'Small birds, game and the organ meats: what each animal is, how rich or mild it eats, and an honest way to describe it to a nervous guest.' },
	{ key: 'cured', title: 'Cured & Preserved Meats', madeWith: 'required', cards: cured,
		blurb: 'The charcuterie board by name: which cut, which country, salted or smoked, cooked or raw, and how each one tastes beside the others.' },
	{ key: 'cuts', title: 'Meat Cuts', madeWith: 'required', cards: cuts,
		blurb: 'Where on the animal a cut comes from decides how it has to be cooked and how it eats. The steaks, the braising cuts and the ones in between.' },
	{ key: 'fish', title: 'Fish & Shellfish', madeWith: 'required', cards: fish,
		blurb: 'The fish case: lean or rich, flaky or firm, mild or full, and where it swims. Plus the shellfish and the roes a server gets asked about.' },
	{ key: 'mushrooms', title: 'Mushrooms & Truffles', madeWith: 'required', cards: mushrooms,
		blurb: 'Cultivated and wild mushrooms by texture and flavor, the names one mushroom hides behind, and what a truffle is and is not.' },
	{ key: 'dairy', title: 'Dairy & Cheese Words', madeWith: 'required', cards: dairy,
		blurb: 'Butters, cultured creams, fresh cheeses and the style words on a cheese course: which milk, how it is made and how it tastes.' },
	{ key: 'starches', title: 'Grains, Pasta & Starches', madeWith: 'required', cards: starches,
		blurb: 'Grains, corn, rice and pasta shapes: what each one is, how it eats, and the names that are easy to mix up.' },
	{ key: 'sauces', title: 'Sauces, Stocks & Dressings', madeWith: 'required', cards: sauces,
		blurb: 'The mother sauces and their children, the emulsions, the stocks beneath them and the cold sauces: what goes in each and what it does on the plate.' },
	{ key: 'preparations', title: 'Preparations & Style Words', madeWith: 'optional', cards: preparations,
		blurb: 'Dish names that are really instructions: raw, cured, stuffed, rolled, baked under a crust, or finished in the classic French manner.' },
	{ key: 'bread', title: 'Bread, Pastry & Cakes', madeWith: 'required', cards: bread,
		blurb: 'Doughs and batters from the bread basket to the dessert menu, and the pairs of words that sound alike and are not the same thing.' },
	{ key: 'custards', title: 'Custards, Creams & Frozen Desserts', madeWith: 'required', cards: custards,
		blurb: 'Everything set with egg, cream, gelatin or cold: the custards, the chocolate work and the frozen desserts, told apart by what goes in them.' },
	{ key: 'pantry', title: 'Pantry, Pickles & Vinegars', madeWith: 'required', cards: pantry,
		blurb: 'The jars behind the dish: vinegars and grape musts, pickles and preserves, ferments and the seasonings that finish a plate.' },
	{ key: 'language', title: 'Menu Language & Sourcing Words', madeWith: 'optional', cards: language,
		blurb: 'The words that are not food: how a menu is structured, what the kitchen stations are called, and what a sourcing claim does and does not mean.' }
];

/**
 * Every term the packet asked for, by the name its card carries. Filled when
 * the roster is minted; checked from that day on, so a packet term cannot fall
 * out of the deck while sections are being reorganised.
 *
 * The five producer lines (four creameries and Singing Brook) are not here:
 * by the owner's decision a house's producers live in My Menu, not in a
 * public vocabulary.
 *
 * @type {string[]}
 */
export const PACKET_TERMS = [
	'Chicken-Fried', 'Coleslaw', 'Hash', 'Hominy', 'Boiled', 'Braised', 'Brined', 'Caramelized', 'Confit',
	'Cured', 'Fried', 'Grilled', 'Pickled', 'Poached', 'Preserved',
	'Puréed', 'Roasted', 'Sautéed', 'Seared', 'Simmered', 'Smoked',
	'Sous Vide', 'Wilted', 'Escargot', 'Guinea Hen', 'Quail', 'Squab',
	'Sweetbreads', 'Foie Gras', 'Andouille', 'Chorizo', 'Coppa', 'Country Ham',
	'Guanciale', 'Lardo', 'Lomo', 'Pancetta', 'Pastrami', 'Pâté',
	'Prosciutto', 'Rillettes', 'Speck', 'Tasso', 'Ribeye Cap', 'Cheek',
	'Hanger Steak', 'Ham Hock', 'Ribeye', 'Shoulder', 'Short Rib', 'Tenderloin',
	'Pork Belly', 'Arctic Char', 'Crawfish', 'Skate', 'Flounder', 'Grouper',
	'Halibut', 'Mussels', 'Oysters', 'Roe', 'Salmon', 'Scallops',
	'Snapper', 'Sturgeon', 'Tilefish', 'Trout', 'Turbot', 'Wreckfish',
	'Caviar', 'Abalone Mushroom', 'Beech Mushroom', 'Black Trumpet', 'Chanterelle', 'Hen of the Woods',
	'King Trumpet', 'Morel', 'Oyster Mushroom', 'Shiitake', 'Truffle', 'Brebis',
	'Buttermilk', 'Chèvre', 'Crème Fraîche', 'Fromage Blanc', 'Parmesan', 'Clarified Butter',
	'Brown Butter', 'Agnolotti', 'Buckwheat', 'Bulgur', 'Farro', 'Farro Piccolo',
	'Gnocchi', 'Grits', 'Polenta', 'Quinoa', 'Risotto', 'Carnaroli',
	'Acquerello', 'Semolina', 'Tagliatelle', 'Aioli', 'Béarnaise', 'Hollandaise',
	'Emulsion', 'Jus', 'Vinaigrette', 'Mignonette', 'Gastrique', 'Coulis',
	'Consommé', 'Carpaccio', 'Tartare', 'Frittata', 'Ragout', 'Beignets',
	'Brioche', 'Focaccia', 'Sourdough', 'Macaron', 'Macaroon', 'Meringue',
	'Tart', 'Torte', 'Crème Anglaise', 'Custard', 'Ganache', 'Mousse',
	'Parfait', 'Panna Cotta', 'Chocolate Truffle', 'Gelato', 'Granita', 'Sherbet',
	'Sorbet', 'Balsamic', 'Banyuls', 'Saba', 'Kimchi', 'Compote',
	'Marmalade', 'Heirloom', 'Larder', 'Garde Manger'
];

/**
 * The packet's handwritten answers that were wrong, as card id -> a pattern
 * one of that card's traps must match. The mistake real people make is the
 * wrong answer worth offering, and this keeps each one in the test.
 *
 * @type {Record<string, RegExp>}
 */
export const PACKET_ERRORS = {
	/* Shoulder: the packet wrote "very tender meat"; it is tough and collagen-rich until it is cooked slowly */
	fd_0091: /tender/i,
	/* Cheek: the packet wrote "lean and tender"; it is rich in collagen and tender only when braised */
	fd_0087: /lean/i,
	/* Heirloom: the packet wrote "organically produced without GMOs"; it is an old open-pollinated variety handed down */
	fd_0285: /organic|GMO/i,
	/* Macaroon: the packet described a macaron: two almond meringue shells with a filling */
	fd_0239: /almond|meringue|sandwich/i,
	/* Sous Vide: the packet wrote "placed in steaming water"; it is a precisely held bath, well below a simmer */
	fd_0042: /steam|boil/i,
	/* Lomo: the packet wrote "Spanish for tenderloin"; it is the loin */
	fd_0070: /tenderloin/i,
	/* Quail: the packet wrote "strong gamy flavors"; it is mild */
	fd_0052: /gam[ey]|strong/i,
	/* Banyuls: the packet wrote "eastern France"; it is Roussillon, in the far south by the Spanish border */
	fd_0267: /east/i,
	/* Tilefish: the packet wrote "shallow water fish"; it lives deep */
	fd_0121: /shallow/i,
	/* Flounder: the packet wrote "eyes on the left side"; it depends on the family */
	fd_0111: /left/i,
	/* Pastrami: the packet stopped at "then smoked"; it is steamed after smoking */
	fd_0072: /cold|only smoked|no further/i,
	/* Jus: the packet wrote "light sauce used in beef recipes"; it is any roast's own juices, lightly reduced */
	fd_0199: /beef/i,
	/* Caviar: the packet wrote "roe from wild sturgeon"; nearly all of it is farmed now */
	fd_0125: /wild/i
};

/** The ledger is build INPUT. Missing or unreadable is fatal, never defaulted
 *  to empty: an empty ledger would call every live id unminted at best, and at
 *  worst let a fresh one be minted over a reader's progress.
 *
 *  @returns {import('./floor-deck-contract.mjs').Ledger} */
export function readLedger() {
	if (!existsSync(LEDGER_PATH)) throw new Error(`BUILD INPUT MISSING: ${LEDGER_PATH}`);
	return JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
}

/**
 * Stage one, early and held with the other authored-content gates: everything
 * that can be known from the authored modules, the ledger and the Lexicon's
 * slugs.
 *
 * @param {{ lexiconSlugs: Set<string> }} ctx
 * @returns {boolean}
 */
export function gateFloorDeck({ lexiconSlugs }) {
	let problems;
	try {
		problems = checkDeck(DECK_SECTIONS, readLedger(), {
			lexiconSlugs,
			complete: DECK_COMPLETE,
			packetTerms: PACKET_TERMS,
			packetErrors: PACKET_ERRORS
		});
	} catch (e) {
		problems = [String(/** @type {any} */ (e)?.message ?? e)];
	}
	problems.push(...checkLevels(DECK_LEVELS));
	if (problems.length) {
		console.error(`\n  floor deck: ${problems.length} problem(s)`);
		problems.forEach((x) => console.error(`    ✗ ${x}`));
		return false;
	}
	const all = DECK_SECTIONS.flatMap((s) => s.cards);
	const written = all.filter((c) => !isStub(c)).length;
	console.log(`  floor deck: ${written} written of ${all.length} minted, contract holds${DECK_COMPLETE ? ', COMPLETE' : ''}`);
	const perLevel = DECK_LEVELS.map((l) => `${l.name} ${all.filter((c) => !isStub(c) && c.level === l.level).length}`);
	console.log(`  floor deck levels: ${perLevel.join(', ')} (each at least ${LIMITS.levelMin})`);
	return true;
}

/** @param {unknown} value */
const gzBytes = (value) => gzipSync(JSON.stringify(value)).length;

/**
 * Optional keys are omitted, never emitted empty: every card is precached.
 *
 * @param {Record<string, any>} out
 * @param {string} key
 * @param {unknown} value
 */
const put = (out, key, value) => {
	if (value === undefined) return;
	if (Array.isArray(value) && !value.length) return;
	out[key] = value;
};

/**
 * Stage two, late: what needs the recipe index, and everything measured on
 * the EMITTED shape (the prompts, the option-length tell, the bytes).
 *
 * @param {{ recipes: Array<{ slug: string, name: string }> }} ctx
 */
export function buildFloorDeck({ recipes }) {
	/** @type {string[]} */
	const problems = [];
	const ledger = readLedger();
	const generic = genericWords(ledger.cards.filter((r) => !r.retired).map((r) => r.term));
	const recipeName = new Map(recipes.map((r) => [r.slug, r.name]));

	const writtenIds = new Set(
		DECK_SECTIONS.flatMap((s) => s.cards.filter((c) => !isStub(c)).map((c) => c.id))
	);

	/* confusedWith is symmetrised here so a writer never edits two section
	   files for one pair. References to a card that is still planned are
	   dropped from the emit and counted, not failed: every id exists from the
	   day the roster is minted, and the prose arrives section by section. */
	/** @type {Map<string, string[]>} */
	const confused = new Map();
	let waiting = 0;
	for (const s of DECK_SECTIONS) {
		for (const c of s.cards) {
			if (isStub(c)) continue;
			for (const other of c.confusedWith ?? []) {
				if (!writtenIds.has(other)) continue;
				for (const [a, b] of [[c.id, other], [other, c.id]]) {
					const list = confused.get(a) ?? [];
					if (!list.includes(b)) list.push(b);
					confused.set(a, list);
				}
			}
		}
	}

	/** @typedef {{ id: string, term: string, section: string, level: number, gist: string, confusedWith?: string[], [key: string]: any }} EmittedCard */
	/** @type {EmittedCard[]} */
	const cards = [];
	/** @type {Record<string, Array<{ says: string, why: string }>>} */
	const traps = {};
	/** @type {Record<string, string[]>} */
	const byLexicon = {};
	const sections = [];
	let said = 0;

	for (const s of DECK_SECTIONS) {
		let count = 0;
		for (const c of s.cards) {
			if (isStub(c)) continue;
			count++;

			/* what the prompt hides: the term and its one-word aliases, the same
			   names the contract keeps out of a gist (leakNames says why). The
			   recipe check below still reads EVERY alias: a link is about the
			   subject, not about what would give an answer away. */
			const names = leakNames(c);
			const red = redact(c.why, names, { minLength: 3 });
			if (red.prompt.endsWith('…')) problems.push(`${c.id}: the prompt was clipped; why is over the redactor's length`);
			if (red.hiddenShare > MAX_REDACTED_SHARE) {
				problems.push(`${c.id} ${JSON.stringify(c.term)}: redaction hides ${Math.round(red.hiddenShare * 100)}% of why, more than ${MAX_REDACTED_SHARE * 100}%: it names its own term so often that the prompt is mostly blanks. Rewrite why to lean on the term less`);
			}
			const survivors = leakCount(red.prompt, significantWords(names, 3));
			if (survivors) problems.push(`${c.id}: ${survivors} word(s) of the term survive in its own prompt`);

			problems.push(...recipeProblems(c, recipeName));

			/** @param {string[]|undefined} ids */
			const live = (ids) => {
				const kept = (ids ?? []).filter((id) => writtenIds.has(id));
				waiting += (ids ?? []).length - kept.length;
				return kept;
			};

			/* built loosely so the keys land in reading order, then pushed as
			   the emitted shape */
			/** @type {Record<string, any>} */
			const out = { id: c.id, term: c.term };
			put(out, 'say', c.say);
			put(out, 'aliases', c.aliases);
			out.section = s.key;
			out.level = c.level;
			out.gist = c.gist;
			out.guest = c.guest;
			out.why = c.why;
			put(out, 'madeWith', c.madeWith);
			put(out, 'note', c.note);
			put(out, 'origin', c.origin);
			put(out, 'pairs', c.pairs);
			put(out, 'notThis', c.notThis);
			put(out, 'lexiconSlug', c.lexiconSlug);
			put(out, 'recipe', c.recipe);
			put(out, 'seeAlso', live(c.seeAlso));
			// the authored half is counted here; the mirrored half is not a
			// reference anyone wrote, so it is never "waiting"
			live(c.confusedWith);
			put(out, 'confusedWith', (confused.get(c.id) ?? []).slice(0, 4));
			put(out, 'line', c.line);
			if (red.hits > 0) out.prompt = red.prompt;
			cards.push(/** @type {EmittedCard} */ (out));

			if (c.say) said++;
			if (c.traps?.length) traps[c.id] = c.traps.map((/** @type {{ says: string, why: string }} */ t) => ({ says: t.says, why: t.why }));
			if (c.lexiconSlug) (byLexicon[c.lexiconSlug] ??= []).push(c.id);
		}
		sections.push({ key: s.key, title: s.title, blurb: s.blurb, count });
	}

	/* The levels with their counts. The CARDS are not re-sorted by level: the
	   engine sorts (floor-deck.ts teachingOrder), and a level-first file
	   gzipped about 4 KB worse, because neighbours from one section share more
	   words than neighbours from one level do. A test pins the order. */
	const levels = DECK_LEVELS.map((l) => ({
		level: l.level,
		name: l.name,
		blurb: l.blurb,
		count: cards.filter((c) => c.level === l.level).length
	}));

	const floorDeck = {
		version: 1,
		/* The sentence around madeWith, emitted ONCE and composed by the card
		   component, so no card can phrase a verdict because no card phrases
		   this at all. */
		frame: { madeWith: 'Classically made with', confirm: 'Recipes vary. Confirm with the kitchen.' },
		sections,
		levels,
		cards
	};
	const floorDeckIndex = {
		/* Key to title, for the sections that have a card: the Lexicon shows a
		   deck hit as "Guanciale, in Cured & Preserved Meats" and must not load
		   the deck to learn a section's name. */
		sections: Object.fromEntries(sections.filter((s) => s.count > 0).map((s) => [s.key, s.title])),
		/* Key to name, for the same reason: a hit reads "Commis · Fish &
		   Shellfish". Keyed by the number as a string, which is what JSON
		   makes of an object key anyway. */
		levels: Object.fromEntries(DECK_LEVELS.map((l) => [String(l.level), l.name])),
		cards: cards.map((c) => {
			/** @type {Record<string, any>} */
			const row = { id: c.id, term: c.term, section: c.section, level: c.level };
			put(row, 'aliases', c.aliases);
			return row;
		}),
		byLexicon
	};

	problems.push(...assertNoDeckVerdict({ frame: floorDeck.frame, sections, levels, cards }, 'floor-deck.json'));
	problems.push(...assertNoDeckVerdict(Object.values(traps), 'floor-deck.traps.json'));
	problems.push(...assertNoDeckVerdict({ levels: floorDeckIndex.levels, cards: floorDeckIndex.cards }, 'floor-deck.index.json'));
	for (const c of cards) {
		if (!LEVELS.includes(c.level)) problems.push(`${c.id}: emitted with level ${JSON.stringify(c.level)}`);
	}

	/* ── the option-length tell ─────────────────────────────────────────────
	   Simulated through the SAME wrongAnswersFor the written test calls, so
	   this is a measurement of the test a reader sits, not of a model of it.
	   A reader who always picks the longest option, or always the shortest,
	   should do no better than chance (0.25). Both are gated, because the
	   usual repair for one is to over-correct into the other; and the repair
	   is to shorten a key or give a trap real content, never to pad.

	   Below forty cards the rates are noise, so they are printed and not
	   gated: the pilot section is twenty-two. */
	const tell = { asked: 0, longest: 0, shortest: 0, unfielded: 0 };
	const rand = seeded(20260919);
	for (const card of cards) {
		for (let draw = 0; draw < 40; draw++) {
			const wrong = wrongAnswersFor(card, cards, traps[card.id], rand);
			if (!wrong) {
				tell.unfielded++;
				break;
			}
			const lengths = [card.gist.length, ...wrong.map((w) => w.text.length)];
			const max = Math.max(...lengths);
			const min = Math.min(...lengths);
			tell.asked++;
			if (lengths[0] === max) tell.longest += 1 / lengths.filter((n) => n === max).length;
			if (lengths[0] === min) tell.shortest += 1 / lengths.filter((n) => n === min).length;
		}
	}
	const pickLongest = tell.asked ? tell.longest / tell.asked : 0;
	const pickShortest = tell.asked ? tell.shortest / tell.asked : 0;
	if (cards.length && tell.unfielded) {
		problems.push(`${tell.unfielded} card(s) cannot field three wrong answers`);
	}
	if (cards.length >= 40) {
		if (pickLongest > 0.29) problems.push(`a reader who always picks the LONGEST option scores ${(pickLongest * 100).toFixed(1)}% (chance is 25, the gate is 29): the keys run long. Shorten a gist or give a trap real content; never pad`);
		if (pickShortest > 0.33) problems.push(`a reader who always picks the SHORTEST option scores ${(pickShortest * 100).toFixed(1)}% (the gate is 33): an earlier repair over-corrected`);
	}

	const bytes = gzBytes(floorDeck) + gzBytes(traps) + gzBytes(floorDeckIndex);
	if (bytes > DECK_GZ_CEILING) {
		problems.push(`the deck is ${bytes} bytes gzipped against a ceiling of ${DECK_GZ_CEILING}. The precache cap was raised for this much and the study routes share what is left: tighten the prose, do not raise the number`);
	}

	if (cards.length) {
		const trapped = Object.keys(traps).length;
		console.log(
			`  floor deck: ${cards.length} cards in ${sections.filter((s) => s.count).length} sections, ` +
				`${(bytes / 1024).toFixed(1)} KB gz (${Math.round(bytes / cards.length)} B per card, ceiling ${(DECK_GZ_CEILING / 1024).toFixed(0)} KB), ` +
				`say: ${said} of ${cards.length}, traps on ${trapped}`
		);
		console.log(
			`  floor deck test: pick-longest ${(pickLongest * 100).toFixed(1)}%, pick-shortest ${(pickShortest * 100).toFixed(1)}% ` +
				`over ${tell.asked} simulated questions${cards.length < 40 ? ' (printed, not gated, under 40 cards)' : ''}` +
				`${waiting ? `; ${waiting} reference(s) waiting on planned cards` : ''}`
		);
	}

	return { floorDeck, floorDeckTraps: traps, floorDeckIndex, problems };
}

export { LIMITS, identifyingWords, foldText };
