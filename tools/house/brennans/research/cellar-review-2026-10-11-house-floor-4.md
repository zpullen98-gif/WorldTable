# Cellar review, 11 October 2026: house-floor-4

Batch house-floor-4 of the bounded pass over the Brennan's bottle cards: the floor bottles 180 to the end of house.wines in the shipped pack (shared/packs/brennans-new-orleans.v1.oothouse.json on the site, counted from 0 over the wines whose list is bottle), fifty-seven cards in all, from La Rioja Alta 'Gran Reserva 904' Rioja 2015 (pack index 214) to Henriques & Henriques 'Founder's Solera' Madeira 1894 (pack index 270). All fifty-seven were read in full.

## How the batch was read

Every card was swept for errors only, field by field: the producer, the wine, the vintage, the region string, the grapes, the style, the profile, the serve and the 10 second line first; then origin, parts, the timed lines, the guest line and the kept notes wherever one of those carried the same error, so a card does not contradict itself (the rule the floor-3 batch of the same day followed). Nothing thin was rewritten. No name, vintage, price, bin, size or producer string is touched, and no stem changes.

Two kinds of error turned up. The first is a claim the October producer research already withdrew or found unsourced, still standing in the pack. The second is a present owner or a living person in a present role, stated with no date: the house rule for this pass names no living person as a volatile fact (a current winemaker or owner) and states nothing volatile as fact, and the Codex's own producer file header says "ownership ... all change, and a study app that states them goes stale silently" (quoted in research/producers-cellar-italy-2026-10-10.md, section 10). Where a present owner rests on a dated search record (Gilette's Médeville family, search 51; the Symington houses, search 34; Yquem and LVMH, search 24 and the Codex's "since 1999"; Biondi Santi and EPI "since 2016"), it is left standing.

Sixty-one entries over twenty-two wines are filed in cellar-review-2026-10-11-house-floor-4.json, each a replace. Every "from" was proved by a node script to occur exactly once in its field of the shipped pack, byte for byte, and exactly once in the model text in overrides.json (the wine:+ add entry and the kept add entries, with the later replaces for that wine applied); entries on the same field were applied in order. Two field names are the model's: "guest" is the pack's guest line, and kept.N counts the kept add entries in the order overrides.json files them (0 Tell me about it., 1 How do I sell it?, 2 What do guests ask?, 3 What should I watch for?, 4 How do I pour it?), not the pack's alphabetical order. The same script checked every to-text for dashes, the banned word, British spellings and the line limits: after the change the longest s10 is 17 words, the longest s20 32 and the longest s45 84.

Three WebSearch calls were made, standard mode, 11 October 2026, of the four allowed: the Three Palms Vineyard's place (section 5), the Henriques & Henriques Founder's Solera (section 5) and the sale of Shafer Vineyards (section 3). A passage marked (summary) is the search tool's summary of the pages, not a quotation of them.

## 1. Withdrawn and unsourced claims

### Screaming Eagle 'Second Flight' Napa Valley 2012 (w-quuqkb1d)

Entries: profile, "rarer than the estate wine itself." to "its second wine."; parts.sauce, "rarer still" to "rare in its own right"; kept.0.a (Tell me about it.), "sold almost entirely to a long-closed mailing list." to "sold mainly through its mailing list."

Source: research/producers-cellar-napa-icons-2026-10-10.md, section 5, item 3, quoting the 4 October card: "Screaming Eagle is a tiny cult estate in Oakville, Napa Valley, sold mainly through its mailing list; Second Flight, renamed The Flight from the 2015 vintage, is its second wine. Withdrawn by the repairer, 4 October 2026: that it is made in smaller amounts than the estate wine (published figures give about 710 cases of the 2012)". Item 5: "The profile's "rarer than the estate wine itself" is the claim the 4 October repairer withdrew (item 3), and "long-closed" stands in no source; both want removing from the pack." Repairs owed in the pack: "Suggested profile: "A Bordeaux blend of Cabernet Sauvignon, Merlot and Cabernet Franc from the Screaming Eagle estate in Oakville, its second wine."" The parts line "rarer still" made the same comparison; "rare in its own right" is the card's own kept wording. The ask of overrides.json entry 3627 ("may it come out?") is answered by this entry.

### Caymus 'Special Selection' Napa Valley Cabernet Sauvignon 2018 (w-nhg7xn40)

Entries: profile ("only in some years" out); origin, s45, parts.technique, kept.0.a and kept.2.a ("only in some years" out, and "the Wagner family winery" to "the winery the Wagner family founded").

Source: research/producers-cellar-napa-icons-2026-10-10.md, Verification 2026-10-10, item 10: "Caymus Vineyards, Special Selection "made only in years the family judges worthy" (a plausible number of vintages). The Codex and the 4 October card say so, but neither names a year it was skipped. It comes out of the card, the component and the profile and becomes a lineup question." Item 11: "Caymus Vineyards, "the Wagner family's winery" (a present owner) ... Now "the Rutherford winery the Wagner family founded"". Section 9, item 1: the Codex record p-caymus, founded "1972". "Aged longer in oak" stays: the 4 October card n2778, "aged longer in oak than the Napa Valley bottling". The lineup question already stands (overrides.json entry 3631, "Is Special Selection made every year, or only in vintages the family chooses?").

### Heitz Cellar 'Martha's Vineyard' Napa Valley 2009 (w-u9lf40wo)

Entries: origin, "who planted it with her husband Tom" to "whose vineyard it was with her husband Tom"; s45 and kept.0.a, "planted by Tom and Martha May" to "of Tom and Martha May"; kept.2.a, "who planted the vineyard in Oakville with her husband Tom" to "the Oakville vineyard was hers and her husband Tom's".

Source: research/producers-cellar-napa-icons-2026-10-10.md, Verification 2026-10-10, item 4: "Heitz Cellar, "planted by Tom and Martha May" (a plausible relation). The Codex says the vineyard was owned by Tom and Martha May; only the 4 October card (knowledge) and the pack say they planted it, and my own recollection, unverified, is that an earlier couple planted it before the Mays bought it. The profile and the component now say the vineyard of Tom and Martha May, never who planted it." Repairs owed, added: "w-u9lf40wo, Heitz: the origin says Martha May "planted it with her husband Tom"; "whose vineyard it was, with her husband Tom" is what the Codex supports." Expert knowledge agrees that the Mays bought a vineyard someone else had planted; no source here names the planters, so no card does.

### Ken Wright Cellars Willamette Valley Pinot Noir 2024 (w-6osv9e9t)

Entry: profile, "from Ken Wright's vineyards across the Willamette Valley" to "from Ken Wright's vineyard sources across the Willamette Valley".

Source: research/producers-cellar-central-coast-oregon-world-2026-10-10.md, section 5, item 1, the 4 October card: "the Willamette Valley Pinot Noir is his blend across vineyard sources." Verification 2026-10-10, item 5: "its "drawn from those vineyards" goes beyond the card's "his blend across vineyard sources"". The section's expert line: "Shea Vineyard is bottled by more than one producer, as our own list shows with Ken Wright and Bergstrom." The vineyards are named sites he buys from or bottles; "Ken Wright's vineyards" made him their owner. The card's parts.technique already says "single vineyard sources".

### Château Gilette 'Crème de Tête' Sauternes 1989 (w-tqumtsdf)

Entry: style, "aged decades in concrete" to "aged close to twenty years in concrete".

Source: research/producers-cellar-bordeaux-white-sweet-2026-10-10.md, section 6, item 1, search 51 of 5 October: "its Crème de Tête stays in small concrete vats for close to twenty years and is released twenty years or more after the harvest, never touching oak." Item 2, the 4 October card: "it ages its Sauternes for many years (often around two decades) in small concrete vats before bottling and release". Decades in the vat claimed more than either. The 10 second line's "an old Sauternes aged for decades" is true of a thirty-seven-year-old wine and stands.

### Castello Banfi 'Florus' Moscadello di Montalcino 2011 (w-owg1ibls)

Entries: s45 and kept.0.a, "revived it with Florus" to "makes it as Florus".

Source: research/producers-cellar-italy-2026-10-10.md, section 11, item 9: "components/wines.json, wine-region-montalcino ("Castello Banfi, the large estate founded by an American importing family, makes a late harvest Moscadello called Florus.") ... The pack's Florus card says Banfi "revived it with Florus"; no source says Banfi revived Moscadello, and the profile does not."

## 2. Harlan Estate, the founder as owner

Harlan Estate Oakville 2006 (w-z0t0ykac). Entries: profile, "from Bill Harlan's hillside estate above Oakville" to "from the hillside estate Bill Harlan founded above Oakville"; parts.technique, "Bill Harlan's estate" to "the estate Bill Harlan founded".

Why: the possessive makes a living founder the present owner with no date. The card's own origin says what the sources support: "Harlan Estate was founded by Bill Harlan in the western hills above Oakville in the Napa Valley, with the aim of making a first growth of California" (the pack, quoted in research/producers-cellar-napa-icons-2026-10-10.md, section 4, item 8), and the same file's Verification confirms "Harlan's 1984 land purchase, the 1990 first commercial vintage released in 1996". The s45 ("Bill Harlan planted it") and the Tell me about it ("founded by Bill Harlan") already speak of the founding and stand. Who runs Harlan Estate today is a lineup question (section 7).

## 3. Shafer, the family estate

Shafer 'One Point Five' Stags Leap District Cabernet Sauvignon 2023 (w-flen2blh). Entries: origin, "Shafer Vineyards is the Shafer family winery in the Stags Leap District of Napa; One Point Five is named for John Shafer and his son Doug," to "Shafer Vineyards is the winery John Shafer founded in the Stags Leap District of Napa; One Point Five is named for him and his son Doug,"; s45 and kept.0.a, "a family estate" to "an estate".

Why: the card called Shafer a family winery in three places, and it is not one now.

Sources and passages:
- Search 3, 11 October 2026, query "Shafer Vineyards sold Shinsegae 2022 Stags Leap District": https://napavalleyregister.com/news/napa-valley-s-shafer-vineyards-sold-to-south-korean-retail-conglomerate-for-250-million/article_0e42e1a8-9ebf-5360-a7d8-e429a633dc7c.html, https://www.thedrinksbusiness.com/2022/02/napas-iconic-shafer-vineyards-sold-to-korean-luxury-firm-for-250-million/ and https://www.shankennewsdaily.com/2022/02/16/30457/wine-spectator-napas-shafer-vineyards-sold-to-korean-luxury-firm: the sale was announced on 16 February 2022 by Doug Shafer; Shinsegae Property, the luxury and retail arm of the South Korean Shinsegae group, bought the Stags Leap District winery through its American subsidiary, at a reported price of about $250 million; the vines run across four ranches, two of them in Stags Leap (summary). The buyer is named here as a dated event of 2022, not as a present owner, and no card names it.
- research/producers-cellar-napa-icons-2026-10-10.md, Verification 2026-10-10, item 6: "Every source here ... is undated, and the house rule names no present owner without a dated source; I recall a sale of the estate in 2022, which could not be searched. The profile and component now say John Shafer founded it". Repairs owed, added: "w-flen2blh, Shafer: the origin calls it "the Shafer family winery", an undated present owner; "the estate John Shafer founded" is safe."
- The card's own lines name John Shafer as founder: "One Point Five is named for John Shafer, who founded the winery, and his son Doug".

The lineup question on who owns Shafer (overrides.json entry 3630) can now be answered with the dated sale above, if the sommelier wishes; the card does not carry it.

## 4. The undated owners

Each entry below takes out a present owner or a living person in a present role that the card states with no date. The founding, the name and the reputation stay wherever a source holds them.

### Caymus Napa Valley Cabernet Sauvignon 2023 (w-bksfriq3)

Entries: origin, "the Wagner family winery in Rutherford, Napa Valley, run by Chuck Wagner and his family and known" to "the winery the Wagner family founded in Rutherford, Napa Valley, known"; kept.0.a, the same, and "The family also makes the Special Selection" to "Caymus also makes the Special Selection".
Source: research/producers-cellar-napa-icons-2026-10-10.md, Repairs owed in the pack: "w-bksfriq3 and w-nhg7xn40, Caymus: the origin says "run by Chuck Wagner and his family", an undated present role." Section 9, item 3: ""Run by Chuck Wagner" is an undated present role and is used in no profile." The founding as in section 1 above (Verification item 11; p-caymus founded "1972").

### Dominus Estate Napa Valley 2014 (w-dozzew00)

Entries: s10 and guest, "Christian Moueix's Napa estate" to "the Napa estate Christian Moueix created"; why, "the Napa estate of Christian Moueix of Bordeaux" to "the Napa estate created by Christian Moueix of Bordeaux"; s20, "Dominus comes from Christian Moueix" to "Dominus was created by Christian Moueix"; s45 and kept.0.a, "the Napa estate of Christian Moueix" to "the Napa estate created by Christian Moueix" and "He farms the historic Napanook vineyard ... and makes the wine" to "It grows on the historic Napanook vineyard ... and the wine is made"; kept.2.a, the answer to "Who makes Dominus?" now says who created the estate.
Source: research/producers-cellar-napa-icons-2026-10-10.md, Verification 2026-10-10, item 7: ""Christian Moueix's Napa estate" (a present owner) is now "the Napa estate Christian Moueix created"". The wine list section: "Dominus Estate: the tell says "Dominus belongs to Christian Moueix", a present owner no record dates; the Codex dates his founding to 1983. Reworded in the JSON to the founding." The 10 second line is 17 words after the change.

### Bartolo Mascarello Barolo 2017 (w-1pzt64c2)

Entries: origin, s45 and kept.0.a, "run by Maria Teresa Mascarello" (and "now run by") out.
Source: research/producers-cellar-italy-2026-10-10.md, section 6: "Maria Teresa Mascarello is named in two places, neither dated (items 3 and 5): the profile attributes her to the Codex and the notes say who runs a cellar can change."

### Gaja Barbaresco 2012 (w-cn6yo3te)

Entries: origin and kept.0.a, "and his family runs it today" out; Angelo Gaja's part in making the name famous stays.
Source: research/producers-cellar-italy-2026-10-10.md, section 7, item 11: "Its origin field says "his family runs it today", undated; the profile does not repeat it."

### Vega Sicilia 'Único' Ribera del Duero 2009 (w-qwxby6pq)

Entries: origin and kept.0.a, "owned by the Álvarez family" out.
Source: research/producers-cellar-spain-2026-10-10.md, section 6, item 4: ""Owned by the Álvarez family" is an undated present-tense owner; no profile uses it, and a lineup question asks for a dated answer. The pack's origin field repeats it ("owned by the Álvarez family")." The lineup question stands (overrides.json entry 3700).

### Ornellaia 'Masseto' Toscana 2011 (w-e0ueblrl)

Entries: origin and kept.0.a, "by the Frescobaldi family" out; Masseto is still "now run as an estate of its own", as the Codex and the card agree.
Source: research/producers-cellar-italy-2026-10-10.md, section 10: "The pack's Masseto card ("now run as an estate of its own by the Frescobaldi family") carries the same undated owner. The profile names no owner and no year of separation." The lineup question stands (overrides.json entry 3620).

### Chappellet 'Mountain Cuvée' Napa Valley 2024 (w-y1kpx6u9)

Entries: origin, s45 and kept.0.a, "the family still runs it" (and "still run by the family") out; the founding by Donn and Molly Chappellet on Pritchard Hill in 1967 stays.
Source: research/producers-cellar-napa-sonoma-2026-10-10.md, section 3, item 7: "The pack, w-y1kpx6u9, origin: "... in 1967; the family still runs it." The pack was read in early October 2026; who runs it is ownership and can change." Item 1 holds the founding (Codex p-chappellet and the 4 October search of chappellet.com).

### Frog's Leap 'Estate' Rutherford Cabernet Sauvignon 2021 (w-ft23mm20)

Entries: origin, s45 and kept.0.a, "John Williams's winery in Rutherford" to "a winery in Rutherford".
Source: research/producers-cellar-napa-sonoma-2026-10-10.md, section 4, item 1, the 4 October card marked "knowledge, certain" (not a search): "Frog's Leap is John Williams's winery in Rutherford, Napa Valley". Item 2, the Codex: "Larry Turley, who co-founded Frog's Leap". So the possessive both dates nothing and leaves out a co-founder. The lineup already asks whether John Williams runs it (overrides.json entry 3645).

### Silver Oak Napa Valley Cabernet Sauvignon 2020 (w-peragxkw)

Entries: origin and kept.0.a, "run by the Duncan family" out; the founders Justin Meyer and Ray Duncan stay.
Source: research/producers-cellar-napa-sonoma-2026-10-10.md, section 5, item 1: "That card is dated 4 October 2026; who runs it is ownership and can change." The lineup already asks (overrides.json entry 3638).

### Kracher 'Cuvée' Auslese Burgenland 2017 (w-mx7t35t8)

Entries: origin, s45 and kept.0.a, "run today by his son Gerhard" (and "his son Gerhard runs it now", "runs it today") out; Alois Kracher stays.
Source: research/producers-cellar-germany-austria-2026-10-10.md, section 7, item 4: "Because the card mixes search and knowledge, the profile says the 4 October 2026 research names Gerhard Kracher, his son, and that this can change, and gives no proportions." The pack carries no such date. Item 1, search 48: "Alois Kracher made its sweet wines world famous from the late 1980s until his early death in 2007."

### Niepoort Vintage Port 1987 (w-kkpd0jqz)

Entries: origin, s45 and kept.0.a, "now led by Dirk Niepoort" (and "run today by") out; kept.2.a, "led today by Dirk Niepoort" to "known for elegant Ports and old Colheitas".
Source: research/producers-cellar-port-madeira-2026-10-10.md, section 2, item 5, the 4 October card: "Niepoort is a family Port house of Dutch origin in Porto, led by Dirk Niepoort, also a leading maker of Douro table wines; it is known for elegant Ports and for old Colheitas and Garrafeiras." And: ""Led by Dirk Niepoort" is undated, so no profile says who leads the house today." The new answer is the card's own "known for elegant Ports and for old Colheitas".

### Château Suduiraut Sauternes Premier Cru Classé 2010 (w-unp09mcu)

Entries: origin and kept.0.a, "owned by AXA Millésimes" out.
Source: research/producers-cellar-bordeaux-white-sweet-2026-10-10.md, section 3, item 4: "The owner is recorded in a card dated 4 October 2026 from knowledge, not from a search." And: "Not confirmed: the year AXA Millésimes bought it; the founding." The lineup already asks (overrides.json entry 3533: "the profile names no owner").

### Feist Late Bottled Vintage Port 2006 (w-emjo4lpj)

Entries: origin, "now part of the Sogevinus group" to "bought by the Sogevinus group in 2006"; kept.0.a, "today part of the Sogevinus group" to the same.
Source: research/producers-cellar-port-madeira-2026-10-10.md, section 3, item 1, the 4 October card from a search of vintageport.se: "Feist was founded in 1836 in London by two German cousins, H. and C.J. Feist, opened in Oporto in 1870, was taken over by Barros in 1953 and bought by Sogevinus in 2006". The same file's Verification, R5: "In the offered fix for wine-story-sandeman-feist, "it has belonged to the Sogevinus group since 2006" stated a present owner; now "it was bought by the Sogevinus group in 2006", the dated event the record gives." The year 2006 stands in both files.

### Giuseppe Quintarelli Recioto della Valpolicella Classico 1997 (w-ikybf7bx)

Entry: kept.2.a, "his family runs the estate today" to "whose name the estate carries".
Why: the answer stated who runs the estate today with no date, the same shape as the cards above. The card's origin ("his family carries on the estate") is left as it is: it states continuity, not a present role, and no research file flags it. Giuseppe Quintarelli as the great traditionalist of Valpolicella stands on research/producers-cellar-italy-2026-10-10.md, section 12 (the Codex record m-ef9ki267: "Quintarelli in Amarone, ... each so dominant the house style reads as regional typicity").

## 5. Searched and left standing

### Duckhorn 'Three Palms Vineyard' Napa Valley Merlot 2020 (w-rnruxvgd), the region string

The string "Calistoga, Napa Valley, California" puts the vineyard in the Calistoga appellation, which the Codex card reads as a Terroir row; the label says Napa Valley and the research said only "near Calistoga". Search 1, 11 October 2026, query "Duckhorn Three Palms Vineyard Merlot Calistoga AVA location": https://en.wikipedia.org/wiki/The_Duckhorn_Portfolio, https://www.jamessuckling.com/wine-tasting-reports/classic-california-merlot-tasting-five-decades-of-duckhorn-three-palms-vineyard, https://top100.winespectator.com/2017/article/merlot-magic/ and https://www.californiawineadvisors.com/?p=1993: the 83-acre Three Palms property lies near the town of Calistoga in the northwest of the Napa Valley, its three palms visible from the Silverado Trail, on rocky volcanic soils; one listing calls the site the Calistoga sub-appellation and another a 73-acre estate in Calistoga; Duckhorn bought it from the Upton family in May 2015 (summary). The string stands.

### Henriques & Henriques 'Founder's Solera' Madeira 1894 (w-ay6nux07), the profile

The profile says "a solera begun in 1894, aged warm in old casks for more than a century"; the October research recorded the producer's description of a solera "begun in 1894 and closed in 1899" and asked what that means for the bottle (overrides.json entry 3646). Search 2, 11 October 2026, query "Henriques & Henriques Founder's Solera 1894 Madeira solera closed 1899": https://sommselect.com/products/somm1902-hh1894found-750, https://ruepinard.com/blogs/nieuws/discover-the-rich-aromas-and-flavors-of-the-1894-henriques-henriques-madeira-malvasia-founders-solera and https://www.continente.pt/produto/henriques-henriques-founders-1894-vinho-da-madeira-henriques-henriques-8012245.html: no result mentions 1899; one retailer describes a blend of base wine from the 1870s with a perpetual solera first established in 1894 that still sits in the cellars of Henriques & Henriques; a blog title calls it the 1894 Malvasia Founders Solera (summary). The sources disagree on whether the solera was closed, so the profile, which claims neither, stands, and the lineup question already filed carries the conflict. The retailer's "1870s" is a sales page and goes on no card.

## 6. Read and left standing

The other thirty-five cards were read in full and carry no error in the swept fields: La Rioja Alta 'Gran Reserva 904' Rioja 2015, Biondi Santi Tenuta Greppo Brunello di Montalcino 2012, Tenuta San Guido 'Sassicaia' Bolgheri Sassicaia 2018, Antinori 'Tignanello' Toscana 2010, Duckhorn Napa Valley Cabernet Sauvignon 2022, Inglenook 'Rubicon' Rutherford 2010, Ridge 'Monte Bello' Santa Cruz Mountains 2012, Joseph Phelps 'Insignia' Napa Valley 2013, Opus One Napa Valley 2010, Ridge 'Three Valleys' Sonoma County 2023, Piedrasassi 'Bien Nacido Vineyard' Santa Maria Valley Syrah 2021, Ridge 'Lytton Springs' Dry Creek Valley 2022, Penfolds 'Bin 389' Cabernet Shiraz 2019, Kosta Browne Sonoma Coast Pinot Noir 2021, Duckhorn 'Three Palms Vineyard' Napa Valley Merlot 2020, Château Musar Bekaa Valley 2003, Penfolds 'Grange' Shiraz 2004, Hexamer 'Meddersheimer Rheingrafenberg' Riesling Spätlese 2010, Domaine des Baumard 'Clos Sainte Catherine' Coteaux du Layon 2006, Dr. Hermann 'Ürziger Würzgarten in der Kranklei' Riesling Spätlese Goldkapsel 2018, Domaine Huet 'Le Mont' Vouvray Moelleux 2009, Château Climens Barsac Premier Cru Classé 2010, Inniskillin Cabernet Franc Icewine Niagara Peninsula 2015, Trimbach Gewurztraminer Vendanges Tardives 2007, Château d'Yquem Sauternes 2007, Barbadillo 'Pale Cream' Sherry NV, Sandeman Late Bottled Vintage Port 1999, Taylor Fladgate 'Quinta de Vargellas' Vintage Port 1987, Riveyrac Rivesaltes 1975, Graham's Vintage Port 2000, Broadbent 'Single Cask' Malvasia Madeira 500 ml 2009, Dow's Vintage Port 1985, Graham's Vintage Port 1983, Taylor Fladgate Vintage Port 1977 and Henriques & Henriques 'Founder's Solera' Madeira 1894.

Notes on what was weighed and kept:
- Every stated age was checked against 2026 less the vintage, in the style, profile, timed lines, parts and Tell me about it; all agree. The Sandeman's "more than twenty years in bottle" fits an LBV bottled four to six years after 1999.
- Region strings. Dr. Hermann's "Ürzig, Mosel, Germany" names the vineyard's village, not the estate's (Erden), which research/producers-cellar-alsace-jura-mosel-2026-10-10.md, section 5, noticed in passing; for a wine card the village of the vineyard is the right first part, as Hexamer's Meddersheim is. Baumard's "Rochefort-sur-Loire, Anjou, Loire Valley, France" leads with the commune of the clos, a Coteaux du Layon village, the way Preignac, Haro and Illmitz lead their strings. Tignanello's "Chianti Classico area" marks the zone without claiming the appellation, which is IGT Toscana, as its name says. Penfolds' "South Australia" stands; the list's Barossa Valley is already a lineup question (entries 2898, 2926 and 3543).
- Joseph Phelps Insignia 2013: the card says "first proprietary Bordeaux-style blend" in eleven places, where the pack's Insignia 2011 half-bottle, the wine list and one 4 October card say "one of the first" and the Codex's why says first (research/producers-cellar-napa-sonoma-2026-10-10.md, section 1, item 3). The sources disagree and the claim is not shown wrong, so it is a lineup question (section 7), not an entry.
- Piedrasassi names Sashi Moorman and Melissa Sorongon and Broadbent names Bartholomew Broadbent: both rest on searches of 4 October 2026 (skurnik.com and retailer pages; broadbent.com and winespectator.com) and both are the label's own names, so they stand; the combined lineup question asks for a dated answer.
- Piedrasassi's "old vines": the October check withdrew the X Block and 1973 dating (research/producers-cellar-central-coast-oregon-world-2026-10-10.md, Verification, item 4) but not the retailers' old vines, and the lineup already asks (entry 3540).
- Gilette's "run by the Médeville family", Graham's and Dow's "owned by the Symington family", Yquem's "owned by LVMH" and Biondi Santi's EPI "since 2016" rest on dated searches (searches 51, 34 and 24 of research/components-wines-2026-10-05.md) or carry their year, and stand. Barbadillo's "a family sherry house" and Quintarelli's "his family carries on the estate" describe a family house without a named person or a present role and stand.
- Château Climens's "farmed biodynamically" in the origin is a present farming claim under new owners since 2022; the lineup already asks (entry 3531), and the swept fields do not repeat it.
- Kracher's name, Trimbach's grape and the Inniskillin and Kracher sizes are lineup questions already (entries 2968, 2996, 2982, 3547 and 3594).

## 7. Lineup questions

ask: The Joseph Phelps Insignia 2013 card calls Insignia California's first proprietary Bordeaux-style blend, and the Insignia 2011 half-bottle card, the wine list and one October card say one of the first: which does the sommelier want the floor to say?
ask: Who planted Martha's Vineyard in Oakville: Tom and Martha May, or an earlier owner before them? Our cards now say only that it was the Mays' vineyard.
ask: If a guest asks who runs the house today, what does the sommelier want said, with a dated source, for Bartolo Mascarello, Gaja, Kracher, Niepoort, Harlan Estate, Dominus, Caymus, Chappellet, Quintarelli, Piedrasassi and Broadbent? The cards now give only who founded or made each name.
ask: Did Castello Banfi revive Moscadello di Montalcino, or join growers already making it? Our cards said revived; no source does, and they now say only that Banfi makes Florus.
