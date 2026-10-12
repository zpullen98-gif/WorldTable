# Respellings reconciled, 12 October 2026: the Floor Deck and the Brennan's pack

The World Table's Floor Deck and the Brennan's house pack each carry a respelling for the same words, and sixteen of them disagreed (fourteen in their letters, two only in where the capitals sat). A server studying the Floor Deck card for hollandaise and the Brennan's card for Eggs Hussarde saw two spellings of one sound. This note records one respelling per word, the rule that chose it, and the source for each. The Floor Deck lives in tools/derive/floor-deck/*.mjs (built into src/lib/data/floor-deck.json by tools/build-data.mjs); the pack's respellings live in brennans/overrides.json and brennans/components/*.json.

## The rule, in order

1. **The house's printed word wins.** Brennan's server guide prints a Menu words table (guide.txt, page 50 of 51, "Term / Say it / To a guest") and a few say lines in the dish cards. Where the guide prints a respelling, that is how the floor at Brennan's says it, and both the Floor Deck and the pack carry it.
2. **A Louisiana word takes its Louisiana form.** The New Orleans dining room is the American dining room these words live in.
3. **A sourced correction stands.** Where the research records a specific error to avoid, the correction is kept.
4. **Otherwise, the Floor Deck's rule:** how an American dining room says it, in ASCII, one stressed syllable per word in capitals, checked against an American dictionary (Merriam-Webster first, Oxford's American entries second). Not the native pronunciation.

The pack may keep a short "also heard" note in brackets after its primary respelling; the Floor Deck's format carries the primary alone.

## The decisions

| Word | Floor Deck before | Pack before | Both now | Rule and source |
|---|---|---|---|---|
| Hollandaise | HAH-luhn-dayz | HOL-un-dayz | HOL-un-dayz | 1: the guide's Menu words, p50, "Hollandaise HOL-un-dayz" |
| Mignonette | min-yuh-NET | meen-yo-NET (min-yuh-NET is also accepted) | min-yo-NET | 1: the guide's Menu words, p50, "Mignonette min-yo-NET". The pack's French long ee rested on pdf-corrections p50, marked low; it stays as an also-heard note |
| Bottarga | boh-TAR-guh | boh-TAR-gah | boh-TAR-gah | 1: the guide's Menu words, p50, and the dish card, "Bottarga is boh-TAR-gah" |
| Tasso | TAH-soh | TAH-so (TASS-oh is also heard; confirm the house habit) | TAH-so | 1: the guide's Menu words, p50, and the Shrimp and Grits card, "Tasso is TAH-so" |
| Andouille | an-DOO-ee | ahn-DOO-ee | ahn-DOO-ee | 2: gap-fill-5 (gap5-k30, verdict right) and dossier-the-kitchen, "andouille ahn-DOO-ee (Louisiana)" |
| Banyuls | bahn-YOOLZ | bahn-YOOLS | bahn-YOOLS | 3: the cellar research's house note, "Banyuls is one of the few French names whose final s is sounded: bahn-YOOLS ... Dropping the s is the common error"; the s is unvoiced |
| Rémoulade | REM-uh-lahd | ray-moo-LAHD | REM-uh-lahd | 2 and 4: New Orleans stresses the first syllable (gumbopages.com/food/app/remoulade.html: locals tend to say "RUM-a-lawd" rather than the classical French); the pack's French stress on the last syllable is not how the city says it. RUM-uh-lahd is kept as the pack's also-heard note |
| Bordelaise | bor-duh-LAYZ | bor-duh-LEZ | bor-duh-LAYZ | 4: Merriam-Webster, bordelaise sauce, ˈbȯr-də-ˈlāz; and the guide's own -aise endings (Béarnaise bair-NAYZ, Hollandaise HOL-un-dayz, p50) |
| Mascarpone | mas-kar-POH-nay | mahs-kar-POH-neh | mas-kar-POH-nay | 4: Merriam-Webster, ˌma-skär-ˈpō-(ˌ)nā; four syllables either way, as the kitchen dossier insists |
| Burrata | boo-RAH-tuh | boo-RAH-tah | boo-RAH-tuh | 4: Merriam-Webster, bu̇-ˈrä-tə; Dictionary.com, boo-rah-tuh |
| Shiitake | shih-TAH-kee | shee-TAH-keh | shee-TAH-kee | 4: Merriam-Webster, shē-ˈtä-kē. Neither form before matched the dictionary: the Floor Deck's first vowel was short, the pack's last vowel Japanese |
| Harissa | huh-REE-suh | hah-REE-sah | huh-REE-suh | 4: Oxford Learner's Dictionaries (American English), /həˈriːsə/ first; Merriam-Webster gives hə-ˈri-sə, the same reduced first vowel |
| Bavarois | bah-vahr-WAH | bav-ar-WAH | bah-vahr-WAH | 4: the same French sounds in two notations; bah and vahr are how both files write a French a elsewhere (frahm-BWAHZ, bahn-YOOLS) |

| Crème fraîche | KREM FRESH | krem FRESH | krem FRESH | Stress only: a French phrase carries its stress on the last word, and the Floor Deck's own rule (one stressed syllable per word at most, at least one in the respelling) allows the pack's form |
| Beurre blanc | BURR BLAHN | burr BLAHN | burr BLAHN | Stress only, as for crème fraîche. The guide prints burr BLAHNK (p50); the sounded k was corrected in the pack earlier (pdf-corrections) and stays corrected |

Not a disagreement: the Floor Deck's Middlins (MID-linz) and the pack's Rice grits ("As it reads: rice grits.") are different words joined by an alias; both stand.

## What changed

- Floor Deck: nine cards (andouille, tasso, bottarga, shiitake, hollandaise, mignonette, Banyuls, crème fraîche, beurre blanc).
- Pack: the term and component respellings and every card line that repeats them (mignonette, rémoulade, bordelaise, mascarpone, burrata, shiitake, harissa, bavarois), including the shiitake explanation that told servers to avoid the dictionary form.
- The Cuisine tab, written next, takes the pack's respelling for every word the pack carries, so it inherits these.
