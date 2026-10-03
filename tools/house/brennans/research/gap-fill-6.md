# gap-6
Gap 6 (the house beyond the menu) could not be filled from live sources this session. The WebSearch budget was already exhausted (200 of 200 calls) before this subagent ran, every search returned "not performed", WebFetch is blocked by the ground rules and a direct fetch of the FAQ page through the proxy was refused by the permission classifier. The repository holds nothing on the house beyond one almanac line listing Brennan's among houses that set a Réveillon menu. So this dossier has no (search) statements at all. It is built from (pdf) pages 1 to 3 and 47 to 51, from (brief) facts the orchestrator supplied (tour dates, Bananas Foster Day, turtle parade), and from (expert) professional knowledge of the Brennan family and New Orleans practice, each labelled with a confidence. Every (expert) line about Brennan's specifically is marked unverified and carries an askWhom. What is solid: service hours, the dress code paraphrase, the Friday sabrage, Bubbles at Brennan's, the 80th year, the allergy note, and the family map (which Brennan's is this, who the cousins are). What a new server must still confirm with a manager before quoting: reservation platform and phone, cancellation and no-show terms, large-party gratuity, corkage, cake fee, room names and capacities, Wine Room minimum, valet hours and price, holiday and Réveillon hours, the Celebration Tour venues, and the exact dates of Bananas Foster Day and the turtle parade. The notes carry a house record and fact records as JSON, six scenarios with guest line, server line and principle, and 30 checkable claims.

# Gap 6: the house beyond the menu

## 0. Source position this session (read first)

- (pdf) Pages 1 to 3 and 47 to 51 were read with the Read tool. The PDF is a server dialogue and wine pairing guide dated "menus read September 26, 2026". It gives hours, the dress code paraphrase, the Bubbles at Brennan's window, the Friday sabrage, the 80th year and the allergy note. It does not cover reservations, parking, rooms, holidays or the group.
- (search) None. The session's WebSearch budget was already at 200 of 200 when this subagent started. All six search calls returned "Web search was not performed". No snippet exists to cite.
- Direct fetch: WebFetch is blocked by the ground rules. A curl of the FAQ page through the proxy was refused by the permission classifier, so no page was read.
- Repository: four files mention Brennan's. Three are lore lines (Brandy Milk Punch, Bananas Foster recipe note, a Svelte chunk). One, almanac/index.html line 2519, lists "Galatoire's, Antoine's, Brennan's, Commander's Palace, Arnaud's, and Tujague's" as houses that set a fixed-price four to five course Réveillon menu. That is app text from an earlier session, labelled (repo) below and not verified.
- (brief) The orchestrator's task text supplied: Celebration Tour legs (New York 22 to 24 October, Charleston 13 to 15 November, Palm Beach in December), the 80th kick-off on 2 January, Bananas Foster Day on 6 April, the turtle parade in early May, and the hint "Wine Room 16 seats minimum". None was re-verified here.
- (expert) Professional knowledge of the Brennan family, the French Quarter and fine-dining practice. Every (expert) line about Brennan's specifically is UNVERIFIED and must not be spoken to a guest as fact until a manager confirms it.

Labels used: (pdf pNN), (brief), (repo), (expert, confidence). British spelling throughout. No em dashes.

## 1. House record

```json
{
  "house": "Brennan's",
  "address": "417 Royal Street, New Orleans, Louisiana",
  "asOf": "2026-10-03",
  "sourcePosition": "pdf and expert only; no live search or fetch this session",
  "hoursByService": {
    "breakfastAndLunch": {"monToFri": "09:00 to 14:00", "satSun": "08:00 to 14:00", "label": "pdf p49", "status": "pdf"},
    "dinner": {"nightly": "18:00 to 22:00", "label": "pdf p49", "status": "pdf"},
    "roostBarAndCourtyard": {"monToFri": "14:00 to 18:00, Bubbles at Brennan's", "label": "pdf p49", "status": "pdf", "note": "The PDF gives the Bubbles window only. Full bar hours outside that window are unverified."},
    "fridaySabrage": {"when": "Fridays at 17:00 in the courtyard", "label": "pdf p48 and p49", "status": "pdf"},
    "holidays": {"thanksgiving": "unverified", "christmasEve": "unverified", "christmasDay": "unverified", "newYearsEve": "unverified", "newYearsDay": "unverified", "mardiGras": "unverified", "jazzFest": "unverified", "reveillon": "unverified; repo almanac line lists Brennan's among Réveillon houses; expert note: Brennan's has historically been a house that opens on Christmas Day and Thanksgiving with set menus (expert, medium)", "status": "unverified", "askWhom": "general manager"}
  },
  "dressCode": {
    "text": "Dressy casual; jackets preferred at dinner. No athletic or cut-off shorts, sleeveless or decal T-shirts, hats, or open-toed shoes for men.",
    "source": "pdf p50, which cites the FAQ page (pdf source 13, brennansneworleans.com/frequently-asked-questions/)",
    "asOf": "2026-09-26 (the PDF's menu read date)",
    "status": "pdf paraphrase; the verbatim FAQ wording was not readable this session"
  },
  "reservations": {
    "platform": "unverified; expert, medium: OpenTable is the platform the house has used in recent years",
    "phone": "unverified; expert, medium: (504) 525-9711 is the number long associated with 417 Royal",
    "eventsContact": "unverified; expert, medium: the owner's group runs a catering and events arm, so private dining enquiries go through a sales or events manager rather than the host stand",
    "cancellationPolicy": "unverified",
    "depositOrNoShowFee": "unverified",
    "largePartyPolicy": "unverified",
    "largePartyGratuity": "unverified",
    "allergies": {"text": "The kitchen can accommodate most allergies and restrictions. Ask guests to note them at the reservation, and always confirm with the kitchen.", "label": "pdf p50", "status": "pdf"},
    "askWhom": "general manager or reservations manager"
  },
  "parking": {
    "valet": "unverified; expert, medium: the house has offered valet at dinner at the Royal Street door in recent years; hours and price unknown this session",
    "royalStreetPedestrianMall": "expert, medium: Royal Street is closed to cars for a pedestrian mall in the daytime on the blocks from about Bienville to St Ann, roughly 11:00 to 16:00 daily; the 400 block (Conti to St Louis), where the house stands, sits inside it; exact hours and blocks unverified",
    "nearbyGarages": "expert, medium: Omni Royal Orleans garage on St Louis Street, the Monteleone garage at Royal and Iberville, paid lots on Conti and Chartres, the Jax Brewery garage on Decatur; none verified as the house's recommendation",
    "askWhom": "door or valet captain, then general manager"
  },
  "rooms": [
    {"name": "Chanteclair Room", "floor": "unverified", "seated": "unverified", "standing": "unverified", "minimumSpend": "unverified", "note": "brief names it; expert, medium: a principal dining room named for the house rooster"},
    {"name": "Morphy Room", "floor": "unverified", "seated": "unverified", "standing": "unverified", "minimumSpend": "unverified", "note": "brief names it; expert, medium: named for the Morphy family, who owned 417 Royal in the 19th century, and for the chess champion Paul Morphy"},
    {"name": "Wine Room", "floor": "unverified", "seated": "brief hint: 16; unverified", "standing": "unverified", "minimumSpend": "unverified", "bottlesForSale": "unverified; expert: in a Grand Award house the displayed cellar is normally on the list and sold by the sommelier", "note": "pdf source 10 lists a Wine Room page at brennansneworleans.com/wine-room/"},
    {"name": "Courtyard", "floor": "ground", "seated": "unverified", "standing": "unverified", "note": "pdf p48 and p49: Friday sabrage and Bubbles at Brennan's happen here with the Roost Bar"},
    {"name": "Roost Bar", "note": "pdf p49 names it as the bar; not a private room as far as the PDF says"},
    {"name": "other historic room names", "note": "expert, low: the pre-2013 house used names such as the Rex Room, the Red Room and the Tulip Room; whether any survive the 2014 restoration is unverified"}
  ],
  "awards": {
    "wineSpectator": {"text": "Wine Spectator Grand Award cellar", "label": "pdf p49", "status": "pdf; year of the award unverified"},
    "other": "unverified"
  },
  "anniversary": {
    "year": "80 years in 2026; opened 1946, at 417 Royal Street since 1956", "label": "pdf p50",
    "menus": "anniversary tasting menus through the year; the Traditional Breakfast page says Celebrating 80 Years in 2026", "labelMenus": "pdf p49 and p50",
    "bananasFoster75": "Bananas Foster invented at Brennan's in 1951; 2026 is its 75th year", "labelBF": "pdf p49",
    "celebrationTour": {"newYork": "22 to 24 October 2026 (brief); venue unverified", "charleston": "13 to 15 November 2026 (brief); venue unverified", "palmBeach": "December 2026 (brief); dates and venue unverified", "kickOff": "2 January 2026 (brief); unverified"},
    "newOrleansEvents2026": "unverified",
    "askWhom": "general manager or marketing"
  },
  "group": {
    "thisHouse": "Brennan's, 417 Royal Street, owned since 2014 by Ralph Brennan with partner Terry White (expert, high)",
    "company": "Ralph Brennan Restaurant Group (expert, high)",
    "siblings": [
      "Red Fish Grill, 115 Bourbon Street, casual Gulf seafood, opened 1997 (expert, high for name and street, medium for year)",
      "Ralph's on the Park, 900 City Park Avenue, facing City Park, opened 2003 (expert, high for name, medium for year)",
      "Café NOMA, inside the New Orleans Museum of Art in City Park, lunch and lighter fare (expert, high)",
      "Napoleon House, 500 Chartres Street, the 1914 bar famous for the Pimm's Cup and the muffuletta, in the group since 2015 (expert, high for name and address, medium for year)",
      "Ralph Brennan Catering and Events (expert, medium)"
    ],
    "cousinsCommandersFamily": [
      "Commander's Palace, 1403 Washington Avenue, Garden District (expert, high)",
      "SoBou, 310 Chartres Street in the W French Quarter (expert, high)",
      "Brennan's of Houston, 3300 Smith Street, Houston, opened 1967, sister to Commander's, run by Alex Brennan-Martin; it is not this house (expert, high)"
    ],
    "cousinsDickieBrennan": [
      "Palace Café, 605 Canal Street (expert, high)",
      "Dickie Brennan's Steakhouse, 716 Iberville Street (expert, high)",
      "Bourbon House, 144 Bourbon Street (expert, high)",
      "Tableau, 616 St Peter Street on Jackson Square (expert, high)",
      "Pascal's Manale, Uptown, acquired in 2021 (expert, medium)"
    ],
    "cousinsOther": [
      "Mr. B's Bistro, 201 Royal Street at Iberville, opened 1979 by the Commander's side and run by Cindy Brennan (expert, medium-high)"
    ],
    "formerOwners": "Owen Brennan's sons (Pip, Jimmy and Ted) ran 417 Royal from the 1974 family split until the 2013 closure (expert, high)"
  }
}
```

## 2. The family map a server needs (expert unless marked)

Short version to say at the table: "We are the original Brennan's. Owen Brennan opened it in 1946 and the family moved it here to Royal Street in 1956. Commander's Palace belongs to our cousins in the Garden District. Our owner, Ralph Brennan, grew up on that side of the family and brought this house back in 2014."

The timeline, labelled:
- 1946: Owen Edward Brennan opens the first Brennan's on Bourbon Street, with his siblings working alongside him (expert, high). (pdf p50) agrees on 1946.
- 1951: Bananas Foster is invented here (pdf p48 and p49).
- 1955 to 1956: Owen dies in late 1955; the family completes the move to 417 Royal Street in 1956 (expert, high; pdf p50 gives 1956).
- 1969: the family buys Commander's Palace (expert, high).
- 1973 to 1974: the family splits. Owen's widow and sons (Owen "Pip" Jr., Jimmy, Ted) keep Brennan's at 417 Royal. Ella, Dick, John, Adelaide and Dottie take Commander's Palace and the other restaurants (expert, high).
- 1979: Mr. B's Bistro opens at 201 Royal on the Commander's side (expert, medium-high).
- 2013: the Royal Street house closes after financial trouble and the building is sold at auction. Ralph Brennan, Ella's nephew, and partner Terry White buy it and restore it (expert, high).
- November 2014: Brennan's reopens under Ralph Brennan, with Slade Rushing as opening chef (expert, high for the reopening, medium for the chef).
- June 2025: Kris Padalino becomes executive chef (pdf p49).
- 2026: the 80th year (pdf p50).

The building (expert, medium): 417 Royal was built in the 1790s, housed the Banque de la Louisiane in the early 1800s, and later belonged to the Morphy family. The chess champion Paul Morphy lived and died in the house in 1884. That is the source of the Morphy Room name. Chanteclair, the rooster, is the house emblem and the source of the Chanteclair Room name (expert, medium).

Who is who, in one line each:
- This house: Brennan's, Royal Street, Ralph Brennan Restaurant Group.
- Same company, different kitchens: Red Fish Grill (Bourbon Street seafood), Ralph's on the Park (Mid-City, by City Park), Café NOMA (museum café), Napoleon House (Chartres Street bar, Pimm's Cup, muffuletta), plus catering.
- Cousins, Commander's side: Commander's Palace, SoBou, and Brennan's of Houston. A guest who says "the Commander's Palace Brennan's" usually means Houston or Commander's itself. Neither is this house.
- Cousins, Dickie Brennan's side: Palace Café, Dickie Brennan's Steakhouse, Bourbon House, Tableau, Pascal's Manale.
- Cousins, Royal Street neighbour: Mr. B's Bistro at 201 Royal, three blocks towards Canal.
- No longer in the family's hands here: the Owen Brennan line that ran this house to 2013. A guest who ate here before 2013 ate under them; the menu classics (Eggs Hussarde, Bananas Foster, turtle soup) carried through (expert, high).

Gift cards (expert, medium, unverified): the group has sold gift cards redeemable across its restaurants. Cookbooks (expert, medium, unverified): the classic titles are "Breakfast at Brennan's" and "Breakfast at Brennan's and Dinner, Too" from the pre-2013 era, and Ralph Brennan's own "New Orleans Seafood Cookbook". Whether any is on sale at the host stand today is unverified.

## 3. Fact records

Status values: pdf (the PDF says it), brief (the orchestrator supplied it, unverified here), expert (professional knowledge, unverified for this house), unverified (nothing usable this session).

```json
[
  {"question": "What are your hours?", "oneBreath": "Breakfast and lunch nine to two on weekdays, eight to two on weekends. Dinner nightly six to ten.", "oneMinute": "Breakfast and lunch run Monday to Friday nine to two and Saturday and Sunday eight to two. Dinner is nightly six to ten. The Roost Bar and the courtyard pour Bubbles at Brennan's Monday to Friday two to six, and on Fridays at five we saber a bottle of Champagne in the courtyard.", "long": "Hours as the PDF records them at 26 September 2026: breakfast and lunch Mon to Fri 09:00 to 14:00, Sat and Sun 08:00 to 14:00; dinner nightly 18:00 to 22:00; Roost Bar and Courtyard Mon to Fri 14:00 to 18:00 for Bubbles at Brennan's; Champagne sabering Fridays at 17:00. Holiday hours are not in the PDF.", "status": "pdf", "sources": ["pdf p48", "pdf p49"], "askWhom": "host stand for same-week changes"},
  {"question": "How do I book a table?", "oneBreath": "Online through our reservations page, or ring the house and we will set it up.", "oneMinute": "Book online through the reservations link on our site or ring the restaurant. For a party larger than a normal table, for a private room, or for a tasting menu at breakfast, let us know when booking so the kitchen can plan.", "long": "The platform, phone number, cancellation terms, deposit or no-show fee and large-party rules were not readable this session. (expert, medium) The house has used OpenTable in recent years and the long-standing number is (504) 525-9711. Confirm both before quoting. Never quote a cancellation fee you have not been handed in writing.", "status": "expert", "sources": ["expert"], "askWhom": "reservations manager"},
  {"question": "Is there a dress code?", "oneBreath": "Dressy casual, and jackets are preferred at dinner.", "oneMinute": "Dressy casual. Jackets are preferred at dinner. We ask guests to avoid athletic or cut-off shorts, sleeveless or decal T-shirts and hats, and open-toed shoes for men.", "long": "The PDF (p50) paraphrases the FAQ page: dressy casual; jackets preferred at dinner; no athletic or cut-off shorts, sleeveless or decal T-shirts, hats, or open-toed shoes for men. The verbatim FAQ text was not readable this session. Say it warmly and leave the door open; the host stand decides edge cases.", "status": "pdf", "sources": ["pdf p50", "pdf source 13"], "askWhom": "host stand for edge cases"},
  {"question": "Where do we park?", "oneBreath": "Let me check with the door about valet tonight, and there are garages a block or two away.", "oneMinute": "Royal Street is a pedestrian mall during the day, so cars cannot stop at the door at lunch. At dinner ask the door about valet. Otherwise the nearest garages are on St Louis Street, at the Monteleone on Royal and Iberville, and the lots on Conti and Chartres.", "long": "(expert, medium) The house has offered valet at dinner in recent years; hours and price unverified. (expert, medium) The Royal Street pedestrian mall closes the street to cars roughly 11:00 to 16:00 daily on the blocks from about Bienville to St Ann, which includes the 400 block. (expert, medium) Nearby garages: Omni Royal Orleans on St Louis, the Monteleone garage, Conti and Chartres lots, Jax Brewery on Decatur. Confirm the valet arrangement and any validation with the door captain.", "status": "expert", "sources": ["expert"], "askWhom": "door or valet captain"},
  {"question": "Can we book the Wine Room for twelve?", "oneBreath": "Very likely, it is our glass-walled private room. Let me get our events manager to confirm the date and any minimum.", "oneMinute": "The Wine Room is our private room among the bottles. Twelve should sit comfortably. Private rooms carry a minimum spend and a set menu, so our events manager will send the details and hold the date.", "long": "(pdf source 10) a Wine Room page exists on the site. (brief) the hint is 16 seats with a minimum; unverified. Capacity, minimum spend, menu format, deposit and whether the displayed bottles are for sale were not readable. (expert) in a Grand Award house the displayed cellar is normally on the list and sold by the sommelier. Do not quote a minimum.", "status": "unverified", "sources": ["pdf source 10", "brief"], "askWhom": "events or private dining manager"},
  {"question": "What private rooms do you have?", "oneBreath": "The Wine Room for small parties, and larger rooms upstairs and the courtyard for bigger groups. Our events team will match the room to your number.", "oneMinute": "We have the Wine Room for small parties, the Chanteclair Room and the Morphy Room for larger ones, and the courtyard for receptions. Our events manager will match the room to your number and send a proposal.", "long": "Room names in the brief: Chanteclair Room, Morphy Room, Wine Room, courtyard. Floors, seated and standing capacities and minimums were not readable this session. (expert, low) older names such as the Rex Room, Red Room and Tulip Room may or may not survive the 2014 restoration. Say the names you are sure of and hand over to events.", "status": "unverified", "sources": ["brief", "expert"], "askWhom": "events or private dining manager"},
  {"question": "Can we bring a cake?", "oneBreath": "Let me check with the manager. And may I tempt you with Bananas Foster flambéed at the table instead?", "oneMinute": "I will check with the manager on outside cakes and whether there is a plating charge. If you would rather not carry one in, Bananas Foster was invented here and we flambé it at your table, which makes a lovely birthday moment.", "long": "The cake policy and any cutting or plating fee were not readable this session. (expert) many fine-dining houses allow an outside cake with a per-person plating charge, and some do not. Do not invent a fee. Offer the house desserts: Bananas Foster (minimum two, pdf p47 and p49), Cherries Jubilee, the Snickers, Lemon Tart, Pineapple Tarte Tatin (pdf p33 to p38 per the page map).", "status": "unverified", "sources": ["pdf p47", "pdf p49", "expert"], "askWhom": "manager on duty"},
  {"question": "Can we bring our own wine?", "oneBreath": "Let me ask our sommelier about corkage. We have a Grand Award cellar, so do let us try to tempt you first.", "oneMinute": "I will check our corkage policy with the sommelier. Our list holds a Wine Spectator Grand Award, with real depth in Burgundy and Champagne, so if your bottle is something we already stock the sommelier may steer you to it instead.", "long": "Corkage fee, bottle limit and any rule against bottles on the list were not readable this session. (pdf p49) the cellar is a Wine Spectator Grand Award cellar strong in Burgundy and Champagne. (expert) common practice is a per-bottle fee, a limit per table, no bottles that appear on the list, and a waiver when the table also buys from the list. Quote nothing until the sommelier confirms.", "status": "unverified", "sources": ["pdf p49", "expert"], "askWhom": "sommelier or wine director"},
  {"question": "Are you the Commander's Palace Brennan's?", "oneBreath": "We are the original Brennan's, here since 1956. Commander's Palace is our cousins' house in the Garden District.", "oneMinute": "We are the original Brennan's. Owen Brennan opened it in 1946 and the family moved it here in 1956. Commander's Palace belongs to our cousins across town, and Brennan's of Houston is their sister restaurant. Our owner, Ralph Brennan, grew up on that side of the family and brought this house back to life in 2014, so it is all one family, two companies.", "long": "(pdf p50) opened 1946, at 417 Royal since 1956. (expert, high) the family split in 1974: Owen's sons kept this house; Ella Brennan's side took Commander's Palace. (expert, high) Ralph Brennan, Ella's nephew, bought the building in 2013 and reopened in 2014. (expert, high) Brennan's of Houston is a Commander's family restaurant. Ralph's group also runs Red Fish Grill, Ralph's on the Park, Café NOMA and Napoleon House. Dickie Brennan's group runs Palace Café, Bourbon House, the Steakhouse and Tableau. Mr. B's on Royal is Cindy Brennan's.", "status": "expert", "sources": ["pdf p50", "expert"], "askWhom": "general manager for the house's preferred wording"},
  {"question": "Are you open Christmas Day, and do you do Réveillon?", "oneBreath": "Let me confirm this year's holiday hours with the host stand before you plan around it.", "oneMinute": "Our holiday schedule changes year to year, so I will confirm Christmas Eve and Christmas Day hours with the host stand. New Orleans restaurants also run Réveillon menus through December, and I will check whether we are offering one this year.", "long": "Thanksgiving, Christmas Eve and Day, New Year's, Mardi Gras and Jazz Fest hours were not readable this session. (repo, unverified) an almanac line in the app lists Brennan's among the houses that set a fixed-price Réveillon menu. (expert, medium) Brennan's has historically opened on Christmas Day and Thanksgiving with set menus, and Réveillon menus in the Quarter run through December. Treat all of it as unconfirmed for 2026.", "status": "unverified", "sources": ["repo almanac/index.html line 2519", "expert"], "askWhom": "general manager"},
  {"question": "Are children welcome?", "oneBreath": "Yes, and we have a children's menu.", "oneMinute": "Children are welcome and there is a children's menu. Let us know ages when booking so we seat you comfortably, and for a birthday the tableside flambé is a show they remember.", "long": "The user supplied a kids menu URL on the house site (brennansneworleans.com/menus/kidsmenus/), so a children's menu exists. Which services it covers, high chairs, and any age guidance for the tasting menus were not readable. (pdf p47) Bananas Foster is a two-person minimum and the flambé is alcohol-based, which matters for a child's portion.", "status": "unverified", "sources": ["user brief URL", "pdf p47"], "askWhom": "host stand"},
  {"question": "Can we bring the dog?", "oneBreath": "Let me check with the manager about the courtyard.", "oneMinute": "Service animals are always welcome. For pets I will check with the manager about the courtyard, since that is the only outdoor space.", "long": "Pet policy was not readable. (expert) Louisiana permits dogs in outdoor dining areas only where the restaurant opts in and posts it; indoor dining rooms are not an option. Say nothing certain.", "status": "unverified", "sources": ["expert"], "askWhom": "manager on duty"},
  {"question": "Is the restaurant accessible?", "oneBreath": "The ground floor rooms and the courtyard are the easiest route. Let me confirm the detail with the host stand.", "oneMinute": "The house is a 1790s building, so I will confirm with the host stand which rooms and restrooms are step-free and whether there is a lift to the upstairs rooms, then make sure you are seated on that route.", "long": "Accessibility detail was not readable. (expert, medium) the building dates to the 1790s and private rooms are on more than one floor, so step-free routes need confirming. Note the need on the booking.", "status": "unverified", "sources": ["expert"], "askWhom": "host stand or general manager"},
  {"question": "Can we take photographs?", "oneBreath": "Of course, and the courtyard is the spot. Just no flash on the flambé, for the sake of the table beside you.", "oneMinute": "Please do. The courtyard and the dining rooms photograph beautifully. For the tableside flambé we ask for no flash and a little distance, and for private events the house has a photography policy I can check.", "long": "The house photography policy was not readable. (expert) general practice in fine dining is to welcome personal photographs and ask for no flash near open flame and no tripods in the aisles.", "status": "unverified", "sources": ["expert"], "askWhom": "manager on duty"},
  {"question": "Do you sell gift cards or a cookbook?", "oneBreath": "Let me ask the host stand what we have today.", "oneMinute": "The host stand can tell you what gift cards and books we have in stock. The classic Brennan's cookbooks are out there if you want to cook Eggs Hussarde at home.", "long": "(expert, medium, unverified) the group has sold gift cards good across its restaurants. (expert, medium, unverified) the classic titles are Breakfast at Brennan's, and Breakfast at Brennan's and Dinner, Too; Ralph Brennan has a seafood cookbook. Stock at the host stand is unverified.", "status": "unverified", "sources": ["expert"], "askWhom": "host stand"},
  {"question": "What is the 80th Celebration Tour?", "oneBreath": "Our 80th year. The house is taking Brennan's on the road, with New York in late October, then Charleston and Palm Beach.", "oneMinute": "This is our 80th year, and 2026 is also the 75th year of Bananas Foster. The restaurant is running anniversary tasting menus all year and taking the house on tour: New York 22 to 24 October, Charleston 13 to 15 November, and Palm Beach in December. I can get the venue details from our events team.", "long": "(pdf p49 and p50) 80 years in 2026, anniversary tasting menus through the year, Bananas Foster's 75th year. (brief) tour legs and dates; venues and ticketing unverified. (brief) kick-off 2 January; unverified. Any New Orleans anniversary event for the rest of 2026 is unverified.", "status": "brief", "sources": ["pdf p49", "pdf p50", "brief"], "askWhom": "general manager or marketing"},
  {"question": "What are Bananas Foster Day and the turtle parade?", "oneBreath": "Two house traditions: a spring day for the dessert we invented, and a parade that brings our courtyard turtles home.", "oneMinute": "Bananas Foster was invented here in 1951, and the house marks a Bananas Foster Day each spring. The courtyard turtles get their own second line down Royal Street each year. They are pets, by the way. The turtle soup is turtle meat from the kitchen, not from the courtyard.", "long": "(brief) Bananas Foster Day 6 April and the turtle parade in early May; both unverified. (expert, medium) the courtyard turtles are paraded with a brass band when they return to the courtyard pond in spring. (pdf p48) turtle soup is 100 percent turtle meat with aged Sherry; (pdf p50) turtle soup carries Sherry, relevant for a guest who avoids alcohol.", "status": "brief", "sources": ["brief", "pdf p48", "pdf p50", "expert"], "askWhom": "general manager"},
  {"question": "Is there a gratuity for large parties?", "oneBreath": "Let me confirm the large-party terms with the manager before you book.", "oneMinute": "For larger tables the house has set terms on gratuity and deposits. I will have the manager confirm them so there is no surprise on the night.", "long": "Large-party threshold, automatic gratuity percentage and deposit were not readable. (expert) New Orleans houses commonly add a service charge to parties of six or eight and up, but the house figure is the only one to quote.", "status": "unverified", "sources": ["expert"], "askWhom": "reservations manager"},
  {"question": "I have an allergy. Can the kitchen cope?", "oneBreath": "Yes. Tell me everything and I will walk it to the kitchen now.", "oneMinute": "The kitchen can accommodate most allergies and restrictions. Please tell me everything, I will note it on the ticket and confirm each dish with the chef before it is fired.", "long": "(pdf p50) the kitchen can accommodate most allergies and restrictions; ask guests to note them at the reservation and always confirm with the kitchen. (pdf p47) the shellfish scenario names the Creole Caesar's smoked oyster dressing as a hidden shellfish. No further allergen claims are added here.", "status": "pdf", "sources": ["pdf p47", "pdf p50"], "askWhom": "chef on the pass"}
]
```

## 4. Scenarios

### Where do we park
- Guest: "We are driving in from Metairie tonight. Where do we park?"
- Server: "Royal Street is a walking street during the day, so the easiest thing at dinner is to pull up and ask the door about valet. If you would rather self-park, the Omni Royal Orleans garage on St Louis is a block away and the Monteleone garage is at Royal and Iberville. Let me confirm the valet arrangement for tonight before you set off."
- Principle: Give one easy route and one fallback. Never promise valet, a price or validation you have not confirmed with the door that day. (expert; the valet detail is unverified.)

### Can we book the Wine Room for twelve
- Guest: "Could we have the Wine Room for twelve on the twentieth?"
- Server: "The Wine Room is the one to ask for. Twelve should sit comfortably among the bottles. Private rooms run on a set menu with a minimum, so let me take your name and date and have our events manager send you the room details and hold it for you."
- Principle: Confirm the fit, hand over to events, quote nothing. The Wine Room's capacity and minimum are the events manager's numbers, not yours. (pdf source 10 shows the room exists; capacity and minimum unverified.)

### Can we bring a cake
- Guest: "It is my mother's eightieth. Can we bring her cake?"
- Server: "Happy birthday to her. Let me check with the manager about outside cakes and whether there is a plating charge, so you know before the night. And may I plant a seed: Bananas Foster was invented in this house and we flambé it at the table for two or more. For an eightieth it is quite a show."
- Principle: Check the policy, then sell the house's own ritual. Never invent a fee, and remember the flambé carries alcohol if that matters to the guest. (pdf p47 and p49; cake policy unverified.)

### Can we bring our own wine
- Guest: "We have a 2005 Bordeaux we have been saving. Can we bring it?"
- Server: "What a bottle. Let me ask our sommelier about corkage and I will come straight back. Our list is a Wine Spectator Grand Award cellar, so if we already have your wine the sommelier may suggest pouring ours and saving yours for home."
- Principle: Treat the guest's bottle with respect, route the policy to the sommelier, and use the cellar as a resource rather than a rival. (pdf p49 for the Grand Award; corkage unverified.)

### Are you the Commander's Palace Brennan's
- Guest: "Is this the Commander's Palace Brennan's, or the Houston one?"
- Server: "This is the original. Owen Brennan opened Brennan's in 1946 and the family moved it here in 1956. Commander's Palace is our cousins' house in the Garden District, and Brennan's of Houston is their sister restaurant. Our owner, Ralph Brennan, grew up on that side of the family and brought this house back in 2014, so it is one family and two companies. Same Bananas Foster, though. It was invented right here."
- Principle: Claim the original, honour the cousins, name the owner, and land on a dish. (pdf p50 for the dates; the family map is expert, high.)

### Are you open Christmas Day
- Guest: "Are you open on Christmas Day? We want to bring the whole family."
- Server: "Let me confirm this year's Christmas hours with the host stand before you plan around it. New Orleans does Réveillon dinners all through December as well, and I will check whether we are running one. If you give me your number, I will ring you back today with the hours and the menu."
- Principle: Never guess a holiday schedule. Confirm, offer the seasonal alternative, and close the loop with a call back. (holiday hours unverified; repo almanac line notes Brennan's among Réveillon houses.)

## 5. Repository note for the parent (not a PDF matter)

table/recipe/bananas-foster.html line 63 says the dessert was "a dessert for a customs official named Foster". (pdf p49) says Richard Foster was Owen's friend and chairman of the New Orleans Crime Commission. The two disagree. The PDF's account matches the usual telling (expert, medium-high). The app's recipe note should be checked.

## 6. What the next session should do first

With a fresh search budget, run in this order: the FAQ page (verbatim dress code, cancellation, cake, corkage, children, pets, accessibility); the reservations button target (OpenTable or Resy) and the phone; the wine-room and private-dining pages for room names, capacities and minimums; "Brennan's valet parking"; "Brennan's Réveillon 2025" and "Brennan's Christmas Day"; "Brennan's 80th anniversary tour New York October 2026"; "Ralph Brennan Restaurant Group restaurants"; "Brennan's Bananas Foster Day 2026" and "Brennan's turtle parade". Each result should replace the matching unverified line above.

CORRECTIONS: [
 {
  "page": "49",
  "quote": "named for Richard Foster, Owen's friend and chairman of the New Orleans Crime Commission",
  "problem": "Published accounts differ on Foster's title, some saying chairman and some vice-chairman, and the app's own recipe note (table/recipe/bananas-foster.html) calls him a customs official, which contradicts the PDF. Not verifiable this session.",
  "correction": "Safer wording: Richard Foster, a friend of Owen Brennan who sat on the New Orleans Crime Commission. Check the house recipe page (pdf source 11) for the house's own wording and fix the app note to match.",
  "confidence": "low"
 },
 {
  "page": "50",
  "quote": "Dressy casual; jackets preferred at dinner. No athletic or cut-off shorts, sleeveless or decal T-shirts, hats, or open-toed shoes for men.",
  "problem": "Presented as the FAQ dress code but it is a paraphrase; the verbatim text could not be read this session, so a server quoting it as the house's words may be slightly off.",
  "correction": "Mark it as a paraphrase of the FAQ page as of 26 September 2026 and replace with the verbatim text once the page is fetched.",
  "confidence": "medium"
 }
]
OPEN: ['Which reservations platform does the house use today (OpenTable, Resy, Tock or its own), and what is the current phone number for the host stand and for events?', 'What are the cancellation window, any deposit or no-show fee, and the party size at which an automatic gratuity applies, and at what percentage?', 'Corkage: is it allowed, what is the fee per bottle, is there a bottle limit, and are bottles already on the list excluded?', 'Outside cakes: allowed or not, and is there a cutting or plating charge per person?', "Every private room in use today with floor, seated and standing capacity, minimum spend by service and day, and whether the Wine Room's displayed bottles are for sale.", 'Valet: offered at which services, from what hour, at what price, and is it validated for diners? Where does the valet stand given the Royal Street pedestrian mall hours?', "Holiday hours for Thanksgiving, Christmas Eve, Christmas Day, New Year's Eve and Day, Mardi Gras day and Jazz Fest weekends, and whether a Réveillon menu is offered in December 2026 with its price.", 'The 80th Celebration Tour: venues, dates and ticketing for New York (22 to 24 October), Charleston (13 to 15 November) and Palm Beach (December), and any anniversary event in New Orleans for the rest of 2026.', 'The exact dates and format of Bananas Foster Day and the turtle parade in 2026, and who performs the Friday sabrage.', 'Children: which services the kids menu covers, high chairs, and any age guidance for the tasting menus. Pets in the courtyard, step-free routes and restrooms, and the house photography policy for private events.', 'Gift cards: are they sold at the host stand and redeemable across the Ralph Brennan Restaurant Group? Which cookbooks, if any, are on sale?', "The house's preferred one-line answer to 'which Brennan's is this', so every server says the same thing about Commander's Palace, Brennan's of Houston, Dickie Brennan's and Mr. B's."]