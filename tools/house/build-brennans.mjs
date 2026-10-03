#!/usr/bin/env node
/* build-brennans.mjs: house/brennans/parsed.json plus house/brennans/overrides.json into one House
   in the shape of house-min.json, through the engine's emptyHouse and mintId.

   What it does, in order:
   1. loads the engine (../oot-house.js) with node:vm into a window with no indexedDB and takes
      window.OOT.houseLib (emptyHouse, mintId, stripDashes, hasDash, normaliseHouse, the constants);
   2. reads parsed.json (the parser's output), overrides.json (every departure from the guide,
      with its reason and source) and ids.ledger.json (slug to id, read before any id is minted);
   3. builds an intermediate model: the card, 47 dishes, 20 wines, 7 cocktails (5 signature drinks
      and the 2 spirit-free drinks as drafts), 2 tastings, the lexicon, scenarios, mix-ups,
      must-knows, the lineup register and the disputes, with every reference still a name;
   4. applies the overrides to the model (set, replace, append, add) before any dash is touched,
      so a replace matches the guide's own text; an entry whose target or 'from' is not found
      fails the build;
   5. runs every string through the spelling map (the research's British forms become the house's
      American ones, logged to house/brennans/spelling-log.json) and then the dash pass: an en dash
      a line wrap left before a space is rejoined as a hyphen (New Orleans-style), an en dash
      between figures becomes 'to', between letters a hyphen; two em dashes in one sentence are an
      aside and both become commas, a dash before a conjunction is a comma; anything else is handed
      to the engine's stripDashes; every
      changed string is written to house/brennans/dash-log.json, before and after, for a person to
      read, and an entry says when the string came from an override rather than the guide;
   6. assembles the House: ids from the ledger (or minted, with --mint, only when the ledger
      lacks the slug), every mark by 'maitre' with the one build stamp, every reference resolved
      to an id, the build stamped complete on every step, began 'pack';
   7. normalises through the engine and refuses if the normaliser re-minted an id or dropped a key;
   8. writes house/brennans/house.json and the ledger, and prints one summary line.

   Prices are never rewritten: an item's price is the guide's own string. Service notes are a
   person's words and go in verbatim (dash-stripped only). Nothing here writes an allergen into
   a mark; the lineup register carries those questions.

   Usage: node house/build-brennans.mjs [--mint] [--stamp <ms>]
   Runs from any directory. Exits 1 with the file and the rule on failure. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { americanise, checkArgs } from './engine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, 'brennans');
const PARSED = path.join(DIR, 'parsed.json');
const OVERRIDES = path.join(DIR, 'overrides.json');
const LEDGER = path.join(DIR, 'ids.ledger.json');
const DASH_LOG = path.join(DIR, 'dash-log.json');
const SPELL_LOG = path.join(DIR, 'spelling-log.json');
const OUT = path.join(DIR, 'house.json');
const ENGINE = path.join(HERE, '..', '..', 'static', 'shared', 'oot-house.js');
const REL = (p) => path.relative(process.cwd(), p) || p;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`build-brennans.mjs: ${REL(PARSED)} plus ${REL(OVERRIDES)} into ${REL(OUT)}.

  --mint        allow a new id to be minted for a slug the ledger (${REL(LEDGER)}) lacks
  --stamp <ms>  the one build stamp on every mark (default: now)
  --verbose     print every principle mapped
  --help        this text

Writes ${REL(OUT)}, ${REL(DASH_LOG)}, ${REL(SPELL_LOG)} and, with --mint, ${REL(LEDGER)}.`);
	process.exit(0);
}
checkArgs(args, ['--mint', '--stamp', '--verbose'], ['--stamp'], fail);
const MINT = args.includes('--mint');
const stampAt = args.indexOf('--stamp');
const BUILD_TS = stampAt >= 0 ? Number(args[stampAt + 1]) : Date.now();
if (!Number.isFinite(BUILD_TS)) fail('--stamp must be a number of milliseconds');

function fail(msg) {
	console.error('build-brennans: ' + msg);
	process.exit(1);
}
for (const f of [PARSED, OVERRIDES, ENGINE]) if (!fs.existsSync(f)) fail(`${REL(f)}: missing`);

/* ---------- the engine ---------- */
function loadEngine() {
	const window = {};
	window.window = window;
	window.self = window;
	const ctx = vm.createContext({ window, console });
	vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), ctx, { filename: ENGINE });
	const lib = window.OOT && window.OOT.houseLib;
	if (!lib || typeof lib.emptyHouse !== 'function') fail(`${REL(ENGINE)}: window.OOT.houseLib is not there after the script ran`);
	return lib;
}
const lib = loadEngine();
const { emptyHouse, mintId, stripDashes, hasDash, normaliseHouse } = lib;
const C = lib.constants;
const FORBIDDEN_KEY = C.FORBIDDEN_KEY;

/* ---------- inputs ---------- */
const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const overrides = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8'));
let ledger = {};
if (fs.existsSync(LEDGER)) ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const ledgerBefore = JSON.stringify(ledger);

/* ---------- small helpers ---------- */
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").toLowerCase();
const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const sentence = (s) => { s = String(s || '').trim(); return s && !/[.!?]$/.test(s) ? s + '.' : s; };
const mark = (value) => ({ value, by: 'maitre', ts: BUILD_TS });

/* A seeded random source, so the first mint of a slug is the same on every machine; the ledger
   is still what holds an id stable, the seed only makes a fresh ledger reproducible. */
function seeded(key) {
	let h = 2166136261;
	for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
	let a = h >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const taken = new Set();
const minted = [];
function idFor(list, key) {
	const prefix = C.ID_PREFIXES[list];
	const k = list + ':' + key;
	if (ledger[k]) {
		if (taken.has(ledger[k])) fail(`${REL(LEDGER)}: the id ${ledger[k]} is listed under two slugs`);
		taken.add(ledger[k]);
		return ledger[k];
	}
	if (!MINT) fail(`${REL(LEDGER)}: no id for ${k}; run with --mint to mint one`);
	const rand = seeded(k);
	let id = mintId(prefix, taken, rand);
	for (let tries = 0; tries < 100 && FORBIDDEN_KEY.test(id); tries++) id = mintId(prefix, taken, rand);
	taken.add(id);
	ledger[k] = id;
	minted.push(k);
	return id;
}

/* ---------- the dash pass ---------- */
/* The two dashes as code points, so this file carries neither. */
const EN = String.fromCharCode(0x2013);
const EM = String.fromCharCode(0x2014);
const dashLog = [];
const spellLog = [];
/* The override entry that last set the string at a path, or the record it added, so the log can say so. */
function overrideEntryFor(where) {
	if (overrideAt.has(where)) return overrideAt.get(where);
	for (const [at, n] of overrideAt) if (where.startsWith(at + '.') || where.startsWith(at + '[')) return n;
	return undefined;
}
const LETTER = "[A-Za-z\\u00C0-\\u024F'\\u2019]";
/* A sentence ends at . ! or ? with any closing quote or bracket, then space, then a capital, a figure or an
   opening quote; a line break ends one too. An abbreviation followed by a lowercase word does not. */
const SENTENCE_BREAK = new RegExp('[.!?]["\\u2019\\u201d\')\\]]*\\s+(?=["\\u201c\\u2018(]?[A-Z0-9])|\\n', 'g');
/* Two em dashes in one sentence are an aside (a rösti, a crisp potato cake, and garlic spinach): both become
   commas, so the aside is not broken into the colons stripDashes makes of a list. A third, unpaired dash in
   the sentence is left for stripDashes. */
function pairDashes(s) {
	if (s.indexOf(EM) < 0 || s.indexOf(EM) === s.lastIndexOf(EM)) return s;
	const pieces = [];
	let last = 0;
	let m;
	SENTENCE_BREAK.lastIndex = 0;
	while ((m = SENTENCE_BREAK.exec(s))) { pieces.push(s.slice(last, m.index + m[0].length)); last = m.index + m[0].length; }
	pieces.push(s.slice(last));
	return pieces.map((piece) => {
		const count = piece.split(EM).length - 1;
		if (count < 2) return piece;
		let n = 0;
		const pairs = count - (count % 2);
		return piece.replace(new RegExp(EM, 'g'), (d) => (n++ < pairs ? ', ' : d));
	}).join('');
}
function dashFree(s, where) {
	if (typeof s !== 'string' || !s) return s;
	let out = s;
	/* An en dash a line wrap left before a space is rejoined to the word that follows (New Orleans-style); then
	   an en dash between figures reads 'to' (9 to 2, $50 to $125, 43 to 46F); between letters it is a hyphen;
	   any other en dash is handed on as an em dash. */
	out = out.replace(new RegExp('(' + LETTER + ')' + EN + ' +(?=[a-z])', 'g'), '$1-');
	out = out.replace(new RegExp('(\\d[%\\u00B0F]*)' + EN + '(\\$?\\d)', 'g'), '$1 to $2');
	out = out.replace(new RegExp('(' + LETTER + ')' + EN + '([A-Za-z\\u00C0-\\u024F])', 'g'), '$1-$2');
	out = out.replace(new RegExp(EN, 'g'), EM);
	out = pairDashes(out);
	/* A dash before a conjunction joins two clauses (tarte Tatin, and the sweet starters); it never opens a list,
	   so it is a comma whatever the commas after it would tell stripDashes. */
	out = out.replace(new RegExp(EM + '\\s*(?=(?:and|or|but|so|yet|nor|which|while|then|because)\\b)', 'gi'), ', ');
	out = stripDashes(out);
	out = out.replace(/\s+([,:;.!?])/g, '$1').replace(/([,:])\s*[,:]/g, '$1').replace(/,\s*([.!?;])/g, '$1').replace(/ {2,}/g, ' ').trim();
	if (out !== s) {
		const entry = { path: where, before: s, after: out };
		const n = overrideEntryFor(where);
		if (n !== undefined) entry.override = n;
		dashLog.push(entry);
	}
	if (hasDash(out)) fail(`${where}: still carries a dash after the pass: ${out}`);
	return out;
}
/* The spelling map, before the dash pass, over every string: a British form the research wrote becomes the
   house's American one and the change is logged for a reader. */
function spelled(s, where) {
	const { out, found } = americanise(s);
	if (found.length) spellLog.push({ path: where, before: s, after: out, words: found });
	return out;
}
function dashWalk(v, where) {
	if (typeof v === 'string') return dashFree(spelled(v, where), where);
	if (Array.isArray(v)) return v.map((x, i) => dashWalk(x, where + '[' + i + ']'));
	if (v && typeof v === 'object') {
		const o = {};
		for (const k of Object.keys(v)) o[k] = dashWalk(v[k], where + '.' + k);
		return o;
	}
	return v;
}

/* ---------- the wines' split, derived from the guide's own title and GRAPES and REGION lines ---------- */
/* producer, wine, vintage, region, grapes, style, how it is made, how it tastes: the guide prints these
   as one title and one line; the split is the pack's reading of them (pdf p41 to p46). */
const WINE_META = {
	'brennan-s-essential-by-piper-heidsieck-extra-brut-nv': { producer: 'Piper-Heidsieck', wine: "Brennan's Essential Extra Brut", vintage: 'NV', region: 'Champagne, France', grapes: ['Pinot Noir', 'Meunier', 'Chardonnay'], style: 'Extra Brut Champagne, very dry', made: 'Traditional method, a blend of the three Champagne grapes, Extra Brut; the lees age and the dosage wait on the sommelier confirming which cuvée is in the bottle', taste: 'Very dry and crisp, citrus and orchard fruit, brioche, a firm chalky finish' },
	'pierre-sparr-brut-rose-cremant-d-alsace-nv': { producer: 'Pierre Sparr', wine: 'Brut Rosé Crémant d\'Alsace', vintage: 'NV', region: 'Alsace, France', grapes: ['Pinot Noir'], style: 'Sparkling rosé, dry, traditional method', made: 'All Pinot Noir, made the same way as Champagne with the second fermentation in the bottle', taste: 'Dry, strawberry and red currant, a creamy mousse' },
	'rare-brut-2012-coravin': { producer: 'Rare Champagne', wine: 'Rare Brut', vintage: '2012', region: 'Champagne, France', grapes: ['Chardonnay', 'Pinot Noir'], style: 'Prestige vintage Champagne, Chardonnay-led', made: 'A single vintage from Grand Cru sites, about ten years on the lees, poured by the glass from a bottle kept under the Coravin Sparkling stopper', taste: 'White peach, candied citrus, toasted almond, a long fine mousse' },
	'charles-lafitte-brut-champagne-nv': { producer: 'Charles Lafitte', wine: 'Brut Champagne', vintage: 'NV', region: 'Champagne, France', grapes: ['Pinot Noir', 'Meunier', 'Chardonnay'], style: 'Brut Champagne', made: 'Traditional method, a Pinot Noir and Meunier led blend, the tasting pour on both menus', taste: 'Dry, fresh citrus and apple with a light toasty note' },
	'c-h-berres-old-vines-riesling-2022': { producer: 'C.H. Berres', wine: 'Old Vines Riesling', vintage: '2022', region: 'Mosel, Germany', grapes: ['Riesling'], style: 'Light-bodied off-dry Riesling', made: 'Old vines on the Mosel slate, fermented to leave a touch of sweetness at 11.5% alcohol', taste: 'Green apple, peach, slate and racy acidity, a touch of sweetness' },
	'pazo-das-bruxas-albarino-2025': { producer: 'Pazo das Bruxas (Familia Torres)', wine: 'Albariño', vintage: '2025', region: 'Rías Baixas, Spain', grapes: ['Albariño'], style: 'Dry, crisp coastal white, unoaked', made: 'Unoaked Albariño from the Atlantic coast of Galicia, bottled young for freshness', taste: 'Lemon, white peach, a saline sea-spray snap' },
	'domaine-durand-sauvignon-blanc-2025': { producer: 'Domaine Durand', wine: 'Sauvignon Blanc', vintage: '2025', region: 'Loire Valley, France', grapes: ['Sauvignon Blanc'], style: 'Dry, crisp Loire white', made: 'Loire Sauvignon Blanc fermented in steel, no oak', taste: 'Grapefruit, cut grass, a flinty note, bone dry and zippy' },
	'gainey-estate-vineyards-chardonnay-2023': { producer: 'Gainey Estate Vineyards', wine: 'Chardonnay', vintage: '2023', region: 'Sta. Rita Hills, Santa Barbara County, California', grapes: ['Chardonnay'], style: 'Cool-climate Chardonnay, creamy but fresh', made: 'Cool-climate Chardonnay from the ocean-cooled Sta. Rita Hills, with a creamy texture and bright acidity', taste: 'Lemon curd, baked apple, a creamy texture, bright acidity' },
	'domaine-leflaive-macon-verze-2022-coravin': { producer: 'Domaine Leflaive', wine: 'Mâcon-Verzé', vintage: '2022', region: 'Mâconnais, Burgundy, France', grapes: ['Chardonnay'], style: 'White Burgundy, poured by Coravin', made: 'Chardonnay from one of Burgundy\'s great white wine estates, poured by the glass by Coravin needle through the cork', taste: 'Citrus, white flowers, a fine chalky texture and gentle richness' },
	'fichet-chateau-london-macon-ige-2024': { producer: 'Domaine Fichet', wine: 'Château London Mâcon-Igé', vintage: '2024', region: 'Mâconnais, Burgundy, France', grapes: ['Chardonnay'], style: 'Mâcon Chardonnay, the dinner tasting white', made: 'Chardonnay from the Château London parcel at Igé, mostly steel with a touch of old oak', taste: 'Apple, citrus, a gentle roundness and a fresh finish' },
	'minuty-prestige-cotes-de-provence-rose-2024': { producer: 'Minuty', wine: 'Prestige Côtes de Provence Rosé', vintage: '2024', region: 'Provence, France', grapes: ['Grenache'], style: 'Pale dry Provence rosé', made: 'A Grenache-led Provence rosé, pressed pale and bottled young', taste: 'White peach, wild strawberry, citrus zest, a light mineral finish' },
	'damien-martin-bourgogne-pinot-noir-2023': { producer: 'Damien Martin', wine: 'Bourgogne Pinot Noir', vintage: '2023', region: 'Burgundy, France', grapes: ['Pinot Noir'], style: 'Light red Burgundy', made: 'Pinot Noir from a family domaine in the Mâconnais, light tannin and fresh acidity', taste: 'Red cherry, raspberry, a touch of earth, light and silky' },
	'louis-jadot-beaune-1er-cru-2023': { producer: 'Louis Jadot', wine: 'Beaune 1er Cru', vintage: '2023', region: 'Côte de Beaune, Burgundy, France', grapes: ['Pinot Noir'], style: 'Premier Cru red Burgundy, the dinner tasting red', made: 'Pinot Noir from Premier Cru vineyards in Beaune, the top tier there since Beaune has no Grand Cru', taste: 'Bright red fruit, silky texture, a savory edge' },
	'domaine-de-durban-beaumes-de-venise-rouge-2024': { producer: 'Domaine de Durban', wine: 'Beaumes-de-Venise Rouge', vintage: '2024', region: 'Southern Rhône, France', grapes: ['Grenache'], style: 'Medium-bodied Southern Rhône red', made: 'A Grenache blend from the Beaumes-de-Venise cru, ripe and generous with round tannins', taste: 'Ripe dark cherry, plum, dried herbs and pepper, round tannins' },
	'domaine-de-chateaumar-cuvee-vincent-cotes-du-rhone': { producer: 'Domaine de Châteaumar', wine: 'Cuvée Vincent Côtes du Rhône', vintage: '', region: 'Rhône Valley, France', grapes: ['Grenache'], style: 'Juicy Southern Rhône red, the breakfast tasting red', made: 'Old vine Syrah from parcels beside Châteauneuf-du-Pape, soft and juicy', taste: 'Black raspberry, black pepper, spice, soft tannins' },
	'moulin-d-issan-bordeaux-superieur-2023': { producer: 'Château d\'Issan', wine: 'Moulin d\'Issan Bordeaux Supérieur', vintage: '2023', region: 'Bordeaux, France', grapes: ['Cabernet Sauvignon', 'Merlot'], style: 'Medium-bodied Bordeaux', made: 'From the Château d\'Issan team\'s vines outside Margaux, aged partly in new barrels', taste: 'Cassis, plum, cedar, medium body with polished tannin' },
	'inglenook-rubicon-2010': { producer: 'Inglenook', wine: 'Rubicon', vintage: '2010', region: 'Rutherford, Napa Valley, California', grapes: ['Cabernet Sauvignon'], style: 'Full-bodied aged Napa Cabernet', made: 'Inglenook\'s flagship Cabernet Sauvignon based blend from Rutherford, sixteen years old', taste: 'Blackcurrant, cedar, tobacco and earth, tannins softened by age' },
	'paul-hobbs-coombsville-cabernet-sauvignon-2021': { producer: 'Paul Hobbs', wine: 'Coombsville Cabernet Sauvignon', vintage: '2021', region: 'Coombsville, Napa Valley, California', grapes: ['Cabernet Sauvignon'], style: 'Full-bodied Napa Cabernet, the dinner tasting red', made: 'Cabernet Sauvignon from Coombsville, one of Napa\'s cooler corners, opened or decanted 30 to 60 minutes ahead', taste: 'Dark fruit, cocoa, firm structure, kept fresh by the cool site' },
	'dr-hermann-erdener-pralat-riesling-auslese-2014-375-ml': { producer: 'Dr. Hermann', wine: 'Erdener Prälat Riesling Auslese', vintage: '2014', region: 'Mosel, Germany', grapes: ['Riesling'], style: 'Sweet Auslese Riesling, half-bottle', made: 'Selected harvest Riesling from the steep Erdener Prälat vineyard, twelve years old, sold as a 375 ml half-bottle', taste: 'Apricot, honey, pineapple, electric acidity' },
	'domaine-la-tour-vieille-banyuls-reserva-nv': { producer: 'Domaine La Tour Vieille', wine: 'Banyuls Reserva', vintage: 'NV', region: 'Roussillon, France', grapes: ['Grenache'], style: 'Sweet fortified red, vin doux naturel', made: 'Fermentation stopped with grape spirit so the grape\'s own sugar stays, then aged the oxidative way', taste: 'Dried fig, walnut, caramel, coffee and orange peel' }
};

/* The cocktails' families and base spirits, read off the guide's menu lines (pdf p38 to p40, p50). */
const COCKTAIL_META = {
	'brandy-milk-punch': { family: 'Milk punch', spirit: 'Brandy' },
	'bloody-bull': { family: 'Bloody Mary', spirit: 'Vodka' },
	'classic-sazerac': { family: 'Sazerac', spirit: 'Rye whiskey' },
	'brennan-s-irish-coffee': { family: 'Irish coffee', spirit: 'Irish whiskey' },
	'dulce-de-leche': { family: 'Dessert cocktail', spirit: 'Rum' }
};

/* The two tastings as the guide's must-knows print them (pdf p49), by name. */
const TASTINGS = [
	{
		name: 'Traditional Breakfast at Brennan’s', price: '$80', meal: 'Breakfast & lunch', includesDrinks: true,
		note: 'Tasting portions of each course and all listed drinks included. Take the filet temperature with the order. Do not double-pour the included Champagne.',
		courses: [
			{ label: 'Eye opener', dishes: [], pour: 'Brandy Milk Punch', pourText: 'Brandy Milk Punch' },
			{ label: 'First course', dishes: ['Baked Apple'], pour: '', pourText: '' },
			{ label: 'Second course', dishes: ['Turtle Soup', 'Seafood Gumbo'], pour: 'Bloody Bull', pourText: 'Turtle soup or seafood gumbo, with a Bloody Bull' },
			{ label: 'Third course', dishes: ['Eggs Hussarde'], pour: 'Charles Lafitte Brut Champagne NV', pourText: 'Charles Lafitte Brut, 4 oz' },
			{ label: 'Fourth course', dishes: ['Petite Filet Mignon'], pour: 'Domaine de Châteaumar ‘Cuvée Vincent’ Côtes du Rhône', pourText: 'Domaine de Châteaumar Cuvée Vincent Côtes du Rhône, 4 oz' },
			{ label: 'Fifth course', dishes: ['World Famous Bananas Foster'], pour: '', pourText: 'Bananas Foster tableside with Congregation Coffee & Chicory' }
		]
	},
	{
		name: 'Dinner tasting', price: '$80', meal: 'Dinner', includesDrinks: false,
		note: 'Five courses. Wine pairing supplement $120, five 4 oz pours: Charles Lafitte Brut, Fichet Mâcon-Igé 2024, Louis Jadot Beaune 1er Cru 2023, Paul Hobbs Coombsville Cabernet 2021, La Tour Vieille Banyuls Reserva. Open the Jadot 20 to 30 minutes ahead, the Hobbs 30 to 60; pour the Banyuls before the Snickers lands.',
		courses: [
			{ label: 'First course', dishes: ['Grand Isle Jewel Oysters'], pour: 'Charles Lafitte Brut Champagne NV', pourText: 'Charles Lafitte Brut, 4 oz, on the pairing' },
			{ label: 'Second course', dishes: ['Louisiana BBQ Lobster'], pour: 'Fichet ‘Château London’ Mâcon-Igé 2024', pourText: 'Fichet Château London Mâcon-Igé 2024, 4 oz, on the pairing' },
			{ label: 'Third course', dishes: ['Redfish Véronique'], pour: 'Louis Jadot Beaune 1er Cru 2023', pourText: 'Louis Jadot Beaune 1er Cru 2023, 4 oz, on the pairing' },
			{ label: 'Fourth course', dishes: ['Roasted Rohan Duck Breast'], pour: 'Paul Hobbs Coombsville Cabernet Sauvignon 2021', pourText: 'Paul Hobbs Coombsville Cabernet Sauvignon 2021, 4 oz, on the pairing' },
			{ label: 'Fifth course', dishes: ['The Snickers'], pour: 'Domaine La Tour Vieille Banyuls Reserva NV', pourText: 'Domaine La Tour Vieille Banyuls Reserva, 4 oz, on the pairing' }
		]
	}
];

/* The two spirit-free drinks, from the guide's Spirit-free must-know (pdf p50): parts as printed, no measures. */
const SPIRIT_FREE = [
	{ name: 'Catalina Island', price: '$15', spec: ['Seedlip Grove 42', 'local watermelon', 'tonic'], parts: { main: 'Seedlip Grove 42, a citrus non-alcoholic spirit', technique: 'built long with tonic', sauce: 'local watermelon', sides: '', taste: 'bright and dry' }, family: 'Spirit-free highball', note: 'Draft from the guide’s Spirit-free must-know: parts as printed, no measures. Offer it to guests who skip the flambé or the milk punch.' },
	{ name: 'Black Hills', price: '$14', spec: ["Lyre's N/A agave", 'basil purée', 'lime'], parts: { main: 'Lyre’s non-alcoholic agave spirit', technique: 'shaken with basil purée and lime', sauce: 'basil purée and lime', sides: '', taste: 'a no-alcohol margarita idea, herbal and sharp' }, family: 'Spirit-free sour', note: 'Draft from the guide’s Spirit-free must-know: parts as printed, no measures. Lyre’s is labeled under 0.5 percent alcohol, so say non-alcoholic, not zero.' }
];

/* Names a scenario, a term or a mix-up may use for an item, so itemIds resolve from prose. */
const ALIASES = [
	[/bananas foster|the foster\b/i, 'World Famous Bananas Foster'], [/turtle soup/i, 'Turtle Soup'], [/\bgumbo\b/i, 'Seafood Gumbo'],
	[/eggs hussarde|\bhussarde\b/i, 'Eggs Hussarde'], [/eggs sardou|\bsardou\b/i, 'Eggs Sardou'], [/eggs owen/i, 'Eggs Owen'],
	[/chateaubriand/i, 'Roasted Chateaubriand'], [/rubicon/i, 'Inglenook ‘Rubicon’ 2010'], [/\bRare\b/, 'Rare Brut 2012 (Coravin)'],
	[/piper-heidsieck|house champagne|house bubbles/i, 'Brennan’s Essential by Piper-Heidsieck Extra Brut NV'],
	[/cherries jubilee|\bjubilee\b/i, 'Cherries Jubilee'], [/lemon tart/i, 'Lemon Tart'], [/tarte tatin/i, 'Pineapple Tarte Tatin'],
	[/catalina island/i, 'Catalina Island'], [/black hills/i, 'Black Hills'], [/tomato tostada|\btostada\b/i, 'Creole Tomato Tostada'],
	[/blackened tofu|\btofu\b/i, 'Blackened Tofu'], [/smoked cauliflower/i, 'Smoked Cauliflower'], [/french toast/i, 'Framboise French Toast'],
	[/creole caesar|\bcaesar\b/i, 'Creole Caesar'], [/pecan gulf fish|pecan fish/i, 'Pecan Gulf Fish'], [/crab & corn omelette|\bomelette\b/i, 'Crab & Corn Omelette'],
	[/shrimp & grits|shrimp and grits/i, 'New Orleans Shrimp & Grits'], [/duck confit waffle|duck waffle/i, 'Duck Confit Waffle'],
	[/louisiana oysters/i, 'Louisiana Oysters'], [/crab claws/i, 'Louisiana Crab Claws'], [/grand isle|jewel oysters|raw oysters|\boysters\b/i, 'Grand Isle Jewel Oysters'],
	[/milk punch/i, 'Brandy Milk Punch'], [/bloody bull/i, 'Bloody Bull'], [/dulce de leche/i, 'Dulce de Leche'], [/sazerac/i, 'Classic Sazerac'],
	[/irish coffee/i, 'Brennan’s Irish Coffee'], [/moulin d.issan/i, 'Moulin d’Issan Bordeaux Supérieur 2023'], [/\bdurban\b/i, 'Domaine de Durban Beaumes-de-Venise Rouge 2024'],
	[/bread pudding/i, 'New Orleans Bread Pudding'], [/\bbiscuit\b/i, 'Buttermilk Biscuit'], [/cheddar grits|(?<!shrimp & |shrimp and )\bgrits\b/i, 'Cheddar Grits'],
	[/brabant potatoes|\bpotatoes\b/i, 'Brabant Potatoes'], [/egg any style/i, 'Egg Any Style'], [/\bbacon\b/i, 'Thick-Cut Bacon'],
	[/petite filet|\bfilet\b/i, 'Petite Filet Mignon'], [/baked apple/i, 'Baked Apple'], [/coffee cake/i, 'Café Brûlot Coffee Cake'],
	[/papillote/i, 'Gulf Fish en Papillote'], [/the snickers/i, 'The Snickers'], [/bbq lobster|\blobster\b/i, 'Louisiana BBQ Lobster'],
	[/rohan duck|duck breast/i, 'Roasted Rohan Duck Breast'], [/redfish/i, 'Redfish Véronique'], [/poussin|\bhen\b/i, 'Poussin à la Moutarde'],
	[/hanger steak/i, 'Creole Hanger Steak'], [/steak tartare|\btartare\b/i, 'Steak Tartare Cannoli'], [/blackberry trifle|\btrifle\b/i, 'Blackberry Trifle'],
	[/succotash/i, 'Succotash'], [/shells & cheese|shells and cheese/i, 'Shells & Cheese'], [/maggie/i, 'Maggie’s Mushrooms'], [/rice dressing/i, 'South Louisiana Rice Dressing'],
	[/creamed spinach/i, 'Creamed Spinach'], [/sausage/i, 'Housemade Pork Sausage Patty'], [/leflaive/i, 'Domaine Leflaive Mâcon-Verzé 2022 (Coravin)'],
	[/gainey/i, 'Gainey Estate Vineyards Chardonnay 2023'], [/berres|riesling/i, 'C.H. Berres ‘Old Vines’ Riesling 2022'], [/banyuls/i, 'Domaine La Tour Vieille Banyuls Reserva NV'],
	[/auslese/i, 'Dr. Hermann ‘Erdener Prälat’ Riesling Auslese 2014 (375 ml)'], [/charles lafitte/i, 'Charles Lafitte Brut Champagne NV'], [/jadot|beaune/i, 'Louis Jadot Beaune 1er Cru 2023'],
	[/paul hobbs/i, 'Paul Hobbs Coombsville Cabernet Sauvignon 2021'], [/fichet|mâcon-igé/i, 'Fichet ‘Château London’ Mâcon-Igé 2024'], [/châteaumar|chateaumar/i, 'Domaine de Châteaumar ‘Cuvée Vincent’ Côtes du Rhône'],
	[/pierre sparr|\bsparr\b/i, 'Pierre Sparr Brut Rosé Crémant d’Alsace NV'], [/minuty/i, 'Minuty ‘Prestige’ Côtes de Provence Rosé 2024'], [/damien martin|bourgogne pinot/i, 'Damien Martin Bourgogne Pinot Noir 2023'],
	[/albariño|albarino|pazo das bruxas/i, 'Pazo das Bruxas Albariño 2025'], [/domaine durand|loire sauvignon/i, 'Domaine Durand Sauvignon Blanc 2025']
];

/* ---------- the model ---------- */
const model = {
	card: {
		name: 'Brennan’s', address: '417 Royal Street, New Orleans', phone: '', site: '', meals: [], history: '', dressCode: '',
		menusReadOn: parsed.readOn,
		sources: parsed.sources.map((s) => ({ title: s.title, url: s.url, readOn: parsed.readOn }))
	},
	dishes: [], wines: [], cocktails: [], tastings: [], terms: [], scenarios: [], mixUps: [], mustKnows: [], asks: [], disputes: []
};

const tastingMeal = (seg) => (/breakfast tasting/i.test(seg) ? 'Breakfast tasting' : /dinner tasting/i.test(seg) ? 'Dinner tasting' : seg);
for (const it of parsed.items) {
	const meals = it.meals.map((m) => (/^Tasting menus/i.test(m) ? tastingMeal(m) : m));
	const base = {
		name: it.name, section: it.section, signature: !!it.signature, meals: [...new Set(meals)],
		price: it.prices.length ? it.prices[0].printed : '',
		prices: it.prices.map((p) => ({ meal: p.meal, printed: p.printed })),
		description: it.menuLine, parts: Object.assign({}, it.parts), lines: Object.assign({}, it.lines),
		serviceNote: it.serviceNote || '', say: '', why: '', pairs: '', origin: '', kept: [], guest: ''
	};
	if (it.kind === 'dish') {
		base.pairing = it.pairing ? Object.assign({}, it.pairing, { principles: [...it.pairing.principles] }) : null;
		model.dishes.push(base);
	} else {
		const meta = COCKTAIL_META[slug(it.name)];
		if (!meta) fail(`${REL(PARSED)}: no family and spirit for the cocktail ${it.name}`);
		base.spec = it.menuLine.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
		base.method = it.parts.technique || '';
		base.family = meta.family;
		base.spirit = meta.spirit;
		base.zeroProof = false;
		base.note = 'A Brennan’s signature drink.';
		model.cocktails.push(base);
	}
}
for (const z of SPIRIT_FREE) {
	model.cocktails.push({
		name: z.name, section: 'Spirit-free', signature: false, meals: ['Breakfast & lunch', 'Dinner'], price: z.price,
		prices: [{ meal: 'Breakfast & lunch', printed: z.price }, { meal: 'Dinner', printed: z.price }],
		description: z.spec.join(', '), parts: z.parts, lines: null, serviceNote: '', say: '', why: '', pairs: '', origin: '', kept: [], guest: '',
		spec: z.spec, method: z.parts.technique, family: z.family, spirit: '', zeroProof: true, note: z.note
	});
}
for (const w of parsed.wines) {
	const meta = WINE_META[slug(w.name)];
	if (!meta) fail(`${REL(PARSED)}: no split for the wine ${w.name} (slug ${slug(w.name)})`);
	const priced = !!w.price;
	const glass = priced && /glass$/.test(w.price) ? w.price.replace(/\s*glass$/, '') : '';
	const bottle = priced && /half-bottle$/.test(w.price) ? w.price : '';
	model.wines.push({
		name: w.name, section: w.group.replace(/\s+By the glass.*$/, '').replace(/\s+Half-bottle.*$/, ''), group: w.group,
		meals: priced ? ['Breakfast & lunch', 'Dinner'] : (/Châteaumar/.test(w.name) ? ['Breakfast tasting'] : /Lafitte/.test(w.name) ? ['Breakfast tasting', 'Dinner tasting'] : ['Dinner tasting']),
		price: w.price || '', prices: priced ? [{ meal: 'By the glass', printed: w.price }] : [],
		producer: meta.producer, wine: meta.wine, vintage: meta.vintage, region: meta.region, grapes: [...meta.grapes], style: meta.style, made: meta.made, taste: meta.taste,
		glass, bottle, pours: priced ? [] : ['4 oz'],
		profile: w.profile, sayIt: w.sayIt, goesWith: w.goesWith, serve: w.serve, firstPickFor: [...w.firstPickFor],
		serviceNote: '', say: '', why: '', pairs: '', origin: '', kept: []
	});
}
for (const t of TASTINGS) model.tastings.push(JSON.parse(JSON.stringify(t)));
for (const t of parsed.terms) model.terms.push({ term: t.term, say: t.say === EM || t.say === '-' ? '' : t.say, toGuest: t.toGuest });
for (const s of parsed.scenarios) model.scenarios.push({ title: s.title, guest: s.guest, you: s.you, principle: s.principle });
for (const m of parsed.mixUps) model.mixUps.push({ a: m.a, b: m.b, difference: m.difference, ask: m.ask });
for (const k of parsed.mustKnows) model.mustKnows.push({ title: k.title, body: k.body });

/* ---------- the overrides ---------- */
const LISTS = { dish: 'dishes', wine: 'wines', cocktail: 'cocktails', tasting: 'tastings', term: 'terms', scenario: 'scenarios', mixup: 'mixUps', mustknow: 'mustKnows', ask: 'asks', dispute: 'disputes' };
const KEY = { dishes: 'name', wines: 'name', cocktails: 'name', tastings: 'name', terms: 'term', scenarios: 'title', mustKnows: 'title' };
function findTarget(target, n) {
	if (target === 'house') return { rec: model.card, list: 'house' };
	const at = target.indexOf(':');
	if (at < 0) fail(`${REL(OVERRIDES)} entry ${n}: the target ${target} has no list`);
	const list = LISTS[target.slice(0, at)];
	const name = target.slice(at + 1);
	if (!list) fail(`${REL(OVERRIDES)} entry ${n}: unknown list in ${target}`);
	if (name === '+') return { rec: null, list };
	const key = KEY[list];
	const rec = model[list].find((r) => slug(r[key]) === slug(name));
	if (!rec) fail(`${REL(OVERRIDES)} entry ${n}: ${target} names nothing in the model`);
	return { rec, list };
}
function getPath(rec, field) {
	const parts = field.split('.');
	let o = rec;
	for (let i = 0; i < parts.length - 1; i++) { o = o ? o[parts[i]] : undefined; }
	return { holder: o, key: parts[parts.length - 1] };
}
const applied = [];
const overrideAt = new Map();
/* A dash anywhere in an override's value is refused with the entry and the field named: the file is hand
   written and dash free, and a slip there would otherwise be stripped and logged as if the guide had
   carried it. (A replace's fromRe is a regex source and ASCII, so an escape there is not a dash.) */
function noDash(v, n, at) {
	if (typeof v === 'string') { if (hasDash(v)) fail(`${REL(OVERRIDES)} entry ${n}: ${at} carries a dash; write it without one`); return; }
	if (Array.isArray(v)) { v.forEach((x, i) => noDash(x, n, at + '[' + i + ']')); return; }
	if (v && typeof v === 'object') for (const k of Object.keys(v)) if (k !== 'fromRe') noDash(v[k], n, at + '.' + k);
}
function pathOf(list, rec, field) {
	if (list === 'house') return 'model.card.' + field;
	const i = model[list].indexOf(rec);
	return 'model.' + list + '[' + i + ']' + (field ? '.' + field : '');
}
overrides.entries.forEach((e, n) => {
	const op = e.op || 'set';
	noDash(e.value, n, 'value');
	const { rec, list } = findTarget(e.target, n);
	if (op === 'add') {
		const v = e.value;
		if (list === 'terms') {
			if (model.terms.some((t) => slug(t.term) === slug(v.term))) { applied.push({ n, skipped: 'term exists' }); return; }
			model.terms.push({ term: v.term, say: v.say || '', toGuest: v.toGuest || '' });
		} else if (list === 'scenarios') {
			if (model.scenarios.some((s) => slug(s.title) === slug(v.title))) fail(`${REL(OVERRIDES)} entry ${n}: the scenario ${v.title} exists`);
			model.scenarios.push({ title: v.title, guest: v.guest, you: v.you, principle: v.principle });
		} else if (list === 'mixUps') {
			model.mixUps.push({ a: v.a, b: v.b, difference: v.difference, ask: v.ask });
		} else if (list === 'mustKnows') {
			if (model.mustKnows.some((k) => slug(k.title) === slug(v.title))) fail(`${REL(OVERRIDES)} entry ${n}: the must-know ${v.title} exists`);
			model.mustKnows.push({ title: v.title, body: v.body });
		} else if (list === 'asks') {
			model.asks.push({ question: v.question, askWhom: v.askWhom || 'manager', items: v.items || [], blocksField: v.blocksField || '' });
		} else if (list === 'disputes') {
			model.disputes.push({ item: v.item || '', field: v.field, a: v.a, b: v.b });
		} else if (e.field === 'kept' && rec) {
			rec.kept.push({ q: v.q, a: v.a });
		} else fail(`${REL(OVERRIDES)} entry ${n}: add on ${e.target} ${e.field || ''} is not a list this builder adds to`);
		if (rec) overrideAt.set(pathOf(list, rec, e.field === 'kept' ? 'kept[' + (rec.kept.length - 1) + ']' : e.field), n);
		else overrideAt.set('model.' + list + '[' + (model[list].length - 1) + ']', n);
		applied.push({ n, op, target: e.target });
		return;
	}
	if (!rec) fail(`${REL(OVERRIDES)} entry ${n}: ${op} needs a record`);
	const { holder, key } = getPath(rec, e.field);
	if (!holder || typeof holder !== 'object') fail(`${REL(OVERRIDES)} entry ${n}: ${e.target} has no ${e.field}`);
	if (op === 'set') {
		holder[key] = e.value;
	} else if (op === 'append') {
		const cur = typeof holder[key] === 'string' ? holder[key] : '';
		holder[key] = cur ? cur.replace(/\s+$/, '') + ' ' + e.value : e.value;
	} else if (op === 'replace') {
		const cur = holder[key];
		if (typeof cur !== 'string') fail(`${REL(OVERRIDES)} entry ${n}: ${e.target}.${e.field} is not a string`);
		let next;
		if (e.value.fromRe) {
			const re = new RegExp(e.value.fromRe);
			if (!re.test(cur)) fail(`${REL(OVERRIDES)} entry ${n}: ${e.target}.${e.field} does not match /${e.value.fromRe}/`);
			next = cur.replace(re, e.value.to);
		} else {
			if (hasDash(e.value.from)) fail(`${REL(OVERRIDES)} entry ${n}: 'from' carries a dash; use fromRe`);
			if (cur.indexOf(e.value.from) < 0) fail(`${REL(OVERRIDES)} entry ${n}: ${e.target}.${e.field} does not contain: ${e.value.from}`);
			next = cur.split(e.value.from).join(e.value.to);
		}
		holder[key] = next;
	} else fail(`${REL(OVERRIDES)} entry ${n}: unknown op ${op}`);
	overrideAt.set(pathOf(list, rec, e.field), n);
	applied.push({ n, op, target: e.target, field: e.field });
});

/* The pairing principles outside the nine, mapped or dropped per overrides.principles. */
const PMAP = overrides.principles.map;
const principleChanges = [];
for (const d of model.dishes) {
	if (!d.pairing) continue;
	const out = [];
	for (const p of d.pairing.principles) {
		if (C.PRINCIPLES.includes(p)) { if (!out.includes(p)) out.push(p); continue; }
		const to = Object.prototype.hasOwnProperty.call(PMAP, p) ? PMAP[p] : undefined;
		if (to === undefined) fail(`${d.name}: the principle ${p} is outside the nine and overrides.principles.map does not place it`);
		principleChanges.push({ dish: d.name, from: p, to: to === null ? '(dropped)' : (out.includes(to) ? to + ' (already there)' : to) });
		if (to && !out.includes(to)) out.push(to);
	}
	d.pairing.principles = out;
}

/* The card's dress code, from the must-know that carries it. */
const dressKnow = model.mustKnows.find((k) => /^dress code/i.test(k.title));
if (!dressKnow) fail('no must-know titled Dress code');
model.card.dressCode = dressKnow.body.split(/\s+(?=The kitchen)/)[0].trim();

/* ---------- the dash pass over the whole model ---------- */
const clean = dashWalk(model, 'model');

/* ---------- the house ---------- */
const houseId = idFor('house', 'brennans');
const house = emptyHouse(houseId, clean.card.name, 'pack', BUILD_TS);
house.address = clean.card.address;
house.phone = clean.card.phone;
house.site = clean.card.site;
house.meals = clean.card.meals;
house.dressCode = clean.card.dressCode;
house.menusReadOn = clean.card.menusReadOn;
house.sources = clean.card.sources;
if (clean.card.history) house.history = mark(clean.card.history);

const byName = new Map();
const nameOf = (list, rec) => rec[KEY[list]];
for (const list of ['dishes', 'wines', 'cocktails']) for (const r of clean[list]) {
	r.id = idFor(list, slug(r.name));
	byName.set(slug(r.name), r.id);
}
const wineKey = (s) => slug(String(s).replace(/\s*\$\d+\s*(glass|half-bottle)\s*$/i, '').replace(/\s*\(coravin\)\s*/i, ' '));
const wineIds = new Map();
for (const w of clean.wines) wineIds.set(wineKey(w.name), w.id);
function wineId(name, where) {
	if (!name) return '';
	const id = wineIds.get(wineKey(name));
	if (!id) fail(`${where}: the wine ${name} is not on the list`);
	return id;
}
function itemId(name, where) {
	const id = byName.get(slug(name));
	if (!id) fail(`${where}: ${name} is not a dish, wine or cocktail in the house`);
	return id;
}
const zeroIds = new Map(clean.cocktails.filter((c) => c.zeroProof).map((c) => [slug(c.name), c.id]));

/* Pronunciation: the terms whose word sits in the item's name. */
const termList = clean.terms;
function termsIn(text) {
	const f = ' ' + fold(text).replace(/[^a-z0-9']+/g, ' ') + ' ';
	const out = [];
	for (const t of termList) {
		const full = ' ' + fold(t.term).replace(/[^a-z0-9']+/g, ' ') + ' ';
		if (f.indexOf(full.trim() ? full : '\u0000') >= 0) { out.push(t); continue; }
		const first = fold(t.term).split(/[^a-z0-9']+/)[0];
		if (first.length >= 5 && f.indexOf(' ' + first + ' ') >= 0 && !/^(creole|grand|domaine|chateau|extra|louis|pierre|charles|paul)$/.test(first)) out.push(t);
	}
	return out;
}
function sayLine(name) {
	const hits = termsIn(name).filter((t) => t.say && !/^as it reads/i.test(t.say) && !/^ask the kitchen/i.test(t.say));
	if (!hits.length) return 'Say it as it reads: ' + name + '.';
	return hits.map((t) => t.term + ': ' + t.say).join('; ') + '.';
}
function itemsFor(text) {
	const ids = [];
	for (const [re, name] of ALIASES) {
		if (re.test(text)) { const id = byName.get(slug(name)); if (id && !ids.includes(id)) ids.push(id); }
	}
	return ids;
}
const linesMark = (l) => (l && (l.s10 || l.s20 || l.s45) ? mark({ s10: l.s10 || '', s20: l.s20 || '', s45: l.s45 || '' }) : undefined);
const partsMark = (p) => (p && Object.values(p).some(Boolean) ? mark({ main: p.main || '', technique: p.technique || '', sauce: p.sauce || '', sides: p.sides || '', taste: p.taste || '' }) : undefined);
const keptNotes = (k) => (k && k.length ? k.map((n) => ({ q: n.q, a: n.a, ts: BUILD_TS })) : undefined);
const put = (rec, field, value) => { if (value !== undefined && value !== '' && value !== null) rec[field] = value; };
const itemBase = (r, list) => ({
	id: r.id, house: houseId, kind: list === 'dishes' ? 'dish' : list === 'wines' ? 'wine' : 'cocktail', name: r.name, section: r.section,
	meals: r.meals, price: r.price, prices: r.prices
});

for (const r of clean.dishes) {
	const d = itemBase(r, 'dishes');
	d.description = r.description;
	d.ingredients = r.description.split(/,\s*|\s+and\s+(?=[a-z])/).map((s) => s.trim()).filter((s) => s && !/no description printed/i.test(s));
	d.marks = [];
	d.signature = r.signature;
	put(d, 'say', mark(r.say || sayLine(r.name)));
	if (r.guest || (r.lines && r.lines.s20)) put(d, 'guest', mark(r.guest || r.lines.s20));
	const why = r.why || (r.parts && r.parts.taste ? (r.signature ? 'A Brennan’s signature: ' : '') + sentence(r.signature ? r.parts.taste : cap(r.parts.taste)) : '');
	put(d, 'why', why ? mark(why) : undefined);
	let pairs = r.pairs;
	if (!pairs && r.pairing) {
		const w = clean.wines.find((x) => x.id === wineId(r.pairing.wine, r.name));
		pairs = 'First pick: ' + w.name.replace(/\s*\(Coravin\)/, '') + (w.glass ? ', ' + w.glass + ' the glass' : w.bottle ? ', ' + w.bottle : ', a tasting pour') + '. Without alcohol: ' + (r.pairing.zeroProof || 'ask the bar') + '.';
	}
	put(d, 'pairs', pairs ? mark(pairs) : undefined);
	put(d, 'origin', r.origin ? mark(r.origin) : undefined);
	put(d, 'ingredientsNamed', d.ingredients.length ? mark(d.ingredients) : undefined);
	put(d, 'parts', partsMark(r.parts));
	put(d, 'lines', linesMark(r.lines));
	if (r.pairing) {
		const p = r.pairing;
		const zp = p.zeroProof ? zeroIds.get(slug(p.zeroProof)) || '' : '';
		const zpWhy = zp ? p.zeroProofWhy || '' : (p.zeroProof ? cap(p.zeroProof) + ': ' + (p.zeroProofWhy || '') : (p.zeroProofText || ''));
		put(d, 'pairing', mark({
			wineId: wineId(p.wine, r.name), why: p.why || '', sayIt: p.sayIt || '', whyThisWine: p.whyThisWine || '', palate: p.palate || '',
			principles: p.principles, secondId: p.second ? wineId(p.second, r.name) : '', secondWhy: p.secondWhy || '', stepUp: p.stepUp || '',
			serve: p.serve || '', avoid: p.avoid || '', zeroProofId: zp, zeroProofWhy: zpWhy.trim()
		}));
	}
	put(d, 'kept', keptNotes(r.kept));
	d.serviceNote = r.serviceNote || '';
	d.ts = BUILD_TS;
	house.dishes.push(d);
}
for (const r of clean.wines) {
	const w = itemBase(r, 'wines');
	Object.assign(w, { producer: r.producer, wine: r.wine, vintage: r.vintage, region: r.region, grapes: r.grapes, style: r.style, glass: r.glass, bottle: r.bottle, pours: r.pours });
	put(w, 'say', mark(r.say || sayLine(r.name.replace(/\s*\(Coravin\)/, ''))));
	put(w, 'guest', mark(r.sayIt));
	const firstIds = r.firstPickFor.map((n) => itemId(n, r.name));
	const why = r.why || (r.firstPickFor.length ? 'First pick for ' + r.firstPickFor.join(', ') + '.' : r.price ? 'On the by-the-glass list, ' + r.group.replace(/\s+By the glass.*$/, '') + '.' : 'Poured on the tasting menus; not on the by-the-glass list.');
	put(w, 'why', mark(why));
	put(w, 'pairs', mark(r.pairs || r.goesWith));
	put(w, 'origin', r.origin ? mark(r.origin) : undefined);
	put(w, 'profile', mark(r.profile));
	put(w, 'goesWith', mark(r.goesWith));
	put(w, 'firstPickIds', firstIds.length ? mark(firstIds) : undefined);
	put(w, 'serve', mark(r.serve));
	put(w, 'parts', partsMark({ main: r.grapes.join(', ') + ' from ' + r.region, technique: r.made, sauce: r.profile.split(/(?<=[.!?])\s+/).slice(0, 2).join(' '), sides: r.goesWith, taste: r.taste }));
	put(w, 'kept', keptNotes(r.kept));
	w.serviceNote = r.serviceNote || '';
	w.ts = BUILD_TS;
	house.wines.push(w);
}
for (const r of clean.cocktails) {
	const c = itemBase(r, 'cocktails');
	Object.assign(c, { spec: r.spec, method: r.method, glass: '', garnish: '', note: r.note, family: r.family, spirit: r.spirit, zeroProof: r.zeroProof });
	put(c, 'say', mark(r.say || sayLine(r.name)));
	if (r.guest || (r.lines && r.lines.s20)) put(c, 'guest', mark(r.guest || r.lines.s20));
	put(c, 'why', r.why ? mark(r.why) : undefined);
	put(c, 'pairs', r.pairs ? mark(r.pairs) : undefined);
	put(c, 'origin', r.origin ? mark(r.origin) : undefined);
	put(c, 'ingredientsNamed', mark(r.spec));
	put(c, 'parts', partsMark(r.parts));
	put(c, 'lines', linesMark(r.lines));
	put(c, 'kept', keptNotes(r.kept));
	c.serviceNote = r.serviceNote || '';
	c.ts = BUILD_TS;
	house.cocktails.push(c);
}
for (const t of clean.tastings) {
	house.tastings.push({
		id: idFor('tastings', slug(t.name)), name: t.name, price: t.price, meal: t.meal, includesDrinks: t.includesDrinks,
		courses: t.courses.map((c, i) => ({
			n: i + 1, label: c.label, dishIds: c.dishes.map((n) => itemId(n, t.name)),
			pourId: c.pour ? (byName.get(slug(c.pour)) || wineId(c.pour, t.name)) : '', pourText: c.pourText
		})),
		note: t.note, ts: BUILD_TS
	});
}
const allText = (r) => [r.name, r.description, r.spec ? r.spec.join(' ') : '', r.parts ? Object.values(r.parts).join(' ') : ''].join(' ');
for (const t of clean.terms) {
	const x = { id: idFor('lexicon', slug(t.term)), term: t.term };
	put(x, 'say', mark(t.say || 'As it reads: ' + t.term + '.'));
	put(x, 'toGuest', t.toGuest ? mark(t.toGuest) : undefined);
	const ids = [];
	for (const list of ['dishes', 'wines', 'cocktails']) for (const r of clean[list]) {
		if (termsIn(allText(r)).some((h) => h === t)) ids.push(r.id);
	}
	for (const id of itemsFor(t.term)) if (!ids.includes(id)) ids.push(id);
	x.itemIds = ids;
	x.ts = BUILD_TS;
	house.lexicon.push(x);
}
for (const s of clean.scenarios) {
	house.scenarios.push({ id: idFor('scenarios', slug(s.title)), title: s.title, guest: s.guest, you: mark(s.you), principle: mark(s.principle), itemIds: itemsFor(s.title + ' ' + s.guest + ' ' + s.you), ts: BUILD_TS });
}
for (const m of clean.mixUps) {
	house.mixUps.push({ id: idFor('mixUps', slug(m.a) + '-vs-' + slug(m.b)), aId: itemId(m.a, 'mix-up'), bId: itemId(m.b, 'mix-up'), difference: mark(m.difference), ask: mark(m.ask), ts: BUILD_TS });
}
for (const k of clean.mustKnows) {
	const r = { id: idFor('mustKnows', slug(k.title).slice(0, 60)), title: k.title };
	put(r, 'body', k.body ? mark(k.body) : undefined);
	r.ts = BUILD_TS;
	house.mustKnows.push(r);
}
for (const a of clean.asks) {
	const r = { id: idFor('askAtLineup', slug(a.question).slice(0, 60)), question: a.question, askWhom: a.askWhom, itemIds: a.items.map((n) => itemId(n, 'askAtLineup')) };
	if (a.blocksField) r.blocksField = a.blocksField;
	r.ts = BUILD_TS;
	house.askAtLineup.push(r);
}
for (const u of clean.disputes) {
	const r = { id: idFor('disputes', slug((u.item || 'house') + '-' + u.field).slice(0, 60)), field: u.field, a: u.a, b: u.b, ts: BUILD_TS };
	if (u.item) r.itemId = itemId(u.item, 'dispute');
	house.disputes.push(r);
}
for (const step of C.BUILD_STEPS) house.build[step] = BUILD_TS;
house.began = 'pack';
house.lastWrite = BUILD_TS;
house.pack = { id: 'brennans-new-orleans', builtBy: 'claude-code', builtAt: new Date(BUILD_TS).toISOString(), version: 1 };

/* ---------- through the normaliser, as proof of shape ---------- */
const { house: normal, report } = normaliseHouse(house);
const bad = report.filter((r) => r.code === 'id' || r.code === 'forbidden');
if (bad.length) fail('the normaliser changed the house: ' + bad.map((r) => r.path + ' ' + r.said).join('; '));
if (!lib.sameJson(normal, house)) {
	const a = JSON.stringify(normal); const b = JSON.stringify(house);
	fail('the normaliser changed the house (' + a.length + ' against ' + b.length + ' bytes); run validate-pack for the detail');
}

/* ---------- write ---------- */
fs.writeFileSync(OUT, JSON.stringify(house, null, '\t') + '\n');
fs.writeFileSync(DASH_LOG, JSON.stringify({ about: 'Every string the dash pass changed while building the Brennan\'s house, before and after, for a person to read for a changed meaning; an entry with an override number is a string an overrides.json entry set, not the guide\'s.', count: dashLog.length, changes: dashLog }, null, '\t') + '\n');
fs.writeFileSync(SPELL_LOG, JSON.stringify({ about: 'Every string the spelling map changed while building the Brennan\'s house: the research writes British English and the house is American, so each British form became its American spelling.', count: spellLog.length, changes: spellLog }, null, '\t') + '\n');
if (JSON.stringify(ledger) !== ledgerBefore) {
	const sorted = {};
	for (const k of Object.keys(ledger).sort()) sorted[k] = ledger[k];
	fs.writeFileSync(LEDGER, JSON.stringify(sorted, null, '\t') + '\n');
}
const zero = house.cocktails.filter((c) => c.zeroProof).length;
console.log(`build-brennans: ${REL(OUT)}: ${house.dishes.length} dishes, ${house.cocktails.length} cocktails (${zero} spirit-free), ${house.wines.length} wines, ${house.tastings.length} tastings, ${house.lexicon.length} terms, ${house.scenarios.length} scenarios, ${house.mixUps.length} mix-ups, ${house.mustKnows.length} must-knows, ${house.askAtLineup.length} to ask at lineup, ${house.disputes.length} disputes; ${overrides.entries.length} overrides applied (${applied.filter((a) => a.skipped).length} skipped), ${principleChanges.length} principles mapped, ${dashLog.length} strings dash-stripped (${dashLog.filter((d) => d.override !== undefined).length} set by an override), ${spellLog.length} strings respelled American, ${minted.length} ids minted`);
if (principleChanges.length && args.includes('--verbose')) for (const p of principleChanges) console.log('  principle ' + p.dish + ': ' + p.from + ' to ' + p.to);
