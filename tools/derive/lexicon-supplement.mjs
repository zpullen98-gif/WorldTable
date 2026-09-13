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
		t: "Yellow Onion",
		c: "The Vegetable Atlas",
		d: "The workhorse, and the place to learn the chemistry, because an intact onion is odorless. Cut it and alliinase splits its sulfoxide precursors into sulfenic acids: most condense into thiosulfinates, while lachrymatory factor synthase turns one into syn-propanethial-S-oxide, the tear volatile. Damage sets the pungency: a coarse pole-to-pole cut severs fewer cells and tastes milder than a fine crosswise dice, and a dull knife crushes its way to a harsh onion. Heat kills both enzymes in seconds, so raw bite vanishes in the pan; hold the pieces at a bare sizzle for 40 minutes and fructans hydrolyze to fructose, which browns with the onion's amino acids. That is Maillard, not caramelization; a wet pan stays near 100 C (212 F). High dry matter and thick papery scales are why it cures and keeps. Dice pole to pole to hold shape, crosswise to collapse.",
		season: [],
		choose: "Heavy for its size, dry crackling skin, tight dry neck. Press the shoulders: any give means rot underneath. Reject green shoots pushing through the neck, soft brown patches, or a musty cellar smell.",
		store: "Loose in a basket, cool dark cupboard with air moving, 7 to 10 C (45 to 50 F), two to three months. Never bagged in plastic and never beside potatoes: potatoes want damp air and onions want dry, and the damp is what rots them. Cooked onions are low-acid and have caused botulism when a batch sat in fat at room temperature, so cool it fast, then refrigerate under four days or freeze.",
		prep: "Trim the stem end, leave the root plate on to hold the layers, cut through to the board, then peel the skin away with the first layer if it is leathery. Chill the onion 20 minutes before fine dicing to blunt the tear gas.",
		methods: ["sweating", "caramelizing", "roasting", "braising", "frying", "pickling"]
	}
];
