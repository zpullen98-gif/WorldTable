/**
 * The Ingredient Atlas: lexicon entries authored since the archive.
 *
 * WHY THIS FILE EXISTS. raw/D.json is an AST slice of
 * reference/world-table-v1.html and verify-extraction.mjs holds it to
 * word-identity with that archive, including a hard count of 479. There is no
 * way to add a term there, and there should not be: the archive is a
 * historical artefact. So new terms live here and are concatenated in
 * build-data.mjs, exactly the way RECIPE_SUPPLEMENT carries the recipes
 * authored after the original 970.
 *
 * WHAT IT IS FOR. The guide is generous where it is generous: 46 cheeses, 46
 * spices, 41 cured sausages, each a per-item entry a cook can look up. Produce
 * had twelve entries and they were taxonomy essays, not ingredients. The
 * Pantry filter already named 177 ingredients while the Lexicon defined twelve
 * vegetables, so a reader could filter recipes by celeriac and then find
 * nothing telling them what celeriac is. This file closes that.
 *
 * ============================ THE CONTRACT ============================
 *
 * t   The term. Title Case. Its slug is derived from it, so a term is named
 *     once and never renamed: a slug change is a data migration that orphans
 *     every saved record keyed to it. Must not collide with any of the 479 or
 *     with each other AFTER accent folding and apostrophe removal, which the
 *     gate checks because nothing else in the build does.
 *
 * c   The category. One of the six atlases below and nothing else. The five
 *     front-of-house categories have their counts pinned in service-track.mjs
 *     and adding to them fails the build, so the gate refuses them outright.
 *
 * d   The definition, 325 to 1600 characters, the observed house range.
 *     MECHANISM FIRST. Name the thing that is actually happening: polyphenol
 *     oxidase, alliinase, ruptured starch granules, the enzyme, the acid, the
 *     temperature. The house standard is the Spice Atlas note on Sichuan
 *     peppercorn, which explains that sanshool does not burn, it buzzes, and
 *     then tells you to discard the shiny black seeds because they are gritty.
 *     Not history for its own sake, and never a paragraph of praise for a
 *     vegetable. Close on something the cook does tomorrow.
 *
 * The five structured fields below are what makes this an atlas rather than a
 * glossary, and the gate REQUIRES all five on every entry here. They are
 * optional in the emitted shape only so the sealed 479 stay valid.
 *
 * season   Month integers 1 to 12, northern hemisphere, the vocabulary already
 *          used by SEASON.json. Empty array means genuinely year round, which
 *          is a claim: a greenhouse tomato is not in season in January.
 * choose   What a good one looks and feels like with it in your hand. Weight,
 *          firmness, colour, smell, the specific defect to reject.
 * store    Where, how long, and what kills it.
 * prep     The knife reality: peeling, trimming, oxidation, the part people
 *          get wrong.
 * methods  Lowercase verbs or short noun forms the cook would actually use.
 *
 * HOUSE STYLE. No em dashes and no spaced en dashes: the whole product was
 * swept of them and a new one puts it back, and the suite's publish gate has
 * two characters of headroom for the entire site. Use a colon, a semicolon, a
 * comma or a full stop. An unspaced en dash inside a numeric range is fine.
 * American spellings, to match the corpus. Temperatures in Celsius with
 * Fahrenheit in brackets where a cook needs it. Weights in grams.
 *
 * BANNED WORDS. The sanitation module asserts that certain tokens appear in
 * ZERO lexicon definitions, and that assertion is a build gate. `thaw` and
 * `defrost` are the two that will catch a produce writer unawares. The gate
 * below imports that list rather than restating it, so it can never drift.
 */

export const ATLAS_CATEGORIES = [
	'The Vegetable Atlas',
	'The Fruit Atlas',
	'The Herb & Chile Atlas',
	'The Fungi Atlas',
	'The Grain, Pulse & Seed Atlas',
	'The Global Pantry Atlas'
];

export const LEXICON_SUPPLEMENT = [
	{
		t: 'Celeriac',
		c: 'The Vegetable Atlas',
		d: "The swollen stem base of a celery cultivar grown for the root rather than the stalk, and the most underused vegetable in a Western kitchen. It tastes of celery crossed with hazelnut and parsley, and it is DENSE AND LOW IN STARCH, which is the whole point: it purees to silk and cannot turn gluey the way potato does when ruptured starch granules meet a blade. That same low starch is why a celeriac puree takes cream and butter without sliding into wallpaper paste, and why it holds a clean edge under a roast instead of collapsing. Cut surfaces brown within minutes through polyphenol oxidase, the same enzyme that darkens a cut apple, so peeled pieces go straight into acidulated water. Rule of the house: reach for it wherever you want potato's body without potato's starch.",
		season: [9, 10, 11, 12, 1, 2],
		choose: "Heavy for its size and firm everywhere, with no give at the crown where the stalks were cut. Smaller is better: much above 800g the center is often hollow, woody or both, and you pay for weight you will cut away.",
		store: "Unwrapped in a bag in the cold, where it keeps for weeks; it is a storage root and behaves like one. Once cut, wrap the remainder tight, because the open face dries and browns faster than it rots.",
		prep: "Cut a flat foot so it stands, then take the skin down in strips with a knife. A peeler cannot clear the matted root hairs and you will fight it for ten minutes and still leave grit. Hold cut pieces in acidulated water.",
		methods: ['puree', 'roast', 'remoulade', 'gratin', 'soup', 'braise']
	}
];
