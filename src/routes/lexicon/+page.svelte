<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { fold } from '$lib/filter';
	import { session } from '$lib/stores/session.svelte';
	import { repertoire, dueList, scopeToSlugs, TERM_LADDER_DAYS } from '$lib/repertoire';
	import { nextTarget, optionsForTerm, gradeForQuiz, QUIZ_LENGTH } from '$lib/lexicon-quiz';
	import { markStudied } from '$lib/oot-studied';
	import { deckHits, cardsForLexicon } from '$lib/deck-search';
	import { deckHref } from '$lib/floor-deck-core.mjs';

	let { data } = $props();

	let q = $state('');
	let category = $state<string | null>(null);

	/* localeCompare, not a bare .sort(). The project pins collation everywhere it
	   matters (build-data.mjs does it for techniques and stations with a comment
	   warning that a codepoint sort reorders them), and this list was the one
	   place still sorting by codepoint. It did not show while every category
	   began with an ASCII capital; the atlases added below are the same shape,
	   but the rule should not depend on that staying true. */
	const categories = $derived(
		[...new Set(data.lexicon.map((e) => e.category))].sort((a, b) => a.localeCompare(b, 'en'))
	);

	/* [9,10,11,12,1,2] is a database row; "September to February" is what a cook
	   reads. The stored order IS reading order and must never be sorted: a
	   winter crop wraps the year end on purpose, and sorting it would print
	   "January to December" for a vegetable that is out of season all summer.
	   A run that is not contiguous is listed rather than ranged, because
	   "April to May, September to October" is two seasons and saying "April to
	   October" about it would be a lie. */
	const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];
	function seasonLabel(months: number[]): string {
		if (!months.length) return 'Year round';
		const runs: number[][] = [];
		for (const m of months) {
			const last = runs[runs.length - 1];
			if (last && ((last[last.length - 1] % 12) + 1) === m) last.push(m);
			else runs.push([m]);
		}
		return runs
			.map((r) => (r.length === 1 ? MONTHS[r[0] - 1] : `${MONTHS[r[0] - 1]} to ${MONTHS[r[r.length - 1] - 1]}`))
			.join(', ');
	}

	/**
	 * The L2506 bug, structurally impossible here.
	 *
	 * The original bound `lexQ.addEventListener('input', renderLex)` to the FIRST
	 * definition of renderLex; the enhanced version at L2839, the one that draws
	 * the recipe cross-links, only ever ran on the initial paint. So the moment
	 * you typed a character, every cross-link vanished.
	 *
	 * `$derived` recomputes from state. There is no function reference held by a
	 * listener, so there is nothing that can go stale. Do not "fix" this again.
	 */
	/**
	 * The haystack is built once per entry and memoised, the way the recipe grid
	 * does it in filter.ts. It was being rebuilt on every keystroke: three
	 * template strings and a fold() over 779 entries, ~600 KB of prose folded
	 * per character typed. The WeakMap is keyed on the entry object, which is
	 * stable because data.lexicon is loaded once.
	 *
	 * The atlas fields are in the haystack deliberately. A cook who searches
	 * "remoulade" should find Celeriac, and "for a crab boil" should find the
	 * thing you put in one: those answers live in `methods` and `prep`, not in
	 * the definition, and leaving them out makes the new entries less findable
	 * than the old ones.
	 */
	const haystacks = new WeakMap<Entry, string>();
	function haystack(e: Entry): string {
		let h = haystacks.get(e);
		if (h === undefined) {
			h = fold(
				`${e.term} ${e.category} ${e.definition} ${e.choose ?? ''} ${e.store ?? ''} ${e.prep ?? ''} ${(e.methods ?? []).join(' ')}`
			);
			haystacks.set(e, h);
		}
		return h;
	}

	const shown = $derived.by(() => {
		const needle = fold(q).trim();
		return data.lexicon.filter((e) => {
			if (category && e.category !== category) return false;
			if (!needle) return true;
			return haystack(e).includes(needle);
		});
	});

	/**
	 * GROUPING, which is what makes 779 cards navigable.
	 *
	 * The page was one flat run in source order: the 479 archive terms in the
	 * order they were sliced out, then everything authored since appended in a
	 * block. Categories were already ALMOST contiguous, so it looked ordered
	 * without being so, and "Techniques: Heat & Precision" was split into a run
	 * of 23 and a run of 5 with nothing on screen to say why. 210,000px of that
	 * is not a reference, it is a scroll.
	 *
	 * Sorted by category and then by term, both with localeCompare, because 27
	 * of these terms carry accents and a codepoint sort files Comte after Zest.
	 *
	 * A leading "The " is dropped for sorting only, so The Vegetable Atlas files
	 * under V beside Vegetables & Produce, and The Fruit Atlas under F. Shelving
	 * every atlas under T would separate each one from the subject it is about,
	 * which is the whole reason a reader is looking for it.
	 */
	const sortKey = (c: string) => c.replace(/^The\s+/i, '');
	const catId = (c: string) =>
		'cat-' + sortKey(c).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

	const groups = $derived.by(() => {
		const byCat = new Map<string, Entry[]>();
		for (const e of shown) {
			const g = byCat.get(e.category);
			if (g) g.push(e);
			else byCat.set(e.category, [e]);
		}
		return [...byCat.entries()]
			.map(([name, entries]) => ({
				name,
				id: catId(name),
				entries: [...entries].sort((a, b) => a.term.localeCompare(b.term, 'en'))
			}))
			.sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), 'en'));
	});

	/**
	 * The Floor Deck, found from here. The deck is the home of a floor term and
	 * this page links to it both ways, so a search the Lexicon files under
	 * another name ("king trumpet" is King Oyster Mushroom here) still lands.
	 *
	 * Its own thin haystack in deck-search.ts, NOT `haystack()` above: the rows
	 * below are links, never a .lexcard, so every count a regression pins
	 * (brisket shows six entries, porterhouse one) is what it was. Only while
	 * the box holds text: with it empty the deck has a door of its own.
	 */
	const floor = $derived(deckHits(data.deckIndex, q));

	/* The directory is an orientation device, and it is only orienting when the
	   whole corpus is on screen. Once a search or a category filter has cut the
	   page down, it would list categories the reader has already left. */
	const showDirectory = $derived(!q.trim() && !category);

	/* ---- flashcards ----
	 * The deck snapshots the ENTRIES, not indices into `shown`. `shown` is a
	 * live derivation over the search box: with indices, shuffling and then
	 * typing a character makes every index dangle or point at the wrong term.
	 * A snapshot also matches how study decks behave physically: narrowing the
	 * search mid-drill shouldn't reshuffle the cards in your hand.
	 */
	let deck = $state<typeof data.lexicon>([]);
	let pos = $state(0);
	let revealed = $state(false);

	function shuffle() {
		const cards = [...shown];
		for (let i = cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[cards[i], cards[j]] = [cards[j], cards[i]];
		}
		deck = cards;
		pos = 0;
		revealed = false;
	}
	const card = $derived(deck.length ? deck[pos % deck.length] : null);

	/* ---- quiz ----
	 * Ported from qzAsk (L3082): ten questions a round, distractors drawn from
	 * the SAME category when it has enough terms: telling hanger from flank is
	 * the actual skill; telling hanger from crème anglaise is a giveaway.
	 */
	type Entry = (typeof data.lexicon)[number];
	interface Question {
		target: Entry;
		options: Entry[];
	}

	let quiz = $state<Question | null>(null);
	let picked = $state<Entry | null>(null);
	let qNum = $state(0);
	let right = $state(0);
	let verdict = $state('');

	/*
	 * The terms this page is behind on.
	 *
	 * Scoped to lexicon slugs: drillLog is one un-namespaced pool shared with
	 * the service drill and with practise/firing's `drill-firing-order`
	 * sentinel, so an unscoped fold would count things this page cannot ask.
	 * See scopeToSlugs in repertoire.ts for the rule.
	 */
	const lexSlugs = $derived(new Set(data.lexicon.map((e) => e.slug)));
	const dueTerms = $derived.by(() => {
		const now = Date.now();
		return dueList(
			repertoire(scopeToSlugs(session.drillLog, lexSlugs), now, TERM_LADDER_DAYS),
			now
		).map((e) => e.slug);
	});

	/*
	 * One entry per TERM per round, not one per question.
	 *
	 * A round drawn from a narrow filter asks the same term more than once - a
	 * five-term category cannot field ten distinct questions - and before
	 * anything was recorded that cost nothing. Now that every answer writes to
	 * a ladder, three answers on one term in one sitting must not be three
	 * pieces of evidence.
	 */
	let recorded = new Set<string>();

	function ask() {
		// POOL is what gets asked: the current filter, so the quiz still asks
		// what you are studying. The >= 4 floor is now only a pool floor - it
		// stopped being the termination guard when the rejection loop went.
		// FIELD is always the whole lexicon; see lexicon-quiz.ts.
		const pool = shown.length >= 4 ? shown : data.lexicon;
		const target = nextTarget(pool, dueTerms, asked, Math.random);
		if (!target) return;
		asked.add(target.slug);
		quiz = optionsForTerm(target, data.lexicon, Math.random);
		picked = null;
	}

	/** The slugs this round has already put in front of the cook. */
	let asked = new Set<string>();

	function startQuiz() {
		deck = [];
		qNum = 0;
		right = 0;
		verdict = '';
		asked = new Set();
		recorded = new Set();
		ask();
	}

	function answer(o: Entry) {
		if (picked) return; // already answered
		picked = o;
		const correct = o.slug === quiz!.target.slug;
		if (correct) right++;
		/*
		 * Recorded BEFORE anything advances, the rule service/drill states at
		 * its own markDrilled call: a cook who closes the tab mid-round keeps
		 * the answers they gave.
		 *
		 * `close`, never `met`, even when right - the quiz shows the definition
		 * raw and 307 of 479 of them (64.1%) name their own term inside the
		 * first 180 characters. On the ladder `close` holds rather than
		 * promotes, so only the redacted service drill can climb a term.
		 */
		if (!recorded.has(quiz!.target.slug)) {
			recorded.add(quiz!.target.slug);
			session.markDrilled(quiz!.target.slug, gradeForQuiz(correct));
		}
		qNum++;
	}

	function nextQuestion() {
		if (qNum >= QUIZ_LENGTH) {
			// The original's verdict ladder, verbatim.
			verdict =
				right >= 9
					? 'Chef-level. The pass is yours.'
					: right >= 7
						? 'Solid line cook: a few more services and it’s muscle memory.'
						: right >= 5
							? 'Stage complete: hit the flashcards on what you missed.'
							: 'Back to prep, chef: filter the category and study before the next round.';
			// Contract with the OOT monorepo's shared/oot-log.js (hookTable).
			if (typeof window !== 'undefined')
				window.dispatchEvent(
					new CustomEvent('oot:round-complete', {
						detail: { kind: 'quiz', right, of: QUIZ_LENGTH }
					})
				);
			// A finished round is a day studied, product-wide (lib/oot-studied.ts).
			markStudied();
			quiz = null;
			return;
		}
		ask();
	}
</script>

<svelte:head><title>The Chef’s Lexicon · The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1 id="top">The Chef’s Lexicon</h1>
		<p class="lede">
			A working culinary dictionary for the climb from cook to chef to restaurateur: cuts and how
			to treat them, the fish counter decoded, every technique from a proper sear to sous vide,
			pastry science, and the language of the professional kitchen.
		</p>
	</header>

	<div class="tools" data-print="hide">
		<div class="search">
			<input
				bind:value={q}
				type="search"
				placeholder="Search a term: try “hanger”, “maillard”, or “86”"
				aria-label="Search the lexicon"
			/>
		</div>
		<select bind:value={category} class="chip" aria-label="Filter by category">
			<option value={null}>All categories</option>
			{#each categories as c (c)}<option value={c}>{c}</option>{/each}
		</select>
		<button class="chip" onclick={shuffle}>Study mode ▸ flashcards</button>
		<button class="chip" onclick={startQuiz}>Quiz me ▸ multiple choice</button>
		<span class="count">{shown.length} of {data.lexicon.length} terms</span>
		<!--
			Its own noun, deliberately. The mode bar's Practise pill counts DISHES
			from cookedLog and must keep meaning that; this counts TERMS and says
			so. Not .def, .flash or .lexcard: those three are a published paywall
			contract keyed to the tier attribute, held by src/lib/navigation.test.ts.
		-->
		{#if dueTerms.length}
			<span class="count due">{dueTerms.length} term{dueTerms.length === 1 ? '' : 's'} due</span>
		{/if}
	</div>

	{#if verdict}
		<div class="flash" role="status">
			<p class="eyebrow">Round complete</p>
			<p class="term">Final: {right} / {QUIZ_LENGTH}</p>
			<p class="def">{verdict}</p>
			<div class="flashtools">
				<button class="chip" onclick={startQuiz}>New round ↦</button>
				<button class="chip" onclick={() => (verdict = '')}>Close</button>
			</div>
		</div>
	{:else if quiz}
		<div class="flash">
			<p class="eyebrow">{quiz.target.category} · question {Math.min(qNum + (picked ? 0 : 1), QUIZ_LENGTH)} of {QUIZ_LENGTH}</p>
			<p class="def quizdef">
				“{quiz.target.definition.slice(0, 180)}{quiz.target.definition.length > 180 ? '…' : ''}”
			</p>
			<div class="opts">
				{#each quiz.options as o (o.slug)}
					<button
						class="opt"
						class:right={picked && o.slug === quiz.target.slug}
						class:wrong={picked?.slug === o.slug && o.slug !== quiz.target.slug}
						disabled={!!picked && o.slug !== picked.slug && o.slug !== quiz.target.slug}
						onclick={() => answer(o)}
					>
						{o.term}
					</button>
				{/each}
			</div>
			<div class="flashtools">
				{#if picked}
					<button class="chip" onclick={nextQuestion}>
						{qNum >= QUIZ_LENGTH ? 'See result ↦' : 'Next question ↦'}
					</button>
				{/if}
				<button class="chip" onclick={() => (quiz = null)}>Close</button>
				<span class="count">Score: {right} / {qNum}</span>
			</div>
		</div>
	{/if}

	{#if card}
		<div class="flash">
			<p class="eyebrow">{card.category}</p>
			<p class="term">{card.term}</p>
			{#if revealed}<p class="def">{card.definition}</p>{/if}
			<div class="flashtools">
				<button class="chip" onclick={() => (revealed = !revealed)}>
					{revealed ? 'Hide' : 'Reveal'}
				</button>
				<button class="chip" onclick={() => { pos++; revealed = false; }}>Next card ↦</button>
				<button class="chip" onclick={shuffle}>Reshuffle</button>
				<button class="chip" onclick={() => (deck = [])}>Close</button>
				<span class="count">{(pos % deck.length) + 1} / {deck.length}</span>
			</div>
		</div>
	{/if}

	<!--
		The directory. 779 cards is a reference only if you can see what is in it
		and land somewhere on purpose; without this the page is 210,000 pixels of
		scroll with no way in. Plain anchors, so it works before hydration and
		with JavaScript off, and it is NOT sticky on purpose: the mode bar above
		it is already sticky and two rows tall on a phone, and a second sticky
		bar would have to be paid for out of app.css's scroll-padding-top, which
		exists to stop a cross-page #term anchor landing underneath the first one.
		Each group carries its own way back up here instead.
	-->
	{#if showDirectory}
		<nav class="directory" data-print="hide" aria-label="Jump to a category">
			{#each groups as g (g.id)}
				<a href="#{g.id}">{g.name}<span class="dn">{g.entries.length}</span></a>
			{/each}
		</nav>
	{/if}

	<!--
		Deck cards the search found. Links and a label, deliberately NOT .lexcard,
		.def or .flash: those are the paywall's selectors and the regression
		counts' too. A heading of its own so it reads as a group beside the
		category groups below it, which are h2 as well.
	-->
	{#if floor.hits.length}
		<section class="deckhits" aria-labelledby="deckhits-h">
			<h2 class="deckhead" id="deckhits-h">In the Floor Deck</h2>
			<ul>
				{#each floor.hits as h (h.id)}
					<li>
						<a href={deckHref(base, h)}>
							<span class="dterm">{h.term}</span>
							<span class="dmeta">
								<!-- One expression, not an {#if}: Svelte trims the space at a
								     block's edge, and the live page read "Onglet ·Meat Cuts". -->
								{h.via ? `also called ${h.via} · ${h.sectionTitle}` : h.sectionTitle}
							</span>
						</a>
					</li>
				{/each}
			</ul>
			{#if floor.more}
				<p class="dmore">
					and {floor.more} more. <a href="{base}/service/deck">Open the deck</a> to see them all.
				</p>
			{/if}
		</section>
	{/if}

	{#each groups as g (g.id)}
		<section class="group">
			<h2 class="grouphead" id={g.id}>
				<span class="gname">{g.name}</span>
				<span class="gn">{g.entries.length}</span>
				<a class="totop" href="#top" data-print="hide">Top</a>
			</h2>
			<div class="lexgrid">
				{#each g.entries as e (e.slug)}
					<article class="lexcard" id={e.slug}>
						<!--
							h3, under the group's h2. Every term was an h2 in a flat run, so a
							screen reader's heading list was 779 siblings with no structure.
							The outline is now page, category, term, which is what the page
							actually is, and it lets a reader jump by category OR by term.

							The per-card category eyebrow is gone. Every card now sits inside
							a labelled group, including in search results, and that heading is
							sticky, so the category was being said twice within 40 pixels: the
							group heading and then three cards in a row repeating it.
						-->
						<h3>{e.term}</h3>
				<p class="def">{e.definition}</p>
				<!--
					The atlas fields. Only the ingredient entries carry them, so this
					whole block is absent on the 479 sealed terms rather than rendering
					five empty rows: the data omits the keys entirely, and an {#if} per
					row means an entry with a season but no keeping note still reads.

					A description list, not a table and not paragraphs: these are
					label/value pairs and dl is the element that says so, which matters
					because a cook scanning for "how do I pick one" is doing exactly the
					lookup dt describes. No heading per row, for the same reason the
					crosslink group has none, spelled out below: more cards must not put
					five times as many headings into the page's heading list.

					Season renders as month names, because [9,10,11,12,1,2] is a database
					row and "September to February" is what a person reads. The stored
					order is already reading order and must not be sorted: a winter crop
					wraps the year end on purpose.
				-->
				{#if e.season || e.choose || e.store || e.prep || e.methods}
					<dl class="atlas">
						{#if e.season}
							<dt>Season</dt>
							<dd>{seasonLabel(e.season)}</dd>
						{/if}
						{#if e.choose}<dt>Choosing</dt><dd>{e.choose}</dd>{/if}
						{#if e.store}<dt>Keeping</dt><dd>{e.store}</dd>{/if}
						{#if e.prep}<dt>Prep</dt><dd>{e.prep}</dd>{/if}
						{#if e.methods}<dt>Cook it</dt><dd>{e.methods.join(', ')}</dd>{/if}
					</dl>
				{/if}
				{#if e.recipes.length}
					<!--
						The links used to sit here with nothing but an arrow glyph in front
						of them, so their placement inside the card was the entire claim
						that they had anything to do with the term. A screen reader heard a
						run of dish names and no reason for them; a sighted reader had to
						infer it from a mapsto arrow.

						Visible words rather than an aria-label, because the framing was
						missing for everyone, not only for assistive tech - and a label
						nobody can see is a label nobody proofreads. `role=group` carries
						it into the accessibility tree as one named thing rather than
						loose links; a plain <p> with aria-label is not reliably announced.

						"Demonstrated in" is the crosslink contract, not a hedge: item
						21's justification rule means a dish only appears here when the
						term is one of the things it actually shows.

						A heading per card was the other option and is wrong at this
						density: 479 cards would put 479 more headings into the page's
						heading list, which makes heading navigation worse, not better.
					-->
					<p class="xrefs" role="group" aria-label="Dishes that demonstrate {e.term}">
						<span class="xlabel">Demonstrated in</span>
						{#each e.recipes as slug (slug)}
							{@const r = bySlug.get(slug)}
							{#if r}<a href="{base}/recipe/{slug}"><span aria-hidden="true">↦</span> {r.name}</a
								>{/if}
						{/each}
						</p>
					{/if}
					<!--
						The way to the floor card, in a paragraph of its OWN and never
						inside .xrefs: "Demonstrated in" is a contract about dishes, and
						a regression pins T-Bone & Porterhouse to zero .xrefs links. The
						same visible-label, role=group shape as the crosslinks, for the
						reasons written above them. This entry is the long read; the card
						is what to say at the table, and it links back here.
					-->
					{#if cardsForLexicon(data.deckIndex, e.slug).length}
						<p class="deckref" role="group" aria-label="Floor Deck cards for {e.term}">
							<span class="xlabel">On the floor</span>
							{#each cardsForLexicon(data.deckIndex, e.slug) as c (c.id)}
								<a href={deckHref(base, c)}><span aria-hidden="true">↦</span> {c.term}</a>
							{/each}
						</p>
					{/if}
				</article>
			{/each}
			</div>
		</section>
	{/each}

	{#if !shown.length}
		{#if floor.hits.length}
			<p class="empty">The Lexicon has no entry by that name. The Floor Deck does: see above.</p>
		{:else}
			<p class="empty">No terms match. Widen the search: the kitchen is large.</p>
		{/if}
	{/if}
</div>

<style>
	/*
	 * padding-BLOCK, deliberately. The shorthand `padding: 26px 0 80px` zeroed
	 * padding-inline, and this scoped rule out-specifies the global
	 * `.shell {{ padding-inline: 20px }}` - so this page shipped with its text
	 * touching the glass on phones. Six routes had the same line; measured at
	 * 320 and 375, h1 and lede sat at x=0 while every healthy route sat at 20.
	 */
	.view { padding-block: 26px 80px; }
	.head h1 { font-size: var(--t-h2); margin-bottom: 8px; }
	.tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 20px 0 24px; }
	.search { flex: 1 1 260px; }
	.search input {
		width: 100%; padding: 10px 14px; border: 1px solid var(--field-line);
		background: var(--card); border-radius: var(--radius);
	}
	.chip {
		border: 1px solid var(--line); background: var(--card); padding: 8px 14px;
		border-radius: var(--radius); cursor: pointer; font-size: 14px;
	}
	.chip:hover { border-color: var(--turmeric); }
	/* A form control wearing the chip's coat: its edge is the field edge (3:1). */
	select.chip { appearance: none; max-width: 260px; border-color: var(--field-line); }
	.count { font-size: var(--t-small); color: var(--muted); font-variant-numeric: oldstyle-nums; margin-left: auto; }
	/* .count.due, not .due: a bare `.due` here tied .count on specificity and
	   lost the tie on source order, so the due-terms pill rendered --muted,
	   identical to the plain count beside it. Two classes beats one regardless
	   of which is declared first. */
	.count.due {
		color: var(--turmeric-deep);
	}

	.flash {
		border: 1px solid var(--turmeric); background: var(--card);
		padding: 24px; margin-bottom: 26px; text-align: center; border-radius: var(--radius);
	}
	.flash .term { font-family: var(--display); font-size: var(--t-h2); margin: 6px 0 10px; }
	.flash .def { max-width: 62ch; margin: 0 auto 14px; color: var(--ink-soft); }
	.flashtools { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; align-items: center; }
	.flashtools .count { margin-left: 0; }

	.quizdef { font-style: italic; }
	.opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; max-width: 640px; margin: 0 auto 14px; }
	.opt {
		border: 1px solid var(--line); background: var(--paper); padding: 10px 14px;
		border-radius: var(--radius); cursor: pointer; font-family: var(--display); font-size: 16px;
	}
	.opt:hover:not(:disabled) { border-color: var(--turmeric); }
	.opt:disabled { opacity: 0.45; cursor: default; }
	.opt.right { border-color: var(--leaf); color: var(--leaf); font-weight: 600; }
	.opt.wrong { border-color: var(--chili); color: var(--chili); }

	/* min(100%, 320px): the bare 320px floor only ever fit because the gutter
	   bug above had removed the gutters. With 20px back on each side a 320px
	   track overflows a 320px phone by 40 - the two fixes ship together. */
	.lexgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: var(--gap); }
	.lexcard {
		background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
		padding: 16px 18px; content-visibility: auto; contain-intrinsic-size: auto 220px;
		/* Clears the sticky group heading above. scroll-margin is per-element and
		   ADDS to html's scroll-padding-top, so a /lexicon#term anchor from any of
		   the nine templates that emit one still lands on the card and not under
		   the heading, without touching the global rule every other route uses. */
		scroll-margin-top: 52px;
	}
	.lexcard h3 { font-size: var(--t-h4); margin: 4px 0 8px; font-weight: 600; }

	/* ---- the directory and the group headings ---- */

	/* auto-fit, not auto-fill: with 25 categories on a wide screen auto-fill
	   leaves empty phantom tracks at the end of the last row and the links stop
	   looking like one block. */
	.directory {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
		gap: 2px 18px; margin: 0 0 34px; padding: 16px 0; border-block: 1px solid var(--line);
	}
	.directory a {
		display: flex; align-items: baseline; gap: 8px;
		padding: 4px 0; color: var(--ink); text-decoration: none; font-size: var(--t-small);
	}
	.directory a:hover { color: var(--turmeric-deep); }
	.directory a:hover .dn { border-color: var(--turmeric); }
	/* The count is the useful half: it says whether a category is worth the trip,
	   and it is the only place the shape of the corpus is visible at a glance. */
	.dn {
		margin-left: auto; font-variant-numeric: tabular-nums; font-size: 0.8em;
		color: var(--muted); border-bottom: 1px solid transparent;
	}

	.group { margin: 0 0 44px; }
	/*
	 * Sticky, and this is the one sticky thing this page adds.
	 *
	 * The Vegetable Atlas is 113 cards: scroll into the middle of it and without
	 * this you have no idea which category you are in, which is the whole problem
	 * the grouping was meant to solve.
	 *
	 * It parks at --modebar-h, the bar's MEASURED height, not at the
	 * scroll-padding-top beside it: those two numbers are 56 and 110 and the bar
	 * is 47 and 97, because scroll-padding over-allows on purpose. Sticking at
	 * the padding value left a 9px slot on desktop and 13px on a phone with card
	 * text scrolling through it, which reads as a broken header. z-index below
	 * the bar's 40, so the bar always wins the overlap.
	 *
	 * The cost is that an anchored card would land underneath it, which is
	 * exactly the failure app.css's scroll-padding exists to prevent. Paid for
	 * with scroll-margin-top on the cards rather than by raising the global
	 * scroll-padding: this heading only exists on this page, so every other
	 * route's anchors must not move.
	 */
	.grouphead {
		position: sticky; top: var(--modebar-h); z-index: 20;
		display: flex; align-items: baseline; gap: 12px;
		margin: 0 0 16px; padding: 10px 0 8px; border-bottom: 1px solid var(--line);
		background: var(--paper); font-size: var(--t-h4); letter-spacing: 0.02em;
	}
	.gname { color: var(--turmeric-deep); }
	.gn { font-variant-numeric: tabular-nums; font-size: 0.75em; color: var(--muted); }
	/* Pushed to the end and quiet until wanted: on a page this tall the way back
	   to the directory has to exist, and it must not read as a third control. */
	.totop {
		margin-left: auto; font-size: 0.7em; letter-spacing: 0.1em; text-transform: uppercase;
		color: var(--muted); text-decoration: none;
	}
	.totop:hover { color: var(--turmeric-deep); }
	.lexcard .def { font-size: 14.5px; color: var(--ink-soft); max-width: 62ch; }
	/* The atlas rows. A two-column grid on anything with room, because the whole
	   value of these fields is being scannable: a cook at a market wants
	   "Choosing" to be findable without reading a paragraph. It collapses to one
	   column on a narrow phone, where a 90px label column would leave the value
	   six words wide. `dt` is styled as the quiet half deliberately: the reader
	   is scanning for the label but reading the value. */
	.atlas {
		margin: 12px 0 0; display: grid; gap: 4px 14px;
		grid-template-columns: max-content 1fr; align-items: baseline;
		font-size: var(--t-small); line-height: 1.5;
	}
	.atlas dt {
		color: var(--muted); text-transform: uppercase;
		letter-spacing: 0.04em; white-space: nowrap;
	}
	.atlas dd { margin: 0; color: var(--ink); }
	@media (max-width: 460px) {
		.atlas { grid-template-columns: 1fr; gap: 2px; }
		.atlas dd { margin-bottom: 8px; }
	}
	.xrefs { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
	/* Reads as a label, not as another chip: no border, no link colour. */
	.xlabel {
		font-size: var(--t-small); color: var(--muted); text-transform: uppercase;
		letter-spacing: 0.04em; flex: 0 0 100%;
	}
	.xrefs a {
		font-size: var(--t-small); color: var(--turmeric-deep); text-decoration: none;
		border: 1px solid var(--line); border-radius: var(--radius); padding: 2px 8px;
	}
	.xrefs a:hover { border-color: var(--turmeric); }
	/* The same furniture as the crosslinks, because it is the same kind of
	   thing: a labelled row of ways out of this card. */
	.deckref { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
	.deckref a {
		font-size: var(--t-small); color: var(--turmeric-deep); text-decoration: none;
		border: 1px solid var(--line); border-radius: var(--radius); padding: 2px 8px;
	}
	.deckref a:hover { border-color: var(--turmeric); }

	.deckhits { margin: 0 0 26px; }
	.deckhead {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line);
		padding-bottom: 5px; margin: 0 0 10px; font-weight: 500;
	}
	.deckhits ul {
		list-style: none; margin: 0; padding: 0; display: grid; gap: 8px;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	}
	.deckhits li a {
		display: flex; flex-direction: column; justify-content: center; gap: 2px; min-height: 44px;
		padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--radius);
		background: var(--card); color: var(--ink); text-decoration: none;
	}
	.deckhits li a:hover { border-color: var(--turmeric-deep); }
	.dterm { font-family: var(--display); font-size: 17px; }
	.dmeta { font-size: var(--t-small); color: var(--ink-soft); }
	.dmore { margin-top: 8px; font-size: var(--t-small); color: var(--ink-soft); }
	.dmore a { color: inherit; }
	.empty { padding: 60px 20px; text-align: center; color: var(--muted); font-style: italic; }
</style>
