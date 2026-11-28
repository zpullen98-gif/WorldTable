# The paste of 28 November 2026 held against the live wine list

The owner's worry, on the day he pasted the list: that the paste had been cut off and bottles were missing.
It was not. The list as the restaurant publishes it was fetched the same day and compared with the paste
token by token: 14,524 tokens each, 0 differences.

## What was compared

* The paste: `pages/binwise-wine-list-2026-11-28.txt`, the owner's message saved verbatim below its two
  provenance lines (sha256 837b72848d8f21ce6aa04bbdb02e42714f0ab092506c3688785a5bae196aac30). It was not
  edited for this check and is not edited by it.
* The live list: the restaurant's wine menu page embeds the Binwise list
  (hub.binwise.com/restaurant/brennans-new-orleans/list/wine-list.html). The page and the embedded list were
  fetched on 28 November 2026 at 06:50 UTC (the embedded list is 5,716,193 bytes of HTML, sha256
  49399be59a9b66e8bb2839076ecafcd6eedfb44f17aa925dae2e2a046f6d8bcf).

The first provenance line of the paste says the page could not be fetched from this environment. That was
true when the paste was saved, in the first hours of the day; the fetch succeeded later the same morning,
and this note is the record of it. The paste file is evidence as filed and keeps its line.

## How

1. The saved HTML was opened from disk in a headless browser with scripts off and every network request
   refused, and the text of the page body was written out as the reader sees it (235,022 characters).
2. Both texts were split into lines; in each line a no-break space became a space, runs of spaces and tabs
   became one space, and the ends were trimmed; empty lines were dropped. What is left is one token per
   printed line: a section heading, a bin, a wine, a vintage or a price.
3. The live text opens with a table of contents that the paste does not carry, so the live tokens were read
   from the second "By the Glass", where the list itself begins. The paste was read from its third line,
   after the two provenance lines.
4. The two sequences were walked side by side, token against token, with a look ahead of sixty tokens to
   name anything present on one side only.

## The result

* Live: 14,524 tokens. Paste: 14,524 tokens.
* Differences: 0. No token is on one side only, none differs, and neither sequence has a tail the other
  lacks. The first entry (the house Champagne by the glass) and the last (the 1980 Port at bin 19322) are the
  same on both.
* The catalogue read from the paste, `research/winelist-2026-11-28.json`, holds 3,560 entries: the seventeen
  pours by the glass and every bottle. Counted a second way without the parser, the paste gives 3,560
  entries by the entry pattern and 3,560 by the lines that close an entry.

So the paste is the whole list as published on 28 November 2026: nothing was cut off. The 58 bottles and the
two glass pours that the list of 3 October 2026 printed and this one does not are gone from the published
list itself, not lost in the paste; they are the past rows of the shipped list.

## What this does not say

The check holds the paste to the published page at one moment. It does not say a bottle is in the cellar
tonight, and the list can change the next day. The next paste is carried forward by its own catalogue and
ledger (`tools/house/carry-winelist.mjs`).

The fetched files and the two small scripts that made the comparison were working files of the session and
are not in the repository; the figures above are what they gave, run twice with the same result.
