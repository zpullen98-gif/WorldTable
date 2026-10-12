# Verifier repairs, 12 October 2026: the house cards

The verifier of the review edition read the 23:30 edition of 11 October and found three things the cellar review had left on the house's wine cards: the house Champagne by the bottle said "made for us" while its own glass card says to say "labeled for us, not made for us" until a bottle is checked; five cards named a living person, with no date, as who runs an estate today; and the Stein Weihwasser card still placed old vines near the old church in Alf and fermented the wine in large old casks in fields the review did not sweep, after the profile and the 45 second line had dropped both as unsettled. Twenty-seven replace entries in brennans/overrides.json (entries 3999 to 4025, counted from 0) repair them; this note is their source. No search was made: every fact below stands on a source already in the research, quoted here.

The kept indices are the builder's model order. Each of these cards was filed by a wine:+ add with no kept notes of its own, then five kept adds in the fixed order (Tell me about it., How do I sell it?, What do guests ask?, What should I watch for?, How do I pour it?), so kept.0 is Tell me about it., kept.2 What do guests ask? and kept.4 How do I pour it?. The builder refuses a replace whose from is not found, and every one of the twenty-seven was found, which proves each from at its index. (The verifier's report names the Piper bottle card's Tell me about it. as kept.2 and the Stein notes as kept.2 and kept.3; the text it quotes stands at kept.0 and kept.2 in the model, and the entries name those.)

The pack is American English and the builder respells, so the entries write "labeled".

## 1. The house Champagne by the bottle: labeled for us, not made for us

Wine: Piper-Heidsieck 'Brennan's Essential' Extra Brut NV, w-8t8kp5ey. Fields: lines.s45, kept.0.a (Tell me about it.) and parts.main.

- s45, from "Brennan's Essential is made for us by Piper-Heidsieck in Reims and carries the Brennan's name." to "Brennan's Essential is a Piper-Heidsieck Extra Brut from Reims, labeled for us with the Brennan's name."
- kept.0.a, from "Piper-Heidsieck, a Champagne house in Reims, makes it for us, and the label carries the Brennan's name." to "It is an Extra Brut from Piper-Heidsieck, a Champagne house in Reims, labeled for us: the label carries the Brennan's name."
- parts.main, from "Pinot Noir, Meunier and Chardonnay, made for us by Piper-Heidsieck" to "Pinot Noir, Meunier and Chardonnay from Piper-Heidsieck, labeled for us".

Why: the two cards for the house Champagne contradicted each other. Whether the wine is a bespoke blend or Piper-Heidsieck's Essentiel under the Brennan's label is open, and the glass card already teaches the safe line. "Made by Piper-Heidsieck" (the origin and the 20 second line) stays: either way the house makes it.

Sources and passages:
- The pack, the glass card w-dbz9e960, kept "Is it a bespoke blend or the Essentiel under our label?": "Say 'labeled for us', not 'made for us', until a bottle is checked, and do not quote a dosage or a lees age until the sommelier confirms which cuvée is in the bottle."
- research/gap-fill-4.md, section 3.3: "The most economical reading is that "Brennan's Essential by Piper-Heidsieck" is Essentiel Cuvée Réservée under a co-branded label, a thing Piper-Heidsieck does for partners. That is an inference. A bespoke blend is possible but less likely. Until a bottle is seen, the server line should be "labelled for us", not "made for us"."
- research/dossier-the-cellar.md, section 3, wine 1: "Whether it is a relabelled Essentiel or a bespoke blend is unconfirmed. Until the sommelier or Piper-Heidsieck says more, say "labelled for Brennan's", not "made for us"."
- The lineup register already asks it: "Is Brennan's Essential Piper-Heidsieck's Essentiel Extra Brut under our label or a blend made for us, and what disgorgement date and dosage does the back label give?"

## 2. The house Champagne by the bottle: the say line

Wine: w-8t8kp5ey. Fields: say and kept.4.a (How do I pour it?).

- say, from "by PIE-per HIDE-sick." to "by PEE-pair HIDE-seek (PIE-per HIDE-seek is common and fine)."
- kept.4.a, from "say Brennan's Essential by Piper-Heidsieck, PIE-per HIDE-sick." to "say Brennan's Essential by Piper-Heidsieck, PEE-pair HIDE-seek."

Why: one wine, one say line. The glass card's reads "Piper-Heidsieck: PEE-pair HIDE-seek (PIE-per HIDE-seek is common and fine)".

Source: the pack, the glass card w-dbz9e960, say.

## 3. Domaine Roulot: the estate, not who runs it

Wine: Domaine Roulot Meursault 2022, w-lm7mggqk. Fields: origin, lines.s45, kept.0.a and kept.2.a. Each drops "run by Jean-Marc Roulot" (and in What do guests ask?, "Jean-Marc Roulot makes Meursault taut and precise" becomes "Roulot's Meursault is taut and precise").

Why: who runs an estate today changes, and the cards said it with no date. The estate, its style and its scarcity stay. The producer profile in components/producers.json (Who makes it) keeps its own dated line, "Jean-Marc Roulot has run the domaine since 1989; who makes a wine can change, so check before naming him", which is a dated fact and is not touched.

Sources: research/producers-cellar-white-burgundy-cote-2026-10-10.md, the Roulot sections (23 to 25); research/cellar-review-2026-10-11-house-floor-2.md, "Seen outside the swept fields, not filed", first item.

## 4. Domaine Coche-Dury: the change of hands dated

Wine: Domaine Coche-Dury Bourgogne Blanc 2022, w-0jfgq158. Fields: origin, lines.s45 and kept.0.a. "Now run by Raphaël Coche after his father Jean-François" becomes "Raphaël Coche took over the winemaking from his father Jean-François in 2010".

Why: the research dates the change of hands, so the fact can stand as a dated one rather than a present role.

Source: research/producers-cellar-white-burgundy-cote-2026-10-10.md, section 10, item 4: "he took over the winemaking role at the estate in 2010 with his father's retirement" (Wikipedia; Inside Burgundy agrees on 2010). "A dated fact, which can change." And the same file's cuts: "Léon Coche in 1923, Georges's son Jean-François in the early 1970s and Raphaël Coche from 2010 stand."

## 5. Dupont-Fahn Les Tillets: the estate, not who runs it

Wine: Raymond Dupont-Fahn 'Les Tillets' Meursault 2022, w-o0rowlb6. Fields: origin, lines.s45 and kept.0.a. Each drops "now run by Raymond Dupont-Fahn" (the s45's "Raymond Dupont-Fahn runs his family estate in Tailly" becomes "Dupont-Fahn is a family estate in Tailly").

Why: as in section 3. The name stays where the list prints it, in the producer, the wine's name and the first line of Tell me about it. The research itself leaves open who founded the estate and how many generations have run it.

Sources: research/producers-cellar-white-burgundy-cote-2026-10-10.md, the open questions ("Who founded Domaine Dupont-Fahn in 1975 ... how many generations it has run") and sections 11 and 12; research/cellar-review-2026-10-11-house-floor-2.md, "Seen outside the swept fields, not filed".

## 6. Loimer Lois: the estate, not who runs it

Wine: Loimer 'Lois' Grüner Veltliner 2022, w-atwx0lgo. Fields: origin and kept.0.a. Each drops "run by Fred Loimer".

Why: the name came from the 4 October card's knowledge alone, and the lineup register already asks "may servers name Fred Loimer?".

Source: research/producers-cellar-germany-austria-2026-10-10.md, section 5, item 1: "research/bottle-facts-cards-a-2026-10-04.json, bottle n1192 ("how": "knowledge"). Because the card is knowledge only, the profile says the house card of 4 October 2026 names Fred Loimer and that this can change."

## 7. The two Stein cards: the estate, not who runs it

Wines: Stein 'Weihwasser' Riesling Feinherb 2023, w-du80kehr (origin, lines.s45 as integrator entry 3980 left it, kept.0.a), and Stein 'Palmberg-Terrassen' Riesling Spätlese-Feinherb 2014, w-dv66g929 (origin, lines.s45, kept.0.a). "Run by Ulrich Stein" and "Ulrich Stein's small Mosel estate" become the estate, Weingut Stein.

Why: as in section 3. The rescued steep slate stays, as the producer profile says it. The producer profile keeps its own dated line, "As of October 2026, its importers describe it as run by Ulrich Stein, known as Ulli", which is not touched.

Sources: components/producers.json, the Weingut Stein profile ("who has reclaimed steep slate vineyards that others had given up"); research/producers-cellar-alsace-jura-mosel-2026-10-10.md, section 6; research/cellar-review-2026-10-11-house-floor-2.md, "Seen outside the swept fields, not filed".

## 8. Stein Weihwasser: only the sourced steep slate

Wine: w-du80kehr. Fields: kept.0.a (Tell me about it.), kept.2.a (What do guests ask?), parts.main and parts.technique.

- kept.0.a, from "Weihwasser means holy water: the old vines grow on slate near the old church. Feinherb means just off dry, and the wine ferments in large old casks." to "Weihwasser means holy water, and the wine comes from Stein's steep Mosel slate. Feinherb means just off dry."
- kept.2.a, from "Answer: Holy water: the old vines grow near the old church in the village of Alf." to "Answer: Holy water. Where its vines grow and how old they are is a question for the sommelier."
- parts.main, from "Riesling from old vines on steep slate in Alf, on the Mosel" to "Riesling from steep slate on the Mosel".
- parts.technique, from "feinherb: just off dry, fermented in old casks" to "feinherb: just off dry".

Why: the cellar review took the old vines near the old church out of the profile and the s45 as unsettled, and the card then contradicted itself. A still unverifiable fact is placed nowhere as a fact.

Sources and passages:
- research/cellar-review-2026-10-11-house-floor-2.md, section 7, quoting research/producers-cellar-alsace-jura-mosel-2026-10-10.md, R11: "'old vines near the old church' and 'ferments in large old casks' come from the 4 October card, which mixed two importer pages with knowledge and placed the vines both in the St. Aldegunder Klosterkammer and near the old church in Alf (section 6, item 1). Like the vine age and the parcel, they are now a lineup question".
- The lineup register: "Where does the Stein Weihwasser grow, how old are its vines, does it ferment in large old casks as the pack's card says".

## Not reachable by an override

The Stein Weihwasser's comparison row with the Codex Riesling card still says "from old vines at Alf", and its row with the Berres says "Both are off-dry old vine Mosel Riesling". A comparison is built from components/wines.json after the overrides are applied, and no override op reaches it, so both rows are left for the owner to correct in that file.

## The engine's edition comment

tools/house/engine.mjs said the 23:30 edition carried "no living person in a present role without a date", which these cards contradicted. The comment now says what that edition did and did not do, and the 01:00 edition of 12 October is stamped for these repairs, later than 23:30 and never ahead of the clock (date -u read 01:11 UTC when it was set).
