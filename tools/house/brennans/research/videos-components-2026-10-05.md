# Videos for the components of service at Brennan's, 5 October 2026

Output: `tools/house/brennans/components/videos.json` (videos 4 new and verified, reuse 39 links to entries already verified, unverified 14).

## The rule applied

A video counts as verified only when a WebSearch result shows that exact id with that exact title, and the channel is shown by a result or named by the result summary from what it listed. No id was constructed. oEmbed was tried once through WebFetch (`youtube.com/oembed?url=...dJ-sAEzw9Jc`) and returned EGRESS_BLOCKED, so the rule above stands. Running times were never shown, so every `minutes` is null. The session's shared WebSearch budget ran out after 21 searches by this researcher (the harness refused the 22nd: "200 of 200 WebSearch calls"), so several channel checks could not be run; those candidates stay unverified.

## What was reused rather than repeated

All 25 shipped pack videos and the 14 research entries of 4 October that carry a channel are attached to component keys in `reuse` by their existing id. The research entries with no channel (the Brennan's own Bananas Foster films, the turtle soup films, the Commander's and Dooky Chase gumbo films, duck confit, cherries jubilee, the Brennan's history films, the hospitality talk) remain unverified in their own file and are not repeated here.

## Coverage by component

- Hollandaise and derivatives: hollandaise (pack), béarnaise (research, Martha Stewart). Choron and Foyot have no verified film of their own.
- Roux and gumbo: roux (pack). No verified gumbo film.
- Marchand de vin and bordelaise: only the pan sauce science film (pack) by reuse; four bordelaise candidates found, none with a channel shown.
- Poaching eggs: pack. En papillote: research, Bon Appétit. Confit: none verified.
- Blackening: one candidate, channel not shown. Nothing verified.
- Flambé and Bananas Foster: pack (flambé safety, the SAVEUR Foster film).
- Turtle soup: none verified.
- Sazerac and the rinse, Peychaud's: pack Sazerac plus two research films. No verified Peychaud history film.
- Milk punch: only the clarified style (new, Cocktail Chemistry); the creamy New Orleans brandy style has a candidate with no channel.
- Dry shake and egg white: new, Cocktail Chemistry.
- Irish coffee: research, by reuse. Cold brew: new, James Hoffmann.
- Opening still wine, Champagne opening, decanting: pack and research. Sabrage: new, Food52.
- Coravin: five candidates, none with a channel shown. Nothing verified.
- Large formats and half bottles: nothing found within the budget.
- Brennan's history: only the Eater Eggs Hussarde film (research) is verified. Fine dining service: the Court of Master Sommeliers hospitality film (pack).

## Searches, in order, and what each showed

1. `youtube bordelaise sauce how to make chef video`: aOWWy-f4gE8 (title truncated), YriBLV7xDOY "How to Make Bordelaise Sauce for Steaks" (snippet names a presenter), vKcb0fOfdEQ, MSXZlKnN6OU "How to Make Bordelaise Sauce". No channels.
2. `youtube Paul Prudhomme blackened redfish video`: UCkUvcCZ53I (a seasoning review, not used), 6w7RMuNJrpE "Blackened Redfish on Castin' Cajun" (snippet names the cook). No channels. The snippet also said blackening was a technique Prudhomme devised at K-Paul's; not used here.
3. `youtube how to sabre champagne sabrage video sommelier`: e8Pkt6vbgXc, ClD_-UBaIyI "How to Saber Champagne" and several Shorts. Channels not shown.
4. `youtube Coravin how to use video official Coravin channel`: Z4cWc0Ag1_A, m75eTiVsLHg, W5MfV7VSk34, 40kMZ6bzccc, n4hZNymZ_pQ, playlist PLsWCh9B7Jc6xm_AqktXJ1GREOzBhgBgzK "Coravin Timeless Instructional Videos". No channels.
5. `"How to Use the Coravin Wine Access System" Coravin youtube`: the same ids again. No channels.
6. `"How to Saber Champagne" Erik Lombardo Serious Eats OR Spirit Guides youtube`: ClD_-UBaIyI beside the Food52 article that carries the film.
7. `Court of Master Sommeliers Americas youtube Coravin OR "large format" OR magnum video`: no video results.
8. `youtube dry shake egg white sour cocktail technique ...`: recipe pages only, no video ids.
9. `"How to Use the Coravin Wine Access System" Z4cWc0Ag1_A uploaded by which youtube channel`: id and title shown; the summary then searched a winery and called it the uploader without any result showing it. Kept unverified.
10. `"How to Saber Champagne" ClD_-UBaIyI uploaded by which youtube channel Food52`: id and title shown; summary named Food52. Verified.
11. `Anders Erickson youtube "Whiskey Sour" video egg white dry shake`: sbloHsAFqXY "Basic Cocktails - How To Make The Whiskey Sour (Reverse Dry Shake)" without a channel.
12. `youtube "Brandy Milk Punch" video ...`: rhLoJpo8w6s again (already unverified on 4 Oct).
13. `Coravin official youtube channel @Coravin1 "Coravin Timeless" how to pour video`: Z-wud2_2bYs "How to Use Coravin Timeless Six+", XaK0UYz9A4I "Coravin Timeless Quick Start Guide". No channels.
14. `"Basic Cocktails - How To Make The Whiskey Sour (Reverse Dry Shake)" youtube channel`: id and title shown with the cocktailchemistrylab.com page of the same title; summary named Cocktail Chemistry. Verified.
15. `youtube New Orleans brandy milk punch Brennan's OR ...`: cbttaEqP6yA "New Orleans Brandy Milk Punch Recipe", no channel.
16. `youtube Sazerac House Peychaud's bitters history Antoine Peychaud video`: mfX4CvGazQQ, a product review, no channel. History facts in the snippets were not used.
17. `"Coravin Timeless Quick Start Guide" XaK0UYz9A4I youtube Coravin channel`: Coravin's own pages only, no channel for the id.
18. `"Cocktail Chemistry" youtube Irish Coffee OR "egg white" OR "milk punch" OR "clarified milk punch" video`: ZZ1ffluktqM "Advanced Techniques - Clarified Milk Punch" with a Pinterest pin crediting Cocktail Chemistry; summary named the channel. Verified.
19. `youtube cold brew coffee how to make Blue Bottle OR "James Hoffmann" video`: c1qzfSo42rE "Blue Bottle Coffee Concepts - DIY Cold Brew" (no channel) and Hoffmann's cold brew post on TikTok.
20. `youtube "James Hoffmann" Irish coffee video`: no Irish coffee film; not used.
21. `"Everything I learned about Cold Brew Coffee" James Hoffmann youtube.com/watch`: AB0QLjroFss "Everything I Learned About Cold Brew Coffee", beside the same title from @jameshoffmanncoffee; summary attributed it to Hoffmann. Verified.
22 to 24 were refused by the session budget: a Blue Bottle channel check, a poached egg search and an eggs Benedict search.

## Notes for the integrator

- The Ledger names nobody. The cold brew entry's channel is a living person's name, as the shipped Anders Erickson entries already are; its `why` names nobody. If channel names are to be hidden in the Ledger, that is a rendering choice, not a data change.
- `fine-dining-service`, `glassware` and `selling-wine` are proposed keys; every other key exists in the component fragments.
- Before any of the four new entries ships, run an oEmbed check from a machine that can reach YouTube, as for the earlier files.
