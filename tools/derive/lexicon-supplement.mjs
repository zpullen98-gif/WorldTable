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
		t: "Black Truffle",
		c: "The Fungi Atlas",
		d: "Tuber melanosporum fruits underground. Aroma is a mixture: dimethyl sulfide carries farthest, but the character comes from branched aldehydes such as 2-methylbutanal and 3-methylbutanal, with 1-octen-3-ol behind them. Those volatiles are fat soluble, which is the whole technique: they move into butter, cream, egg fat and the fat under a bird's skin, and they leave an open pan with the steam. Black is not white. It takes heat, and its best dishes are cooked outright: simmered into a sauce Perigueux, poached inside a hen, or shut in a jar for two days with eggs still in their shells, since the aroma passes through shell. Sealed, fatty and unhurried: hold an infusion in fat at 60 to 70C (140 to 160F) rather than boiling it. Black truffle is printed over Tuber aestivum, Tuber brumale and Chinese Tuber indicum too, and most truffle oil is factory 2,4-dithiapentane with no truffle in it.",
		season: [12, 1, 2, 3],
		choose: "Hard as stone, warts intact, no soft spot or larval pinhole. Warm it in cupped hands before smelling; cold holds aroma in. Ask for a nick: gleba near black, veins fine and white. Tuber indicum looks identical and smells of little, Tuber brumale is grayer with coarse sparse veins.",
		store: "Dry paper in a sealed jar at 2 to 4C (36 to 39F), changed daily: trapped condensation rots them. Seven days is the working life, losing 1 to 3 percent of weight a day. Never hold it submerged in oil at room temperature: it comes out of soil carrying Clostridium botulinum spores.",
		prep: "Clean it on the day you use it, not the day it arrives. Brush under a thin trickle of cold water with a stiff brush, working the soil from between the warts, then dry it at once. Peel only a scarred gritty rind, and keep the peelings for butter or stock.",
		methods: ["infusing", "warming", "baking", "poaching"]
	},
	{
		t: "Black Trumpet",
		c: "The Fungi Atlas",
		d: "Craterellus, the horn of plenty: a hollow dark funnel with no gills, the spores carried on a nearly smooth outer face. The name covers several: C. cornucopioides in Europe, C. fallax with an ochre to salmon spore print across eastern North America, C. calicornucopioides on the Pacific coast. They cook alike: buy on condition, not the label. Paper-thin flesh drives everything, but not by holding less water: trumpets run near ninety percent like the rest and release it in the pan. Thinness buys surface area, which is why they dry in hours and rehydrate close to their original texture. The liquid runs inky and turns a cream sauce or risotto gray, which is either the point or the problem. Aroma is fruity and apricot-like, the chanterelle note, and drying concentrates it into something smoky and faintly truffled. Never serve them raw: split and saute in butter, steep dried ones in hot cream, or grind them to black powder for pasta dough.",
		season: [7, 8, 9, 10, 11],
		choose: "Supple and springy, damp but not slick, walls flexing back under a press; leathery means the lot has been sitting. Inside deep gray to black, outer face ashy, sometimes spore-bloomed. Smell fruity, never sour. Dig to the bottom of the box, where the crushed layer goes to glue.",
		store: "Paper bag or open tray at 2 to 4C (36 to 39F), three to four days, spread shallow and never stacked deep: the most surface per gram dries fastest, and trapped condensation glues the bottom layer. Split and racked they dry in hours, then airtight in the dark, six months to a year.",
		prep: "Tear each trumpet open lengthwise and rinse the inside, since needles and grit ride the hollow; thin walls take up little water, so a rinse that would ruin a thicker mushroom is safe. Dry them or they steam, then a few minutes in butter over medium heat until the edges crisp.",
		methods: ["sauteing", "pan-frying", "drying", "baking"]
	},
	{
		t: "Chanterelle",
		c: "The Fungi Atlas",
		d: "Not gills but FALSE GILLS: blunt, forked, wax-crayon ridges running down the stem that will not lift with a fingernail. That is the test against the jack-o-lantern, Omphalotus olearius and O. illudens: true gills, thin, sharp, peeling away, clustered on wood or buried roots, illudin S, hours of vomiting. Also against Hygrophoropsis aurantiaca, the false chanterelle: thin crowded gills, limp flesh. The genus runs wide: Cantharellus cibarius in Europe, C. formosus and C. californicus on the Pacific coast, C. cinnabarinus pink not gold, C. lateritius in the south, nearly smooth beneath and judged on smell and tear. The apricot note is volatile: a long wet simmer strips out what you paid for. The orange is carotenoid and fat soluble, so a rinse cannot wash the color out; what water costs is heat, sitting in the ridge channels and holding the pan at boiling point. Dry pan over medium heat until the water hisses off and the squeak returns, then fat, shallot, salt and fast browning. Raw they upset most guts, so cook them through.",
		season: [6, 7, 8, 9, 10, 11, 12],
		choose: "Firm, springy, heavy for the size; fresh ones bend and tear along the fiber rather than snapping, so pliable is fine. Turn one over before you pay: blunt forked ridges, never thin sharp gills. Smell for apricot. Reject slimed ridges, brown-wet edges, anything clustered at a shared base or on wood.",
		store: "Paper bag or cloth-lined box at 2 to 4C (36 to 39F). A week is realistic, but the ridges slime first: check undersides daily, cook the wettest first. Never sealed plastic or put away wet. To keep, saute dry, cool fast and freeze in flat 200g packs; frozen raw they turn bitter. Dry only for powder and stock.",
		prep: "Clean dry: a soft brush and a knife tip to lift grit from the ridges, rinsing fast and toweling at once only if the patch was sandy. Trim the fibrous base. Tear large ones lengthwise with the grain: the tear follows the fibers, so pieces stay whole and the ragged faces brown harder.",
		methods: ["sauteing", "pan-frying", "roasting", "pickling", "braising"]
	},
	{
		t: "Cremini",
		c: "The Fungi Atlas",
		d: "The same AGARICUS BISPORUS as the white button at the same stage: cremini is the brown wild type, the white button a pale mutant found in a brown bed in Pennsylvania in 1925. The difference is strain, not days on the bed; the age grade of this species is the portobello. Water says the same: brown about 92.1 percent, white 92.5, open portobello 92.8, so cremini shrinks as hard as button and the 89 percent figure belongs to no Agaricus on any shelf. The brown strain adds pigment and a modest edge of flavor: free glutamate and the eight carbon alcohols, not guanylate. Free 5-GMP is scarce in any fresh Agaricus. The famous guanylate belongs to dried shiitake, whose own ribonuclease cuts it from the mushroom's RNA as soaking passes 50 to 70 C (120 to 160 F). And 1-octen-3-ol, the smell everyone calls mushroom, does not build on the shelf: lipoxygenase makes it from linoleic acid within seconds of a cut, the real argument against pre-sliced.",
		season: [],
		choose: "Closed caps, dry matte tan to coffee skin, firm under the thumb, stems that snap rather than bend. White fuzz at the cut base is its own mycelium, normal on any Agaricus. Reject slick caps, sunken wet blotches, pooled liquid, a fishy or ammonia smell, and gills dusty with spores.",
		store: "Paper bag or the vented box at 0 to 4 C (32 to 39 F), five to seven days, as a white button. They are not drier; the brown skin only hides bruising, so they look sound longer than they are. Slit sealed film the day you get them home, keep them clear of cut onion, wash at the pan.",
		prep: "Brush or wipe, trim only the dried stem end. Slice no thinner than 6 mm (1/4 inch), since they shed about half their weight. Cook rather than shave raw: heat ruptures the beta-glucan and chitin walls and cuts the agaritine every Agaricus carries, 100 to 600 mg/kg fresh, by a quarter in a dry oven, a third to two thirds in fat or water.",
		methods: ["saute", "roast", "braise", "grill", "stuff", "simmer"]
	},
	{
		t: "Dried Shiitake",
		c: "The Fungi Atlas",
		d: "Lentinula edodes. Drying is manufacture, not preservation. Rehydration restarts enzymes the living cap kept idle: ribonuclease cuts cell RNA to 5'-guanylate, which multiplies the savor of glutamate several times over. A separate pair, gamma-glutamyl transpeptidase and a C-S lyase, cuts lentinic acid to lenthionine, the garlic-and-cabbage sulfur ring fresh caps do not have. They want different heat, so run them in order: soak cold in the refrigerator overnight, warm that liquid to 60 to 70C (140 to 158F) for 20 to 30 minutes, where the ribonuclease runs fastest, then take it over 80C (176F) to stop that enzyme and the phosphomonoesterase that strips the phosphate off the guanylate. A hard boil from the start skips the sequence. Cook rehydrated caps through: raw and barely cooked shiitake set off shiitake dermatitis, a whip-marked rash from lentinan that heat breaks down.",
		season: [],
		choose: "Thick hard caps with a dry rattle, skin an even chocolate brown, gills cream rather than gray, since darkening is age. Buy by thickness: domed winter donko for braising, thin flat koshin for stock. White dust on the gills is spore fall, fuzzy gray or green is mold.",
		store: "Aroma goes, not safety: warmth, air and light cost you the lenthionine and turn the flesh fat stale-oil. Airtight, dark, air pressed out, six months at room temperature. Freeze the sealed pack for longer; it also ends pantry beetles. Rehydrated, 2 to 4C (36 to 39F), two days.",
		prep: "Rinse off grit, then soak weighted under a small plate so none float dry. Pull the stems and cut the woody basal plug into the stockpot; the rest of the stem shreds tender in an hour of braising. Squeeze each cap over the bowl, pour the liquid off its sand, strain it and keep it.",
		methods: ["braising", "simmering", "steaming", "stir-frying", "stewing", "infusing"]
	},
	{
		t: "Enoki",
		c: "The Fungi Atlas",
		d: "FLAMMULINA FILIFORMIS, the cultivated enoki of East Asia, split in 2018 from the European velvet shank F. velutipes: a close cousin, not the same mushroom. The white noodle bundles are forced: darkness, a cold room, and a collar on the bottle neck trapping the mushrooms' own carbon dioxide, so the fruiting body pours everything into stem length and never opens its cap. Flavor is mild and faintly fruity; texture is why you buy them. Long parallel fibers stay chewy-crisp through several minutes of simmering, and overcooking turns them stringy and slick rather than soft. Treat them as a cooked ingredient, never a raw garnish: enoki have been recalled repeatedly over Listeria monocytogenes, with deaths, and the fix is heat all the way through, at least 70 C (158 F) in the strand, a minute or two in simmering broth or a real sear, not a wilt at the pass. Cut the block free of its root plug and separate the strands before they meet heat.",
		season: [],
		choose: "Judge through the film. Want stems bone white from plug to cap, packed tight, caps tiny and still closed, the film dry inside, the pack cold from the case. Reject brown or soaked stems, a tan or wet root plug, liquid or fog in the film, a slack bag, or a pack at its printed date.",
		store: "Refrigerator at 2 to 4 C (36 to 39 F) in the unopened pack, about a week; once opened, wrap in paper inside the bag and use within three days. Listeria monocytogenes still grows slowly at these temperatures, so cold buys texture, not safety: only cooking through does that.",
		prep: "Slice the compressed root block off generously, a good 3 cm (1 1/4 inch), and discard it, the substrate is in there. Fluff the strands apart with your fingers and keep them long rather than chopping them short.",
		methods: ["simmer", "stir-fry", "steam", "grill", "pan-fry", "braise"]
	},
	{
		t: "Hedgehog Mushroom",
		c: "The Fungi Atlas",
		d: "Hydnum repandum is now a group name: the strict species is European, North American hedgehogs mostly H. washingtonianum, H. oregonense or H. subolympicum in the West and H. umbilicatum in the East. Identity is the set, not color: soft pale teeth running partway down the stem, white brittle flesh, a dull orange stain where handled. Hydnellum, which now includes the species long called Sarcodon, is toothed too and shares the duff: most are merely tough and bitter, some, H. scabrosum among them, reported to upset stomachs. Take wild fungi only from a forager who names every cap, and cook them through. The flesh is brittle, so tear it: browning starts only once free water boils off at about 100C (212F) and the surface climbs past about 140C (285F). Age brings bitterness and drying concentrates it, but the principle is water-soluble: a one-minute blanch, water thrown out, pulls most of it. Give it eight to ten minutes, until the edges catch.",
		season: [8, 9, 10, 11, 12, 1],
		choose: "Firm and heavy for its size, cap matte buff to pale apricot, spines pale and standing free. A dull orange blush where handled is bruising, not spoilage, and spines shed in the crate are transit. Reject dented caps, a sour underside, matted slimy spines.",
		store: "Paper bag or shallow tray at 2 to 4C (36 to 39F), no more than two layers, since caps crush and sweat under their own weight. A good week in condition. Do not wash first. Drying concentrates the bitterness, so cook in butter and freeze flat instead.",
		prep: "Brush the cap dry and pick litter from between the spines. On older caps scrape the spines off: they hold the most grit and collapse into a fuzz that clouds a pale sauce. Trim the gritty base, split a stem for larvae, then tear into bite pieces and dry the faces before the pan.",
		methods: ["sauteing", "roasting", "pan-frying", "pickling", "braising"]
	},
	{
		t: "King Oyster Mushroom",
		c: "The Fungi Atlas",
		d: "PLEUROTUS ERYNGII, the odd one of the genus: in the wild no wood rotter but a feeder on dead umbellifer roots, above all Eryngium campestre, in spring grassland; commerce grows it on sawdust year round. Almost all the mass is stem, its hyphae running lengthwise in parallel bundles, a grain like celery: cut across into 2 cm (3/4 inch) discs for a scallop's bite, torn lengthwise for strands that read as pulled meat. Density, not dryness, sets it apart: at about 88 percent water against 92 for a button, the stem is solid tissue with little air, and chitin walls do not slump as cellulose does, so it holds shape through a long cook and colors instead of collapsing. Sear a disc hard in butter and baste, but cook it through, never rare: raw Pleurotus flesh is poorly digested and the genus carries heat sensitive pore formers, ostreolysin A6 and the erylysins, destroyed by cooking. It is ready when a fingertip meets no resistance at the center.",
		season: [],
		choose: "Buy the stem, and buy the fat ones: at least 4 cm (1 1/2 inches) across, straight rather than waisted, heavy for its size. The cap should still be small, domed and tan; a flared flat cap means a pithy core. Reject a bendy stem, lengthwise wrinkles, or a sunken dried base.",
		store: "Coldest shelf, 1 to 4 C (34 to 39 F), in paper, never sealed: a week, ten days at most. Do not cut until the day of use; a cut face dries and goes leathery in hours. Cooked under oil, chill fast, use within three days, since low acid food under oil invites Clostridium botulinum.",
		prep: "Trim the dry base only, never peel. Decide across or with the grain before the first cut, because that decision is the dish. For discs, score both faces 2 mm deep in a diamond pattern and press them flat under a weight in an uncrowded pan, since the stem still sheds water.",
		methods: ["pan-sear", "roast", "grill", "braise", "stir-fry", "deep-fry"]
	},
	{
		t: "Lion's Mane",
		c: "The Fungi Atlas",
		d: "HERICIUM ERINACEUS, a toothed fungus: no gills, no pores, a white pompom of hanging spines that carry the spores. Lion's mane names the whole genus, so buy by shape: erinaceus is one unbranched head, while H. americanum and H. coralloides come as branched combs, thinner and quicker to cook. The spines are a sponge close to 90 percent water that will not brown until the water is gone, so: a dry pan, slabs 1.5 cm (5/8 inch) thick, a weight on top, and patience while it shrinks by half before the fat goes in. The fibers then pull apart like crab leg meat. Cook it through; raw is not a service option, and a few people react with a rash or stomach upset, so it is not the dish to spring on a new guest. The research is narrower than the quoting: hericenones from the fruiting body, erinacines only from cultured mycelium, and raised nerve growth factor synthesis in cell and rodent models. What ruins the sear is a crowded pan and a low flame.",
		season: [],
		choose: "White to cream, springy like a fresh loaf, spines hanging free rather than matted. Faint yellow is age starting; deep yellow to tan is old and turns sour and bitter in the pan. Pink or gray patches, slime, or a smell of ammonia is spoilage, with nothing to trim back to.",
		store: "Refrigerator at 2 to 4 C (36 to 39 F) in paper, four to five days, and check it daily because yellowing runs fast once it starts. Do not seal it: the spines hold surface water and it sours. Cooked, it keeps three days.",
		prep: "Cut straight across the head into thick slabs for steaks, so each piece keeps the dense core that holds the spines; hand-pull strands only when the dish wants shreds, and they cook far faster. Trim substrate at the base, brush sawdust dry, never wash: a rinsed head steams gray.",
		methods: ["pan-sear", "roast", "grill", "deep-fry", "braise"]
	},
	{
		t: "Maitake",
		c: "The Fungi Atlas",
		d: "GRIFOLA FRONDOSA, hen of the woods, a polypore: no gills, just a ruffle of gray-brown fronds on one white base over fine pores. The frond shape is the argument, all edge and no bulk: a hot oven or a hard sear turns the tips to crisp lace while the base stays meaty. Flavor is built in the pan: thin fronds give enormous surface for browning, and its glutamate and 5'-guanylate read far more savory together than either alone. Raw maitake also carries a strong, nonspecific protease, and the documented failure is a Japanese savory egg custard that never sets: the enzyme hydrolyzes the egg proteins before they coagulate, and uncooked gelatin or aspic is at the same risk. Heat kills the enzyme, so blanch or saute the clump before it meets egg or jelly. From a forager, refuse any clump whose flesh blackens where handled: that points to the giant polypore Meripilus giganteus. Roast torn clumps at 220 C (425 F) with enough fat to coat every frond.",
		season: [8, 9, 10, 11],
		choose: "A clump heavy for its size, fronds dry and gray-brown on a pale firm core. Test one outer frond: fresh snaps cleanly when bent, tired folds over limp or crumbles. Reject dark wet fronds, a core gone yellow-orange or spongy, a sour smell, or a box holding a drift of broken tips.",
		store: "Refrigerator at 2 to 4 C (36 to 39 F), whole and in paper, five to seven days; the fronds dry out from the edges inward. It takes to the freezer well once cooked, and it dries cleanly for powder.",
		prep: "Trim a centimeter off the woody base, then pull the rest apart along its natural branching into hand-sized clumps. A torn clump keeps its own stem and tips and colors at one rate; a cut across the ruffle leaves thin tips that burn first. Rinse only for core grit, then dry hard.",
		methods: ["roast", "saute", "grill", "deep-fry", "braise", "steam"]
	},
	{
		t: "Matsutake",
		c: "The Fungi Atlas",
		d: "Tricholoma matsutake in Japan, Korea, China and northern Europe, where the old T. nauseosum proved the same fungus. American kitchens usually get a relative: T. murrillianum from the Pacific Northwest, T. magnivelare in the East, T. mesoamericanum from Mexico. North African cedar-forest T. caligatum travels under the name and is the bitter one, so ask. The point is smell, not flavor: methyl cinnamate over 1-octen-3-ol, matsutake alcohol in Japanese, read as pine resin, cinnamon and something animal. It is ectomycorrhizal with Japanese red pine and never farmed; pine wilt nematode collapsed Japan's harvest and the species is now Vulnerable. Grading follows the veil: heavy, cap closed, veil sealed is top grade; once the cap flattens the aroma is leaving. Both are volatile and leave with the steam, so wet or long heat strips it. Brief fierce heat on a grill, or torn into clear dashi in a covered pot just off the boil for two minutes.",
		season: [7, 8, 9, 10, 11, 12, 1],
		choose: "Heavy and dense, stem thick as a thumb, veil still joined, cap barely open, pine and cinnamon at arm's length; reject soft or bored stems and any that smell merely mushroomy. On a Pacific Northwest lot, sort the whites: Amanita smithiana shares the duff and season and has put pickers in kidney failure days after the meal. It has a soft cottony ring that wipes off, a swollen often rooting base, white gills free of the stem, no cinnamon. A matsutake has a firm banded ring, a stem tapering with no bulb, a cap broken into brown fibrous patches, gills that rust when bruised. Buy whole and uncut.",
		store: "Loosely wrapped in paper at 2 to 4C (36 to 39F), no plastic on the flesh, two or three days; the smell drops daily. Never wash first, and keep it from butter, cream and rice, which take its scent across a cooler. To hold it, freeze it whole and cook from frozen into rice or soup.",
		prep: "Do not soak. Pare dirt from the base with a knife, taking as little flesh as you can, since the base fibers carry the smell, and wipe the cap with a barely damp cloth. Tear it lengthwise with the grain, opening less cut surface for the aroma to leave, and add it at the very end.",
		methods: ["grilling", "steaming", "steeping", "sauteing", "broiling"]
	},
	{
		t: "Morel",
		c: "The Fungi Atlas",
		d: "Morchella: honeycombed, hollow, food only once cooked through. Raw and undercooked, they bring vomiting and cramps through heat-sensitive compounds never fully identified; hemolytic activity is reported in the genus, but no gyromitrin or hydrazine, which are Gyromitra's. Ten to twelve minutes in the pan, never a raw slice. Heat is not a full pardon: a minority react to cooked morels, and delayed gut and neurological illness has followed large servings, so start a first-timer small. Spring lookalikes: Gyromitra is brain-wrinkled rather than pitted, irregularly chambered inside, and carries gyromitrin, which the body converts to monomethylhydrazine; Verpa's thimble cap hangs free from the stem top over a stem of cottony pith. A true morel is pitted, its cap joined to the stem (fully in most, at the midpoint in half-free morels), and cut lengthwise shows one continuous hollow chamber. Cook them hard, then build the sauce in the same pan.",
		season: [3, 4, 5, 6],
		choose: "Springy and firm, upright, pits open and clean, cap joined to the stem. Judge color by type: pale ridges on a black morel mean young. Light for its size; heavy and cold means watered, and it will steam. Reject blackened pits, ammonia smell, wet translucent stems, pinholes.",
		store: "Single layer in a paper-lined tray at 2 to 4C (36 to 39F), a dry towel loose over the top, two to three days; never sealed plastic. To dry, halve them lengthwise first, then rack them until they rattle. Dried morels still need the same full cooking after soaking.",
		prep: "Cut every morel open: the pits hide grit, ants and slugs, and the cut proves one hollow chamber. Halve lengthwise, or slit one side only for stuffing. Swish seconds in cool water, skip the long soak, then dry them or they steam. Keep stuffing shallow and the center hot.",
		methods: ["sauteing", "pan-frying", "braising", "roasting", "stuffing", "drying"]
	},
	{
		t: "Oyster Mushroom",
		c: "The Fungi Atlas",
		d: "PLEUROTUS OSTREATUS, with P. pulmonarius, P. citrinopileatus (golden) and P. djamor (pink) sold beside it as one word. All are wood rotters grown on straw or sawdust; golden and pink are thinner, more fragile, and keep half as long. Thin flesh, gills down the stem: all surface, no bulk, two or three minutes to cook and raw to leathery just as fast. Cook them through every time. Chitin walls need heat to rupture, and the genus carries heat sensitive pore formers, ostreolysin A and pleurotolysin, destroyed by a hard sear or full simmer. Torn into strips in a dry hot pan the edges crisp and the center stays silky, but browning runs near 150 C (300 F) and surface water pins the pan at 100 C (212 F): gray stewed strips. The marzipan note is benzaldehyde over 1-octen-3-ol, gone a day after picking. It hunts, too: toxocysts release 3-octanone, killing nematodes in minutes. Tear along the grain, keep the pan hot and uncrowded, salt at the end.",
		season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		choose: "One stall may hold three species. Gray and blue are strains of P. ostreatus; a uniform yellow cluster is P. citrinopileatus, a pink one P. djamor: both sound, both more fragile, so do not read color as age. Reject tan rim staining, cracked frills, a soaked base, or a sour smell.",
		store: "Cold and open, never cold and sealed. Coldest shelf, 1 to 4 C (34 to 39 F), out of the clamshell and into a paper bag or an uncovered tray: five to seven days for gray and blue, two to three for golden and pink. Stand it base down on a dry towel, changed daily, above raw meat.",
		prep: "Cut the base away in one slice, then pull the caps apart by hand along the grain into thumb-wide strips, leaving the ragged edges that crisp. Brush the straw off dry; if a cluster is truly dirty, rinse it fast, blot it dry, and start it in a dry pan until all the steam has left.",
		methods: ["saute", "pan-fry", "roast", "grill", "stir-fry", "deep-fry"]
	},
	{
		t: "Porcini",
		c: "The Fungi Atlas",
		d: "King bolete: a pored mushroom whose spongy tube layer slimes with age. Porcini is a trade name for a group: Boletus edulis, plus B. aereus, B. reticulatus and B. pinophilus in Europe, B. rex-veris in spring and B. rubriceps in the Rockies. They cook alike, so buy on condition. All share three marks: firm pale flesh that does not blue within a minute of a cut, tubes white to cream when young, and a fine pale net on the upper stem, the reticulation. Savor is not glutamate alone: the multiplier is 5'-GMP, released when the mushroom's own ribonucleases cut its RNA, and the two together far outrun either alone. So drying is no compromise: nine tenths of fresh weight is water, so glutamate per gram climbs, slow warm air keeps those enzymes working, and Strecker degradation builds the roasted note, bis(methylthio)methane, that fresh ones lack. Slice young buttons thick, dry pan until they squeak and edges catch, then butter, garlic and salt.",
		season: [5, 6, 7, 8, 9, 10, 11],
		choose: "Heavy for its size, cap dry and squeaky, stem firm as a raw potato. Red or orange pore mouths, or flesh bluing within a minute of a cut, is a lurid or Satan's bolete and will sicken people. A coarse dark net with pores flushing pink is the bitter bolete: harmless, but taste a raw crumb, spit, and walk away if it is bitter.",
		store: "Paper bag or open basket at 2 to 4C (36 to 39F), three days at most, never sealed plastic. Larvae feed on in the cold, so a pinholed stem is tunneled by morning. To keep, sear hard, cool fast and freeze flat, or slice 5mm and dry at about 45C (113F) until it snaps; hold dried airtight and dark.",
		prep: "Do not soak the fresh: brush, then wipe with a damp cloth. Split every stem lengthwise and cut out larval tunnels. Peel the tube layer off older caps; it turns a sauce gray. For dried, 20 to 30 minutes at about 60C (140F), never boiling: that kills the enzymes releasing 5'-GMP. Lift the pieces out, let the grit settle, decant and use the liquid.",
		methods: ["sauteing", "roasting", "grilling", "drying", "braising"]
	},
	{
		t: "Portobello",
		c: "The Fungi Atlas",
		d: "Agaricus bisporus, mature brown strain: a cremini left on the bed until the veil tears and the cap opens flat to 10 to 15 cm (4 to 6 inches). The white strain grown to the same size is sold as a large white cap, not a portobello. Dry matter climbs from about 8 percent in a cremini to about 10 percent here: that is the whole of the meaty reputation. The gills darken as they shed chocolate brown spores; spores and tyrosinase browning both leach pigment, so a portobello grays a cream sauce. Scrape the gills out with a teaspoon when color matters; they carry flavor. Marinating a raw cap does little: it is already about 90 percent water and the cuticle sheds oil, so it drinks only once heat collapses its air spaces. Salt the cap, wait ten minutes, blot the beads, then grill gill side down before turning it cup up so the juices pool. Its agaritine, a phenylhydrazine at 100 to 500 mg/kg fresh, halves in days of cold and again with cooking.",
		season: [],
		choose: "A flat or upturned cap, dry and matte, heavy and solid, no dark wet patches on the crown. Gills dark brown, dry and standing apart, smelling of earth, not sour or ammoniacal. Reject matted or blackened gills, a cap that sags when lifted by one edge, and a dark shrunken stem end.",
		store: "At 2 to 4 C (36 to 39 F) on a tray gill side down so the cup cannot sit in what it weeps, under a loose paper towel or open bag, four to five days. Never sealed film. To dry a mature cap, slice 6 mm (1/4 inch) at 50 C (122 F) until the pieces snap; keep airtight in the dark.",
		prep: "Twist the stem out and keep it chopped for duxelles or stock. Spoon the gills away if the dish must stay pale. Wipe or rinse and blot: a short rinse adds only about 2 percent of the cap's weight. Crosshatch the crown of a thick cap so the middle cooks before the margin curls.",
		methods: ["grill", "roast", "broil", "pan-sear", "stuff", "braise"]
	},
	{
		t: "Shiitake",
		c: "The Fungi Atlas",
		d: "LENTINULA EDODES, grown on oak logs or sawdust. Its signature smell, lenthionine, does not exist in the intact cell: the tissue stores lentinic acid; damage lets gamma-glutamyl transpeptidase strip the glutamyl group so a C-S lyase can cut the rest into a cyclic sulfur ring. A cap dropped into boiling water, enzymes killed on contact, smells flat. Drying arms guanylate rather than concentrating it: fresh caps hold little free 5'-GMP, and the ribonuclease in dried tissue cuts it from the mushroom's own RNA as it rehydrates, fastest at 60 to 70 C (140 to 160 F). It then multiplies kombu's glutamate, the whole of a meatless dashi. The chew is chitin and chitin glucan. Lentinan, a soluble beta glucan, causes shiitake dermatitis: whip mark streaks that appear a day or two after raw or barely cooked caps and take two to three weeks to fade. Heat labile: cook caps until the edges frill and the surface stops weeping. Never plate them raw.",
		season: [],
		choose: "Thick domed caps with matte brown skin, gills white and tightly combed, edges dry and curled under. Cracked white flowering across the cap is prized, not a defect. Reject thin flat caps, gills gone tan or bruised, and any slick feel.",
		store: "Open paper bag at 2 to 4 C (36 to 39 F), seven to ten days, never sealed plastic. Dried caps keep a year sealed in the dark. For vitamin D2, lay them gills up in high midday sun one to two hours: ergosterol sits in the gills, only direct UVB converts it, and glass blocks it.",
		prep: "Twist the stems off; slice the upper stem thin across the grain. Slice caps 6 mm (1/4 inch). Soak dried caps in cold water in the refrigerator four hours or overnight, then hold that liquid at 60 to 70 C (140 to 160 F) fifteen minutes before it boils and pour it off the grit.",
		methods: ["saute", "braise", "steam", "grill", "simmer", "stir-fry"]
	},
	{
		t: "Shimeji",
		c: "The Fungi Atlas",
		d: "HYPSIZYGUS TESSELLATUS, catalogued in much of the trade as H. marmoreus, is the cultivated cluster sold as beech, buna or brown shimeji; bunapi is the white strain selected out of it. Read the label, not the word: shimeji alone also labels hon-shimeji, Lyophyllum shimeji, a different and mostly wild fungus, and in some shops small oysters. The working fact is bitterness: raw and undercooked they taste sharp and it lingers, and no compound has been pinned down as the cause, so treat it as a cooking problem. Sustained heat and browning take it down, a quick toss does not, and rinsing does nothing. Give them four or five minutes of real pan contact, and cook them through. Past that they turn nutty and hold a firm, almost crunchy bite, the stems being dense and the small caps slow to collapse. Pull the cluster apart at the base, cook until the edges color, then taste one before the dish comes together; if it still bites, keep going.",
		season: [],
		choose: "Sealed film, so buy by eye: caps domed and closed, tucked in toward the stem, no flattening, splaying or split edges. Stems bright white to the trimmed base, no free liquid in the tray, no heavy beading on the film. Marbling is the buna strain, not freshness.",
		store: "Refrigerator at 2 to 4 C (36 to 39 F), unopened in its sealed pack, seven to ten days. That film is not vented, so once opened move what is left to a paper bag or a loosely covered container. Never rinse before storing; cut the base only when you cook.",
		prep: "Slice the shared base off just above the compressed mass so the cluster falls apart into individual stems, then leave them whole, they are already the right size. No washing; a dry brush at most to take off substrate.",
		methods: ["saute", "stir-fry", "roast", "deep-fry", "braise", "simmer"]
	},
	{
		t: "White Button Mushroom",
		c: "The Fungi Atlas",
		d: "AGARICUS BISPORUS picked young, while the partial veil still seals the gills to the stem. Button, cremini and portobello are one species: white and brown are color strains, button to portobello is age. The flesh runs about 92 percent water, so its free amino acids read faint and moisture is the first problem. Crowded, they steam in their own sap, gray and squeaky; given room and real heat the water leaves, the surface passes about 140 C (285 F), and Maillard browning runs. Salt at the start: osmosis drives the water out early so it evaporates sooner, bringing browning forward. The walls are beta-glucan and chitin, no cellulose, so a mushroom shrinks hard and keeps its bite. Cut faces darken as polyphenol oxidase meets air. Cook rather than serve raw: heat ruptures those walls so the flesh digests, and cuts the agaritine this species carries at 100 to 600 mg/kg fresh by a quarter in a dry oven, a third to two thirds in a pan or water.",
		season: [],
		choose: "Caps closed tight to the stem with no gill showing, skin dry and faintly matte, flesh firm and springy through the wrap. Reject a torn veil ring unless you want the stronger flavor it brings, plus slick patches, sunken brown spots, pooled liquid, and any fishy or ammonia smell.",
		store: "Out of sealed film, into a paper bag or the vented punnet, at 0 to 4 C (32 to 39 F); five to seven days for whites, fewer once a cap opens. Slit any film the day you get them home. Keep them clear of dripping greens and cut onion, and leave them unwashed until the pan.",
		prep: "Wipe with a damp cloth or rinse fast and dry at once; they are not sponges but they do drink standing water. Trim the dry stem base and leave the rest, the stem is edible. Halve or quarter rather than slice thin if you want browning; thin slices vanish.",
		methods: ["saute", "roast", "grill", "stuff", "simmer", "pickle"]
	},
	{
		t: "White Truffle",
		c: "The Fungi Atlas",
		d: "Tuber magnatum, pale cream to ochre outside, hazel marbled with white within. Its character compound is bis(methylthio)methane, the molecule sold as 2,4-dithiapentane. It is a liquid, not a gas: a pan destroys it, because it leaves with the water vapor and oxidizes on the way, and the dose that matters is minute. Much of it is made by bacteria in the fruiting body, which is why the aroma falls away once the truffle is out of the ground: three days after lifting it is meaningfully weaker. Service follows from that. Warm the plate and the food to 50 to 60C (120 to 140F), hot enough to lift the aroma and not hot enough to blow it off, with fat underneath, butter, raw egg yolk, fonduta, since the aroma is fat soluble. Shave it at the table, last. What you buy is wild ground in Piedmont, Molise, the Marche, Tuscany and Istria, and the crop is set by summer rain, so a dry July and August means a scarce, dear season.",
		season: [9, 10, 11, 12, 1],
		choose: "Firm as a knuckle, rind smooth and unbroken, garlic and gas reaching you before the box is open. Tuber borchii, bianchetto, is the substitution to watch: smaller, rusty brown as it ripens, roughened, smelling of raw garlic gone sour rather than garlic, cheese and gas together.",
		store: "Dry paper inside a sealed jar at 2 to 4C (36 to 39F), the paper changed twice a day. Three to five days is the honest life. Rice is hygroscopic: it pulls water out and the aroma follows. Freezing ruptures cell walls, so it weeps on warming and the aroma goes with the water.",
		prep: "Brush it dry with a soft brush, working the crevices; do not wash it, do not peel it, and do not cut it until the moment it is served. Weigh it before and after service so the shave is charged honestly. Set the slicer thin enough that the shavings curl and go translucent.",
		methods: ["shaving", "infusing", "warming"]
	},
	{
		t: "Wood Ear",
		c: "The Fungi Atlas",
		d: "Auricularia, kikurage. Most dried black wood ear from China is A. heimuer, named only in 2014 and long sold as A. auricula-judae, the elder jelly ear; thin gray-felted cloud ear is A. cornea, long A. polytricha; wild North American ones are A. americana and A. nigricans. All are bought for texture: a gel of acidic heteropolysaccharides, glucuronoxylomannan foremost, laced with chitin-walled hyphae that gives the snap-then-slither and holds through an hour of braising. It takes up what it cooks in and drinks four to six times its weight, so 10g dried is two portions. Soaked warm and left standing for hours it has killed: Burkholderia gladioli pathovar cocovenenans grows in the soak and makes bongkrekic acid, which cooking does not destroy. Soak cold, refrigerated, pour that water away, use the ears the same day. Fresh never-dried ears reportedly carry photosensitizing porphyrins, broken down by drying and daylight, so cook them through.",
		season: [],
		choose: "Dried: brittle chips that snap rather than bend, one face glossy, the other felted gray, that felt strong on thin cloud ear (A. cornea), slight on thick near-black A. heimuer. Pale bloom is its own spore fall; judge by smell and fuzzy patches. Fresh: firm, springy, no slime.",
		store: "Dried, airtight and dark, a year and more, but drying is not sterilizing: it has carried Salmonella into kitchens, so handle the chips as raw and wash bowl and hands after soaking. Fresh, two to three days at 2 to 4C (36 to 39F). Rehydrated, drained and cold, 24 hours.",
		prep: "Cold water in the refrigerator, one to two hours for cloud ear, four for thick black ears, until no brittle core is left. In a hurry, just-boiled water off the heat, 15 minutes, cook at once. Cut out the hard pale knot, slice fine, blanch 30 to 60 seconds for cold dishes.",
		methods: ["stir-frying", "simmering", "blanching", "steaming", "braising"]
	},
	{
		t: "Celeriac",
		c: "The Vegetable Atlas",
		d: "The swollen stem base of a celery cultivar grown for the root rather than the stalk, and the most underused vegetable in a Western kitchen. It tastes of celery crossed with hazelnut and parsley, and it is DENSE AND LOW IN STARCH, which is the whole point: it purees to silk and cannot turn gluey the way potato does when ruptured starch granules meet a blade. That same low starch is why a celeriac puree takes cream and butter without sliding into wallpaper paste, and why it holds a clean edge under a roast instead of collapsing. Cut surfaces brown within minutes through polyphenol oxidase, the same enzyme that darkens a cut apple, so peeled pieces go straight into acidulated water. Rule of the house: reach for it wherever you want potato's body without potato's starch.",
		season: [9, 10, 11, 12, 1, 2],
		choose: "Heavy for its size and firm everywhere, with no give at the crown where the stalks were cut. Smaller is better: much above 800g the center is often hollow, woody or both, and you pay for weight you will cut away.",
		store: "Unwrapped in a bag in the cold, where it keeps for weeks; it is a storage root and behaves like one. Once cut, wrap the remainder tight, because the open face dries and browns faster than it rots.",
		prep: "Cut a flat foot so it stands, then take the skin down in strips with a knife. A peeler cannot clear the matted root hairs and you will fight it for ten minutes and still leave grit. Hold cut pieces in acidulated water.",
		methods: ["puree", "roast", "remoulade", "gratin", "soup", "braise"]
	}
];
