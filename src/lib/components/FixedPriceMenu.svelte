<!--
  A fixed price menu as the house prints it, in a tab of its own on the
  Brennan's page (/menu?view=thanksgiving: the Thanksgiving Day menu of 26
  November 2026). Everything drawn is the pack's, read through study.ts
  fixedPriceMenu: the menu's name as the heading, the line printed under it
  (the courses and the one price), when the meal is served, then every
  course in printed order with its dishes, and under each dish the line the
  sheet prints for it and what the house pours with it; then the sides for
  the table with their printed prices, which are no course; then the
  menu's note for the floor.

  Every dish is a button that opens its study card through the page's own
  openCard; the card walks the menu in printed order, the courses and then
  the sides, and Back returns here with the focus on the row. The actions
  deal the day's dishes alone: the meal's deck and the meal's drill (the
  existing meal scope), and the menu's own course cards.

  A course dish shows no price: the menu's one price covers it, and the
  price a joined dish carries is the other menus'. A side shows its own. The
  sheet's line is drawn whole when it names the dish another way (Classic
  Turtle Soup for the house's Turtle Soup) and without the name when the two
  agree. Nothing here draws a plate, an allergen or a verdict.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { fold, say, type FixedPriceShown, type StudyRow } from '$lib/study';

	let {
		menu,
		is86 = () => false,
		onOpen,
		onCards
	}: {
		menu: FixedPriceShown;
		is86?: (id: string) => boolean;
		/** Open a dish's card: its id, the menu's rows in printed order, and the selector that finds its button again. */
		onOpen: (id: string, list: readonly StudyRow[], from: string) => void;
		/** Go to the flash cards or the drill: the query string the page's own door takes. */
		onCards: (search: string) => void;
	} = $props();

	const keyOf = (id: string) => `${menu.id}:${id}`;
	const open = (id: string) => onOpen(id, menu.rows, `.fixedmenu [data-key="${keyOf(id)}"]`);
	const scope = $derived('&meal=' + encodeURIComponent(menu.meal));
	const when = $derived([menu.meal, menu.days].filter(Boolean).join(' · '));
	/** The sheet's line without its leading name when that is the house's own name for the dish. */
	function sheetLine(name: string, printed: string): string {
		const cut = printed.indexOf(':');
		if (cut > 0 && fold(printed.slice(0, cut)) === fold(name)) return printed.slice(cut + 1).trim();
		return printed;
	}
</script>

<section class="fixedmenu" aria-labelledby="fp-h" data-fixed={menu.id}>
	<header class="fphead">
		{#if when}<p class="eyebrow">{when}</p>{/if}
		<!-- tabindex="-1": a script may put the focus on the heading; it is not a tab stop. -->
		<h2 id="fp-h" tabindex="-1">{menu.name}</h2>
		{#if menu.line}<p class="fpline">{menu.line}</p>{/if}
		{#if menu.hours}<p class="fphours">{menu.hours}</p>{/if}
	</header>

	<p class="fpintro">{say('fixedIntro')}</p>
	<div class="actions">
		<button type="button" class="chip go" onclick={() => onCards('mode=cards' + scope)}>{say('fixedFlash', { n: menu.served })}</button>
		<button type="button" class="chip" onclick={() => onCards('mode=drill' + scope)}>{say('fixedQuiz')}</button>
		<a class="chip" href="{base}/flashcards?deck={encodeURIComponent('tasting:' + menu.id)}&run=1">{say('flashCourses')}<span class="vh">: {menu.name}</span></a>
	</div>

	{#each menu.courses as c (c.n)}
		<section class="fpcourse" data-course={c.n} aria-labelledby="fp-c-{c.n}">
			<div class="coursehead">
				<h3 class="clabel" id="fp-c-{c.n}">{c.label}</h3>
				<span class="choice">{say('choiceOf')} {c.dishes.length}</span>
			</div>
			<ul class="rows">
				{#each c.dishes as d (d.row.id)}
					<li>
						<button type="button" class="fprow" data-id={d.row.id} data-key={keyOf(d.row.id)} onclick={() => open(d.row.id)}>
							<span class="nm" class:off={is86(d.row.id)}>{d.row.name}{#if is86(d.row.id)}<span class="tag strong">86</span>{/if}</span>
							{#if d.printed}<span class="printed"><span class="vh">{say('fixedSheet')}: </span>{sheetLine(d.row.name, d.printed)}</span>{/if}
							{#each d.pairs as [label, text] (label)}
								<span class="pair"><span class="plabel">{label}</span> {text}</span>
							{/each}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	{#if menu.sides.length}
		<section class="fpcourse sides" data-course="sides" aria-labelledby="fp-sides">
			<div class="coursehead">
				<h3 class="clabel" id="fp-sides">{say('fixedSides')}</h3>
			</div>
			<p class="sidesnote">{say('fixedSidesNote')}</p>
			<ul class="rows">
				{#each menu.sides as r (r.id)}
					<li>
						<button type="button" class="fprow" data-id={r.id} data-key={keyOf(r.id)} onclick={() => open(r.id)}>
							<span class="top">
								<span class="nm" class:off={is86(r.id)}>{r.name}{#if is86(r.id)}<span class="tag strong">86</span>{/if}</span>
								{#if r.price}<span class="pr">{r.price}</span>{/if}
							</span>
							{#if r.line}<span class="printed">{r.line}</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if menu.note}
		<section class="fpnote" aria-labelledby="fp-note">
			<h3 class="clabel" id="fp-note">{say('fixedNote')}</h3>
			<p>{menu.note}</p>
		</section>
	{/if}
</section>

<style>
	.fixedmenu { margin: 8px 0 24px; }
	.fphead {
		background: var(--house-panel); border: 1px solid var(--line-strong); border-radius: var(--radius);
		box-shadow: var(--shadow-card); padding: 16px 14px 14px; text-align: center;
	}
	.eyebrow, .clabel {
		margin: 0; font-family: var(--text); font-size: var(--t-micro); font-weight: 400;
		letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); line-height: 1.4;
	}
	h2 { font-family: var(--display); font-size: 1.6rem; line-height: 1.2; margin: 6px 0 0; color: var(--ink); overflow-wrap: anywhere; }
	h2:focus { outline: none; }
	h2:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 4px; }
	.fpline { margin: 8px 0 0; font-size: 1.1rem; line-height: 1.4; font-style: italic; color: var(--ink); }
	.fphours { margin: 6px 0 0; font-size: 1rem; line-height: 1.4; color: var(--ink-soft); }
	.fpintro { max-width: 68ch; margin: 14px 0 10px; font-size: 1rem; line-height: 1.5; color: var(--ink-soft); }
	.actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 6px; }
	.chip {
		display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--paper);
		color: var(--ink); padding: 8px 14px; border-radius: var(--radius); font: inherit;
		font-size: 1rem; min-height: 44px; text-decoration: none; box-sizing: border-box; cursor: pointer;
	}
	.chip:hover { border-color: var(--turmeric); }
	.chip:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.fpcourse { margin: 18px 0 0; }
	.coursehead {
		display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
		border-bottom: 1px solid var(--line-strong); padding-bottom: 6px;
	}
	.coursehead .clabel { color: var(--turmeric-deep); font-size: var(--t-small); }
	.choice { flex: none; font-style: italic; font-size: 1rem; color: var(--ink-soft); }
	.sidesnote { margin: 8px 0 0; font-size: 1rem; line-height: 1.45; color: var(--ink-soft); }
	.rows { list-style: none; margin: 0; padding: 0; }
	.rows li { border-bottom: 1px solid var(--line); }
	.fprow {
		display: flex; flex-direction: column; gap: 3px; width: 100%; min-height: 48px; margin: 0;
		padding: 10px 2px; text-align: left; background: none; border: 0; font: inherit; color: var(--ink); cursor: pointer;
	}
	.fprow:hover .nm { color: var(--turmeric-deep); }
	.fprow:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.top { display: flex; align-items: baseline; gap: 12px; }
	.nm { font-family: var(--display); font-size: 1.2rem; line-height: 1.25; overflow-wrap: anywhere; flex: 1; min-width: 0; }
	.nm.off { text-decoration: line-through; }
	.pr { flex: none; font-variant-numeric: tabular-nums; font-size: 1.05rem; color: var(--ink); }
	.printed { font-size: 1rem; line-height: 1.45; color: var(--ink-soft); }
	.pair { font-size: 1rem; line-height: 1.45; color: var(--ink); }
	.plabel {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase;
		color: var(--turmeric-deep); margin-right: 4px;
	}
	.tag {
		display: inline-block; margin-left: 8px; font-family: var(--text); font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted);
	}
	.tag.strong { color: var(--ink); font-weight: 700; }
	.fpnote { margin: 22px 0 0; padding: 12px 14px; border-left: 2px solid var(--turmeric); background: var(--house-panel); }
	.fpnote p { margin: 6px 0 0; font-size: 1rem; line-height: 1.55; color: var(--ink); }
	.vh {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
	}
</style>
