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
 * d   The definition, 325 to 1200 characters, and aim for 650 to 950. The
 *     corpus median is 757 and its longest entry is 1586. The first authored
 *     batch came in at a median of 1516 because the gate had a floor and no
 *     ceiling, and had to be rewritten: a floor alone is half a rule.
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
 *          firmness, color, smell, the specific defect to reject. 140 to 280
 *          characters, and never above 700. The ceiling is 700 rather than
 *          something tighter because matsutake needs 597 of them to describe
 *          Amanita smithiana, which shares its duff and its season and has put
 *          foragers into kidney failure. A rule that trims THAT is wrong.
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
		t: "Acorn Squash",
		c: "The Vegetable Atlas",
		d: "A ribbed, dark green, acorn-shaped winter squash (Cucurbita pepo), and the least sweet of the common ones: dry matter is around 12 percent, the flesh runs fibrous and mildly nutty, and sugar never climbs the way it does in kabocha or delicata, because it sets little starch and, as a pepo, will not convert what it has to sugar in storage the way the maxima squashes do. It only declines, so buy it to cook, not to keep. The deep ribs and hollow seed cavity make a natural bowl, which is why it is nearly always halved, seasoned in the cavity, and baked: butter and maple, or brown sugar, or sausage and apple, with the added fat and sugar doing work the flesh cannot do alone. Cut it pole to pole through the ribs, score the flesh in a crosshatch, and roast cut side DOWN first at 200C (400F) so the face steams itself tender against the pan; flip and glaze to finish. Young acorn skin is edible, old acorn skin is leather.",
		season: [9, 10, 11, 12, 1],
		choose: "Dull dark green with an orange ground spot where it lay in the field; a pale ground spot means it was picked early. Heavy, rind hard, stem dry. Reject fruit gone mostly orange: it is old, stringy, and flat.",
		store: "Cool dry room at 10 to 13C (50 to 55F), a month or two. Never cure it warm as you would a butternut: above 15C respiration burns off the little sugar it has and the rind goes orange, for stringy, flat flesh. Cut halves, wrapped and cold, 3 days.",
		prep: "Set it on a damp towel, drive a heavy knife into the crest of a rib at the stem end, and lever down to halve it pole to pole. Scoop seeds and strings, and crosshatch the flesh so seasoning gets past the surface. If the flesh smells or tastes bitter, raw or cooked, throw the whole squash out: acorn crosses readily with ornamental gourds, cooking does not break the cucurbitacins down, and a mouthful brings on violent vomiting and diarrhea.",
		methods: ["roast", "bake", "steam", "braise", "grill"]
	},
	{
		t: "Amaranth Greens",
		c: "The Vegetable Atlas",
		d: "The leaf of the amaranth plant: een choy in Cantonese kitchens, chaulai in India, efo tete in Yoruba, callaloo in Jamaica. In Trinidad and much of the eastern Caribbean callaloo is taro leaf instead, a different plant whose raphides make it unsafe until it has simmered half an hour, so ask which leaf you are buying. A hot-weather green that thrives in the heat that makes spinach bolt. Red types carry BETACYANIN, the beet pigment, water soluble and fragile: long cooking or an alkaline pot turns the magenta brown, so cook it fast and lean acid. Flavor is mild and mineral, with spinach's oxalate chalkiness in older leaves. The leaf collapses in a minute while the stems stay crisp, so slice them separately and give them a two-minute head start. Amaranth is not mucilaginous and will not thicken a stew; the body in callaloo is okra.",
		season: [6, 7, 8, 9],
		choose: "Bright turgid leaves with even color, stems crisp enough to snap, no seed heads forming. Reject holed or yellowing leaves, woody lower stems, and bunches already wilting at the tips.",
		store: "Refrigerate unwashed in a loose bag at 0 to 2 C (32 to 36 F), 4 to 6 days. It grows in heat, but the cut leaf is not chilling sensitive the way basil is; cold plus high humidity is what holds it, and 5 C is what costs it days.",
		prep: "Wash in several changes of water, since the leaves cup grit. Strip leaves from any stem thicker than a pencil, cut tender stems into 3 cm lengths and start them first. Red types color the pan and the garlic. Oxalate runs higher here than in spinach: for anyone with a stone history, blanch in a big pot and pour the water off, which carries most of the soluble oxalate away. Steaming and stir-frying do not.",
		methods: ["stir-fry", "saute", "simmer", "blanch", "steam", "braise"]
	},
	{
		t: "Arugula",
		c: "The Vegetable Atlas",
		d: "A brassica, not a lettuce, and that is the whole flavor: chewing ruptures cells and lets MYROSINASE meet the GLUCOSINOLATES, generating isothiocyanates in seconds, the same reaction that sharpens mustard and horseradish. Pungency climbs with heat, drought and age, so summer-stressed or bolting plants bite hard while cool-grown spring leaf tastes green and nutty. Salad arugula is ERUCA SATIVA, broad and moderate; WILD or SYLVETTA rocket is another plant, DIPLOTAXIS TENUIFOLIA, narrow-lobed and twice as hot; baby leaf is mildest. The glucosinolates are water-soluble, so soaking leaches them; the isothiocyanates are volatile, so leaves cut early go flat. Heat denatures the enzyme near 70 C, so arugula on a hot pizza wilts sweet. Dress it whole, at the last second, with fat and acid.",
		season: [4, 5, 6, 9, 10],
		choose: "Leaves stiff and dark with dry stems, smelling sharply of mustard when you crush one. Reject yellowing, wet clumped leaves at the bottom of the box, and long thick stalks carrying flower buds, which are fibrous.",
		store: "Refrigerate at 0 to 2 C (32 to 36 F) in a vented box with a dry towel, 3 to 5 days. Trapped moisture turns it to slime overnight; only pea shoots fail faster.",
		prep: "Wash once in cold water and dry gently but completely, since bruised leaves darken and go bitter. Leave the leaves whole, pull off any stem thicker than a matchstick, and add it off the heat if it is going into something hot.",
		methods: ["raw", "wilt", "saute", "puree", "grill"]
	},
	{
		t: "Asparagus",
		c: "The Vegetable Atlas",
		d: "The spear is a shoot: an entire young stem racing upward, which is why it is the sweetest thing in the garden the hour it is cut and dull three days later. Once severed it keeps respiring, burning its own sugar and stiffening the base with lignin, so a week-old spear is fibrous at the bottom and flat on the palate. The green is chlorophyll; the sulfur note on the plate comes from methionine compounds breaking down in the heat, while the famous smell afterward is a separate matter, asparagusic acid metabolized in the body into volatile sulfides that not everyone can smell. Thickness is variety and crown vigor, not toughness: fat spears from an established crown are tender and sweet, pencil spears from a young one are stringier. Cook them hard and fast so the chlorophyll stays bright: heavily salted boiling water, a hot grill, a dry roast at 220C (425F). Stop while the spear still bends without snapping.",
		season: [4, 5, 6],
		choose: "Tight, dry, purple-tinged tips with no flowering and no wet smell; the spear should squeak when two are rubbed together. Reject shriveled or split butts and tips that are going to seed or turning slimy.",
		store: "Trim a centimeter off the butts and stand the bunch in 2cm of water in the refrigerator, loosely bagged, up to four days. Cold is the whole point: warmth speeds the respiration that burns off the sugar and lays lignin into the base.",
		prep: "Snap or cut off the woody base, then peel the lower third of fat spears with a swivel peeler; the skin there is lignified and stays tough at any temperature. Thin spears need no peeling at all.",
		methods: ["blanching", "grilling", "roasting", "steaming", "sauteing", "stir-frying"]
	},
	{
		t: "Bamboo Shoots",
		c: "The Vegetable Atlas",
		d: "The new culm of a bamboo, cut in its first weeks while it is still a tight cone of overlapping sheaths. Fresh shoots contain cyanogenic glycosides, principally TAXIPHYLLIN, which release hydrogen cyanide when the tissue is damaged: they must be BOILED, uncovered so the gas escapes, 20 to 40 minutes for small spring shoots and up to two hours for a big winter one, and the water thrown away. The harshness is separate: homogentisic and oxalic acid, building from the hour it is dug. Rice bran, nuka, and a dried chili go in because the bran's starch takes up those acids and its calcium ties up the oxalic. The reward is a shoot that is crisp, faintly sweet, and a little smoky. Canned shoots are already boiled and safe but carry a tinny brine: two minutes in fresh water strips it. Never eat fresh bamboo raw, and never shortcut the boil.",
		season: [12, 1, 2, 3, 4, 5],
		choose: "Heavy, firm shoots with tight glossy sheaths and a moist pale cut base; smaller is sweeter. Reject dry, cracked, or greening tips, which mean the shoot has aged and turned bitter in the ground.",
		store: "Boil fresh shoots the day you buy them, since raw ones turn bitter within 24 hours. Once boiled, keep them submerged in fresh water in the refrigerator up to a week, changing the water daily.",
		prep: "Cut the top off at an angle, where the cyanogen is highest, and slit the sheaths down one side. Boil in the sheaths, uncovered, with rice bran and a dried chili until a skewer slides through the base. Cool in the liquid, then peel, trim the woody base, and slice into wedges or combs.",
		methods: ["boiling", "stir-frying", "braising", "simmering", "grilling"]
	},
	{
		t: "Beefsteak Tomato",
		c: "The Vegetable Atlas",
		d: "The big multi-locular slicer: thin walls, wide seed-and-jelly chambers, water near 95 percent, which is why it falls apart in a pan and why it owns the sandwich and the platter. Its case for existing is aroma, not flesh. The green-leaf volatiles that read as tomato (cis-3-hexenal, hexanal) are not stored in the fruit; a lipoxygenase cascade builds them in seconds from membrane fats the moment you cut. Cold suppresses that machinery: a week below about 12 C (54 F) holds the volatile genes down and aroma only partly returns in a warm kitchen, while chilling injury to the cell membranes is what turns flesh mealy. A day or two cold is recoverable and beats letting a ripe tomato rot. Counter, stem-scar down, and salt cut slices a few minutes before serving: salt draws juice and lifts sweetness, but aroma is smelled, not tasted, and cis-3-hexenal fades in minutes, so do not hold them.",
		season: [7, 8, 9],
		choose: "Heavy for its size, taut and matte rather than plastic-shiny, with a little give at the equator and a small dry stem scar; dark, damp or sunken tissue there is rot starting. Hard shoulders and a flat, uniform pale red mean picked mature green: the white core only shows once you cut.",
		store: "Counter, out of the sun, stem-scar down so the shoulder does not bruise, three to five days. Days below about 12 C (54 F) cost aroma and then texture, so keep whole fruit warm while it is usable; if it is dead ripe and you cannot get to it, a day or two cold beats rot. Cut halves go face down and covered, one day.",
		prep: "Core with the knife tip at a shallow angle, then cut with a serrated edge, 1 cm (3/8 in) thick, and salt on a rack so the slices drain. For a raw sauce, grate the cut face on a box grater and discard the flattened skin.",
		methods: ["raw", "grilling", "broiling", "roasting", "stewing"]
	},
	{
		t: "Beet",
		c: "The Vegetable Atlas",
		d: "Beta vulgaris, the same species as sugar beet and chard. The color is not anthocyanin but BETALAIN, a nitrogen-bearing pigment in two families: red-violet betacyanin and yellow betaxanthin. Betalains are water-soluble and escape through the smallest cut, so a peeled, chopped beet boils out pale while the water goes crimson. They degrade under sustained heat and above about pH 6, sliding toward brown. Sugar runs 6 to 8 percent, among the highest in any vegetable, which is why beets roast to near-candy. In some eaters the pigment passes through and reddens urine and stool, which is harmless. The earthy note is GEOSMIN; acid breaks it down to something odorless, the real reason beets with vinegar, with goat cheese, with citrus all work. Roast them whole in their skins, covered, then slip the skins off while warm.",
		season: [6, 7, 8, 9, 10],
		choose: "Small to medium, 5-8 cm (2-3 in), heavy for their size, with taut unwrinkled skin and a short intact tail. Lively tops are a freshness tell and good eating, though they match spinach for oxalate, which matters to anyone who forms kidney stones. Reject soft shoulders and anything bigger than a fist, which runs woody.",
		store: "Cut the tops back to 2 cm (1 in) so they stop drawing moisture. Refrigerate the roots unwashed in a bag for two to three weeks and the greens separately for three days. Cooked beets hold five days.",
		prep: "Cook whole and unpeeled to keep the color in, then rub the skins away in a towel. If you must cut them raw, use a board you do not mind staining and acidulate the water. Gloves save your hands; lemon juice lifts the stain.",
		methods: ["roast", "boil", "pickle", "raw", "braise", "grill"]
	},
	{
		t: "Belgian Endive",
		c: "The Vegetable Atlas",
		d: "WITLOOF, the forced chicory: the root is grown in a field through summer, lifted, then regrown in complete darkness for about three weeks, which is why the chicon is ivory and tight. With no light there is no chlorophyll and far less of the bitterness the green plant would build, leaving a crisp, faintly bitter leaf with a hollow snap and a bullet-shaped structure nothing else offers. Light undoes that work: a head left out under bright light greens at the tips within hours and turns genuinely bitter, which is why growers ship it wrapped in blue paper. The solid cone of core at the base is the sharpest part of all. Whole leaves make the best edible spoon in the kitchen, and halves braised cut side down in butter with a pinch of sugar go silky and faintly caramel. Keep it wrapped and dark until you use it.",
		season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		choose: "Tight torpedo shapes, ivory with pale yellow tips and no green, firm and heavy in the hand. Reject greening tips, splayed or opening leaves, brown flecks, and soft butts.",
		store: "Refrigerate wrapped in paper inside a bag, in the dark, at 2 to 4 C (36 to 39 F), 1 to 2 weeks. Light, not age, is what makes stored endive bitter.",
		prep: "Trim a sliver off the butt and pull the leaves away whole, or halve lengthwise and cut out the solid cone of core. Cut surfaces brown quickly, so acidulate with lemon or cut to order.",
		methods: ["raw", "braise", "grill", "roast", "saute", "gratin"]
	},
	{
		t: "Bell Pepper",
		c: "The Vegetable Atlas",
		d: "The same species as the jalapeno and the cayenne, Capsicum annuum, with one gene switched off: a deletion at Pun1 means the placenta, the pale rib the seeds hang from, never builds capsaicin. Everything else about a chile is still in there, which is why the fruit changes so much as it ripens. GREEN is simply unripe: chlorophyll still present, the green pyrazine (2-isobutyl-3-methoxypyrazine) at full strength, sugar low. Ripe color is the cultivar, not a stage: a red one clears chlorophyll and builds capsanthin, while yellow and orange types lack a working capsanthin-capsorubin synthase and stop at paler carotenoids. Sugar roughly doubles and the pyrazine fades. Choose the color for the job: green for the grassy bite of a sofrito or a stew. The skin is a cuticle that never softens, so char it black, sweat it covered ten minutes, and rub it off.",
		season: [7, 8, 9, 10],
		choose: "Thick-walled, heavy and squeaky-firm, shoulders taut, stem green and pliable; three lobes or four makes no difference to flavor. Reject wrinkled shoulders, soft ground near the stem, or a sunken spot at the blossom end.",
		store: "Crisper in an open bag, one to two weeks for green, under a week for red and yellow, which are riper and soften faster. Surface water starts the rot at the stem, so dry them before they go in and do not seal the bag.",
		prep: "Stand it on the board and cut the walls off the core in four downward slices: seeds stay with the core and nothing needs rinsing. Strip the pale ribs, which carry the bitterness. Peel for a salad or puree, leave peel on for a stew.",
		methods: ["raw", "roasting", "charring", "grilling", "stir-frying", "stewing"]
	},
	{
		t: "Bitter Melon",
		c: "The Vegetable Atlas",
		d: "A knobbly cucumber-shaped gourd (Momordica charantia) sold green and hard, whose bitterness is the point: momordicin and related cucurbitane glycosides, densest in the skin and the green wall rather than in the white pith, give a clean lingering bitter that Chinese, Indian, and Southeast Asian cooks set against fat, chili, and fermented salt. The CHINESE type is pale green, smooth-ridged, longer and milder; the INDIAN type, karela, is darker, narrower, warty, and fiercer. Buy it hard and green. Tame it without erasing it: slice thin, salt 20 to 30 minutes, squeeze and rinse, which pulls juice out and leaves sodium behind to blunt what stays, or blanch a minute, which genuinely leaches the glycosides into the water. Then cook it hard with fat and something salty, black beans, egg, dried shrimp. Two cautions: it lowers blood sugar, which matters for anyone on diabetes medication, and it is avoided in pregnancy; the seeds and the sweet red aril of ripe fruit can cause vomiting in children and hemolysis in people with G6PD deficiency, so throw them out.",
		season: [6, 7, 8, 9],
		choose: "Firm and heavy, ridges tight and unblemished, skin evenly green whether pale or dark by type. Reject yellowing or orange fruit, soft spots, and any melon split open to show the red seed pulp inside.",
		store: "Paper bag in the warmest part of the refrigerator, 4 to 5 days: it is chilling sensitive, and a cold crisper pits and browns the ridges while a warm kitchen yellows it. Cut melon, wrapped, 2 days. A one minute blanch before freezing suits curries but gives up the crunch.",
		prep: "Halve lengthwise and scoop the white pith and seeds out with a spoon: they go for texture, not for bitterness, which lives in the green wall and skin you are keeping. Discard any red aril and mature seeds. Slice thin on the bias, salt 20 minutes, squeeze dry.",
		methods: ["stir-fry", "braise", "steam", "simmer", "fry", "pickle"]
	},
	{
		t: "Black Garlic",
		c: "The Vegetable Atlas",
		d: "Call it aged, not fermented: no microbe does this, and no enzyme either, since heat denatures the garlic's own within hours. Whole heads are held at 60 to 70 C (140 to 158 F) at high humidity for three to six weeks, and heat alone hydrolyzes fructans to fructose and glucose and proteins to free amino acids, which feed a Maillard reaction slow enough to darken without burning. Alliinase dies with it, so no allicin can form and there is no bite: cloves go soft and tacky like a date, nearly black, tasting of balsamic, tamarind and molasses over real acidity, the pH near 4. Because it is neither raw nor pungent it goes where raw garlic cannot, mashed into a vinaigrette, beaten into butter for steak, stirred into a braise at the finish. Hard heat burns off the aromatics you paid for. Add it off the heat.",
		season: [],
		choose: "Cloves black the whole way through, soft and yielding like a dried date, peeling clean in one piece. Reject cloves gray-brown at the core, or dry, crumbly and hard: those came out of the warm room early.",
		store: "Sealed in the refrigerator, whole or peeled, six months and more, since low water and low pH make it stable. At room temperature it sweats and grows surface mold. Frozen peeled cloves hold a year with no loss of texture.",
		prep: "Squeeze the head from the root end and the cloves push out; peel with fingers rather than a knife, because the flesh tears. Mash to a paste with a fork or the flat of a blade. It will not slice and it does not want mincing.",
		methods: ["emulsifying", "braising", "infusing", "glazing"]
	},
	{
		t: "Bok Choy",
		c: "The Vegetable Atlas",
		d: "Brassica rapa again: a loose bouquet of spoon-shaped leaves on white or jade-green stems, mild because its glucosinolates run to gluconapin rather than the sinigrin behind mustard heat, and because there is not much of it. The stem is dense and mostly water, the leaf thin and nearly all surface, and the two cook at completely different rates. Split and stage them, stems first for 2 minutes and leaves for 30 seconds, or accept mush on one side and squeak on the other. Baby heads under 10 cm can be halved lengthwise and treated as a single object, seared cut face down in a film of hot oil until that face browns and the layers steam through from the heat they hold. A dry wok sticks and scorches; a crowded one boils instead of searing. High heat, small batches, salt at the end.",
		season: [10, 11, 12, 1, 2, 3],
		choose: "Stems firm, unbruised, and squeaky, leaves glossy and unwilted, the base pale and freshly cut. Reject brown rust spots on the stems, translucent slimy bases, or any head that has started to flower.",
		store: "Upright in a perforated bag in the crisper, 4 to 5 days. It bruises wherever it is stacked, so keep it one layer deep; bruised stems go brown and then slimy from the outside in.",
		prep: "Halve or quarter baby heads through the root so they hold together, and wash between the layers where grit collects. Break large heads down leaf by leaf, stems cut on a bias, leaves left wide.",
		methods: ["stir-fry", "steam", "braise", "grill", "blanch", "simmer"]
	},
	{
		t: "Broccoli",
		c: "The Vegetable Atlas",
		d: "A head of immature flower buds on an edible stalk, and the cook's clock runs against those buds: as they age they open, yellow, and lose the chlorophyll that reads as fresh. Its famous compound, sulforaphane, does not exist in the intact plant; chopping brings glucoraphanin and the enzyme myrosinase together, and myrosinase is destroyed by heat, so cut the florets and let them sit 30 to 40 minutes before they meet the pan. Then cook hot and brief: steam 4 minutes to bright green, or roast at 220C (425F) until the floret edges catch and blacken, which is where the flavor is. Long boiling costs twice: leaked acids strip the magnesium from chlorophyll to drab pheophytin, and S-methylcysteine sulfoxide breaks down to hydrogen sulfide. The stalk is the best part: peel the fibrous skin and it is sweeter than the crown.",
		season: [4, 5, 6, 9, 10, 11],
		choose: "Tight blue-green beads packed so closely you cannot pick out an individual bud, on a firm stalk. Reject any yellow at all, open flowers, or a hollow woody core showing brown at the cut.",
		store: "Unwashed in a perforated bag in the coldest part of the refrigerator, 5 to 7 days. It respires harder than almost any vegetable: sealed, it runs itself out of oxygen and sits in its own ethylene and damp, so give it cold and air, never a sealed container.",
		prep: "Cut florets off the crown through their own stems so they stay intact, then peel the stalk with a knife rather than a peeler, since the tough layer runs deeper than a peeler takes. Cut the stalk into coins.",
		methods: ["roast", "steam", "stir-fry", "blanch", "grill", "saute"]
	},
	{
		t: "Broccoli Rabe",
		c: "The Vegetable Atlas",
		d: "Not broccoli and not even the same species: Brassica rapa, the turnip's own, so it eats like a turnip top rather than a cabbage. Broccoli is a close relative all the same, same genus. Buds, leaves, and stems are all edible and all bitter, from glucosinolates and the isothiocyanates they release at the cut, which the Italian kitchen treats as the point rather than the flaw. Those are water soluble, so you control them with a blanch: 60 to 90 seconds in heavily salted boiling water, then ice, then a squeeze, which takes about a third of the bite and leaves the color. Skip the blanch when you want it aggressive. Its home is garlic, chili flake, and olive oil, with orecchiette or a pork sausage sandwich, both of which need that bitterness to cut the fat. Frost sweetens it; a crop racing to flower in spring warmth is the sharpest.",
		season: [11, 12, 1, 2, 3, 4],
		choose: "Slim firm stems, tight buds with at most a few open yellow flowers, leaves dark and unwilted. Reject fibrous stems thicker than a finger, mass flowering, or any yellowing in the leaves.",
		store: "Wrapped in a damp towel inside a perforated bag in the crisper, 3 to 5 days. It keeps flowering and turning bitterer even in the cold, so it is a buy-and-use vegetable, not one you hold.",
		prep: "Trim 2 cm off the stem ends and peel nothing. Anything thicker than a finger gets split lengthwise so the stem cooks in the leaf's time. Keep it in long lengths for the pan, chopped only for pasta.",
		methods: ["blanch", "saute", "grill", "braise", "roast"]
	},
	{
		t: "Broccolini",
		c: "The Vegetable Atlas",
		d: "Not baby broccoli: a deliberate 1993 cross of broccoli with gai lan, bred in Japan and sold as Aspabroc, small loose head from one parent, long sweet stem from the other. The point of it is that the stem is the vegetable, tender the whole way down, no peeling and no woody core, so the whole spear cooks in one piece in one timing. It is milder and sweeter than broccoli, with a faint mustard edge from the gai lan side. Its enemy is timing: heat frees the plant's acids, they strip magnesium from chlorophyll, and green turns to khaki pheophytin, which nothing brings back. Cook it fast, uncovered, acid only at the end. Sear it dry in a hot pan or on a grill, two to three minutes, until the stems are marked and still snap, then off the heat with lemon, chili, and salt.",
		season: [10, 11, 12, 1, 2],
		choose: "Stems firm enough to snap rather than bend, heads tightly closed and deep green. Reject open yellow flowers, cut ends gone hollow and dry, or limp stems that curl over in the hand.",
		store: "Perforated bag in the crisper, 4 to 5 days; it is more perishable than broccoli. Standing the cut ends in a centimeter of water keeps the stems turgid if you must hold it an extra day.",
		prep: "Trim 1 cm off the dry ends and cook it whole. Only the thickest stems need splitting lengthwise so they finish alongside the leaves; nothing on this plant needs peeling.",
		methods: ["grill", "saute", "roast", "blanch", "stir-fry", "steam"]
	},
	{
		t: "Brussels Sprouts",
		c: "The Vegetable Atlas",
		d: "Axillary buds: each sprout is a miniature cabbage head formed in a leaf axil along a thick stalk, which is why they arrive by the dozen and why the ones lowest on the stalk are the biggest and the oldest. Frost is a real event for them, cold driving the plant to pile up sucrose and glucose as antifreeze, so the same field tastes sweeter in December than it did in October. The bitterness people remember is sinigrin and progoitrin, bred sharply down since the 1990s; what remains is beaten not by longer boiling but by browning. Halve them, lay the cut face down in a hot pan with fat, and leave them alone until that face is properly dark: Maillard against the sprout's own sugars. Boiled whole they go gray and sulfurous instead. Shred the small raw ones for slaw with lemon and hard cheese.",
		season: [10, 11, 12, 1, 2],
		choose: "Tight, hard, bright green spheres that feel like golf balls, ideally still on the stalk. Reject yellowing outer leaves, a puffy loose head, or a blackened cut base, which all mean age.",
		store: "On the stalk in the cold, 2 weeks; loose in a perforated bag, 5 to 7 days. They yellow and turn sulfurous fastest at room temperature, so buy them cold and keep them cold.",
		prep: "Trim a thin slice off the dry base and pull only the loose or blemished outer leaves; cutting a cross in the base is folklore that just floods them with water. Halve through the stem so the leaves stay attached.",
		methods: ["roast", "saute", "fry", "braise", "grill", "steam"]
	},
	{
		t: "Burdock Root",
		c: "The Vegetable Atlas",
		d: "GOBO in Japan: the long taproot of greater burdock, Arctium lappa, and one of the most aggressively astringent vegetables in common use. The flesh is loaded with chlorogenic acid and related polyphenols, which are both the flavor, a woody earthy bitterness, and the problem, since cutting it lets polyphenol oxidase turn the face gray-brown inside a minute. It stores inulin, not starch, so there are no granules to swell and no mealy collapse; the crunch that outlasts a long simmer is lignified fiber, and the inulin itself leaches away in the pot. The best flavor sits directly under the skin, so scraping beats peeling and a pale scrubbed root has already lost half of what you paid for. Soak cut gobo in water with a splash of vinegar for ten minutes, drain hard, and stir-fry it fast for kinpira before the soy and mirin go in.",
		season: [11, 12, 1, 2, 3, 4],
		choose: "Buy it rather than dig it: foxglove rosettes pass for first-year burdock and the root carries cardiac glycosides. Pencil to broom-handle thick, firm the whole length, root hairs and soil on, and it should not flex. Reject cracked, hollow, limp, or pale scrubbed roots.",
		store: "Refrigerate unwashed with its soil, wrapped in damp paper inside a bag, for two weeks; standing it upright in a deep container helps. Once cut it browns and dries quickly, so soak it or use it the same day.",
		prep: "Scrape the skin with the back of a knife instead of peeling, since the flavor lives just beneath it. Shave sasagaki style, like sharpening a pencil, straight into vinegar water. Change the water once, then drain hard.",
		methods: ["stir-fry", "braise", "simmer", "deep-fry", "pickle", "steam"]
	},
	{
		t: "Butter Lettuce",
		c: "The Vegetable Atlas",
		d: "BIBB and BOSTON, the two American trade names, and the red butterheads sold as butter lettuce too: loose rosettes with thin cell walls and a soft midrib that never goes fibrous. No lettuce rib carries meaningful lignin, so the butter is low fiber and low turgor, not an absence of wood. That structure is both the appeal and the problem. The leaf yields instantly under the tooth and it bruises just as instantly under a thumb, going translucent and watery within minutes of rough handling. Salt is the agent in a dressing: it pulls water osmotically out of cells that have little structure to hold it, so a butter lettuce dressed five minutes early is a wet napkin by service. Much of it now arrives hydroponic with the root ball attached, which keeps the head alive in the walk-in and is worth the extra money. Dress it at the pass with a light vinaigrette rather than a thick creamy one, and use the whole cupped leaves as vessels instead of tearing them up.",
		season: [5, 6, 9, 10],
		choose: "A head that feels alive: leaves springy, heart pale yellow-green, no transparent patches. Reject bruises gone glassy, slime at the core, and cut-root heads whose base has browned.",
		store: "Refrigerate in its clamshell or a loose bag at 2 to 4 C (36 to 39 F), 4 to 6 days; root-ball heads stand in 1 cm of water and keep a week. Never stack anything on top of it.",
		prep: "Cut the core out and let the rosette fall apart rather than tearing through it. Swish whole leaves in cold water, drain them on a towel instead of spinning hard, and keep them cupped and unbroken. Rinsing is for grit, not for safety: this leaf is eaten raw with no cooking step, and no wash clears bacteria from torn or slimy tissue, so pull and discard any damaged leaf, keep the standing water on a root-ball head below the leaf line and off the growing plug, and work cold and fast.",
		methods: ["raw", "wilt", "steam", "braise", "puree"]
	},
	{
		t: "Butternut Squash",
		c: "The Vegetable Atlas",
		d: "A mature winter squash, cut when the rind hardens and the stem corks, then CURED warm for a week or two: curing heals the skin and lets amylases keep converting starch to sugar, which is why a cured butternut tastes sweeter than one eaten green. Its shape is the argument for it. A long solid neck of seedless flesh sits above a small bulb holding every seed, so it peels and dices with almost no waste and gives you uniform cubes. Dry matter runs around 12 to 14 percent, low for a winter squash next to kabocha at 20 plus, so the flesh is smooth and moist rather than floury: it purees to silk, but it will not hold a crisp edge on a cube. Roast at 220C (425F) on a preheated sheet in a single layer and leave it alone until the undersides are deep brown, Maillard and caramel together. That brown is the whole difference between a side dish and a good one.",
		season: [9, 10, 11, 12, 1],
		choose: "Heavy for its size, rind matte hard tan that a thumbnail cannot dent, stem dry and corked and still attached. Reject glossy green-tinged rind, which means uncured, any soft patch, or a stem that has fallen out.",
		store: "Whole in a cool dry room at 10 to 15C (50 to 59F), a month or more; the refrigerator is too cold and too damp and shortens it. Cut pieces, wrapped, in the refrigerator for 4 days.",
		prep: "Y-peeler, and take the pale fibrous layer under the skin as well. Cut the neck off the bulb first, then stand each piece on a flat face: a rolling squash is how people cut themselves. Scoop the seeds. If the raw flesh tastes bitter, bin the whole squash, since roasting will not destroy cucurbitacin.",
		methods: ["roast", "bake", "braise", "steam", "saute", "fry"]
	},
	{
		t: "Cardoon",
		c: "The Vegetable Atlas",
		d: "The artichoke's wild parent domesticated a second way, for the stalk instead of the bud: both are forms of Cynara cardunculus, so these ribbed stems look like enormous silver celery and taste like artichoke heart with a bitter edge. That bitterness is cynaropicrin and its fellow sesquiterpene lactones, and the traditional answer is blanching the plant in the field, banking soil or wrapping paper around the stalks for weeks so light cannot reach them and the compounds stay low. Everything about it is work. The outer ribs carry hard strings, and the cut surfaces rust within a minute through polyphenol oxidase. Most cardoon is boiled first, 20 to 40 minutes in acidulated water, before it goes anywhere else: gratinated under bechamel and parmesan in Lombardy, or fried in batter. Piedmont is the exception, where the pale blanched gobbo of Nizza Monferrato goes to the table raw, in ribs, for dipping in bagna cauda. Budget an hour before it becomes an ingredient.",
		season: [11, 12, 1, 2],
		choose: "Firm, heavy stalks, pale ivory to light green from field blanching, with tight ribs and no flowering stem; the smaller inner ribs are the tender ones. Deep green stalks were never blanched and stay bitter and stringy. Reject limp, hollow, heavily browned, or spongy stalks.",
		store: "Wrap in a damp cloth and refrigerate up to a week; age brings limpness and more bitterness. Once boiled, hold the pieces submerged in their own cooking liquid, refrigerated, up to three days.",
		prep: "Strip the strings with a peeler as you would celery, cut into 8cm lengths straight into lemon water, then boil in acidulated water until a knife slides through. Work fast: exposed surfaces rust in a minute.",
		methods: ["boiling", "braising", "frying", "baking", "stewing"]
	},
	{
		t: "Carrot",
		c: "The Vegetable Atlas",
		d: "A taproot that stores its energy as sucrose, not starch, alongside beta-carotene, a fat-soluble orange pigment locked inside chromoplasts. Cooking bursts those cell walls and fat then carries the freed pigment, which is why carrot in butter delivers more vitamin A than raw carrot. Cold sweetens it: near 0C (32F) respiration slows while sugars keep accumulating, a kind of antifreeze, so late-autumn and overwintered roots are the sweet ones. Roasting drives off water and pushes those sugars to caramelize while the cell-wall pectin softens. The bitterness is two compounds: polyacetylenes such as falcarindiol in the peel, and 6-methoxymellein, which stored roots build when ethylene reaches them. Cook small carrots whole; cut big ones on a steep bias to widen the cut face for browning.",
		season: [9, 10, 11],
		choose: "Firm enough to resist bending, with a smooth shoulder and no green crown, which shades bitter. Fine hairs and deep cracks mean age. Reject limp rubbery roots and any showing a woody pale core at the cut end.",
		store: "Tops draw moisture out of the root, so twist them off at once. Refrigerate whole unwashed roots in a sealed bag at 0-4C (32-39F) for three to four weeks. Submerge only cut or peeled carrots, a few days at most, changing the water. Ethylene from apples and pears turns them bitter; keep them apart.",
		prep: "Scrub rather than peel young roots; the flavor sits near the skin. Peel old ones and cut out any woody core. Slice on a bias for surface area, and hold cut carrots in cold water so the faces do not dry chalky white.",
		methods: ["roast", "braise", "glaze", "saute", "steam", "raw", "pickle"]
	},
	{
		t: "Cassava",
		c: "The Vegetable Atlas",
		d: "Manihot esculenta, also yuca or manioc, the starch staple for some 800 million people and the one root in this chapter that can kill someone if it is handled carelessly. The whole plant carries CYANOGENIC GLYCOSIDES, chiefly linamarin: damage the tissue and the plant's own linamarase splits it to acetone cyanohydrin, which gives up hydrogen cyanide as it warms, or later in the gut if drying was rushed. Sweet varieties hold most of it in the peel and only a modest amount in the flesh; bitter varieties, grown for yield and pest resistance, carry dangerous quantities throughout and demand grating, prolonged soaking, pressing, and fermenting or roasting before they are food. One badly processed meal can poison outright; short-cut processing on a low-protein diet brings konzo, a sudden and permanent spastic paralysis of the legs. Peel it thickly, pull out the woody core, and boil it in plenty of water until it splits and falls tender. Never raw, never underdone.",
		season: [],
		choose: "Waxed roots with unbroken skin and snapped ends showing pure white flesh; have one cut open if the shop allows. Reject gray or black streaking, blue-black specks, a dark ring under the peel, or any sour smell.",
		store: "Roots decline within two to three days of harvest, faster than anything else here. Refrigerate whole waxed roots up to a week, or peel, cut, and keep them frozen for months. Discard any flesh that has discolored.",
		prep: "Cut into lengths, score the skin, and lever off both the brown bark and the pink layer beneath, which hold most of the toxin. Split each piece and pull the woody central fiber out. Hold in water, then boil in an open pot.",
		methods: ["boil", "deep-fry", "braise", "stew", "simmer"]
	},
	{
		t: "Cauliflower",
		c: "The Vegetable Atlas",
		d: "The curd is an arrested inflorescence: flower stems that thickened and multiplied instead of blooming, packed into a dome. It is white because the curd is undifferentiated meristem that builds no chloroplasts; leaves tied over it, or folded by a self-blanching cultivar, only keep sun from yellowing or greening the surface. With no chlorophyll to gray out, browning reads clean, and its free sugars and amino acids take Maillard well at 220C (425F) in dry heat. Boiled it turns waterlogged and sulfurous. Its blandness is structural too, which is why it carries curry, brown butter, anchovy, and cheese without arguing back. Purple types bleed anthocyanin into the water and go blue-gray without acid; orange types hold their carotene, which is fat soluble and does not leach. Cut steaks through the core so they hold, and roast them cut side down first.",
		season: [9, 10, 11, 12, 1],
		choose: "A creamy-white curd so tight it looks poured, heavy for its size, with fresh green leaves still clinging. Reject brown speckling, a fuzzy separating grain, or any sour smell at the core.",
		store: "Whole, unwashed, stem up in the crisper, 1 to 2 weeks, so condensation drains off the curd instead of pooling on it and starting the brown spotting. Cut florets brown at the face within days.",
		prep: "Pull the leaves, then cut around the core from underneath and the florets fall away whole. Shave brown spots off with a paring knife. Ricing in a processor is 3 pulses, not 10, or you get paste.",
		methods: ["roast", "fry", "steam", "puree", "grill", "pickle"]
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
	},
	{
		t: "Celery",
		c: "The Vegetable Atlas",
		d: "Ribbed petioles: leaf stalks the plant built as plumbing. The strings you pull off are collenchyma, cords of thickened cellulose and pectin just under the skin, not lignin, which is why they hold together through a four-hour braise without ever turning woody. The flavor is phthalides, sedanolide and its relatives, the same family that makes celery seed and lovage smell of celery, over a faintly saline base. Celery is also a declared allergen in Europe and a real cause of anaphylaxis, and cooking does not destroy it, so a mirepoix, a trinity or a stock carries it invisibly. Say so when asked. Dark outer ribs are tough and belong in stock; the pale heart is tender and sweet and belongs in a salad. Cut across the rib for crescents that fall apart, along it for batons that hold. Keep the leaves: they are the most aromatic part of the plant.",
		season: [],
		choose: "Firm ribs that break with an audible crack, glossy, tight at the base, with green, upright leaves. Reject rubbery bunches, brown streaking, spongy pith, and a center rib that has gone hollow.",
		store: "Whole head wrapped in foil or a damp cloth in the crisper, two to three weeks; ribs go limp from water loss, not trapped gas, and celery yellows fast next to ripening fruit. Limp ribs come back after an hour in ice water.",
		prep: "For raw service, snap the top of a rib and pull downward to strip the strings. Trim the base, wash down inside the curve where grit collects, and keep the leaves for stock or salad. Throw out ribs with pink or brown rot lesions: those run high in furanocoumarins, and juice on skin plus sunlight raises blisters a day or two later. Wash hands and forearms after a long prep.",
		methods: ["braising", "stewing", "sauteing", "roasting", "grilling", "raw"]
	},
	{
		t: "Chayote",
		c: "The Vegetable Atlas",
		d: "A pale green pear-shaped gourd holding one flat soft seed, eaten immature like a summer squash but built far more firmly: the flesh is crisp, dense, barely sweet, closer to raw kohlrabi than to zucchini, and it holds shape through long cooking where zucchini would slump. Cut in 2 cm pieces it turns tender in 12 to 15 minutes of simmering and holds there another 20, so it survives stews, stuffed halves, and soup. It tastes of almost nothing, so season it hard and finish with acid, or slice it thin raw, where it stays crunchy in a slaw overnight. The cut surface weeps a sticky sap that dries to a tight film on the hands and can irritate skin, so peel under running water or in gloves. Peel it, too: the skin toughens as the fruit grows, though a small smooth one can keep it.",
		season: [],
		choose: "Hard, unwrinkled, pale to medium green, with no sprout pushing out of the furrowed end. Reject soft, wrinkled, or yellowing fruit and any with brown bruises, which rot from the inside and go slimy.",
		store: "Refrigerator crisper, unwrapped, 2 to 3 weeks, far longer than any summer squash. Left at room temperature it sprouts from the seed end within a week and the flesh turns spongy and dry as the shoot feeds.",
		prep: "Peel under running water or wearing gloves, since the sap stiffens skin. Halve and lift out the flat seed, which is edible and nutty, so cook it. It barely discolors, so no acidulated water is needed.",
		methods: ["braise", "steam", "saute", "boil", "raw", "bake"]
	},
	{
		t: "Cherry Tomato",
		c: "The Vegetable Atlas",
		d: "Cherry types are bred sweet, close to their wild ancestors, and hold less water per fruit, so sugar runs 8 to 10 Brix against a beefsteak's 4 to 5. The skin-to-flesh ratio is high and the cuticle is tough, so a cherry survives heat that would turn a slicer to slush, holds in a hot pan a minute or two, then bursts and gives up jelly that is sugar, acid and glutamate at once: sauce with no reduction. SUNGOLD is orange and reads sweet on sugar, not on low acid; red cocktail types keep more bite. They split on the vine after rain because the roots take up water faster than the skin can stretch. Fruit left wet in a punnet does not split, it moulds. Blister them in a barely oiled pan until the skins char and slip, then crush with a spoon; dry them first and keep a lid to hand, because whole fruit bursts and throws boiling juice.",
		season: [7, 8, 9, 10],
		choose: "Still on the truss where you can get it, with a green, resinous calyx and glossy unsplit skins; the truss is the freshness clock. Reject a punnet with juice pooled in the corner or fruit carrying a healed crack. Picking your own, know that potato plants set small green berries that look like unripe cherry tomatoes and are high in solanine: never take fruit off potato foliage.",
		store: "Counter in a single layer, in the punnet with the lid off, three to five days; cold flattens their aroma exactly as it does a large tomato. Sort daily: one soft fruit takes the punnet with it inside a day.",
		prep: "Leave them whole for roasting so they steam in their own skins and burst late. To halve a handful fast, trap them between two flat lids, press the top one down with a flat palm and fingers well clear of the rim, and draw a long serrated knife through the gap in one level pass. The blade travels under your hand, so never saw.",
		methods: ["raw", "roasting", "pan-frying", "grilling", "pickling"]
	},
	{
		t: "Cipollini Onion",
		c: "The Vegetable Atlas",
		d: "A flat disc of an Italian onion, 25 to 60 mm across, and the shape is the point: the distance from skin to center is tiny, so it cooks through in the time the outside takes to brown. Sugar runs higher than a yellow onion and the flesh is dense, which is why cipollini is the onion that glazes rather than dissolves. Leave the root plate intact and the layers stay welded into one piece through 40 minutes in a pot roast; caramelize them in butter with vinegar and honey and you have AGRODOLCE, the sweet-sour treatment that suits their sugar. The skin is thinner and clings harder than a storage onion, which is the one annoyance, since peeling raw tears the flesh open. Boil 60 seconds, shock in ice, and the skins slip off in a squeeze. Buy them graded to one size or half the pan burns.",
		season: [9, 10, 11],
		choose: "Flat, dense and firm, 25 to 60 mm across, skin dry and still attached, root plate dry. Insist on one size per bag so they cook evenly. Reject sprouted necks, mold at the root, and any that feel light or hollow.",
		store: "Cool, dark and airy in a single layer, six to eight weeks: better than a sweet onion, worse than a yellow. Anything damper than a cellar and the thin skins mold at the root plate first, so pick through the box weekly.",
		prep: "Never peel them raw. Blanch, shock, trim the stem, then pinch and the skin slides. Shave the root plate flat but do not cut it off, or the onion falls apart into loose rings the moment it hits the pan.",
		methods: ["braising", "glazing", "roasting", "grilling", "caramelizing", "pickling"]
	},
	{
		t: "Collard Greens",
		c: "The Vegetable Atlas",
		d: "The same species as cabbage that never learned to make a head: broad flat paddle leaves on long stems, the most heat-tolerant and the toughest of the family. Toughness is the point. Those cell walls and thick midribs survive the hour-long simmer with pork, onion, and vinegar that defines them in the American South, and the cooking liquid, potlikker, holds the water-soluble vitamins and the sweetness pulled out of the leaf, which is why it gets served rather than poured away. Put the acid in at the end and not the start: vinegar early slows the cell walls from softening and the leaves stay stubborn. Blanched whole, they are also the family's best wrapper, flexible enough not to crack. Simmer until the leaf is fully limp and dark, then finish with vinegar off the heat.",
		season: [10, 11, 12, 1, 2],
		choose: "Deep green unblemished leaves with no yellowing, on stems that snap rather than bend. Smaller leaves are more tender. Reject dry brittle edges, heavy insect holes, or any leaf gone limp.",
		store: "Unwashed in a perforated bag in the crisper, 5 to 7 days. Grit hides at the base of the midrib, so wash at service in a full sink of water, lifting the leaves up out of the sand.",
		prep: "Wash whole first, lifting the leaves clear of the sand. Fold each along the rib, cut the rib out, stack, roll, and cut across into ribbons. Save the ribs and start them 10 minutes early.",
		methods: ["braise", "simmer", "saute", "steam", "blanch"]
	},
	{
		t: "Cucumber",
		c: "The Vegetable Atlas",
		d: "Botanically a pepo, a gourd family berry: Cucumis sativus, kin to melon, not a Cucurbita squash. Harvested immature at about 95 percent water, level with iceberg lettuce, which is why it eats cold and crisp and resists cooking. Crispness here is turgor pressure, water pushing against intact cell walls, and salt destroys it. That single mechanism explains both salting slices on purpose, to pull water out so they season and bend, and the disaster of dressing a cucumber salad an hour early. Types matter more than most cooks allow. SLICING cucumbers are thick-skinned, often waxed for shipping, with developed seeds. ENGLISH or hothouse are long, thin-skinned, nearly seedless, sold shrink-wrapped. KIRBY are short, bumpy, and firm-fleshed, the pickling standard because they stay crunchy in brine. Bitterness at the stem end is cucurbitacin, which neither cooking nor brining removes: cut 2 cm off, taste it, and if the bitter is strong the whole fruit goes in the bin.",
		season: [6, 7, 8, 9],
		choose: "Firm end to end with no give at the stem, skin deep green and unwrinkled. Reject soft yellowing patches, a shriveled tip, or heavy wax you cannot scrub off if you intend to eat the peel.",
		store: "Hold at 10 to 12C (50 to 54F) if you can; below 10C (50F) they pit and go water-soaked in about three days. Otherwise the crisper, loose, and use them inside 5 days, before the cold marks them. Keep them away from apples and tomatoes, whose ethylene yellows them.",
		prep: "Peel waxed cucumbers, leave thin skins alone. Seed the watery ones by halving and running a spoon down the cavity. Salt slices 20 minutes and drain for salads; for crunch, slice at the last minute.",
		methods: ["raw", "pickle", "braise", "saute", "grill"]
	},
	{
		t: "Curly Kale",
		c: "The Vegetable Atlas",
		d: "The frilled, waxy-leaved kale that never forms a head, Brassica oleracea Acephala group: a loose rosette with a thick fibrous midrib and a cuticle heavy enough that dressing slides straight off it. Frost is what makes it worth eating; the plant piles up soluble sugars as antifreeze, so kale cut after a hard freeze is measurably sweeter than the same plant in September. Raw, the fix is mechanical: strip the ribs, shred fine, then massage with salt and oil for a full minute. Nothing ruptures. Salt pulls the water out, the cells go slack, and air leaves the spaces inside the leaf, which is what darkens it. Cooked, it takes a fast saute with garlic or a long braise. For chips, dry leaves matter more than heat: wet kale steams and turns leathery. Bake at 150C (300F) until crisp but still green.",
		season: [10, 11, 12, 1, 2],
		choose: "Small to medium leaves, deeply frilled, dark blue-green, and stiff enough to stand up on their own. Reject huge coarse leaves with thick ribs, any yellowing, or wilted edges that will not revive in cold water.",
		store: "Unwashed in a perforated bag with a dry towel, 5 to 7 days. Water left on the leaves turns them black and slimy. It does not sweeten in the fridge; a cut leaf respires its sugars away, so hold it no longer than you must.",
		prep: "Hold the rib at the base and strip the leaf off with the other hand, or fold the leaf and cut the rib out. The ribs are not waste: slice them thin and start them a few minutes ahead of the leaf.",
		methods: ["saute", "braise", "bake", "steam", "stir-fry", "blanch"]
	},
	{
		t: "Daikon",
		c: "The Vegetable Atlas",
		d: "The big white Japanese radish, mild because it carries the same glucosinolates as its small cousins at far lower concentration, and unevenly: the shoulder end is sweet and good raw, the tail end is the hot end and belongs in the pot. It is about 95 percent water with almost no starch, which makes it the sponge of the root world; simmer it in dashi and it takes on the whole flavor of the pot while going translucent and yielding. Grating ruptures the cells and turns myrosinase loose, so the heat peaks inside a minute and is mostly gone in twenty, which is exactly why oroshi is grated to order and set beside fried and fatty food. Simmer thick rounds slowly, never at a rolling boil, until a skewer passes through with no resistance.",
		season: [10, 11, 12, 1, 2],
		choose: "Heavy, glossy, and firm end to end, skin unbroken, with no flex when you hold it at both ends. Fresh green tops are a bonus and good pickled. Reject limp roots, black spotting at the cut face, and any with a woody flower stalk.",
		store: "Cut the tops off first, since the leaves pull water out of the root, then wrap the root in damp paper inside a bag and refrigerate for two weeks. A cut face hardens and dries, so wrap it tight and use it within four days.",
		prep: "Peel the thick outer layer, which is fibrous. For simmering, cut rounds 3 cm (1 in) thick, bevel the edges so they do not fray, and score a shallow cross on one face to draw the liquid into the center.",
		methods: ["simmer", "braise", "pickle", "raw", "stir-fry", "steam"]
	},
	{
		t: "Dandelion Greens",
		c: "The Vegetable Atlas",
		d: "Taraxacum, the true dandelion, bitter from SESQUITERPENE LACTONES, mainly taraxinic acid glycosides, carried in the milky latex of the rib and root. Bitterness here is a calendar: leaves cut before the plant flowers are sharp but good eating, and once the flower stalk rises the leaf turns harsh and leathery. Most restaurant dandelion is not Taraxacum but Italian dandelion, a chicory whose bitters are lactucin and lactucopicrin; both cook the same way. The standard treatments work, but not for the reasons usually given. A blanch in a big pot leaches the water-soluble glycosides into the water, which you discard; the salt in that pot is seasoning, not extraction. Salt on the plate does suppress bitter perception directly, and so does a pinch of sugar. Fat coats and slows release. Acid suppresses nothing; it only gives the palate somewhere else to go. Blanch, refresh, squeeze dry, then saute hard with garlic and chili.",
		season: [3, 4, 5, 9, 10],
		choose: "Young leaves under 25 cm, tender and dark, stems snapping wetly, no flower buds hidden in the crown. Reject yellowing leathery outer leaves and thick woody midribs. If it is foraged, confirm the plant: hairless leaves, milky latex, all leaves basal, a single head on one hollow unbranched stalk. Ragwort and groundsel rosettes grow in the same ground, have leafy branched stems and no latex, and carry liver-damaging alkaloids. Take nothing from lawns or verges; dandelion is what broadleaf weedkiller is aimed at.",
		store: "Refrigerate unwashed in a bag at 0 to 2 C (32 to 36 F), 3 to 5 days. Bitterness climbs with storage time and warmth, so keep it cold and use it early.",
		prep: "Wash in several changes of water, checking the crown for soil. Trim the crown but keep the bunch together for blanching. Thick ribs cook slower than leaf: split them, or start them 2 minutes ahead.",
		methods: ["blanch", "saute", "braise", "grill", "simmer", "raw"]
	},
	{
		t: "Delicata Squash",
		c: "The Vegetable Atlas",
		d: "A small oblong winter squash (Cucurbita pepo), cream rind striped dark green, and an exception to nearly every winter squash rule. Its skin never sets hard, which is why you never bother peeling it, and why it bruises: a delicata keeps 1 to 3 months against a butternut's six, and rot starts at a knock or a soft end rather than through the flesh. The flesh is thin-walled, fine-grained and genuinely sweet, tasting closer to sweet potato than to pumpkin, and there is not much of it, so the cook's job is to maximize surface. Cut it crosswise into rings, push the seed core out of each ring with a thumb, and roast at 220C (425F) in a single layer until both faces are brown and the scalloped edges have gone crisp and chewy. It wants nothing beyond oil and salt. Handle it like fruit, not like a keeper you can stack.",
		season: [9, 10, 11],
		choose: "Firm and matte, deep green stripes over a cream ground, 15 to 20 cm (6 to 8 in), heavy for its size. Reject soft ends, mushy brown spots, or a rind gone uniformly orange-yellow. Do not cook squash out of a decorative bin: striped ornamental gourds are the same species and hold enough cucurbitacin to cause violent vomiting and diarrhea. Bitter means bin it.",
		store: "A cool dry room at 10 to 13C (50 to 55F), 1 to 2 months; check weekly and cook the knocked ones first. Refrigerate only after cutting, wrapped, for 3 days. A warm kitchen cuts that to a couple of weeks, since the soft rind gives fungi an easy way in.",
		prep: "Do not peel. Scrub, trim both ends, cut crosswise into 1 cm (half inch) rings, and pop the seed core out of each one. Oil and salt the rings in a bowl before they hit the sheet, never after.",
		methods: ["roast", "bake", "saute", "grill", "steam"]
	},
	{
		t: "Edamame",
		c: "The Vegetable Atlas",
		d: "Immature soybeans (Glycine max) picked green at about 80 percent of full seed size, before the seed's sucrose is drawn down into raffinose and stachyose and the seed dries. That timing is the whole flavor: sucrose and free glutamate are at their peak, so edamame tastes sweet and faintly nutty where a mature soybean tastes only of bean. Lipoxygenase is in there all the same and throws the beany note the moment cut tissue meets air and water, which is why cooking is prompt and whole: four to six minutes in heavily salted boiling water, or steamed. Never eaten raw, since cooking is what knocks down the trypsin inhibitors and lectins, and this is soy, one of the common allergens. Salt the outside of the pod after cooking, since the fuzz is not eaten and that is what the mouth touches. Nearly all the world's supply is blanched and frozen in the pod within hours of picking, which is why it keeps its color; cook those straight from frozen.",
		season: [7, 8, 9],
		choose: "Fresh: bright green, plump, fuzzy pods, ideally still on the stem, with two or three beans each. Frozen: loose pods with no ice crystals or clumping. Reject yellowing pods and any with flat, empty sections.",
		store: "Fresh pods shed sugar within a day, so refrigerate and cook them the same day. Frozen pods keep six months at minus 18C (0F). Once cooked, refrigerate and eat within two days, hot or cold.",
		prep: "Nothing to peel. Rub the pods with coarse salt to scour the fuzz and season the shell, then boil in salted water and drain. Shock in ice water only if they are going out cold, or they turn drab.",
		methods: ["boiling", "steaming", "blanching", "stir-frying", "roasting"]
	},
	{
		t: "English Pea",
		c: "The Vegetable Atlas",
		d: "The shelling pea, grown for the seeds while the pod stays inedible: that wall carries a lignified parchment membrane, which is exactly what snow and snap peas were bred to lose. Inside, the seed is a storehouse caught mid-transition, and the clock is brutal. Within hours of picking, enzymes convert sucrose into starch and a sweet, grassy pea turns mealy and dull. This is the one vegetable where the frozen product honestly beats the fresh, because commercial peas are shelled and blanched within hours of the field and those enzymes are stopped cold. Buy fresh pods only when you know the picking day, and taste one raw before you commit the kitchen. Expect to lose about 60 percent of the weight to the pods. Cook them two to four minutes, never longer; finish with mint, butter, or cream, and simmer the empty pods into a sweet green stock.",
		season: [4, 5, 6],
		choose: "Smooth, glossy, squeaky pods that feel full but not tight, with seeds you can roll under a thumb. Reject swollen, dull, or yellowing pods, which hold big starchy peas, and any pod that rattles.",
		store: "Refrigerate unshelled in a bag and shell to order, within two days; once shelled they lose sweetness by the hour. A bag of good frozen peas is the more reliable item to keep on hand.",
		prep: "Press the seam with a thumb to pop the pod open and run a finger down to release the peas. Sort out the large pale starchy ones for soup and keep the small bright ones for finishing a dish.",
		methods: ["blanching", "steaming", "braising", "sauteing", "stewing"]
	},
	{
		t: "Escarole",
		c: "The Vegetable Atlas",
		d: "Broad-leaf endive: the same species as frisee with none of the frizz, a loose head shading from a tough dark green jacket to a pale tender heart. It is CICHORIUM ENDIVIA, an endive rather than a true chicory, and the mildest of the group: bitter enough to be interesting, sturdy enough to hold its shape in liquid, the green of beans and greens, of Italian wedding soup, and of long garlicky braises where spinach would dissolve. The bitterness sits in SESQUITERPENE LACTONES, which are water soluble, so blanching and pouring the water off is what removes it; fat and salt only bury the signal, which is why olive oil, anchovy and cured pork read as sweetness. Treat one head as two ingredients, heart raw and jacket cooked. Cut crosswise into wide ribbons, wilt into hot oil with garlic, add stock, 10 to 15 minutes.",
		season: [9, 10, 11, 12],
		choose: "A heavy head with a broad pale heart, leaves crisp and unwilted, butt cut white and moist. Reject rusty brown midribs, black slime in the crown, and a heart that has already greened up.",
		store: "Refrigerate whole and unwashed in a bag at 1 to 4 C (34 to 39 F), 5 to 7 days. Wash only at service: water trapped in the crown turns the base slimy inside a day.",
		prep: "Quarter through the core, then wash leaf by leaf, since escarole holds sand deep in the ribs. Trim the core, stack the leaves and cut crosswise into ribbons. Cut edges brown fast, so cut close to the pan.",
		methods: ["braise", "saute", "blanch", "simmer", "grill", "raw"]
	},
	{
		t: "Fava Bean",
		c: "The Vegetable Atlas",
		d: "The broad bean, an ancient legume eaten at every stage: whole young pod, shelled bean, peeled bean, and dried. SAFETY FIRST. The glycosides vicine and convicine trigger FAVISM, an acute breakdown of red blood cells, in people with inherited G6PD deficiency, most common in those with ancestry around the Mediterranean, Africa, the Middle East, and South and Southeast Asia. Cooking does not destroy them, so a braise is no safer than a raw bean. It is not an allergy, it is serious, and favas are also rich in L-DOPA and off limits to anyone taking an MAO inhibitor. Name the bean on the menu and never bury it in a puree. Each bean wears two coats: the pod, and a skin that turns gray-green, chewy, and bitter as the bean matures. Beans smaller than a thumbnail need neither peeling nor cooking; anything larger wants 30 seconds in boiling water, then a pinch to slip the skin. Reckon four to one on weight from pod to peeled bean. Dress them with olive oil, hard sheep cheese, and mint.",
		season: [4, 5, 6],
		choose: "Plump, green, firm pods with a velvet feel and beans that read as gentle bumps rather than hard knots. Reject yellowed, blackened, or rubbery pods; big lumps mean tough, floury beans and a lot of peeling.",
		store: "Refrigerate unshelled in a bag up to four days; once shelled they go starchy and dull within a day. Peeled beans hold two days refrigerated under a film of olive oil, which also keeps them green.",
		prep: "Split the pod along its seam and thumb the beans out of the padding. Blanch 30 seconds, cool in ice water, then nick the pale skin at the germ end and squeeze the bean out bright green.",
		methods: ["blanching", "braising", "sauteing", "grilling", "stewing", "raw"]
	},
	{
		t: "Fennel Bulb",
		c: "The Vegetable Atlas",
		d: "Not a root but a swollen cluster of overlapping leaf bases, which is why it layers like an onion and shreds like celery. The anise scent is anethole, the same molecule in star anise and pastis, held in oil ducts that rupture at the knife, so fennel is loudest the second you cut it and quieter every minute after. Heat is the switch. Raw it is crunchy, cold, and aggressively licorice; braised, the anethole steams away and the flesh turns mild and sweet with no browning at all, while dry roasting also browns surface sugars and amino acids into something nutty that people do not recognize as fennel. Florence fennel, finocchio, is the bulbing kind; wild herb fennel gives fronds, pollen, and seed but never a bulb. Buy wild fennel, do not gather it: poison hemlock carries the same feathery leaf and white umbel and is lethal, and it is told apart by smooth purple blotched stems and a rank smell, never anise. Use all of it: the bulb for the dish, the stalks for stock and as a grilling bed, the fronds as an herb, the pollen as a finishing spice. Shave it paper thin for salads, or cut fat wedges through the core so they hold while they brown.",
		season: [10, 11, 12, 1, 2, 3],
		choose: "Squat, white, tightly packed bulbs with no splitting between the layers and fronds still attached, which is the real freshness tell. Reject flattened, yellowing, or dried bulbs and any with a woody brown base.",
		store: "Refrigerate whole in the crisper up to a week, but cut the fronds off and bag them separately since they wilt within a day. Cut surfaces brown and lose aroma fast, so slice to order.",
		prep: "Trim the stalks, shave the dry base, halve through the root. Leave the core in for wedges that must hold their shape; cut it out for shaving on a mandoline into ice water, which curls and crisps the slices.",
		methods: ["roasting", "braising", "grilling", "sauteing", "steaming", "raw"]
	},
	{
		t: "Fresh Horseradish",
		c: "The Vegetable Atlas",
		d: "A brassica root that is odorless until you break it. Intact cells keep the glucosinolate sinigrin and the enzyme myrosinase in separate compartments; grating ruptures both and they meet, generating ALLYL ISOTHIOCYANATE, a volatile that travels up the nose rather than across the tongue. That is the whole chemistry, and it runs on a clock: pungency peaks about three minutes after grating, then evaporates and degrades, losing its edge within the quarter hour. Acid halts the reaction and stabilizes what has already formed, so the timing of the vinegar decides the result: add it immediately for a mild sauce, wait three minutes for a fierce one. Heat destroys the enzyme outright, which is why cooked horseradish is merely earthy. Grate at the last minute, into vinegar, and never simmer it in a sauce.",
		season: [10, 11, 12, 1, 2, 3],
		choose: "A firm heavy root at least 4 cm (1.5 in) thick, with clean cut ends and pale cream flesh. Whole it smells of almost nothing, so scratch it: horseradish bites back within seconds. Buy it rather than dig it, since monkshood root looks much the same and a mouthful is lethal. Reject soft, shriveled, or greenish roots and any with hollow gray streaking inside.",
		store: "Wrap whole in damp paper in a bag and refrigerate two to three weeks, or bury it in damp sand somewhere cold for months. Grated and held in vinegar it keeps a month refrigerated before the heat fades to nothing.",
		prep: "Peel only the piece you are using. Grate somewhere ventilated, since the vapor stings the eyes harder than onion, on a fine microplane or in a processor with the lid on. A closed bowl concentrates it, so open that lid away from your face. Straight into vinegar with a pinch of salt.",
		methods: ["raw", "pickle", "infuse", "sauce"]
	},
	{
		t: "Frisee",
		c: "The Vegetable Atlas",
		d: "Curly endive, CICHORIUM ENDIVIA var. crispum, not the C. INTYBUS of Belgian endive and radicchio. Coarse green heads sold as chicory are the same species grown unblanched; frisee is blanched, its HEART pale and mild because the grower tied or covered the head to shut light out, halting chlorophyll and suppressing the SESQUITERPENE LACTONES, lactucin and lactucopicrin, that carry the bitterness. Only the blanched heart is salad; the green skirt braises, and pricing a head means pricing that pale center. Architecture matters as much as taste: those fine wiry leaves trap a warm dressing instead of shedding it and stay crisp under hot bacon fat long enough to be eaten, which is the logic of a lyonnaise salad. Buy for the heart, tear rather than chop, and give it fat, egg yolk, vinegar and salt: bitterness needs all four.",
		season: [9, 10, 11, 12],
		choose: "A broad head with a large creamy white to pale yellow heart and no green creeping toward the center. Reject dark heads with a tiny pale core, dry brown leaf tips, and sliminess at the base.",
		store: "Refrigerate whole and unwashed in a bag at 1 to 4 C (34 to 39 F), 5 to 7 days. Light greens the heart back up in storage and brings the bitterness with it, so keep it bagged and dark.",
		prep: "Halve the head, cut out the solid core, and tear the pale leaves into bite pieces, saving the dark skirt for braising. Wash and dry completely: warm dressing beads up and runs straight off a wet leaf.",
		methods: ["raw", "wilt", "braise", "saute", "grill"]
	},
	{
		t: "Gai Lan",
		c: "The Vegetable Atlas",
		d: "Chinese broccoli, Brassica oleracea var. alboglabra: thick pale stems, broad blue-green leaves, and a scatter of white flower buds, the reverse of broccoli's proportions and fair warning. The stem is the prize, sweet and snapping when cut young, with a clean bitterness milder than broccoli rabe's. The classic treatment is structural: a short hard boil in salted water drives air from the tissue so the green reads clear, and cooks the dense stem through before its own acid dulls the chlorophyll to olive. The oil is for gloss, the sugar for the bitterness. Drain and dress with oyster sauce. Stir-fried from raw, thick stems stay hard long after the leaves have gone. It is one parent of broccolini, which took its stem from this side. Split any stem thicker than a pencil.",
		season: [10, 11, 12, 1, 2],
		choose: "Slim firm stems, tight buds with only a few open white flowers, leaves unblemished and blue-green. Reject stems thicker than a finger, hollow or split cut ends, and mass flowering, which means fibrous and bitter.",
		store: "Perforated bag in the crisper, 4 to 5 days, unwashed and dry. Standing the cut ends in shallow water revives limp stems. Yellowing is ethylene, so keep it clear of apples and bananas; wet leaves rot.",
		prep: "Trim 1 cm from the ends, peel only the toughest bases with a knife, and split thick stems lengthwise so they cook in the same time as the leaves. Keep the spears whole for the plate.",
		methods: ["blanch", "stir-fry", "steam", "saute", "grill"]
	},
	{
		t: "Garlic",
		c: "The Vegetable Atlas",
		d: "The engine of the family and the clearest case of it: an intact clove keeps alliin and alliinase in separate compartments and smells of almost nothing. Break the cell walls and they meet, making allicin within seconds, a compound so unstable it immediately begins decomposing into the diallyl sulfides that read as cooked garlic. Cut size is your volume control. A whole clove simmered in a sauce is sweet and mild, sliced is assertive, crushed or pressed is maximal, because you have ruptured every cell. Heat destroys the enzyme, so garlic dropped straight into hot fat never develops its full pungency, while garlic crushed and left ten minutes on the board carries its character through the pan. It is also dense in sugar and low in water for its size, so it scorches bitter in seconds. Add it after the onions, off the fiercest heat.",
		season: [],
		choose: "Rock hard and heavy, skin unbroken, neck firm; a light head has dried hollow inside. Press each clove through the wrapper. Reject any give, black or blue-green mold dust between the cloves or base, and shoots at the top.",
		store: "Whole heads in open air, cool, dark and ventilated, up to three months; the refrigerator makes them sprout. Peeled cloves keep four days covered and chilled. Garlic in oil is a botulism risk raw or confited, since cooking in fat does not kill the spores: keep it chilled, use it in four days, or freeze it.",
		prep: "Crush with the flat of a blade to split the skin, then peel. The green germ is bitter only in old sprouting cloves: pull it then, ignore it otherwise. Slice across the clove, not along it, for even pieces that brown together.",
		methods: ["roasting", "confiting", "frying", "sweating", "braising", "pickling"]
	},
	{
		t: "Globe Artichoke",
		c: "The Vegetable Atlas",
		d: "An immature flower bud of a thistle, eaten before it can bloom: you want the fleshy bases of the bracts and the receptacle beneath them, and the hairy choke is the florets that never opened. It is the most chemically opinionated vegetable on the board. CYNARIN and chlorogenic acid occupy the sweet receptors on the tongue, and the next sip rinses them off and the receptors rebound, so water and wine taken straight after read strangely sweet and hollow. Only about two thirds of people get it, so pair for the table rather than for your own palate, and put acid on the plate. Cut surfaces blacken in under a minute through polyphenol oxidase, so lemon here is a tool, not a garnish. Size is variety and position on the plant, not maturity: the big crown bud, the mid-size side buds, and the tiny purple babies with no choke worth trimming. Big ones want steaming or braising; babies can be quartered and fried whole. Trim into acidulated water, and taste the wine before the plate, never after.",
		season: [3, 4, 5, 10, 11, 12, 1, 2],
		choose: "Heavy for their size, with squeaky, tightly closed bracts and a freshly cut stem. Reject spreading or leathery bracts, blackened cut ends, and any bud that feels light or rattles, which means it has dried out.",
		store: "Refrigerate in a bag with a damp towel up to five days, sprinkling the stems with water. Winter buds with frost-blistered bronze bracts keep just as well and are often the sweetest of the year.",
		prep: "Snap off outer bracts until pale ones appear, cut the top third away, peel the stem, which is heart, then scoop the choke out with a spoon. Rub every cut face with lemon and hold in acidulated water.",
		methods: ["steaming", "braising", "frying", "grilling", "roasting", "stewing"]
	},
	{
		t: "Globe Eggplant",
		c: "The Vegetable Atlas",
		d: "The flesh is a sponge: parenchyma cells around open air spaces that run a quarter to a third of its raw volume, which is why a raw cube drinks a whole pan of oil in seconds and why the cook who keeps adding more ends up with grease. Heat is the fix, not restraint. Once the cell walls pass about 70 C (160 F) they collapse, the foam shuts, and the vegetable stops absorbing and gives some oil back. So take the structure down first: salt the cut faces 30 minutes and blot, or steam or microwave the pieces, or oil the surface and roast hot rather than lowering raw flesh into a cold pan. Modern globe cultivars are bred low in the bitter glycoalkaloids, so salting is about oil and water, not bitterness. Then brown it properly: pale eggplant tastes of nothing.",
		season: [7, 8, 9],
		choose: "Heavy, taut and glossy, with a green prickly calyx that still looks alive; press the side and the dent should spring back. Reject dull wrinkled skin, a dried brown cap, or softness at the blossom end, which means brown seedy flesh.",
		store: "A cool pantry at 10 to 12 C (50 to 54 F) for two days is ideal. Refrigeration pits and browns the skin and turns the seeds dark, so if it must go in, use the door or the warmest shelf, loosely bagged, three days.",
		prep: "Cut with a sharp blade and keep moving: polyphenol oxidase browns the cut face within minutes, and salt or acidulated water holds it. Skin on for braising, where it keeps cubes intact; peel for a puree, where the skin turns it gray.",
		methods: ["roasting", "grilling", "broiling", "deep-frying", "braising", "charring"]
	},
	{
		t: "Golden Beet",
		c: "The Vegetable Atlas",
		d: "The same species as the red beet, but a cultivar that makes the yellow betaxanthin half of the betalain pair and almost none of the red betacyanin, so nothing it touches turns pink. It still bleeds, only in yellow: boiling water and a shared bowl will take the color. Milder, but not because of geosmin, which tracks the cultivar and not the root color and is not reliably lower in gold types. The yellow is heat labile and holds best between pH 4 and 6, browning to khaki in long or alkaline cooking, so squeeze lemon into the water and keep the roasting pan covered. Roast whole at 200C (400F) until a skewer slides through with no resistance, then peel them warm.",
		season: [6, 7, 8, 9, 10],
		choose: "Firm, no bigger than 8 cm (3 in), orange-tan skin, taproot fine and whole. Cracks are uneven water; a corky black crown is boron deficiency and runs deep. Reject soft roots and shriveled shoulders.",
		store: "Top them, leaving 2 cm (1 in) of stem, and refrigerate unwashed in a perforated bag for two to three weeks; they soften sooner than red beets. The greens go limp in three days and cook like chard.",
		prep: "Leaching is a water problem: boil whole, skin and stem on, then peel warm. Dry heat washes nothing out, so peel before roasting if you like. Raw, peel and slice thin, then dress at once with acid to slow browning.",
		methods: ["roast", "boil", "raw", "pickle", "braise", "grill"]
	},
	{
		t: "Green Bean",
		c: "The Vegetable Atlas",
		d: "The whole immature pod of Phaseolus vulgaris, seeds and all, picked before the beans inside swell and before the pod lays down its fibrous parchment layer. Modern varieties are stringless, so the old job of stripping the suture is largely gone, but the wall is still cellulose and pectin: it needs enough heat to soften that pectin and not one second more. Past that the cells rupture and their own acid swaps hydrogen for the magnesium held at the center of the chlorophyll, so bright green turns to olive pheophytin. That window is the entire technique. A large volume of heavily salted boiling water, three to six minutes, then out and into ice. The other honest route is the opposite: high dry heat until the pods blister, or the long Greek fasolakia braise, where you trade green for sweetness. Choose one. The middle, wet and lukewarm, is where beans go gray and squeaky. Never raw: the pod carries the dry bean's lectin at much lower levels, and a raw plateful is enough to make a guest sick.",
		season: [6, 7, 8, 9],
		choose: "Slim pods that break in half with a crisp snap and show no bulges from the seeds inside; the surface should be velvet, not shine. Reject limp, rust-spotted, or leathery pods and any with visible seed lumps.",
		store: "Refrigerate dry in a perforated bag up to five days, in the crisper drawer and never against the back wall; below 4C (40F) the skin pits and russets. Blanched and frozen, they hold their color for months.",
		prep: "Line the pods up and cut the stem ends in one pass; the thin tail is edible and looks better left on. Dry them before any hot pan, and drop blanched beans into ice water to lock the color.",
		methods: ["blanching", "boiling", "roasting", "sauteing", "braising", "stir-frying", "grilling"]
	},
	{
		t: "Green Cabbage",
		c: "The Vegetable Atlas",
		d: "The dense-headed workhorse of Brassica oleracea: tight waxy leaves wrapped around a conical core, built to sit in storage for months. Its glucosinolates are inert until a knife ruptures the cells and releases myrosinase, which converts them into the sharp isothiocyanates you taste as cabbage. Long heat is a different reaction: it splits S-methylcysteine sulfoxide into hydrogen sulfide and dimethyl disulfide, the smell of a school canteen, a timing failure and not a fault in the vegetable. So cook it fast and hard, shredded in a dry hot pan until the edges catch and brown, or slowly and wet with acid and fat, and nothing in the middle. Salt the shreds at 2 percent of their weight and the lactic bacteria already on the leaf make sauerkraut instead. Cut the core out; never cook it whole and hope.",
		season: [9, 10, 11, 12, 1],
		choose: "Heavy for its size, which means dense and still juicy: a light head has dried from the inside. Leaves squeak and resist the thumb. Reject a cut stem gone brown and split, or outer leaves pulling away from the head.",
		store: "Whole and unwashed in the crisper drawer, 4 to 6 weeks, wrapped in nothing. Once cut, the face oxidizes gray within days: press film onto it and use within a week. Warmth makes it sprout and soften.",
		prep: "Quarter through the core, then cut the wedge of core out of each quarter at an angle. Shred across the leaf for tenderness, along it for slaw that holds its crunch. Thick ribs cook slower: cut them out or slice them thin.",
		methods: ["braise", "saute", "ferment", "roast", "steam", "stir-fry"]
	},
	{
		t: "Green Garlic",
		c: "The Vegetable Atlas",
		d: "Garlic pulled in spring before the bulb divides, when the plant is still a white shaft with a leek-like green top. Alliin, which alliinase turns to allicin the instant you cut, is present but thin: the tissue is mostly water and the bulb has not begun to load it. Raw green garlic does bite, less than a clove, more than a scallion, sweet and grassy behind it. No papery wrapper and no cure, so it keeps like a fresh vegetable, not a pantry one. Use the whole plant: the white base like a shallot, the pale green shaft in ribbons, the dark leathery leaf into stock. Do not confuse it with garlic scapes, the coiled flower stalks snapped from hardneck garlic in June. Slice white and pale green thin, sweat in butter, and build a spring soup on it.",
		season: [3, 4, 5],
		choose: "Straight firm white shafts, bright unwilted tops, a clean cut at the root. The base should squeak when rubbed. Reject yellow or slimy leaves, a hollow woody stalk, and any sour smell at the cut end.",
		store: "Refrigerate upright in the crisper, roots in a damp cloth and leaves loose, a week or ten days. A loose bag keeps the leaves plump; a sealed one slimes the tips by day five. It cannot be cured or kept dry.",
		prep: "Cut the dark leaves off where the blade stops folding easily. Split the white lengthwise and rinse between the layers, since grit hides there as it does in a leek. Slice the tender green crosswise and use every bit of it.",
		methods: ["sweating", "grilling", "roasting", "braising", "blanching", "pickling"]
	},
	{
		t: "Green Tomato",
		c: "The Vegetable Atlas",
		d: "Not a variety: an unripe Solanum lycopersicum, picked before ethylene sets off the wall-loosening enzymes, pectate lyase and polygalacturonase, that unglue the pectin holding its cells together. That intact pectin is the whole point of it. A 1 cm (3/8 in) slice stays a slice in hot fat, in a pickle jar and in a long-cooked chutney where a ripe tomato would slump into liquid. Flavor runs on the same clock: malic and citric acid are at their peak, sugar and lycopene have not arrived, and the alkaloid tomatine gives the faint green bitterness that fat and salt are there to answer. Do not try to ripen your way out of it. Salt the slices, rest 15 minutes, blot, then dredge in cornmeal and fry hot so the crust sets before the flesh softens.",
		season: [8, 9, 10],
		choose: "Hard as an apple, evenly pale green, skin glossy, with no blush of pink or yellow at the blossom end; any color break means the enzymes are already running. Reject soft shoulders and glassy, water-soaked frost patches.",
		store: "A cool room at 12 to 15 C (55 to 59 F) for one to two weeks. Green is the stage cold hurts most: below about 10 C (50 F) fruit pits, water soaks and rots instead of ripening. Keep it from apples and bananas, which push it over.",
		prep: "Core, then cut thick: under 1 cm (3/8 in) they go limp in the pan. They brown slowly, so no acid bath is needed, but the cut faces weep a sticky pectin sap; wipe the blade between fruits or the dredge clumps.",
		methods: ["pan-frying", "deep-frying", "pickling", "braising", "roasting", "stewing"]
	},
	{
		t: "Hearts of Palm",
		c: "The Vegetable Atlas",
		d: "The growing core of a palm: the apical bud and the young leaf bases sheathing it, the only growing point the tree has, which is why taking one from a single-stemmed palm kills it. Sustainable production now leans on the peach palm, pejibaye, which suckers and regrows from the base, and on farmed acai palm. Texture is the whole point: dense, ivory, concentric rings, crisp as a water chestnut when fresh, with a flavor between artichoke heart and young corn. Almost all of it arrives jarred or canned, and the sourness is not the tin: it is citric acid added on purpose, since a low-acid vegetable must be acidified to can it safely. Rinsing takes the brine off the surface; the acid inside the tissue stays. Fresh hearts are sweeter and more tender, and brown within minutes of cutting. Slice into coins for salads, sear split pieces dry until they color, or shred the layers as a stand-in for crab.",
		season: [],
		choose: "Fresh: firm, heavy, cream-white cylinders with no browning at the cut. Jarred: whole pale spears over pre-cut coins every time. This is a low-acid vegetable held safe only by the acid added to it, so refuse a bulging or leaking lid and discard, without tasting, any jar that spurts on opening, smells off, or has gone cloudy.",
		store: "Fresh hearts keep about a week refrigerated and tightly wrapped. Move an opened can into glass or plastic, since cut tinplate taints the food; under its liquid it holds five days, drained about two.",
		prep: "Fresh: peel away the fibrous outer sheaths until you reach tender rings, then cut into lemon water, because the cut face browns. Jarred: rinse under cold water and pat bone dry, or it will steam instead of searing.",
		methods: ["searing", "grilling", "frying", "braising", "roasting", "raw"]
	},
	{
		t: "Iceberg Lettuce",
		c: "The Vegetable Atlas",
		d: "The CRISPHEAD, bred less for flavor than for structure: leaves wrapped so tightly they brace one another, which gives the head its shipping durability and its one real culinary virtue, cold shattering crunch at roughly 96 percent water. The crunch is turgor, not moisture alone: water held under pressure in the vacuoles against a stiff cell wall, so the cell bursts at the bite instead of folding. Cold holds that pressure and warmth loses it, which is why a limp head comes back after twenty minutes in ice water and why a cut one never does. Use it where a soft leaf would steam: under a wedge of blue cheese, inside a taco, on a burger, and against chili heat or smoke. It is also the lettuce that survives a hot dressing or thirty seconds in a wok. Keep it colder than any other lettuce, cut it only at service since cut edges brown within the hour, and pull the leaves whole for wrapping.",
		season: [6, 7, 8, 9],
		choose: "A head that squeaks and gives only slightly, heavy for its size, outer leaves intact and matte green. Reject rusty red-brown streaking along the ribs and any head that feels light or spongy at the crown.",
		store: "Refrigerate whole and unwashed at 0 to 2 C (32 to 36 F), 10 to 14 days; it outlasts every other lettuce here. Ethylene from apples and pears causes the rust spotting, so keep it away from fruit.",
		prep: "Core it by striking the butt on the board and twisting the core free, then run cold water into the cavity to open the leaves. Shred with a sharp knife at the last minute or tear for wedges; a blunt blade bruises the ribs.",
		methods: ["raw", "grill", "stir-fry", "sear", "braise"]
	},
	{
		t: "Japanese Eggplant",
		c: "The Vegetable Atlas",
		d: "The long, slender, thin-skinned type (NASU in Japan, with the Chinese varieties close kin): the same aerenchyma foam as a globe, but less of it per bite, a narrow seed core, fewer seeds, and skin tender enough to eat. That geometry is the entire difference. A 3 cm (1 1/4 in) baton cooks through before the outside can dry out, so it belongs to fast, hot, direct heat: grill, broiler, wok. It needs no salting: salting collapses the foam so a long fry cannot fill it, and on fast dry heat little oil is free and escaping steam keeps it out. Score the cut face in a diamond 3 mm (1/8 in) deep, cook it cut side down until it slumps and the flesh goes translucent cream, and only then brush on miso or soy, which burn.",
		season: [7, 8, 9],
		choose: "Slim and even, firm right to the tip, skin taut and mirror-glossy, cap green and moist. Judge gloss, not shade: Japanese types run purple-black, Chinese ones pale lavender. Reject any that bends under its own weight or scuffs brown at the tip.",
		store: "Cool and humid at 10 to 12 C (50 to 54 F) in a perforated bag, two days: dry air, not warmth, is what shrivels that thin skin. Below 10 C it pits and bronzes, so refrigerate only past two days, bagged, and take the pitting over a shriveled fruit.",
		prep: "Halve lengthwise or cut on a long bias for surface area; no peeling, no salting. The cut face browns fast, so cut it while the pan heats, not before. Cooking one whole over flame, prick the skin twice or it bursts.",
		methods: ["grilling", "broiling", "stir-frying", "steaming", "roasting", "pan-frying"]
	},
	{
		t: "Jicama",
		c: "The Vegetable Atlas",
		d: "The tuberous root of a Mexican legume, Pachyrhizus erosus, whose vine is poisonous: the seeds and foliage carry ROTENONE, an insecticide, so the root alone is food. That root is about 90 percent water over only a few percent starch, and the crunch is structural: cell walls that hold through the heat that breaks a potato's pectin down, so it is crisp raw and stubbornly crisp cooked, more water chestnut than potato. Sweetness is free sugar, sucrose with a little glucose and fructose. The inulin alongside is not sweet at all: it passes undigested and ferments in the gut, so a big raw plateful means gas for anyone sensitive. Cut surfaces brown slowly and want no acid, but they dry chalky, so keep them covered. Skin and the fibrous layer under it both have to go. Peel, cut into batons, and dress with lime, chili, and salt.",
		season: [10, 11, 12, 1, 2, 3],
		choose: "Medium, 500 g to 1 kg (1 to 2 lb), heavy, with dry unblemished tan skin and no weeping at the root scar. Big ones turn fibrous and starchy. Reject soft spots, cracks, mold, and any that feels light for its size.",
		store: "Whole and unwashed at 12-15C (55-60F) somewhere dry it keeps a month or more, which is its best trick. Below 10C it takes chilling damage and goes water-soaked, so the refrigerator shortens its life rather than lengthens it. Only cut pieces belong there, wrapped, up to five days.",
		prep: "Slice off top and bottom, then peel with a knife rather than a peeler: the skin and the tough fibrous layer under it both have to go, and a peeler leaves that layer behind. Cut planks, then matchsticks.",
		methods: ["raw", "stir-fry", "pickle", "braise", "deep-fry"]
	},
	{
		t: "Kabocha Squash",
		c: "The Vegetable Atlas",
		d: "Seiyo kabocha, Cucurbita maxima: squat, dark green streaked with pale gray, and the driest of the common ones at 20 to 28 percent dry matter against butternut's 13. That one number explains how it behaves. (Nihon kabocha, the moschata type, is as wet as butternut.) The flesh is dense, sweet, and faintly chestnut-like, and it cooks FLOURY rather than wet, so a simmered piece keeps its shape instead of dissolving into the broth, which is exactly what a Japanese nimono asks for. It makes a poor thin soup and a superb tempura. The skin is thin, fully edible once cooked, and holds a cut piece together, so leave it on for simmering and roasting and peel only when you want a smooth puree. Simmer in dashi, soy, mirin and sugar just until a skewer meets slight resistance, then stop: carried past that point kabocha crumbles all at once.",
		season: [9, 10, 11, 12],
		choose: "Heavy and rock hard, rind dull and deeply green, stem brown and well corked, which is the sign it was cured. Reject a shiny rind, any soft patch, or a squash that feels light, meaning watery and immature.",
		store: "Whole at 10 to 15C (50 to 59F) in the dark for 1 to 3 months, and it sweetens over the first few weeks. Cut pieces wrapped in the refrigerator, 4 days; the cut face molds well before the flesh spoils.",
		prep: "The rind is hard: set it on a damp towel, drive a heavy knife in beside the stem, and lever down. To soften a stubborn one, stab the rind right through in three or four places first, then give it two minutes in the microwave; sealed, it traps steam and can burst. Scrape out seeds and strings, and bevel cut edges for simmering.",
		methods: ["simmer", "roast", "steam", "fry", "bake", "braise"]
	},
	{
		t: "Kohlrabi",
		c: "The Vegetable Atlas",
		d: "Not a root: a stem that swelled into a sphere above the ground with leaves shooting off it like antennae, which is why it tastes like a broccoli stalk crossed with an apple and nothing like a turnip. Raw it is crisp, juicy, and faintly sweet with a mild mustard finish; cooked it turns silky and takes butter and cream well. Size decides everything about it. Under about 8 cm across, the flesh is tender the whole way through; above that the plant lays down lignin and a fibrous woody core that no cooking will fix. The skin is a separate problem, since a tough layer sits beneath it: a vegetable peeler will not reach, so take it off with a knife, twice around on a big one. Cut into matchsticks and salt 10 minutes for slaw, or roast in wedges until the edges caramelize.",
		season: [5, 6, 7, 8, 9, 10],
		choose: "Firm bulbs 5 to 8 cm across, heavy in the hand, with fresh upright leaves still attached. Reject anything wider than 8 cm, cracked skin, or soft give around the stem scar.",
		store: "Twist the leaves off, since they pull water out of the bulb, then hold the bulb in the crisper 2 to 3 weeks; it is a genuine keeper. Bag the leaves separately and cook them like kale within 3 days.",
		prep: "Top and tail it flat, stand it on the board, and cut the skin away in strips with a knife: two passes on a large one, until the surface looks glassy rather than fibrous. Cut faces oxidize slowly, so acid is optional.",
		methods: ["roast", "saute", "steam", "braise", "pickle", "fry"]
	},
	{
		t: "Lacinato Kale",
		c: "The Vegetable Atlas",
		d: "Cavolo nero, dinosaur kale, Tuscan kale: long strap leaves, near black-green, blistered and pebbled with no frill at all. It is the tender one, not the tough one. Thinner ribbed, sweeter and less peppery than curly kale, it is the kale worth eating raw in hair-thin ribbons, and the one that goes silky rather than intact in an hour of ribollita, where the bread gives the body. Curly kale is the sturdier leaf in a long pot. Raw by the bowl every day is another matter: myrosinase turns progoitrin into goitrin, which interferes with thyroid hormone synthesis, and the vitamin K1 is high enough that anyone on warfarin should keep the amount steady. Blanching deals with the first. Cut it in chiffonade across the leaf so nobody gets a whole strap on the fork.",
		season: [10, 11, 12, 1, 2],
		choose: "Narrow dark leaves with a pronounced pebbled texture and firm stems. Reject pale or yellowing leaves, floppy tips, and coarse woody stems, all of which mark an old plant cut too late.",
		store: "Perforated bag in the crisper with a dry towel, 7 to 10 days: a flat leaf traps less standing water than a curly frill, and standing water is what rots kale. Wash only at service, since wet leaves blacken along the ribs.",
		prep: "Strip the rib out of mature leaves, stack them, roll the stack, and cut across into ribbons. For raw salad cut finer than feels right and dress it 20 minutes ahead so the acid softens the leaf.",
		methods: ["braise", "saute", "simmer", "roast", "steam", "grill"]
	},
	{
		t: "Leek",
		c: "The Vegetable Atlas",
		d: "A leek is not a bulb but a cylinder of concentric leaf sheaths rolled tight, grown hilled up with soil so the lower shaft stays white and tender. That is exactly why every leek is full of grit: soil works down between the layers as the plant grows, and rinsing the outside does nothing at all. Sulfur runs lower than in an onion while fructans run high, so slow heat converts them to sugar and a leek sweated in butter turns silky and faintly sweet where an onion would still be sharp. The dark upper leaves are structural, fibrous with cellulose and lignin that no cooking softens: stock, not dinner. Sweat the white and pale green in butter with salt and a lid, twelve minutes, no color at all, and you have the base of vichyssoise, a tart, or a braise. Split it lengthwise and wash it open.",
		season: [10, 11, 12, 1, 2],
		choose: "Straight and firm with a long white shaft and stiff blue-green tops; the narrower the shaft, the more tender. Reject a bulging bulbous base and a hard woody core running up the center, both signs it began to flower.",
		store: "Refrigerate unwashed and loosely wrapped, up to two weeks: the shaft is closed sheaths with no cut surface, so it loses water slowly. Keep them away from butter, cream and eggs, which take on the smell. Once cut and washed, dry them well and use within two days.",
		prep: "Cut off the dark tops, trim the roots but keep the root plate, and split lengthwise to within 20 mm of it. Fan the layers under cold running water, root end to tip. Swish sliced rings in a deep bowl and lift them out; the sand stays behind.",
		methods: ["sweating", "braising", "poaching", "roasting", "grilling", "charring"]
	},
	{
		t: "Little Gem",
		c: "The Vegetable Atlas",
		d: "A dwarf cos: the sweetness and thin leaf of a butter lettuce carried on the upright ribbed frame of a romaine, which is why one head is one portion and why it halves cleanly. The tight head shades its interior, so those leaves stay pale for lack of chlorophyll and taste mild because they are young; shade does not make sugar. Bitterness is sesquiterpene lactone carried in the latex, which runs heaviest in the stem, so the core is the bitter part and the outer jacket the coarse one. Density is the advantage here: a halved gem holds together face down in a hot pan, the cut face browns while the core steams in its own moisture, and the ribs stay audible under the char. It is also sturdy enough to be dressed a few minutes ahead without wilting. Peel off two or three outer leaves, split lengthwise through the core so the leaves stay anchored, and treat it as a vegetable to be cooked, not only as salad.",
		season: [5, 6, 7, 9],
		choose: "Heads dense and heavy for their size, tight to the squeeze, butt cut clean and white. Reject light hollow heads, browning at the base, and any pack with slimy outer leaves pressed against the heart.",
		store: "Whole and unwashed in a bag at 1 to 4 C (34 to 39 F), 7 to 10 days. Halved or washed heads brown at the cut core within a day, so cut to order.",
		prep: "Strip the outer jacket, trim the butt but leave the core intact, then split or quarter lengthwise. Wash by fanning the cut halves under cold running water: soil sits two leaves deep at the base.",
		methods: ["raw", "grill", "sear", "braise", "roast"]
	},
	{
		t: "Lotus Root",
		c: "The Vegetable Atlas",
		d: "RENKON, the jointed rhizome of the lotus, hollow along its length with a ring of air channels that make the famous lacework cross-section and let the plant breathe down through the mud. Texture is the point, and not fixed: thin slices cooked fast stay crisp, while a long simmer gelatinizes its considerable starch and turns the flesh floury and soft, as Chinese soups want. Acid holds the crunch, suppressing the pectin breakdown that softens vegetables, so vinegar belongs in the soak and the pot. Cut faces brown fast from polyphenol oxidase and draw sticky mucilage threads, which the same soak fixes. Long boiling costs it its vitamin C. Always cook it: raw lotus can carry cysts of the fluke Fasciolopsis buski. Slice thin, soak ten minutes, then stir-fry hard or simmer in dashi.",
		season: [10, 11, 12, 1, 2],
		choose: "Unbroken heavy sections with the joints still sealed, skin creamy tan and free of soft or blackened patches. If it is sold cut, the channels should be clean and pale. Reject packed mud inside the holes or gray discoloration.",
		store: "Refrigerate whole unpeeled sections wrapped in damp paper for two weeks; once a joint is cut the open channels darken and spoil within three or four days. Peeled slices hold two days in acidulated water.",
		prep: "Cut the sealed joints away, peel the skin, and slice across the root to show the pattern. Drop the slices straight into water with a splash of vinegar for ten minutes to stop the browning and rinse off the sticky threads.",
		methods: ["stir-fry", "simmer", "deep-fry", "braise", "steam", "pickle"]
	},
	{
		t: "Mustard Greens",
		c: "The Vegetable Atlas",
		d: "Brassica juncea, the loudest member of the family: its glucosinolate is sinigrin, which myrosinase converts into allyl isothiocyanate, the same volatile compound that sends horseradish and wasabi up the nose. That reaction is the handle you hold it by. Raw, torn late into a salad, it is aggressive and peppery; heat kills the enzyme and drives off what it made, leaving something mild, green, and faintly sweet. So decide which vegetable you want before you light the burner. Southern cooking simmers it long with smoked pork, and Punjabi sarson ka saag does the same for hours before mashing it and topping it with ghee; Chinese kitchens go the other way, stir-frying it fast or salting gai choy into sour pickle. Cold sweetens it, heat makes it bolt and turn coarse. Cut it last if you want the bite.",
		season: [10, 11, 12, 1, 2, 3],
		choose: "Crisp bright leaves with no yellowing, on thin stems; smaller leaves are milder. Reject thick tough stems, visible flower buds or seed stalks, and wilted edges that signal a heat-stressed bitter plant.",
		store: "Unwashed in a perforated bag with a dry towel, 3 to 5 days; it wilts faster than kale. Wash at service in a sink of cold water, since sand collects where the leaf meets the stem.",
		prep: "Strip the leaves off any stem thicker than a pencil and slice those stems thin to start them first. Tear or chiffonade the leaf. The pungency builds after cutting and fades with heat, so time the knife.",
		methods: ["saute", "stir-fry", "braise", "simmer", "ferment", "steam"]
	},
	{
		t: "Napa Cabbage",
		c: "The Vegetable Atlas",
		d: "Not a cabbage of the oleracea line at all: Brassica rapa, kin to the turnip and bok choy, and mild because its glucosinolate load is a fraction of a true cabbage's. The head is a tall barrel of pale ribs and frilled green edges, roughly 95 percent water, with thin leaves that collapse to nothing in a hot pan and thick ribs that stay crunchy well past them. That split is the whole handling problem: separate rib from leaf and start the ribs first. Its real career is kimchi, where salt pulls water out by osmosis and leaves the leaf limp but still crisp, then selects for Leuconostoc mesenteroides to start the souring and lactobacilli to finish it. In soup and hot pot it behaves as a sponge, taking on broth and giving back sweetness. Salt shredded napa 20 minutes and squeeze it hard before it goes into a dumpling filling, or the wrappers will split.",
		season: [9, 10, 11, 12, 1],
		choose: "Firm and heavy, with tightly furled pale ribs and crisp green tips. Reject brown or slimy rib bases, a head that rattles loose in the hand, or leaves gone translucent at the edge.",
		store: "Upright in the crisper in perforated plastic, 2 to 3 weeks. Outer leaves wilt first and can simply be peeled away. Ethylene from apples and pears yellows the leaves and makes them drop off the head, so keep them apart.",
		prep: "Halve lengthwise through the root, cut the core wedge out, then cut ribs on a bias and leaves into wide ribbons, keeping the two piles separate. Wash inside the furled ribs, where the grit hides.",
		methods: ["stir-fry", "ferment", "braise", "steam", "simmer", "pickle"]
	},
	{
		t: "Nettles",
		c: "The Vegetable Atlas",
		d: "A wild green that defends itself: leaf and stem are covered in hollow silica TRICHOMES that snap on contact and inject histamine, acetylcholine and serotonin, with oxalic and tartaric acid to prolong the burn. The hairs keep working inside a delivery box for days, so wear gloves, move them with tongs, and never taste a raw leaf. Sixty seconds in boiling water, or a hard wilt in a covered pan, breaks and collapses the hairs so they cannot inject; the histamine itself is heat stable, which is why thorough drying disarms nettles just as well. After that the leaf is safe, deep green, and tastes like spinach crossed with cucumber and green tea. Pick only young tips before flowering: older leaves load gritty calcium carbonate cystoliths that irritate the urinary tract. Blanch the bag on arrival, squeeze dry, and treat it as spinach.",
		season: [3, 4, 5],
		choose: "Young tops only, the top four to six leaves of a stem, bright and unblemished, with no flower buds or seed strings in the leaf axils. Reject coarse tall stems, yellowing, and anything gathered from roadsides or sprayed ground.",
		store: "Keep in the bag it came in, gloves nearby, at 0 to 2 C (32 to 36 F), 2 to 3 days raw. Blanched and squeezed into balls it holds 4 days chilled and keeps for months in the freezer.",
		prep: "Gloves and tongs throughout. Dunk the bag in cold water and lift the tops out, leaving grit and aphids behind, then 60 seconds in boiling salted water, ice water, squeeze hard, chop. Strip leaves off tough stems only after blanching.",
		methods: ["blanch", "puree", "simmer", "saute", "braise", "steam"]
	},
	{
		t: "New Potato",
		c: "The Vegetable Atlas",
		d: "Not a variety but a stage: any potato lifted before its skin has set, while the plant is still growing. Two things follow. The skin has not yet built a corky periderm, so it rubs away under a thumb and the tuber has almost no barrier against moisture loss or rot, which makes new potatoes a week's vegetable rather than a season's. And the plant has not finished turning sugars into starch, so the flesh is low in solids and high in sugar: waxy, firm, sweet, and glassy instead of mealy. The cells stay bound to each other, so it holds its shape in a salad, in a braise, and under a smashing. Do not peel it. Boil from cold in well-salted water and dress it while hot, when it drinks the vinaigrette.",
		season: [5, 6, 7, 8],
		choose: "Skin that flakes away when you rub it with a thumb, which is the actual test. Small, uniform, firm, with damp soil still clinging. Reject set papery skin sold as new, soft or sprouting ends, and any green tinge: the green is only chlorophyll, but it marks bitter solanine beneath it, which boiling does not destroy and which sits in the very skin you are keeping.",
		store: "A week at most, refrigerated in paper inside a bag, or somewhere cool and dark. Cold sweetens them as it does any potato, but that only shows up in frying; boiled within the week it costs you nothing, and the unset skin rots fast in a warm kitchen. Buy them for the week you will use them.",
		prep: "Never peel; scrub gently under running water and accept that some skin comes away with the grit. Leave the small ones whole, halve the larger, and start them in cold salted water so the outsides do not blow apart first.",
		methods: ["boil", "steam", "roast", "smash", "braise", "grill", "saute"]
	},
	{
		t: "Okra",
		c: "The Vegetable Atlas",
		d: "The immature seed pod of a hibiscus relative (Abelmoschus esculentus), and the whole argument about it is MUCILAGE: an acidic pectic polysaccharide held in mucilage cells that rupture at the knife and hydrate into that famous slippery gel. The gel is a thickener, not a defect; it is the body in gumbo and in West African and South Indian stews, which is what the plant is for. When you do not want it, you have two controls. ACID: tomato, lemon, tamarind, or a vinegar soak does not cut the chains, it protonates their galacturonic acid units so they stop repelling each other, coil tight, and stop thickening. HIGH DRY HEAT: roast at 230C (450F), grill, or fry with the pods whole or halved; with no free water the mucilage cannot hydrate, so it concentrates and browns instead of stringing. Wet, crowded, medium heat is what produces slime. Size is the other lever: pods over 10cm build lignin in the ridges and turn woody. Small pods, hot pan, and do not stir for the first two minutes.",
		season: [7, 8, 9],
		choose: "Bright green pods under 10cm, firm and unblemished, that snap at the tip when you bend it. Reject limp, bruised, blackened, or oversized pods; if the tip bends instead of breaking, the pod is already woody.",
		store: "Keep dry in a paper bag, three days, in the warmest part of the refrigerator: below about 7C (45F) okra chills, pits, and blackens along the ridges within two days. Do not wash until you cook.",
		prep: "Wash and dry completely, then trim the cap only, leaving the pod sealed if you want less gel. Cut into coins when you want the gel in the pot; every cut face you make releases more of it.",
		methods: ["roasting", "grilling", "frying", "stewing", "pickling", "braising"]
	},
	{
		t: "Parsnip",
		c: "The Vegetable Atlas",
		d: "A carrot relative that trades carotene for starch and a resinous, almost clove-like aroma built from terpenes. It needs frost to be worth eating: at temperatures near 0C (32F) the root breaks stored starch down into sucrose and fructose to protect its cells, which is why a September parsnip tastes like raw potato and a December one tastes like candy. That sugar load browns hard and early, so parsnips scorch at heat that merely colors a carrot. The core lignifies with size into a fibrous column. Note the sap: parsnip leaves and skin carry furanocoumarins that raise a burning rash on skin later exposed to sunlight, so wear gloves when peeling a crate of them. Roast at 200C (400F) until the edges are mahogany and collapsing.",
		season: [11, 12, 1, 2, 3],
		choose: "Ivory to pale tan, firm, and no thicker than 5 cm (2 in) at the shoulder; big ones hide a woody core. Reject any that flexes, any with brown soft patches at the crown, and any furred with gray storage mold.",
		store: "Refrigerate unwashed in a perforated bag for two to four weeks; the damp stops them going rubbery, and cold near 0C (32F) goes on turning starch to sugar, so they improve in storage. Trim any greens off at once. Blanched, they freeze well; peeled ones hold a day in water, trading a little aroma for it.",
		prep: "Peel, halve or quarter lengthwise, and cut the core out of anything wrist-thick. The cut faces oxidize gray-brown, so hold them in acidulated water. Glove up for volume work: the sap burns skin in sunlight.",
		methods: ["roast", "puree", "braise", "fry", "steam", "glaze"]
	},
	{
		t: "Pattypan Squash",
		c: "The Vegetable Atlas",
		d: "A summer squash shaped like a small flying saucer with a scalloped rim, sold from thumb-size upward. The shape is the point: the wide flat faces are built for a pan, and the little discs hold together better than a zucchini coin because the flesh is marginally firmer and the seed cavity proportionally smaller. Picked at 3 to 5 cm (1 to 2 in) they need nothing but oil, salt, and high heat, and they cook whole. Let them reach saucer size and the skin sets, the seeds coarsen, and you are into hollow-and-fill territory: cut a lid, scoop the center, pack with sausage or rice, and bake covered so the shell steams tender before the filling colors. Halve bigger ones through the equator and sear the cut faces hard. The scalloped edge catches and browns, and that browning is most of the flavor you will get from something this watery.",
		season: [6, 7, 8, 9],
		choose: "Heavy and rigid, skin glossy: 3 to 5 cm (1 to 2 in) whole, 8 to 10 cm (3 to 4 in) to hollow and fill. Reject a rind a thumbnail will not mark, brown scars on the flat faces, or a dried shrunken stem.",
		store: "Crisper, unwashed and loose, 4 to 5 days. The scalloped rim bruises in a packed bag and the bruise goes soft and brown inside a day. Cut pattypan holds one day and no more, so cook it the day you cut it.",
		prep: "Trim the stem flush and leave the skin on. Halve through the equator for searing; for filling, cut a lid and hollow it with a melon baller. Taste a raw sliver and spit it out; bin any bitter fruit, since cooking does not destroy cucurbitacin.",
		methods: ["roast", "grill", "saute", "bake", "steam", "fry"]
	},
	{
		t: "Pea Shoots",
		c: "The Vegetable Atlas",
		d: "The growing tips of the pea plant, leaf and tendril and about 10 cm of stem. It is grassy and only mildly sweet: the sugar into starch trade belongs to the seed, not the shoot, and a growing tip is a sink living on sucrose sent up from the leaves below. Two products share the name. MICROGREEN shoots come off seed-dense trays cut at around ten days, soft and mild, for salad; DOU MIAO, the Cantonese tip, is cut from a field-grown snow pea vine and has real pea flavor with enough structure to fight a wok. It is all surface area and respires hard, so a box that looked fine at delivery can yellow by evening. Cook it fast, 45 to 60 seconds in a screaming wok with garlic, a splash of stock and salt. Past that it collapses to a third of its volume and goes flat and khaki.",
		season: [3, 4, 5, 10, 11],
		choose: "Tendrils curled and springy, leaves bright green and dry, stems snapping cleanly at the cut end. Reject yellow leaves, wet matted patches, thick fibrous stems, and shoots that have begun to flower.",
		store: "Refrigerate at 0 to 2 C (32 to 36 F) in a vented box with a dry towel, 2 to 3 days at best. It is the most perishable green in this chapter, so order it for the day you will use it.",
		prep: "Snap the bottom off each stem where it stops breaking cleanly and discard the fibrous end. Wash quickly and dry well, since wet shoots steam instead of searing. Do not cut them: they are picked at the right length.",
		methods: ["stir-fry", "raw", "wilt", "blanch", "steam"]
	},
	{
		t: "Persian Cucumber",
		c: "The Vegetable Atlas",
		d: "A short, slim, thin-skinned cucumber, 12 to 15 cm (5 to 6 in), sold unwaxed and usually bagged in sixes or eights. It is no drier than a slicer, near 96 percent water like every cucumber; what sets it apart is proportion. The seed cavity is narrow and the seeds stay soft, so there is more firm wall and less of the soft gel that weeps and slumps first, and a Persian holds its crunch in a dressed salad long after an English has gone limp. The skin is thin enough to eat and carries almost no bitterness, since these cultivars are largely bred free of cucurbitacin. That makes it the default wherever cucumber must stay crisp: chopped salads, salatim, tzatziki, smashed cucumber. SMASH it rather than slice it. Crack the fruit with the flat of a cleaver so it splits along its own fracture lines, and the ragged torn surfaces grip dressing in a way no clean knife cut ever will.",
		season: [6, 7, 8, 9],
		choose: "Rigid and snapping-firm, skin taut and dark with a fine bloom, never waxed. Reject bendy fruit, soft stem ends, or a bag with condensation and one slick cucumber in it, since that one spoils its neighbors.",
		store: "Crisper, in the bag it came in, up to a week, though the cold works against them: below 10C (50F) the skin pits and goes water-soaked in about three days. Unwaxed skin dehydrates fast, so never leave them bare on a shelf.",
		prep: "No peeling and no seeding. Wash, trim both ends, and cut as late as you can. For smashed cucumber, crack with a cleaver, salt 10 minutes, pour off the liquid that collects, then dress.",
		methods: ["raw", "pickle", "stir-fry", "grill"]
	},
	{
		t: "Plum Tomato",
		c: "The Vegetable Atlas",
		d: "Bred for solids, not for slicing: two locules instead of eight, a thick pericarp wall, little seed jelly, dry matter around 7 percent against a beefsteak's 5. That wall is where the pectin sits, cross-linked by calcium, so plum flesh keeps its shape through the first twenty minutes of a sauce and then breaks down into body rather than water. You spend far less time boiling liquid off, which is the real prize: a short cook keeps the fruit's acid and aroma instead of stewing them flat. SAN MARZANO is the long, pointed, low-acid benchmark; ROMA is the workhorse. Cook them skin-on and pass the sauce through a food mill, which strips skin and seed while pushing the pectin through.",
		season: [7, 8, 9],
		choose: "Firm and dense, deep red to the shoulder with no green collar, heavy in the hand; a light fruit is mostly air. In cans, buy whole peeled in juice, not in puree, which hides broken fruit.",
		store: "Counter at room temperature, stem-scar down, up to a week: the thicker wall holds longer than a beefsteak's. Keep whole fruit out of the refrigerator unless it is dead ripe and you cannot use it, when cold beats rot. Decant opened cans into a covered jar, keep them cold, and use in four days; acid on a cut tin edge turns metallic.",
		prep: "Score an X in the base, boil 20 seconds in batches, then straight into ice water or the flesh cooks on and the skins cling. Or roast skin-on and mill. Scrape the seed jelly out with a thumb only when you want a drier sauce: it runs about three times the glutamate of the flesh, though a plum holds little of it.",
		methods: ["roasting", "simmering", "stewing", "braising", "drying", "grilling"]
	},
	{
		t: "Pumpkin",
		c: "The Vegetable Atlas",
		d: "Not one squash but a shape, spread across four species, and the distinction that matters in a kitchen is between a field pumpkin bred for size and a cooking pumpkin bred for flesh. The big carving types are watery, stringy, and low in sugar because they were selected to grow large and hold a cut wall, and they will punish a pie. The ones to cook are the small dense cultivars: SUGAR or PIE pumpkins, and better still the thick-walled moschata and maxima heirlooms, whose starch turns to sugar in storage. Field and acorn pepo types do the opposite, going blander and stringier each week. Roast rather than boil, since the flesh is wet already, and brown the cut faces before you scrape and puree. If the puree is loose, tighten it in a dry pan over medium heat until it holds a line behind the spoon, or the pie will weep into its crust.",
		season: [9, 10, 11, 12],
		choose: "Small cooking cultivars, 1 to 3 kg (2 to 6 lb), heavy for size, rind too hard to mark with a thumbnail, stem dry and firmly set. Reject stemless fruit, soft ground spots, and big carving pumpkins if you mean to eat it.",
		store: "Cool dry room at 10 to 15C (50 to 59F), 2 to 3 months on a shelf with the fruit not touching. Never refrigerate a whole one. Roasted puree keeps 4 days cold and holds well frozen flat in bags.",
		prep: "Stand it on a cut base, halve pole to pole, and scoop seeds and strings with an ice cream scoop. Taste a raw sliver: bitterness means cucurbitacins, which cooking will not remove, so discard that fruit. Keep the seeds: rinse, dry, oil, salt, roast. Roast the halves skin-on and scrape the flesh out afterward.",
		methods: ["roast", "bake", "braise", "steam", "simmer", "fry"]
	},
	{
		t: "Puntarelle",
		c: "The Vegetable Atlas",
		d: "The blanched inner shoots of Catalogna chicory: hollow, pale, asparagus-like stalks that form in the heart of the plant under the dark canopy of its own jagged outer leaves. The shoots are the prize and the outer leaves are a separate braising green. Whole and raw the shoots are tough and aggressively bitter, so Rome does two things to them. First they are split lengthwise into thin strips, traditionally on a wire grid, which releases the tension in the outer wall; then the strips go into ice water, where uneven swelling curls them into tight ringlets and leaches out a real share of the water-soluble bitter lactones. What comes out is cold, crunchy and only pleasantly bitter. The dressing is not optional: anchovy pounded into garlic, vinegar and oil. Cut, soak an hour, dress at the pass.",
		season: [12, 1, 2, 3],
		choose: "Heads with a dense cluster of fat pale hollow shoots at the center, ivory-green and firm, outer leaves dark and unwilted. Reject flowering shoots, stalks gone spongy or rubbery, and browned cut ends.",
		store: "Refrigerate whole and unwashed at 1 to 4 C (34 to 39 F), 5 to 7 days. Cut strips hold 24 hours in ice water in the walk-in, losing some crunch and some bitterness together.",
		prep: "Strip the outer leaves off for braising, break the shoots from the core, then slice each shoot lengthwise into thin strips. Straight into ice water for at least 30 minutes to curl them. The bitter latex stains hands and board.",
		methods: ["raw", "braise", "saute", "blanch", "grill"]
	},
	{
		t: "Purslane",
		c: "The Vegetable Atlas",
		d: "A succulent weed worth buying: fat jade paddles on red stems, crunchy and sour and genuinely SLIPPERY, because the cells are packed with mucilage, a soluble fiber like okra's. It carries more alpha-linolenic acid, the plant form of omega-3, than any other common leaf vegetable. The sourness is malic acid, banked overnight and spent through the day, though that swing is a drought response and well watered market purslane shows little of it. It also holds oxalic acid at spinach levels or above, so blanch it and pour the water away if you eat it often or make oxalate stones. The mucilage is the decision. Raw with tomato, cucumber and Turkish yogurt it reads as juicy crunch; simmered into a Mexican verdolagas stew with pork it thickens the liquid. Use leaves and tender stems, and dress with acid, since fat alone slides off.",
		season: [6, 7, 8, 9],
		choose: "Plump firm paddles on crisp red-tinged stems that snap wetly, with no flowers. Reject flaccid or wilted leaves, yellowing, blackened stem ends, and any bunch already sliming in the bag. If you pick rather than buy, snap a stem: purslane bleeds clear, the spurge that shares its ground bleeds milky white and is poisonous.",
		store: "Refrigerate unwashed in a loose bag at 2 to 5 C (36 to 41 F), 3 to 4 days. It bruises where it is packed tight and chills badly below 2 C (36 F), going translucent and watery.",
		prep: "Wash hard in several changes of cold water: it grows low and holds sand. Pinch off the woody lower stems and keep the tender ones. Cut at the last moment to limit how much mucilage is released.",
		methods: ["raw", "saute", "simmer", "stew", "blanch", "pickle"]
	},
	{
		t: "Radicchio",
		c: "The Vegetable Atlas",
		d: "Red chicory, the round CHIOGGIA head the one most markets sell: burgundy leaves veined white, colored by ANTHOCYANINS that intensify with cold nights and turn blue-gray in anything alkaline. Bitterness comes from sesquiterpene lactones, mainly lactucin and lactucopicrin. Season matters: chicory banks INULIN, not starch, and cold hydrolyzes that fructan to sugar, so autumn and winter heads are balanced while summer heads are punishing. Three things tame it, as the Veneto worked out: fat, salt and heat. Grilled or roasted, the cut face caramelizes and the leaves go sweet and smoky; soaked in ice water for 20 minutes, raw wedges shed their harshest edge. CASTELFRANCO is the pale speckled loose head, milder and best raw. Cook it hard or dress it hard, with anchovy, vinegar, cheese or pork fat; nothing about radicchio rewards timidity.",
		season: [10, 11, 12, 1, 2],
		choose: "A firm head that feels heavy and dense for its size, leaves tight and glossy with crisp white ribs. Reject soft or spongy heads, brown edges on the outer leaves, and a dry split core.",
		store: "Refrigerate whole and unwashed at 1 to 4 C (34 to 39 F), 2 to 3 weeks; it is the longest-keeping leaf in this chapter. Cut faces oxidize brown, so keep heads whole until service.",
		prep: "Peel off bruised outer leaves and quarter through the core so the wedges hold together. Soak raw wedges in ice water to mellow them. Use a sharp stainless knife, since carbon steel blackens the cut ribs.",
		methods: ["grill", "roast", "raw", "braise", "saute", "char"]
	},
	{
		t: "Radish",
		c: "The Vegetable Atlas",
		d: "The fastest root in the garden, pulled twenty-five days from seed, and the pepper is the point: glucosinolates meeting myrosinase at the cut face to make isothiocyanates that climb the nose rather than sit on the tongue. Heat destroys the enzyme, so a roasted radish turns sweet and mild, close to a young turnip, while a cut raw one peaks a minute or two after the knife and fades from there as those volatiles escape and break down. Pungency rises with warmth in the field and with age in the root, and an overgrown radish goes hollow and pithy as the flesh outruns its water supply. The crispness is nothing but turgor pressure, so ice water brings a limp radish back inside half an hour. Serve them raw with butter and flaky salt, or halve them and roast at 220C (425F) until the cut faces color.",
		season: [3, 4, 5, 6, 9, 10],
		choose: "Firm and taut, small, unsplit skin, lively green tops. Give is water loss and ice water fixes it; pith tracks size and age, so buy small and heavy for the size. Reject cracked roots, golf ball size and up, and yellowing leaves.",
		store: "Twist the tops off, then refrigerate the roots in a sealed container for a week, or submerged in water for two. The greens wilt within a day and are good sauteed or blended into soup.",
		prep: "Scrub, trim the tailroot and the crown, and leave whole or halve. Slice thin only just before serving, since the heat peaks early and then fades and the faces dry. Thirty minutes in ice water restores the snap to a tired bunch.",
		methods: ["raw", "roast", "pickle", "braise", "saute", "grill"]
	},
	{
		t: "Ramps",
		c: "The Vegetable Atlas",
		d: "Allium tricoccum, a wild woodland allium of eastern North America, and the only member of this family whose entry has to talk about supply. A ramp takes five to seven years from seed to a bulb worth pulling: the seed roots over one warm summer and leafs only after the winter that follows, and the plant photosynthesizes for only a few weeks each spring before the tree canopy closes over it. Dig the bulb and you have removed a decade. A patch harvested whole does not come back, commercial sale is banned in Quebec, and harvest is regulated elsewhere. Cut one leaf from a clump and the plant lives. The flavor is why people push it anyway: pungent, sitting between garlic and onion, with a sweetness in the broad leaf that neither has. The window is three to four weeks. Griddle whole plants in a dry pan, or chop the leaves into butter and freeze it.",
		season: [4, 5],
		choose: "Two broad glossy leaves on a burgundy stalk, bulb firm and white, roots intact. Crush a leaf and smell it: ramps reek of garlic. Lily of the valley and false hellebore come up in the same woods, look close enough to fool people, smell of nothing and are poisonous. Reject any leaf with no allium smell, and any that is wilted, yellowed or torn. Ask whether leaves were cut rather than bulbs dug.",
		store: "Refrigerate in the crisper in a barely damp cloth inside an open bag, five days at the outside, well away from butter and milk. Ramp butter or ramp salt made the day they arrive is how to hold the season past a week.",
		prep: "Rinse the bulbs hard, since they carry woodland grit and a slippery outer skin that pulls off with a thumbnail. Separate leaf from bulb and cook them apart: the bulb needs three minutes, the leaf about twenty seconds.",
		methods: ["grilling", "charring", "sweating", "roasting", "pickling"]
	},
	{
		t: "Red Cabbage",
		c: "The Vegetable Atlas",
		d: "The same species as green cabbage, with one difference that is really a cooking instruction: the anthocyanin pigments that make it purple work as a pH indicator. In acid they run red and bright; at neutral pH they sit violet; in alkaline water, or in contact with an iron or aluminum pan, they turn blue and then a dull slate gray. So the acid goes in at the start, not at the end: vinegar, wine, or grated apple with the shreds, in stainless or enamel. Anthocyanins are water soluble too, so hard boiling leaches color into the pot and bleeds pink into anything pale sharing it. It is denser and tougher than green cabbage, which suits it to the long sweet-sour braise with fat and spice. Dress raw slaw an hour ahead: the acid fixes the color and softens the shred.",
		season: [9, 10, 11, 12, 1],
		choose: "Tight, glossy, and heavy for its size, with a dense squeak when pressed. The cut stem should be pale and moist. Reject a dull chalky bloom, a dried split core, or leaves separating at the crown.",
		store: "Whole and unwashed in the crisper, 4 to 6 weeks; it outlasts every other cabbage. Cut faces dull and oxidize within days, so cover them tight and use them up. Never store it wet.",
		prep: "Quarter, core, and shred on a mandoline for even strands. It stains hands, boards, and white aprons. Acidulate at once, vinegar or lemon, to hold the color; salt alone bleeds it out.",
		methods: ["braise", "ferment", "saute", "roast", "pickle"]
	},
	{
		t: "Red Onion",
		c: "The Vegetable Atlas",
		d: "Its color is anthocyanin, concentrated in the outer few scales and water-soluble, and that governs everything you do with it. Those pigments read pH like litmus: in acid they flare magenta, in alkaline or hard water they slump to a bruised blue-gray, and in a long braise they bleed out and leave the pot dishwater brown. Sulfur sits near a yellow onion but water content runs higher, so it keeps months rather than seasons and it tastes harsher raw than the color suggests. Ten minutes in ice water pulls the harshness out, and the pigment with it: acidulate the soak with vinegar so the slices stay pink. Use it where it will be seen: raw in a salad, shaved onto a sandwich, or shocked into a jar with lime juice or vinegar for a quick pickle that turns fluorescent pink within the hour. Send yellow onions to the stockpot.",
		season: [8, 9, 10, 11],
		choose: "Firm, heavy, glossy purple-red papery skin, no shoot at the neck. Cut one open if the seller allows: the color should run several scales deep, not one. Reject squashy shoulders and skins that slide loose.",
		store: "Cool, dark, dry and airy at 7 to 10 C (45 to 50 F) for one to two months; they hold less well than yellow. Once cut, wrap tight and refrigerate three days, because a cut face oxidizes to a stale sulfurous smell fast.",
		prep: "Peel two scales, not one, since the first is usually dry and drab. Pole to pole gives crescents that hold in a salad, crosswise gives rings. Soak slices ten minutes in ice water acidulated with vinegar, which holds the color, then dry them hard.",
		methods: ["pickling", "grilling", "charring", "roasting", "sweating"]
	},
	{
		t: "Rhubarb",
		c: "The Vegetable Atlas",
		d: "A vegetable that eats like a fruit: the petiole of a giant sorrel relative, sour with malic and oxalic acid and almost devoid of sugar, which is why every recipe for it adds some. THE LEAVES ARE NOT FOOD. The blades carry oxalic acid at levels high enough to cause serious poisoning, along with anthraquinone glycosides; cut them off at the market and compost them, and never let them near a stockpot, an infusion, or a salad. The stalk is the safe part and the part you want. FORCED rhubarb, grown in dark sheds and harvested by candlelight in winter, is pink, slender, tender, and mild; FIELD rhubarb in late spring is greener, stringier, and far more sour. Color is variety, not ripeness, so a green stalk can be perfectly ripe. Pectin is low, so rhubarb collapses into threads rather than setting: cook it briefly with sugar, or bake the pieces spread on a tray so they hold their shape.",
		season: [1, 2, 3, 4, 5, 6],
		choose: "Firm, glossy stalks that snap crisply and feel heavy for their size: forced run 1 to 2cm across, field 2 to 3cm, and thicker than that is usually pithy. Reject limp or split stalks, and get the leaves off before you carry it home.",
		store: "Leaves off, refrigerated in a bag up to a week; stalks go limp as they lose water. It freezes well raw in cut lengths and goes into the pot straight from the freezer, no softening first.",
		prep: "Wash, trim both ends, cut into 3cm lengths. Peeling is unnecessary except on thick, stringy field stalks late in the season. The leaves are not an ingredient in any preparation, cooked or raw.",
		methods: ["baking", "stewing", "roasting", "poaching", "pickling"]
	},
	{
		t: "Romaine",
		c: "The Vegetable Atlas",
		d: "The cos lettuce, Lactuca sativa var. longifolia: an upright head whose thick midrib is a block of water-swollen cells, which is why romaine crunches where other lettuces fold and why it holds up on a grill. Cut it and the rib weeps white LATEX carrying the sesquiterpene lactones lactucin and lactucopicrin; that is the bitterness, strongest at the butt and rising as the plant bolts in summer heat. Outer leaves are dark, coarse and mineral; the HEART is pale and sweet because it grew shaded by its own wrapper, and it is the part worth serving whole. Structure is what makes it the Caesar lettuce: the rib carries a thick emulsion without collapsing, where a soft leaf would drown. Wash, then chill the leaves hard before dressing. Cold water restores turgor in twenty minutes, and a limp romaine is usually just a warm one.",
		season: [4, 5, 6, 9, 10],
		choose: "Heads heavy for their size with tight pale hearts and stiff squeaky ribs. Reject rust-colored oxidation along the rib edges, pink or brown bleeding at the cut butt, and heads that feel light and airy.",
		store: "Whole and unwashed in a bag at 0 to 2 C (32 to 36 F), 7 to 10 days; at 4 C, half that. Keep it clear of apples and bananas: ethylene is what pits the ribs with rust spots. Below freezing the cells burst and go translucent.",
		prep: "Trim the butt, separate the leaves and wash them individually, since grit hides at the base of each rib. Washing removes grit, not E. coli: romaine is a repeat outbreak vehicle, so buy whole heads over pre-cut bags and cook it for anyone pregnant, elderly or immune-compromised. Spin bone dry or the dressing slides off. Tear for salad; use a knife only for wedges and grill halves.",
		methods: ["raw", "grill", "sear", "braise", "steam"]
	},
	{
		t: "Romanesco",
		c: "The Vegetable Atlas",
		d: "The chartreuse cone whose surface is a fractal: every bud is a scaled copy of the whole head. Its florets keep trying to flower and failing, and each failure throws up more buds, so the spiral repeats at every scale, in Fibonacci counts. It is no cross of broccoli and cauliflower but an old Roman cauliflower, Brassica oleracea botrytis group, nuttier and less sulfurous than either. Cooks care for two things: it is firmer than cauliflower and holds its shape through roasting, and the pattern is the plating, so cut through the axis and every wedge shows the spiral. It carries chlorophyll, so its own acid pushes the magnesium out of the pigment and turns it olive if you overcook it or hold it on a pass. Roast in wedges at 220C (425F), cut face down, and serve the moment the edges brown.",
		season: [10, 11, 12, 1, 2],
		choose: "A firm bright chartreuse head with sharply defined points and no flattening at the tips. Reject dull yellowing, soft or blackened spires, and any head that gives when you squeeze it.",
		store: "Whole and unwashed in a perforated bag, 5 to 7 days; it yellows faster than cauliflower. Keep it stem up so the cones face down and shed drip instead of holding water in the points.",
		prep: "Soak it cones down in cold salted water ten minutes; the spirals hide cabbage aphids and grit. Cut from the base through the core into wedges to keep the spirals intact, into single cones only for pickling or pasta. Trim the stem flat so the wedges sit cut face down in the pan.",
		methods: ["roast", "steam", "saute", "grill", "blanch"]
	},
	{
		t: "Romano Bean",
		c: "The Vegetable Atlas",
		d: "The flat Italian pod bean, Phaseolus vulgaris again, wide as a thumb and often 15cm long, sold as flat bean or helda. The shape is not cosmetic. That broad wall carries far more surface per gram than a slim haricot, so it browns and drinks braising liquid as a round bean cannot. What makes it slow is not a heavier pectin load but a tougher, more fibrous wall, so it laughs at the three-minute blanch. Cook it longer and wetter, and add the tomato late: acid holds pectin together, and beans braised in tomato from the start stay stubborn for an hour. This is the bean for a slow olive oil braise until it is olive-drab and silky, for fasolakia, for a stew with gigante beans, for charring flat on a grill. Purple Romano goes green in the pot as the anthocyanin washes out. Stop trying to keep this one crisp.",
		season: [7, 8, 9],
		choose: "Broad, flat pods with a matte surface and no swelling over the seeds; a fresh one snaps cleanly when bent, an old one folds. Reject folding, papery, or rust-spotted pods, which stay leathery however long you cook them.",
		store: "Refrigerate in a perforated bag up to five days. All that surface area costs water fast, so keep them covered and out of the refrigerator door, where the temperature swings every time it opens.",
		prep: "Snap the stem end and pull; older pods still give up a string. Cut on a sharp bias into 5cm lengths for braises, or leave them whole for the grill and dress them off the heat while they are still hot.",
		methods: ["braising", "stewing", "grilling", "roasting", "boiling", "sauteing"]
	},
	{
		t: "Russet Potato",
		c: "The Vegetable Atlas",
		d: "The high-solids baking potato: around 22 percent dry matter. It is the quantity of starch that does the work, not the type: potato starch runs four fifths AMYLOPECTIN in every cultivar, and the russet just packs more into large granules. Past about 65C (150F) they swell with water while the pectin cementing the cells dissolves, and the russet falls into dry mealy cells. That is a defect in a salad and the entire point of a baked potato, a fry, and a mash. Low moisture and low reducing sugar also make it a fine frying potato: little sugar means the exterior browns evenly instead of going dark before the center cooks. The netted skin bakes to a crisp shell. Bake at 200C (400F) on the rack, never in foil, which only steams it.",
		season: [],
		choose: "Heavy and rock hard, with dry netted skin and no green cast. The green is only chlorophyll, but it marks the light exposure that also builds solanine and chaconine, and cooking does not break those down. Cut green and sprouts away deeply or pass the potato by, and spit out anything that tastes bitter. Reject soft ends, wrinkled skin, and any cut or bruise weeping onto its neighbors.",
		store: "Cool, dark, and ventilated at 7-10C (45-50F), loose in paper, for a month or more. Never refrigerate them: cold turns starch to sugar and the fries come out dark and sweet. Store them away from onions.",
		prep: "Scrub; peel only when the dish demands it. Fries and cubes hold their shape better after a cold water rinse that washes off free surface starch. Cut flesh grays within minutes, so keep it under water until it cooks.",
		methods: ["bake", "deep-fry", "mash", "roast", "gratin", "simmer"]
	},
	{
		t: "Rutabaga",
		c: "The Vegetable Atlas",
		d: "A cross of turnip and cabbage, Brassica napus, denser and sweeter than either parent, with yellow flesh from carotenoids, a purple-shouldered skin, and often a coat of food-grade wax from the packer. It carries the same glucosinolate chemistry as the turnip but more sugar to balance it, which is why it tolerates long cooking where turnip turns acrid. Its carbohydrate is sugar, not starch: there is almost none to gelatinize, so it holds its shape through an hour of stew and cannot go gluey under the masher, though it does mash wet. Dry the drained pieces in the hot pan before the butter goes in. Bitterness concentrates near the surface, so peel a full centimeter in, past the greenish layer. Cook until a knife meets no resistance.",
		season: [10, 11, 12, 1, 2],
		choose: "Heavy, rock hard, 10-15 cm (4-6 in), smooth skin, firm crown. Reject any that gives under thumb pressure or shows sunken brown patches. A rap tells you nothing through flesh this dense, and brown heart shows only on cutting, so buy small.",
		store: "Whole and waxed they hold a month in the refrigerator and several in a cold cellar at 0-4C (32-39F). Once cut, wrap the piece and use it within four days; the open face dries to a leathery skin.",
		prep: "Trim both ends flat for a stable base, then take the skin off with a knife rather than a peeler, cutting deep enough to clear the pale green layer beneath. Work in even 2 cm (1 in) pieces; it cooks slower than potato.",
		methods: ["boil", "mash", "roast", "braise", "stew", "gratin"]
	},
	{
		t: "Salsify",
		c: "The Vegetable Atlas",
		d: "The taproot of a purple goatsbeard, called oyster plant for a faint shellfish note in the cooked flesh. Its storage carbohydrate is INULIN rather than starch, so it never turns floury: it cooks to a dense, silky, faintly sweet firmness and thickens nothing around it. Inulin also brings the same digestive complaint that follows sunchokes, in smaller measure. The white flesh browns fast and hard once cut, driven by polyphenol oxidase, and the root weeps a sticky white latex that glues itself to a peeler and to your hands. Black salsify, SCORZONERA, is a different plant with the same behavior under a tougher dark skin. Peel under running water into lemon water, then simmer in a blanc of water, flour, and lemon juice to hold it ivory.",
		season: [10, 11, 12, 1, 2],
		choose: "Straight firm roots about as thick as a thumb, sold with their soil on and the skin unbroken. Limp or heavily forked roots lose half their weight to the peeler. Reject any that feels hollow or spongy at the thick end.",
		store: "Refrigerate unwashed and unpeeled in a bag with the soil still clinging, up to two weeks. Peeled, it browns within minutes and must sit in acidulated water. Cooked, it keeps three days held in its own liquid.",
		prep: "Wear gloves; the latex is sticky and stains. Scrub, then peel under running water straight into lemon water. Cut even lengths and simmer in a blanc, water slackened with a spoon of flour and lemon, to keep the color.",
		methods: ["simmer", "roast", "fry", "puree", "saute", "gratin"]
	},
	{
		t: "Savoy Cabbage",
		c: "The Vegetable Atlas",
		d: "The crinkled cabbage, and the crinkle is structural: a coarse vein network holds the blade puckered and traps air, so the head packs loosely and cooks in about half the time a green head needs. That short cook is what keeps it mild: the stale sulfides build with minutes at heat, not with density. The leaves are pliable enough to peel away whole and blanch for wrapping, chou farci and cabbage rolls, without cracking along a rib the way green cabbage does. Frost concentrates its sugars, so the December head is the one to buy. Because it is loose it is also fragile, and it will not sit in the walk-in for a month the way its dense cousin does. Blanch whole leaves 60 seconds in heavily salted water, shock in ice, and pat them dry before you roll.",
		season: [10, 11, 12, 1, 2],
		choose: "Heavy for its size, like any cabbage: savoy is a looser type, but a light head has dried inside. Outer leaves deep blue-green and springy rather than limp. Reject yellowing, slime caught in the puckers, or holes with frass.",
		store: "Crisper drawer in a loose bag, 1 to 2 weeks, not the month a green head gives you. Dirt and water trapped in the crinkles turn slimy: store it dry and wash it at service.",
		prep: "To free whole leaves, cut the core out first and lower the head into boiling water; the leaves release one at a time. Shave the thick spine flat with a knife so the leaf rolls without tearing.",
		methods: ["braise", "steam", "blanch", "saute", "stir-fry", "roast"]
	},
	{
		t: "Scallion",
		c: "The Vegetable Atlas",
		d: "One plant, two vegetables, and cooks conflate them constantly. The white base is dense and sulfurous and behaves like an onion: it wants fat and a minute of heat to lose its bite. The hollow green leaf carries thin volatile aromatics that boil off in seconds, so it belongs at the very end or never in the pan at all. Most bunches are ALLIUM FISTULOSUM, a bunching onion that never swells into a bulb; some are simply young bulb onions pulled early. Either way there is no cure and no papery scale, so it is perishable the way a leaf is, not the way an onion is. Cut the white on a steep bias for surface area and browning; shred the green lengthwise and drop it into ice water ten minutes and it curls into the ringlets that finish congee and roast duck. Whites in first, greens in last.",
		season: [],
		choose: "Bright crisp leaves with no yellowing, firm unblemished white shafts, roots still attached. A good bunch stands up rather than flopping over your hand. Reject slimy leaf tips, split or bruised whites, and a sour smell in the bag.",
		store: "Upright in a jar with 20 mm of water, leaves out of the bag, in the refrigerator, changing the water every second day: ten days easily. A loose bag in the crisper also works, about a week; a sealed one slimes the leaf tips. Scallion oil is low-acid produce under an airless layer, the botulism setup: keep it cold, use it in four days, or freeze it.",
		prep: "Trim the roots and the dry top 20 mm. Rinse under the outer skin at the white, where soil hides. Strip off one slimy outer layer instead of binning the whole stalk, and keep whites and greens in separate piles as you cut.",
		methods: ["stir-frying", "grilling", "charring", "infusing", "sweating", "pickling"]
	},
	{
		t: "Shallot",
		c: "The Vegetable Atlas",
		d: "Not a small onion but a different habit of growth: Allium cepa of the Aggregatum group, dividing into clustered cloves. The name covers several things, so buy by the bulb: banana and echalion shallots are usually one long lobe, and in Britain and Australia shallot can mean a green onion. Dry matter runs higher than a bulb onion and the layers are thin, so a fine mince vanishes into a sauce instead of staying in pieces, which is why classical sauce work is built on it. It scorches easily: over the heat that browns onion in ten minutes, minced shallot goes bitter in three. Raw it is still an allium, and the fix is maceration: minced into vinegar for ten minutes, acid halts the alliinase and leaches out the pungency already made. Sweat it gently in butter, or chop it into acid and leave it alone.",
		season: [8, 9, 10],
		choose: "Firm and heavy under taut coppery or rose skin, neck papery and dry. Squeeze for a solid core inside the wrapper. Reject soft shoulders, green shoots at the tip, or a bulb rattling loose in slack skin.",
		store: "Cool, dark and airy in an open basket, one to two months, never sealed and never refrigerated whole. Humidity is the enemy: the wrapper mildews at the neck and the rot travels down into the clove within days. Shallots confited in oil are a botulism risk at room temperature: chill them, use them in four days, or freeze them.",
		prep: "Cut the top off, peel the skin back, and separate the cloves; each keeps its own root plate to hold it steady while you mince. Keep the mince even, because ragged cuts burn at the small end before the large end colors.",
		methods: ["sweating", "deep-frying", "roasting", "confiting", "pickling"]
	},
	{
		t: "Snap Pea",
		c: "The Vegetable Atlas",
		d: "A 1970s cross, not an heirloom: Pisum sativum bred from a snow pea toward the fat round pod of a shelling pea. The snow pea already lacked the parchment that lines a shelling pod; what was new is the thick sweet wall, tender at full seed size. Like sweet corn, it turns sugar to starch fast after picking, so a pod that tastes floury has spent too long in transit. A shelling pea at its peak is as sweet; here you also eat the wall. Most varieties still run a string down one or both seams, and it stays fibrous however you cook it. Cooking is barely cooking: 60 to 90 seconds in boiling salted water, or 30 seconds in a ripping hot pan finished with a splash of water. Eat them raw when they are good. If a pod needs more than two minutes to be pleasant, it is too old to rescue. Never pick pods off a flowering ornamental vine: sweet pea, Lathyrus odoratus, is a different genus and is poisonous.",
		season: [4, 5, 6],
		choose: "Plump, bright, squeaky pods that snap audibly and feel heavy for their size, with seeds visible but not straining the wall. Reject dull, flabby, or yellowing pods and any that have dried out at the stem end.",
		store: "Refrigerate in a perforated bag up to three days and use them sooner; the sugar-to-starch loss runs on temperature, so give them the coldest shelf. Ethylene from bananas and apples yellows the pods instead.",
		prep: "Snap the stem end backward and pull the string down the straight seam, then check the second seam on thick pods. Split them lengthwise for salads so the peas show, or leave whole for the pan.",
		methods: ["blanching", "stir-frying", "sauteing", "steaming", "grilling", "raw"]
	},
	{
		t: "Snow Pea",
		c: "The Vegetable Atlas",
		d: "The flat pea pod, picked before the seeds develop, whose wall lacks the lignified parchment layer that makes a shelling pea's pod inedible. Because there is almost nothing inside, everything you taste is that wall: crisp, green, faintly sweet, and structurally fragile. Heat here is measured in seconds, not minutes. In a wok they go in last and come out while still audibly crunchy; boiled past a minute they go limp as the cell membranes give way and the cells lose turgor, and translucent as water floods the air spaces that were scattering the light. The same plant gives DOU MIAO, the shoots and tendrils, a vegetable in their own right and the same flavor in leaf form. Expect a string on the straight seam of every pod but the youngest. Serve them raw or barely warmed through, and dress them after the heat, since acid strips the magnesium out of chlorophyll and turns hot pods olive within minutes.",
		season: [4, 5, 6],
		choose: "Flat, bright, almost translucent pods with only faint seed bumps; they should snap rather than fold. Reject opaque, yellowed, limp, or bulging pods, where the seeds inside have already gone starchy.",
		store: "Refrigerate in a perforated bag up to three days; they lose water quickly and go leathery. Keep them clear of ethylene producers, and do not wash them until the moment they meet the pan.",
		prep: "Pinch the stem end and pull the string along the straight edge. Leave them whole for stir-fries; for salads cut on a long bias into thin strips, which makes them eat finer and look deliberate.",
		methods: ["stir-frying", "blanching", "steaming", "sauteing", "raw"]
	},
	{
		t: "Sorrel",
		c: "The Vegetable Atlas",
		d: "The sour leaf: its sharpness is OXALIC ACID, the same compound behind the chalky tooth feel of spinach and chard, here sharp enough to read as acid. Two things follow. Cooked, sorrel slumps to a puree in seconds: the leaf is thin and its walls give at once. The color is other chemistry, acid driving magnesium from chlorophyll to PHEOPHYTIN, bright green to olive-khaki in fifteen seconds, and nothing will hold it. Accept the color or stay raw. Second, it is a seasoning, not a vegetable: by the bowl the oxalate load is high, and anyone prone to kidney stones should be told so. FRENCH sorrel is the broad shield-shaped mild one, garden sorrel the sharper arrow-shaped one; sorrel sold dried, or as a drink, is hibiscus, another plant. Melt it into cream and butter for oily fish and stop there.",
		season: [4, 5, 6, 7],
		choose: "Bright even green leaves, thin and crisp, snapping at the stem. Reject yellowing, slug-holed leaves, and thick leathery ones with prominent ribs, which are old and turn bitter rather than sour.",
		store: "Refrigerate at 0 to 2 C (32 to 36 F) in a bag with a dry towel, 2 to 3 days; it is fragile and fails fast. Its acid attacks aluminum and bare cast iron, so store and cook it in stainless or glass.",
		prep: "Fold each leaf and strip the rib out, since ribs stay stringy in a finished sauce. Chiffonade at the last moment. Cook only in stainless, enamel or glass: reactive metal gives metallic off flavors and blackening.",
		methods: ["raw", "wilt", "puree", "saute", "simmer"]
	},
	{
		t: "Spaghetti Squash",
		c: "The Vegetable Atlas",
		d: "A pale yellow oblong winter squash whose cooked flesh separates into long strands. That is not a trick of the fork: the flesh is built of elongated cell bundles glued by pectin, and heat softens the pectin between the bundles before the bundles themselves break down, so a fork combs them apart. The same mechanism sets the failure modes. Overcook it and the bundles collapse into wet mush; undercook it and the strands stay squeaky and taste raw. Roast halves cut side down at 200C (400F) for 35 to 45 minutes, until a knife enters the rind with slight resistance and no further. Cut the squash CROSSWISE into rings rather than lengthwise if you want long strands, because the fibers run around the circumference. It is watery and mild, so drain the combed strands in a colander and salt them; treating it as a sponge for sauce rather than as pasta is the honest way to serve it.",
		season: [9, 10, 11, 12],
		choose: "Hard pale yellow rind with no green cast, heavy for its size, dry stem intact. Reject green-tinged fruit, which is immature and strands poorly, and anything with a bruised, sunken, or weeping patch.",
		store: "Cool dry room at 10 to 15C (50 to 59F), 1 to 2 months. Cooked strands keep 4 days in a covered box in the refrigerator and shed more water each day, so drain them again before you dress them.",
		prep: "Pierce the rind and microwave 3 minutes to make it cuttable. Cut crosswise for long strands, scoop the seeds, oil and salt the cut faces. Comb with a fork only after it has cooled a few minutes.",
		methods: ["roast", "bake", "steam", "braise"]
	},
	{
		t: "Spinach",
		c: "The Vegetable Atlas",
		d: "A tender amaranth-family leaf, Spinacia oleracea, loaded with OXALIC ACID, which binds calcium into insoluble crystals: that chalky film on the teeth is spinach. Chard is a true relative; sorrel is a dock and purslane a portulaca, high in oxalate by chemistry, not kinship. Boiling leaches some out, while cream and cheese give the oxalate other calcium to grab, which is why creamed spinach tastes smooth rather than furry. The leaf is about 91 percent water in thin cells, so 500 g collapses to a fistful in ninety seconds. FLAT-LEAF and SEMI-SAVOY are the salad and fast-wilt types; baby spinach is any of them cut young. SAVOY, crinkled and mature, hides sand in its folds but stands up to braising. Never crowd the pan: steamed in its own water the leaf goes drab, as acid from the cells strips magnesium out of chlorophyll. Wilt in batches over high heat, then squeeze it hard in a towel before it goes near a filling.",
		season: [3, 4, 5, 10, 11],
		choose: "Leaves stiff enough to stand up when you lift a handful, stems snapping rather than bending, color even and dark. Reject yellowing at the stem end, and reject sliminess or a sour smell in the bag: that bag went anaerobic.",
		store: "Refrigerate unwashed at 0 to 2 C (32 to 36 F) in a loosely closed bag with a dry paper towel, 3 to 5 days. Surface moisture and ethylene from apples or bananas both speed the yellowing.",
		prep: "Wash mature savoy in a deep sink of cold water, lift the leaves out and leave the grit on the bottom; repeat twice. Strip thick stems by folding the leaf and tearing along the rib. Cut just before cooking, since bruised cells oxidize fast.",
		methods: ["saute", "blanch", "steam", "braise", "puree", "raw"]
	},
	{
		t: "Spring Onion",
		c: "The Vegetable Atlas",
		d: "A true bulb onion pulled young, when the base has swelled to a walnut or a golf ball but the top is still green. Sharpness is made at the knife, when alliinase meets the sulfur precursors the bulb built up as it grew; curing adds none. A young one has less of them and far more water to dilute what it has, so it is mild and juicy, nearer a sweet onion than the storage onion it would have become. The wrapper has not dried into papery scales, so there is nothing to cure and nothing to keep: buy and cook, do not stock. Note the naming, which trips written orders: in Britain and Australia spring onion means scallion, a straight shaft with no bulb. Here it means the bulb. Halve them through the root, oil and salt the cut faces, and grill hard until black at the edges and collapsing, then hit them with vinegar.",
		season: [4, 5, 6],
		choose: "A clean white or red bulb, firm and unsplit, green tops still stiff, roots attached. Buy them evenly sized so they grill at one rate. Reject soft or hollow bulbs, split skins, and limp yellowing tops.",
		store: "Refrigerate with tops on, loosely wrapped in the crisper, about a week. Cutting the tops back buys a few more days, because the leaves keep drawing water out of the bulb. There is no cure and no pantry life.",
		prep: "Trim the roots flush but keep the root plate, which holds the halves together. Peel only the slimy outer layer. Halve any bulb wider than 40 mm; larger than that and the cut face chars before the center gives.",
		methods: ["grilling", "charring", "roasting", "braising", "sweating", "pickling"]
	},
	{
		t: "Sunchoke",
		c: "The Vegetable Atlas",
		d: "Neither from Jerusalem nor an artichoke: the tuber of a North American sunflower, Helianthus tuberosus, with a nutty, faintly artichoke sweetness. It stores INULIN instead of starch, a chain of fructose units that the human small intestine has no enzyme to break. Two things follow. It cooks without ever going floury, holding a dense creaminess that makes the silkiest puree of any root. And the intact inulin arrives in the colon, where gut bacteria ferment it into gas; the flatulence is real, famous, and worth warning a table about rather than pretending away. Long slow cooking and acid hydrolyze some of the inulin into fructose, which sweetens the tuber and eases the effect. Serve a small portion the first time, and cook them long and low rather than fast and hot.",
		season: [10, 11, 12, 1, 2, 3],
		choose: "Firm heavy knobs with tight skin and shallow rather than convoluted lobes, since every fold costs flesh at the peeler. Reject soft spots, wrinkling, sprouts, and mold in the folds. Green or purple tinges are harmless here; this is a sunflower, not a potato.",
		store: "Refrigerate unwashed in a perforated bag for one to two weeks; they dehydrate faster than potatoes and go rubbery. Room temperature ruins them in days. Cooked puree holds four days covered.",
		prep: "Scrub hard and leave the skin on where you can, since it is thin and tasty. Cut flesh browns fast, so drop it into lemon water. Halve and roast cut side down. Raw slices off a mandoline carry the whole undiminished inulin load, so keep them to a garnish.",
		methods: ["roast", "puree", "braise", "raw", "fry", "simmer"]
	},
	{
		t: "Sweet Corn",
		c: "The Vegetable Atlas",
		d: "A grass seed eaten at the milk stage, when the kernel is still a bag of sugar and water and not yet a dry starch seed. Standard su varieties convert sucrose to starch the moment the ear leaves the stalk and lose much of their sweetness in a day at room temperature. Sugary-enhanced, se, types slow that conversion, and the shrunken-2 supersweets, sh2, carry two to three times the sugar and hold it for days, which is why a December ear can still taste sweet and taste of nothing else. Cold stops the clock: an ear held near 0C (32F) keeps most of its sugar for a week. Cook it briefly, three to five minutes in boiling water, salted if you like: salt does not toughen kernels, whatever the old rule says, while calcium in hard water and acid do firm cell walls. Or grill hard and dry, where Maillard browning and the sugars work together. After cutting the kernels off, scrape the bare cobs into the pot: that milky liquid is the best part of any chowder.",
		season: [7, 8, 9],
		choose: "Heavy ears, tight green husks, stem end freshly cut not dried gray. Ripe silk is brown and tacky; pale silk was picked early, black or slimy is old. Feel for filled kernels through the husk.",
		store: "Refrigerate in the husk as cold as you can short of freezing, cook within two days; warmth converts the sugar. Blanch cut kernels a minute before freezing, or enzymes flatten them within weeks.",
		prep: "Husk, then rub the silk off with a dry towel. Stand the ear in a bowl and cut down through two thirds of the kernel depth, then scrape the cob with the back of the blade for the milk.",
		methods: ["grilling", "boiling", "roasting", "steaming", "sauteing", "frying"]
	},
	{
		t: "Sweet Onion",
		c: "The Vegetable Atlas",
		d: "Sweet is a misnomer worth understanding. A Vidalia, Walla Walla, Maui or Texas 1015 carries about the same sugar as a yellow onion and sometimes less. What it lacks is sulfur, and that is two things: low-pungency cultivars planted in ground with little available sulfate, the raw material for their sulfoxide precursors. Few precursors, few thiosulfinates, and the sugar that was always there shows. The same breeding gives high water and low dry matter, roughly 6 percent solids against 9 in a storage onion, and that is the whole story of their short life: thin scales, soft flesh, bruises that turn to rot. Cook one down and all that water has to leave before anything browns, and what you get is thin and one-note, missing the sulfur backbone a stew wants. Spend them raw, where low pungency is the entire point: into a tomato salad, onto a sandwich, or cut thick and grilled until the edges char.",
		season: [4, 5, 6, 7],
		choose: "Wide and flat-shouldered, heavy, pale straw skin, tight neck. Sniff the root plate: faintly sweet, never sharp. Reject any soft spot, bruise or weeping patch, which spread through a high-water onion in days.",
		store: "Single layer, not touching, in the crisper or on a cool dark shelf, three to four weeks at best. The old trick works: one onion per leg of a pair of pantyhose, knotted between, hung where air moves. Pressure and moisture are what rot them.",
		prep: "Peel and cut close to service: the flesh browns and limps faster than a storage onion. For raw slices cut crosswise thin, crisp them ten minutes in ice water, then dry; salt at the last moment, since salt draws water and limps the rings.",
		methods: ["grilling", "charring", "roasting", "deep-frying", "pickling"]
	},
	{
		t: "Sweet Potato",
		c: "The Vegetable Atlas",
		d: "Ipomoea batatas, a morning glory relative and no relation whatever to the true yam, regardless of the shop label. Its defining trick is beta-amylase, which survives into the pot: once the starch gelatinizes near 60C (140F) the enzyme strips maltose off it until the heat kills the enzyme near 75C (167F), so a slowly heated sweet potato manufactures its own sugar, while one blasted from cold in a hot oven races past that window and lands bland and starchy. Orange-fleshed types are moist and high in beta-carotene; white and purple Asian types are drier, denser, and closer to chestnut. Curing in warmth for a week after harvest heals the skin and lifts the sweetness further. Start them in a moderate oven, 175C (350F), and give them a full hour.",
		season: [9, 10, 11, 12],
		choose: "Firm and heavy, with smooth unbruised skin and tapered rather than stringy ends; several even roots beat one giant. Reject soft sunken patches, shriveled ends, and dark pitted rot: the bitterness it spreads is ipomeamarone and its relatives, toxins that baking does not destroy and that travel past the visible lesion, so throw out the whole root rather than trim around it.",
		store: "Never refrigerate: below about 13C (55F) they take chilling injury, developing hard centers and off flavors. Keep them in a dark ventilated basket at 14-16C (57-61F), where a cured root holds for a month or more.",
		prep: "Scrub and cook in the skin wherever possible, which keeps moisture and sugar in. Cut flesh oxidizes gray, so hold it in water. Roasted skin slips off easily and is worth eating when it has crisped.",
		methods: ["roast", "bake", "braise", "puree", "deep-fry", "steam", "grill"]
	},
	{
		t: "Swiss Chard",
		c: "The Vegetable Atlas",
		d: "A beet bred for leaf and stalk instead of root, Beta vulgaris, which is why chard tastes faintly of beet and why the stems run red, gold or white: BETALAIN pigments, water-soluble and quick to bleed into anything pale. It carries the same oxalic acid as spinach, concentrated in the leaf, so the chalky tooth feel and the dairy fix apply here too. The working rule is that chard is two vegetables in one bunch. The stalk is fibrous and dense, closer to celery, and wants a 4 to 6 minute head start; the leaf collapses in ninety seconds. Cook them together and you serve raw stalk under gray leaf. RAINBOW and RUBY are the handsome ones but they bleed; FORDHOOK GIANT, white-stalked, is the workhorse. Separate stem from leaf at the board every time and start the stems in the fat first.",
		season: [6, 7, 8, 9, 10],
		choose: "Stalks firm, glossy and squeaky, snapping cleanly; leaves upright with no collapsed midribs. Reject brown pitting, split stalks, and any bunch whose cut ends have dried out and gone corky.",
		store: "Refrigerate unwashed in a bag at 0 to 2 C (32 to 36 F), 4 to 7 days; the leaves fail long before the stems. Keep it away from ethylene fruit and do not wash first: water in the crown rots the base.",
		prep: "Fold each leaf along the rib and cut the stalk out, then slice the stalks crosswise like celery. Cut stems oxidize and dull, so cook them promptly or hold them in acidulated water. Chiffonade the leaf at the last moment.",
		methods: ["saute", "braise", "blanch", "steam", "grill", "gratin"]
	},
	{
		t: "Taro",
		c: "The Vegetable Atlas",
		d: "Colocasia esculenta, one of the oldest cultivated plants on earth and a staple across the Pacific, West Africa, and Asia: cream flesh flecked purple over starch granules a fraction the size of a potato's, which is why it cooks smooth and creamy. Raw it is inedible and vicious to handle, loaded with calcium oxalate RAPHIDES, needle-shaped crystals that lodge in skin and mucous membrane beside the irritant proteins that drive the burning and swelling. The crystals are stable well past boiling and do not break down; cooking works by denaturing those proteins and wrecking the cells that fire the needles, while plenty of water carries off soluble oxalate. There is no safe raw taro, the leaves want 45 minutes, and ornamental elephant ears (Alocasia, Caladium) are not taro and not food. Glove up to peel, and boil or steam until a knife slides through without catching.",
		season: [],
		choose: "Firm and heavy under a dry, hairy, ringed skin, with no soft or moldy patches. The cut crown should be crisp cream flecked purple, never gray, slimy, or sour. Pinker, drier flesh is malanga (Xanthosoma), sold from the same bin and never creamy. Small corms cook creamier; large ones fry better.",
		store: "Cool, dark, and dry at 12-15C (55-60F) for one to two weeks; do not refrigerate whole corms, which brings on rot and a hard center. Once peeled, keep the pieces submerged in cold water and cook them the same day.",
		prep: "Gloves are not optional: the raw sap causes fierce itching. Peel thickly under running water, rinse off the slippery starch, and hold in salted water. Never taste it raw, and cook it right through before it reaches a plate.",
		methods: ["boil", "steam", "deep-fry", "braise", "roast", "simmer"]
	},
	{
		t: "Tomatillo",
		c: "The Vegetable Atlas",
		d: "A Physalis, not a tomato and not an unripe one: a separate genus fruiting inside a papery calyx, the husk, picked mature while still green, short of the yellow ripeness that sweetens it. Inside is a chemistry unlike the tomato bin: citric and malic acid hold the pH near 3.8, and the cell walls carry a heavy load of pectin. Heat breaks those cells and frees the pectin into the liquid, where it thickens by viscosity alone, so salsa verde clings to a chip when blended raw tomato runs off it. Nothing gels here, and a long boil in that acid thins it again, so keep the simmer short. Char them under a broiler until the skins blacken in patches and juice runs. Blended raw they give a sharper, thinner, grassier salsa cruda; both are correct, they are not the same sauce.",
		season: [7, 8, 9, 10],
		choose: "Husk tight, dry and tan, split just far enough to show fruit filling it; a baggy husk means the fruit shrank. Small, firm, bright green fruit beats large pale fruit, which turns seedy and flat. Yellow means sweet and soft.",
		store: "Husks on, in a paper bag in the crisper, two to three weeks; husked, one week, because the sticky coating draws mold. Unlike a tomato it takes cold happily. For longer, husk and wash them and freeze whole.",
		prep: "Pull the husk and stem, then wash in warm water and rub hard: the resin is sticky, tastes soapy and bitter, and cold water will not shift it. No peeling and no seeding; the seeds are soft and carry much of the acid.",
		methods: ["charring", "broiling", "roasting", "simmering", "raw", "braising"]
	},
	{
		t: "Treviso",
		c: "The Vegetable Atlas",
		d: "The elongated Veneto chicory, a radicchio, in two forms barely the same vegetable. PRECOCE is the early one, from September: a torpedo of tight burgundy leaves, firmer than the round heads, halving cleanly and taking a grill better than any of them. TARDIVO is the late one, a made thing: after frost the plants are lifted with the taproot on and stood roots down in the dark in flowing spring water at 12 to 15 C (54 to 59 F) for two to three weeks, regrowing blind on root reserves. The new growth is nearly white, the ribs curl like claws, bitterness falls away and it turns crunchy and sweet. Frost matters to both: chicory stores inulin, not starch, and cold splits it to sugar. Grill precoce in oiled halves, cut face down and hard; serve tardivo raw with anchovy and oil, and pay what it costs.",
		season: [9, 10, 11, 12, 1, 2],
		choose: "Precoce: firm heavy torpedoes, tight leaves, crisp white ribs. Tardivo: pronounced white curled ribs with only the tips red-purple, roots often still attached. Reject limp heads, brown rib edges and soft butts.",
		store: "Refrigerate whole and unwashed at 1 to 4 C (34 to 39 F): precoce 10 to 14 days, tardivo 5 to 7, since forced growth is fragile. Leave the root on tardivo until service.",
		prep: "Halve or quarter precoce through the core so the leaves stay attached. For tardivo, trim the root, split lengthwise and separate the spears; 10 minutes in ice water tightens the curl and crisps the ribs.",
		methods: ["grill", "raw", "roast", "braise", "saute"]
	},
	{
		t: "Turnip",
		c: "The Vegetable Atlas",
		d: "A brassica root, which files it with mustard and cabbage rather than with the carrot: its sharpness is GLUCOSINOLATES, converted by the enzyme myrosinase into pungent isothiocyanates the moment the cells are cut. Young turnips hold little of it and taste sweet and juicy; big old ones concentrate it into a hard peppery bitterness, made worse by slow cooking under a lid, which traps the sulfur compounds against the food. Fast dry high heat carries them off instead, so the same root that turns acrid in a covered pot comes out sweet from a roasting tray. The flesh is mostly water with modest starch, so it collapses rather than thickens. The tops are good greens with the same mustard bite. Roast or glaze small turnips whole, and blanch large ones in an open pot before finishing in butter.",
		season: [4, 5, 9, 10, 11],
		choose: "Small, 5-7 cm (2-3 in), heavy for size, smooth and taut. A purple shoulder marks only the purple-top type; hakurei are white all over, golden types yellow, and both are sweet young. Fresh tops mean a fresh root. Reject soft or spongy roots.",
		store: "Cut the greens away at once, then refrigerate the roots unwashed in a bag for two weeks, the greens for two days. Warm dry air costs water: the root goes limp and sprouts. Woodiness is set in the field, not in storage.",
		prep: "Peel old roots; young ones need only a scrub. Halve or quarter for even cooking and keep every piece the same size. Blanch large turnips in plenty of unlidded water to carry the sulfur off before they meet the butter.",
		methods: ["roast", "glaze", "braise", "boil", "puree", "pickle", "raw"]
	},
	{
		t: "Water Chestnut",
		c: "The Vegetable Atlas",
		d: "Not a nut and not a chestnut: the corm of a sedge, Eleocharis dulcis, grown in flooded paddy. Do not confuse it with horned water caltrop, Trapa, also sold as water chestnut: a different plant, and cooked, never raw. Its fame is a texture that survives almost anything you do to it. FERULIC ACID esterified to the cell wall polysaccharides forms cross-links that hold through boiling, so the cells never separate and the corm stays audibly crisp through a stir-fry, a long braise, even canning. The flavor is mild and faintly sweet, so it contributes crunch far more than taste, and canning takes even that. SAFETY: paddy plants can carry cysts of the fluke Fasciolopsis buski on the hull, so never peel one with your teeth, pare deep, and blanch briefly if you mean to serve them uncooked.",
		season: [11, 12, 1, 2, 3],
		choose: "Fresh corms hard as stones under papery dark skin, with no give at all under a thumb. Scratch a corner: the flesh should be bright white and juicy. Reject soft, wrinkled, moldy, or sprouting corms and any showing brown flesh.",
		store: "Refrigerate fresh corms unwashed and dry in a paper bag for up to two weeks, sorting out any that soften. Peeled, keep them submerged in acidulated water, changed daily, three days. Rinse canned ones well before use.",
		prep: "Trim top and bottom flat, then pare the skin off with a small knife, cutting until no brown remains anywhere under the surface. The flesh oxidizes, so hold it in cold water. Slice or dice and add in the last minute.",
		methods: ["stir-fry", "raw", "braise", "steam", "deep-fry", "simmer"]
	},
	{
		t: "Watercress",
		c: "The Vegetable Atlas",
		d: "A semi-aquatic brassica, NASTURTIUM OFFICINALE, grown in flowing spring water, whose hollow stems are as edible as the leaf and whose heat comes from PHENETHYL ISOTHIOCYANATE, released the moment the cells break: sharper and more sinus-directed than arugula. Heat denatures the enzyme and the isothiocyanate is volatile, so a minute in a hot pan takes the bite out and the soup tastes gentle and green. Wild cress carries two dangers. Streams below sheep or cattle pasture leave liver fluke cysts stuck to the leaf, where washing and vinegar cannot reach, so only cooking through makes it safe. And watercress grows in the same ditches as HEMLOCK WATER DROPWORT and WATER HEMLOCK, which have killed foragers, so buy cultivated. UPLAND cress (BARBAREA VERNA) is a soil crop, similar pepper, neither concern. Use the stems, ice the bunch to stiffen it, and add it to hot food last.",
		season: [3, 4, 5, 10, 11],
		choose: "Dark glossy leaves on crisp stems that snap, the bunch heavy and springy in the hand. Reject yellow leaves, blackened stem ends, a sour swampy smell, and bunches standing in warm water at the market.",
		store: "Stand the stems in 2 cm of cold water with the leaves loosely bagged, at 1 to 4 C (34 to 39 F), 3 to 4 days, changing the water daily. Laid flat it wilts in half the time.",
		prep: "Wash in several changes of cold water and check the crown for grit and small snails. Pinch off only the thickest woody stalks, since the fine stems carry most of the pepper. Chill hard before plating it raw.",
		methods: ["raw", "wilt", "blanch", "puree", "simmer"]
	},
	{
		t: "Watermelon Radish",
		c: "The Vegetable Atlas",
		d: "A large daikon-type Chinese heirloom, dull pale green and white on the outside and shocking magenta at the core. That color is anthocyanin, not betalain, which makes it pH-sensitive: acid holds it bright pink to red, alkalinity shifts it blue-gray, and heat plus time leach it out into the pan. The flavor sits between the daikon and the little red radish, mildly peppery at the rim and sweeter toward the colored center, with the glucosinolate bite climbing as the root ages or grows oversized. It is a fall and winter crop, because warmth in the field makes it woody and harsh. The entire reason to buy one is the cross-section, so slice it thin across the equator, dress it with rice vinegar or lime, and serve it raw.",
		season: [10, 11, 12, 1, 2],
		choose: "Baseball-sized or smaller, heavy, firm all over, skin free of cracks and soft dents. Buy from a vendor who will show you a cut one, since a dull pale core is the common disappointment. Reject any that yields to the thumb.",
		store: "Refrigerate topped and unwashed in a sealed bag for two to three weeks; they outlast small radishes by far. Once sliced the color dulls within a day, so cut them to order and dress them straight away.",
		prep: "Peel thinly only if the skin is tough, since much of the pepper lives there. Slice across the root on a mandoline to show the ring, then dress at once with acid, which sets the pink and keeps the faces from drying.",
		methods: ["raw", "pickle", "roast", "braise", "saute"]
	},
	{
		t: "White Asparagus",
		c: "The Vegetable Atlas",
		d: "The same plant grown blind: soil or black film heaped over the crown so no light reaches the shoot, no chlorophyll forms, and the spear stays ivory. Without photosynthesis it builds none of the green, grassy flavor, and what remains is cleaner and sweeter in the middle but bitter at the skin and the butt, where steroidal saponins such as protodioscin concentrate. That, not fiber alone, is what the peeling is for. The skin is also thicker and more lignified than a green spear's, so white asparagus is always peeled, generously, from just under the tip to the butt. Northern Europe treats the season as an event, and the classic handling answers the vegetable: simmer in water with salt, a pinch of sugar and a strip of lemon to balance the bitterness, 10 to 20 minutes by thickness. Crisp-tender is a green-spear virtue; here it just tastes woody.",
		season: [4, 5, 6],
		choose: "Straight ivory spears with closed tips and moist, pale cut ends; they should squeak when rubbed together. Reject hollow, deeply ridged, or violet-flushed spears and any with dried, fibrous butts.",
		store: "Wrap in a damp cloth, bag, and refrigerate in the dark, three days; violet tips cost grade, not flavor. Simmer peelings and butts 20 minutes for the liquid, then strain, or they leach bitterness in.",
		prep: "Peel twice, from 2cm below the tip down to the butt, taking a visibly thick ribbon, then cut off the dry end. Any fiber you leave will not soften with cooking, no matter how long it simmers.",
		methods: ["simmering", "steaming", "braising", "roasting", "sauteing"]
	},
	{
		t: "Winter Melon",
		c: "The Vegetable Atlas",
		d: "Despite the name a summer-grown gourd, also sold as wax gourd or ash gourd, harvested MATURE, which is why it keeps like a winter squash: a waxy white bloom forms over the rind and seals it, and a whole melon holds for months in a cool room. They grow enormous, 10 kg (22 lb) and upward, so it usually reaches you as a cut wedge with the pale seeded core showing. The flesh is white, turns translucent as it cooks, and tastes of almost nothing beyond a faint cucumber note, and that blankness is the point: in Cantonese cooking it goes into long-simmered soups where it turns glassy and carries pork, ham, and dried scallop, and it is candied into winter melon sugar. Size sets the timing, not the clock: 3 cm chunks go glassy and tender in 20 to 30 minutes, while thick pieces, or the whole hollowed melon steamed for winter melon pond, keep their shape for two hours and more. Thin slices left to boil do not shred, they slump to mush and cloud the broth.",
		season: [8, 9, 10, 11, 12],
		choose: "A cut wedge with a bright, wet-looking white face and dense firm flesh, or a whole melon carrying an even chalky bloom. Reject wedges with a dried, yellowed, or slippery cut face, and any soft or pitted rind.",
		store: "Whole in a cool dark dry room, 2 to 4 months on a rack off the floor. Cut wedges wrapped tight against the exposed face in the refrigerator, 5 days; the cut flesh dries and sours long before the rind fails.",
		prep: "Cut the rind away with a knife, not a peeler, deep enough to lose the hard pale layer beneath it. Scoop the seeds and spongy core. Taste a raw sliver before anything goes in the pot: this melon should be bland, and real bitterness means cucurbitacins, so discard the whole fruit. Same rule for the bottle gourd (lauki, opo) sold beside it, where bitter fruit and its juice have caused severe poisoning. Cut 3 cm (1 in) chunks, because small pieces vanish in the pot.",
		methods: ["simmer", "braise", "steam", "stir-fry", "poach"]
	},
	{
		t: "Yam",
		c: "The Vegetable Atlas",
		d: "The true yam, genus DIOSCOREA, is a tropical tuber from West Africa and Asia with nothing to do with the orange sweet potato sold under its name in American shops. It grows big, sometimes past 5 kg (11 lb), under a rough bark-like skin, and the dense white to pale yellow flesh is starchy, dry, and neutral: nearer to cassava or chestnut than to anything sweet. The raw flesh carries calcium oxalate raphides, needle crystals that sting skin and mouth, alongside bitter saponins. Heat does not dissolve the crystals, which outlast any pot; peeling thickly and boiling is what clears the saponins and soluble oxalate that carry the sting. Cook the starchy African and Caribbean yams always, though Japanese nagaimo is another Dioscorea and is grated raw on purpose. Some wild species hold the alkaloid dioscorine and are poison until days of leaching. Glove up, peel thickly, and boil in salted water until it gives completely.",
		season: [10, 11, 12, 1],
		choose: "Heavy and hard with no soft spots, skin intact and dry, and any cut end clean and white rather than gray or slimy. Reject weeping cuts, mold at the ends, and any section that gives under a firm thumb.",
		store: "Cool, dark, dry, and well ventilated at 15-16C (59-61F) for weeks to months; below about 12C (54F) they brown inside and rot faster, so keep whole roots out of the refrigerator. Wrap cut pieces, refrigerate, and use within two days.",
		prep: "Wear gloves: the raw sap raises an itching rash. Peel thickly with a knife to clear the fibrous layer under the bark, then hold the pieces in salted water, which slows browning and draws off some of the slippery mucilage.",
		methods: ["boil", "roast", "deep-fry", "braise", "steam", "stew"]
	},
	{
		t: "Yellow Onion",
		c: "The Vegetable Atlas",
		d: "The workhorse, and the place to learn the chemistry, because an intact onion is odorless. Cut it and alliinase splits its sulfoxide precursors into sulfenic acids: most condense into thiosulfinates, while lachrymatory factor synthase turns one into syn-propanethial-S-oxide, the tear volatile. Damage sets the pungency: a coarse pole-to-pole cut severs fewer cells and tastes milder than a fine crosswise dice, and a dull knife crushes its way to a harsh onion. Heat kills both enzymes in seconds, so raw bite vanishes in the pan; hold the pieces at a bare sizzle for 40 minutes and fructans hydrolyze to fructose, which browns with the onion's amino acids. That is Maillard, not caramelization; a wet pan stays near 100 C (212 F). High dry matter and thick papery scales are why it cures and keeps. Dice pole to pole to hold shape, crosswise to collapse.",
		season: [],
		choose: "Heavy for its size, dry crackling skin, tight dry neck. Press the shoulders: any give means rot underneath. Reject green shoots pushing through the neck, soft brown patches, or a musty cellar smell.",
		store: "Loose in a basket, cool dark cupboard with air moving, 7 to 10 C (45 to 50 F), two to three months. Never bagged in plastic and never beside potatoes: potatoes want damp air and onions want dry, and the damp is what rots them. Cooked onions are low-acid and have caused botulism when a batch sat in fat at room temperature, so cool it fast, then refrigerate under four days or freeze.",
		prep: "Trim the stem end, leave the root plate on to hold the layers, cut through to the board, then peel the skin away with the first layer if it is leathery. Chill the onion 20 minutes before fine dicing to blunt the tear gas.",
		methods: ["sweating", "caramelizing", "roasting", "braising", "frying", "pickling"]
	},
	{
		t: "Yellow Squash",
		c: "The Vegetable Atlas",
		d: "The same immature summer squash as zucchini in a different skin: CROOKNECK, bent-necked and slightly bumpy, and STRAIGHTNECK, smooth and uniform. The yellow is carotenoid pigment sitting in the peel; the flesh underneath is the same pale, wet, thin-walled tissue, a shade sweeter and more delicate than zucchini, with a seed cavity that softens sooner. That delicacy cuts both ways, because yellow squash goes to mush a beat before zucchini does: it wants less time, not more. Older crookneck skin toughens, so press a thumbnail in and if it resists, the fruit is past its window. The Southern smother: soften onion in fat, add thick slices, lid on and low for 20 to 30 minutes, until it slumps sweet and the water cooks back. If you want texture instead, cut thick coins, salt them, blot, and sear in a wide uncrowded pan.",
		season: [6, 7, 8, 9],
		choose: "Small to medium, 15 cm (6 in) or under, skin bright and faintly waxy, thumbnail marks it without effort. Reject dull leathery hide, soft spots along the neck, or a fruit gone light and slack for its size.",
		store: "Crisper drawer, dry and loosely bagged, 4 days at most; it bruises more easily than zucchini and every bruise turns watery. Do not wash until you cook. Keep it off the coldest shelf, which pits the skin.",
		prep: "Skin and seeds both stay. Trim the stem and the blossom scar. Taste a raw sliver and spit it out; bin the whole fruit if it is bitter, since cooking does not destroy cucurbitacin. Salt coins 15 minutes and blot for searing, or cut at the last second for a smother.",
		methods: ["saute", "grill", "roast", "fry", "braise", "steam"]
	},
	{
		t: "Yukon Gold Potato",
		c: "The Vegetable Atlas",
		d: "A Canadian-bred all-purpose cultivar sitting between the mealy russet and a true waxy potato: roughly 18 percent dry matter, thin yellow skin, and yellow flesh colored by carotenoids that read as buttery before any butter arrives. The middling starch means the cells neither fall apart like a russet nor stay stubbornly bound like a fingerling, so it mashes smooth, roasts to a creamy interior with a crisp edge, and just about holds together sliced in a gratin. Its cells resist separating, so you work them harder, and a beater tears them open: the freed starch, mostly AMYLOSE, sets into glue. The skin is fine enough to leave on everywhere. Rice or press it while hot, fold in warm fat by hand, and stop early.",
		season: [],
		choose: "Firm, with taut thin gold skin and shallow eyes, and uniform in size so a tray cooks evenly. Reject green shoulders, sprouts, soft spots, and deep growth cracks that trap grit you will never wash out.",
		store: "Cool, dark, and dry at 7-10C (45-50F) in paper or an open basket, up to three weeks; thin skin means they keep less well than russets. Light greens the skin and builds bitter glycoalkaloids beneath it: pare those off, or throw the potato out.",
		prep: "No need to peel, the skin is fine enough to eat. Rinse cut pieces for crisper roasting, and before mashing too: it removes only surface starch, and the creaminess is inside the cells. Cut even sizes, start in cold water.",
		methods: ["roast", "mash", "boil", "gratin", "braise", "pan-fry", "steam"]
	},
	{
		t: "Zucchini",
		c: "The Vegetable Atlas",
		d: "Summer squash picked immature, Cucurbita pepo: the skin never sets, the seeds stay soft, and roughly 95 percent of the fruit is water held in thin-walled cells. That water is the whole problem. Heat bursts those cells anyway; crowd the pan and the water they release cannot escape as steam, so the squash stews gray in its own liquid instead of browning. Two fixes, pick one. DRIVE THE WATER OUT first: salt coins or planks 15 minutes and press them dry, so the surface browns. Or GO HOT AND FAST in a wide pan, single layer, so the water flashes off before the flesh collapses. The flavor is faint and vegetal, so zucchini works as a carrier for garlic, chili, anchovy, mint. Grate it for fritters and wring the shreds in a towel until they stop dripping; skip that and the batter will not set. Cook it to jammy collapse on purpose, or barely at all. The middle is where it goes gray.",
		season: [6, 7, 8, 9],
		choose: "Firm, heavy for its size, skin taut and glossy and easily nicked by a thumbnail; 15 to 20 cm (6 to 8 in) is the window. Reject spongy stem ends, dull leathery skin, or giants whose seeds have gone fibrous.",
		store: "Crisper drawer, unwashed and loosely bagged, 4 to 5 days. Long stretches below 5C (41F) pit the skin; surface moisture turns it slimy within a day. Cut faces weep, so cut only what you will cook now.",
		prep: "No peeling: the skin is the structure and the color. Trim both ends. Taste a raw sliver and spit it out; if it is bitter, bin the whole squash. That is cucurbitacin, cooking does not destroy it, and it brings violent vomiting and diarrhea. Salt cut pieces 15 minutes and blot before searing.",
		methods: ["grill", "saute", "roast", "fry", "braise", "raw"]
	}
];
