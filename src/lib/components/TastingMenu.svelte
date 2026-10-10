<!--
  One tasting menu as the house prints it, at the top of the study view
  (the Tasting menus block in StudyMenu.svelte): its name and price, the
  line printed under its name, whether the drinks are in the price or the
  pairing supplement it prints, then every course in printed order. Each
  course shows its heading as printed ("Eye Opener Cocktail", "Third
  Course"), "choice of" where the menu prints it, its dishes, the lines
  printed under them, and the pour under the words printed over it
  ("Paired with", "Suggested Pairing"). A course that is a drink and nothing
  else (the eye opener) shows the drink as the course.

  Every dish and every pour the house holds is a button that opens its
  study card; the card walks the menu in printed order with Previous and
  Next (study.ts tastingRows). A pour the house does not hold stays words.
  The art is the Table's: the parchment card, the display face for names,
  the eyebrow for headings, the page's chip for the flash cards link. Every
  control at least 44px, every state a word, nothing about allergens.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import type { House } from '$lib/house/house-schema';
	import { say, tastingRows, type StudyRow, type TastingItemRef, type TastingShown } from '$lib/study';

	let {
		current,
		menu,
		is86 = () => false,
		onOpen
	}: {
		current: House;
		menu: TastingShown;
		is86?: (id: string) => boolean;
		/** Open an item's card from this menu: its id, the menu's rows in printed order, and the selector that finds this button again. */
		onOpen: (id: string, list: readonly StudyRow[], from: string) => void;
	} = $props();

	const rows = $derived(tastingRows(current, menu));
	const keyOf = (n: number, id: string) => `${menu.id}:${n}:${id}`;
	const open = (n: number, id: string) => onOpen(id, rows, `.study [data-key="${keyOf(n, id)}"]`);
</script>

{#snippet entry(n: number, ref: TastingItemRef | null, text: string, role: 'dish' | 'drink' | 'pour')}
	{#if ref}
		<button type="button" class="titem {role}" class:off={is86(ref.id)} data-id={ref.id} data-key={keyOf(n, ref.id)} onclick={() => open(n, ref.id)}>
			<span class="tname">{text}</span>{#if is86(ref.id)}<span class="tag strong">86</span>{/if}
		</button>
	{:else}
		<p class="titem {role} plain"><span class="tname">{text}</span></p>
	{/if}
{/snippet}

<article class="tmenu" aria-labelledby="tm-{menu.id}" data-tasting={menu.id}>
	<header class="thead">
		<div class="namerow">
			<h4 class="tmname" id="tm-{menu.id}">{menu.name}</h4>
			{#if menu.price}<span class="tprice">{menu.price}</span>{/if}
		</div>
		{#if menu.line}<p class="tline">{menu.line}</p>{/if}
		{#if menu.includesDrinks}<p class="tterms">{say('drinksIn')}</p>{/if}
		{#if menu.supplement}<p class="tterms supp">{menu.supplement}</p>{/if}
	</header>

	<div class="journey-intro">
		<p class="journey-title">The course journey <span aria-hidden="true">✦</span></p>
		<p>Follow the menu in printed order. Open a dish or drink to study it.</p>
	</div>
	<ol class="courses" aria-label="{menu.name}, {say('courseCount', { n: menu.courses.length })}">
		{#each menu.courses as c, step (c.n)}
			<li class="course" data-n={c.n}>
				<span class="waypoint" aria-hidden="true">{String(step + 1).padStart(2, '0')}</span>
				<div class="course-panel">
					<p class="clabel">{c.label}</p>
					<div class="course-content">
						<div class="food-stage">
							{#if c.choice}<p class="choice">{say('choiceOf')}</p>{/if}
							{#if c.drinkCourse && c.pour}
								{@render entry(c.n, c.pour.item, c.pour.text, 'drink')}
							{:else}
								{#each c.dishes as d (d.id)}
									{@render entry(c.n, d, d.name, 'dish')}
								{/each}
							{/if}
							{#each c.printed as line, i (i)}<p class="printed">{line}</p>{/each}
						</div>
						{#if c.pour && !c.drinkCourse}
							<div class="pour-stage">
								<p class="plabel">{c.pourLabel}</p>
								{@render entry(c.n, c.pour.item, c.pour.text, 'pour')}
							</div>
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ol>

	<div class="tfoot">
		<a class="chip" href="{base}/flashcards?deck={encodeURIComponent('tasting:' + menu.id)}&run=1">{say('flashCourses')}<span class="vh">: {menu.name}</span></a>
	</div>
	<p class="journey-practice">Trace the courses, name the choice, then explain the drink terms above. Test your recall with the course cards.</p>
	{#if menu.note}
		<details class="tnotes">
			<summary>{say('tastingNotes')}<span class="vh">: {menu.name}</span></summary>
			<p class="notep">{menu.note}</p>
		</details>
	{/if}
</article>

<style>
	.tmenu {
		background: var(--house-panel); border: 1px solid var(--line-strong); border-radius: var(--radius);
		box-shadow: var(--shadow-card); padding: 16px 14px 12px; margin: 8px 0 16px;
	}
	.thead { border-bottom: 1px solid var(--line); padding-bottom: 8px; margin-bottom: 2px; }
	.namerow { display: flex; align-items: baseline; gap: 12px; }
	.tmname { font-family: var(--display); font-size: 1.3rem; line-height: 1.2; margin: 0; flex: 1; min-width: 0; }
	.tprice { flex: none; font-variant-numeric: tabular-nums; color: var(--ink); font-size: 1.05rem; }
	.tline { margin: 4px 0 0; font-size: 1rem; line-height: 1.4; color: var(--ink-soft); }
	.tterms { margin: 10px 0 2px; padding: 8px 10px; border-left: 2px solid var(--turmeric); background: var(--paper); font-size: 1rem; line-height: 1.4; color: var(--ink); }
	.journey-intro { margin: 14px 0 12px; }
	.journey-intro p { color: var(--ink-soft); margin: 4px 0; font-size: 1rem; line-height: 1.4; }
	.journey-intro .journey-title { color: var(--turmeric-deep); font-family: var(--display); font-size: 1.2rem; }
	.journey-title span { margin-left: 8px; font-size: 0.85rem; }
	.courses { list-style: none; margin: 0; padding: 0; }
	.course { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 10px; padding: 0 0 12px; }
	.course:not(:last-child)::before { content: ''; position: absolute; top: 32px; bottom: 0; left: 15px; border-left: 1px solid var(--line-strong); }
	.waypoint { display: grid; place-items: center; position: relative; width: 32px; height: 32px; border: 1px solid var(--line-strong); border-radius: 50%; box-sizing: border-box; color: var(--turmeric-deep); background: var(--paper); font-size: 0.9rem; font-variant-numeric: tabular-nums; }
	.course-panel { min-width: 0; padding: 12px; border: 1px solid var(--line); background: var(--paper); }
	.course-content { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
	.food-stage, .pour-stage { min-width: 0; }
	.pour-stage { border-top: 1px dotted var(--line-strong); padding-top: 8px; }
	.clabel, .plabel, .choice {
		margin: 0; font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); line-height: 1.4;
	}
	.choice { text-transform: none; letter-spacing: normal; font-style: italic; font-size: 1rem; color: var(--ink-soft); }
	.plabel { color: var(--turmeric-deep); }
	.titem {
		display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; margin: 0;
		padding: 4px 0; text-align: left; background: none; border: 0; font: inherit; color: var(--ink);
	}
	button.titem { cursor: pointer; }
	.titem .tname { font-family: var(--display); font-size: 1.15rem; line-height: 1.25; }
	.tname { overflow-wrap: anywhere; }
	.titem.pour .tname, .titem.plain .tname { font-family: var(--text); font-size: 1.05rem; }
	button.titem .tname { text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 4px; }
	button.titem:hover .tname { color: var(--turmeric-deep); text-decoration-color: currentColor; }
	button.titem:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.titem.off .tname { text-decoration: line-through; }
	.tag {
		display: inline-block; font-family: var(--text); font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted);
	}
	.tag.strong { color: var(--ink); font-weight: 700; }
	.printed { margin: 0 0 2px; font-size: 1rem; line-height: 1.45; color: var(--ink-soft); }
	.tfoot { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 2px; }
	.journey-practice { color: var(--ink-soft); font-size: var(--t-small); line-height: 1.5; margin: 8px 0; }
	.chip {
		display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--paper);
		color: var(--ink); padding: 8px 14px; border-radius: var(--radius); font: inherit;
		font-size: 1rem; min-height: 44px; text-decoration: none; box-sizing: border-box;
	}
	.chip:hover { border-color: var(--turmeric); }
	.tnotes { margin: 4px 0 0; border-top: 1px solid var(--line); }
	.tnotes summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-size: 1rem; color: var(--ink-soft); }
	.tnotes summary:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 2px; }
	.notep { margin: 0 0 8px; font-size: 1rem; line-height: 1.5; }
	.vh {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
	}
	@media (min-width: 700px) {
		.course-content:has(.pour-stage) { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; }
		.pour-stage { border-top: 0; border-left: 1px dotted var(--line-strong); padding: 4px 0 0 14px; }
	}
	@media (max-width: 360px) { .tmenu { padding-inline: 10px; } .course { grid-template-columns: 26px minmax(0, 1fr); gap: 7px; } .waypoint { width: 26px; height: 26px; font-size: 0.8rem; } .course:not(:last-child)::before { top: 26px; left: 12px; } .course-panel { padding: 9px; } }
</style>
