# Cellar review, house-menu-2 (11 October 2026)

## Method

A master sommelier's read of the Brennan's wine cards a server studies in the Sommelier's Codex, batch house-menu-2: the second half of the house's glass wines and menu bottles (the 34 wines in the shipped pack with no bottle-list entry, indices 17 to 33: the last glass reds, the dessert wines, the Birthday Bubbles half bottles and large formats and the five Bubbles at Brennan's rosé bottles) and every wine a tasting course pours (Charles Lafitte, Fichet, Jadot and Châteaumar from the first half, Paul Hobbs and La Tour Vieille from this one). Twenty-one cards, read line by line as the server will say them: the three timed lines, the five parts, the profile, serve, goes with, first picks against the dishes' pairings, say it, why, origin, every kept note and every pairing that names the wine.

Two WebSearch calls were made, standard mode, 11 October 2026: one for how Billecart-Salmon is said (no source answered it) and one for the blend of the 2010 Inglenook Rubicon (answered; section 6). Everything else rests on the research already in this directory, named entry by entry below.

The proof. Every one of the 38 entries in cellar-review-2026-10-11-house-menu-2.json was checked against the shipped pack (shared/packs/brennans-new-orleans.v1.oothouse.json on the site, byte for byte the same as static/shared/packs in WorldTable): each 'from' stands exactly once in its field. The kept note index in each 'field' is the note's place in the build's own order (the order the overrides added them: Tell me about it, How do I sell it, What do guests ask, What should I watch for, How do I pour it; the Rubicon carries its open bottle note first), which keep-all then sorts by question for the pack. A copy of tools/house, the engine and the two Table indexes in a scratch directory first rebuilt the shipped pack byte for byte from overrides.json; with these entries appended, build-brennans, validate-pack (0 fatal, every proper noun answered), keep-all, check-pack (0 fatal, 0 thin lines, 0 dashes, 0 British spellings, round trip holds), check-compare and thin-lines all passed, and the rebuilt pack differs from the shipped one in exactly 36 strings (two fields take two entries each), every one the intended text. Nothing under components/ and nothing in overrides.json was touched.

The overlap with house-menu-1. Fichet and Châteaumar are first-half wines that this batch also reads as tasting pours, and cellar-review-2026-10-11-house-menu-1.json already repairs their hundred year old vines, the Château London name and the Châteauneuf of the same name. This batch therefore files only what house-menu-1 does not, each on text that house-menu-1's entries leave alone: in the scratch chain the two batches were appended in both orders (house-menu-1 then this one, and this one then house-menu-1), and every entry of both applied.

One field name: the builder's model holds a wine's guest line as sayIt (it writes the pack's guest mark from it), so the Dr. Hermann guest entry targets sayIt, as the two earlier sayIt replaces in overrides.json do.

## 1. Charles Lafitte Brut Champagne NV (w-3yaps1gt)

Entry 1, lines.s45: "check with the bar" becomes "check with the sommelier". Source: the card itself. Its why mark reads "check with the sommelier before promising a glass on its own", and its sell, ask and watch notes all send an à la carte glass to the sommelier; the lineup register asks "Which Charles Lafitte cuvée is poured on the tastings, can it be poured à la carte, and at what price?". The 45 second line alone said the bar.

The rest stands: the 1983 brand date, the Vranken-Pommery group and the three grapes as retailers give them (producers-cellar-champagne-menu-2026-10-10.md, section 3). The pairing holds: a crisp Brut opens the dinner tasting with raw oysters, and at breakfast its acidity cuts the hollandaise of the Hussarde.

## 2. Fichet 'Château London' Mâcon-Igé 2024 (w-w23cntcx)

Entries 2 and 3 (profile, description): "a family estate farmed by the Fichet brothers" becomes "a family estate whose present domaine dates to 1988". Source: producers-cellar-chablis-maconnais-2026-10-10.md, section 1, item 3: "Wine Anorak reports that 'the brothers Pierre-Yves (who looks after viticulture) and Olivier (winemaking) run the current domaine, which was formed in 1988'; Burgundy Report says Pierre-Yves joined their parents in 1988". Who farms the estate today is a present role, which the verification of the same file attributes and dates rather than states; the cards now date the domaine and name nobody.

Read and agreed, and left to house-menu-1, which files them: the vines "over a hundred years old" stand in no source ("the 86-year figure is the nearest, for the 2018", item 10), and Château London's name comes from "its original owner [who] lived in rue Landon in Paris" (Boisset's sheet, item 8), so the guest's castle question has a sourced answer. The pairing is right: a round Mâcon with a fresh finish for lobster, butter and 'nduja.

## 3. Louis Jadot Beaune 1er Cru 2023 (w-q71pquzd)

Entries 4 and 5 (profile, description): "the dinner tasting's red" becomes "the dinner tasting's first red". Source: producers-cellar-napa-icons-2026-10-10.md, Verification 2026-10-10, item 2: "The tasting menu paste ... pairs the Redfish Véronique with 'Louis Jadot 1er Cru Beaune, Burgundy FR Pinot Noir 2023': the dinner tasting has two reds." The Jadot is the third course, the Paul Hobbs the fourth (pages/brennans-tasting-menus-pasted-2026-10-05.txt).

Entry 6, parts.technique: "Louis Jadot; Premier Cru is Beaune's top tier" becomes "young Premier Cru from Louis Jadot, opened 20 to 30 minutes ahead". The part was a classification, already taught by the profile and the main part, where the drill wants a technique; the new text is the card's own serve mark ("open 20 to 30 minutes ahead so the young Premier Cru shows its perfume").

The rest stands: Premier Cru as Burgundy's second tier and Beaune's highest, Beaune having no Grand Cru, is right; a low tannin Pinot Noir with a beurre blanc and hibiscus-pickled grapes is a sound and teachable red with fish.

## 4. Domaine de Châteaumar 'Cuvée Vincent' Côtes du Rhône 2023 (w-u49o02ii)

Entry 7, watch note: "the Personality, our spirit-free sparkling rosé" becomes "the Personality, our spirit-free drink built on a zero-proof sparkling rosé". Source: producers-bar-wines-zero-mixers-2026-10-10.md: "Personality (Temperance, 1946): Wölffer Estate Zero Proof Sparkling Rosé, tart cherry juice, brown sugar syrup, $16.00." It is a mixed drink, not a bottle of sparkling rosé.

Read and agreed, and left to house-menu-1, which files it: "not the estate's Châteauneuf of the same name" stands in no source (producers-cellar-rhone-north-2026-10-10.md: "no source in the repositories confirms such a wine"), in the description and the watch note alike.

The rest stands: all Syrah from fifty year old vines on two parcels beside Châteauneuf-du-Pape, by the searched record (section 2, items 1 to 3); a soft, peppery Syrah served a little cool is right for a lean filet at breakfast.

## 5. La Miraja 'Le Masche' Barbera d'Asti 2023 (w-rr3vq91n)

Entries 8 to 12 (profile, description, the oak answer, the watch note's pronunciations, the pour note's names). Source: producers-cellar-italy-2026-10-10.md, section 1.
- Item 1, from master-review-somm (search): "Le Masche is 100 percent Barbera from the Majole vineyard; the producer's sheet describes native fermentation in steel tanks and at least twelve months in neutral oak. The name recalls the local spirits believed to protect the vineyard. That sheet is for the Barbera d'Asti Superiore; the menu prints Barbera d'Asti, so the aging is confirmed with the sommelier."
- Item 10: the component's "about a year in neutral oak" against the source's "at least twelve months", and "the sheet is for the Superiore". The profile carried the same "about a year".
- The expert line: "masca, plural masche, is the Piedmontese dialect word for a witch, which is why the component glosses Le Masche as witches or spirits." The component's own words are "Piemontese folklore".
- Item 4, pronunciation: "La Miraja is lah mee-RAH-yah ... and Le Masche is leh MAHS-keh". The say mark reads "Barbera d'Asti: bar-BEAR-ah DAHS-tee". The watch note respelled d'Asti as dee-AHS-tee, as if the d were a word of its own, and both the watch and pour notes told the server to read the names off the label though the card's own say mark gives them.

The description and the guest answer had deferred the aging and the name to the sommelier while the profile answered both; they now agree with the profile and keep the sheet's caveat. Neutral oak shapes texture rather than flavour, so "not noticeably" is the honest answer to "is it oaky?".

## 6. Inglenook 'Rubicon' 2010 (w-4qmphesw)

Entry 13, profile: the blend line becomes the 2010's own. Source: WebSearch of 11 October 2026, "2010 Inglenook Rubicon blend", the wine.com product page for the 2010 (https://www.wine.com/product/inglenook-rubicon-2010/153701), which reprints Robert Parker's Wine Advocate: the 2010 Rubicon is "87% Cabernet Sauvignon, 6% Cabernet Franc, 5% Petit Verdot and 2% Merlot". A wine auction listing for the 2010 (wineauctioneer.com, lot 8061) adds 20 months in oak barrels (not used). The old line (with Merlot, Cabernet Franc and Petit Verdot) was the 2019's order, 81, 11, 5 and 3 (producers-cellar-napa-icons-2026-10-10.md, section 1, item 2, which warns "The 2019 shares are not the 2010's"). This also answers, from a critic rather than the estate, the lineup question "What is the blend of the Rubicon 2010 on the estate's fact sheet?".

Entries 14 and 15 (the open bottle note, the watch note): "never decant it for more than about thirty minutes" is taken out. Source: producers-cellar-napa-icons-2026-10-10.md, Verification 2026-10-10, item 14: "Inglenook, 'give it no more than about thirty minutes of air'. It stands in no item of section 1; research/claims.json, somm-reds-20 calls it unconfirmed and says 30 to 60 minutes does no harm, and the glass is poured from an open bottle." A structured 2010 Napa blend is not fragile in air; the serve mark's upright bottle, slow pour and last inch left behind are the right handling and stay.

The rest stands. Note for the next edition: "sixteen years old" here and "twelve years of age" on the Dr. Hermann are true in 2026 and must move with the calendar.

## 7. Paul Hobbs Coombsville Cabernet Sauvignon 2021 (w-p30or70w)

Entries 16 and 17 (profile, description): "the dinner tasting's red" becomes "the dinner tasting's Cabernet". Source: producers-cellar-napa-icons-2026-10-10.md, "Repairs owed in the pack": "w-p30or70w, Paul Hobbs: the Tell me about it calls it 'the dinner tasting's red'; the Jadot Beaune is the other red, so 'the dinner tasting's Cabernet' is exact."

Entry 18, description: "Paul Hobbs is the Napa winemaker behind it" becomes "Paul Hobbs founded his winery in 1991 at Sebastopol, in Sonoma County", and Coombsville is placed east of the city of Napa, open to San Pablo Bay. Sources: the same file, "Repairs owed in the pack": "the Tell me about it calls him 'the Napa winemaker behind it'; his winery is at Sebastopol in Sonoma County"; section 2, item 1 (search, earlier): "Paul Hobbs founded his winery in 1991 at Sebastopol; his Napa estate in the Coombsville district is named for Nathan Coombs, the founder of the city of Napa; Coombsville is one of Napa's cooler corners, near San Pablo Bay, which helps even ripening"; item 3, the Codex question c-323zkak2: "A horseshoe of low hills east of the city of Napa opens straight onto San Pablo Bay". A living winemaker is named here by a dated fact, the founding, never by a present role.

Entry 19, the guest answer "Where is Coombsville?": the same sources; the answer now says why it is cool.

The pairing stands with its honest caveat: duck breast carries a young Cabernet, the cane syrup peaches test it, and the card already offers the Bourgogne Pinot Noir as the lighter match.

## 8. Dr. Hermann 'Erdener Prälat' Riesling Auslese 2014, 375 ml (w-lkox3rl4)

Entry 20, description: "it is the only sweet wine sold à la carte" is replaced. Source: the shipped pack's own bottle list, section Dessert and fortified, twenty-five wines sold by the bottle, among them "Dr. Hermann 'Ürziger Würzgarten in der Kranklei' Riesling Spätlese Goldkapsel 2018" at $95 (w-1j9ri89c); producers-cellar-alsace-jura-mosel-2026-10-10.md, section 5, item 1: the wine list's dr-hermann entries include the "Urziger Wurtzgarten in der Kranklei" Goldkapsel Spätlese 2018 ($95). The research's own Brennan's link line repeats "the only sweet wine sold à la carte"; read against the list, it can only mean the glass page, and the card should not say it.

Entries 21 and 22 (the guest line, lines.s20): "perfect to share" becomes "made for sharing". Source: engine.mjs BANNED_WORDS, the notes' list of empty praise (perfect among them); the guest line now carries the fact behind the praise, about four small glasses.

The rest stands. The 2014 is a gold capsule picked at 124 Oechsle with half its fruit botrytised and 8 percent alcohol (verified-facts.json, somm-pairings-11, b-21.com), which is why "sweeter than our desserts" holds and why it is light enough for a breakfast starter.

## 9. Domaine La Tour Vieille Banyuls Reserva NV (w-69pqytkm)

Entry 23, watch note: "the coffee cake, the Jubilee and the Snickers are coffee only à la carte" becomes "offer our coffee with the coffee cake, the Jubilee and the Snickers à la carte, and bring the sommelier to a guest who wants a sweet wine". Source: the card and the lineup register ("Are the Banyuls and the Jadot Beaune poured à la carte ... If not, the coffee cake, the Cherries Jubilee and the Snickers are coffee only"). The sentence was not sayable as written and left a guest who wants a dessert wine with nothing; the bottle list's Dessert and fortified section is the sommelier's to offer.

The rest stands and is right: at least half Grenache noir, mutage with neutral grape spirit, Grand Cru at three quarters Grenache noir and thirty months in wood (verified-facts.json, somm-reds-29, against the INAO texts); oxidative Grenache is the classic match for milk chocolate and caramel.

## 10. Drappier 'Carte d'Or' Brut NV, 375 ml (w-zhjzzikm)

Entries 24 and 25 (profile, the grapes answer): "about three parts in four" becomes "three parts in four or more". Source: producers-cellar-champagne-menu-2026-10-10.md, section 4, item 5: "a French retailer gives 'roughly 90% Pinot Noir, 5% Chardonnay and 5% Pinot Meunier'; master-review-somm-2026-10-04.md (Millesima USA) gives about 75 percent Pinot Noir, 15 Chardonnay, 10 Meunier". The new words are true of both.

## 11. Paul Bara Grand Cru Reserve Rosé Brut NV, 375 ml (w-r238y26n)

No change. Mostly Pinot Noir from Bouzy with Chardonnay, coloured with Bouzy red (Kermit Lynch's sheet, section 5, item 5), a grower's Grand Cru rosé; the pairings with the tartare cannoli and the duck are sound for a rosé of that weight.

## 12. Krug 'Grand Cuvée' Brut NV, 375 ml (w-5mat1jha)

Entry 26, the guest answer "Is it vintage?": "No, it is Krug's prestige non-vintage Champagne" becomes a blend of more than a hundred wines from ten or more years, Krug's prestige wine, never a lesser non-vintage. Source: master-review-somm-2026-10-04.md, The Birthday Bubbles, the Bubbles rosés and the Argyle: "Krug Grande Cuvée: a blend of more than a hundred wines (Krug says around 120) from ten or more different years, Pinot Noir, Chardonnay and Meunier, some reserve wines up to twenty years old, then at least six more years in Krug's cellars." At $305 a half bottle, "non-vintage" alone tells the guest the wrong thing.

## 13. Billecart-Salmon 'Brennan's 80th Anniversary' Brut Sous Bois NV, magnum (w-757tk8s7)

Entries 27 to 30 (lines.s45, the description twice, the guest answer on Sous Bois): the finished Champagne is not aged in oak; the base wines are. Source: producers-cellar-champagne-menu-2026-10-10.md, section 7, item 4, carrying master-review-somm (K&L Wines, Flatiron, Millesima): "usually about a third each Chardonnay, Pinot Noir and Meunier (the share moves by release), every base wine fermented and aged in oak barrels, then years on its lees in bottle". The description deferred the whole blend though the profile gives the usual one; it now gives it and keeps this bottling's blend and count with the sommelier.

Entry 31, the pour note: "beel-KAR sal-MOHN" becomes "bee-yeh-KAR sal-MOHN", the card's own say mark. Source: master-review-somm-2026-10-04.md, Pronunciation: "(expert) Billecart-Salmon is said bee-yeh-KAR sal-MOHN; the double l after i is a y sound in French. The pack's large format card already says it so; the magnum card said beel-KAR and is brought into line." The pour note was missed then. The WebSearch of 11 October ("how to pronounce Billecart-Salmon champagne") returned no pronunciation source, so the lineup question already filed ("How should the floor say Billecart: bee-yeh-KAR or beel-KAR?") stands; until it is answered one card should say one thing.

## 14. Bollinger 'Special Cuvée' Brut NV, magnum (w-xnonxjdf)

Entry 32, the guest answer "How many glasses in a magnum?": the answer deferred arithmetic. A 1.5 liter magnum holds about 50 ounces, ten glasses at five ounces and twelve at four, so "about ten to twelve glasses of Champagne". Source: the card itself (1.5 L, two standard bottles in one) and service arithmetic; the house's pour size for Birthday Bubbles is asked below.

## 15. Piper-Heidsieck 'Cuvée' Brut NV, magnum (w-a7np8xs9)

Entries 33 and 34 (profile, description): the blend, which the description deferred. Source: producers-cellar-champagne-menu-2026-10-10.md, section 1, item 5: "the producer's sheet gives 'Pinot Noir can make up to 50-55% of the blend, Pinot Meunier comprising 30-35%, Chardonnay 15-20%, and reserve wines around 20-25%'; 'composed of more than 100 crus from around the region and is aged for a minimum of 24 months on lees'".

Entry 35, the pour note: "PIE-per HIDE-sick" becomes "PEE-pair HIDE-seek", the say mark. Source: the same file, section 1, item 10: "the house's own people say PEE-pair HIDE-seek; PIE-per HIDE-seek is what most English speakers say and is accepted" (Wine Spectator). The card's grapes field is empty; it is a list, not text, so it is left for the integrator (Pinot Noir, Meunier, Chardonnay by the sheet).

## 16. Taittinger 'La Francaise' Brut NV, 3 L (w-brba6z3f)

Entry 36, description: the deferred blend is given, as the profile already gives it. Source: producers-bar-wines-zero-mixers-2026-10-10.md, section 1, item 7: "one retailer lists '40% Chardonnay (unusually high for non-vintage Champagne), 35% Pinot Noir, and 25% Meunier, sourced from over 35 villages'"; master-review-somm: "about 40 percent Chardonnay, 35 Pinot Noir, 25 Meunier, a high Chardonnay share for a house Brut, which gives its elegant style."

Entry 37, the guest answer "How much is in it?": the menu prints double magnum, the Bordeaux word; in Champagne the 3 liter bottle, four standard bottles, is the Jeroboam, a word a guest who knows Champagne may use. Source: components-wines-2026-10-05.md names "the large bottle names Jeroboam, Rehoboam and Methuselah, Biblical kings"; the Champagne sizes (magnum 1.5 L, Jeroboam 3 L, Rehoboam 4.5 L, Methuselah 6 L) are standard service knowledge and agree with the list, which prints the Carte d'Or "6L Methuselah". About twenty glasses is the arithmetic of 101 ounces at five ounces a glass.

## 17 to 21. Mirabelle, Louis Pommery, Moët & Chandon Imperial Rosé, Taittinger Prestige Rosé, Pommery Rosé

Entry 38, the Taittinger Prestige Rosé description (w-c12rqa6r): "The blend is a question for the sommelier" becomes the three grapes coloured with still red Pinot Noir, the shares left with the sommelier. Source: producers-cellar-champagne-menu-2026-10-10.md, section 9, item 3: "The red wine share is most often given as 12 to 15% still Pinot Noir ... Grape shares conflict"; master-review-somm: "Taittinger Prestige Rosé: Pinot Noir, Chardonnay and Meunier, colored with still red Pinot Noir."

No change to the Mirabelle (w-7do8sjzc: Schramsberg's multi-vintage label of 1992, Pinot Noir and Chardonnay from cool North Coast sites, section 3 of producers-cellar-sparkling-elsewhere-2026-10-10.md), the Louis Pommery (w-jocgwxht), the Moët Imperial Rosé (w-40apaxsq: 40 to 50 Pinot Noir, 30 to 40 Meunier, 10 to 20 Chardonnay by the house) or the Pommery Rosé (w-bhlh412d). Two things noted and left: the Louis Pommery service note still calls the producer a lineup question while the profile and notes give the Vranken-Pommery group (a service note is a person's words and goes in verbatim); and the Pommery and Piper magnum cards carry empty grapes lists.

## First picks against the dishes' pairings

Every first pick in the batch matches the pairing that names the wine (Fichet and the lobster; Châteaumar and the filet; Rubicon and the Chateaubriand; Hobbs and the duck; the Auslese and its seven plates; the Banyuls and its three), except four that name dishes with no pairing at all: the Barbera with Maggie's Mushrooms, the Mirabelle with the fries, the Louis Pommery with the popcorn shrimp and the Taittinger rosé with the cheese board (a side and three Bubbles snacks). Those are the only pairings these dishes have, and they read soundly. The Jadot is the second wine on the redfish and the Chateaubriand, as its card says, and Charles Lafitte is named in the oyster and Hussarde serve lines as the tasting pour.

## Lineup questions no source could settle

ask: How many glasses does the house pour from a Birthday Bubbles magnum and from the 3 L Taittinger, at 4 oz or 5 oz, so the floor can tell a table how far a bottle goes?
ask: When a table buys the Inglenook Rubicon 2010 by the bottle, does the sommelier decant it, and for how long?
ask: What vine age does Domaine Fichet give for its Château London parcel? The cards now say only old vines (one listing of the 2018 gives 86 years for the oldest vine).
ask: When presenting the 3 L Taittinger, does the house want it called a double magnum, as the menu prints, or a Jeroboam, the Champagne name?
ask: Does the house want the floor to say that the 2010 Rubicon is about 87 percent Cabernet Sauvignon, as the Wine Advocate gives it, or does the estate's own sheet for the 2010 give other shares?
