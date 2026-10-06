#!/usr/bin/env node
/* build-brennans.mjs: house/brennans/parsed.json plus house/brennans/overrides.json into one House
   in the shape of house-min.json, through the engine's emptyHouse and mintId.

   What it does, in order:
   1. loads the engine (../oot-house.js) with node:vm into a window with no indexedDB and takes
      window.OOT.houseLib (emptyHouse, mintId, stripDashes, hasDash, normaliseHouse, the constants);
   2. reads parsed.json (the parser's output), overrides.json (every departure from the guide,
      with its reason and source) and ids.ledger.json (slug to id, read before any id is minted);
   3. builds an intermediate model: the card, the guide's 47 dishes, 20 wines, 7 cocktails (5
      signature drinks and the 2 spirit-free drinks), 2 tastings, the lexicon, scenarios, mix-ups,
      must-knows, the lineup register and the disputes, with every reference still a name;
   4. applies the overrides to the model (set, replace, append, add) before any dash is touched,
      so a replace matches the guide's own text; an entry whose target or 'from' is not found
      fails the build. An add on dish:+ or cocktail:+ files a whole item the guide prints only as
      a price line or a must-know (the bar list, the children's menu, the Bubbles snacks, the
      coffees), refused unless it carries the five parts, the three lines, say, guest and why,
      and for a drink its spec and two or three upsells by name; an add on wine:+ files a whole wine
      the current menus print, held to the same bar. A retire takes a dish, wine or drink the
      current menus no longer print out of the house and a tombstone on the house names an id no
      entry builds any more; both put the id in house.removed, and every id the shipped pack holds
      must be in the new house or carry a tombstone, or the build fails;
      a dispute an add files may carry a resolution (the side a newer printed menu bears out), and a
      mix-up is targeted by its two sides, mixup:<a> vs <b>. An add on video:+ files one video in the
      shape of a research/videos-*.json record, copied in whole (see VIDEOS below);
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

   Prices are never rewritten except to the figure a newer printed menu carries (the owner's paste
   of 3 October 2026), the older figure kept as a dispute: an item's price is otherwise the guide's
   own string. Service notes are a
   person's words and go in verbatim (dash-stripped only). Nothing here writes an allergen into
   a mark; the lineup register carries those questions.

   The one stamp is the edition's (engine.mjs EDITION_TS, Date.parse of the pack's builtAt) on
   every mark and every record, so keep-all and a device can tell the edition's own words from a
   person's edit.

   VIDEOS. A video reaches the pack only through an overrides.json entry { target: 'video:+',
   op: 'add', value, reason, source }, whose value is one record of a research/videos-*.json file
   as it stands: { id, url, title, channel, minutes, topic, why, attach: { dishes, cocktails,
   wines, terms, house }, checkedOn }, any other key (verifiedBy, channelEvidence, searchTitle)
   carried for the reader and left out of the house. Overrides and not a reader of the research
   files, on purpose: the research lists candidates, several still unverified, and an entry here is
   the one act that says this video ships, with its reason and its source beside every other
   departure from the guide; the integrator copies a verified record in whole, for instance
     jq -c '.videos[] | select(.id == "brennans-bananas-foster")' research/videos-kitchen-*.json
   and wraps it. The build refuses a video whose link is not a secure YouTube or Vimeo link, whose
   channel is still null (check-house-videos or an oEmbed run names it first), whose title or why
   is blank or whose why runs past 25 words, whose checkedOn is not a date, an id used twice, and
   any attach name that is not a dish, a drink, a wine or a term of this house, each by its own
   list. The research id is the ledger key (videos:<id>), so the pack id is a v- mint, held stable
   like every other. The title and the channel are quoted, not written: they skip the spelling
   map and take only the dash pass (logged), and the minutes become mins (the client sweep refuses
   a key holding the letters of nut), 0 when null. A slug-shaped topic (brennans, soups-and-roux)
   becomes its heading by VIDEO_TOPICS, else it is written out; a written topic stands.

   Usage: node house/build-brennans.mjs [--mint] [--stamp <ms>]
   Runs from any directory. Exits 1 with the file and the rule on failure. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { americanise, checkArgs, EDITION_TS, editionInFuture, PACK, readFragments, componentsDir } from './engine.mjs';

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
  --stamp <ms>  the one build stamp on every mark (default: the shipped edition's fixed stamp; --now takes the clock)
  --verbose     print every principle mapped
  --components <dir>  read the component fragments from <dir> (default ${REL(componentsDir())}, or BRENNANS_COMPONENTS)
  --help        this text

Writes ${REL(OUT)}, ${REL(DASH_LOG)}, ${REL(SPELL_LOG)} and, with --mint, ${REL(LEDGER)}.`);
	process.exit(0);
}
checkArgs(args, ['--mint', '--stamp', '--verbose', '--now', '--components'], ['--stamp', '--components'], fail);
const compAt = args.indexOf('--components');
if (compAt >= 0) {
	const dir = path.resolve(args[compAt + 1]);
	if (!fs.existsSync(dir)) fail(`--components ${args[compAt + 1]}: no such directory`);
	process.env.BRENNANS_COMPONENTS = dir;
}
const MINT = args.includes('--mint');
const stampAt = args.indexOf('--stamp');
/* Fixed by default so a rebuild is byte for byte the pack that shipped (the mirror gate holds the
   site's copy to this one): --stamp sets another, --now takes the clock for a fresh edition. */
const BUILD_TS = stampAt >= 0 ? Number(args[stampAt + 1]) : args.includes('--now') ? Date.now() : EDITION_TS;
if (!Number.isFinite(BUILD_TS)) fail('--stamp must be a number of milliseconds');
if (editionInFuture(BUILD_TS)) fail(editionInFuture(BUILD_TS));

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

/* The two tastings as Brennan's prints them on the menus the owner pasted on 5 October 2026
   (pages/brennans-tasting-menus-pasted-2026-10-05.txt, kept verbatim), in printed order: each course's
   label as printed, 'choice of' as choice, the lines printed under its dishes as printed (the menu's
   dashes written as hyphens), the words printed over its pour as pourLabel, and the pour as printed
   as pourText, the page's 'ChampaPAgne' slip written Champagne. A dish is named as the house names it,
   by name, so the tasting's 'Egg Hussarde' and 'Grande Isle' resolve to the house's Eggs Hussarde and
   Grand Isle Jewel Oysters, and the course's printed line stands as the tasting prints it. The breakfast
   fifth course's Congregation Coffee & Chicory is the house's New Orleans-Style Coffee with Chicory. The
   dinner tasting was 'Dinner tasting' until this edition; ids.ledger.json moved its slug with its id, so
   a device's copy is refreshed in place rather than replaced. */
const TASTINGS = [
	{
		name: 'Traditional Breakfast at Brennan’s', price: '$80', meal: 'Breakfast & lunch', includesDrinks: true,
		line: 'Celebrating 80 Years in 2026! Price includes tasting portions of each course and all drinks listed.',
		note: 'Tasting portions of each course and all listed drinks included. Take the filet temperature with the order. Do not double-pour the included Champagne.',
		courses: [
			{ label: 'Eye Opener Cocktail', dishes: [], pour: 'Brandy Milk Punch', pourText: 'Brandy Milk Punch', printed: ['Brandy, Heavy Cream, Vanilla Bean, Nutmeg'] },
			{ label: 'First Course', dishes: ['Baked Apple'], pour: '', pourText: '', printed: ['Oatmeal-pecan-raisin Crumble, Brown Sugar Glaze, Sweetened Crème Fraiche'] },
			{ label: 'Second Course', choice: true, dishes: ['Turtle Soup', 'Seafood Gumbo'], pourLabel: 'Paired with', pour: 'Bloody Bull', pourText: 'Bloody Bull Cocktail' },
			{ label: 'Third Course', dishes: ['Eggs Hussarde'], printed: ['Housemade English Muffin, Coffee-cured Canadian Bacon, Hollandaise, Poached Egg, Marchand De Vin Sauce'], pourLabel: 'Paired with', pour: 'Charles Lafitte Brut Champagne NV', pourText: 'Charles Lafitte Brut Champagne FR NV [4oz]' },
			{ label: 'Fourth Course', dishes: ['Petite Filet Mignon'], printed: ['Potato Rösti, Garlic Spinach'], pourLabel: 'Paired with', pour: 'Domaine de Châteaumar ‘Cuvée Vincent’ Côtes du Rhône', pourText: 'Domaine De Châteaumar ‘Cuvée Vincent’ Côtes Du Rhône FR 2023 [4oz]' },
			{ label: 'Fifth Course', dishes: ['World Famous Bananas Foster'], printed: ['Invented At Brennan’s ~ Bananas, Butter, Brown Sugar, Cinnamon, Rum, Housemade Vanilla Bean Ice Cream, Flambéed Tableside'], pourLabel: 'Paired with', pour: 'New Orleans-Style Coffee with Chicory', pourText: 'Brennan’s Private Blend Congregation Coffee & Chicory' }
		]
	},
	{
		name: 'Dinner Tasting Menu', price: '$80', meal: 'Dinner', includesDrinks: false,
		line: 'Celebrating 80 Years in 2026! Add Wine Pairing Supplement [4oz pours] $120',
		supplement: 'Add Wine Pairing Supplement, 4 Ounce Wine Pours $120.00',
		note: 'Five courses. Wine pairing supplement $120, five 4 oz pours: Charles Lafitte Brut, Fichet Mâcon-Igé 2024, Louis Jadot Beaune 1er Cru 2023, Paul Hobbs Coombsville Cabernet 2021, La Tour Vieille Banyuls Reserva. Open the Jadot 20 to 30 minutes ahead, the Hobbs 30 to 60; pour the Banyuls before the Snickers lands.',
		courses: [
			{ label: 'First Course', dishes: ['Grand Isle Jewel Oysters'], printed: ['Served Raw, Preserved Fresno Chile Mignonette, Parsley'], pourLabel: 'Suggested Pairing', pour: 'Charles Lafitte Brut Champagne NV', pourText: 'Charles Lafitte Brut Champagne FR NV' },
			{ label: 'Second Course', dishes: ['Louisiana BBQ Lobster'], printed: ['’nduja, White Bean Stew'], pourLabel: 'Suggested Pairing', pour: 'Fichet ‘Château London’ Mâcon-Igé 2024', pourText: 'Fichet Château London Mâcon-Igé Burgundy FR Chardonnay 2024' },
			{ label: 'Third Course', dishes: ['Redfish Véronique'], printed: ['Hibiscus-pickled Grapes, Braised Leeks, Fingerling Potatoes, Preserved Lemon Beurre Blanc'], pourLabel: 'Suggested Pairing', pour: 'Louis Jadot Beaune 1er Cru 2023', pourText: 'Louis Jadot 1er Cru Beaune, Burgundy FR Pinot Noir 2023' },
			{ label: 'Fourth Course', dishes: ['Roasted Rohan Duck Breast'], printed: ['Cane Syrup-glazed Peaches, Candied Hazelnuts'], pourLabel: 'Suggested Pairing', pour: 'Paul Hobbs Coombsville Cabernet Sauvignon 2021', pourText: 'Paul Hobbs Coombsville Napa Valley Cabernet Sauvignon 2021' },
			{ label: 'Fifth Course', dishes: ['The Snickers'], printed: ['Bavarian Milk Chocolate, Caramel Custard, Nougat Ice Cream, Roasted Peanuts'], pourLabel: 'Suggested Pairing', pour: 'Domaine La Tour Vieille Banyuls Reserva NV', pourText: 'Domaine La Tour Vieille Reserva Banyuls FR NV' }
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
	[/albariño|albarino|pazo das bruxas/i, 'Pazo das Bruxas Albariño 2025'], [/domaine durand|loire sauvignon/i, 'Domaine Durand Sauvignon Blanc 2025'],
	/* The drinks, snacks and coffees the overrides file, so a scenario that names one links to it. */
	[/yellowstone/i, 'Yellowstone'], [/miami beach/i, 'Miami Beach'], [/niagara falls/i, 'Niagara Falls'], [/\bhavana\b/i, 'Havana'], [/acapulco/i, 'Acapulco'],
	[/flamingo/i, 'Flamingo'], [/birdcage/i, 'Birdcage'], [/spoonbill/i, 'Spoonbill'], [/thompson.s dream/i, 'Thompson’s Dream'], [/origin story/i, 'Origin Story'],
	[/brennan.s bloody mary/i, 'Brennan’s Bloody Mary'], [/champagne cocktail/i, 'Brennan’s Champagne Cocktail'],
	[/chicory coffee|coffee with chicory/i, 'New Orleans-Style Coffee with Chicory'], [/caf[eé] glac[eé]/i, 'Café Glacé de la Maison'],
	[/single.origin/i, 'Congregation Single-Origin Coffee'], [/\brevive\b|cold.pressed juice/i, 'Revive Cold-Pressed Juice'],
	[/spiced nuts/i, 'Creole Spiced Nuts'], [/meat pies?/i, 'Crawfish Meat Pies'], [/pink sauce/i, 'Fries with Pink Sauce'], [/fried pickles/i, 'Fried Pickles'],
	[/popcorn shrimp/i, 'Popcorn Shrimp'], [/cheese board/i, 'Cheese Board'], [/roost burger/i, 'Roost Burger']
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
		base.glass = '';
		base.garnish = '';
		base.upsells = [];
		base.note = 'A Brennan’s signature drink.';
		model.cocktails.push(base);
	}
}
for (const z of SPIRIT_FREE) {
	model.cocktails.push({
		name: z.name, section: 'Spirit-free', signature: false, meals: ['Breakfast & lunch', 'Dinner'], price: z.price,
		prices: [{ meal: 'Breakfast & lunch', printed: z.price }, { meal: 'Dinner', printed: z.price }],
		description: z.spec.join(', '), parts: z.parts, lines: null, serviceNote: '', say: '', why: '', pairs: '', origin: '', kept: [], guest: '',
		spec: z.spec, method: z.parts.technique, glass: '', garnish: '', upsells: [], family: z.family, spirit: '', zeroProof: true, note: z.note
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
		profile: w.profile, sayIt: w.sayIt, goesWith: w.goesWith, serve: w.serve, firstPickFor: [...w.firstPickFor], lines: null,
		serviceNote: '', say: '', why: '', pairs: '', origin: '', kept: [], parts: {}
	});
}
for (const t of TASTINGS) model.tastings.push(JSON.parse(JSON.stringify(t)));
for (const t of parsed.terms) model.terms.push({ term: t.term, say: t.say === EM || t.say === '-' ? '' : t.say, toGuest: t.toGuest });
for (const s of parsed.scenarios) model.scenarios.push({ title: s.title, guest: s.guest, you: s.you, principle: s.principle });
for (const m of parsed.mixUps) model.mixUps.push({ a: m.a, b: m.b, difference: m.difference, ask: m.ask });
for (const k of parsed.mustKnows) model.mustKnows.push({ title: k.title, body: k.body });

/* The name each record's id was minted under, kept before any override can rename it. */
for (const list of ['dishes', 'wines', 'cocktails']) for (const r of model[list]) r.idName = r.name;

/* ---------- the overrides ---------- */
const LISTS = { dish: 'dishes', wine: 'wines', cocktail: 'cocktails', tasting: 'tastings', term: 'terms', scenario: 'scenarios', mixup: 'mixUps', mustknow: 'mustKnows', ask: 'asks', dispute: 'disputes', video: 'videos' };
const KEY = { dishes: 'name', wines: 'name', cocktails: 'name', tastings: 'name', terms: 'term', scenarios: 'title', mustKnows: 'title' };
function findTarget(target, n) {
	if (target === 'house') return { rec: model.card, list: 'house' };
	const at = target.indexOf(':');
	if (at < 0) fail(`${REL(OVERRIDES)} entry ${n}: the target ${target} has no list`);
	const list = LISTS[target.slice(0, at)];
	const name = target.slice(at + 1);
	if (!list) fail(`${REL(OVERRIDES)} entry ${n}: unknown list in ${target}`);
	if (name === '+') return { rec: null, list };
	if (list === 'videos') fail(`${REL(OVERRIDES)} entry ${n}: a video is filed whole with video:+; there is no video to change by name`);
	/* A mix-up has no single name: it is named by its two sides, mixup:<a> vs <b>. */
	if (list === 'mixUps') {
		const m = model.mixUps.find((r) => slug(r.a + ' vs ' + r.b) === slug(name));
		if (!m) fail(`${REL(OVERRIDES)} entry ${n}: ${target} names no mix-up in the model`);
		return { rec: m, list };
	}
	const key = KEY[list];
	const rec = model[list].find((r) => !r.retired && (slug(r[key]) === slug(name) || (r.idName && slug(r.idName) === slug(name))));
	if (!rec) fail(`${REL(OVERRIDES)} entry ${n}: ${target} names nothing in the model${model[list].some((r) => r.retired && slug(r[key]) === slug(name)) ? ' (it is retired)' : ''}`);
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
/* The videos the overrides file, kept apart from the model so the dash walk does not respell a quoted title. */
const videoAdds = [];
/* A research topic written as a slug, as its heading. A slug this table lacks is written out
   (hyphens as spaces, the first letter capital); a topic already written as words stands. */
const VIDEO_TOPICS = {
	brennans: 'Brennan’s house', service: 'Fine-dining service', 'french-quarter': 'The French Quarter', sauces: 'Sauces',
	'soups-and-roux': 'Soups and roux', 'fish-and-shellfish': 'Fish and shellfish', 'meat-and-poultry': 'Meat and poultry', eggs: 'Eggs',
	'tableside-and-flambe': 'Tableside and flambé', desserts: 'Desserts', 'creole-and-cajun': 'Creole and Cajun'
};
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
/* The dishes, wines and drinks the current menus no longer print, each with the tombstone stamp the
   pack carries for its id (see 'retire' below). */
const retired = [];
/* Ids of records the shipped pack held that no override builds any more (an ask answered by a newer
   menu, a note on a retired drink), each with its tombstone stamp: see 'tombstone' below. */
const buried = [];
overrides.entries.forEach((e, n) => {
	const op = e.op || 'set';
	/* A video's title and channel are quoted from the page as published and its bookkeeping (verifiedBy,
	   channelEvidence) quotes search results, so only the words this file writes (why, topic) are held
	   dash free here; the quoted ones take the dash pass at assembly, logged. */
	if (e.target === 'video:+' && e.value && typeof e.value === 'object') { noDash(e.value.why, n, 'value.why'); noDash(e.value.topic, n, 'value.topic'); }
	else noDash(e.value, n, 'value');
	const { rec, list } = findTarget(e.target, n);
	/* A retire takes a dish, wine or drink off the menu: the record is left out of the house and its id
	   goes into house.removed under the stamp the entry names, so a device refreshed by this edition
	   drops the copy nobody touched after that stamp and keeps one a person did. The stamp is the last
	   edition that carried the item, plus a millisecond: every touch a person made since is newer. */
	if (op === 'retire') {
		if (!rec || !['dishes', 'wines', 'cocktails'].includes(list)) fail(`${REL(OVERRIDES)} entry ${n}: retire needs a dish, wine or cocktail`);
		const at = e.value && typeof e.value.tombstone === 'string' ? Date.parse(e.value.tombstone) : NaN;
		if (!Number.isFinite(at)) fail(`${REL(OVERRIDES)} entry ${n}: retire needs value.tombstone, an ISO time`);
		rec.retired = true;
		retired.push({ list, key: slug(rec.idName || rec.name), name: rec.name, at });
		applied.push({ n, op, target: e.target });
		return;
	}
	/* A tombstone, on the house, for a record the shipped pack held that this edition no longer builds:
	   value { id, was, tombstone }, 'was' naming it for a reader. The id must not be in the new house. */
	/* The bottles offered with a dish, by tier: value { value?, classic?, splurge?, half? }, each tier
	   { wine, why, sayIt } with the wine named as the house names it (a wine:+ entry's name). The names
	   resolve through wineId at assembly, where the dish must carry a pairing and every wine must be
	   on the bottle list; the validator then holds each tier to its price band (the half to 375ml) and
	   the why and the line to 25 words. Several entries may tier one dish, but no tier twice. */
	if (op === 'bottles') {
		if (!rec || list !== 'dishes') fail(`${REL(OVERRIDES)} entry ${n}: bottles goes on a dish (dish:<name>)`);
		const v = e.value;
		if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${REL(OVERRIDES)} entry ${n}: bottles needs value { value?, classic?, splurge?, half? }`);
		const tiers = Object.keys(v);
		if (!tiers.length) fail(`${REL(OVERRIDES)} entry ${n}: bottles names no tier`);
		rec.bottles = rec.bottles || {};
		for (const tier of tiers) {
			if (!C.BOTTLE_TIERS.includes(tier)) fail(`${REL(OVERRIDES)} entry ${n}: ${tier} is not a tier; the tiers are ${C.BOTTLE_TIERS.join(', ')}`);
			const t = v[tier];
			const str = (x) => typeof x === 'string' && x.trim() !== '';
			if (!t || !str(t.wine) || !str(t.why) || !str(t.sayIt)) fail(`${REL(OVERRIDES)} entry ${n}: the ${tier} tier needs { wine, why, sayIt }, each a string`);
			for (const k of Object.keys(t)) if (!['wine', 'why', 'sayIt'].includes(k)) fail(`${REL(OVERRIDES)} entry ${n}: the ${tier} tier carries ${k}; a tier is { wine, why, sayIt }`);
			if (rec.bottles[tier]) fail(`${REL(OVERRIDES)} entry ${n}: ${e.target} already has a ${tier} tier (entry ${rec.bottles[tier].n})`);
			rec.bottles[tier] = { wine: t.wine, why: t.why, sayIt: t.sayIt, n };
		}
		overrideAt.set(pathOf(list, rec, 'bottles'), n);
		applied.push({ n, op, target: e.target });
		return;
	}
	if (op === 'tombstone') {
		const v = e.value || {};
		const at = typeof v.tombstone === 'string' ? Date.parse(v.tombstone) : NaN;
		if (list !== 'house' || typeof v.id !== 'string' || !v.id || typeof v.was !== 'string' || !v.was || !Number.isFinite(at)) fail(`${REL(OVERRIDES)} entry ${n}: a tombstone goes on the house with value { id, was, tombstone }`);
		buried.push({ id: v.id, was: v.was, at, n });
		applied.push({ n, op, target: e.target });
		return;
	}
	if (op === 'add') {
		const v = e.value;
		if (list === 'terms') {
			if (model.terms.some((t) => slug(t.term) === slug(v.term))) { applied.push({ n, skipped: 'term exists' }); return; }
			model.terms.push({ term: v.term, say: v.say || '', toGuest: v.toGuest || '' });
		} else if (list === 'scenarios') {
			if (model.scenarios.some((s) => slug(s.title) === slug(v.title))) fail(`${REL(OVERRIDES)} entry ${n}: the scenario ${v.title} exists`);
			model.scenarios.push({ title: v.title, guest: v.guest, you: v.you, principle: v.principle, items: Array.isArray(v.items) ? [...v.items] : [] });
		} else if (list === 'mixUps') {
			model.mixUps.push({ a: v.a, b: v.b, difference: v.difference, ask: v.ask });
		} else if (list === 'mustKnows') {
			if (model.mustKnows.some((k) => slug(k.title) === slug(v.title))) fail(`${REL(OVERRIDES)} entry ${n}: the must-know ${v.title} exists`);
			model.mustKnows.push({ title: v.title, body: v.body });
		} else if (list === 'asks') {
			model.asks.push({ question: v.question, askWhom: v.askWhom || 'manager', items: v.items || [], blocksField: v.blocksField || '' });
		} else if (list === 'disputes') {
			model.disputes.push({ item: v.item || '', field: v.field, a: v.a, b: v.b, resolution: typeof v.resolution === 'string' ? v.resolution : '' });
		} else if ((list === 'dishes' || list === 'cocktails') && !rec) {
			model[list].push(newItem(list, v, n));
		} else if (list === 'wines' && !rec) {
			model.wines.push(newWine(v, n));
		} else if (list === 'videos') {
			videoAdds.push(newVideo(v, n));
			applied.push({ n, op, target: e.target });
			return;
		} else if (e.field === 'kept' && rec) {
			rec.kept.push({ q: v.q, a: v.a });
		} else if (list === 'house' && e.field === 'sources') {
			if (!v || typeof v.title !== 'string' || !v.title || typeof v.readOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.readOn)) fail(`${REL(OVERRIDES)} entry ${n}: a source needs a title and a readOn date`);
			rec.sources.push({ title: v.title, url: v.url || '', readOn: v.readOn });
		} else fail(`${REL(OVERRIDES)} entry ${n}: add on ${e.target} ${e.field || ''} is not a list this builder adds to`);
		if (rec && list === 'house') overrideAt.set(pathOf(list, rec, e.field + '[' + (rec[e.field].length - 1) + ']'), n);
		else if (rec) overrideAt.set(pathOf(list, rec, e.field === 'kept' ? 'kept[' + (rec.kept.length - 1) + ']' : e.field), n);
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

/* A whole item filed by an override: the guide prints it only as a price line or a must-know, or
   the house page the research read prints it. Everything a wing, a drill and Lizzy read must be
   there, so an incomplete record fails the build here rather than shipping half a card. */
function newItem(list, v, n) {
	const at = `${REL(OVERRIDES)} entry ${n}`;
	const need = (ok, what) => { if (!ok) fail(`${at}: the new ${list === 'dishes' ? 'dish' : 'drink'} ${v && v.name} lacks ${what}`); };
	const str = (x) => typeof x === 'string' && x.trim() !== '';
	need(v && str(v.name), 'a name');
	for (const l of ['dishes', 'wines', 'cocktails']) if (model[l].some((r) => slug(r.name) === slug(v.name))) fail(`${at}: ${v.name} is already in the house`);
	need(str(v.section), 'a section');
	need(Array.isArray(v.meals) && v.meals.length, 'its meals');
	need(str(v.price), 'a printed price');
	need(Array.isArray(v.prices) && v.prices.length && v.prices.every((p) => str(p.meal) && str(p.printed)), 'its printed prices');
	/* Main, technique and taste always; a sauce or sides nobody printed is left empty rather than filled
	   with 'not printed', because each is a drill stem and an empty part is one the dealer skips. */
	need(v.parts && ['main', 'technique', 'taste'].every((k) => str(v.parts[k])), 'its main, technique and taste');
	need(['sauce', 'sides'].every((k) => v.parts[k] === undefined || v.parts[k] === '' || str(v.parts[k])), 'a sauce and sides that are text or empty');
	need(v.lines && ['s10', 's20', 's45'].every((k) => str(v.lines[k])), 'all three timed lines');
	for (const f of ['say', 'guest', 'why']) need(str(v[f]), f);
	const base = {
		name: v.name, section: v.section, signature: false, meals: [...v.meals], price: v.price, prices: v.prices.map((p) => ({ meal: p.meal, printed: p.printed })),
		parts: Object.assign({}, v.parts), lines: Object.assign({}, v.lines), serviceNote: v.serviceNote || '',
		say: v.say, guest: v.guest, why: v.why, pairs: v.pairs || '', origin: v.origin || '', kept: Array.isArray(v.kept) ? v.kept.map((k) => ({ q: k.q, a: k.a })) : []
	};
	if (list === 'dishes') {
		need(str(v.description), 'its menu line');
		base.description = v.description;
		base.pairing = null;
		return base;
	}
	need(Array.isArray(v.spec) && v.spec.length && v.spec.every(str), 'its printed spec');
	need(str(v.family), 'a family');
	need(typeof v.zeroProof === 'boolean', 'zeroProof, true or false');
	need(Array.isArray(v.upsells) && v.upsells.length >= 2 && v.upsells.length <= 3, 'two or three upsells by name');
	return Object.assign(base, {
		description: v.spec.join(', '), spec: [...v.spec], method: v.method || '', glass: v.glass || '', garnish: v.garnish || '',
		family: v.family, spirit: v.spirit || '', zeroProof: v.zeroProof, note: v.note || '', upsells: [...v.upsells]
	});
}

/* A whole wine filed by an override: a bottle or a glass the current menus print that the guide
   does not. Everything the wine card, the Codex and a drill read must be there. */
function newWine(v, n) {
	const at = `${REL(OVERRIDES)} entry ${n}`;
	const need = (ok, what) => { if (!ok) fail(`${at}: the new wine ${v && v.name} lacks ${what}`); };
	const str = (x) => typeof x === 'string' && x.trim() !== '';
	need(v && str(v.name), 'a name');
	for (const l of ['dishes', 'wines', 'cocktails']) if (model[l].some((r) => slug(r.name) === slug(v.name))) fail(`${at}: ${v.name} is already in the house`);
	for (const f of ['section', 'price', 'producer', 'wine', 'region', 'style', 'profile', 'goesWith', 'serve', 'say', 'guest', 'why']) need(str(v[f]), f);
	need(typeof v.vintage === 'string', 'a vintage, NV or empty');
	need(Array.isArray(v.meals) && v.meals.length, 'its meals');
	need(Array.isArray(v.prices) && v.prices.length && v.prices.every((p) => str(p.meal) && str(p.printed)), 'its printed prices');
	need(Array.isArray(v.grapes), 'its grapes, a list (empty when no source names them)');
	need(v.parts && ['main', 'technique', 'sauce', 'sides', 'taste'].every((k) => str(v.parts[k])), 'all five parts');
	need(v.lines && ['s10', 's20', 's45'].every((k) => str(v.lines[k])), 'all three timed lines');
	need(v.firstPickFor === undefined || (Array.isArray(v.firstPickFor) && v.firstPickFor.every(str)), 'first picks named as dishes');
	/* The list it is sold from: 'glass' (the default, the menus' own wines) or 'bottle' (the full bottle
	   list, with a whole card for the floor). A bottle carries its bin and size as the list prints them
	   and its bottle price, which the validator's band check and the price rule read. */
	need(v.list === undefined || C.WINE_LISTS.includes(v.list), `list, one of ${C.WINE_LISTS.join(' or ')}`);
	need(v.bin === undefined || typeof v.bin === 'string', 'a bin as a string');
	need(v.size === undefined || typeof v.size === 'string', 'a size as a string');
	/* The bin must be named, but may be blank where the list prints none (the house Champagne, Brennan's
	   Essential, has no bin on the Binwise list of 3 October 2026): bin "" says so, and a missing key fails. */
	if (v.list === 'bottle') {
		need(typeof v.bin === 'string', 'bin (a bottle on the list carries its bin, "" only where the list prints none)');
		for (const f of ['size', 'bottle']) need(str(v[f]), f + ' (a bottle on the list carries its size and bottle price)');
	}
	return {
		list: v.list === 'bottle' ? 'bottle' : '', bin: v.bin || '', size: v.size || '',
		name: v.name, section: v.section, group: v.group || v.section, meals: [...v.meals], price: v.price, prices: v.prices.map((p) => ({ meal: p.meal, printed: p.printed })),
		producer: v.producer, wine: v.wine, vintage: v.vintage, region: v.region, grapes: [...v.grapes], style: v.style, made: v.parts.technique, taste: v.parts.taste,
		glass: v.glass || '', bottle: v.bottle || '', pours: Array.isArray(v.pours) ? [...v.pours] : [],
		profile: v.profile, sayIt: v.guest, goesWith: v.goesWith, serve: v.serve, firstPickFor: Array.isArray(v.firstPickFor) ? [...v.firstPickFor] : [],
		lines: Object.assign({}, v.lines), serviceNote: v.serviceNote || '', say: v.say, why: v.why, pairs: v.pairs || '', origin: v.origin || '',
		kept: Array.isArray(v.kept) ? v.kept.map((k) => ({ q: k.q, a: k.a })) : [], parts: Object.assign({}, v.parts), idName: v.name
	};
}

function videoTopic(t) {
	const s = String(t || '').trim();
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return s;
	return VIDEO_TOPICS[s] || cap(s.replace(/-/g, ' '));
}
/* The components a video teaches, by fragment key (resolved to c- ids at assembly): a list of keys, or none. */
function componentKeysOf(v, need) {
	if (v.componentKeys === undefined) return [];
	need(Array.isArray(v.componentKeys) && v.componentKeys.every((k) => typeof k === 'string' && k.trim() !== ''), 'needs componentKeys as a list of component keys');
	return [...v.componentKeys];
}
/* A video filed by an override, in the research files' shape, checked before anything resolves; the
   attach names resolve at assembly, once every id is known. */
function newVideo(v, n) {
	const at = typeof n === 'string' ? n : `${REL(OVERRIDES)} entry ${n}`;
	const str = (x) => typeof x === 'string' && x.trim() !== '';
	if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${at}: video:+ needs a value, one research video record`);
	const need = (ok, what) => { if (!ok) fail(`${at}: the video ${str(v.id) ? v.id : '(no id)'} ${what}`); };
	need(str(v.id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.id), 'needs an id, the research record\'s slug');
	need(!videoAdds.some((x) => x.key === v.id), 'is filed twice');
	need(lib.videoUrlOk(v.url), 'needs a secure YouTube or Vimeo link, ' + JSON.stringify(v.url) + ' is not one');
	need(str(v.title), 'needs its title as published');
	need(str(v.channel), 'has no channel yet: check-house-videos or an oEmbed run must name it before it ships');
	need(v.minutes === undefined || v.minutes === null || (typeof v.minutes === 'number' && Number.isFinite(v.minutes) && v.minutes > 0), 'needs minutes as a number above 0, or null when nobody measured it');
	need(str(v.why), 'needs a why');
	need(lib.wordCount(v.why) <= C.VIDEO_WHY_WORDS, `has a why of ${lib.wordCount(v.why)} words; the cap is ${C.VIDEO_WHY_WORDS}`);
	need(typeof v.checkedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.checkedOn), 'needs checkedOn, the date the link was checked');
	const a = v.attach && typeof v.attach === 'object' && !Array.isArray(v.attach) ? v.attach : {};
	const names = (k) => {
		const l = a[k] === undefined ? [] : a[k];
		need(Array.isArray(l) && l.every(str), `needs attach.${k} as a list of names`);
		return [...l];
	};
	const house = typeof a.house === 'boolean' ? a.house : v.house === true;
	return {
		key: v.id, n, url: v.url, title: v.title, channel: v.channel, mins: typeof v.minutes === 'number' ? v.minutes : 0,
		topic: videoTopic(v.topic), why: v.why, checkedOn: v.checkedOn, house,
		dishes: names('dishes'), cocktails: names('cocktails'), wines: names('wines'), terms: names('terms'),
		componentKeys: componentKeysOf(v, need)
	};
}

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
/* Retired records leave only now, after the dash pass, so the paths the dash log names still count them. */
for (const list of ['dishes', 'wines', 'cocktails']) clean[list] = clean[list].filter((r) => !r.retired);
/* Each section's items together, in the order the sections first appear, the rest of the order kept: an
   item an override files into a section the guide already printed (the Barbera, the Bubbles cocktails)
   joins that section rather than trailing the list, which is the order every wing's study view reads. */
for (const list of ['dishes', 'wines', 'cocktails']) {
	const order = [];
	for (const r of clean[list]) if (!order.includes(r.section)) order.push(r.section);
	clean[list] = order.flatMap((sec) => clean[list].filter((r) => r.section === sec));
}

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

for (const r of retired) {
	const id = ledger[r.list + ':' + r.key];
	if (!id) fail(`${REL(LEDGER)}: the retired ${r.name} has no id, so no device can hold it and it needs no tombstone; drop the retire`);
	house.removed[id] = r.at;
}

const byName = new Map();
const nameOf = (list, rec) => rec[KEY[list]];
for (const list of ['dishes', 'wines', 'cocktails']) for (const r of clean[list]) {
	r.id = idFor(list, slug(r.idName || r.name));
	byName.set(slug(r.name), r.id);
	if (r.idName && slug(r.idName) !== slug(r.name)) byName.set(slug(r.idName), r.id);
}
const wineKey = (s) => slug(String(s).replace(/\s*\$\d+\s*(glass|half-bottle)\s*$/i, '').replace(/\s*\(coravin\)\s*/i, ' '));
const wineIds = new Map();
for (const w of clean.wines) { wineIds.set(wineKey(w.name), w.id); if (w.idName) wineIds.set(wineKey(w.idName), w.id); }
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
/* The guide names a zero-proof pick in its own words; a pick that is not a drink's name exactly is
   read here. The breakfast tasting's Congregation Coffee & Chicory is the house's chicory coffee
   (the tasting page names it Brennan's Private Blend Congregation Coffee & Chicory, gap-fill-2). */
const ZERO_ALIASES = [[/^congregation coffee (&|and) chicory$/i, 'New Orleans-Style Coffee with Chicory']];
function zeroIdFor(text) {
	if (!text) return '';
	const direct = zeroIds.get(slug(text));
	if (direct) return direct;
	for (const [re, name] of ZERO_ALIASES) if (re.test(text.trim())) return zeroIds.get(slug(name)) || '';
	return '';
}

/* Pronunciation: the terms whose word sits in the item's name. */
const termList = clean.terms;
function termsIn(text) {
	const f = ' ' + fold(text).replace(/[^a-z0-9']+/g, ' ') + ' ';
	const out = [];
	for (const t of termList) {
		const full = ' ' + fold(t.term).replace(/[^a-z0-9']+/g, ' ') + ' ';
		if (f.indexOf(full.trim() ? full : '\u0000') >= 0) { out.push(t); continue; }
		const first = fold(t.term).split(/[^a-z0-9']+/)[0];
		if (first.length >= 5 && f.indexOf(' ' + first + ' ') >= 0 && !/^(creole|grand|domaine|chateau|extra|louis|pierre|charles|paul|bitter|uncle|peychaud's|appleton|rabbit|congregation|popcorn)$/.test(first)) out.push(t);
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
		const zp = zeroIdFor(p.zeroProof);
		const zpWhy = zp ? p.zeroProofWhy || '' : (p.zeroProof ? cap(p.zeroProof) + ': ' + (p.zeroProofWhy || '') : (p.zeroProofText || ''));
		put(d, 'pairing', mark({
			wineId: wineId(p.wine, r.name), why: p.why || '', sayIt: p.sayIt || '', whyThisWine: p.whyThisWine || '', palate: p.palate || '',
			principles: p.principles, secondId: p.second ? wineId(p.second, r.name) : '', secondWhy: p.secondWhy || '', stepUp: p.stepUp || '',
			serve: p.serve || '', avoid: p.avoid || '', zeroProofId: zp, zeroProofWhy: zpWhy.trim(),
			...bottleTiers(r)
		}));
	} else if (r.bottles) fail(`${r.name}: the bottles override (entry ${Object.values(r.bottles)[0].n}) needs a dish with a pairing`);
	put(d, 'kept', keptNotes(r.kept));
	d.serviceNote = r.serviceNote || '';
	d.ts = BUILD_TS;
	house.dishes.push(d);
}
for (const r of clean.wines) {
	const w = itemBase(r, 'wines');
	Object.assign(w, { producer: r.producer, wine: r.wine, vintage: r.vintage, region: r.region, grapes: r.grapes, style: r.style, glass: r.glass, bottle: r.bottle, pours: r.pours });
	/* The bottle list's fields, written only when they say something, the normaliser's rule. */
	put(w, 'list', r.list === 'bottle' ? 'bottle' : undefined);
	put(w, 'bin', r.bin || undefined);
	put(w, 'size', r.size || undefined);
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
	/* A wine's five parts are the short form (an override's parts.<key>, each 14 words or fewer, the
	   thin-line rule in engine.mjs), so the card's profile and goes-with blocks carry the long form
	   and a part never repeats them; a key no override sets falls back to the derived reading. */
	const wp = r.parts || {};
	put(w, 'parts', partsMark({ main: wp.main || r.grapes.join(', ') + ' from ' + r.region, technique: wp.technique || r.made, sauce: wp.sauce || r.profile.split(/(?<=[.!?])\s+/).slice(0, 2).join(' '), sides: wp.sides || r.goesWith, taste: wp.taste || r.taste }));
	put(w, 'lines', linesMark(r.lines));
	put(w, 'kept', keptNotes(r.kept));
	w.serviceNote = r.serviceNote || '';
	w.ts = BUILD_TS;
	house.wines.push(w);
}
for (const r of clean.cocktails) {
	const c = itemBase(r, 'cocktails');
	Object.assign(c, { spec: r.spec, method: r.method, glass: r.glass || '', garnish: r.garnish || '', note: r.note, family: r.family, spirit: r.spirit, zeroProof: r.zeroProof });
	put(c, 'say', mark(r.say || sayLine(r.name)));
	if (r.guest || (r.lines && r.lines.s20)) put(c, 'guest', mark(r.guest || r.lines.s20));
	put(c, 'why', r.why ? mark(r.why) : undefined);
	put(c, 'pairs', r.pairs ? mark(r.pairs) : undefined);
	put(c, 'origin', r.origin ? mark(r.origin) : undefined);
	put(c, 'ingredientsNamed', mark(r.spec));
	put(c, 'parts', partsMark(r.parts));
	put(c, 'lines', linesMark(r.lines));
	put(c, 'upsells', r.upsells && r.upsells.length ? mark(upsellIds(r)) : undefined);
	put(c, 'kept', keptNotes(r.kept));
	c.serviceNote = r.serviceNote || '';
	c.ts = BUILD_TS;
	house.cocktails.push(c);
}
/* Each tasting in the engine's key order, the optional fields written only when they say something
   (the normaliser's rule, so validate-pack finds the house unchanged by it): a course's choice only
   when true, its printed lines and its pour's label only when present, the tasting's printed line and
   supplement only when not blank. */
for (const t of clean.tastings) {
	const rec = {
		id: idFor('tastings', slug(t.name)), name: t.name, price: t.price, meal: t.meal, includesDrinks: t.includesDrinks,
		courses: t.courses.map((c, i) => {
			const course = {
				n: i + 1, label: c.label, dishIds: c.dishes.map((n) => itemId(n, t.name)),
				pourId: c.pour ? (byName.get(slug(c.pour)) || wineId(c.pour, t.name)) : '', pourText: c.pourText || ''
			};
			if (c.choice === true) course.choice = true;
			const printed = (c.printed || []).filter((x) => typeof x === 'string' && x.trim());
			if (printed.length) course.printed = printed;
			if (c.pourLabel && c.pourLabel.trim()) course.pourLabel = c.pourLabel;
			return course;
		}),
		note: t.note
	};
	if (t.line && t.line.trim()) rec.line = t.line;
	if (t.supplement && t.supplement.trim()) rec.supplement = t.supplement;
	rec.ts = BUILD_TS;
	house.tastings.push(rec);
}
/* A dish's bottle tiers, named in overrides, as { bottles } with each wine resolved to its id, in
   the engine's tier order; nothing when the dish has none. A wine not on the bottle list fails here,
   before the validator would. */
function bottleTiers(r) {
	if (!r.bottles) return {};
	const out = {};
	for (const tier of C.BOTTLE_TIERS) {
		const t = r.bottles[tier];
		if (!t) continue;
		const id = wineId(t.wine, `${r.name} ${tier} bottle (overrides entry ${t.n})`);
		const w = clean.wines.find((x) => x.id === id);
		if (!w || w.list !== 'bottle') fail(`${r.name} ${tier} bottle (overrides entry ${t.n}): ${t.wine} is not on the bottle list (its wine:+ entry needs list "bottle")`);
		out[tier] = { wineId: id, why: t.why, sayIt: t.sayIt };
	}
	return { bottles: out };
}
/* A drink's upsells, named in overrides, as the ids of other house drinks: two or three, none the
   drink itself, none twice, every one a drink in this house. */
function upsellIds(r) {
	const ids = [];
	for (const name of r.upsells) {
		const target = clean.cocktails.find((c) => slug(c.name) === slug(name));
		if (!target) fail(`${r.name}: the upsell ${name} is not a drink in the house`);
		if (target.id === r.id) fail(`${r.name}: a drink cannot upsell itself`);
		if (ids.includes(target.id)) fail(`${r.name}: the upsell ${name} is named twice`);
		ids.push(target.id);
	}
	if (ids.length < 2 || ids.length > 3) fail(`${r.name}: ${ids.length} upsells; a drink carries two or three`);
	return ids;
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
	/* An item the term's words reach but whose own card the term would misdescribe (the chicory term on
	   the coffee that has none, the bitters term on a drink that carries the aperitivo) is named in
	   overrides as notItems and left off. */
	const not = Array.isArray(t.notItems) ? t.notItems.map((n) => itemId(n, 'term ' + t.term + ' notItems')) : [];
	for (const id of not) if (!ids.includes(id)) fail(`term ${t.term}: notItems names ${id}, which the term does not reach; drop the entry`);
	x.itemIds = ids.filter((id) => !not.includes(id));
	x.ts = BUILD_TS;
	house.lexicon.push(x);
}
for (const s of clean.scenarios) {
	/* A scenario an override files may name its items, which then stand instead of the aliases' reading
	   (the children's menu names a French toast and a popcorn shrimp the aliases would send elsewhere). */
	const named = s.items && s.items.length ? s.items.map((n) => itemId(n, 'scenario ' + s.title)) : null;
	house.scenarios.push({ id: idFor('scenarios', slug(s.title)), title: s.title, guest: s.guest, you: mark(s.you), principle: mark(s.principle), itemIds: named || itemsFor(s.title + ' ' + s.guest + ' ' + s.you), ts: BUILD_TS });
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
	/* A dispute a newer printed menu settles keeps both sides and says which one the menu bears out. */
	if (u.resolution) r.resolution = u.resolution;
	house.disputes.push(r);
}
/* ---------- the components and the comparisons (engine.mjs readFragments) ---------- */
/* Each fragment component becomes one house component: its key (unique across every file) is the
   ledger slug its c- id is minted under, its item and term names resolve to ids within their own
   lists (an unknown name fails the build), and its say, explanation and card are marks of hers at the
   build stamp like every other mark. A fragment is hand written and dash free, so a dash fails the
   build with the file and the field named; the American spelling map runs as it does on every string.
   A component may carry its producer inline (producerFrom below). The sources stay in the fragment for a
   reader and the gates; nothing of them reaches the house. */
let frags;
try { frags = readFragments(); } catch (e) { fail(e.message); }
const compIds = new Map();
const builtComponents = [];
const fragStr = (x) => typeof x === 'string' && x.trim() !== '';
const fragText = (s, where) => dashFree(spelled(s, where), where);
/* A fragment's producer profile, held to its shape (the nine keys and no other, a type of the five, a
   who, every list a list of strings, no dash written in) and returned with every string through the
   spelling map and the dash pass. The caps and the content rules are the gates' (validate-pack, keep-all,
   check-pack), so a long history fails there with the field named rather than here. */
const PRODUCER_KEYS = ['type', 'who', 'where', 'founded', 'history', 'facts', 'notes', 'sayIt', 'askKitchen'];
function producerFrom(p, need, where) {
	need(p && typeof p === 'object' && !Array.isArray(p), 'producer is an object');
	for (const k of Object.keys(p)) need(PRODUCER_KEYS.includes(k), `producer: unknown key ${k}`);
	need(C.PRODUCER_TYPES.includes(p.type), `producer: type ${JSON.stringify(p.type)} is not one of ${C.PRODUCER_TYPES.join(', ')}`);
	need(fragStr(p.who), 'producer: needs who');
	for (const k of ['where', 'founded', 'history', 'sayIt']) need(p[k] === undefined || typeof p[k] === 'string', `producer: ${k} is a string`);
	for (const k of ['facts', 'notes', 'askKitchen']) need(p[k] === undefined || (Array.isArray(p[k]) && p[k].every(fragStr)), `producer: ${k} is a list of sentences`);
	const out = {};
	for (const k of PRODUCER_KEYS) {
		if (k === 'type') out.type = p.type;
		else if (k === 'facts' || k === 'notes' || k === 'askKitchen') {
			out[k] = (p[k] || []).map((x, i) => { need(!hasDash(x), `producer: ${k}[${i}] carries a dash; write it without one`); return fragText(x, `${where}.${k}[${i}]`); });
		} else {
			const x = (p[k] || '').replace(/\r/g, '');
			need(!hasDash(x), `producer: ${k} carries a dash; write it without one`);
			out[k] = x ? fragText(x, `${where}.${k}`) : '';
		}
	}
	return out;
}
const exactItem = (name) => {
	for (const list of ['dishes', 'wines', 'cocktails']) {
		const r = house[list].find((x) => x.name === name) || house[list].find((x) => slug(x.name) === slug(name));
		if (r) return { list, rec: r };
	}
	return null;
};
for (const { at, v } of frags.components) {
	const need = (ok, what) => { if (!ok) fail(`${at}${v && v.key ? ' (' + v.key + ')' : ''}: ${what}`); };
	need(v && typeof v === 'object' && !Array.isArray(v), 'a component is an object');
	for (const k of Object.keys(v)) need(['key', 'kind', 'name', 'say', 'explain', 'card', 'producer', 'items', 'terms', 'sources'].includes(k), `unknown key ${k}`);
	need(fragStr(v.key) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.key), 'needs a key, a lowercase ascii slug');
	need(!compIds.has(v.key), `the key ${v.key} is used twice across the fragments`);
	need(C.COMPONENT_KINDS.includes(v.kind), `kind ${JSON.stringify(v.kind)} is not one of ${C.COMPONENT_KINDS.join(', ')}`);
	need(fragStr(v.name), 'needs a name');
	need(typeof v.say === 'string', 'needs say, a respelling or ""');
	need(fragStr(v.explain), 'needs an explanation');
	need(v.card && typeof v.card === 'object' && fragStr(v.card.front) && fragStr(v.card.back) && Object.keys(v.card).every((k) => k === 'front' || k === 'back'), 'needs a card { front, back }');
	need(Array.isArray(v.items) && v.items.length && v.items.every(fragStr), 'needs items, the pack item names it belongs to');
	need(Array.isArray(v.terms) && v.terms.every(fragStr), 'needs terms, a list of lexicon term names (may be empty)');
	need(Array.isArray(v.sources) && v.sources.length && v.sources.every(fragStr), 'needs sources, where each fact comes from');
	for (const [k, x] of [['name', v.name], ['say', v.say], ['explain', v.explain], ['card.front', v.card.front], ['card.back', v.card.back]]) need(!hasDash(x), `${k} carries a dash; write it without one`);
	const itemIds = [];
	for (const n of v.items) {
		const hit = exactItem(n);
		need(hit, `${n} is not a dish, drink or wine in the house`);
		need(!itemIds.includes(hit.rec.id), `${n} is named twice`);
		itemIds.push(hit.rec.id);
	}
	const termIds = [];
	for (const t of v.terms) {
		const x = house.lexicon.find((r) => r.term === t) || house.lexicon.find((r) => slug(r.term) === slug(t));
		need(x, `${t} is not a term in the house lexicon`);
		if (!termIds.includes(x.id)) termIds.push(x.id);
	}
	const id = idFor('components', v.key);
	compIds.set(v.key, id);
	const where = 'house.components[' + builtComponents.length + ']';
	const comp = { id, kind: v.kind, name: fragText(v.name, where + '.name') };
	if (v.say.trim()) comp.say = mark(fragText(v.say, where + '.say'));
	comp.explain = mark(fragText(v.explain.replace(/\r/g, ''), where + '.explain'));
	comp.card = mark({ front: fragText(v.card.front, where + '.card.front'), back: fragText(v.card.back, where + '.card.back') });
	if (v.producer !== undefined) comp.producer = mark(producerFrom(v.producer, need, where + '.producer'));
	comp.itemIds = itemIds;
	comp.termIds = termIds;
	comp.ts = BUILD_TS;
	builtComponents.push(comp);
}
/* producers: [{ component, producer, sources }] attaches a profile to the component an existing key
   names, in any fragment file; a key that names no component fails, and so does a second profile for one
   component (inline or attached). The profile becomes a mark of hers at the build stamp, its strings
   through the spelling map and the dash pass like every other fragment string, and keep-all flips it to
   a person's with every mark. The sources stay in the fragment for a reader and the gates. */
for (const { at, v } of frags.producers) {
	const need = (ok, what) => { if (!ok) fail(`${at}${v && v.component ? ' (' + v.component + ')' : ''}: ${what}`); };
	need(v && typeof v === 'object' && !Array.isArray(v), 'a producers entry is an object');
	for (const k of Object.keys(v)) need(['component', 'producer', 'sources'].includes(k), `unknown key ${k}`);
	need(fragStr(v.component), 'needs component, the key of a component in the fragments');
	const id = compIds.get(v.component);
	need(id, `${v.component} is not a component key in the fragments`);
	need(Array.isArray(v.sources) && v.sources.length && v.sources.every(fragStr), 'needs sources, where each fact comes from');
	const comp = builtComponents.find((c) => c.id === id);
	need(comp && !comp.producer, `${v.component} already carries a producer; one profile per component`);
	const where = 'house.components[' + builtComponents.indexOf(comp) + '].producer';
	comp.producer = mark(producerFrom(v.producer, need, where));
	/* In the schema's key order (the producer after the card), so the normaliser leaves the record as built. */
	const ordered = {};
	for (const k of C.KEYS.HouseComponent) if (comp[k] !== undefined) ordered[k] = comp[k];
	builtComponents[builtComponents.indexOf(comp)] = ordered;
}
/* Each item's one or two comparisons: the item named as the pack names it, each entry's app one of
   the four, a classic with no ref and an in-app one with its ref, a table ref carried as the address it
   opens (tableRef), a codex ref that is a house wine's exact name carried as that wine's id (so the
   Codex opens its card), every other ref as written for check-compare to resolve against the apps'
   data. An item compared twice fails. */
const compared = new Set();
/* A Table ref as the address under the Table it opens: a recipe slug (src/lib/data/recipes.index.json)
   becomes recipe/<slug> and a technique slug (techniques.json) technique/<slug>, a recipe first when a
   slug is both, so every room links it without reading the Table's data. */
let tableSlugs = null;
function tableRef(ref, need) {
	if (!tableSlugs) {
		const data = path.join(HERE, '..', '..', 'src', 'lib', 'data');
		const read = (f) => { const p = path.join(data, f); need(fs.existsSync(p), `a Table comparison needs ${REL(p)} to resolve against`); return new Set(JSON.parse(fs.readFileSync(p, 'utf8')).map((r) => r.slug)); };
		tableSlugs = { recipe: read('recipes.index.json'), technique: read('techniques.json') };
	}
	const m = /^(recipe|technique)\/(.+)$/.exec(ref);
	const slugOnly = m ? m[2] : ref;
	if (m) { need(tableSlugs[m[1]].has(slugOnly), `table ${JSON.stringify(ref)} names no such ${m[1]}`); return ref; }
	if (tableSlugs.recipe.has(slugOnly)) return 'recipe/' + slugOnly;
	if (tableSlugs.technique.has(slugOnly)) return 'technique/' + slugOnly;
	need(false, `table ${JSON.stringify(ref)} is neither a recipe slug nor a technique slug in the Table's data`);
	return ref;
}
for (const { at, v } of frags.compare) {
	const need = (ok, what) => { if (!ok) fail(`${at}${v && v.item ? ' (' + v.item + ')' : ''}: ${what}`); };
	need(v && typeof v === 'object' && fragStr(v.item), 'needs item, the pack item name');
	for (const k of Object.keys(v)) need(['item', 'entries'].includes(k), `unknown key ${k}`);
	const hit = exactItem(v.item);
	need(hit, `${v.item} is not a dish, drink or wine in the house`);
	need(!compared.has(hit.rec.id), `${v.item} is compared twice`);
	compared.add(hit.rec.id);
	need(Array.isArray(v.entries) && v.entries.length >= 1 && v.entries.length <= C.COMPARE_MAX, `needs one or two entries`);
	const entries = v.entries.map((e, i) => {
		const here = (ok, what) => need(ok, `entries[${i}] ${what}`);
		here(e && typeof e === 'object', 'is an object');
		for (const k of Object.keys(e)) here(['app', 'ref', 'label', 'same', 'different'].includes(k), `unknown key ${k}`);
		here(C.COMPARE_APPS.includes(e.app), `app ${JSON.stringify(e.app)} is not one of ${C.COMPARE_APPS.join(', ')}`);
		here(typeof e.ref === 'string', 'needs ref, a string');
		here(e.app === 'classic' ? e.ref === '' : fragStr(e.ref), e.app === 'classic' ? 'a classic carries ref ""' : 'an in-app comparison needs its ref');
		for (const k of ['label', 'same', 'different']) { here(fragStr(e[k]), `needs ${k}`); here(!hasDash(e[k]), `${k} carries a dash; write it without one`); }
		let ref = e.ref;
		if (e.app === 'table') ref = tableRef(ref, (ok, what) => here(ok, what));
		if (e.app === 'codex') { const w = wineIds.get(wineKey(ref)); if (w && house.wines.some((x) => x.id === w && (x.name === ref || slug(x.name) === slug(ref)))) ref = w; }
		const where = `${hit.list}:${hit.rec.name}.compare[${i}]`;
		return { app: e.app, ref, label: fragText(e.label, where + '.label'), same: fragText(e.same, where + '.same'), different: fragText(e.different, where + '.different') };
	});
	hit.rec.compare = mark(entries);
}
/* videos.json: a whole research video record with componentKeys files a new video, as video:+ does;
   { id, componentKeys } alone attaches components to a video an override already files. */
for (const { at, v } of frags.videos) {
	if (!v || typeof v !== 'object' || !fragStr(v.id)) fail(`${at}: a video needs its research id`);
	if (v.componentKeys !== undefined && !(Array.isArray(v.componentKeys) && v.componentKeys.every(fragStr))) fail(`${at} (${v.id}): componentKeys is a list of component keys`);
	const keys = Array.isArray(v.componentKeys) ? v.componentKeys : [];
	if (v.url === undefined) {
		const known = videoAdds.find((x) => x.key === v.id);
		if (!known) fail(`${at} (${v.id}): no video with that id is filed; file it whole (url, title, channel, why, attach, checkedOn) or name an override's video`);
		if (!keys.length) fail(`${at} (${v.id}): attaches nothing; name its componentKeys`);
		for (const k of keys) if (!known.componentKeys.includes(k)) known.componentKeys.push(k);
		continue;
	}
	videoAdds.push(newVideo(v, at));
}
/* The videos, after every list they point into: each attach name resolved within its own list (a dish
   among the dishes, a wine by the wine key, a term among the terms), an unknown name failing the build.
   The quoted title and channel take the dash pass alone; why and topic take the spelling map too. */
if (videoAdds.length) house.videos = [];
for (const v of videoAdds) {
	const where = `${typeof v.n === 'number' ? REL(OVERRIDES) + ' entry ' + v.n : v.n} (video ${v.key})`;
	const path = 'house.videos[' + house.videos.length + ']';
	const inList = (list, name) => {
		const r = clean[list].find((x) => slug(x.name) === slug(name) || (x.idName && slug(x.idName) === slug(name)));
		if (!r) fail(`${where}: ${name} is not a ${list === 'dishes' ? 'dish' : 'drink'} in the house`);
		return r.id;
	};
	const itemIds = [];
	const push = (id) => { if (!itemIds.includes(id)) itemIds.push(id); };
	for (const d of v.dishes) push(inList('dishes', d));
	for (const c of v.cocktails) push(inList('cocktails', c));
	for (const w of v.wines) push(wineId(w, where));
	const termIds = [];
	for (const t of v.terms) {
		const x = house.lexicon.find((r) => slug(r.term) === slug(t));
		if (!x) fail(`${where}: ${t} is not a term in the house lexicon`);
		if (!termIds.includes(x.id)) termIds.push(x.id);
	}
	const componentIds = [];
	for (const k of v.componentKeys) {
		const id = compIds.get(k);
		if (!id) fail(`${where}: ${k} is not a component key in the fragments`);
		if (!componentIds.includes(id)) componentIds.push(id);
	}
	if (typeof v.n === 'number') overrideAt.set(path, v.n);
	const rec = {
		id: idFor('videos', v.key), url: v.url, title: dashFree(v.title, path + '.title'), channel: dashFree(v.channel, path + '.channel'), mins: v.mins,
		topic: dashFree(spelled(v.topic, path + '.topic'), path + '.topic'), why: dashFree(spelled(v.why, path + '.why'), path + '.why'),
		itemIds, termIds
	};
	/* Written only when it names a component, the normaliser's rule. */
	if (componentIds.length) rec.componentIds = componentIds;
	Object.assign(rec, { house: v.house, checkedOn: v.checkedOn, ts: BUILD_TS });
	house.videos.push(rec);
}
/* The components after the videos, the order KEYS.House names; written only when there are some. */
if (builtComponents.length) house.components = builtComponents;
/* The tombstones by id, then the guard: every id the shipped pack holds is in this house or carries a
   tombstone, so no record leaves a device by accident or lingers on one unannounced (a device keeps a
   record a newer edition simply drops; house-pack.ts refreshEdition drops only a tombstoned one). */
const builtIds = new Set();
for (const list of C.HOUSE_LISTS) for (const r of house[list] || []) builtIds.add(r.id);
for (const b of buried) {
	if (builtIds.has(b.id)) fail(`${REL(OVERRIDES)} entry ${b.n}: the tombstone for ${b.was} names ${b.id}, which this house still holds`);
	house.removed[b.id] = b.at;
}
if (fs.existsSync(PACK)) {
	const shipped = JSON.parse(fs.readFileSync(PACK, 'utf8')).house || {};
	for (const id of Object.keys(shipped.removed || {})) if (!builtIds.has(id) && !(id in house.removed)) house.removed[id] = shipped.removed[id];
	const lost = [];
	for (const list of C.HOUSE_LISTS) for (const r of shipped[list] || []) if (!builtIds.has(r.id) && !(r.id in house.removed)) lost.push(list + ' ' + r.id + ' ' + (r.name || r.term || r.title || r.question || '').slice(0, 70));
	if (lost.length) fail(`${REL(PACK)} holds ${lost.length} record(s) this build drops without a tombstone (add a retire or a tombstone in ${REL(OVERRIDES)}):\n  ` + lost.join('\n  '));
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
const coffeeLinks = house.dishes.filter((d) => d.pairing && d.pairing.value.zeroProofId && /coffee/i.test((house.cocktails.find((c) => c.id === d.pairing.value.zeroProofId) || {}).family || '')).length;
const floorBottles = house.wines.filter((w) => w.list === 'bottle').length;
const tiered = house.dishes.filter((d) => d.pairing && d.pairing.value.bottles).length;
console.log(`build-brennans: ${floorBottles} of ${house.wines.length} wines are on the bottle list; ${tiered} dishes carry bottle tiers`);
console.log(`build-brennans: ${coffeeLinks} pairings take a coffee as their zero-proof pick; ${house.wines.filter((w) => w.lines).length} of ${house.wines.length} wines carry the timed lines`);
console.log(`build-brennans: ${REL(OUT)}: ${house.dishes.length} dishes, ${house.cocktails.length} cocktails (${zero} spirit-free), ${house.wines.length} wines, ${house.tastings.length} tastings, ${house.lexicon.length} terms, ${house.scenarios.length} scenarios, ${house.mixUps.length} mix-ups, ${house.mustKnows.length} must-knows, ${house.askAtLineup.length} to ask at lineup, ${house.disputes.length} disputes, ${(house.videos || []).length} videos, ${builtComponents.length} components (${builtComponents.filter((c) => c.producer).length} with a producer, ${house.dishes.concat(house.wines, house.cocktails).filter((r) => r.compare).length} items compared, from ${frags.files.length} fragment file(s) in ${REL(frags.dir)}); ${overrides.entries.length} overrides applied (${applied.filter((a) => a.skipped).length} skipped), ${principleChanges.length} principles mapped, ${dashLog.length} strings dash-stripped (${dashLog.filter((d) => d.override !== undefined).length} set by an override), ${spellLog.length} strings respelled American, ${minted.length} ids minted`);
if (principleChanges.length && args.includes('--verbose')) for (const p of principleChanges) console.log('  principle ' + p.dish + ': ' + p.from + ' to ' + p.to);
