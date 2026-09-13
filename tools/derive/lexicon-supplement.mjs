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
		t: "Apple",
		c: "The Fruit Atlas",
		d: "Malic acid against sugar is the argument, and pectin decides the rest: apples that hold a slice have cell walls that stay bonded under heat, and that is cultivar by cultivar, not dessert against cooker. Cut flesh browns within minutes because polyphenol oxidase meets oxygen at the wound; acid slows the enzyme, salted water slows it further. HONEYCRISP has oversized cells that rupture instead of parting, which is the crack you hear. GRANNY SMITH is the most acidic common dessert apple and firm with it, so it holds a wedge; FUJI is dense and bakes well. GALA is sweet and cooks soft; MCINTOSH goes to sauce outright. Woolliness is a different fault, cells parting in storage, and it is there before you bake. An apple on the counter ages ten times faster than one at 1C (34F), and one soft apple softens the whole bowl. Taste before you commit to a case.",
		season: [9, 10, 11],
		choose: "Heavy for its size, skin taut and faintly waxy on a good keeper, stem still attached. Press at the shoulder: no give at all. Reject sunken brown bruises, skin wrinkled at the stem end, and any fruit that feels light, which means mealy flesh.",
		store: "Refrigerate at 0 to 4C (32 to 40F) in the crisper, loosely bagged to hold humidity: good cultivars keep two to three months there and a week on the counter. Keep them away from greens and herbs, since apples throw ethylene and will yellow anything nearby.",
		prep: "Peel with a swivel peeler, quarter, then cut the core away on the diagonal rather than coring the fruit whole. Drop the pieces into water with lemon or a pinch of salt to hold color. Leave skins on for sauce: they carry both pectin and color.",
		methods: ["raw", "baking", "roasting", "poaching", "sauteing", "pickling"]
	},
	{
		t: "Apricot",
		c: "The Fruit Atlas",
		d: "Prunus armeniaca, and the hard truth first: an apricot has almost no starch reserve, so fruit picked hard will soften and never sweeten. That is why so much of what is sold disappoints raw, and why it is the great cooking stone fruit. Heat is its ally: dry heat drives off water and concentrates sugar and acid, and breaks carotenoids down to the ionones behind the lactones, so a roasted one tastes twice as loud as raw. Its acid, not its pectin, is what jams it: an apricot is sharp enough to set where a peach slumps, and it still wants the full sugar. Dried fruit is a separate ingredient: bright orange means sulfured, and that sulfur dioxide can set off asthma in the sulfite-sensitive; brown means unsulfured, deeper, and fine for them. Buy tree-ripe local fruit inside its six-week window, or buy it dried and stew it.",
		season: [6, 7],
		choose: "Deep orange with no green shoulder, plump, and fragrant at the stem end; a ripe one gives evenly under gentle pressure across the whole fruit. Reject pale, hard, or shriveled fruit, and anything with soft brown patches, which are already fermenting.",
		store: "Ripe fruit lasts two days at room temperature and four in the refrigerator at 2 to 4C (36 to 39F); cold dulls the aroma, so bring it back to room temperature before serving. Keep dried apricots sealed and dark, where they hold a year.",
		prep: "No peeling: the skin is thin and holds the color. Run a knife around the crease and twist, since almost all are freestone. Halves roast cut side up with sugar in the hollow. The kernel in the stone holds amygdalin, so use it as a flavoring, not food.",
		methods: ["roasting", "poaching", "baking", "grilling", "preserving", "stewing"]
	},
	{
		t: "Asian Pear",
		c: "The Fruit Atlas",
		d: "Several species share the name: nashi and Korean singo are Pyrus pyrifolia, the pale ya pear is Pyrus x bretschneideri, thinner skinned and easier to bruise. All behave like apples: they ripen on the tree, arrive ready, and stay crisp for months. The crunch is structural, thin-walled cells packed with water at close to 88 percent of the fruit, plus the faint sandy grit of stone cells near the core. Acid is low and pectin is low, so it tastes mild and floral, and it will not set a jam or slump into a sauce. A slice holds its shape in a braise or in a salad dressed an hour ahead. Grate it raw into Korean marinades, where a cysteine protease plus sugar and sorbitol tenderize and glaze short ribs at once. Buy it hard, because hard is ripe, and slice it thin across the equator.",
		season: [8, 9, 10, 11],
		choose: "Firm all over, heavy in the hand, skin unbroken, with a floral smell at the stem end. Hard is correct: there is no soft stage to wait for. Reject fruit with dark pressure marks, which turn into brown pits, or any nick in the thin skin.",
		store: "Refrigerated at 0 to 1C (32 to 34F) it keeps two to three months, though Anjou and other European winter pears outlast it. The skin bruises from a fingertip, so leave the foam sleeves on and store in a single layer. Cut fruit browns slowly but dries out, so wrap it.",
		prep: "Peel only if the skin is thick or heavily russeted, since it carries flavor. Core with a round cutter and slice thin, cutting across the fruit for the widest slices. For a marinade, grate on a box grater and use juice and pulp together.",
		methods: ["raw", "grilling", "braising", "stewing", "pickling", "poaching"]
	},
	{
		t: "Avocado",
		c: "The Fruit Atlas",
		d: "Like the olive, it stores its energy as fat rather than sugar, roughly 15 percent oil and mostly monounsaturated, which is why it reads as a rich ingredient and never as a sweet one. It is strictly climacteric and, unusually, it will NOT soften on the tree: the tree supplies a ripening inhibitor, so fruit hangs hard for months and only begins to ripen once picked. The tree is the storage and your counter is the ripening room. HASS, pebbly-skinned and blackening as it ripens, is most of the trade; FUERTE and other green-skin types stay green when ripe, so color proves nothing about them. Cut flesh browns fast through polyphenol oxidase: acid and an airtight seal slow it, the pit does nothing. Avocado cross-reacts with natural rubber latex, so anyone with a latex allergy can react to it.",
		season: [],
		choose: "Judge by even pressure across the palm, never a thumb tip, which bruises the flesh under the skin. Flick off the dried stem cap: green beneath is good, brown is overripe. Reject sunken soft patches and fruit that rattles.",
		store: "Ripen on the counter 2 to 5 days, faster bagged with a banana. Once ripe, refrigerate 3 days. Below 5 C (41 F) unripe fruit takes chilling injury and turns gray and stringy inside without ever softening.",
		prep: "Cut lengthwise around the pit, twist the halves apart, and scoop with a spoon rather than striking the pit with a blade, which is how cooks put knives through their hands. Press citrus onto every cut face and wrap tight to the flesh.",
		methods: ["raw", "blend", "grill", "char", "fry", "roast"]
	},
	{
		t: "Banana",
		c: "The Fruit Atlas",
		d: "A seedless triploid clone: nearly every export dessert banana is CAVENDISH, one genetically identical plant propagated by suckers, which is why the soil fungus behind Panama disease TR4 is an industry-wide threat and not a bad year. Plantains and cooking bananas share the name: other cultivars, starchy to the end, cooked never raw. Cavendish is aggressively climacteric: harvested green and hard it makes its own ethylene, amylase converts up to a fifth of its weight of starch into sugar, pectin softens, and isoamyl acetate builds the candy-banana smell. Brown-speckled fruit is at peak sugar and aroma, not spoiled: that is your baking stock. Below 13 C (55 F) the peel blackens from chilling injury while the flesh stays starchy and dull, which is why the refrigerator wrecks a green banana and helps a ripe one.",
		season: [],
		choose: "Buy at the stage you need: green-tipped for three days out, solid yellow to eat now, heavily speckled for bread and ice cream. Reject split skins, dull gray peel, which is chill damage, and gray mold on the crown.",
		store: "Room temperature, hung or spread out and away from other fruit, since their ethylene ripens everything nearby. Once ripe, refrigerate and the peel blackens while the flesh holds 3 days. Peel and freeze ripe ones for baking.",
		prep: "Pinch the flower end rather than fighting the stem, and peel. Strip the phloem strings for a clean puree. Cut flesh browns fast through polyphenol oxidase: toss with lemon or citric acid, or cut to order.",
		methods: ["raw", "bake", "grill", "fry", "blend", "dehydrate"]
	},
	{
		t: "Blackberry",
		c: "The Fruit Atlas",
		d: "Another aggregate of drupelets, but the receptacle comes away with the fruit, so a blackberry has a solid white core where a raspberry has a hollow. That core is the ripeness test: soft and sweet, not crunchy. Dull black is ripe, shiny black is not, and a red shoulder will never sweeten in the punnet: the fruit is non-climacteric. Skins are tannic and the seeds large, so late hedgerow fruit is astringent before it is sour. Skin color is cyanidin-3-glucoside piling up, green to red to near-black; the fruit holds pH 3.0 to 3.6, too acid for blue forms. Cooked with sugar and a little lemon they set well, on pectin from the drupelet walls and core. Pick the dull ones, cook the sharp ones, sieve the pulp if the seeds are coarse.",
		season: [8, 9, 10],
		choose: "Dull, deep black all over, plump and yielding, with no red or green drupelets left. Shine means underripe and sour. Reject leaking fruit and any punnet smelling of fermentation. Picking wild, take only aggregates of drupelets off a thorny arching bramble: a single glossy black berry set in a green five-pointed star is deadly nightshade, and black berries on smooth hedge stems are privet or buckthorn. All of those are poisonous.",
		store: "Refrigerate unwashed in a single layer on paper for 2 to 3 days; they mold faster than they soften. Open-freeze on a tray for crumbles and sauces, where the texture goes but the flavor holds.",
		prep: "Rinse foraged fruit briefly and drain hard; float out grubs in lightly salted water for 10 minutes first, then rinse. Shop fruit needs nothing. Sieve cooked pulp when the seeds are big enough to notice.",
		methods: ["raw", "baking", "preserving", "stewing", "freezing"]
	},
	{
		t: "Blackcurrant",
		c: "The Fruit Atlas",
		d: "The most aromatic currant: trace thiols carry the catty, budlike top note, a sulfur class it shares with passionfruit and Sauvignon Blanc, over a body of terpenes and anthocyanins dense enough to stain grout. Very high acid and very high pectin mean it sets hard and sometimes too hard, so bring the pan to a set fast and stop; a long boil turns the jam rubbery. Vitamin C runs roughly four times that of an orange by weight. The skins are tough and stay tough if sugar arrives early, because sugar draws water out of them and fixes them leathery. Simmer the fruit in water until the skins have burst, and only then add the sugar. Cassis, cordial, kir and the dark glaze over a fruit tart all begin at that point.",
		season: [7, 8],
		choose: "Firm near-black berries with taut skins and a loud smell when a handful is cupped and warmed in the palm. Reject shriveled or split fruit, and anything showing the dusty gray of mildew at the stem.",
		store: "Refrigerate unwashed on the strig for up to a week; they hold far better than raspberries. They freeze whole without damage, and freezing softens the skins, giving the next jam a head start.",
		prep: "Top and tail with scissors or fingertips for whole-fruit use; for cordial and jelly leave the stems on and strain later. Wear an apron, because the juice is a permanent dye on cotton and stone.",
		methods: ["simmering", "preserving", "stewing", "baking", "infusing"]
	},
	{
		t: "Blood Orange",
		c: "The Fruit Atlas",
		d: "A sweet orange whose flesh carries anthocyanins, chiefly cyanidin-3-glucoside, the pigment class of red cabbage and blueberries, which ordinary oranges do not make at all. It develops only when nights turn cold, so the color is a record of the weather: a mild winter gives pale, streaky fruit, and the same tree grown in the tropics never colors. Sicily's three are MORO, darkest and most raspberry-scented with a bitter finish, TAROCCO, sweetest and least pigmented, and SANGUINELLO, in between. In the pan that pigment is a liability, being pH-sensitive and heat-labile, so a reduced blood orange sauce goes brown and muddy while tasting of nothing much. Reduce plain orange juice for body, then stir the blood orange in raw off the heat for color and perfume.",
		season: [12, 1, 2, 3],
		choose: "Heavy, firm, often with a blush or rusty stippling, though skin color predicts flesh color poorly. Reject light, puffy fruit and any with soft patches; if a cut sample is pale and streaky, blame the season, not the vendor.",
		store: "Loose in the refrigerator at 4C (39F) for three to four weeks, a week on the counter. Cold keeps building the pigment, so a pale fruit darkens in the drawer; it is cut flesh and juice that fade, so cut on the day you serve.",
		prep: "Supreme them over a bowl to catch the juice, which stains boards, aprons and pale fish alike. Zest before cutting. Dress cut segments with a little acid, which holds the anthocyanin red rather than letting it gray.",
		methods: ["raw", "roasting", "baking", "curing", "braising", "preserving"]
	},
	{
		t: "Blueberry",
		c: "The Fruit Atlas",
		d: "Not a true berry but an epigynous one, from an inferior ovary, so the blossom end wears a crown of dried calyx. The name covers highbush (Vaccinium corymbosum), wild lowbush, and in much of Europe bilberry, whose flesh is dark and stains. The pigment is the useful fact: anthocyanins sit in the skin and answer to pH, red-purple in acid, blue then green-gray in alkali. That is why a soda-heavy muffin batter rings each fruit teal, and why a squeeze of lemon holds the color true. The BLOOM, that silvery wax, is the fruit's moisture barrier, so never rub it off before storage. Sugar is made on the bush and never rises after picking, so pink-shouldered fruit stays sour. Cells leak juice from about 60C (140F); skins split when the water in them turns to steam.",
		season: [6, 7, 8],
		choose: "Firm, dry, uniformly deep blue under an intact silvery bloom, rolling loose in the punnet. Reject green or reddish shoulders, wrinkled skins, and fruit stuck together in a mass by its own juice.",
		store: "Refrigerate unwashed in a vented box for up to 10 days, which is long for soft fruit. Wash only at the moment of use. They freeze better than any other berry: open-freeze on a tray, then bag.",
		prep: "Pick out stems and any soft fruit, then wash and dry thoroughly or the batter streaks. Toss them in a spoonful of the recipe flour before folding in so they hold their place in the crumb.",
		methods: ["raw", "baking", "preserving", "stewing", "freezing"]
	},
	{
		t: "Buddha's Hand",
		c: "The Fruit Atlas",
		d: "A citron, Citrus medica var. sarcodactylis, split into finger-like lobes: a fruit with no juice, no pulp and effectively no seeds, which is the point rather than a defect. What you buy is entirely rind, a thin yellow flavedo whose oil is limonene with gamma-terpinene behind it, not lemon's citral, over a thick white albedo. That albedo is low in limonin and in the naringin that embitters grapefruit pith, so it can be sliced and eaten. Weight for weight it yields more zest than anything else in the aisle, and the perfume is enormous and durable: one fruit will scent a kilogram of sugar or a liter of vodka. The whole fruit candies well because that pith takes syrup like a sponge. Treat it as an aromatic and not as a fruit: zest it, candy it, infuse it, and never go looking for juice.",
		season: [11, 12, 1, 2],
		choose: "Firm, fingers intact, fiercely fragrant at arm's length. Green shoulders are fine, the oil fills the glands before the rind turns. Reject brown, soft or shriveled tips, where decay starts, and waxed fruit, since the rind is all you get.",
		store: "Two weeks at room temperature, where it will perfume the kitchen. The rind pits below about 10C (50F), so a loose bag in the refrigerator buys a week or two, not a month. Once the tips brown, cut them away and zest or candy the rest that day.",
		prep: "Wash, then rasp the yellow off the fingers; there is no flesh underneath, so keep going until white shows. For candying or salads, slice the whole fruit thin across the fingers, pith and all, and blanch it twice to soften.",
		methods: ["candying", "preserving", "curing", "infusing", "baking", "raw"]
	},
	{
		t: "Calamansi",
		c: "The Fruit Atlas",
		d: "Citrus x microcarpa, a kumquat and mandarin hybrid and the everyday sour of the Philippines: a fruit the size of a large marble, green-skinned over orange flesh, ripening fully orange without losing its acid. It juices at roughly 5 percent citric, as sour as a lime but nothing like it, because the mandarin parent puts a sweet orange perfume behind the sourness. Press gently. Lean on the rind and you drive peel oil and limonoids into the juice, and those turn to bitter limonin in acid over hours, faster with heat, which is why it is squeezed at the table and never simmered. It is the acid in sawsawan, the Filipino word for any dipping sauce, in the soy one called toyomansi, in marinades for inihaw, and in the juice drink that carries its name. Green or orange is ripeness, not quality.",
		season: [8, 9, 10, 11],
		choose: "Firm, glossy, heavy for its size, skin taut and fragrant when scratched; green or orange are both fine. Reject dull, wrinkled, light fruit, which has dried out, and soft fruit with brown patches, which ferments in the bag.",
		store: "Two weeks in the refrigerator at 4C (39F) in a covered container, a few days on the counter. Freeze the juice, not the fruit: cube trays, bagged, three months bright, longer only for cooking. Whole frozen fruit comes out as mush.",
		prep: "Roll, halve across the equator, and squeeze cut side up through your fingers so the seeds stay behind, since crushed seeds turn bitter. No peeling and no zesting: the skin oil is half the flavor of the fruit.",
		methods: ["raw", "marinating", "grilling", "preserving", "curing", "baking"]
	},
	{
		t: "Cantaloupe",
		c: "The Fruit Atlas",
		d: "What America calls cantaloupe is properly a netted muskmelon, Cucumis melo var. reticulatus; the true European cantaloupe, a Charentais, is smooth and ribbed rather than netted. Both are climacteric in aroma but not in sugar, so they soften and smell riper after picking while never getting sweeter. A ripe one releases itself from the vine, leaving a smooth, slightly sunken scar, the FULL SLIP; a cut stub means it was taken early and will only ever be melon-scented water. Beta-carotene colors the flesh and esters build the perfume in the last days on the vine. The netting holds soil bacteria, and this is the melon most often behind Listeria and Salmonella outbreaks, so scrubbing the whole rind before cutting is not optional. Buy heavy and smell the blossom end.",
		season: [7, 8, 9],
		choose: "Heavy, with raised corky netting over a gold-tan ground color, a smooth clean stem scar, and a real melon perfume at the blossom end. Reject green ground color, a cut stem stub, or soft mushy spots.",
		store: "Whole at room temperature for 2 to 4 days to soften and build perfume, then refrigerate up to 5 days. Refrigerate cut melon within two hours and use it in 3 days. Wrap it tight: it perfumes the butter and milk, and its ethylene yellows greens beside it.",
		prep: "Scrub the netted rind with a brush under cold running water and dry it before cutting, because the net holds soil. Halve, scoop the seeds and fibers with a spoon, then wedge it and pare each piece.",
		methods: ["raw", "macerating", "grilling", "pureeing", "pickling"]
	},
	{
		t: "Charentais Melon",
		c: "The Fruit Atlas",
		d: "The small French cantaloupe type: gray-green skin ruled with dark sutures, flesh a deep saturated orange, and the most aromatic melon grown anywhere. It is also the most perishable, holding perhaps two days at full ripeness, which is why it travels badly and why the supermarket version is picked hard and never arrives. Ripeness announces itself twice, at the blossom end, which softens and perfumes, and at the stem, which cracks in a ring as the fruit prepares to let go. Aroma builds after picking but sugar does not, so a hard, scentless melon is a failure no kitchen can cook away. Tradition halves it, seeds it, and serves it with a grind of black pepper or a spoon of sweet wine in the hollow. Buy it by nose and eat it the day it smells right.",
		season: [7, 8],
		choose: "Small and heavy for its size, gray-green going ivory between clear sutures, with a clean ring crack where the stem let go. Scent and blossom-end give arrive on the counter; reject a cut stem stub, which was taken green.",
		store: "Room temperature until it is fragrant, then refrigerate and use within 2 days, bagged, or the perfume moves into the butter. Once cut, wrap the face and finish it the same day: the aroma goes first.",
		prep: "Scrub the rind and dry it before cutting: the knife drags whatever sits in the sutures into the flesh, where Listeria grows if it sits out. Halve through the poles, scoop the seeds and strings, and serve in the half shell. If cubing, pare the rind with a knife rather than a peeler; the flesh is too soft.",
		methods: ["raw", "macerating", "pureeing", "grilling", "juicing"]
	},
	{
		t: "Clementine",
		c: "The Fruit Atlas",
		d: "A mandarin and sweet orange hybrid, smaller and glossier than a plain mandarin, with thin, tight, deep-orange skin and little acid: around 0.6 percent against 11 or 12 percent sugar, which is why they taste like candy and why they tire an adult palate fast. Seedlessness is genetic but conditional. The tree cannot set seed with its own pollen yet fruits without fertilization, so it stays seedless only where no other citrus sits in bee range; mixed plantings put seeds in it. The branded boxes are not one variety either: early season is true clementine, later season is usually a Murcott-type mandarin under the same label. Juice yield is poor and the zest is thin, so keep them raw against a sharp dressing, or boil them whole and blitz them into a flourless almond cake, where the low acid stops mattering.",
		season: [11, 12, 1, 2],
		choose: "Deep orange, glossy, firm, heavy, skin tight against the flesh. Reject any that feels hollow or puffy with air under the rind, the first sign of age, and any softening at the stem scar, where mold starts.",
		store: "A week at room temperature, two to three weeks in the refrigerator at 4C (39F) in a single layer. The netted bag is a mold incubator: open it, sort out anything soft, and store the rest loose.",
		prep: "Peel by hand from the stem scar; no knife needed. Pull the pith threads off each segment for a clean salad. If seeds turn up, lift them out with a paring knife tip through the inner edge of the segment.",
		methods: ["raw", "baking", "roasting", "preserving", "candying"]
	},
	{
		t: "Coconut",
		c: "The Fruit Atlas",
		d: "Botanically a drupe, and two different ingredients at two ages. YOUNG green coconuts hold 500 ml or more of sterile, lightly sweet water plus a thin jelly of immature endosperm you eat with a spoon. MATURE brown nuts have converted that endosperm into firm white flesh at roughly a third fat, while the water inside has gone thin and sour: the flesh is what you grate and press with hot water. The thick first press is coconut CREAM; press the same solids again with more water for coconut MILK. There is no milk inside the shell, only water, and that is the commonest kitchen misunderstanding of this fruit. The fat is about 90 percent saturated and melts near 24 C (76 F), so coconut milk sets solid when cold and splits when boiled hard. US labeling counts coconut as a tree nut, so declare it to anyone avoiding nuts.",
		season: [],
		choose: "Mature nuts: heavy, loudly sloshing with liquid, the three eyes dry and intact. Shake every one. Reject light nuts, which have dried out, cracks, damp or hairy patches around the eyes, and any sour or cheesy smell.",
		store: "Whole mature nuts keep 2 to 4 months cool and dry. Opened, the flesh keeps 5 days refrigerated and freezes grated for 6 months. Fresh coconut water sours within 2 days even in the refrigerator.",
		prep: "Only one of the three eyes is soft: find it with a thumb, punch it through with a screwdriver and drain. Crack the shell by tapping around the equator with the back of a heavy knife, rotating as you go. Pry the flesh out with a butter knife and peel the brown testa off.",
		methods: ["raw", "roast", "simmer", "braise", "fry", "blend", "dehydrate"]
	},
	{
		t: "Cooking Apple",
		c: "The Fruit Atlas",
		d: "Bred for acid and for collapse: a true cooker such as BRAMLEY'S SEEDLING carries several times the malic acid of a dessert apple, and its flesh is low in dry matter, big-celled and airy, so heat parts the cells and the fruit foams. The acid is flavor, not the cause of that collapse, which is why a cooker takes 100g of sugar per kilo and still tastes of apple instead of going flat. The same collapse ruins a pie, where fruit that turns to fluff leaves a gap under the lid and a soaked floor. So split the job: cooker for sauce, butter, curd, and the base layer of a tart; firm dessert apple, or a cooker cut thick and pre-cooked briefly with sugar, for anything that must keep its edges. Cook it covered with butter and no water at all; the fruit brings water enough.",
		season: [9, 10, 11],
		choose: "Large, green, and squat, with a flat shoulder and a broad open eye. Skin should be matte and hard, the stem intact. Reject any with a soft brown patch at the blossom end, or scald, the tan blotching that follows months in storage.",
		store: "Cool and dark holds a cooker for months: 2 to 4C (36 to 39F), single layer, fruit not touching, checked weekly, since one rotting apple runs through a tray in days. Throw rotted fruit out whole rather than cutting the bad part away: the blue-green mold Penicillium expansum makes patulin, which spreads into flesh that still looks sound and survives cooking into sauce or juice. Whole fruit tolerates a cellar; cut fruit belongs in the refrigerator and lasts two days.",
		prep: "Peel, quarter, core, and slice straight into acidulated water, since the cut faces brown while you work through a big fruit. For sauce, cook covered over low heat with butter and no water; for pie, precook the slices with sugar and drain the liquor before filling.",
		methods: ["baking", "stewing", "poaching", "roasting", "sauteing", "preserving"]
	},
	{
		t: "Cranberry",
		c: "The Fruit Atlas",
		d: "Vaccinium macrocarpon, a true berry built around four air chambers, which is why it floats and why the commercial harvest happens in a flooded bog. Those chambers also make it bounce: a live cranberry dropped on a board rebounds and a dead one thuds. Highbush cranberry is a Viburnum, not this fruit, and is always cooked, never eaten raw. Raw, this one is close to inedible, the acid savage at about pH 2.4 and the skins loaded with tannin alongside the anthocyanin. What makes it a cook's fruit is pectin, so much of it that sauce sets on cooling with nothing but sugar and water. The popping a few minutes in is the skins bursting and releasing that pectin; carry on much past it and the sauce goes to paste. Cook until most have popped, then pull the pan. Sugar is not a garnish here, it is the only thing that makes the acid readable.",
		season: [10, 11, 12],
		choose: "Judge through the bag: fruit loose and dry, deep red, nothing stuck or weeping. Pale berries are underripe but fine for sauce. Reject any bag pooling juice in a corner, and bounce the doubtful ones at home.",
		store: "Refrigerate in the bag for up to a month, which is exceptional for fresh fruit, and freeze for a year. Frozen berries go into the pan hard and cold; letting them soften first turns the sauce to mush.",
		prep: "Tip onto a tray and pick out stems, leaves and soft fruit; nothing else needs trimming. Pulse raw with orange and sugar for relish, or leave whole for sauce, where they burst and set themselves.",
		methods: ["simmering", "preserving", "baking", "roasting", "stewing"]
	},
	{
		t: "Damson",
		c: "The Fruit Atlas",
		d: "Prunus domestica subspecies insititia: a small, oval, blue-black plum that is not a dessert fruit and does not pretend to be. Raw it is astringent, sour, and tight with tannin, all of which is exactly what you want in a pot. Acid and pectin both run high, so damson jam sets hard with no added pectin, but it is not a low-sugar jam: that pectin needs roughly 60 percent sugar and a low pH to gel at all, so weigh sugar in at the fruit weight or a little over. The same firm set makes DAMSON CHEESE, the sliceable paste eaten with cold mutton and hard cheese. The stone clings stubbornly, so nobody pits them raw: cook the fruit whole and lift the stones as they rise, or push the cooked pulp through a sieve. Heat turns the color from dusty blue to ink and the flavor from harsh to spiced and almost winey. Test the set early.",
		season: [8, 9],
		choose: "Small, oval, blue-black under a heavy gray bloom, firm with only a little give, and heavy for the size. Stalks are gone by the time they reach a stall, so judge on color and bloom, not the stem. Reject split, weeping, or wasp-bored fruit, any still red rather than blue, and the round pea-sized sloes sometimes sold beside them.",
		store: "Cool and dry in a single layer for two or three days; refrigerated at 2 to 4C (36 to 39F) they hold a week. They freeze whole and cook straight from frozen, which is the usual way to get a winter jam out of a September glut.",
		prep: "Do not try to stone them raw, because the stone clings. Wash, pick off stalks and leaves, then cook whole with a splash of water until they burst, skimming the stones off the surface with a slotted spoon, or sieve the pulp after simmering. Skimming never gets every stone, so warn whoever eats the jam. Never crack the stones for their almond-scented kernels: they are cyanogenic.",
		methods: ["stewing", "preserving", "poaching", "baking", "pickling"]
	},
	{
		t: "Date",
		c: "The Fruit Atlas",
		d: "The fruit of the date palm, effectively a preserve made on the tree. It passes through KIMRI (green and hard), KHALAL (full size, crunchy, still astringent, eaten fresh in the Gulf), RUTAB (half-soft, amber, peak flavor), and TAMR (fully cured, dark, shelf-stable). At tamr the sugar is close to 70 percent and water activity sits near 0.6: low enough to stop bacteria, not low enough to stop sugar-tolerant yeasts and molds, which is why warm dates ferment or fur and why a year on the shelf means a cool dry one. MEDJOOL is large, soft, fudgy and caramel; DEGLET NOOR is smaller, firmer, semi-translucent and slices cleanly for baking; BARHI is the one sold still on the branch at khalal stage. Gritty white that melts with gentle warmth is crystallized sugar; fuzzy or blue-green white is mold.",
		season: [9, 10, 11],
		choose: "Judge by type: Medjool plump and yielding under a squeeze; Deglet Noor firm and semi-dry when right, so firmness alone is no fault. Reject cracked or rock-hard fruit, a sour fermented smell, webbing or holes from insects, and fuzzy gray patches.",
		store: "Airtight at cool room temperature 1 month, refrigerated 6 months, frozen a year. Heat and open air harden them and drive out crystals. Soften stiff dates in hot water for 10 minutes or steam them for 2.",
		prep: "Slit lengthwise and lift the single hard stone out, then press the fruit flat for stuffing. For paste, pit, soak in just-boiled water 20 minutes, and blend with the soaking liquid. Check every date for a stone, pitted ones included.",
		methods: ["raw", "bake", "blend", "simmer", "roast"]
	},
	{
		t: "Dragon Fruit",
		c: "The Fruit Atlas",
		d: "PITAYA, the fruit of a night-blooming climbing cactus pollinated by bats and moths, and the most photographed, least flavorful fruit here if you buy it carelessly. The color is betacyanin, a water-soluble pigment that bleeds magenta into everything and can turn urine and stool pink for a day: harmless, but worth knowing before someone panics. The flesh is mostly water with crunchy edible seeds, and what is missing is acid, not sugar: near pH 5, with almost no tartness, so 12 Brix still reads flat. Serve it very cold with lime and salt. All three sold are now Selenicereus, not Hylocereus. WHITE-fleshed S. undatus is mild to bland; RED or magenta-fleshed S. costaricensis is sweeter and beetier; YELLOW-skinned S. megalanthus is a separate species, smaller, sweetest, and the one to buy on sight.",
		season: [7, 8, 9, 10],
		choose: "Even bright skin, giving slightly under the thumb like a ripe kiwi. On pink types the leathery fins should still be supple, browned only at the tips. Yellow megalanthus has no fins, just knobby areoles that may still carry spines, so grip it with a cloth. Reject rock-hard fruit, shriveled fins, and soft mushy blotches.",
		store: "Refrigerate 5 to 7 days in the crisper, since it dehydrates in open air and the fins brown. Hard fruit softens in 2 days at room temperature but will not gain sugar. Cut flesh keeps 2 days sealed.",
		prep: "Halve lengthwise and scoop with a spoon, or quarter it and peel the skin back with your fingers, which strips like a banana. The skin is not eaten. Cube, chill hard, and dress with lime and salt, which is what it lacks.",
		methods: ["raw", "blend", "juice", "macerate", "dehydrate"]
	},
	{
		t: "Durian",
		c: "The Fruit Atlas",
		d: "The fruit banned from hotels and subway cars: a spiked husk over rich custard-textured arils, and a smell built from volatile sulfur compounds, ethanethiol and its esters, layered over sweet fruity esters, which is why people honestly disagree about whether it smells of gas and onions or of almond custard. Texture is the reason to bother, since it is unusually high in fat and starch for a fruit and eats like pastry cream. MUSANG KING is the benchmark, bitter-sweet and dense; MONTHONG is milder and firmer; CHANEE sits between them. A real caution: durian compounds inhibit aldehyde dehydrogenase, the enzyme that clears acetaldehyde, so eating a lot alongside alcohol leaves people flushed and sick. Keep the two apart.",
		season: [4, 5, 6, 7, 8],
		choose: "A stem freshly cut and still moist, a hollow sound when tapped with a knife handle, and a strong but sweet smell. Reject split weeping husks, a dry corky stem, and any sour, alcoholic, or chemical note in the smell.",
		store: "Whole at room temperature 2 to 3 days, ripening and strengthening as it goes. Sealed arils keep 2 days refrigerated and freeze for months, eating best while still half-frozen. Nothing keeps the smell out of a refrigerator.",
		prep: "Wear gloves or hold it in a folded towel, since the spines puncture. Find the seams at the blossom end, cut shallow along each, and pry the husk open by hand rather than cutting through, which slices the flesh. Raw seeds are toxic: boil them 30 minutes or roast them soft, or throw them out.",
		methods: ["raw", "blend", "bake", "fry", "dehydrate"]
	},
	{
		t: "Elderberry",
		c: "The Fruit Atlas",
		d: "The small purple-black fruit of Sambucus nigra, and the safety clause comes before the cooking: raw elderberries, along with the stems, leaves and unripe green fruit, carry cyanogenic glycosides, chiefly sambunigrin, that the plant's own enzyme turns to hydrogen cyanide once crushed. Nausea, vomiting and cramping follow. They must be cooked, every time, every scrap of green stem picked out. The cyanide leaves as a gas, so boil hard, lid off; a covered simmer returns it to the pot. Cooked, they are low in sugar, high in tannin and anthocyanin, and savory-fruity, which is why they belong in cordial, in pontack sauce, and blended with apple for the pectin they lack. The flowers are milder but carry the same compounds; strip the florets from the green stalks and steep. Comb the berries off, boil 20 minutes, strain before sweetening.",
		season: [8, 9],
		choose: "Identify the plant first: a woody shrub with opposite pinnate leaves and a flat, drooping fruit head. Refuse upright heads on a soft green plant (dwarf elder, poisonous) and single hanging spikes on a purple stem (pokeweed, poisonous). Then pick heads of uniform purple-black berries, rejecting green or red fruit, shriveled berries, or mildew on the stems.",
		store: "Cook within a day of picking, since the berries ferment fast on the umbel. If that is impossible, strip and freeze them, which also makes the berries drop off the stems far more cleanly.",
		prep: "Comb the fruit off with a fork over a bowl and pick out every fragment of green stem. Never taste one raw, and never serve the juice unboiled. Simmer 20 minutes, then strain through cloth.",
		methods: ["simmering", "preserving", "infusing", "stewing", "reducing"]
	},
	{
		t: "Feijoa",
		c: "The Fruit Atlas",
		d: "PINEAPPLE GUAVA, Acca sellowiana, a myrtle-family fruit from southern Brazil and Uruguay: oval, dull green, waxy-skinned, and one of the few fruits that announces its own readiness, because a ripe feijoa DROPS off the shrub and that is how it is gathered. It is climacteric, so fruit picked near drop softens indoors; immature fruit never gains aroma. Inside, the clear jelly around the seeds is the sweet, perfumed part, pineapple and mint from esters led by methyl benzoate, while the grainy white flesh around it is firmer, more acid, and gritty with stone cells. That perfume falls away within days. Cut flesh browns in minutes through polyphenol oxidase, faster than apple, and the skin is edible but bitter. Eat it with a spoon; acidulate anything you cut ahead.",
		season: [10, 11, 12],
		choose: "Take windfall fruit when you can get it, but wash it and use it fast; ground fruit bruises and ferments. Otherwise take fruit that gives slightly and smells through its skin. Firm ones soften but never sweeten. Reject split skins and brown mushy ends.",
		store: "Room temperature 2 to 3 days to finish softening, then refrigerate up to 1 week, though the perfume fades either way. Scooped pulp browns fast, so acidulate it and get it into the freezer the same day.",
		prep: "Halve across and scoop the flesh out with a teaspoon, leaving the bitter skin behind, or peel thinly for slices. Work fast and drop the flesh into lemon water, or puree it straight with lemon juice, since it browns within minutes.",
		methods: ["raw", "blend", "bake", "poach", "preserve"]
	},
	{
		t: "Fresh Fig",
		c: "The Fruit Atlas",
		d: "Not one fruit but a SYCONIUM: an inverted cluster of hundreds of tiny flowers facing inward, which is why the inside looks the way it does and why a fig shows no blossom outside. Most commercial types (ADRIATIC, BROWN TURKEY, KADOTA) set without pollination; SMYRNA types such as Calimyrna need the fig wasp, which crawls in through the eye and is broken down by the fig's own enzymes. One of those, FICIN, is a protease: fresh figs will stop gelatin setting and sting the mouth in quantity, and heat denatures it. The white latex in stems and unripe fruit is a separate problem, carrying furocoumarins (psoralen, bergapten) that blister skin once daylight reaches it, and cooking does not destroy those. Figs are picked dead ripe because they gain no sugar off the tree, so they arrive fragile and on a three-day clock.",
		season: [6, 7, 8, 9],
		choose: "Heavy, soft, slumping a little, with a bead of clear nectar or a small split at the eye, both signs of sugar rather than spoilage. Reject firm necks, hard shoulders, a sour smell, and gray fuzzy mold at the base.",
		store: "Refrigerate in a single layer on a paper-lined tray, stem up, and use within 2 to 3 days, since they bruise wherever they touch. Bring them to room temperature 30 minutes before service or the flavor reads flat.",
		prep: "Do not wash until service, and then only a quick rinse and a pat dry. Trim the hard stem tip; the skin is edible on all common types. Tear rather than slice for salads. Wash stem latex off with soap at once and keep those hands out of sunlight, or it burns and marks the skin for weeks.",
		methods: ["raw", "roast", "grill", "bake", "poach", "preserve"]
	},
	{
		t: "Fuyu Persimmon",
		c: "The Fruit Atlas",
		d: "The NON-ASTRINGENT persimmon, squat and tomato-shaped, and the whole point of it is that you eat it FIRM. Its tannin was never converted: a Fuyu stops laying down soluble tannin early and the growing fruit dilutes what is there below the tasting threshold, so there is no mouth-drying stage to wait out. Cut hard off the board it eats crisp like an apple, honeyed and faintly of cinnamon, and holds its shape against sharp cheese and bitter leaves. Softening is optional here and compulsory for Hachiya, and that distinction ruins more persimmons than anything else in the trade. Shape is a guide, not proof: flat astringent kinds like Hiratanenashi exist, and gas-treated astringent fruit is sold firm. Taste a sliver from every new lot.",
		season: [10, 11, 12],
		choose: "Deep orange, glossy, firm as a hard tomato, heavy for its size, with the green calyx still attached and flat against the fruit. Reject sunken black spots, split skin, a missing calyx, and any pointed acorn shape.",
		store: "Firm fruit keeps 2 weeks in the refrigerator crisper, longer than most people expect. To soften a few, hold them at room temperature in a bag with an apple. Cut slices dull within hours: acidulate for platters.",
		prep: "Wash, pull the calyx off, and slice crosswise into rounds or thin wedges. Skin is edible but tough on large fruit, and peel it for anyone with a past stomach operation or slow digestion, since persimmon skin and tannin can knot into a stomach mass. Trim out dark seed lines. Cut to order, since the faces oxidize and gray.",
		methods: ["raw", "roast", "bake", "grill", "dehydrate"]
	},
	{
		t: "Gooseberry",
		c: "The Fruit Atlas",
		d: "Ribes uva-crispa, or American R. hirtellum: a true berry in a veined, translucent skin, and not the Cape gooseberry (a Physalis) or the Chinese gooseberry (kiwifruit). Two fruits, depending on the week it is picked. Early green berries are hard and brutally acid, near pH 2.9, with the season's highest pectin, which is why they set without help and why they cut the fat of mackerel, pork and elderflower cream. Ripe fruit softens and eats as dessert, but the ripe color belongs to the cultivar, not the stage: a green bush stays green, a red one reddens. Acid and pectin fall together, so choose which fruit you want. For a fool, cook with a splash of water and sugar them once they collapse; sugar from cold firms the skins and holds them whole. Top and tail first or the stem ends stay woody.",
		season: [6, 7, 8],
		choose: "For cooking, hard green berries that squeak and resist the thumb. For eating raw, fruit with give and a blush of red or gold. Reject split or weeping fruit and any gray mildew around the stem end.",
		store: "Refrigerate unwashed in a vented box for up to two weeks: the toughest of the soft fruit. Freeze them topped and tailed on a tray, then bag, and they go into the pan straight from frozen.",
		prep: "Top and tail: nip the dried flower remnant off one end and the stalk off the other, with scissors or a thumbnail. It is dull work, and skipping it leaves woody specks through the fool.",
		methods: ["stewing", "preserving", "baking", "poaching", "roasting"]
	},
	{
		t: "Grapefruit",
		c: "The Fruit Atlas",
		d: "A pomelo and sweet orange cross found in Barbados in the 1700s. The bitterness is naringin, a flavanone concentrated in the pith and segment walls, and the red of a RUBY or STAR RUBY is lycopene, the tomato pigment, not the anthocyanin of a blood orange. One real caution belongs on any menu: grapefruit carries furanocoumarins that irreversibly disable intestinal CYP3A4, the enzyme limiting how much of many drugs reaches the blood, and it raises levels of common statins, calcium channel blockers and some immunosuppressants for a day or more. Spacing the dose does not get around it, so offer a guest an alternative rather than an argument. In the kitchen, salt suppresses bitter perception better than sugar does: a pinch of flaky salt on segmented grapefruit beats a spoonful of honey.",
		season: [12, 1, 2, 3, 4],
		choose: "Heavy, firm, with thin, smooth, slightly springy skin; weight is the signal for juice. Reject light, coarse, puffy fruit, and the pointed, thick-necked stem end, which means deep pith around a small heart.",
		store: "A week on the counter, a month in a cool room at 10 to 15C (50 to 59F); colder pits the rind, so two weeks at most in the refrigerator. Cut fruit turns bitter within a day as limonin develops, so segment to order and keep halves covered.",
		prep: "Segment out of the membranes: those walls hold the naringin, and the difference between a bitter grapefruit and a sweet one is usually knife work. Cut the ends off, pare peel and pith to the flesh, then cut between the walls.",
		methods: ["raw", "broiling", "grilling", "curing", "preserving", "candying"]
	},
	{
		t: "Guava",
		c: "The Fruit Atlas",
		d: "Psidium guajava, a myrtle-family fruit whose smell carries across a room: ethyl butanoate and green hexenals give it that penetrating sweet perfume. Two more fruits sell under the name: strawberry guava (P. cattleianum), small, red and tart, and pineapple guava or feijoa (Acca sellowiana), another genus. It is exceptionally high in vitamin C, several times an orange by weight, and high in PECTIN, which is why grainy, seedy flesh sets into a firm sliceable paste (goiabada, pasta de guayaba) with sugar and time. Stone cells make it gritty and the seeds are hard enough to crack a tooth, so pass the pulp through a food mill rather than a blender. PINK and RED fleshed types are perfumed and soft; pale firm-fleshed types stay crisp and tart, eaten with salt and chili. Choose it by smell from a step away.",
		season: [10, 11, 12, 1, 2],
		choose: "Fragrant from an arm's length, yielding to gentle pressure, skin turning from hard green to pale yellow or blushed. Reject bruised brown patches, split skins, and hard green fruit with no smell, which rots before it ripens.",
		store: "Room temperature to finish ripening, 2 to 4 days, and the smell will fill the kitchen. Once soft, refrigerate up to 3 days. Strained puree freezes for a year; whole fruit turns mealy after freezing.",
		prep: "Trim both ends and halve. For paste keep the seedy core, where the pectin sits, and mill the cooked fruit; scoop the core out only when you want clean slices. The skin is edible and slightly bitter. Acidulate cut flesh for a clean pink puree.",
		methods: ["raw", "simmer", "poach", "blend", "preserve", "dehydrate"]
	},
	{
		t: "Hachiya Persimmon",
		c: "The Fruit Atlas",
		d: "The ASTRINGENT persimmon, tall and acorn-shaped, and eating it firm is the classic kitchen mistake: its soluble tannins bind the proteins in your saliva and strip the mouth dry, a sensation that outlasts twenty minutes and that no amount of sugar can cover. Ripening converts those tannins to an insoluble form as the flesh collapses, so a Hachiya is ready only when it feels like a water balloon about to burst, skin translucent, flesh a loose jelly. Industry forces the same conversion with carbon dioxide or alcohol vapor, which is what a firm but sweet astringent persimmon has been through. The pulp is a baker's ingredient: sugar and pectin with no structure, the base of persimmon pudding and of HOSHIGAKI, hand-massaged dried fruit.",
		season: [10, 11, 12],
		choose: "Buy them hard and ripen them at home, since ripe ones never survive transport. Deep orange-red, heavy, unblemished, calyx attached. Reject leaking fruit, mold at the stem, and cut-price half-soft fruit with bruises.",
		store: "Ripen at room temperature 3 to 7 days in a paper bag with an apple or banana, until jelly-soft, then refrigerate 2 days at most. Scooped pulp freezes for a year and comes out of the freezer ready to bake.",
		prep: "Do not cut it firm: wait. Fully soft, pull the calyx, halve, and scoop the pulp out with a spoon, discarding skin and any seeds. A pass through a sieve or food mill gives a smooth puree. Freezing a firm one softens it but leaves the tannin soluble: slack and still astringent. Freeze ripe pulp only.",
		methods: ["bake", "blend", "simmer", "dehydrate", "raw"]
	},
	{
		t: "Honeydew",
		c: "The Fruit Atlas",
		d: "A smooth-skinned winter melon, the last to ripen and the longest keeper, with pale green flesh, little aroma and high sugar: honeydew is sweet without perfume where cantaloupe is perfume with sugar. Sugar is fixed at picking, as in every melon, so buying is the whole game, and here the tells are tactile rather than visual. A ripe one has skin that is faintly waxy, almost tacky to the palm, and yields slightly at the blossom end; an unripe one is slick, hard and a chalky white-green rather than creamy. The flesh is firm enough to hold a clean cube and to carry a wrapped slice, which is why it takes prosciutto better than the softer melons do. Serve it barely cool rather than cold, because refrigerator cold flattens the sugar.",
		season: [8, 9, 10],
		choose: "Creamy yellow-white skin with a faint waxy tack, heavy for its size, giving very slightly at the blossom end. Reject a hard slick greenish-white rind, which never improves, and any bruised soft patch.",
		store: "Whole at cool room temperature a week or more. A home fridge runs colder than it likes, pitting the rind and stalling ripening, so chill only a ripe one and only briefly. Cut, wrap the face and refrigerate 4 days, away from strong smells.",
		prep: "Wash and dry the rind so the blade carries nothing into the flesh. Halve, scoop the seeds, cut wedges, then run the knife between flesh and rind rather than peeling first. Raw melon itches the mouth and throat of ragweed-allergic guests; heat breaks that protein down, so grilled or poached is safe for them.",
		methods: ["raw", "macerating", "juicing", "pickling", "grilling"]
	},
	{
		t: "Jackfruit",
		c: "The Fruit Atlas",
		d: "The largest tree-borne fruit on earth, up to 40 kg (88 lb), and a compound fruit like its relative breadfruit: what you eat are dozens of fleshy bulbs, each around a seed, packed in spongy white rag. It is two ingredients in one. YOUNG GREEN jackfruit is neutral and fibrous, and its bulbs pull into strands that read as slow-cooked pork shoulder, which is how it entered western kitchens; it brings texture only, so it needs salt, fat, acid, and smoke to be worth eating. RIPE jackfruit is another thing entirely, heavily sweet and smelling of banana and bubblegum from isoamyl esters. The whole fruit bleeds a white latex that glues to knives and hands and will not wash off with water, so oil everything first.",
		season: [4, 5, 6, 7, 8],
		choose: "For ripe, a heavy fruit with a strong sweet smell and blunt spread-out spines that give under pressure. For cooking green, take it hard, unscented, and sharp-spined, or buy it canned in brine and never in syrup.",
		store: "Whole, cool and dry, 3 to 6 days, and it will scent the room. Cleaned bulbs keep 5 days refrigerated and freeze for a year. Seeds keep a month refrigerated and must be cooked before eating.",
		prep: "Oil knife, hands, and board against the latex. Ripe: quarter, cut away the pale core, pull the bulbs free, slit each and lift the seed out. Green: keep core and soft seeds, cut in wedges, boil 20 minutes salted, then shred. Boil or roast ripe seeds; raw seeds are not edible.",
		methods: ["braise", "simmer", "fry", "roast", "boil", "raw", "dehydrate"]
	},
	{
		t: "Key Lime",
		c: "The Fruit Atlas",
		d: "Citrus aurantiifolia, a different species from the Persian lime and not a small version of it: golf-ball sized, thin-skinned, full of seeds, and ripening to greenish yellow rather than holding green. The juice is more acidic and far more aromatic, its floral, almost herbal edge coming from a peel oil rich in citral. That is why a real key lime pie tastes the way it does, and the filling is chemistry rather than baking: the juice pulls the mix to casein's isoelectric point near pH 4.6, the micelles lose charge and set it cold, the brief bake being for the raw yolks, not thickening. Also sold as MEXICAN or WEST INDIAN lime. Yield is punishing, about 10 to 15 grams of juice per fruit or twenty to the cup, so buy a bagful and juice the whole lot at once.",
		season: [6, 7, 8, 9],
		choose: "Small, thin-skinned, heavy, skin turning from green to pale yellow: yellowing here means ripe, not old. Reject hard, thick-skinned fruit and any with sunken brown patches; a shriveled one gives almost nothing.",
		store: "Refrigerate in a loose bag at 4C (39F) for up to two weeks; at room temperature they dry to husks in days. Freeze the juice in cube trays for three months, and freeze the zest flat in a separate bag.",
		prep: "Zest first with a rasp: the flavedo is thin and the albedo sits right underneath. Halve across, work a wooden reamer, then strain, since the seeds are numerous, split easily and throw bitter limonin. Wash hands and boards after: the peel oil carries phototoxic furanocoumarins, and juice left on skin in sunlight raises real burns that blister a day later.",
		methods: ["raw", "baking", "curing", "marinating", "pickling", "preserving"]
	},
	{
		t: "Kiwi",
		c: "The Fruit Atlas",
		d: "A berry from a woody vine: green flesh, edible black seeds in a ring, pale core. Its enzyme is ACTINIDIN, a cysteine protease that stops gelatin setting, turns a dairy dessert thin and bitter within hours, and, with the calcium oxalate needles in the flesh, stings the mouth in quantity. That same protease is the major kiwi allergen: tingling and swollen lips, hives, and in some people anaphylaxis, most often in children and in anyone who reacts to latex, banana, or avocado, so ask before serving it raw. A quick puree tenderizes meat, thirty minutes maximum. Simmer puree to kill the enzyme, because a moment at 70 C (158 F) is not enough. Kiwi is climacteric and picked hard, ripening on ethylene from any apple or banana nearby. HAYWARD is the standard fuzzy green, Actinidia deliciosa, tart and vivid; GOLD types are A. chinensis, smooth-skinned, lower in acid, tasting of mango and melon.",
		season: [11, 12, 1, 2, 3],
		choose: "Plump and unwrinkled, giving slightly under gentle pressure at the stem end, skin unbroken. Buy hard and ripen at home. Reject shriveled fruit, soft wet patches, mold at the stem scar, and a fermented smell.",
		store: "Hard fruit keeps 4 weeks refrigerated, kept away from apples and bananas. To ripen, bag it with an apple at room temperature for 2 to 4 days. Ripe fruit holds 5 days cold; cut fruit goes slack within a day.",
		prep: "Top and tail, then peel with a vegetable peeler or slip a spoon between skin and flesh and rotate the fruit. The fuzzy skin is edible once rubbed down. Never set raw kiwi in gelatin or fold it into cream more than an hour ahead.",
		methods: ["raw", "blend", "juice", "macerate", "dehydrate"]
	},
	{
		t: "Lemon",
		c: "The Fruit Atlas",
		d: "Citrus limon, a hybrid of citron and sour orange, whose juice runs 5 to 6 percent citric acid at a pH near 2.3: low enough to denature protein without heat and to hold cut apples and artichokes against browning by shutting down polyphenol oxidase. Acid firms fish, it does not cook it, and kills neither parasites nor Vibrio, so ceviche starts with fish frozen for raw service. The FLAVEDO, the colored outer skin, carries limonene and citral in oil sacs and gives perfume with no sourness; the JUICE carries the acid and almost none of the aroma; the white ALBEDO between them is pectin and bitter limonin, which is why a hard-pressed lemon turns a vinaigrette harsh. EUREKA and LISBON are the supermarket standards, reliably sour. Heat drives off the top notes, so acid added at the start of a braise reads flat. Zest before you juice, and add the zest off the heat at the end.",
		season: [11, 12, 1, 2, 3, 4],
		choose: "Heavy for its size, with thin, tight, slightly pebbled skin that springs back; oil should mist when you scratch it. Reject puffy, lightweight fruit with coarse skin, which is thick albedo and little juice, and any soft brown spot: it spreads fast.",
		store: "In a closed bag in the crisper at 4C (39F) for a month; loose fruit dries hard in a week or two. Wipe fruit dry before bagging so it does not mold. Zest strips freeze well, and juice freezes in ice cube trays for three months.",
		prep: "Roll under your palm to burst the juice vesicles before cutting. Zest with a rasp on unwaxed fruit, turning as you go and stopping at the first white: the albedo is bitter. Scrub waxed fruit in warm water first.",
		methods: ["raw", "curing", "preserving", "roasting", "braising", "baking"]
	},
	{
		t: "Lime",
		c: "The Fruit Atlas",
		d: "Citrus latifolia, the PERSIAN or TAHITI lime: a seedless triploid, larger and thicker-skinned than a key lime and picked deliberately unripe, since a lime left on the tree turns yellow and goes flat. The juice runs around 6 percent citric acid, sharper than lemon, but the signature is peel oil, limonene with beta-pinene and citral, volatile enough that squeezed juice loses its top note within hours and tastes stale and soapy the next day. Squeeze to order; batching lime juice is the single most common bar and line error. The peel also carries furocoumarins, which react with sunlight on wet skin and raise a real blistering burn, so wash your hands after a day of juicing outdoors. Heat flattens it, so lime goes in at the end of the curry, never the start, and the zest goes in after the pan leaves the flame.",
		season: [5, 6, 7, 8, 9, 10],
		choose: "Glossy dark green, heavy for its size, skin thin and smooth with a slight give. Reject hard, light, dull fruit with dimpled skin, which is all peel and no juice, and yellowing fruit, which has lost its edge.",
		store: "Limes chill-injure below about 7C (45F), so a cold crisper pits and browns the skin within two weeks. Bag them and use the refrigerator door, or a week on the counter. Squeezed juice is finished within a few hours, so do not batch it ahead.",
		prep: "Roll firmly, then cut four cheeks off-center, missing the core: the fruit is seedless, but crushed pith turns the juice bitter. Zest before cutting. Wash hands and board afterward: the oil stains, and it burns skin in sunlight.",
		methods: ["raw", "grilling", "marinating", "curing", "pickling", "baking"]
	},
	{
		t: "Longan",
		c: "The Fruit Atlas",
		d: "Dimocarpus longan, the lychee's smaller, tougher cousin, called dragon eye for the black seed showing through translucent flesh. Its shell is tan and leathery rather than brittle and red, so it travels better and browns less visibly, holding about ten days cold. Like lychee it is non-climacteric: what you buy is as sweet as it will get. Less rose, more musk and honey, higher sugar and much lower acid, so a bowl of them cloys where lychee refreshes. Dried whole it is gui yuan, raisin-dark and chewy, for tonic soups, congee, and herbal broths; lychee is dried the same way and sold as lychee nut. One caution: exported longan is routinely fumigated with sulfur dioxide, which leaves sulfite in shell and flesh that sensitive asthmatics react to. Buy on the branch, since loose fruit is shaken off the stale end of a lot.",
		season: [8, 9],
		choose: "Tan, unblemished, firm shells with no give, still attached to green woody stems, and heavy in the hand. Shake the bunch and lose almost nothing. Reject split shells, sticky wet patches, and black mold at the stem.",
		store: "Refrigerate on the stem in a perforated bag up to 10 days. Dried longan keeps a year sealed and away from light; refrigerate it in humid weather or it sweats inside the jar and molds.",
		prep: "Crack the shell with a thumbnail or a gentle squeeze and peel it off; the flesh slips from the round seed with a pinch. Seeds are not edible. Add the flesh to soups late, since long simmering turns it rubbery.",
		methods: ["raw", "simmer", "poach", "dehydrate", "blend", "preserve"]
	},
	{
		t: "Lychee",
		c: "The Fruit Atlas",
		d: "A soapberry-family fruit: brittle red pericarp over a translucent white aril wrapped around one brown seed, perfumed with rose and citrus terpenes. It is NON-CLIMACTERIC and it travels badly. Water leaves the shell within a day of picking and polyphenol oxidase browns it, so a browned lychee is stale but sound, while a soft weeping one is fermenting; cold and humidity slow both. Two cautions. Unripe lychees carry hypoglycin A and MCPG, which block the body's own production of glucose; outbreaks of serious illness trace to undernourished children eating quantities of unripe fruit on an empty stomach, while ripe fruit with a meal is not a concern. And most exported lychee is fumigated with sulfur dioxide to hold that red, leaving sulfite in shell and flesh that sensitive asthmatics react to; a uniform pink shell and a struck-match smell are the tell. Buy it on the branch.",
		season: [6, 7],
		choose: "Bright pink-red, firm, fully rounded shells with a floral smell, ideally still on their twigs. A little brown is fine. Reject cracked, sticky, or weeping shells, gray-black patches, and any winey fermented smell.",
		store: "Refrigerate in a perforated bag or a covered box with a damp cloth, up to 7 days; they shrivel in dry air. Peeled fruit keeps 3 days under light syrup. Freeze them in the shell and peel straight from frozen.",
		prep: "Press the shell near the stem with a thumbnail until it splits, then peel it away in two pieces. Squeeze from the blossom end to pop the flesh free, cut down one side, and lift the seed out. The seed is not edible.",
		methods: ["raw", "poach", "blend", "macerate", "preserve"]
	},
	{
		t: "Mandarin",
		c: "The Fruit Atlas",
		d: "Citrus reticulata: one of the three ancestral citrus alongside the pomelo and the citron, and the parent behind the sweet orange and most hybrids in the aisle. The defining trait is mechanical. The albedo barely adheres to the flesh, so the peel lifts in one piece and the segments part clean, and that same loose structure means the fruit bruises and molds where an orange would shrug. Acid is low, near 0.7 percent, and sugar is high, so they read candy-sweet with almost no bite. The peel oil is not sweeter than an orange's but different: less limonene, with gamma-terpinene and methyl N-methylanthranilate behind the floral, faintly medicinal note. Dried and then aged for years, that peel is CHEN PI, kept in Chinese braises for the bitterness and aroma it turns against fat. Handle them like eggs and dry the peels instead of binning them.",
		season: [11, 12, 1, 2, 3],
		choose: "Heavy for its size, with a little give and an intact, unshriveled stem button. Gloss is packinghouse wax and deep color can be gassed on, so neither reads ripeness, and picked citrus never sweetens further. Reject light or hollow-feeling fruit, any soft watery spot, and any whitish bloom, which is mold taking hold.",
		store: "One week on the counter, two to three weeks in a single layer in the refrigerator at 4C (39F). They mold from contact, so never pile them in a closed bag, and pull any that softens the day you see it.",
		prep: "Peel from the blossom end and lift the skin away in sections; the white strands come off with a thumbnail. Save unwaxed peels whole, white side up, as chen pi keeps its albedo, and dry them until they snap rather than bend or they will mold in the jar. Segments break, so dress them last.",
		methods: ["raw", "braising", "baking", "preserving", "candying", "curing"]
	},
	{
		t: "Mango",
		c: "The Fruit Atlas",
		d: "A climacteric drupe: picked mature and hard, it ripens off the tree as ethylene drives amylases that cut flesh starch to glucose and maltose, which the fruit rebuilds into sucrose, while pectin softens and carotenoids flood the flesh orange. The skin and the milky stem sap carry urushiol relatives, the itch chemistry of poison ivy, so anyone sensitive to that plant can raise a rash on hands and lips, often a day or two later. Variety sets the ceiling, ripeness decides whether you reach it. ALPHONSO and CARABAO are fiberless and perfumed; TOMMY ATKINS is bred for shipping, red-blushed, bland and stringy; ATAULFO, sold as honey or champagne, is small, yellow, and buttery. Judge by the smell at the stem end and by an even give under the palm, never by the red cheek, which is sun exposure and tells you nothing about sugar.",
		season: [4, 5, 6, 7],
		choose: "Heavy for its size, a resinous fruit perfume at the stem end, and flesh that yields evenly to gentle palm pressure. Light wrinkling at the shoulder means ready. Reject black sap streaks, sloshing flesh, and hard fruit with no smell.",
		store: "Ripen at room temperature, stem down, in paper; a banana in the bag speeds it. Once soft, refrigerate up to 5 days. Below 10 C (50 F) unripe fruit chills, grays under the skin, and never ripens properly.",
		prep: "Stand it on the stem end, cut down either side of the flat pit, cross-hatch each cheek and push the skin inside out. Pare the center collar and carve the rest off the pit. Skin is edible but bitter and can raise a rash.",
		methods: ["raw", "grill", "roast", "pickle", "dehydrate", "blend"]
	},
	{
		t: "Mangosteen",
		c: "The Fruit Atlas",
		d: "Thick purple pericarp, snow-white segmented aril inside, and a flavor people reach for adjectives about: peach and lychee with a clean citrus finish. The rind is the entire practical problem. It is loaded with tannins and a yellow latex that stains cloth permanently and tastes bitter and drying, so rind juice must never touch the flesh: cut shallow, never all the way through. Count the flower-shaped lobes on the base and you know how many segments are inside, and the largest segment carries the one seed to work around. As the fruit ages the rind hardens from supple to woody, which is drying rather than ripening: a rock-hard shell means shrunken or spoiled flesh inside no matter how good the color looks.",
		season: [5, 6, 7, 8],
		choose: "Deep purple-brown, rind that yields a little to a firm squeeze, green supple calyx, heavy for its size. Reject rock-hard shells, cracked or leaking fruit, a hardened brown calyx, and any that rattle when shaken.",
		store: "Hold it cool, not cold: near 55F it keeps 2 weeks. Cold, not dry air, is what hardens the rind shut and browns it, so refrigerate only in the warmest spot and eat inside a week. Segments keep 2 days, and it freezes better whole than cut.",
		prep: "Score around the equator through the rind only, about 6 mm deep, and twist the halves apart, or press until the shell cracks. Lift the white segments out with a fork. Keep the staining latex off clothes and cutting boards.",
		methods: ["raw", "blend", "poach", "macerate", "preserve"]
	},
	{
		t: "Medlar",
		c: "The Fruit Atlas",
		d: "Mespilus germanica, picked hard in late autumn and then deliberately taken to the edge of rot in a controlled way: BLETTING. Until it blets, the fruit is stone hard and tannic. Laid eye down on straw, stalk up, in a cool shed, or given a frost first, it takes two to four weeks to change: cell walls break down, acids fall, starch turns to sugar, and the tannins polymerize out of astringency. The flesh goes from white to the color and texture of apple butter, and tastes of baked apple, date, and old wine. It is ready when the skin wrinkles and the fruit yields like a soft persimmon, and it is one step from spoiled, so smell it each time. Scoop the pulp with a teaspoon, sieve out the five hard pips, and serve it as a paste with game and hard cheese, or set it as a jelly.",
		season: [11, 12, 1],
		choose: "Buy them hard and unbletted where you can: brown-green, the dried calyx still open at the crown, skin unsplit. Already bletted fruit should be evenly wrinkled and soft throughout. Reject mold in the open crown and any sour, fermented smell.",
		store: "Blet them in a single layer, eye down and stalk up, in a cool dry place at 4 to 10C (39 to 50F), fruit not touching, checked daily from the second week. Throw out any fruit growing fuzzy mold rather than cutting around it, since mold runs through soft flesh. Once soft, refrigerate and use within three or four days: the line between bletted and fermented is thin.",
		prep: "There is no real knife work: halve each fruit, scoop the pulp with a teaspoon, and push it through a fine sieve to lose the skin and the five large pips. Roughly 500g of fruit yields 250g of puree. It darkens further on standing, which is harmless.",
		methods: ["raw", "preserving", "baking", "poaching", "stewing"]
	},
	{
		t: "Meyer Lemon",
		c: "The Fruit Atlas",
		d: "A lemon and mandarin hybrid, not a sweet lemon: the mandarin parent cuts the acid to roughly 3 to 4 percent citric and raises the sugar, so the juice reads round and floral where a Eureka reads sharp. The skin is thin, smooth and deep yellow-orange, its oil carrying a thyme and bergamot note absent from true lemons, and the albedo is shallow and barely bitter, which is why the whole fruit can go into a cake batter or a relish. That low acid is a liability as often as a gift: it reads flabby in a vinaigrette, will not reliably acidify a brine, and is no stand-in for the bottled juice a canning recipe calls for. Curd still sets, since the set is yolk protein and butter, not acid, but it tastes flat unless you add Eureka juice. Nearly all commercial fruit is IMPROVED MEYER, clean stock selected in the 1970s after the original carried a virus. Use it where perfume is the point.",
		season: [11, 12, 1, 2, 3],
		choose: "Deep egg-yolk orange, thin skin you can dent with a thumbnail, fragrant through the bag. Reject green-shouldered fruit, which never develops perfume, and any soft at the stem end: the thin skin bruises and rots faster than a Eureka.",
		store: "More perishable than a true lemon. Refrigerate at 4C (39F) and use within two weeks, one week on the counter. Do not seal in plastic; the thin skin sweats and molds. Zest and freeze the skins when the fruit starts to turn.",
		prep: "Skin, pith and all is usable, so slice whole and paper-thin for salads and roasting. Pick out the seeds, which are plentiful and turn bitter when crushed. Zest lightly: the flavedo is thin and gives up albedo quickly.",
		methods: ["raw", "baking", "roasting", "preserving", "curing", "poaching"]
	},
	{
		t: "Mulberry",
		c: "The Fruit Atlas",
		d: "A multiple fruit, grown from a cluster of flowers rather than one, which is why it looks like a long blackberry and keeps a thin green stalk. Three species matter: BLACK MULBERRY, Morus nigra, small, wine-dark, sharply acid and deeply aromatic, the one worth cooking with; RED MULBERRY, Morus rubra, the wild tree of eastern North America, nearly as good; WHITE MULBERRY, Morus alba, pale, cloying and close to sugar alone. Ripe fruit is too soft to pick without crushing, which is why shops never carry it: the harvest is a sheet under the tree and a shaken branch. The juice stains violently, its anthocyanins reading the pH of what they land on. All are low in pectin, and only nigra brings its own acid, so the pale ones need lemon as well. Cook within a day and wear old clothes.",
		season: [6, 7, 8],
		choose: "Almost black fruit that stains the fingers and drops at a touch. Red is an unripe stage, not a species: the American red mulberry also ripens near black. Reject firm bright fruit and anything gripping the branch.",
		store: "Refrigerate in one shallow unwashed layer and use within 24 hours, because they weep and ferment quickly. For anything longer, open-freeze on a lined tray, then bag them for later cooking.",
		prep: "Leave the stalks on for cooking, where they soften unnoticed; snip them only for a raw bowl. Discard unripe red and green fruit: they and their milky sap bring nausea and cramps. Wash only if you must, never under a running tap, which pulps them. Handle the fruit once.",
		methods: ["raw", "baking", "preserving", "stewing", "freezing"]
	},
	{
		t: "Nectarine",
		c: "The Fruit Atlas",
		d: "Not a cross with a plum and not a hybrid at all: a nectarine is Prunus persica, the same species as the peach, carrying a recessive allele at a single locus that switches the fuzz off. Two copies and you get smooth skin, and a peach tree can throw a nectarine branch or the reverse. The consequences are practical. With no trichomes to shed water, the skin cracks in wet weather and shows every knock, so nectarines bruise harder and are picked firmer. The flesh runs a little denser and more aromatic, the acid a touch higher, and the skin is thin enough that you never need to slip it: leave it on and it holds a grilled half together over the fire. Freestone and clingstone apply here exactly as they do to peaches. Ripen on the counter, then use within two days, skin and all.",
		season: [6, 7, 8],
		choose: "Ground color yellow or cream with no green, a clear perfume, and slight give at the shoulder. Skin should be glossy and taut. Reject fine brown scarring, split skin near the stem, and any soft patch, which spreads fast in a smooth-skinned fruit.",
		store: "Ripen at room temperature in a single layer, fruit not touching, for one to three days. Cold storage before ripeness leaves the flesh dry and cottony. Once ripe, refrigerate at 2 to 4C (36 to 39F) and use within two days.",
		prep: "No peeling and no blanching: the skin is thin and carries color and acid. Cut around the crease to the stone and twist; on a clingstone, cut wedges off the stone. Brush cut faces with oil for the grill, or lemon to hold color. Peel for anyone who reacts to raw stone fruit: the skin carries the most allergen.",
		methods: ["raw", "grilling", "roasting", "baking", "poaching", "preserving"]
	},
	{
		t: "Orange",
		c: "The Fruit Atlas",
		d: "Citrus sinensis, itself an ancient pomelo and mandarin cross, and the split that matters in a kitchen is NAVEL against VALENCIA. Navels are seedless, easy to segment and best eaten out of hand, but their juice turns bitter within the hour as acid turns a tasteless precursor into limonin, the delayed bitterness reaction. Valencias carry seeds, peel badly and juice beautifully, staying sweet for hours; in warm weather ripe skin can green again as chlorophyll returns, which says nothing about the inside. Skin color is a poor guide; oranges are picked ripe and never sweeten off the tree. The juice runs about 1 percent acid against 10 percent sugar, and that acid inverts the sucrose as it reduces, so the last stage goes from syrup to scorched fast: pull it early. Buy navels to eat and Valencias to squeeze.",
		season: [11, 12, 1, 2, 3, 4, 5, 6, 7, 8],
		choose: "Heavy for its size, firm, fine-grained skin, no give at the stem end. Green patches and brown russeting are cosmetic and often mark good fruit; reject anything light and puffy, or soft at the navel, where rot begins.",
		store: "Two weeks on the counter, five to six weeks loose in the refrigerator at 4C (39F). Stacked in a sealed bag they sweat and mold, so keep them in a single layer and pull any fruit that softens the day you notice it.",
		prep: "For supremes, cut off both ends, stand the fruit up and cut peel and white away following the curve, then cut between the membranes over a bowl. Zest before peeling, never after, and only the colored layer.",
		methods: ["raw", "roasting", "braising", "baking", "candying", "preserving"]
	},
	{
		t: "Papaya",
		c: "The Fruit Atlas",
		d: "A giant berry from a fast-growing soft-stemmed herb, mild, musky, and defined by its enzyme. Unripe green fruit bleeds a white latex rich in PAPAIN, a protease sold as meat tenderizer: it stops gelatin setting, curdles milk, and turns a raw dressing thin and bitter within the hour. Papain is heat stable and fastest near 65 C (149 F), so a warm pan only speeds it up; only a simmer near 85 C (185 F) stops it. Green fruit works as a vegetable because the flesh is firm and unsweet, shredded for som tam, crunchy and faintly bitter. Ripe fruit turns orange to salmon, softens as pectin breaks down, and owes its musky note to benzyl isothiocyanate, a sulfur compound: a squeeze of lime converts it from odd to excellent. Small SOLO types are sweetest; large MARADOL is milder.",
		season: [],
		choose: "At least half yellow-orange, giving at the blossom end, smooth-skinned, with a faint sweet smell. Reject rock-hard all-green fruit if you want it ripe, sunken soft spots, weeping stem scars, and a sour fermented smell.",
		store: "Ripen at room temperature 3 to 5 days, then refrigerate up to 1 week. Unripe fruit chills below about 12 C (54 F) and will never sweeten, so leave it on the counter until it colors. Cut halves keep 3 days wrapped, cut face against the wrap.",
		prep: "Halve lengthwise, scoop the black seeds, peppery and good crushed into a dressing by the spoonful rather than the handful, then peel with a vegetable peeler. Green fruit is the hazard: raw latex digests skin protein, stings cuts and eyes, and can set off a reaction in anyone allergic to rubber latex, so wear gloves and rinse the shreds well. Unripe fruit and its latex are avoided in pregnancy; ripe flesh is fine.",
		methods: ["raw", "blend", "pickle", "braise", "grill", "dehydrate"]
	},
	{
		t: "Passionfruit",
		c: "The Fruit Atlas",
		d: "The fruit of a climbing vine, and what you eat is not flesh but ARIL: every black seed sits in its own sac of aromatic orange pulp, loose inside a hard hollow rind. The perfume is sulfur chemistry, the same class of thiols that gives blackcurrant its snap, which is why one spoonful scents a whole dessert. Acidity is high, near pH 3, so it cuts cream, sets a curd tight on egg alone, and holds its color without browning. PURPLE types (Passiflora edulis) are smaller and more perfumed; YELLOW types (f. flavicarpa) are larger, sharper, and juicier. Full even color is the ripeness signal; the wrinkling that follows is water leaving the rind, so acid falls and the juice concentrates, but no sugar is added and a hard-shriveled fruit is drying out.",
		season: [7, 8, 9, 10],
		choose: "Deep even color, purple or gold, and real weight for the size. Some wrinkling concentrates; heavy shrivel means lost juice. Smooth fully colored fruit is good, just sharper. Reject green shoulders, light hollow fruit, soft or moldy stem scars, and leaks.",
		store: "Room temperature until well wrinkled, then refrigerate up to 2 weeks. Pulp freezes perfectly in ice cube trays, seeds and all, for a year, and loses almost nothing of its perfume.",
		prep: "Cut across the equator with a serrated knife and spoon the pulp out over a bowl, since it runs. To strain, warm to 140F or pulse 3 seconds so the sacs split, then sieve without cracking the seeds. Hotter than that and the sulfur perfume leaves with the steam.",
		methods: ["raw", "blend", "simmer", "macerate", "preserve"]
	},
	{
		t: "Peach",
		c: "The Fruit Atlas",
		d: "Prunus persica: the fuzz is a real botanical structure, trichomes, and it is why the skin grabs at your teeth and why most cooks slip it off. Sugar is fixed at the moment of picking, so a peach picked green never gets sweeter, only softer; what days on the counter add is juice, aroma, and the breakdown of pectin. FREESTONE varieties release the pit cleanly and are what you want for halving, grilling, and tarts; CLINGSTONE holds fast to the stone, runs earlier and firmer, and is what the canneries buy. Yellow flesh keeps more acid and stands up to heat; white flesh is lower in acid, tastes sweeter, and bruises if you look at it. The kernel inside the stone holds amygdalin, which its own enzyme turns to cyanide when crushed: flavoring only, never a nut. Ripen on the counter, shoulder down, and chill only once ripe.",
		season: [6, 7, 8],
		choose: "Read the ground color around the stem: cream or gold, never green. It should smell like a peach at arm's length and give slightly at the shoulder. Red blush is variety, not ripeness. Reject flat, dull, hard fruit and any with a soft brown bruise.",
		store: "Ripen at room temperature, shoulder down, out of the sun, one to three days. Mealy, woolly flesh comes from days at 2 to 8C (36 to 46F), which is where a home refrigerator sits, so refrigerate only ripe fruit and only for three days.",
		prep: "To skin them, score a cross at the base, dip in boiling water for 20 to 30 seconds, then into ice water: the skin slips. On a freestone, cut around the crease to the stone and twist the halves apart. Cut flesh browns, so keep lemon at hand.",
		methods: ["raw", "grilling", "roasting", "poaching", "baking", "preserving"]
	},
	{
		t: "Pear",
		c: "The Fruit Atlas",
		d: "The European pear, Pyrus communis, will not ripen well on the tree: left hanging it softens unevenly and the core goes brown. The grit is not late lignin, since stone cells are laid down early in the fruit's growth. Picked mature and hard, it ripens from the inside out, which is why you test the NECK with your thumb and never the belly: by the time the belly yields, the center is mush. The Asian pear, Pyrus pyrifolia, is the exception, picked ripe and eaten crisp. BARTLETT, sold in Europe as WILLIAMS, goes yellow and perfumed and is the poaching and canning pear. BOSC stays firm through heat and is the one for roasting and tarts. COMICE is the eating pear and falls apart cooked. Buy hard, ripen in a paper bag, use on the day the neck gives.",
		season: [8, 9, 10, 11],
		choose: "Buy hard and unblemished, stem intact, skin clean, and ripen at home. Press the shoulder beside the stem with your thumb: slight give means eat today. Reject fruit soft at the belly, brown around the stem, or bruised, since bruises run deep into the flesh.",
		store: "Ripen at room temperature, faster in a paper bag with a banana. Once the neck gives, refrigerate at 1 to 3C (34 to 37F) and use within three days. Hard pears hold for weeks in the cold, which pauses ripening rather than reversing it.",
		prep: "Peel thinly with a swivel peeler, halve, and scoop the core with a melon baller or teaspoon, then pull out the fibrous string running up to the stem. The flesh browns fast, so hold cut fruit in lemon water or in the poaching liquid itself.",
		methods: ["raw", "poaching", "roasting", "baking", "grilling", "preserving"]
	},
	{
		t: "Pineapple",
		c: "The Fruit Atlas",
		d: "A bromeliad whose fruit is a hundred-odd small berries fused around a central stem, which is why the eyes spiral and the core stays woody. It is NON-CLIMACTERIC: cut from the plant it holds all the sugar it will ever have, so a pale cheap pineapple stays sour and merely rots softer. The flesh carries BROMELAIN, a protease strong enough to stop gelatin setting (no fresh pineapple in jelly or panna cotta; canned is heated and safe), to curdle dairy on standing, and to etch your own tongue raw if you eat a lot at one sitting. It dies near 70 C (158 F) and not from cold: fruit simmered or roasted through behaves with cream, a quick grill kills only the surface, and frozen flesh is fully live. Buy by smell at the base: sweet and resinous, never vinegary.",
		season: [3, 4, 5, 6, 7],
		choose: "Heavy for its size, gold at the base, broad flat eyes, and a sweet resinous smell where the stem was cut. Leaves should sit firm; the pull-a-leaf test proves nothing. Reject green shoulders, soft brown patches, and a boozy smell.",
		store: "Whole at cool room temperature up to 3 days, stood any way up since sugar never migrates in a picked fruit; refrigerated whole up to 5 days. Cut it lengthwise so each wedge carries sweet base and leaner shoulder. Cut flesh keeps 3 days sealed in the refrigerator and freezes well for blending.",
		prep: "Cut off crown and base, stand it up, pare the skin off in downward strips, then cut shallow diagonal trenches to lift out the rows of eyes. Quarter and cut away the core. Long handling of raw flesh stings broken skin.",
		methods: ["raw", "grill", "roast", "simmer", "pickle", "dehydrate"]
	},
	{
		t: "Plantain",
		c: "The Fruit Atlas",
		d: "A cooking banana: more starch, less sugar, and flesh firm enough to hold a knife cut, which is why it is a vegetable staple across West Africa, the Caribbean, and Latin America rather than a snack. Ripeness is the entire recipe, and it moves through three cooks' stages. GREEN is chalky and astringent: boiled and pounded for fufu, fried then mashed for mofongo, or twice-fried into tostones. YELLOW with black flecks is the middle ground, still firm, good in stews and mashes. BLACK, sold as maduro, is nearly all sugar and caramelizes to a jammy slice in shallow fat. Raw green flesh is resistant starch and tannin, chalky and drying in the mouth; raw black flesh is edible but flat and cloying, so both go to heat.",
		season: [],
		choose: "Match the stage to the dish: hard bright green for tostones, yellow flecked black for stews, fully black and soft for maduros. Reject cracked weeping skins, dry hollow-feeling fruit, and any gray mold at the cut stem.",
		store: "Room temperature, where they run green to black over one to two weeks. Hold a batch in the refrigerator once yellow: the skin blackens but the flesh stays put. Fried plantain keeps 3 days and freezes well.",
		prep: "Green ones will not peel like a banana: top and tail, score the skin along its ridges, and lever it off with a thumb or a spoon. The sap stains hands and boards brown, so oil your knife and soak cut green slices in salted water.",
		methods: ["fry", "deep-fry", "boil", "roast", "grill", "bake"]
	},
	{
		t: "Plum",
		c: "The Fruit Atlas",
		d: "Two species carry the name at a market. Prunus salicina, the Japanese plum, is the round, red or black, juicy one sold for eating out of hand; Prunus domestica, the European, is smaller, denser, oval, usually purple or gold, and is the one that cooks and dries. A third, Prunus mume, is sold as ume and labeled Japanese plum just as often, and it is not this fruit: green mume and its kernel are cyanogenic, and it is eaten only salted, pickled or steeped, never raw. In a true plum the malic acid sits in the flesh; the skin adds tannin, anthocyanin and pectin, which is why a peeled plum tastes sour but hollow and why plum jam sets with little help. Japanese types ripen at room temperature and go to liquid at the stone if pushed; European prune plums are freestone, hold shape under heat, and take a long bake without weeping. Buy the dense oval ones for cooking, skin on.",
		season: [7, 8, 9],
		choose: "Heavy and firm, with the powdery gray bloom intact, which shows it has not been handled; a ripe one gives at the stem end and smells sweet. Reject brown soft spots, split skin, and shriveled shoulders, and skip anything hard and pale.",
		store: "Firm fruit ripens at room temperature in one to three days. Once it gives, refrigerate at 2 to 4C (36 to 39F) for up to five days. Do not wash off the bloom until you use them: it is a natural barrier against water loss and mold.",
		prep: "Never peel. Cut around the crease and twist for freestone types; for clingstone Japanese plums, cut wedges off the stone. Cut flesh browns slowly, so there is time. For jam, weigh the skins in: they carry the pectin, the tannin and the color, while the acid is already in the flesh.",
		methods: ["raw", "baking", "roasting", "stewing", "preserving", "grilling"]
	},
	{
		t: "Pluot",
		c: "The Fruit Atlas",
		d: "A trademarked interspecific hybrid, bred by Floyd Zaiger from repeated crosses of plum and apricot and weighted roughly three parts plum to one apricot; a PLUMCOT is the even cross and an APRIUM leans the other way. The breeding was for sugar and it shows: many pluots run 18 to 22 Brix where the plums beside them run nearer 12 to 16. The acid was not pushed into the skin, it was bred down, and a pluot is the sweeter and the slacker for it; the skin carries tannin and color. The flesh is denser and less watery than a plum, so it neither collapses on the grill nor weeps into a tart. DAPPLE DANDY, sold as Dinosaur Egg, is mottled green and red over pale flesh streaked crimson; FLAVOR KING is the perfumed one, red to the stone. Buy firm but not rock hard, ripen on the counter, and sugar less than you would a plum.",
		season: [6, 7, 8, 9],
		choose: "Firm with slight give at the stem end, heavy, bloom intact, and fragrant through the skin. Mottled speckling is the variety, not a flaw. Reject rock-hard fruit picked too early, which never sweetens, and anything with brown soft patches or shriveling.",
		store: "Ripen at room temperature for one to three days, then refrigerate at 2 to 4C (36 to 39F) for up to a week. The high sugar means an overripe one ferments rather than simply rotting, so smell the stem end before you cut into it.",
		prep: "Leave the skin on: it carries the tannin and color that keep the sugar from reading flat. Most are clingstone or semi-cling, so cut wedges off the stone rather than halving and twisting. Cut thicker than a plum, since the dense flesh takes direct heat well.",
		methods: ["raw", "grilling", "roasting", "baking", "preserving", "poaching"]
	},
	{
		t: "Pomegranate",
		c: "The Fruit Atlas",
		d: "A leathery hide packed with hundreds of ARILS, each a seed inside a juice-filled sarcotesta, divided by bitter white pith membranes. The red is anthocyanin and the astringency in rind and pith is tannin, which together make a dye rather than a spill: pomegranate juice on a white apron is permanent, so wear dark and work on a scarred board. It is non-climacteric and gains nothing after picking, but the rind dries and hardens over weeks while the arils inside stay full, which is why a scuffed, square-shouldered, heavy fruit usually beats a flawless round one. WONDERFUL dominates the trade, deep red and tart-sweet; older varieties run from pale pink and floral to almost black and syrupy.",
		season: [10, 11, 12],
		choose: "Heavy for its size, skin taut and slightly flat-sided rather than perfectly round, which means the arils inside are crowded and full. Reject light round fruit, soft mushy spots, cracks, and hard brown dried-out patches.",
		store: "Whole fruit keeps 1 month cool and dark and up to 2 months refrigerated, the skin leathering while the arils hold. Loose arils keep 5 days sealed in the refrigerator and freeze loose on a tray for a year.",
		prep: "Score the crown and the ridges, break the fruit open along its natural segments instead of cutting through arils, then pull it apart underwater in a bowl: pith floats, arils sink. Skim, drain, and discard all pith, which is purely bitter.",
		methods: ["raw", "juice", "simmer", "blend", "preserve"]
	},
	{
		t: "Pomelo",
		c: "The Fruit Atlas",
		d: "Citrus maxima, the largest citrus and one of the three ancestors, with the mandarin and the citron, of nearly everything else in the aisle. It is built differently. Under a thick green-to-yellow rind sits an albedo two fingers deep, and inside that the segments are wrapped in tough, bitter membranes that have to come off. The reward is the flesh, whose juice vesicles are large, firm and dry and stay separate instead of collapsing, so pomelo holds its texture in a salad where an orange would weep and turn the dressing to juice: that is the whole point of a Thai yam som-o. Cultivars run from honeyed to sharply bitter, in the pulp as much as the membrane, so taste before you build on it. It is grapefruit's parent and carries the same furanocoumarins: they shut down intestinal CYP3A4 for a day or more and raise blood levels of many statins, calcium channel blockers and immunosuppressants, so offer a guest on those an alternative.",
		season: [11, 12, 1, 2],
		choose: "Very heavy for its size, rind firm, taut and fragrant, with a little give but no soft patches. Reject a light fruit, which is dry inside, and any with a wrinkled or dull rind: that one was picked a long time ago.",
		store: "Three to four weeks at room temperature, which suits it: the deep albedo is a water store and the thick rind barely evaporates. Cold buys little. Once peeled, the segments keep three days covered and dry out within hours if you leave them uncovered.",
		prep: "Score the rind top to bottom in quarters, cutting only through the peel, then lift it off. Break the fruit in half, strip the membrane from every segment with a thumbnail, and pull the flesh into large shards.",
		methods: ["raw", "candying", "preserving", "braising", "steaming"]
	},
	{
		t: "Prickly Pear",
		c: "The Fruit Atlas",
		d: "TUNA, the fruit of the Opuntia cactus, and what earns it respect is GLOCHIDS: hair-fine barbed spines in tufts across the skin that detach on contact, lodge in fingertips, and are far worse to remove than the obvious large spines. Market fruit has usually been brushed or singed, but assume it has not and handle it with tongs. Inside, the color is betalain pigment, the same family as beetroot, running from pale green through gold to shocking magenta: water-soluble, staining, and faded by long heat. Flavor is mild and floral, watermelon meeting bubblegum. The pulp sits near pH 5.5, above the 4.6 line, so lime is not only flavor: anything canned must be acidified first. The hard seeds are edible but tooth-cracking, and swallowed in quantity they can block the gut, so strain the pulp for juice, syrup, and sorbet rather than eating it in the hand.",
		season: [8, 9, 10],
		choose: "Firm with a slight give, unshriveled. Red and gold types should be deep and even, but green and white cultivars ripen green: read a flattened crown and tufts that rub off. Reject weeping fruit, moldy scars, and wrinkled skin.",
		store: "Refrigerate 5 days to 1 week in a bag, since they bruise and mold wherever they touch. Strained pulp keeps 3 days refrigerated and freezes 6 months, holding its color best frozen and out of the light.",
		prep: "Hold it with tongs, never bare hands. Burn the glochids off over a flame or scrub under running water with a stiff brush, then cut both ends off, score the skin lengthwise, and peel it back with a fork. Puree and strain out the seeds.",
		methods: ["raw", "juice", "blend", "simmer", "preserve"]
	},
	{
		t: "Quince",
		c: "The Fruit Atlas",
		d: "Cydonia oblonga, hard as a turnip and astringent enough to strip your mouth: raw quince is inedible, and that is the fruit's nature, not a defect. Long, slow heat does two things. It breaks the cell walls down to tenderness, and it drives the colorless procyanidins into cyanidin and red-brown polymers, so the white flesh goes amber, then rose, then garnet over three or four hours of poaching. The pigment is built by heat, not released, so rushing kills the color, and so does too little acid. The other gift is pectin, more than almost any fruit and concentrated in core and peel: simmer the trimmings in the syrup and strain, and the liquid sets into jelly or into MEMBRILLO, the sliceable paste for cheese. Peel it, cook it in quarters with sugar and lemon at a bare tremble, and give it the hours it asks for.",
		season: [10, 11, 12],
		choose: "Large, heavy, and rock hard, downy gray fuzz still on the skin, with a perfume you can smell across the room. Yellow all over means ripe; green means unripe and flavorless. Reject black bruises and soft brown patches, which run to the core.",
		store: "A hard quince keeps a month in a cool room and three in the refrigerator at 2 to 4C (36 to 39F). The perfume is aggressive and will get into butter, cream, and milk, so store it well away from anything fatty, or store it wrapped.",
		prep: "Rub off the fuzz, then peel with a knife rather than a peeler, since the flesh fights you: work in quarters on a board that will not slide. It browns almost instantly, so drop the pieces into lemon water. Keep peel and cores for their pectin, but tie them in cloth and lift them out whole, since the pips carry amygdalin like apple pips: never blend them into the paste.",
		methods: ["poaching", "baking", "roasting", "stewing", "preserving", "braising"]
	},
	{
		t: "Rambutan",
		c: "The Fruit Atlas",
		d: "Same soapberry family as lychee, wearing a hairy red shell whose soft spines, properly spinterns, are its whole identity: they are pliable rather than sharp, and they dry and blacken within days of harvest, which makes them the best freshness clock on the market shelf. The aril inside is firmer and less perfumed than lychee, more grape than rose, with a clean sweet-acid balance. Two structural facts matter at the bench. Most rambutans are CLINGSTONE: the flesh grips the seed and a thin papery testa peels away with it, edible but tasting of tannin and wood, so strip it off. And the seed itself is never eaten raw. Freestone cultivars exist and are worth paying for if you are stuffing them.",
		season: [7, 8, 9, 10, 11],
		choose: "Scarlet to deep red shells with pliable hairs, most of them still green-tipped and none of them black. Firm, heavy, no give under the thumb. Reject blackened dried spines, shriveled shells, weeping stems, and sourness.",
		store: "Refrigerate in a perforated bag with a damp cloth, 7 to 10 days. Blackened spinterns are water loss, not spoilage: they go in 2 or 3 days while the aril under the shell stays sound, so judge by squeezing for firmness. Peeled flesh keeps 2 days in light syrup.",
		prep: "Score around the equator with a knife tip, just through the shell, twist the halves apart, and the ball of flesh pops out. Pinch out the seed. On clingstone fruit the brown papery testa stays on the flesh, not on the seed: pick it off there. Discard the seeds.",
		methods: ["raw", "poach", "macerate", "blend", "preserve"]
	},
	{
		t: "Raspberry",
		c: "The Fruit Atlas",
		d: "An aggregate fruit: 60 to 100 separate drupelets, each with its own skin, pulp and seed, clinging in a hollow thimble because the receptacle stays behind on the cane. That hollow is the problem: no structural center, only fine hairs holding drupelet to drupelet, so fruit at the bottom of a deep punnet is crushed by the fruit above. Climacteric, the odd berry out: it keeps respiring and making ethylene off the cane, so it softens overnight, though with no starch it gains no sugar. An ionone perfume over real acid, around pH 3.2, which is why raspberry cuts cream and chocolate where strawberry only sweetens. Moderate pectin, so jam sets with lemon and a hard rolling boil. Buy in shallow punnets, check the underside first, use them the same day.",
		season: [6, 7, 8, 9],
		choose: "Deep matte color, drupelets plump and intact, the fruit light and dry in the hand. Reject juice staining the base of the punnet, white core still clinging inside, or berries that have begun to weep.",
		store: "Refrigerate unwashed in the shallow punnet, one or two layers deep, for 24 to 48 hours. Mold travels on contact, so lift out suspects at once. Open-freeze on a tray, then bag them for sauces.",
		prep: "Do not wash unless you must: they take on water and slump. Tip them onto a tray and pick over instead. For coulis, blend raw and push through a fine sieve, because the seeds carry the bitterness.",
		methods: ["raw", "macerating", "preserving", "baking", "freezing"]
	},
	{
		t: "Redcurrant",
		c: "The Fruit Atlas",
		d: "Tiny translucent berries hanging on a STRIG, the slender stem that carries the whole bunch, and they hold more acid and pectin than almost anything else in the fruit room: a pH near 3.0 and enough setting power that redcurrant jelly needs only sugar and heat, never a commercial pectin. That is why it is the backbone of cumberland sauce and the glaze on a fruit tart, since it sets clear and sharp rather than sweet and cloudy. Raw they are mostly acid over a thin perfume, so their work is garnish and counterweight to fat: game, duck, pork, oily pastry. The seeds turn gritty in quantity. Simmer with a splash of water until it collapses, drip through cloth overnight without squeezing, then boil equal weights of juice and sugar to 105C (221F).",
		season: [6, 7, 8],
		choose: "Glossy, translucent, jewel-red berries gripping intact strigs, with no shriveled or browning fruit in the bunch. A dull skin, or a bare stretch of stem, means juice has already been lost.",
		store: "Refrigerate on the strig, unwashed, in a covered box for up to a week. Freeze them on the strig as well: the berries strip off cleanly while still frozen, which beats stripping them fresh.",
		prep: "Rinse on the strig, then strip with a fork, running the tines down over a bowl. For jelly do not strip: the cloth takes out stems and seeds together, and boiled stems turn tannic.",
		methods: ["preserving", "simmering", "raw", "glazing", "poaching"]
	},
	{
		t: "Seville Orange",
		c: "The Fruit Atlas",
		d: "Citrus aurantium, the bitter or sour orange: rough, thick-skinned, seedy, sour as a lemon at near 5 percent acid, and loaded with the limonoids and the flavanone neohesperidin that make it inedible raw and perfect cooked. Its point is structure. Pith and seeds are dense in pectin, and the juice pulls the pan to about pH 3, the window where high-methoxyl pectin will gel, so Seville marmalade needs nothing added but sugar. Boil to 105C (221F), which only tells you the syrup has reached roughly 65 percent sugar; the gel itself forms as the jars cool. The juice, sour and faintly resinous, is the acid in a Yucatecan recado, a Cuban mojo and the classic bigarade sauce for duck. The same tree gives neroli from its blossom and petitgrain from its leaves. The season is a few weeks around January and nothing substitutes cleanly, so buy a case when it lands and freeze the fruit whole.",
		season: [12, 1, 2],
		choose: "Rough, knobbly, deep orange skin and real weight in the hand; the ugliness is the variety, not a fault. Reject smooth, light fruit, which is probably a sweet orange, and any soft or molded one, since one bad fruit spoils a batch.",
		store: "Two weeks in the refrigerator at 4C (39F). For the year ahead, freeze them whole in bags; the peel softens on the way back to room temperature, which only helps marmalade. Frozen juice keeps six months, seeds keep for pectin.",
		prep: "Scrub, halve, juice, then pick every seed and loose membrane into a muslin bag: that bag is your pectin. Shred the peel with the pith attached, thin for a fine cut, and simmer until a shred crushes between two fingers. The juice and peel carry the same furanocoumarins as grapefruit and block the gut enzyme that clears many prescriptions, boiling included, so anyone told to avoid grapefruit should avoid the marmalade and the mojo too.",
		methods: ["preserving", "candying", "braising", "simmering", "marinating", "baking"]
	},
	{
		t: "Sour Cherry",
		c: "The Fruit Atlas",
		d: "Prunus cerasus, a separate species from the sweet cherry rather than a sour version of it: tetraploid, smaller-treed, hardier, and carrying something like 1.5 to 2 percent malic acid against the sweet cherry's half percent. That acid is the reason it is the pie cherry. Sugar and heat flatten a sweet cherry and wake a sour one, because the acid survives cooking and holds the flavor up against pastry and cream. Two families: MORELLO has dark flesh and red juice; AMARELLE, which includes MONTMORENCY, has pale flesh and clear juice and cooks brighter. The fruit is thin-skinned and soft, so it does not ship, and most of the crop goes into jars, cans, and freezers within hours of picking. Jarred sour cherries are an honest ingredient, not a compromise. Sweeten after cooking, and taste before the second spoonful.",
		season: [6, 7, 8],
		choose: "Glossy and even for the type, pale red for AMARELLE, near black for MORELLO, plump and just yielding, never squashy: soft fruit is already leaking. Stems green if present, though much is sold stemless. Reject weeping, dull, or browning at the stem scar.",
		store: "Refrigerate at 0 to 2C (32 to 36F) and use within two days, because that soft skin spoils fast. To hold a glut, pit the fruit and freeze it on a tray, then bag it: it cooks straight from frozen and loses texture only, never acid.",
		prep: "Pit over the bowl you will cook in, because the escaping juice is half the flavor. A hand stoner earns its keep in the season. Skins tear, so expect a rough look. The stones hold amygdalin, so do not crush them in quantity into the pot.",
		methods: ["baking", "stewing", "preserving", "poaching", "pickling"]
	},
	{
		t: "Starfruit",
		c: "The Fruit Atlas",
		d: "CARAMBOLA, cut across the ribs to give the five-pointed slice, crisp and juicy and mildly sweet-tart, closer to a grape-apple than to anything tropical. It carries two dangers that have to be said plainly. Starfruit holds CARAMBOXIN, a neurotoxin healthy kidneys clear, and a heavy load of soluble oxalate. In anyone with reduced kidney function or on dialysis, a small amount, and especially the juice, can cause persistent hiccups, vomiting, confusion, seizures, and death: people with kidney disease must not eat it at all. Healthy people are not exempt either. Sudden kidney failure has followed large amounts of juice drunk on an empty stomach, the oxalate crystallizing in the tubules, so serve it as sliced fruit and not by the glass. SWEET types are broad-ribbed and pale gold; SOUR types are narrow-ribbed and used for souring.",
		season: [9, 10, 11, 12],
		choose: "Firm and glossy, deep yellow, with only light brown along the fin edges and a faint floral smell. Broad fleshy ribs signal a sweet type. Reject hard green fruit, widely browned ribs, and soft translucent bruising.",
		store: "Room temperature 2 to 3 days to finish coloring, then refrigerate up to 1 week in a bag. It bruises wherever it touches, so hold it in a single layer rather than piled. Cut slices keep 2 days and dull at the edges.",
		prep: "Wash, pare the brown fin edges off with a peeler, trim both ends, then slice crosswise and flick out the small flat seeds. No peeling needed. Never serve it, or its juice, to anyone with kidney disease.",
		methods: ["raw", "poach", "simmer", "pickle", "dehydrate", "juice"]
	},
	{
		t: "Strawberry",
		c: "The Fruit Atlas",
		d: "Not a berry: the swollen flower receptacle, the true fruits being the achenes studding its surface, which is why it bruises like flesh rather than skin. Non-climacteric, so sugar stops the moment the fruit leaves the plant; a pale-shouldered berry reddens a shade in the box but never sweetens. Color is anthocyanin (pelargonidin). Furaneol is the jam note and survives; what fades in days are the short esters the picked fruit can no longer make. Cold holds volatiles in, so a chilled berry smells of little. Low pectin and high water mean jam needs added acid and usually added pectin. Sugar on cut fruit pulls water out by osmosis and builds its own syrup in 20 minutes, the trick of maceration. Buy them ripe, use them in two days, and wash only at the moment you hull.",
		season: [5, 6, 7],
		choose: "Uniform red to the shoulder and under the calyx, calyx green and tight, fruit glossy and dry. Reject white or green shoulders, dull soft patches, and any punnet with juice staining the base.",
		store: "Refrigerate unwashed and unhulled in a single layer, lid ajar, for 2 to 3 days. Pull any fuzzy berry and the two touching it. Cold mutes the aroma, so bring them to room temperature 30 minutes before serving.",
		prep: "Wash whole and dry before hulling; a hulled berry drinks water. Take the core out with a paring knife tip or a straw pushed through the point. Cut just before service, since cut faces weep and dull within the hour.",
		methods: ["raw", "macerating", "roasting", "preserving", "freezing"]
	},
	{
		t: "Sweet Cherry",
		c: "The Fruit Atlas",
		d: "Prunus avium, the wild cherry or gean, not the bird cherry, which is the bitter-fruited P. padus, and one rule governs everything: it is non-climacteric, meaning it stops improving the instant it leaves the tree. No counter, no paper bag, no waiting will help. Everything you taste was decided by the grower, which makes buying the whole of the skill. Sugar runs 15 to 20 Brix against low acid, so sweet cherries read as rich rather than sharp, and heat flattens them: cooked alone they turn dull and want lemon, or a handful of sour cherries, to hold the line. Rain near harvest splits them, because the skin takes up water faster than it can stretch. BING is the dark benchmark; RAINIER is the yellow-blush one with the most sugar and the worst bruising. Buy dark, firm fruit with green stems, keep it cold from the moment you own it, and use it inside a week.",
		season: [5, 6, 7],
		choose: "Dark and glossy for the variety, firm, plump, and heavy, with pliable green stems attached: a dry brown stem means old fruit. Reject soft, dull, or shriveled cherries, split skins, and gray mold at the stem scar, which runs through a whole bag.",
		store: "Refrigerate at once at 0 to 2C (32 to 36F), unwashed, in a vented bag or covered box, since frost-free air is dry and dry air browns stems and shrivels fruit. An hour at room temperature costs about a day of shelf life. They hold a week or more, and take up smells, so keep onions and cheese away.",
		prep: "Wash only just before use, then dry them. Pit with a stoner over a bowl, or push the stone through with a chopstick into the neck of a bottle. Wear an apron, since the juice stains for good. Whole stones in a pot are fine, but never crack the kernels in: they are cyanogenic.",
		methods: ["raw", "roasting", "poaching", "preserving", "grilling", "pickling"]
	},
	{
		t: "Table Grape",
		c: "The Fruit Atlas",
		d: "Non-climacteric: once cut from the vine a grape never gains another gram of sugar, so everything depends on it being picked ripe, which is why grapes are the fruit most often bought sour. The dusty gray film on the skin is BLOOM, a wax the vine lays down to slow water loss and shed rain; it also carries wild yeasts, and rubbing it off shortens shelf life. Seedlessness is an aborted embryo, and berry size is then pushed up with gibberellin sprays, which is how seedless grapes got large. Flavor splits by species: VITIS VINIFERA types (Thompson, Crimson, Flame) are crisp with tender skin, while AMERICAN labrusca like Concord are slipskin and musky from methyl anthranilate, the taste behind grape candy. Cotton Candy straddles both, a vinifera crossed onto labrusca stock.",
		season: [8, 9, 10],
		choose: "Taste one before you buy, always. Plump berries gripping green pliable stems, with the powdery bloom intact. Reject brown brittle stems, loose berries rolling in the bag, wrinkled stem scars, sticky leakage, and gray mold.",
		store: "Refrigerate unwashed in their perforated bag, away from strong smells, up to 2 weeks. Wash only at service, since water strips the bloom and invites mold. Freeze whole on a tray for a firm snack.",
		prep: "Rinse in a colander at the last minute and dry well. Snip small clusters off with scissors instead of tearing berries away, which breaks the skin and starts rot. Halve for salads; deseed with the tip of a peeler. Quarter grapes lengthwise for children under five: whole or halved crosswise, a grape is the exact size and shape to seal a small airway.",
		methods: ["raw", "roast", "dehydrate", "pickle", "ferment", "blend"]
	},
	{
		t: "Table Olive",
		c: "The Fruit Atlas",
		d: "RAW OLIVES ARE INEDIBLE. Straight from the tree they carry OLEUROPEIN, a phenolic glycoside so bitter it dries the mouth; every olive you have eaten was cured, and curing is the whole craft here. Four routes. WATER curing leaches the compound out over weeks with daily changes, slow and gentle. BRINE curing ferments the fruit in salt water over months and lets lactic bacteria work, the Greek and Sicilian way and the most flavorful. DRY SALT packing pulls the water out and wrinkles the fruit into oil-cured black olives. LYE curing with food-grade sodium hydroxide breaks the oleuropein down in a day or two, the fast California route: the lye burns skin and eyes, so wear goggles and gloves, add lye to water and never water to lye, and flush a splash under running water. Lye also skips the fermentation, so the olives stay low in acid; rinse until the flesh loses its slippery feel, then keep them in fresh brine in the refrigerator, never sealed in a jar on a warm shelf, because low-acid olives packed that way have grown Clostridium botulinum and killed people. Green olives are simply unripe; black ones are ripe, unless they were darkened with iron salts.",
		season: [9, 10, 11],
		choose: "For curing, firm unbruised fruit of even size picked that week: green for crisp results, fully purple-black for soft. For eating, buy cured olives loose from their brine and taste one. Reject slimy brine, mush, and flat tinny flavor.",
		store: "Cured olives keep for months submerged in their brine under refrigeration; anything that sits above the liquid molds. Top up with 1 part salt to 10 parts water. Oil-cured olives keep 1 month refrigerated in oil.",
		prep: "Pit by pressing with the flat of a knife and picking the stone out, or run a cherry pitter. Slit or crack olives you are curing so the liquid reaches the flesh. Rinse very salty ones, and warm them in oil with citrus peel to open them up.",
		methods: ["cure", "ferment", "brine", "roast", "braise"]
	},
	{
		t: "Tamarillo",
		c: "The Fruit Atlas",
		d: "TREE TOMATO, a nightshade from the Andes: egg-shaped, glossy, dense flesh around a disc of edible seeds set in tart jelly, and a savory-sour flavor far closer to a sharp tomato than to a dessert fruit. That is why it works in chutney, salsa, and against pork as readily as over ice cream. The skin is the catch: thick, tough, and loaded with bitter tannins, so it always comes off, and it will not peel raw. Score a cross, blanch 30 seconds, drop into ice water, and it slips like a tomato. RED types are tarter and more savory; GOLD and ORANGE types are sweeter, milder, and better eaten raw. Leaves and stems are toxic, as in the rest of the family, so nothing green goes near the plate.",
		season: [12, 1, 2, 3],
		choose: "Deep glossy color, firm but giving like a ripe plum, with a green flexible stem still attached, heavy for its size. Reject hard underripe fruit, shriveled skin, split shoulders, brown soft patches, and wet stem scars.",
		store: "Refrigerate up to 2 weeks in the crisper, loose rather than bagged, since trapped moisture spots the skin. Hold firm fruit at room temperature 2 to 3 days to finish ripening. Peeled pulp freezes for 6 months with little loss.",
		prep: "Score a cross at the base, blanch 30 seconds in boiling water, ice it, and slip the skin off; never serve the skin, which is bitter. Halve and scoop, or slice. The juice stains cloth and boards a stubborn red-purple.",
		methods: ["raw", "blanch", "roast", "simmer", "grill", "blend"]
	},
	{
		t: "Watermelon",
		c: "The Fruit Atlas",
		d: "Around 92 percent water, held in a cell structure so open that the flesh gives no resistance at all, and non-climacteric, so a melon cut from the vine unripe stays unripe for life. Selection is therefore the entire skill. The FIELD SPOT, that pale patch where it lay on the ground, should be deep cream to butter-yellow; white means it was picked early. Weight is the second test, because a ripe melon is dense with juice. Red flesh owes its color to lycopene, the same carotenoid as tomato, but the savory edge both share is free glutamate, not the pigment. Salt works on both because sodium suppresses bitterness and lifts sweetness. The rind pickles beautifully. Cut on a scrubbed board and refrigerate cut fruit within two hours, since melon flesh is low in acid and grows Listeria and Salmonella readily.",
		season: [7, 8, 9],
		choose: "Heavy for its size, skin dull rather than glossy, field spot deep yellow, and a low hollow note when slapped. Reject a white field spot, a high shine, flat sides, or a soft weeping stem end.",
		store: "Whole at cool room temperature for up to a week, where the flavor holds better than in the refrigerator. Once cut, wrap the exposed face and refrigerate, using it within three days.",
		prep: "Scrub the rind under cold running water and dry it before the knife touches skin, or the blade drags surface bacteria through the flesh. Cut off both poles for a stable base, then quarter and pare.",
		methods: ["raw", "grilling", "pickling", "juicing", "macerating"]
	},
	{
		t: "Yuzu",
		c: "The Fruit Atlas",
		d: "Citrus junos, a cross of the cold-hardy Ichang papeda and a mandarin, and an aromatic rather than a source of juice: a knobbly fruit the size of a tangerine, mostly rind and seeds, giving perhaps 15 grams of sharp grapefruit-and-mandarin juice. The value sits in the flavedo, whose oil is mostly limonene over gamma-terpinene, with trace linalool, a floral, pine-edged perfume nothing else reproduces. Fresh fruit is scarce and costly outside Japan, so most kitchens work from bottled juice, which is salted or pasteurized and has lost its top notes, and from frozen zest, which keeps them. The aroma is volatile and heat-labile: yuzu goes into ponzu off the heat, into a bowl of dashi at the moment of service, and into YUZU KOSHO, the fermented paste of green zest, chili and salt. Zest it, never boil it.",
		season: [9, 10, 11, 12],
		choose: "Buy it for the skin: a heavy, deeply knobbled fruit with hard bright rind, green in autumn or yellow in winter, fragrant at arm's length. Reject smooth, shiny fruit with a faint smell, and anything soft or blackened.",
		store: "Whole in the refrigerator at 4C (39F) for two to three weeks. Better, zest the lot on arrival and freeze the zest flat in a bag, where the aroma holds six months; freeze the juice in teaspoon portions.",
		prep: "Wash and zest the whole fruit before cutting it, taking only the colored layer. Then halve, juice and strain: the seeds are large, numerous and slippery. Keep those seeds for a pectin-rich infusion if you make marmalade.",
		methods: ["raw", "curing", "fermenting", "marinating", "preserving", "steaming"]
	},
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
		t: "00 Flour",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The Italian mill grade, and the commonest misunderstanding in a kitchen: the number is set by ASH, the mineral residue left after burning, which measures how much bran was milled out. Grind size is not part of the definition, though 00 is usually milled fine. Tipo 00 is the most refined, under 0.55 percent ash, so almost nothing of the bran survives; 0, 1 and 2 carry progressively more, and integrale is wholemeal. Italian law sets only a floor for protein, 9 percent at 00, and bags run from that to 13 percent for panettone, so a 00 can be weaker or stronger than the bread flour beside it. Low bran is what buys the silky, extensible dough that opens thin at the center and blisters into a puffed rim in 90 seconds at 450 C (840 F). Choose by the protein or W value, never by the zeroes.",
		season: [],
		choose: "Read past the zeroes. W is printed on professional sacks only, so on a retail bag work it from the nutrition panel: protein divided by the serving weight. Want 12.5 percent or W260 to W320 for pizza, 9 to 10 for pastry.",
		store: "Airtight, cool and dark, a year for refined 00, since the bran and germ are already gone. Keep it well away from onions and spice, as flour takes on smells fast. Weevils enter through paper, so decant it.",
		prep: "It hydrates faster and more evenly than coarse flour, so an autolyse works quickly: mix flour and water, rest 20 to 30 minutes, then add salt and yeast. Weigh it, since it packs differently from all-purpose.",
		methods: ["baking", "boiling", "frying", "griddling"]
	},
	{
		t: "Almond",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Prunus dulcis, the seed of a drupe, a peach relative stripped of its flesh, which is why an almond tastes faintly of stone fruit. Bitter almonds and apricot kernels both hold amygdalin, which the seed's own emulsin turns to hydrogen cyanide once crushed and wetted; bitter kernels are still sold loose and online under both names, a handful will poison a child and a few dozen can kill an adult, so cook only with sweet almonds. At about 50 percent oil and mostly oleic, the almond keeps far better than walnut or pecan and takes more grinding before it slumps to butter, which is what makes marzipan, frangipane and the Mediterranean habit of thickening with nuts possible. The brown skin is tannin: sixty seconds in boiling water and it slips off between two fingers. Toast at 160 C (320 F) and pull the tray a shade pale, because they keep coloring off the heat.",
		season: [8, 9, 10],
		choose: "Plump, uniformly tan kernels with no shrivel and no dark oily patches. Smell the bag: sweet and milky is right, crayon or old paint is rancid fat. Buy new crop in autumn, and buy whole, not sliced.",
		store: "Sealed, cool and dark for 6 months, refrigerated for a year, frozen almost indefinitely: rancidity is oxygen attacking unsaturated fat, and cold stops it. Ground almonds spoil fastest of all.",
		prep: "Blanch 60 seconds in boiling water and pinch the skins off while warm. Grind cold and in short pulses with a spoonful of the recipe's sugar or flour, or released oil turns the meal into wet paste.",
		methods: ["roasting", "toasting", "blanching", "frying", "baking", "candying"]
	},
	{
		t: "Arborio Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "A fat Italian superfino grain which, with its cousins CARNAROLI and VIALONE NANO, is bred for one job: to surrender surface starch while its core stays firm. The chalky center is not amylose but loosely packed starch full of air spaces, so it hydrates slowly and keeps its bite while the abraded outer layers gelatinize and shed the starch that thickens the liquid into a sauce, which is why risotto is creamy without a drop of cream. Do not rinse it; you would wash off the starch you are farming. Toast the dry grain in fat until the edges turn glassy and the core stays opaque, splash with wine, then feed in hot stock a ladle at a time, stirring so the grains abrade against one another. Carnaroli carries more amylose, holds its bite far longer and is the safer rice for service. Finish off the heat by beating in cold butter and grated cheese hard, the mantecatura, and send it loose enough to spread slowly across a tilted plate.",
		season: [],
		choose: "Plump pearly grains showing a visible opaque white core, from a sealed box or bag. Carnaroli holds its bite longest, vialone nano cooks fastest, arborio sheds starch soonest and overcooks fastest. Reject dusty, broken or dull grain.",
		store: "Airtight in a cool dark cupboard up to two years; an open jar loses no starch, it only invites weevils, since the cream is freed from the grain in the pot rather than carried on it as dust. Risotto never comes back as risotto, but chilled firm it is the body for arancini.",
		prep: "Never rinse it. Toast it until the edges go glassy and the core stays white, and keep the stock at a simmer so the pot never drops off temperature. Stir often enough to abrade the grains, not constantly.",
		methods: ["toasting", "simmering", "baking", "frying", "deep-frying"]
	},
	{
		t: "Basmati Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The long-grain aristocrat of the Punjab, high in amylose and defined by two things: AROMA and ELONGATION. The aroma is 2-acetyl-1-pyrroline, the same popcorn molecule that scents jasmine rice, carried here on a drier, nuttier frame. The elongation is why the grain is AGED, held a year or more before sale: in storage its own lipids break down to free fatty acids that bind amylose and the protein matrix cross-links, so the grain firms, takes up MORE water, and stretches lengthwise nearly double instead of bloating and bursting. New-crop basmati cooks gummy and will not elongate. Rinse, then soak 20 to 30 minutes so water enters before heat does and the center cooks before the outside blows out. Soaked and drained, it needs 1 part rice to 1.25 parts water; unsoaked, 1.5. For biryani boil it like pasta in salted water, drain it short, and finish it in the steam of the sealed pot.",
		season: [],
		choose: "Long slender ivory grains with a faint nutty smell, and a bag that states AGED or a crop year. Reject a high count of broken grains, and reject new-crop basmati, which cooks soft and refuses to elongate.",
		store: "Airtight, cool and dark, but know the trade: aging firms the grain while its 2-acetyl-1-pyrroline evaporates, so buy aged and use it within the year. Keep it from spices, since the grain takes on smells. Cooked, refrigerate within the hour, three days.",
		prep: "Rinse until the water runs clear, soak 20 to 30 minutes, then drain. Handle the soaked grain gently, because it is fragile and broken grains cloud the pot. Fork it through after resting, never spoon it.",
		methods: ["boiling", "steaming", "simmering", "pressure cooking", "baking"]
	},
	{
		t: "Black Bean",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The turtle bean of Latin America, whose black coat is anthocyanin, the same pigment family as blackcurrant and red cabbage and just as sensitive to pH: alkaline water, or a pinch of soda, swings it to blue-gray and the pot goes drab, while a squeeze of acid at the end holds the color deep and dark. Hard water is a different lever, its calcium cross-linking the pectin so beans cook slower, not duller. Acid late has a second reason: tomato or lime at the start keeps that pectin from breaking down and the beans stay stubborn hours past their time. The cooking liquid is not waste, dark with leached anthocyanin and thick with dissolved starch, the body of a Brazilian feijoada and of Cuban frijoles negros, so never pour it away. Cook with cumin, epazote and a whole onion, and thicken by mashing a ladleful of beans back in rather than flour.",
		season: [],
		choose: "Deep even black with a glossy coat and a clear white eye. Reject faded brown-black beans, split coats, or a bag with dust and broken halves at the bottom: all signs of age, and old beans stay hard.",
		store: "Airtight, dark, cool, inside a year, with the date on the jar. Cooked, they keep 5 days refrigerated in their liquid, or freeze them in it and bring them back in the refrigerator overnight.",
		prep: "Sort for stones, then soak overnight in salted water at 1 percent, which pulls calcium out of the pectin. Drain that water off, cover by 5 cm, and boil hard for 10 full minutes before anything else: raw beans carry the lectin phytohemagglutinin, less of it than red kidneys but it is there, and holding them below boiling makes it worse rather than safer, so never start them dry in a slow cooker. Then drop to a shiver for 60 to 90 minutes; a rolling boil past that point bursts every coat.",
		methods: ["simmering", "stewing", "braising", "pressure cooking", "pureeing", "frying"]
	},
	{
		t: "Black-eyed Pea",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Not a Phaseolus at all but a cowpea, Vigna unguiculata, out of West Africa and carried to the American South, where it became Hoppin' John. A thinner coat and a softer cotyledon mean it needs no soaking and cooks in 45 minutes from dry. Separately, being a Vigna it makes no phytohemagglutinin, so the ten minute hard boil a kidney bean demands is not a question here; its own mild lectins go in the ordinary simmer. The flavor is earthy and faintly mineral, closer to a fresh shelling pea than to a bean, and it carries smoke: ham hock, bacon, a burnt onion. It goes from firm to mush inside ten minutes, so taste early and often. Fresh field peas, sold shelled in late summer, cook in 20 minutes and are a different thing. Pull them just short and let them finish off the heat in their pot liquor.",
		season: [],
		choose: "Cream-colored with a clean black eye and a smooth taut coat. Reject yellowed, shrunken or cracked peas, and beware a bag that rattles with dust: age here means a cooking time you cannot predict.",
		store: "Airtight, dark and cool, inside a year. Cooked, 4 days refrigerated in their liquor. Fresh shelled field peas are perishable: refrigerate and cook within 2 days, or blanch 2 minutes, cool, then tray freeze.",
		prep: "No soaking needed, though an hour in warm water evens the cooking. Sort for grit, then simmer with a smoked hock and an onion for 40 to 50 minutes, salting from the start, and taste from minute 35.",
		methods: ["simmering", "stewing", "braising", "frying", "pressure cooking"]
	},
	{
		t: "Bread Flour",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Hard wheat milled to 12 to 14 percent protein, and that number matters only because two of those proteins, GLIADIN and GLUTENIN, hydrate and cross-link into gluten: gliadin brings extensibility, glutenin brings elasticity, and together they build a net that traps the carbon dioxide the yeast makes. More protein means a stronger net, more gas held, a taller rise and a chewier crumb, which is why bread flour carries baguettes, bagels, pizza and the enriched doughs that would tear under butter and egg. It also drinks 3 to 5 percent more water by weight than all-purpose, so swapping it in at the same hydration gives you a tight, stiff dough that fights the shaping. Malted barley flour is often blended in to feed the yeast and brown the crust. Keep it out of biscuits, pastry and cake, where gluten is the enemy of tenderness.",
		season: [],
		choose: "Look for 12 to 14 percent protein on the panel. Bleach only whitens pigment; the chlorine that weakens gluten goes on cake flour. Malted barley flour helps browning. Reject a sharp or paint smell, oxidized lipid.",
		store: "Airtight, cool and dark, six months to a year; white flour far outlasts whole grain. In a warm kitchen freeze it in a sealed bag, then bring it back to room temperature before mixing so dough temperature holds.",
		prep: "Raise hydration 3 to 5 percent over all-purpose, because it drinks more. Mix, then rest 20 minutes before kneading and much of the gluten builds itself. Weigh it; never scoop. Flour is raw: never taste raw dough or batter, which has carried E. coli and Salmonella.",
		methods: ["baking", "steaming", "frying", "boiling", "griddling"]
	},
	{
		t: "Buckwheat",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Not wheat and not even a grass: the seed of Fagopyrum, a relative of rhubarb and sorrel, and therefore GLUTEN FREE, a pseudocereal alongside quinoa and amaranth. Gluten free is not the same as safe for everyone: buckwheat itself sets off anaphylaxis often enough to be a labeled allergen in Japan and Korea, and ordinary flour is milled and bagged alongside wheat, so celiacs need a bag certified for it. The hulled seed is the groat; toasted, it becomes KASHA, and that toasting is where the deep, malty, faintly bitter flavor lives. Raw groats are pale, mild and collapse into mush quickly, so toast them in a dry pan until they smell of cocoa before any liquid goes near them, then use no more than 1 part groats to 1.75 parts water for 12 to 15 minutes. The classic insurance against mush is to coat the dry groats in beaten egg and dry them in the pan first, sealing each seed. The flour, dark and flecked with hull, carries soba, galettes and blini, but it builds no structure at all: cut it with wheat flour unless the recipe is designed around that fragility.",
		season: [],
		choose: "Choose by color: pale groats are raw and mild, deep reddish-brown kasha is toasted and malty. For soba or blini, buy flour visibly flecked with dark hull. Reject flour that smells of crayon or oil paint: that is its germ oil gone rancid. Musty is mold, not age.",
		store: "Airtight, cool and dark, six months for groats. The flour is fatty and turns quickly: keep it in the freezer and use it inside three months. Rancid buckwheat tastes of cardboard and cannot be rescued by cooking.",
		prep: "Toast raw groats in a dry pan until they smell of cocoa, then 1 part groats to 1.75 parts water, 12 to 15 minutes. For separate grains, coat the dry groats in beaten egg and dry them in the pan first.",
		methods: ["toasting", "boiling", "simmering", "baking", "griddling"]
	},
	{
		t: "Bulgur",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Wheat that has already been cooked: whole durum kernels are parboiled, dried, stripped of part of their bran, then cracked and sorted by size. That parboiling gelatinizes the starch, which is why bulgur needs only rehydration rather than cooking, and why it is one of the most stable things in a pantry. Grade is everything and the numbers are printed on the bag. FINE, number 1, is soaked cold for tabbouleh and worked raw into kibbeh; MEDIUM, number 2, suits pilaf; COARSE, numbers 3 and 4, holds its shape in stuffings and stews. Do not confuse it with cracked wheat, which is raw and needs genuine cooking time. For fine grade, cover with cold water or lemon juice for 20 to 30 minutes and wring it out in a cloth; for coarse, use 1 part grain to 1.5 parts boiling stock, lid on, off the heat, 20 minutes, then fork it through.",
		season: [],
		choose: "Buy by number: fine 1 for tabbouleh and kibbeh, medium 2 for pilaf, coarse 3 or 4 for stuffing. Grains should be uniform and smell toasty. Reject anything labeled cracked wheat, which is raw and behaves differently.",
		store: "Airtight, cool and dark, a year and more, since it is already cooked and dried. Keep it away from damp, which mats it. Refrigerate soaked bulgur and use it within two days, before the lemon dulls it.",
		prep: "Fine grade: cover with cold water or lemon juice 20 to 30 minutes, then wring it dry in a cloth. Coarse: 1 part grain to 2 parts boiling stock, lid on, off the heat, 30 minutes, then fork it through.",
		methods: ["simmering", "steaming", "boiling", "baking", "frying"]
	},
	{
		t: "Cannellini Bean",
		c: "The Grain, Pulse & Seed Atlas",
		d: "A white kidney bean bred to Italian taste: long, thin-skinned and mild, with a cotyledon that cooks to cream while the coat stays whole around it. Tuscany built fagioli all'uccelletto, ribollita and pasta e fagioli on that, each wanting the bean and its starchy broth together. Because it is Phaseolus vulgaris, the same species as the red kidney, it carries the same lectin at about a third the level: soak, drain, and give it ten minutes at a rolling boil before dropping to a simmer, and the question is closed. After that cook it barely moving, with sage, garlic and olive oil, which carries the fat soluble aromatics through the broth. Stop when one crushes with no chalk at the center, then cool it in its own liquid so the skins stay on. Get the pot into the refrigerator inside two hours: boiling does not kill Bacillus cereus spores, and a warm pot of beans is where they wake up.",
		season: [],
		choose: "Ivory-white plump ovals with tight unbroken skins. Reject yellowed or gray beans, which are old and will never soften, and any bag carrying loose shed skins and broken halves at the bottom.",
		store: "Airtight, cool and dark, inside a year. Cooked, they keep 5 days refrigerated submerged in their liquid; left uncovered they dry, wrinkle and split. Jarred Spanish and Italian beans earn their price.",
		prep: "Sort, then soak overnight in salted water. Drain, cover with fresh water, boil hard 10 minutes, then simmer 45 to 75 minutes as gently as the pan allows. Salt early; keep tomato and vinegar for the end.",
		methods: ["boiling", "simmering", "braising", "stewing", "pureeing", "pressure cooking"]
	},
	{
		t: "Cashew",
		c: "The Grain, Pulse & Seed Atlas",
		d: "You have never seen a truly raw cashew. The nut is the fruit proper, a drupe whose double shell is lined with caustic oil rich in anacardic acid, kin to the urushiol in poison ivy, and every commercial cashew is steamed or roasted in the shell to drive it off before shelling; what a shop labels raw means only unroasted after that. The cashew apple above it is a swollen stalk, juicy and astringent, too fragile to ship fresh and fermented in Goa into feni. Nutritionally it is the odd one out: about 44 percent fat, high in starch and low in fiber, and it is the missing fiber, not the starch, that lets soaked kernels blend to a smooth neutral cream, the fat and protein doing the thickening. It is a severe tree-nut allergen and cross-reacts with pistachio. Soak in just-boiled water 20 minutes, then blend with fresh water and stop before the machine heats it and the fat separates.",
		season: [],
		choose: "Whole unbroken kernels of even ivory color, graded W240 or W320 by count. Reject gray, spotted or shriveled nuts and anything with a sour smell. Broken pieces cost half and are fine for blending.",
		store: "Sealed and frozen a year, refrigerated 6 months, in a cupboard 2 to 3 months. They take up other smells more readily than most nuts, so keep the jar shut and away from onions, coffee and spice.",
		prep: "For cream, cover with just-boiled water 20 minutes, drain, and blend with fresh water to the thickness you want. For crunch, toast 12 to 15 minutes at 160 C (320 F); they color unevenly, so shake twice.",
		methods: ["toasting", "roasting", "frying", "pureeing", "baking", "candying"]
	},
	{
		t: "Chestnut",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The sweet chestnut, Castanea sativa, is not a nut in kitchen terms: about half water, 45 percent carbohydrate and only 2 to 3 percent fat, so it behaves like a potato with sugar in it, and the flour is naturally gluten free. That water is why it sits on the produce table and spoils like a vegetable, going moldy or drying to a rattle within weeks. Much of the sweetness is sucrose already in the raw nut, built up as cold storage turns starch to sugar; roasting gelatinizes the rest and browns the sugar rather than making it, though a raw nut still tastes chalky. It has two skins: the glossy outer shell and a bitter tannic pellicle folded into every crease of the kernel, which is the entire difficulty of peeling. Score the flat face through to the flesh, roast at 200 C (390 F) for 20 minutes, and peel them scalding hot, because a cold chestnut never gives up its pellicle.",
		season: [10, 11, 12],
		choose: "Heavy, firm and glossy, no give when squeezed, no worm hole. A light nut has dried and shrunk from its shell; a rattle means air and a wasted nut. Sweet chestnuts have a flat side and a pointed tassel; a round nut with no tassel, from a husk with a few thick spikes, is a horse chestnut, which is toxic and roasting does not change that.",
		store: "Refrigerate in a paper bag and use within 2 weeks; they are alive and still respiring. At room temperature they mold in days. Cooked and peeled, they freeze well, and vacuum-packed ones are honest.",
		prep: "Score a deep X or a belt right through the shell on the flat face, or steam builds and they burst. Roast or boil 20 minutes, then peel a few at a time while too hot to hold, keeping the rest warm.",
		methods: ["roasting", "boiling", "braising", "steaming", "pureeing", "candying"]
	},
	{
		t: "Chickpea",
		c: "The Grain, Pulse & Seed Atlas",
		d: "One species, Cicer arietinum, in two market types: KABULI, the large pale chickpea of hummus and Spanish stews, and DESI, the small dark-skinned Indian one split into chana dal. Buy chana dal and besan from a seller you trust: both have been cut with grass pea, Lathyrus sativus, whose neurotoxin cripples on a steady diet. Pectin glues the cell walls, and in seed held warm and damp it loses methyl groups and locks onto calcium and magnesium freed from phytate, so the seed stays gritty for hours. Bicarbonate is the answer: alkali swaps sodium onto those chains and breaks them apart, giving skins that slip and a puree that tastes of chickpea instead of grit. AQUAFABA is the cooking liquid, not the soak water, which is drained: protein and leached saponins whip like egg white. Cook further than looks right, until a chickpea crushes to paste between finger and thumb with no core at all.",
		season: [],
		choose: "Buy where the sacks move, off the hot aisle: warm damp storage, not the calendar, sets the pectin hard, while cool dry seed cooks soft past a year. Want even size, matte unbroken skins, no split halves or dust.",
		store: "Airtight, dark and cool, used inside a year, with the purchase date written on the jar. Cooked chickpeas keep 4 days refrigerated under their own liquid, which stops the skins drying and cracking.",
		prep: "Soak 12 hours in salted water at 1 percent plus half a teaspoon of bicarbonate per 250 g; the salt displaces calcium from the pectin and softens the skin. Drain, cover by 5 cm, simmer, skim the foam.",
		methods: ["simmering", "pressure cooking", "braising", "roasting", "frying", "stewing"]
	},
	{
		t: "Couscous",
		c: "The Grain, Pulse & Seed Atlas",
		d: "PASTA, not a grain, and knowing that changes how you handle it: durum semolina is moistened and rolled by hand or machine against dry semolina until it agglomerates into tiny spheres, which are then dried. Factory couscous is steamed before that drying, which is exactly what makes it instant. It is wheat, so it is not gluten free. You are cooking dough, not hydrating a kernel. Traditional Maghrebi couscous is steamed three separate times in a couscoussier set over the stew it will be served with, raked, oiled and rested between steamings, and it comes out light and separate. Instant wants only an equal volume of boiling stock, a lid, 5 minutes and a fork. The universal fault is the lump: add a spoon of oil or butter and rake the grains apart with your fingers while they are still warm. MOGHRABIEH is the same idea larger, hand rolled, steamed or simmered into the stew; Israeli ptitim is extruded and oven toasted wheat pasta, a different thing, boiled like pasta.",
		season: [],
		choose: "Nearly all boxed couscous, plain included, is already precooked; for true steaming ask a North African grocer for grain marked not precooked. Medium is the default grade, fine for salads. Grains even and free running, with no seasoning or salt blended in.",
		store: "Airtight, cool and dark, a year and more, since it is dried pasta and behaves like it. Cooked couscous carries Bacillus cereus spores that live through cooking and wake in grain left standing warm, and their toxin is not undone by more heat: spread it out, refrigerate inside two hours, use it in four days, and warm it through with a splash of stock and a fork.",
		prep: "Instant: equal volumes boiling stock, lid, 5 minutes, then rake apart with oiled fingers while warm, the only real cure for lumps. Traditional: steam three times, oiling and raking the grains between each.",
		methods: ["steaming", "boiling", "simmering", "baking"]
	},
	{
		t: "Farro",
		c: "The Grain, Pulse & Seed Atlas",
		d: "An ancient hulled wheat, most often EMMER, Triticum dicoccum, though spelt and einkorn are sold under the same name across Italy. The commercial grade, not the variety, decides both texture and timing. PERLATO has been pearled, the bran abraded off exactly as it is on pearl barley: it cooks in 20 to 25 minutes with no soak, and it will slump to porridge if you walk away from the pot. SEMIPERLATO is partly scoured. INTEGRALE keeps its whole bran, so the fiber shields the starch and the grain stays chewy and nutty; it wants several hours of soaking and 40 minutes or more of simmering. Cook any grade like pasta in abundant salted water or stock, drain while the grains still resist the tooth, and dress them warm, because a warm grain drinks vinaigrette and a cold one sheds it. Perlato makes the better farrotto, its bared starch binding the pan.",
		season: [],
		choose: "Read the grade first, perlato, semiperlato or integrale, since cooking time roughly triples across them. Grains should be plump and whole with a clean wheat smell. Reject bags heavy with cracked grain and chaff.",
		store: "Airtight, cool and dark. Perlato keeps a year; integrale still has its bran oil and is best inside six months, or in the freezer. Spread cooked farro thin to cool fast and refrigerate inside two hours, since standing warm grain grows Bacillus cereus. Use it in four days.",
		prep: "Soak integrale several hours; perlato needs none. Boil in abundant salted water or stock and drain while it still resists the tooth. Dress it warm, because a warm grain drinks dressing and a cold one repels it.",
		methods: ["boiling", "simmering", "braising", "baking", "toasting"]
	},
	{
		t: "Glutinous Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Sticky rice, sweet rice, mochigome, khao niao: a grain that is almost pure AMYLOPECTIN, one to two percent amylose, which is why it cooks translucent, chewy and clinging to itself in a mass. It contains NO GLUTEN; the name describes glue-like texture, which matters to anyone cooking for celiac disease. It drinks water fast and has no amylose network to hold shape, so free water wrecks it: soak at least 4 hours or overnight, then STEAM it over water in a cloth or a woven basket for 25 to 35 minutes, turning the mass once. Boiled, it slumps into paste. Pounded hot it becomes mochi; milled, it is the flour that gives tang yuan and mochiko cakes their chew. Black glutinous rice is the same starch with the bran left on and wants a longer soak. Serve it warm. Cold it firms as the amylopectin retrogrades, but that firming reverses: steam or grill it again and it softens, which is how hard mochi is rescued.",
		season: [],
		choose: "Chalky opaque white grains, not translucent ones: the surest way to pick it from a bin. That opacity is air between loosely packed starch granules, not amylopectin itself, so chalk in ordinary rice is still a defect. Thai long grain for khao niao, Japanese mochigome for mochi. Reject yellowed grain.",
		store: "Airtight, cool and dark, a year or more. Black glutinous rice keeps its bran oil, so use it inside six months. Cooked sticky rice is not acidified like sushi rice: a warm cloth basket is four hours at most, then chill it and steam it soft again, because Bacillus cereus spores survive the pot and grow in rice held warm.",
		prep: "Soak 4 hours or overnight, drain, then STEAM in cloth or a basket 25 to 35 minutes, turning once. Boiling gives paste. Wet your hands and the paddle before handling or it will glue itself to both.",
		methods: ["steaming", "boiling", "grilling", "frying", "baking"]
	},
	{
		t: "Green Lentil",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The everyday brown-green lentil, Lens culinaris, sold whole with its seed coat still on. It is small and flat, so water reaches the cotyledon in minutes, which is why a lentil goes from bag to bowl in 25 minutes while a bean wants a night. The coat is what holds the shape, so keep the water at a bare shiver: a hard boil tears it open and you get soup where you wanted salad. Acid is the lever here. Nothing cross-links: acid stalls the beta-elimination that dissolves pectin above pH 5, so vinegar or tomato at the start holds the lentils firm and adds twenty minutes; at the end it seasons without fighting the pot. Salt early does no harm and seasons the interior. Cook them in stock with a bay leaf and half an onion, then dress them the moment they come off the heat, while they are still hot and still drinking.",
		season: [],
		choose: "Look for whole domed lentils of one size, little dust, few split or shriveled ones. Skip any bag with pale chalky specimens mixed in: those are old and stay gritty while the sound lentils around them collapse.",
		store: "Airtight and dark, best inside a year; heat and light dull the flavor and harden the coat. Cooked and cooled they keep 5 days refrigerated, and improve on day two with a little oil and vinegar.",
		prep: "No soaking. Tip onto a tray and pick out grit and the odd stone, then rinse. Cook in three times their volume of liquid at a bare simmer, start testing at 20 minutes, and stop while they still bite. If you sprout them, use seed sold for sprouting and cook the sprouts: a warm wet jar multiplies whatever the seed carried.",
		methods: ["simmering", "braising", "stewing", "pressure cooking", "sprouting"]
	},
	{
		t: "Hazelnut",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Corylus avellana, the filbert, and a nut whose flavor roasting amplifies rather than invents: the character compound filbertone is present in the raw kernel and heat multiplies it, while Maillard pyrazines add the generic toasted layer around it. Give it 12 to 15 minutes at 160 C (320 F), until the kernel is honey-colored right through to the center, not just at the surface. The skins are bitter, so tip the hot nuts into a clean towel, wrap them two minutes to steam, then rub hard. Its fat runs close to 80 percent oleic, the highest of the common nuts, so it keeps better than walnut or pecan, though the freezer is still the answer. Ground with chocolate it becomes GIANDUJA; ground alone and worked past paste it is hazelnut butter, and only caramelized sugar ground in with it makes praline paste. Roast whole and grind what you need.",
		season: [8, 9, 10],
		choose: "Heavy plump kernels of even size with tight skins and no shrivel; a nut in shell that rattles has dried out. Piedmont Tonda Gentile is worth the price for pastry. Reject anything smelling of old oil.",
		store: "Sealed and frozen for a year, refrigerated for 6 months. Roast and skin only what you will use that week: a skinned nut has lost its wrapper and oxidizes noticeably faster than a whole one does.",
		prep: "Roast 12 to 15 minutes at 160 C (320 F), tip hot into a towel, wrap 2 minutes to steam, then rub. Accept that a tenth of the skin never leaves. Roast rather than serve raw where birch pollen hay fever is common: the protein that itches mouths breaks down with that heat, while the proteins behind true nut allergy do not.",
		methods: ["roasting", "toasting", "baking", "grinding", "candying", "frying"]
	},
	{
		t: "Jasmine Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Thai hom mali: a long grain that behaves like a medium one. Amylose sits lower than in basmati, around 15 to 18 percent, so the cooked grains come out soft, moist and lightly clinging, meant to be lifted in a clump with a spoon rather than blown apart into a pilaf. The perfume is again 2-acetyl-1-pyrroline, and here is the difference that catches cooks out: jasmine is best NEW CROP and the scent fades with every month in the bag, where basmati wants age. Because the grain is already soft, cut the water back to about 1 part rice to 1.25 parts after rinsing, or mush is one splash away. This is the default rice under Thai curries, Vietnamese grilled pork and Cantonese steamed fish. Never fry it the day it is cooked: spread it on a tray, chill it uncovered overnight so the surface starch retrogrades and dries, then fry the separate grains hard.",
		season: [],
		choose: "Buy NEW CROP, the one rice that is better young: look for a harvest date and a clear pandan and popcorn smell through the bag. Reject dusty, heavily broken or flat-smelling grain, which has sat too long.",
		store: "Airtight, cool, dark and out of the light, and use it inside a year while it still smells of something. Cooked jasmine holds three days refrigerated and is better on day two for frying, once chilled and dry.",
		prep: "Rinse twice, no more, and cut the water to about 1.25 parts per part of rice, because this grain is soft to start with. Rest it lidded 10 minutes, then fork gently: it is meant to clump a little.",
		methods: ["steaming", "boiling", "simmering", "stir-frying", "pressure cooking"]
	},
	{
		t: "Kidney Bean",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The red kidney bean carries more PHYTOHAEMAGGLUTININ, a lectin, than any other common bean, and undercooked it is genuinely dangerous: four or five soaked but unboiled beans bring on violent vomiting and diarrhea within a few hours. Heat destroys the lectin, but only real heat. THE BEANS MUST BE SOAKED, DRAINED, AND THEN BOILED HARD AT A ROLLING BOIL FOR AT LEAST TEN MINUTES before you drop the pot to a simmer. A slow cooker is the trap that has poisoned people: held near 80 C (176 F) the lectin survives and its activity climbs, so beans cooked gently from dry can be more toxic than raw ones. Boil them in a pan first, then slow cook if you like. Canned kidney beans have already been through that boil and are safe from the tin. The payoff is a bean that keeps its shape in chili where softer ones dissolve.",
		season: [],
		choose: "Deep glossy red-brown, plump, with unbroken coats; reject dull, wrinkled or split beans and any bag full of dust. Canned are a legitimate choice here, already boiled through: drain and rinse them.",
		store: "Airtight, dark and cool, used inside a year. Cooked beans keep 5 days refrigerated in their liquid. Never keep the soaking water: it holds leached lectin and the sugars that cause wind. Bin it.",
		prep: "Soak 8 to 12 hours, discard that water, cover with fresh, and boil hard a full 10 minutes before simmering 60 to 90 minutes more. Set a timer for the boil and do not judge those ten minutes by eye.",
		methods: ["boiling", "simmering", "stewing", "braising", "pressure cooking"]
	},
	{
		t: "Long-grain White Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Rice starch is two molecules and the ratio decides everything: AMYLOSE, a straight chain that sets firm and separate as it cools, and AMYLOPECTIN, a branched one that stays soft and clinging. Long grain runs high in amylose, 22 to 28 percent, so the cooked grains stay individual, dry and distinct: the rice of pilaf, jambalaya, biryani and fried rice. Milling has stripped the bran and the oily germ, which is why it keeps for years and cooks quickly. Rinse until the water runs nearly clear to wash off loose milling starch, or the grains glue to the pot. Absorption is 1 part rice to 1.5 parts water by volume, lid on, 15 to 18 minutes at a bare simmer, then 10 minutes off the heat undisturbed, because the trapped steam finishes the center. Never stir the pot: a spoon tears softening grains and drags fresh amylose out of them, and that glues it.",
		season: [],
		choose: "Uniform translucent grains with few chalky white kernels and little broken rice drifting in the bottom of the bag, since breakage means starchy, uneven cooking. Reject any bag that smells musty or of old oil.",
		store: "Airtight in a cool dark cupboard, two years and more, because milling removed the germ that goes rancid. Weevils are the real threat: a sealed container beats a bay leaf. Cooked rice is the hazard: Bacillus cereus spores survive the pot and, left standing warm, make a heat-stable toxin that cooking does not undo. Cool it spread thin, refrigerate within the hour, three days.",
		prep: "Rinse in several changes of cold water until it runs clear, then drain well so the ratio stays honest; enriched US rice loses its sprayed-on vitamins that way, the price of separate grains. Rest lidded 10 minutes, then fork through.",
		methods: ["boiling", "steaming", "simmering", "stir-frying", "baking"]
	},
	{
		t: "Masa Harina",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The great fact of corn cookery. Dried field corn is simmered and steeped in an alkaline solution of slaked lime, calcium hydroxide, then washed and hulled: NIXTAMALIZATION. The alkali dissolves the pericarp, loosens the starch and, above all, frees bound niacin, vitamin B3, into a form the body can actually absorb, which is why cultures built on nixtamalized corn never suffered the pellagra that killed people wherever corn was adopted without the lime. It also builds the toasty lime flavor and lets starch and protein form a dough that coheres with no gluten in it at all. Masa harina is that nixtamalized corn dried and milled, so it needs only water: about 1 part masa to 1.3 parts warm water by weight, kneaded 2 minutes and rested 20. Fine grind presses tortillas, coarse builds tamales. Work it soft, because dry dough cracks at the edge.",
		season: [],
		choose: "Buy masa harina stated as nixtamalized, fine grind for tortillas, coarse for tamales. It should smell sweetly of corn and lime. Its shelf twin masarepa is precooked arepa flour, never limed: like cornmeal and polenta it will not cohere.",
		store: "Airtight, cool and dark, six months to a year; the flavor fades long before it spoils and old masa tastes of dust. Fresh masa dough holds a day refrigerated under close wrap and dries out fast in open air.",
		prep: "About 1 part masa to 1.3 parts warm water by weight, kneaded 2 minutes and rested 20. Press between plastic sheets. If the edges crack as you press, the dough is dry: wet your hands and knead it again.",
		methods: ["griddling", "steaming", "frying", "deep-frying", "baking"]
	},
	{
		t: "Mung Bean",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Vigna radiata, unlike anything else in the dry store: tiny seed, thin permeable coat, so water reaches the center fast and it cooks from dry in 30 to 40 minutes with no soaking. Its stachyose and raffinose run as high as most pulses: what is missing is the wait, not the gas. Skinned and split it is moong dal, the gentlest dal, pale yellow and ready in twenty. Whole, it is the sprouting bean of East Asia, and germination is a real transformation: amylases cut stored starch to sugars and the seedling builds vitamin C where there was almost none, which is why a sprout tastes sweet and green rather than starchy. Its starch runs 30 to 45 percent amylose, which sets firm as it cools, and that is why Chinese glass noodles and Korean mung jelly exist. Sprout in a jar in the dark, rinsing twice a day, and eat them at 3 to 5 cm before they green and turn bitter.",
		season: [],
		choose: "Whole mung should be uniform olive-green with a bright waxy sheen, never dull khaki. For sprouting, buy food-grade seed with a stated germination rate. Reject wrinkled, mottled or dusty beans.",
		store: "Airtight, dark and cool, a year for whole beans; split moong dal has no coat to protect it and dulls faster, so use it in 6 months. Sprouts are alive: refrigerate in a vented box, eat within 3 days.",
		prep: "Rinse and sort; no soaking for whole beans, though 2 hours cuts the time by a third. For sprouts soak 8 hours, drain hard, and rinse morning and night: standing water is what turns a jar sour. Sprouting warmth and wet also multiply any Salmonella or E. coli riding in on the seed, and rinsing will not remove them, so buy seed sold and tested for sprouting, never garden seed, and cook the sprouts through for children, pregnant women, the old and anyone immune compromised.",
		methods: ["simmering", "stewing", "sprouting", "steaming", "pressure cooking", "frying"]
	},
	{
		t: "Peanut",
		c: "The Grain, Pulse & Seed Atlas",
		d: "A legume, not a nut: Arachis hypogaea flowers above ground, then the fertilized peg bends over, drives into the soil, and ripens its pod underground. That soil contact matters, because Aspergillus flavus and A. parasiticus on damaged pods make aflatoxin, which is heat stable and tasteless: roasting will not destroy it and your tongue will not catch it, so lots are sorted and tested and moldy or shriveled kernels go in the bin. It is also among the most serious food allergens: the proteins survive roasting, frying and grinding, and a shared fryer or a wiped board is enough to put someone in hospital. Otherwise it is a bean that acts like a nut, with enough sugar and free amino acid to Maillard hard. VALENCIA carry three or more sweet red skinned kernels a pod and are the ones boiled green; RUNNER goes to butter; SPANISH are small and the oiliest; VIRGINIA is the big in shell nut. Roast at 175 C (350 F) for 15 to 20 minutes and salt them hot.",
		season: [8, 9, 10, 11],
		choose: "Shelled, want plump even kernels with tight skins, no shrivel, no dark specks, no green gray bloom. In shell, heavy with no rattle. Judge by eye, not by taste: aflatoxin has no flavor, and bitter usually means rancid oil. Green peanuts are damp and heavy, shells unstained.",
		store: "Sealed and cool for 3 months, refrigerated 6, frozen a year. The fat is largely oleic and keeps better than a walnut's, but warmth and humidity invite mold, the real risk here. Green peanuts spoil in days even cold. Boiled peanuts are wet and low in acid: keep them cold, never in a sealed jar on the counter.",
		prep: "Roast raw kernels 15 to 20 minutes at 175 C (350 F); they carry over, so pull them pale, tan through and not white at the center. Cool, then rub the skins off in a towel. Simmer green peanuts in heavy brine 1 to 4 hours, until soft through.",
		methods: ["roasting", "boiling", "frying", "baking", "stewing", "grinding"]
	},
	{
		t: "Pearl Barley",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Barley scoured until the hull, the bran and the oily germ are polished away, which is what pearling means and why it cooks in 25 to 35 minutes rather than an hour. BETA-GLUCAN survives because in barley it sits in the cell walls of the endosperm itself, not mainly in the bran; it leaches out and thickens the liquid, which is why a barley soup keeps setting up in the pot overnight and why barley makes a convincing orzotto with none of the fussing a risotto demands. Pot or scotch barley is lightly pearled and keeps some bran; hulled barley is the whole grain and takes about twice as long. Note plainly that barley contains gluten, as hordein. Salt it early, since the grain takes salt slowly, and choose your method by the result you want: boil it in abundant water and drain for separate grains in a salad, or cook it in measured liquid when you want that thickening. Toast the dry grain in a dry pan first for a nuttier finish.",
		season: [],
		choose: "Even, ivory, well-rounded pearls with few broken pieces. Three grades: pearl; pot or scotch, lightly pearled, some bran left, slower; hulled, the whole grain, near twice pearl's time. Reject gray or chipped grain.",
		store: "Airtight, cool and dark, a year for pearl; hulled barley still holds its bran oil and is best inside six months. Cooked barley keeps four days refrigerated and will thicken any soup it sits in overnight.",
		prep: "Pearl needs no soak. Toast it dry for flavor, then boil in abundant salted water and drain if you want separate grains; cook it in measured liquid only when you actually want the beta-glucan to thicken.",
		methods: ["boiling", "simmering", "braising", "baking", "toasting"]
	},
	{
		t: "Pecan",
		c: "The Grain, Pulse & Seed Atlas",
		d: "A hickory of the Mississippi basin, Carya illinoinensis, and one of the fattest nuts in use at around 72 percent oil, behind macadamia. That fat is mostly oleic with about a fifth linoleic, and it is the linoleic that oxidizes: pecan turns slower than walnut, faster than almond, so it belongs in the freezer and not a jar on the shelf. Fat also means it browns fast and burns faster, and a pecan toasts through in 6 to 8 minutes at 160 C (320 F) where an almond wants twice as long. The convoluted kernel, folded around a bitter tannic septum, holds butter, sugar and salt in its creases, which is why candied pecan and praline coat so evenly. Varieties count: DESIRABLE and STUART are large and mild, wild natives are small, dark and far more flavorful. Toast before any batter; raw pecan is sweet and tannic but reads mostly of fat.",
		season: [10, 11, 12],
		choose: "Plump glossy halves of even deep gold-brown. Reject shriveled, dull or blotchy kernels and any showing dark oily spots. If the bag smells of putty or crayon, the oil has already turned: walk away.",
		store: "Sealed in the freezer for a year or more; refrigerated, 6 months; a cupboard, only weeks in warm weather. Buy shelled pecans from a shop with turnover, and buy new crop from October to December.",
		prep: "Toast 6 to 8 minutes at 160 C (320 F), shaking once, and watch them: the line between toasted and burnt is about sixty seconds. Cool flat on the tray before chopping so they stay crisp and do not smear.",
		methods: ["toasting", "roasting", "baking", "candying", "frying"]
	},
	{
		t: "Pine Nut",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The seed of a pine cone, pried out by hand, which is most of why it costs what it does. Two shapes reach the market and they are not the same food: the Mediterranean stone pine, Pinus pinea, gives the long slim teardrop of pesto, sweet and faintly resinous; the Asian pines give a squat triangular kernel, cheaper and blander. PINE MOUTH comes from one of those Asian pines, Pinus armandii, which ships unnamed inside generic Chinese pine nuts: a day or two after eating, everything tastes bitter and metallic, and it can last two weeks. No treatment, no lasting harm, but a guest will remember it, so buy Korean or Mediterranean by name. The fat is highly unsaturated and they go rancid faster than almost anything else, so taste one before you use them. Toast in a dry pan over low heat, moving them constantly: they go from pale to burnt in seconds.",
		season: [],
		choose: "Long slim ivory kernels if you want Mediterranean flavor; squat triangles are the cheaper Asian species. Check the stated origin, reject any that look yellow or oily, and taste one before buying more.",
		store: "Sealed in the freezer, where they hold 6 months to a year; a cupboard jar goes rancid in weeks and the flavor fades before that. Toast them straight from frozen, allowing about a minute longer.",
		prep: "There is no prep beyond toasting, and that is the whole risk: dry pan, low heat, constant motion, 3 to 4 minutes, off the heat while still blond. Tip onto a cold plate at once or the pan finishes them.",
		methods: ["toasting", "roasting", "baking", "frying", "pureeing"]
	},
	{
		t: "Pinto Bean",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Pinto means painted: a beige bean splashed with russet that cooks to a uniform brown and to a creamy interior, though cannellini and borlotti do the same. Its starch gelatinizes in the boil and its cell walls separate rather than shatter, so the cotyledon mashes to a smooth paste rather than a mealy one, which is why this is the bean of frijoles refritos and of the all-day Texas pot. Refried does not mean fried twice: refritos means well fried, the beans mashed into hot lard or bacon fat and driven down until the water goes and the gelatinized starch and protein hold the fat as an emulsion. Cook them soft enough that one crushes against the roof of your mouth with no resistance, then fry a ladleful at a time and let each addition dry down before the next goes in.",
		season: [],
		choose: "Pale beans with clear russet mottling, not uniformly darkened ones: pintos darken as they age, so a dark bag is an old bag that will never soften. No splits, no dust, no shriveled loose coats.",
		store: "Airtight, cool and dark, a year at most, and note the date. Cooked beans keep 5 days refrigerated in their broth, which sets to a light gel from dissolved starch and is the best part of the pot.",
		prep: "Sort for stones and clods. Soak overnight in salted water and drain it off, or skip the soak and add an hour. Boil hard for 10 full minutes first: raw beans carry the lectin phytohemagglutinin, and a pot held below boiling, a slow cooker above all, makes it worse rather than safer. Then simmer with onion, garlic and a little fat, salting from the start; hold acid until they are soft.",
		methods: ["simmering", "stewing", "braising", "frying", "pressure cooking", "pureeing"]
	},
	{
		t: "Pistachio",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Pistacia vera, an arid-country tree of Central Asia and Iran, and the nut that signals its own maturity: the kernel swells until the shell splits along its suture. Not every closed shell is immature, some simply never dehisce, but they grade lower and are cracked by machine. The green is chlorophyll and the purple blush anthocyanin, and both degrade with heat, which is why pistachios for pastry are toasted low or not at all. SICILIAN BRONTE, grown on lava soil, are the deepest green and the most expensive; Iranian kernels are long and rich; Californian are pale, cheap and right for salting. In shell they are brined before roasting, so the salt sits on the shell and the kernel stays nearly unsalted. For pastry buy raw unsalted kernels and blanch the skins off.",
		season: [9, 10],
		choose: "In shell, want a clean natural split and a full heavy nut; machine-cracked shells gape evenly and often hold shrunken kernels. Shelled, look for deep green under purple skin, never yellowish and dull. Discard any kernel stained brown, chalky or musty: pistachio is among the crops most prone to aflatoxin mold, which roasting does not destroy.",
		store: "Sealed and frozen a year, refrigerated 6 months. Kernels fade in light, so keep them dark if you are buying them for color. Salted nuts in shell go soft in humid air; a dry sealed jar keeps them crisp.",
		prep: "Blanch shelled kernels 60 seconds, shock in iced water, rub the skins off, then dry them well: wet kernels mold within days and will not grind to a paste. Chop by hand and late, cut faces dull within hours, and keep heat below 150 C (300 F).",
		methods: ["toasting", "roasting", "baking", "grinding", "blanching", "candying"]
	},
	{
		t: "Polenta",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Dried corn ground to meal, and the dish made from it. Texture is decided by GRIND and by whether the germ was left in. Coarse stone-ground meal keeps the germ, tastes powerfully of corn and wants 40 to 45 minutes of slow cooking; degerminated instant polenta has been precooked and dried and thickens in 3 minutes with a fraction of the flavor. It thickens because the starch granules take up water and swell into a gel below the boil, which is why the meal must fall in as a thin rain while you whisk: a clump gels a skin around dry meal, crushable on the pot side while the paste is loose, not after it stiffens. Reckon 1 part meal to 4 or 5 parts water or stock, salted from the start, and cook until the paste pulls cleanly from the side of the pot. It is not nixtamalized, so it will never make tortillas. Beat butter and cheese in off the heat, or pour it out to set firm and cut it into slabs.",
		season: [],
		choose: "Coarse stone-ground meal with the germ left in smells sweetly of corn and earns its 45 minutes; instant is precooked and flat. Check the grind stated on the bag. Reject meal that smells musty, sour or of paint.",
		store: "Stone-ground meal with the germ holds three months at room temperature and six in the freezer, because that germ oil goes rancid. Degerminated meal keeps a year. Set polenta keeps three days wrapped and cold.",
		prep: "Rain the meal into salted boiling liquid in a thin stream while whisking hard, crushing any clump on the pot side before the paste stiffens. Use a deep pot and the lowest simmer: thick polenta traps steam and throws scalding paste that sticks to skin. Reckon 1 part meal to 4 or 5 parts liquid, and stir the bottom, where it catches.",
		methods: ["simmering", "baking", "grilling", "frying", "deep-frying"]
	},
	{
		t: "Puy Lentil",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The lentille verte du Puy, grown under AOP rules on the volcanic plateau of the Haute-Loire, where basalt soil and a dry wind produce a small slate-green lentil flecked with blue. The distinction is not romance: a thicker, tougher seed coat and a denser cotyledon mean it holds its shape through a long simmer and eats firm and peppery where a common green lentil goes floury. BELUGA, the round black lentil, behaves the same way and costs less. Anything sold as green lentil in the style of Puy is the type without the terroir, and it will soften sooner, so cut five minutes off. Do not drown it: cook in just enough stock that almost none is left at the end, so the flavor stays in the lentil rather than in the water you are about to pour down the sink.",
		season: [],
		choose: "True Puy carries the AOP label and a Haute-Loire address; the rest are lookalikes, cheaper and softer. Grains should be small, glossy and mottled blue-green. Reject dull, dusty or cracked stock.",
		store: "Airtight, cool and dry, inside a year. Warmth and damp, not age, harden it: cotyledon pectin sets with calcium and cooking drifts past 45 minutes. Cooked, they keep 5 days refrigerated and eat better cold than hot.",
		prep: "No soaking, which would soften the coat you are paying for. Rinse, cover by 3 cm with stock, simmer 20 to 25 minutes to a firm bite, then salt and dress at once so they drink the vinaigrette hot.",
		methods: ["simmering", "braising", "stewing", "pressure cooking"]
	},
	{
		t: "Quinoa",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Not a grass but the seed of Chenopodium quinoa, a goosefoot relative of spinach and beet, and one of the few plant foods carrying all nine essential amino acids in useful proportion. Its pericarp, the thin outer fruit wall, holds SAPONINS, bitter triterpene glycosides that repel birds and insects and foam in water; they are why an unrinsed pot tastes of detergent. Export quinoa is dry-polished and washed to strip that layer, so many bags now foam little or not at all. Rinse anyway in a fine sieve, rubbing, until no foam rises, since you cannot tell by looking. The seed is gluten free, but it is often cleaned and packed alongside wheat, so buy certified stock if a celiac is eating. Cook 1 part to 1.75 parts water 15 minutes, rest lidded 10; done when the germ uncoils into a pale tail. Toast dry first for a nuttier result.",
		season: [],
		choose: "Dry, free-running seed, no clumping. White cooks softest; red and black hold their shape. Bitterness is a taste, not a smell: chew a seed at the bulk bin. Reject dust, webbing, or a rancid smell.",
		store: "Airtight, cool and dark, about a year; the oily germ shortens that in a warm kitchen. Bacillus cereus spores survive cooking and multiply in grain left standing warm, so spread cooked quinoa out, chill it within the hour, and keep it four days. Freezes in portions without mush.",
		prep: "Rinse in a fine sieve under cold running water, rubbing, until no foam rises: that foam is the saponin. Cook 1 part to 1.75 parts water 15 minutes, rest lidded 10, then fork. Done when the germ uncoils.",
		methods: ["boiling", "simmering", "steaming", "toasting", "baking"]
	},
	{
		t: "Red Lentil",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Masoor dal: a brown lentil skinned and split, so the seed coat that holds a green lentil together is simply gone. Nothing restrains the cotyledon, its starch granules swell and burst within 15 to 20 minutes, and the lentil collapses into a golden puree. That is not a failure, it is the entire point: every dal, every thickened soup, every Turkish mercimek corbasi is built on the collapse. The orange color is carotenoid and fades to pale yellow as it cooks, so judge doneness by texture only and never by eye. Because they are hulled they foam hard in the first minutes, and that foam is leached starch and protein; skim it or the pot climbs over the rim. Hold all acid until after the collapse, because lemon or tomato added early keeps the pectin intact and you will wait an hour for a puree that never arrives.",
		season: [],
		choose: "Bright coral-orange and uniform, not faded to straw, which means long storage and a flat, dusty flavor. Look through the bag for grit and small stones: split lentils hide debris better than whole.",
		store: "Airtight, dark and cool, inside a year: with no seed coat the exposed cotyledon oxidizes and both color and flavor dull. Cooked dal keeps 4 days refrigerated and thickens, so loosen it with water.",
		prep: "Rinse in several changes until the water runs clear: that takes off milling dust and cuts the foam, though the collapse will release its own starch regardless. No soaking. Simmer in 3 to 4 times their volume, skim the first foam, stir.",
		methods: ["simmering", "stewing", "pressure cooking", "pureeing", "braising"]
	},
	{
		t: "Rolled Oats",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Oat groats are KILNED first, a long dry heat that builds the toasted flavor and kills the LIPASE that would otherwise split the grain's unusually high fat into soapy free fatty acids. Only then are they steamed briefly to soften and pressed flat between rollers, a shaping step, not the stabilizing one; steel-cut oats are the same kilned groats merely chopped, which is why they keep as well. Thickness decides behavior. OLD-FASHIONED rolled oats hold their shape through 5 minutes of simmering and inside a cookie; QUICK oats are cut then rolled thinner and go pasty fast; INSTANT are cooked further still and want only hot liquid; STEEL-CUT need 25 to 30 minutes. Creaminess is swollen gelatinized starch plus beta-glucan, so stirring thickens it and a resting pot keeps tightening. Oats are naturally gluten free but are milled alongside wheat, so celiac cooking demands a bag labeled gluten free, and a few celiacs react even to pure oats. Salt the cooking liquid, not the finished bowl.",
		season: [],
		choose: "Buy old-fashioned rolled oats: broad whole flakes whose shape you can still see. Quick and instant are thinner and go pasty. For celiac cooking the bag must say gluten free. Reject flakes smelling of crayon or old oil.",
		store: "Airtight, cool and dark, a year sealed. Kilning killed the lipase, so what finally spoils them is slow oxidation, sped by warmth and light, and the smell is the tell. In a warm kitchen keep them in the freezer and use them straight from the bag.",
		prep: "Salt the cooking liquid, never the finished bowl. For porridge, 1 part oats to 2.5 parts liquid, simmered and stirred so the beta-glucan comes out; for a chewier bowl stir less and rest it off the heat.",
		methods: ["simmering", "baking", "toasting", "frying", "boiling"]
	},
	{
		t: "Semolina",
		c: "The Grain, Pulse & Seed Atlas",
		d: "The coarse, sandy, straw-yellow mill of DURUM wheat, Triticum turgidum subsp. durum, so hard that its endosperm shatters into gritty particles instead of dusting into flour. The yellow is carotenoid, mostly lutein; the grit is the entire point. Durum protein runs high, but as a tetraploid it lacks the D genome that carries bread wheat's strongest glutenins, so its gluten is tenacious and short rather than springy: superb for an extruded shape that resists overcooking, and it does rise, into the dense close crumb of Altamura bread. Coarse semola is for extruded pasta and dusting; the fine remill, rimacinata, is for that bread and for hand-shaped southern pasta of flour and water, orecchiette and busiate, while egg pasta belongs to soft-wheat 00. Hydrate slowly: mix, rest 30 minutes, then knead. It is also the grain of halva and of upma.",
		season: [],
		choose: "Sandy, free-flowing, pale gold and frankly gritty between the fingers rather than powdery. Check whether it is coarse semola or fine rimacinata, since they are not interchangeable. Reject clumped or stale meal.",
		store: "Airtight, cool and dark, about a year. It is purified endosperm, so it turns rancid slowly; what fades first is the yellow, as the carotenoids oxidize. Moths and weevils prize it, so decant the bag and check it.",
		prep: "Hydrate slowly: mix the dough, rest it 30 minutes, then knead, because the coarse particles drink at their own pace. Dust peels and drying trays with semolina, never with fine flour, which scorches.",
		methods: ["boiling", "baking", "frying", "toasting", "steaming"]
	},
	{
		t: "Sushi Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Short-grain japonica, sold as sushi rice, koshihikari or simply Japanese rice: amylose near 17 percent in a fat round grain that cooks plump and cohesive, so a formed handful holds under fish yet falls apart in the mouth. Rinse and gently rub until the water runs almost clear, then rest the drained grain 30 minutes so it hydrates evenly, and cook at about 1 part rice to 1.1 parts water. What makes it sushi rice is not the variety but the SEASONING: while the rice is hot, fold through vinegar, sugar and salt, roughly 60 ml rice vinegar, 30 g sugar and 8 g salt per 500 g of uncooked rice, cutting with a flat wet paddle instead of stirring so you do not crush grains. Fan it as you fold: hot rice drinks the seasoning, and fanning drives off the moisture the vinegar added so the grains stay distinct and glossy. Hold it at room temperature under a damp cloth for up to four hours, never cold, which stales it hard.",
		season: [],
		choose: "Short round pearly grains of a named japonica such as koshihikari or akitakomachi, with a recent milling date. Reject bags carrying many chalky or cracked grains, which burst and drag the finished rice to paste.",
		store: "Uncooked: airtight and cool, six months to a year, since fresh-milled character fades. Seasoned rice sits out under a damp cloth only because the vinegar acidifies it, and only four hours: Bacillus cereus spores survive the pot, and the toxin they make in warm rice survives more heat. Chilling stales it hard, so season only what you will use.",
		prep: "Rinse and rub gently until the water is nearly clear, drain 30 minutes, then cook. Fold the vinegar mixture into hot rice with a flat wet paddle, slicing rather than stirring, fanning to drive off surface moisture so the grains stay distinct and glossy.",
		methods: ["steaming", "boiling", "simmering", "pressure cooking"]
	},
	{
		t: "Walnut",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Juglans regia, the English or Persian walnut; black walnut (J. nigra) shares the name and nothing else. The most fragile nut in the pantry: its fat is over 70 percent polyunsaturated, but the dominant fatty acid is linoleic at about 58 percent, with alpha-linolenic near 14 percent, and it is that small omega-3 fraction, three double bonds to attack, that goes first. A walnut turns rancid while an almond is still fine, and rancid walnut is the bitter, paint-like taste people wrongly accept as the walnut's character. True bitterness is separate and lives in the papery pellicle, loaded with tannin: a minute in boiling water and a hard rub in a towel takes the edge off, and toasting at 160 C (320 F) mellows the rest. In autumn buy WET WALNUTS, undried, crisp and milky, a different food that keeps a week cold. Taste one nut from every bag before it goes near a cake.",
		season: [6, 9, 10, 11],
		choose: "In shell, heavy for its size with no rattle. Shelled, pale golden and crisp, never limp, dark or oily-smelling. Break one and taste: rancidity is instant and unmistakable, and one bad nut sours a cake.",
		store: "The freezer, sealed, where they hold a year and more; the refrigerator gives 6 months and a warm cupboard maybe two. Light, heat and air all attack the same unsaturated fat. Toast from frozen.",
		prep: "Blanch 30 seconds and rub in a towel to cut the tannin, or toast 8 minutes at 160 C (320 F) and cool them completely before chopping, since warm walnuts smear. Chop by hand: a processor makes oil.",
		methods: ["toasting", "roasting", "baking", "candying", "pickling", "blanching"]
	},
	{
		t: "Wild Rice",
		c: "The Grain, Pulse & Seed Atlas",
		d: "Not rice at all: ZIZANIA, an aquatic grass of the North American lakes and a different genus from Oryza, gathered traditionally by Anishinaabe canoe and knocking sticks. The black hull is the bran of an intact whole grain, so it behaves like a seed rather than a starch: it needs 45 to 55 minutes in plenty of salted water and it will never turn creamy or sticky no matter what you do to it. The smoky, tea-like flavor comes from the parching and fire-curing the grain gets after harvest, not from the plant. It is ready when roughly a third of the grains have split lengthwise to show the pale interior; push past that point and the pot goes woolly and threadlike. Cook it like pasta in abundant water and drain, never by absorption, since timing swings from lot to lot. Hand-harvested lake rice cooks faster and far less evenly than cultivated paddy grain.",
		season: [],
		choose: "Long glossy near-black grains of fairly even length. Hand-harvested lake rice is shorter, browner and more varied; cultivated paddy grain is uniform and jet. Reject bags heavy with broken grain and dust.",
		store: "Airtight, cool and dark, where it keeps for years, since the bran left after hulling carries almost no oil to go rancid. Cooked, it holds four days refrigerated and freezes well in portions for salads.",
		prep: "Rinse, then boil in abundant salted water and drain: 45 to 55 minutes cultivated, 20 to 30 hand-harvested. Stop when about a third have split to show the pale interior; past that it goes woolly. Dress it warm.",
		methods: ["boiling", "simmering", "braising", "baking", "toasting"]
	},
	{
		t: "Aleppo Pepper",
		c: "The Herb & Chile Atlas",
		d: "Not a plain ground chile: coarse flakes of the Halaby pepper of the Aleppo region, sun-dried then cut with salt and usually a little oil, which is why it clumps slightly, glows dark rusty red and tastes savory instead of dusty. PUL BIBER is not the variety; it is Turkish for flake pepper and covers plain hot flakes too, so ask for MARAS BIBER, the Kahramanmaras crop that stands in for Aleppo. The oil holds fat-soluble aroma a dry powder loses and the salt preserves, so the jar seasons twice: pull back on salt elsewhere. Raisin, sun-dried tomato and a mild tang, often from citric acid added at packing, with a slow heat near 10,000 Scoville that builds rather than strikes. True Aleppo has been scarce since the Syrian war and most on the shelf is Turkish, which is close. Finish with it: eggs, yogurt, roast vegetables, lamb.",
		season: [],
		choose: "Coarse flakes that look faintly damp and oily, dark brick to burgundy, clumping when pressed between finger and thumb, smelling of raisin. Reject dry, bright orange, free-running flakes with no aroma at all.",
		store: "Airtight and dark, and refrigerated in a hot kitchen, because the oil in it can go rancid in a way dry flakes cannot. Six months for good color and aroma, a year at the outside. Never on the shelf above the stove.",
		prep: "No grinding needed. Finish with it, or bloom it the Turkish way in butter or oil warm enough to sizzle but not smoke, 30 to 60 seconds, off the burner: the pigment and sugars scorch above roughly 160C (320F). Account for the salt already in the jar and season the dish last, not first.",
		methods: ["finishing", "roasting", "grilling", "sauteing", "baking"]
	},
	{
		t: "Ancho",
		c: "The Herb & Chile Atlas",
		d: "Dried ripe poblano: the pod ripens red on the plant, then cures to a wrinkled mahogany sheet smelling of raisin, prune and cocoa. Those notes are not fanciful. Drying concentrates fruit sugars and lets slow Maillard browning and carotenoid breakdown build aroma compounds the fresh green pod never had. Heat is low, 1,000 to 2,000 Scoville, so ancho is the body and sweetness of a mole or an adobo, never the fire. Keep the family straight: MULATO is dried poblano too, from a strain that ripens brown not red, holding its chlorophyll; chocolate and licorice rather than raisin. Toast anchos flat on a dry comal, 15 to 20 seconds a side over medium, until they puff and smell of dried fruit, then soak 20 minutes and blend. Scorch one and the whole pot turns bitter with no way back.",
		season: [],
		choose: "Pliable and leathery, folding without cracking, deep reddish brown with a faint gloss; a good one bends like a dried apricot. Reject stiff, faded, dusty pods that snap, and any showing pinholes or webbing: pantry moth.",
		store: "Airtight, dark, room temperature, 6 to 12 months; the freezer holds them a year longer. Light bleaches the color and warmth drives off the aroma. Damp softness with a musty smell is mold: discard the pod, do not trim it.",
		prep: "Wipe with a damp cloth, stem, slit lengthwise, shake out seeds and pale veins. Gloves, or wash your hands before you touch your eyes. Soak after toasting, never before, and use the soaking water only if it tastes sweet.",
		methods: ["toasting", "simmering", "braising", "stewing", "frying"]
	},
	{
		t: "Cascabel",
		c: "The Herb & Chile Atlas",
		d: "A small round chile the size of a walnut, dried until the seeds come loose and rattle inside the hollow shell, exactly what the name means: little rattle, or sleigh bell. Shake the bag as a freshness test: a silent pod has taken up moisture and is heading for mold. Keep it for the flavor, nutty and woody, tobacco and a smoky note from drying alone with no smoke involved, over a mild 1,500 to 3,000 Scoville. The wall is thin and hard, which is why it dries hollow and rattles at all, so take flavor from it and body from a guajillo: toast and blend with tomatillo, or with toasted sesame and pumpkin seed. Toast whole and watch it: the round shape traps heat and one side burns while you study the other.",
		season: [],
		choose: "Round, firm, deep reddish brown with smooth skin, and a clear rattle when shaken by the handful. Reject silent, soft or split pods. Gray or white film that looks fuzzy or smells musty is mold: bin it, since mold toxins survive toasting and soaking.",
		store: "Airtight and dark at room temperature, about 12 months. Moisture silences the rattle and invites mold, so add a food-safe desiccant packet in a humid kitchen. Freeze the surplus if you buy by the kilo.",
		prep: "Cut a circle around the stem end and tip the seeds out; there are many and they are bitter. Toast 20 to 30 seconds, turning constantly, then soak 20 minutes. Blend well and strain: the skin is tougher than it looks.",
		methods: ["toasting", "simmering", "braising", "stewing", "frying"]
	},
	{
		t: "Chervil",
		c: "The Herb & Chile Atlas",
		d: "The most heat-fragile herb in the kitchen: a lace-leaved cousin of parsley whose aroma is a whisper of anise over green, carried by estragole in a leaf so thin that thirty seconds over a flame takes all of it. Nothing else in the fines herbes quartet, with parsley, chives and tarragon, is lost so easily, and nothing is so easily wasted: chervil in a braise is money burned. Its place is at the very end and away from the heat, on an omelette as it folds, into a beurre blanc once the pan is off, over young peas and carrots, or whole in a delicate salad where the sprig goes in intact. Buy it the day you need it and no sooner. If you cannot find it, use a little tarragon with parsley and be honest that you have made a different dish.",
		season: [3, 4, 5, 9, 10],
		choose: "Pale bright green lacy sprigs that stand rather than flop, with faint sweet anise on the rub. Reject anything wilted, darkened, or wet at the cut base, because chervil never recovers once it has collapsed. Buy it or sow it, never gather it: poison hemlock and fool's parsley wear the same lace and both can kill. Chervil has a ridged, finely hairy stem and smells sweetly of anise; hemlock's stem is smooth, hollow and blotched purple, and both impostors smell rank. In any doubt, throw it out.",
		store: "The shortest life of any herb: two to three days, loosely boxed between dry paper at 4 C (39 F), unwashed until the moment of use. Treat a bunch you cannot finish in two days as tonight's ingredient.",
		prep: "Pinch whole sprigs off the stem and leave them whole, since chopping costs you both the look and most of the aroma. If you must cut, one pass with scissors. Scatter it at the table, not in the pan.",
		methods: ["raw", "garnishing", "infusing", "blending"]
	},
	{
		t: "Chile de Arbol",
		c: "The Herb & Chile Atlas",
		d: "A slim glossy scarlet pod on a woody stem, the name meaning tree chile for that stalk. This is a heat chile first, 15,000 to 30,000 Scoville, clean and forward, with a thin skin and almost no flesh, so it lends a sauce almost no body or sweetness: build the sauce from guajillo or ancho and let arbol do the striking. Its aroma is grassy and nutty rather than fruity, and it sits behind the fire of salsa de arbol, salsa macha and the chile oils of the Mexican table. The thin wall fries in seconds, so drop the pods into warm oil, not hot, and lift them the moment they darken by a shade. Blackened arbol is acrid and will ruin a liter of oil. Count pods instead of guessing spoonfuls: one seeds a whole pot of beans.",
		season: [],
		choose: "Bright glossy red, straight, whole, stem attached, no splits down the side. Reject dull brick or orange pods and bags full of broken shards and loose seed dust: both mean old stock and a flat, stale kind of heat.",
		store: "Airtight and dark, about 12 months. Capsaicin is stable but the aroma is not, and whole pods keep far better than ground. Store well away from anything absorbent you would rather not have tasting of chile.",
		prep: "Wear gloves, and note water will not rinse capsaicin off: scrub with oil, then soap. Heat sits in the pale veins, not the seeds, so strip the veins for less. Toast dry 5 to 10 seconds, or fry in warm oil with the fan on and a window open, since frying pods aerosolizes capsaicin and sets off coughing.",
		methods: ["toasting", "frying", "simmering", "stewing", "infusing"]
	},
	{
		t: "Chipotle",
		c: "The Herb & Chile Atlas",
		d: "Ripe red jalapeno, smoke-dried for days over hardwood until the flesh goes leathery. Sweetness is sugar concentrating as water leaves plus smoke phenols; nothing caramelizes at smokehouse heat. Two kinds, and they do not behave alike. MORITA is what most shops sell: smaller, purple-black, dried less, pliable, fruity, sweeter in a sauce. MECO is the traditional one, dusty tan-brown like a cigar butt, smoked far longer, drier, savory and tarry. Heat sits around 5,000 to 10,000 Scoville, and smoke makes it read hotter than it measures. CHIPOTLES EN ADOBO are moritas stewed with tomato and vinegar, a third ingredient again, and the canned sauce is worth as much as the pods. Treat smoke as a seasoning: one or two pods carry a whole pot.",
		season: [],
		choose: "Moritas should flex and shine purple-black with a clean smoke smell; mecos are matte tan and rigid, which is correct rather than stale. Reject anything smelling of ash or creosote, which means oversmoked and bitter.",
		store: "Airtight and dark, 6 to 12 months; the smoke aroma is the first thing to go. Move opened canned chipotles in adobo to a glass jar, refrigerate, use within 2 weeks, or freeze the surplus in tablespoon portions.",
		prep: "Stem and split the dry pods and scrape out the pale veins, where the heat sits; the seeds are only along for the ride. Soak 30 minutes, mecos longer than moritas. Scrape canned pods the same way, then mince fine.",
		methods: ["toasting", "simmering", "braising", "stewing", "grilling"]
	},
	{
		t: "Chives",
		c: "The Herb & Chile Atlas",
		d: "A true allium, and the mildest of them: cut the hollow leaf and alliinase meets its sulfur precursors and builds thiosulfinates in seconds, the same reaction that gives a raw onion its bite, but from a far smaller store, so the result is onion perfume instead of onion punch. Those thiosulfinates are volatile and fall apart with heat into dull sulfides, which is why cooked chives taste of nothing much and slump into green threads. They go on at the end: potatoes, eggs, sour cream, a finished soup. GARLIC CHIVES (nira, or Chinese chives) are a different species with a flat solid leaf and a real garlic note, and those do hold their own in a hot wok. The purple flower heads are edible and sharper than the leaves: pull them into florets, discard the wiry stalk, and use fewer than you think. Snip chives with scissors, since a blade crushes the tube flat and wrings it out onto the board.",
		season: [4, 5, 6, 7, 8, 9, 10],
		choose: "Stiff upright uniformly green tubes that snap rather than fold, smelling cleanly of onion. Reject yellow or translucent strands, flattened bunches, and any wet patch under the band, which spreads through the bundle.",
		store: "Dry, loosely wrapped in paper inside a box at 4 C (39 F): about a week, and moisture is the only real enemy. Cut chives hold almost nothing, so snip what the plate needs and no more.",
		prep: "Hold a small bundle taut and cut straight down with sharp scissors into even lengths; dragging a dull knife squeezes them empty. Do not wash unless you have to, and dry them completely before cutting.",
		methods: ["raw", "garnishing", "infusing", "stir-frying", "blending"]
	},
	{
		t: "Cilantro",
		c: "The Herb & Chile Atlas",
		d: "The leaf and the seed are the same plant and taste nothing alike: the leaf is built on unsaturated aldehydes, chiefly (E)-2-decenal, while the dried seed is mostly linalool and reads sweet, citrus and woody. Those leaf aldehydes belong to the same chemical family as some soap perfumes and as the defensive spray of true bugs, which is why a real minority of cooks taste soap and nothing else. The genetics are partial: a common variant in a cluster of smell receptor genes, OR6A2 among them, shifts the odds without settling it. So it is not fussiness, but it is not fixed either: exposure dulls it, and crushing helps, since leaf enzymes break the aldehydes down and blended cilantro reads milder than torn. Serve it alongside, not stirred through, for strangers. The aldehydes are light and they leave: cilantro goes in off the heat. The roots go into Thai curry paste, and the stems carry more flavor than the leaves.",
		season: [3, 4, 5, 9, 10, 11],
		choose: "Bright green, firm stems that snap, roots still attached if you can get them. Reject limp dark tips, yellowing, and any bunch running to flower: bolted cilantro goes thin, ferny and bitter.",
		store: "Roots or stem ends in a jar of water, a loose bag over the leaves, 4 C (39 F): five to seven days. It rots faster than parsley, so pull out any slick leaf the moment you see one.",
		prep: "Wash in a full bowl twice and dry it completely: that takes the sand off, and not much else. Fresh cilantro has carried Cyclospora, hepatitis A and Salmonella, and no rinse or vinegar soak removes them, so cook it in rather than scatter it raw for anyone pregnant, frail or immune compromised. Use the stems: cut them in with the leaves for salsa, or very fine for a paste. Add at the last second, because chopped cilantro fades within ten minutes.",
		methods: ["raw", "garnishing", "blending", "stir-frying", "pickling"]
	},
	{
		t: "Dill",
		c: "The Herb & Chile Atlas",
		d: "Dill leaf is not a carvone herb: its signature is alpha-phellandrene with dill ether, and carvone belongs to the seed. Seed and spearmint carry mirror-image carvones, which is why one reads caraway and the other cooling. The feathery leaf, the yellow flower head and the dried seed are three separate ingredients. Leaf is delicate and volatile; the flower head is the traditional crown in a jar of brined cucumbers; the seed is warmer, closer to caraway, and stands up to bread and to a long braise. Leaf dill collapses within a minute of heat, so its work is cold: gravlax, cucumber and yogurt, potato salad, smoked fish, the final stir into borscht or chicken soup. Cut it with scissors rather than a knife, because the fronds are too fine to chop without crushing them to a green paste.",
		season: [5, 6, 7, 8],
		choose: "Fine springy blue-green fronds that smell sharp when brushed. Reject yellowing, matted or slimy heads, and bunches that are mostly thick stalk: you are buying frond, and stem is dead weight.",
		store: "Stem ends in water, bagged, at 4 C (39 F): five to seven days at best, since dill is the fastest herb to slime. To hold it longer, cut it and freeze it under oil; dried dill weed keeps almost nothing.",
		prep: "Snip the fronds off the stalk with scissors straight over the bowl. Keep the tender upper stems for stocks and pickling brines. Add at the very end and never let it boil: a minute at heat and the phellandrene is gone.",
		methods: ["raw", "garnishing", "curing", "pickling", "infusing", "steaming"]
	},
	{
		t: "Epazote",
		c: "The Herb & Chile Atlas",
		d: "The exception in this chapter: the herb you add at the beginning rather than the end. Epazote is Dysphania ambrosioides, a goosefoot, and its aroma, medicinal and resinous, faintly of fuel and savory at once, comes chiefly from ASCARIDOLE, a peroxide terpene. It survives a bean pot far better than a tender herb, though a long simmer still dulls it, so add a second sprig near the end. Ascaridole is also the rule of the house. The oil is poisonous in doses a kitchen would call small and has killed; the seed heads carry the most of it and the leaves the least. A sprig or two in a pot feeding eight is the culinary amount and is long established as safe, but leave it out altogether in pregnancy: ascaridole stimulates the uterus and this plant was long used to end pregnancies. Cook with the leaf, never with the oil.",
		season: [6, 7, 8, 9],
		choose: "Jagged pointed mid-green leaves on a single upright stem, with a sharp medicinal smell you will not mistake for anything else. Reject flowering stalks heavy with seed, which are coarse and much stronger, and yellowed lower growth.",
		store: "Stem ends in water under a loose bag at 4 C (39 F): four to five days. It dries better than most tender herbs, but ascaridole is volatile and most of it leaves with the water, so the dried leaf is milder: jar it away from light and use more, not less, about a tablespoon crumbled for a fresh sprig.",
		prep: "Strip the leaves off the woody lower stem, or drop a whole tender sprig in the pot and fish it out later. Chop fine only for quesadillas and mole verde, where it goes in raw. One sprig per pot is the working measure.",
		methods: ["simmering", "stewing", "braising", "frying", "steaming"]
	},
	{
		t: "Flat-leaf Parsley",
		c: "The Herb & Chile Atlas",
		d: "The workhorse of the soft herbs and the only one that shrugs off a little heat: the fresh leaf runs on p-mentha-1,3,8-triene and myrcene with myristicin behind them, all less fugitive than cilantro's aldehydes, so a minute in a hot pan bruises it rather than erasing it. Apiole sits in the seed and root, not the leaf. The flat Italian leaf is more aromatic than the curly, which was bred for the plate rim. Stems carry less volatile oil than the leaf but plenty of flavor: tie them into a bouquet garni, or cut them fine for gremolata, persillade and tabbouleh, where parsley is the salad and not the garnish. Chopped parsley darkens because polyphenol oxidase meets phenolics in crushed cells, not because of chlorophyll, which only goes olive under acid and heat. Chop it last, sharp blade, one pass, plate within a minute.",
		season: [5, 6, 7, 8, 9, 10],
		choose: "Deep uniform green, springy stems, leaves that stand up when you shake the bunch. Reject yellowing at the tie, blackened slimy stem ends, or a bunch that smells of wet grass clippings. Garden or foraged bunches need a second look: fool's parsley and poison hemlock both mimic the flat leaf and both are poisonous. Crushed parsley smells of parsley; hemlock smells rank and mousy and its hairless stem is blotched purple. Anything that fails that test goes in the bin, not the pot.",
		store: "Trim the stems, stand the bunch in 2 cm of water, bag it loosely, hold at 4 C (39 F): ten days, changing the water twice. Washed and left damp in a sealed box it turns to slime in two days.",
		prep: "Wash and dry it hard, spinner then towel, because wet parsley smears instead of cutting. Strip the leaves off thick stems, gather them into a tight ball, rock a sharp knife through once. Over-chopping bleeds green juice onto the board.",
		methods: ["raw", "garnishing", "blanching", "deep-frying", "infusing", "simmering"]
	},
	{
		t: "Fresno Chile",
		c: "The Herb & Chile Atlas",
		d: "The chile mistaken for a red jalapeno on every line in America, and it is not one. The Fresno has a thinner wall, a body that tapers to a cone rather than a blunt barrel, and a pod that points up on the plant. It runs 2,500 to 10,000 Scoville with a fruitier, brighter, less vegetal flavor, because a Fresno is picked ripe while a jalapeno is picked green. That thin wall is the working difference: it will not stuff and it collapses under long roasting, but it cuts into clean scarlet rings that hold their color raw, which is the whole reason cooks reach for it. Garnish, ceviche, quick pickles, a red flick across a green plate. The heat still concentrates in the PLACENTA, and that pith is narrow here, so seeding is quick and effective. Slice it in rings with a sharp knife and use it raw or barely warmed.",
		season: [8, 9, 10],
		choose: "Glossy scarlet cones, firm and taut, with a green stem still attached; a dried shriveled stem means weeks off the plant. Reject dull matte skin, soft tips, and any pod with a wrinkled band around the shoulder.",
		store: "Loose in the refrigerator crisper, 1 to 2 weeks; ripe fruit goes over faster than a green chile does. Sliced into vinegar with a pinch of salt and sugar they hold 3 weeks and keep their scarlet.",
		prep: "Gloves, even for two pods: capsaicin is oil soluble, so it survives soap and water on bare fingers and finds eyes and contact lenses hours later. Top, halve, strip the narrow white pith with a paring knife, then slice even rings. Cut them last so the red does not bleed across the board.",
		methods: ["pickling", "grilling", "sauteing", "blending", "fermenting"]
	},
	{
		t: "Genovese Basil",
		c: "The Herb & Chile Atlas",
		d: "The basil of pesto and caprese: sweet, faintly clove-warm, built on linalool with eugenol behind it and no anise to speak of. That profile is fragile in both directions. Heat drives the volatiles off, so basil goes onto the pizza after the oven and into the sauce after the flame; and cold injures it below about 12 C (54 F), not by rupturing cells but by stiffening their membranes until they leak, which turns the leaf translucent and then black along the veins. That is why the refrigerator is the wrong home for a bunch of basil, and why bruised leaves darken anyway: leaking cells put polyphenol oxidase in contact with phenolics and air. For pesto you have two honest options. Work fast and cold with enough oil to seal every cut surface, or blanch the leaves five seconds and shock them, which denatures the enzyme and buys you a green sauce that holds overnight.",
		season: [6, 7, 8, 9],
		choose: "Large cupped glossy leaves in bright mid-green on firm stems. Reject black-flecked or translucent leaves, which have been chilled, and any bunch carrying flower spikes: once it flowers the leaf coarsens and turns bitter.",
		store: "Stems in water on the counter, out of direct sun, tented loosely, water changed daily: four to six days. Keep it above about 12 C (54 F). Anything you must keep longer goes into the freezer, as a paste under oil or packed into ice cube trays. Basil under oil left on the counter is a botulism risk: the leaf is low acid and moist and the oil shuts out air, which is what Clostridium botulinum wants. So herb pastes under oil live in the freezer, or cold for no more than four days, never on the shelf.",
		prep: "Do not chop it to death. Stack the leaves, roll them, cut one clean chiffonade, or tear by hand; a dull knife bruises and blackens. Wash before you pick the leaves off the stem and dry them, since water dulls pesto.",
		methods: ["raw", "garnishing", "blending", "infusing", "blanching", "pickling"]
	},
	{
		t: "Gochugaru",
		c: "The Herb & Chile Atlas",
		d: "Korean sun-dried Capsicum annuum, seeded and crushed not milled to dust, sweet and fruity. Graded mild to hot, 1,500 to 8,000 Scoville. The red is the carotenoid capsanthin; capsaicin is colorless. The cut is the thing, and the two grades are not interchangeable. COARSE, gulgeun, runs 1 to 3 mm and belongs in kimchi: the flakes cling and stay visible; carotenoids do not leach into brine. FINE, goun, is near powder and belongs in gochujang, stews and sauces, where it disperses. Fine in kimchi gives a muddy paste; coarse in a sauce never integrates. Sun-dried taeyangcho beats machine-dried. Buy the grade the recipe names, and buy small, because the color goes first.",
		season: [],
		choose: "Vivid red, slightly moist and pliable, smelling sweet and fruity. Reject dull brown-red flakes, hard caked lumps or any musty smell, since damp chile molds. Check the bag for the grade you need and for taeyangcho before you pay.",
		store: "Cold: Korean kitchens refrigerate or freeze this one as a matter of course, because warmth, light and air oxidize the carotenoids. Bag in a sealed box, six months chilled, a year frozen. Let a cold bag warm sealed before opening, or condensation cakes it.",
		prep: "No grinding, no soaking. Work it into a paste with garlic, fish sauce and a little water and let it stand 10 minutes to hydrate; flakes thrown in dry streak the kimchi and never spread. Wear gloves: capsaicin clings to bare hands for hours and finds your eyes.",
		methods: ["stewing", "simmering", "fermenting", "braising", "grilling"]
	},
	{
		t: "Guajillo",
		c: "The Herb & Chile Atlas",
		d: "Dried mirasol chile: a long smooth pod, thin-fleshed under a tough burgundy skin that should still bend. A papery, brittle pod is stale. Where ancho is soft and raisiny, guajillo is tannic and bright, green tea and berry with a tart edge from fruit acids that survive drying, at a clean 2,500 to 5,000 Scoville. That tough skin is the working problem: it will not break down in a blender, so guajillo sauce goes gritty unless you strain it. Soak, blend hard, push through a medium sieve, discard the flecks. It is the backbone red of birria, adobo and pozole rojo, usually married to ancho for sweetness and arbol for heat. Toast it barely, 10 seconds a side; it scorches before the pod ever puffs.",
		season: [],
		choose: "Deep translucent red, glossy, flexible enough to bend into a C without shattering. Reject brown or orange-faded pods, which have sat under light, and any that are brittle, dusty, or smell of cardboard rather than fruit.",
		store: "Airtight, dark and cool, 6 to 12 months for full aroma; the freezer buys another year. Thin flesh means guajillo fades faster than a fleshy pod. Never on a shelf above the stove: heat and light both strip it. Damp softness or a musty smell is mold: discard the pod, do not trim it.",
		prep: "Stem and seed before soaking; the seeds run bitter here. Gloves for a big batch: capsaicin stays on your fingers and finds your eyes later. Soak 20 to 30 minutes in water just off the boil, blend with some of that liquid, then strain. The skin is the reason a sauce feels sandy on the tongue.",
		methods: ["toasting", "simmering", "braising", "stewing", "frying"]
	},
	{
		t: "Habanero",
		c: "The Herb & Chile Atlas",
		d: "A different species from the jalapeno and serrano: Capsicum chinense, lantern-shaped, 100,000 to 350,000 Scoville and built on aroma as much as burn. The apricot, citrus and floral notes are volatile esters carried in the skin and wall, not in the pith, which is why a habanero with the PLACENTA scraped out still tastes unmistakably of habanero while burning a fraction as hard. The heat is slow: 20 to 30 seconds behind the first bite, then a long plateau across the whole mouth rather than a sharp front-of-tongue hit, so cooks who taste too fast overdose the pot. Capsaicin is fat and alcohol soluble and not water soluble, so a split pod bloomed in warm oil or coconut milk perfumes the entire batch. One pod seasons a liter of stew. Add it whole and lift it out when the heat is where you want it.",
		season: [8, 9, 10],
		choose: "Firm waxy lanterns that feel light for their size, skin taut and unbruised, stem green and still attached. Orange, red and chocolate strains all work. Reject pods with soft shoulders, wrinkled skin, or dark weeping patches.",
		store: "In a paper bag in the refrigerator, a week to ten days: the walls are thin and hollow, and this species pits in the cold sooner than a jalapeno does. A cool counter suits them. They freeze whole for months; dried, they hold their heat but lose most of the fruit.",
		prep: "Nitrile gloves, not latex, and a board scrubbed with soap; capsaicin clings to wood and skin for hours. Scraping the placenta cuts the heat, but a bare wall still outburns a jalapeno. Frying, charring or blending these puts capsaicin in the air, so run the hood and do not lean over the pan.",
		methods: ["simmering", "blending", "pickling", "roasting", "fermenting"]
	},
	{
		t: "Hatch Chile",
		c: "The Herb & Chile Atlas",
		d: "Not a cultivar but an appellation: New Mexico pod-type chiles grown in the Hatch Valley along the Rio Grande, where hot days and cold nights build sugar and a distinctly earthy, sun-baked flavor. The cultivar sets the heat, so the label matters more than the name: BIG JIM and NUMEX 6-4 sit around 500 to 2,500 Scoville, while SANDIA and BARKER'S run 5,000 to 15,000 and will ambush a cook expecting a mild green chile. The season is brutally short, roughly six weeks from August, which is why the whole state roasts at once in propane drum roasters: the char loosens that tough skin and the smoke becomes half the flavor. A year of cooking is bought in that window and frozen. Buy them roasted and treat the hot bag as a clock, because roasted chile is low acid and a sealed warm bag is airless: spread the pods in one layer, bag one-cup portions once they stop steaming, and get them into the freezer within two hours of the roaster. Write the cultivar and the heat on the bag.",
		season: [8, 9],
		choose: "Long, straight, thick-walled pods with glossy skin and no creased shoulders; a straight pod peels and stuffs cleanly. Ask for the cultivar and the heat grade by name. Reject thin curled pods and any with soft translucent patches.",
		store: "Fresh and unroasted, 1 week in the crisper. Roasted, cold within 2 hours of the roaster, then 3 days refrigerated or 12 months frozen with the skins left on; the skin is armor inside the bag, so peel them only as you use them.",
		prep: "Peel only after roasting, and only what you are about to cook. Wear gloves for a hot cultivar. Slit the pod, lift the seed core out whole, and keep every drop of juice that pools underneath; that juice is the sauce.",
		methods: ["roasting", "charring", "stuffing", "stewing", "grilling"]
	},
	{
		t: "Jalapeno",
		c: "The Herb & Chile Atlas",
		d: "The kitchen's default fresh chile: thick-walled, grassy, 2,500 to 8,000 Scoville depending on cultivar and on how hard the plant was stressed. The heat is capsaicin, and capsaicin is built in the PLACENTA, the white pith the seeds cling to; the seeds themselves are nearly innocent and only taste hot because they sat against that pith. Scrape the placenta out with the tip of a spoon and you keep the green flavor while cutting most of the burn. CORKING, the fine tan striations, is cuticle that split as the fruit outgrew it; it tracks cultivar and ripeness, so a corked pod is usually the older and hotter one. Left on the plant it ripens red and sweeter; smoked and dried at that stage it becomes CHIPOTLE. The thick wall is the point: it survives roasting, stuffing and pickling where a thin chile collapses. Slice it into coins across the pod for pickling, and wear gloves.",
		season: [7, 8, 9],
		choose: "Firm and heavy, glossy dark green with taut skin and a stiff green stem. Corked pods with tan striations are riper and usually hotter, not spoiled. Reject anything soft at the shoulder, wrinkled, or showing a sunken translucent spot.",
		store: "Loose and unbagged in the refrigerator crisper, 1 to 2 weeks; a sealed bag traps moisture and rots the stem end first. Long stretches below 7C (45F) pit the skin. Pickled in brine they hold for months.",
		prep: "Wear gloves: capsaicin moves from skin to eyes and contact lenses for hours afterward. Split lengthwise, scrape the white placenta out with a spoon to control heat, then slice. Do not seed them under running water; it spreads the oil, which is not water soluble.",
		methods: ["roasting", "grilling", "pickling", "stuffing", "sauteing", "smoking"]
	},
	{
		t: "Kashmiri Chile",
		c: "The Herb & Chile Atlas",
		d: "The Indian cook's color chile: a thin wrinkled deep-red pod grown in and around Kashmir, prized because it stains a dish scarlet at only 1,000 to 2,000 Scoville. The red is carotenoid pigment, mostly capsanthin, and it is fat-soluble, which is why blooming the powder in warm ghee or oil for 20 to 30 seconds draws out a color that stirring it into water never will. That is the whole trick behind rogan josh, tandoori marinades and every restaurant curry that looks fiercer than it tastes. Much of what is sold as Kashmiri outside India is byadgi or a blend, still honest for color. Bloom on low heat or off it: above roughly 160C (320F) the pigment scorches, going brown and bitter in the pan.",
		season: [],
		choose: "Whole pods long, wrinkled, deep brick-red and flexible, never brittle or blotched with white. Powder should be vivid brick-red and smell sweet and fruity; reject orange or dull brown. Fluorescent red means added dye, usually rhodamine B or a Sudan azo dye, both banned and carcinogenic. Test it: capsanthin is fat-soluble, so a pinch on cold water should barely tint it, while dye bleeds red at once.",
		store: "Airtight, dark and cool. Whole pods hold a year; powder loses color and aroma within 3 to 4 months of opening, so buy small. In a hot kitchen keep the jar cold, and never shake it over a steaming pan.",
		prep: "Shake the seeds out of whole pods before grinding for a smoother, sweeter powder. Bloom in warm fat before any liquid goes in. For color without more heat, swap half your usual chile powder for this and taste as you go.",
		methods: ["blooming", "toasting", "simmering", "braising", "grilling", "roasting"]
	},
	{
		t: "Lovage",
		c: "The Herb & Chile Atlas",
		d: "Celery multiplied: Levisticum officinale carries the same PHTHALIDES that make celery smell like celery (ligustilide, sedanolide), banked hardest in root and seed, while the leaf's warm, faintly aniseed top note is a terpene, alpha-terpinyl acetate. Germans call it Maggikraut because it smells like the bouillon, not because the bouillon contains any. Leaves, hollow stems and seeds all work; the root is the most concentrated part, a seasoning to dry and grate, not a vegetable. The mistake everybody makes is quantity. One or two leaves season a pot of stock or potato soup for six; a handful, used the way you would use parsley, turns the whole thing bitter and soapy. Treat it as an aromatic rather than a herb: count it in leaves, add it early to wet cooking, and taste before you add a second.",
		season: [4, 5, 6],
		choose: "Dark, glossy, deeply toothed leaves like flat parsley grown huge, on thick hollow stems, with a celery smell you catch at arm's length. Reject yellowing outer leaves, stems running to flower (bitter and coarse), and any bunch that smells faint. Cutting your own, trust the smell: poison hemlock self-seeds into beds, carries purple-blotched stems and smells stale and mousy, never of celery. Seed sold as lovage in South Asian shops is usually ajwain, all thyme and no celery.",
		store: "Refrigerator, stems in water or the bunch wrapped damp, about a week. Better: chop the leaves, pack them into an ice tray with water or oil, and freeze in single-dish portions. Dried lovage holds its celery note well for six months.",
		prep: "Leaves, tender stems and seeds all work; thick stems are hollow and stringy, so slice them thin or discard. Use one or two leaves where a recipe would take a handful of parsley. The sap carries furanocoumarins and is phototoxic: juice on skin plus sunlight can raise a burn that blisters hours later and leaves brown marks for months, so wash hands and forearms with soap, not a rinse.",
		methods: ["simmer", "braise", "stew", "blanch", "roast", "infuse"]
	},
	{
		t: "Marjoram",
		c: "The Herb & Chile Atlas",
		d: "The same genus as oregano behaving in the opposite direction: Origanum majorana makes little carvacrol and builds cis-SABINENE HYDRATE instead, a sweet, soft, faintly piney alcohol, so marjoram is floral where oregano is hot. That molecule is fragile. It degrades under long heat and open simmering, which is why marjoram is the one Origanum that has to be handled like a soft herb: in during the last few minutes, or off the heat, or stirred in cold. It carries pale, fatty, gentle things, and that is where it earns its place: bratwurst and liverwurst, Polish and Czech soups, egg dishes, roast potatoes, herbes de Provence. Never swap it one for one with oregano. It is sweeter and weaker, so you need more of it and you need it later.",
		season: [6, 7, 8, 9],
		choose: "Soft, rounded gray-green leaves on thin stems, with the knot-like buds at the tips that give it the name knotted marjoram, smelling sweet and piney, not sharp. Reject wet or blackening tips, and two impostors: wild marjoram is Origanum vulgare and pot marjoram is O. onites, both sharp oregano.",
		store: "Refrigerator, loosely bagged with a dry paper towel, about a week; it fades faster than oregano. Dried marjoram loses its sweetness inside six months, so buy small quantities often. Chopped into soft butter and rolled, it freezes well.",
		prep: "Strip the leaves; the thin stems are still stringy. Chop just before use and add in the last five minutes or off the heat entirely. If a recipe insists on a long braise, add half at the start for depth and half at the end for the perfume.",
		methods: ["saute", "bake", "roast", "simmer", "grill", "infuse"]
	},
	{
		t: "Mint",
		c: "The Herb & Chile Atlas",
		d: "The cooling is not temperature: menthol binds TRPM8, the nerve receptor that reports cold, so the mouth is told it has been chilled while nothing has actually changed. Which mint you have matters more than any recipe admits. SPEARMINT is dominated by carvone, grassy and sweet, and is the cooking mint: tabbouleh, lamb, raita, mojitos, the Vietnamese herb plate. PEPPERMINT carries far more menthol, reads medicinal in food, and belongs in tea, chocolate and candy. Moroccan mint is a spearmint; chocolate mint is a peppermint cultivar and tastes it; apple mint is another species, woolly and mild. Never cook with PENNYROYAL, a common garden mint whose pulegone attacks the liver; it has killed people as a tea. Heat drives the menthol off fast and long cooking turns the leaf hay-like, so mint goes raw into yogurt, dressings and finished plates, or into an infusion only as long as it takes to steep.",
		season: [5, 6, 7, 8, 9],
		choose: "Perky evenly green leaves that smell strongly from a light rub, stems that snap. Reject rust-colored spots on the leaf undersides, a fungus that runs through the whole bunch, and any blackened or wilted tips.",
		store: "Rolled in a barely damp towel in a box at 4 C (39 F): seven to ten days, the longest life of the tender herbs. Store it whole and pick as you go, because bruised leaves oxidize black within hours.",
		prep: "Pick the leaves off the stems, which are stringy and bitter. Stack, roll and cut a single chiffonade with a sharp blade, or tear. For syrup or tea, bruise gently and steep below the boil: boiled mint goes bitter.",
		methods: ["raw", "garnishing", "infusing", "blending", "pickling"]
	},
	{
		t: "Oregano",
		c: "The Herb & Chile Atlas",
		d: "CARVACROL is the molecule: the same phenol family as thyme's thymol, and the reason oregano reads as hot and medicinal rather than green. GREEK oregano (Origanum vulgare hirtum) carries the most and is the one worth buying; ordinary vulgare and ornamental forms can be close to flavorless. This is one of the very few herbs genuinely better dried, because the grassy volatiles leave while the heavy phenols stay and concentrate. MEXICAN OREGANO is not the same plant, or even the same family: Lippia graveolens is a verbena, but it makes thymol and carvacrol of its own, which is why it reads as oregano at all, over a citrus and cineole base the Greek plant has none of. It belongs in pozole, birria and chili, where the Mediterranean one tastes wrong. Add dried oregano early to anything wet.",
		season: [6, 7, 8],
		choose: "Fresh: rigid stems, small firm leaves, a smell that stings the nose slightly. Dried: whole leaves rather than powder, gray-green not brown, still loud when crushed. Reject dried oregano that smells mostly of the box it came in.",
		store: "Fresh keeps about a week in the refrigerator, loosely bagged. Dried is the real pantry form: whole leaf, airtight, dark, six to twelve months. Keep Mexican and Greek oregano in separate labeled jars; they are not interchangeable.",
		prep: "Crush dried leaves between your palms over the pot to fracture them and release the oil. Strip fresh leaves; the stems stay tough after an hour of cooking. Early into sauces and marinades, late into dressings and raw salads.",
		methods: ["simmer", "roast", "grill", "bake", "marinate", "stew"]
	},
	{
		t: "Padron Pepper",
		c: "The Herb & Chile Atlas",
		d: "Galicia's answer to the shishito and a tighter, thicker, nuttier pod: small, squat and heart-shouldered, grown around Herbon under its own protected name, Pemento de Herbon. The Galician saying is the warning, that some bite and some do not, and the lottery is real at the size you actually buy: two pods of the same length off the same plant can differ, because capsaicin is built in the PLACENTA in answer to stress, and drought, heat and hard sun in the field drive it far harder than pod size does. Size only sets the ceiling. A thumb-long pod has had the longest to load and the hottest of them reach about 2,500 Scoville, a mild jalapeno, while the same seed grown outside Galicia's cool wet summers runs hot at any size. The thicker wall changes the pan work too; they want more fat and a moment longer than a shishito, fried in a real pool of olive oil until the skin blisters and the flesh slumps. Fry hot, drain on paper, and hit them with coarse salt while still glossy.",
		season: [6, 7, 8, 9, 10],
		choose: "Small pods, 3 to 5 centimeters, firm, matte deep green, stems stiff and green. Uniform size cooks evenly. These ripen red, so skip any pod with a red blush or corky stretch marks, and skip soft, rubbery or thumb-long ones.",
		store: "In a vented or part open bag in the crisper, 4 to 5 days; a paper bag wicks them dry and they wrinkle fast once picked. They want damp air, not wet skin: do not wash until you cook, and shake out condensation.",
		prep: "Dry them thoroughly; water hitting hot oil spits and steams the skin instead of blistering it. Stems stay on as handles, seeds stay in, pods stay whole: pricking lets oil in and the pod's own juice out, so it spits worse. Fry one uncrowded layer, screen at hand, extractor on, since blistering chiles put capsaicin in the air.",
		methods: ["pan-frying", "blistering", "grilling", "roasting", "deep-frying"]
	},
	{
		t: "Pasilla",
		c: "The Herb & Chile Atlas",
		d: "Dried chilaca, a wrinkled near-black pod whose name means little raisin, and the source of the commonest chile error in an American kitchen: across California and the Pacific Northwest, fresh poblanos are sold as pasilla. They are not pasilla, and dried ancho in its place makes a mole sweeter and flatter than it should be. The true pod, sold as PASILLA NEGRO, is dark, herbal and faintly bitter: cocoa, prune and a woody tobacco finish at 1,000 to 2,500 Scoville. PASILLA DE OAXACA is another chile again: smoked, much hotter. It is the third leg with ancho and mulato in mole negro, and alone it sauces duck and white fish. Toast gently, 15 seconds a side; black skin hides scorching, so judge by smell, not color.",
		season: [],
		choose: "Nearly black with a violet cast, wrinkled but supple, 15 to 20 cm (6 to 8 in) long and narrow. Reject anything wide, heart-shaped and reddish: that is ancho mislabeled. Brittle pods are old stock; a gray bloom that will not brush off, or smells musty, is mold.",
		store: "Airtight and dark at room temperature, 6 to 12 months; freeze for a longer hold. Dark pods hide their fading, so date the bag. Any damp softness or musty smell is mold and the pod goes in the bin, not the pot.",
		prep: "Stem, slit, strip out seeds and the pale veins that carry most of the bite. Toast, then soak 20 minutes and blend. Strain for anything going on a plate rather than into a pot; the skin survives as dark flecks.",
		methods: ["toasting", "simmering", "braising", "stewing", "frying"]
	},
	{
		t: "Poblano",
		c: "The Herb & Chile Atlas",
		d: "The broad, heart-shaped chile of central Mexico, 1,000 to 2,000 Scoville: mild enough to eat as a vegetable, though a drought-stressed plant will throw a pod that bites. Two things define it. The wall is thick and meaty, which is why it stuffs for chiles rellenos where a thin chile tears. The skin is tough and papery and never softens in cooking, so it has to be blistered off: char the pod black over flame or under a broiler, shut it in a covered bowl for ten minutes so its own steam lifts the skin, then rub it away dry. Do not rinse the peeled flesh; that washes the smoke down the drain. The green pod you buy is immature; left to ripen red and then dried it becomes the ANCHO, the raisin-and-coffee base of mole and adobo, and a browner strain dried the same way is the MULATO. Char, steam, peel, then cut into rajas.",
		season: [8, 9, 10],
		choose: "Deep green, nearly black-green, broad flat shoulder, a straight body that will lie down in a pan. Firm, heavy, unblemished. Much of the US labels it pasilla, so buy the shape, not the sign; true pasilla is dried chilaca. Reject twisted pods and soft brown pitting.",
		store: "Unwrapped in the crisper, up to 1 week: the flesh under that tough skin goes slack faster than a jalapeno's. Charred and peeled, they keep 3 days refrigerated, or freeze flat in sheets with paper between them.",
		prep: "Char over a live flame until the skin blisters black, cover, and let the trapped steam loosen it; rub the skin away dry. For rellenos, slit one side only and lift the seed core out through the slit, leaving the shoulders intact.",
		methods: ["roasting", "charring", "stuffing", "braising", "frying"]
	},
	{
		t: "Rosemary",
		c: "The Herb & Chile Atlas",
		d: "The leathery needle is the point: oil glands under a distended cuticle hold CAMPHOR, 1,8-cineole and alpha-pinene, terpenes that read as pine and medicine, alongside CARNOSIC ACID, a phenolic diterpene sold as an extract to stop fats going rancid. Those terpenes are lighter than thyme's phenols, pinene leaving at 155C, so a long roast burns off the pine and leaves camphor and resin: add a second sprig late for brightness. Half a sprig still flavors a kilo of potatoes. The terpenes are fat-soluble and barely water-soluble, so bloom rosemary in warm oil or butter and the flavor spreads evenly instead of landing in bitter chopped pockets. Keep sprigs in fat or under the meat, not bare on a hot tray where they scorch acrid; chop to near dust, because a whole needle in a mouthful is a splinter.",
		season: [],
		choose: "Firm upright branches, needles deep green above and silver beneath, pliable rather than snapping, releasing pine when rubbed: needles that crack off dry have already lost oil. Reject black or shriveled needles, limp tips, and the gray webbing of spider mites at the growing tips.",
		store: "Refrigerator in a loose bag, two to three weeks, or stood in a glass of water on the counter for a week like a cut flower. It dries better than most herbs: hang bunches in the dark and strip when brittle. Whole sprigs freeze with little loss.",
		prep: "Strip needles backwards down the stem, then chop them to near dust. Bloom the chop in warm oil or butter before the other aromatics rather than throwing it dry into liquid. Save thick stems as skewers for lamb, or as brushes for basting.",
		methods: ["roast", "grill", "braise", "bake", "infuse", "smoke"]
	},
	{
		t: "Sage",
		c: "The Herb & Chile Atlas",
		d: "A woolly leaf, but the wool is not the store: the oil sits in separate pinhead glands among those branched hairs, holding THUJONE with camphor and 1,8-cineole, a resinous, faintly bitter smell that cuts fat, which is why sage lives with pork, sausage, liver, beans and brown butter. Heat is how you tame it. Slide the leaves in while the butter still foams, near 110C (230F), where the water boiling out of the butter caps the pan: the leaf dries, goes brittle, and sheds its sharpest camphor while the milk solids brown nutty around it. Pull them when the foam falls and the butter turns nut brown, a moment before the solids blacken. Thujone is a real neurotoxin, but dose is everything: leaves in a stuffing are irrelevant, while sage TEA drunk in quantity, or the essential oil, is where thujone actually matters, so treat sage as a seasoning and not a daily infusion. Cook it. Raw sage is aggressive and stays aggressive.",
		season: [5, 6, 7, 8, 9, 10],
		choose: "Leaves thick, velvety, dry, pale gray-green, firm off the stem, camphorous when rubbed. Purple sage is the same species and as strong; mild means Greek sage; pineapple sage is another plant, fruity, no substitute. Reject limp leaves, black spots, or a musty smell.",
		store: "Refrigerator in a loose bag with a dry paper towel, one to two weeks; trapped moisture rots the felted surface first. Dry it whole, fast and in the dark, or it turns to musty hay. Leaves crisped in butter keep a day in a tin, uncovered.",
		prep: "Pick the leaves off and do not chop until the last moment: bruising sage releases its harshest camphor notes early. For frying, leaves must be bone dry or the butter spits. Chiffonade for stuffings, whole leaves for the pan.",
		methods: ["fry", "roast", "braise", "bake", "stew", "infuse"]
	},
	{
		t: "Scotch Bonnet",
		c: "The Herb & Chile Atlas",
		d: "The Caribbean sibling of the habanero and the same species, Capsicum chinense: squat as a tam o'shanter with a puckered base, 100,000 to 350,000 Scoville, and rounder, sweeter and more tropical where the habanero leans sharp and citric. It is not interchangeable in the dishes built on it. Jerk depends on the bonnet with allspice and thyme, and so do Jamaican pepper sauce, Trinidadian green seasoning and the Haitian pikliz that cuts fried pork. The burn sits in the PLACENTA, the white pith the seeds hang from, while the wall carries the fruit; shaking out seeds does little, but a pod scraped clean of pith gives the perfume with a fraction of the heat. In a stew the classic move is to drop the pod in whole and unbroken, let it steep, and lift it out before it splits. Use it whole, watch it, and do not stir it into shreds.",
		season: [8, 9, 10],
		choose: "Squat glossy pods with deep creases, thick walls and a fresh green stem; yellow through scarlet are all ripe. Weight in the hand means flesh. Reject shriveled or dull pods, and any with a soft crease that yields to a thumb.",
		store: "In paper in the refrigerator, 2 to 3 weeks. They freeze whole in a bag for a year and drop into a pot straight from frozen. Packed in vinegar with onion and carrot they keep for months and only improve.",
		prep: "Gloves, and keep your hands off your eyes. To flavor without fire, simmer the pod whole and unpricked and lift it out intact; any breach lets the burn into the pot. To use it hot, split it and scrape the white pith and seed platform out with a spoon. Capsaicin does not rinse off, so soap the board, the knife and the sink, and lift a blender lid away from your face.",
		methods: ["simmering", "braising", "grilling", "pickling", "blending"]
	},
	{
		t: "Serrano",
		c: "The Herb & Chile Atlas",
		d: "Slimmer and cleaner than a jalapeno, running 10,000 to 25,000 Scoville: two to five times the burn in a pod half the size. The wall is thin, and that changes the cooking. There is no tough papery skin worth charring off, so serranos go into the pan or the molcajete whole rather than being roasted and peeled. The heat still lives in the PLACENTA, the white pith, but a serrano packs nearly as much pith into a third of the flesh, so scraping it buys less relief than in a fatter chile; use fewer pods instead. Raw, the flavor is bright, green and almost metallic; ripened to red or brown it turns sweet and rounded. This is the chile of pico de gallo and salsa verde, where the fruit is barely cooked at all. Mince it seeds and all for salsa cruda, and taste one sliver before you commit the bowl.",
		season: [7, 8, 9],
		choose: "Slim rigid pods that snap rather than bend, deep green and glossy, with a green stem still attached. Red ones are simply ripe, sweeter, and fine to use. Reject limp rubbery pods and any with a soft brown collar at the stem.",
		store: "Loose in the crisper up to 2 weeks; wrapped in paper inside a container beats plastic, which sweats them soft. They freeze whole in a bag for months and go straight from frozen into the blender for salsa.",
		prep: "Gloves on. Top and mince fine, pith and seeds included, for raw salsa; for less burn, ring the pod and discard the stem-end third, where the placenta is densest. Never wipe an eye with a forearm at the board.",
		methods: ["roasting", "grilling", "pickling", "simmering", "sauteing"]
	},
	{
		t: "Shishito",
		c: "The Herb & Chile Atlas",
		d: "A thin-walled Japanese frying pepper, 50 to 200 Scoville, whose crumpled tip is said to resemble a lion's face, which is where the name comes from. Roughly one pod in ten is genuinely hot, and that is not folklore: water stress, heat and sun during fruiting push a plant to make more capsaicin, and pods on one branch do not get an equal share, so a bag cannot be sorted by eye. Heat is not the point anyway; the blister is. Thin walls cook a pod through in two or three minutes, and the skin scorches in patches while the flesh steams in its own moisture, going sweet, smoky and slippery. That needs a screaming pan and a thin film of oil to carry heat into the skin: crowd a cool pan and the temperature crashes, the pods weep, and they stew to khaki instead. Get the oil shimmering, toss until blackened in patches, then salt and squeeze lemon over.",
		season: [6, 7, 8, 9],
		choose: "Slender bright green wrinkled pods with firm walls and green stems; small and uniform cooks evenly. Ripe red ones are sweeter and likelier to be the hot ones. Reject limp pods, yellowing skin, and any soft at the tip.",
		store: "In a paper bag in the crisper, 5 to 7 days; they lose their snap fast and go leathery in plastic. Do not wash before storing. Once blistered they are worth eating inside the hour and never the next day.",
		prep: "No prep beyond drying them completely: wet pods steam instead of blistering. Leave the stems on as handles and the seeds in. Pierce each pod once with a knife tip so trapped steam cannot burst it in the pan.",
		methods: ["blistering", "pan-frying", "grilling", "deep-frying", "roasting"]
	},
	{
		t: "Shiso",
		c: "The Herb & Chile Atlas",
		d: "A mint-family leaf that tastes like nothing else in the family: the signature is perillaldehyde, and it reads as basil, mint, cumin and a cold anise all at once. GREEN SHISO (aojiso), Perilla frutescens var. crispa, is the sashimi leaf, the serrated flag under raw fish; its oil is antibacterial in a lab, which is no safeguard for the fish it sits on. RED SHISO (akajiso) carries shisonin, a cyanidin pigment that stains umeboshi and the beni shoga pickled in the leftover ume brine; acid does not make the color, it holds the pigment in its red form instead of letting it slide blue-gray. Korean perilla (kkaennip) is the other variety, var. frutescens, broader and flatter, smelling of perilla ketone rather than perillaldehyde, earthy and musty rather than licorice; it is not a swap. The aldehyde flashes off over heat, so use the leaf raw, or batter one side only and fry it briefly for tempura, which shields the aroma under the coating.",
		season: [6, 7, 8, 9],
		choose: "Whole dry unbroken leaves with crisp serrations and a strong smell from a light rub. Reject torn or bruised leaves, black spotting, and any that have gone limp and papery around the edges.",
		store: "Stacked flat between dry paper in a sealed box, in the warmest part of the fridge or a cool room near 10 C (50 F): five to seven days. Below about 8 C (46 F) the leaf takes chilling injury and spots black. Water sitting on a leaf rots it in a day, so stems in water under a bag works only if the leaves stay dry.",
		prep: "Rinse only if it needs it and pat completely dry. Use leaves whole under fish or around rice; for a garnish, stack, roll and cut a fine chiffonade with a very sharp knife, since the cut edge bruises black.",
		methods: ["raw", "garnishing", "deep-frying", "pickling", "infusing"]
	},
	{
		t: "Summer Savory",
		c: "The Herb & Chile Atlas",
		d: "Satureja hortensis, an annual with soft narrow leaves and a peppery bite from CARVACROL, riding on the gamma-terpinene and p-cymene the plant builds it from: thyme's family of phenols pitched lower and hotter, closer to mild black pepper than to anything green. It is the bean herb, Bohnenkraut in German, cooked with every kind of legume, through Bulgarian chubritsa, Georgian and Romanian pots and old English pease; the tradition says it eases the wind beans cause, and true or not it seasons them better than anything else on the shelf. WINTER SAVORY (Satureja montana) is the perennial cousin: woodier, more resinous, more bitter, and the one for long braises and cured sausage. Summer savory sits between hardy and soft, so use it twice: a sprig with the aromatics, and a chopped pinch at the end.",
		season: [7, 8, 9],
		choose: "Fresh: soft fine leaves on green stems, peppery when rubbed; bunches just coming into bloom are strongest, since the oil peaks at flowering. Dried: gray-green whole leaf smelling of thyme and pepper. Reject brittle brown stems, seeded stalks, and savory faded to hay.",
		store: "Refrigerator in a loose bag with a dry cloth, about a week fresh. It dries unusually well: hang bunches in the dark, strip, and keep whole leaf airtight for a year. Bulgarian chubritza blends keep on the same terms.",
		prep: "Strip leaves from any stem thicker than a matchstick. Chop fine for sausage meat and bean pots so it disperses. The peppery top notes go first under heat, so hold back a third of the herb for the last few minutes.",
		methods: ["simmer", "stew", "braise", "roast", "grill", "cure"]
	},
	{
		t: "Tarragon",
		c: "The Herb & Chile Atlas",
		d: "French tarragon is a sterile plant: it sets no viable seed and is propagated only from cuttings, and that single fact tells you what to buy. Anything offered as tarragon seed is RUSSIAN tarragon, a taller, coarser, nearly flavorless relative that looks close enough to fool a shopper. The French plant runs on estragole, the same compound that carries chervil and Thai basil but here far more insistent, with ocimene and limonene behind it, not anethole, and it leaves a faint numbing bitterness at the back of the tongue. It is a tender herb that rewards a short infusion: steeped in warmed vinegar, reduced into the base of a bearnaise, slipped under the skin of a chicken. Use it alone or nearly alone. Tarragon does not share a plate politely, and a heavy hand turns a good sauce into licorice.",
		season: [5, 6, 7, 8, 9],
		choose: "Slim glossy dark leaves on supple stems, and a strong anise hit from one rubbed leaf. Reject pale broad dull foliage with little smell, which is the Russian plant, and any blackening where the stems were cut.",
		store: "Wrapped in a barely damp towel and boxed at 4 C (39 F): about five days. For months, steep the sprigs in white wine vinegar, where the acid keeps them. Herb butter works too but belongs in the freezer: the wet leaves turn it in the cold box long before months are up.",
		prep: "Strip the leaves downward off the stem, discarding the woody bitter lower inch. Chop coarsely and only just before use, then taste as you go: tarragon keeps gaining strength as it sits in a warm sauce.",
		methods: ["raw", "infusing", "poaching", "roasting", "garnishing", "pickling"]
	},
	{
		t: "Thai Basil",
		c: "The Herb & Chile Atlas",
		d: "Not a substitute for Genovese and not interchangeable with it: the leaf is narrow, the stems and flower spikes purple, and the aroma is frank anise, because the dominant compound is estragole (methyl chavicol) rather than linalool. It is also sturdier in the pot, its oil held in a firmer, waxier leaf, so it survives a minute of curry where sweet basil would simply vanish. That is how it flavors green curry, drunken noodles, and the herb plate beside a bowl of pho. Do not confuse it with HOLY BASIL (kaphrao), a hairier, duller, peppery leaf carrying eugenol, which is what belongs in pad kaphrao; that swap is the commonest fault in a home version of the dish. Stir Thai basil in during the last thirty seconds and put the lid on, so the steam carries the anise up through everything.",
		season: [6, 7, 8, 9],
		choose: "Firm purple stems, taut unblemished leaves, a clear licorice smell from one rubbed leaf. Reject wilted or water-soaked leaves, black chilled edges, and bunches with no aroma at all when you crush a tip.",
		store: "Like sweet basil, stems in water at room temperature, out of sun: four to five days. Never refrigerate it; chilling injury starts below about 10 C (50 F) and blackens the leaf. Aim for 12 to 15 C (54 to 59 F).",
		prep: "Pick leaves and tender tips off the woody lower stems; the flower spikes are edible and intensely anise, so use them too. Leave leaves whole, because cutting spends the oil on the board rather than in the bowl.",
		methods: ["raw", "stir-frying", "simmering", "steaming", "garnishing", "infusing"]
	},
	{
		t: "Thai Bird Chile",
		c: "The Herb & Chile Atlas",
		d: "Prik kee noo, the bird's eye: a finger-joint pod running 50,000 to 100,000 Scoville, thin-walled and almost all placenta and seed, which is why there is no way to seed it into mildness. The burn arrives fast and sharp at the front of the mouth and clears faster than a habanero's, so Thai cooking can use a lot of it without flattening the palate; the balance comes from fish sauce, lime and palm sugar answering the heat, not from restraint with the pod. Green ones are grassy and more aggressive, red ones riper and a shade sweeter. Bruising matters more than chopping: pounded in a mortar with garlic and salt, the cells rupture and release capsaicin and aroma into the paste, where sliced coins would sit there as hot flecks. Pound them, and count the pods aloud so the next cook knows what is in the bowl.",
		season: [7, 8, 9],
		choose: "Rigid pods no longer than a finger joint, taut skin, stems that snap when bent. Bags marked Thai chile often hold the longer, milder prik chee fa, so buy by size. Green and red both work. Reject leathery or wrinkled pods and black tip spotting.",
		store: "In a paper towel inside a container in the refrigerator, 1 to 2 weeks. They freeze loose in a bag for months and slice more easily from frozen. Air-dried on a string they keep a year and turn raisiny and sweet, not smoky: smoke comes only from a smoker.",
		prep: "Gloves for more than a few. Pound with garlic and salt in a mortar rather than mincing; for chile fish sauce, slice into thin rings, stem cap discarded. Do not touch your face for the rest of the shift.",
		methods: ["stir-frying", "simmering", "pickling", "infusing", "drying"]
	},
	{
		t: "Thyme",
		c: "The Herb & Chile Atlas",
		d: "A phenol in a small tough leaf: THYMOL, with its isomer carvacrol, sits in surface glands on a leaf rolled tight against a Mediterranean summer. That structure is the whole distinction between a hardy herb and a soft one: the leaf does not collapse in liquid, and thymol boils near 232C and holds on, so an hour in a braise concentrates the flavor instead of erasing it. FRENCH and ENGLISH thyme are both Thymus vulgaris and the workhorse; LEMON thyme is the hybrid, led by citral, no lighter than thymol but wrecked by heat and acid into a stale p-cymene note, so add it late, to fish and chicken; wild creeping thyme is thinner and more floral. Thymol is antimicrobial in a lab dish, not in a pot, so use thyme for flavor and salt for keeping. Whole sprigs go into anything wet at the start and come out at the end; strip the leaves only where you want to see them.",
		season: [5, 6, 7, 8, 9],
		choose: "Springy sprigs, small gray-green leaves firmly attached, stems flexible rather than brittle, and a strong smell when you pinch one: that means the oil glands are intact. Reject yellowed or blackened tips, wet slimy stems, and any bunch shedding leaves in the bag.",
		store: "Refrigerator, wrapped loosely in a barely damp cloth inside a bag, two to three weeks; it outlasts every soft herb. Freeze whole sprigs in a bag and drop them into the pot still frozen. Dried thyme holds its phenols about a year in the dark, then goes to dust.",
		prep: "Strip leaves by pinching the growing tip and pulling down against the growth; they come away cleanly. Woody stems go in the pot and come out before service, never onto the plate. Do not chop fine unless the dish is smooth: bruised thyme turns grassy.",
		methods: ["braise", "roast", "simmer", "stew", "grill", "infuse"]
	},
	{
		t: "Urfa Biber",
		c: "The Herb & Chile Atlas",
		d: "The dark one: a Turkish pepper from Urfa cured by a sweat-and-dry cycle, sun by day and wrapped tight by night, so it holds its own moisture instead of drying out. Nothing ferments; the warm wet nights brown it, sugars and amino acids reacting while the red carotenoids break down, and that is where the near black-purple comes from. It is sticky, and tastes of raisin, molasses, coffee, sour cherry and tobacco, with a smoky depth built without any smoke and a late, slow heat near 7,500 Scoville. Like Aleppo it is cut with salt and oil, so season the dish after it. Its darkness will muddy a pale dish: put it where that helps, on lamb, eggplant, chocolate, browned butter, roast carrots, or yogurt under a thread of olive oil.",
		season: [],
		choose: "Almost black with a purple cast, visibly damp and sticky, clumping into soft lumps you break with a spoon, smelling of raisin and tobacco. Reject anything dry, gray-black and free-running: old stock with the oil gone.",
		store: "Airtight and refrigerated once opened, and let the jar warm before you open it so it does not sweat inside. The moisture left in it makes this the most perishable of the flake chiles: six months cold with the aroma intact. Any musty smell, or white or gray fuzz in the clumps, means the whole jar goes out. Molds on damp chile make aflatoxin, and cooking does not destroy it. Once it dries to loose dust the character is gone.",
		prep: "No prep beyond breaking up the clumps. Add late, off direct heat, or stir into warm oil or butter for a minute to bloom the color. Taste for salt before you season, and use a light hand in anything meant to stay pale.",
		methods: ["finishing", "roasting", "grilling", "braising", "baking"]
	},
	{
		t: "Vietnamese Coriander",
		c: "The Herb & Chile Atlas",
		d: "Not a coriander and not even a relation: rau ram is a knotweed, kin to sorrel and buckwheat, with a narrow pointed leaf often marked by a dark chevron. It carries the aldehydes that make cilantro smell like cilantro, decanal and dodecanal chiefly, over the (E)-2-decenal that gives cilantro its soap note, and adds a peppery heat at the back of the throat that cilantro has not got. It is not a stand-in for cilantro but its own herb: raw on the herb plate, in goi ga chicken salad, with snails, duck and anything fatty that needs cutting, and simmered in Malaysian asam laksa, where it is daun kesum and goes into the broth. Heat dulls it, so in Vietnamese dishes add it off the heat. It roots readily from a cutting in a glass of water on a sunny windowsill, which is the answer when the Asian grocery has none.",
		season: [6, 7, 8, 9],
		choose: "Narrow glossy deep green leaves on reddish jointed stems, springy, with a hot peppery smell on the rub. Reject yellowed lower leaves, hollow dried-out stems, and any bunch that smells merely grassy.",
		store: "Stem ends in water on the counter out of direct sun, changing the water daily: five to seven days. It is tropical and chills like basil, so a 4 C (39 F) fridge blackens the leaf in a day or two; if it must go in, use the door. Root a few stems and you will not buy it again.",
		prep: "Pick the leaves and tender tips off the jointed stems, which are tough and fibrous. Leave leaves whole for an herb plate, or tear them into a salad. Add it to the bowl only after the heat is off.",
		methods: ["raw", "garnishing", "blending", "pickling", "infusing"]
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
