<!--
  One dish, studied: the detail card that replaces the list in place
  (docs/study-menus-design.md, 1.3 and 1.4). Top to bottom, in this order
  on purpose: the way back and the position, the name and the price, how to
  say it, the ten second line and the one-line answer to what the guest asks
  next (so the first screen at 390 by 844 holds what a server needs at the
  table), then the longer lines, the story, the pairing, what it is made of
  and what to compare it with (who makes it, WhoMakes.svelte, then
  MadeOf.svelte), the parts, the coaching,
  the service note, the videos to watch, the links, the drills and the
  quiet Edit.

  A DRINK OR A WINE opens here too, from a tasting's course: the same card
  with what a pour has (how to say it, its lines, what it is made of, its
  spec or its wine, what to offer next, where the tastings pour it and its
  room's link), and without what only a dish has (the pairing, the bottle
  tiers, the links into the Library, the section drill, Edit).

  FROM A TASTING, the card says the tasting first: under the name, the
  menu's name and price, the course the item is on as printed with the
  course's own pour ("Third Course. Paired with Charles Lafitte Brut
  Champagne FR NV [4oz]"), and what the menu prints about its drinks
  (study.ts tastingHere). The dish's pour off the list leaves the first
  screen, and its block further down is headed as the à la carte pour.

  KEPT ONLY. Every value drawn here comes through study.ts's readers, which
  return a mark only when a person kept it. A mark of hers that nobody kept
  is never drawn; one line says there is something to look over behind Edit.

  ALLERGENS STAY WITH THE KITCHEN. No allergen list, no tick, no verdict.
  The service note is the person's own words, printed verbatim under the
  fixed eyebrow, and when there is none the eyebrow stays and says to ask.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import type { House, HouseCocktail, HouseDish, HouseItem, HouseWine, Pairing } from '$lib/house/house-schema';
	import {
		findItem,
		hasUnkept,
		itemsOfKind,
		kept,
		lineupFor,
		linesShown,
		notesFor,
		partsShown,
		priceLine,
		readOnWords,
		say,
		bottlesFor,
		cardVideos,
		pairsFor,
		tastingHere,
		tastingPlaces,
		type StudyRow
	} from '$lib/study';
	import { roomHref, ROOM_NAMES, type Room } from '$lib/wing-links';
	import { sharedOrigin } from '$lib/desk/desk-share';
	import StudyLinks from './StudyLinks.svelte';
	import VideoList from './VideoList.svelte';
	import MadeOf from './MadeOf.svelte';
	import WhoMakes from './WhoMakes.svelte';
	import TeachingFolio from './TeachingFolio.svelte';
	import { foliosForDish } from '$lib/teaching-folios';

	let {
		current,
		dish,
		list,
		searching = false,
		is86 = () => false,
		linkable = { codex: false, ledger: false },
		recipeSlug = '',
		onOpen,
		onStep,
		onEdit,
		onGo
	}: {
		current: House;
		/** The item the card is about: a dish from the list, or a drink or a wine a tasting names. */
		dish: HouseItem;
		/** The rows the card was opened from, in their order: the position, Previous and Next walk this. */
		list: readonly StudyRow[];
		searching?: boolean;
		is86?: (id: string) => boolean;
		/** Per room: the network is up or the room is installed here (wing-links.ts, rule 3). */
		linkable?: { codex: boolean; ledger: boolean };
		recipeSlug?: string;
		/** Kept for the page's own use; the layout's Back closes the card now. */
		onBack?: () => void;
		/** Open another dish's card from a link on this one (a mix-up). */
		onOpen: (id: string) => void;
		/** Step to the previous or next card in the list, in place. */
		onStep: (id: string) => void;
		onEdit: (id: string) => void;
		onGo: (search: string) => void;
	} = $props();

	const idx = $derived(list.findIndex((r) => r.id === dish.id));
	const prev = $derived(idx > 0 ? list[idx - 1] : null);
	const next = $derived(idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null);
	const position = $derived.by(() => {
		if (idx < 0) return '';
		if (searching) return say('found', { i: idx + 1, n: list.length });
		/* The section the row was filed under: the dish's own, or the tasting a card was opened from. */
		const section = list[idx].section;
		const inSection = list.filter((r) => r.section === section);
		const j = inSection.findIndex((r) => r.id === dish.id);
		return say('position', { i: j + 1, n: inSection.length, section });
	});
	/* Opened from a tasting's menu (its rows are filed under the menu's name): that tasting's course and
	   pour for this item, right under the name, and the dish's own pour off the list kept off the first
	   screen and named for what it is, so the guest is never quoted a priced bottle for an included pour. */
	const here = $derived(idx >= 0 && !searching ? tastingHere(current, list[idx].section, dish.id) : null);
	const isDish = $derived(dish.kind === 'dish');
	const signature = $derived(dish.kind === 'dish' && !!(dish as HouseDish).signature);

	const price = $derived(priceLine(dish, current));
	/* A pour the house prices only by where the tastings pour it ('Poured on the ..., 4 oz') is a
	   sentence, not a price tag: it sits under the name, never squeezed beside it. */
	const pouredOn = $derived(/^Poured on /.test(price));
	const priceTag = $derived(pouredOn ? '' : price);
	const readOn = $derived(readOnWords(current.menusReadOn));
	const sayIt = $derived((kept<string>(dish.say) ?? '').trim());
	const lines = $derived(linesShown(dish));
	const notes = $derived(notesFor(dish));
	const parts = $derived(partsShown(dish));
	const pairing = $derived(dish.kind === 'dish' ? kept<Pairing>((dish as HouseDish).pairing) : undefined);
	/* A pour's own facts, plain fields as the house holds them: a cocktail's spec, glass and garnish; a wine's producer, region and grapes, and how to serve it when kept. */
	const pourFacts = $derived.by<Array<[string, string]>>(() => {
		if (dish.kind === 'cocktail') {
			const c = dish as HouseCocktail;
			return ([['Spec', (c.spec ?? []).map((x) => x.trim()).filter(Boolean).join(', ')], ['Glass', (c.glass ?? '').trim()], ['Garnish', (c.garnish ?? '').trim()]] as Array<[string, string]>).filter(([, v]) => v);
		}
		if (dish.kind === 'wine') {
			const w = dish as HouseWine;
			return ([['Producer', (w.producer ?? '').trim()], ['Region', (w.region ?? '').trim()], ['Grapes', (w.grapes ?? []).join(', ')], ['Serve', (kept<string>(w.serve) ?? '').trim()]] as Array<[string, string]>).filter(([, v]) => v);
		}
		return [];
	});
	/* What to offer after a drink, or the dishes a wine is the first pick for, from kept marks only. */
	const pourNext = $derived(isDish ? [] : pairsFor(current, dish));
	/* Where the tastings serve it, by course as printed. */
	const places = $derived(tastingPlaces(current, dish.id));
	/* The room a drink or a wine lives in, for its own link. */
	const ownRoom = $derived<Room | ''>(dish.kind === 'wine' ? 'codex' : dish.kind === 'cocktail' ? 'ledger' : '');
	const lineup = $derived(lineupFor(current, dish.id));
	const hers = $derived(hasUnkept(dish));
	const onShared = sharedOrigin(base);

	const wine = $derived(pairing ? findItem(current, pairing.wineId) : undefined);
	const winePrice = $derived(wine ? priceLine(wine, current) : '');
	const second = $derived(pairing ? findItem(current, pairing.secondId) : undefined);
	const zero = $derived(pairing ? findItem(current, pairing.zeroProofId) : undefined);
	/* By the bottle: the dish's bottle tiers, drawn only when the kept pairing carries some. */
	const bottles = $derived(bottlesFor(current, dish));
	/* Watch: the house's videos for this dish, each a link out in a new tab, never a player. */
	const videos = $derived(cardVideos(current, dish));

	/** A link into another room, or '' when one may not be drawn. */
	const hrefIn = (room: Room, id: string) =>
		linkable[room as 'codex' | 'ledger'] ? roomHref(room, id, base, current) : '';
	/** The offline note beside a name that could be a link here but is not, on the shared origin only. */
	const offNote = (room: Room, id: string) =>
		onShared && !hrefIn(room, id) && roomHref(room, id, base, current) ? say('offlineRoom', { room: ROOM_NAMES[room] }) : '';

	/* The section's floor for its own drill: four dishes with something kept to ask about. A drink or a wine has no section drill here. */
	const drillable = $derived(
		isDish
			? itemsOfKind(current, 'dish').filter(
					(d) => d.section === dish.section && (kept(d.parts) || kept(d.lines) || kept((d as HouseDish).pairing))
				).length
			: 0
	);

	let open20 = $state(false);
	let open45 = $state(false);
	let heading: HTMLHeadingElement | undefined = $state();

	onMount(() => {
		heading?.focus({ preventScroll: true });
	});
	/* A step to another card in place: the toggles close and the heading takes the focus again. */
	let shownId = '';
	$effect(() => {
		const id = dish.id;
		if (shownId && shownId !== id) {
			open20 = false;
			open45 = false;
			void tick().then(() => heading?.focus({ preventScroll: true }));
		}
		shownId = id;
	});

	const principleWords = (p: string[]) => p.join(', ');
	const paragraphs = (s: string) => s.split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean);
</script>

<article class="card" aria-labelledby="card-h">
	<!-- The way back is the layout's Back (docs/consolidation-design.md 2.2):
	     the card is a pushed entry, so it closes the card and the list comes
	     back where it was. The position and Next stay. -->
	<div class="backline">
		{#if position}<span class="pos">{position}</span>{/if}
		{#if next}<button class="chip nextbtn" onclick={() => onStep(next.id)}>{say('nextOnly')}<span class="vh">: {next.name}</span></button>{/if}
	</div>

	<p class="eyebrow">
		{[dish.section, signature ? 'Signature' : '', is86(dish.id) ? '86 tonight' : ''].filter(Boolean).join(' · ')}
	</p>
	<div class="namerow">
		<h2 id="card-h" tabindex="-1" bind:this={heading}>{dish.name}</h2>
		{#if priceTag}<span class="price">{priceTag}</span>{/if}
	</div>
	{#if pouredOn}<p class="soft pouredon">{price}</p>{/if}
	{#if priceTag && readOn}<p class="soft small">{say('asPrinted', { date: readOn })}</p>{/if}

	{#if here}
		<div class="tcourse" data-tasting={here.id}>
			<p class="eyebrow">{here.name}{#if here.price}{' · '}{here.price}{/if}</p>
			{#each here.lines as l, i (i)}<p class="tcline">{l}</p>{/each}
			{#if here.terms}<p class="soft small">{here.terms}</p>{/if}
		</div>
	{/if}

	{#if sayIt}
		<p class="eyebrow">{say('say')}</p>
		<p class="sayit">{sayIt}</p>
	{/if}

	{#if lines.s10}
		<p class="eyebrow">{say('ten')}</p>
		<p class="ten">{lines.s10}</p>
	{/if}

	{#if pairing && (wine || zero) && !here}
		<p class="pourline">
			{#if wine}
				Pour:
				{#if hrefIn('codex', wine.id)}<a href={hrefIn('codex', wine.id)}>{wine.name}</a>{:else}{wine.name}{/if}{#if winePrice}, {winePrice}{/if}.
			{/if}
			{#if zero}
				Without alcohol:
				{#if hrefIn('ledger', zero.id)}<a href={hrefIn('ledger', zero.id)}>{zero.name}</a>{:else}{zero.name}{/if}.
			{/if}
		</p>
	{/if}

	{#if lines.s20 || lines.s45}
		<div class="toggles">
			{#if lines.s20}
				<button class="chip" aria-expanded={open20} aria-controls="l20" onclick={() => (open20 = !open20)}>{open20 ? say('twentyHide') : say('twenty')}</button>
			{/if}
			{#if lines.s45}
				<button class="chip" aria-expanded={open45} aria-controls="l45" onclick={() => (open45 = !open45)}>{open45 ? say('fortyFiveHide') : say('fortyFive')}</button>
			{/if}
		</div>
		{#if open20 && lines.s20}<p class="line" id="l20">{lines.s20}</p>{/if}
		{#if open45 && lines.s45}<p class="line" id="l45">{lines.s45}</p>{/if}
	{/if}
	{#if lines.guestShown}
		<p class="eyebrow">The guest line</p>
		<p class="line">{lines.guest}</p>
	{/if}

	{#if notes.about}
		<section class="block" aria-labelledby="about-h">
			<h3 class="blockhead" id="about-h">{say('about')}</h3>
			{#each paragraphs(notes.about.a) as para, i (i)}<p class="para">{para}</p>{/each}
		</section>
	{/if}

	{#each foliosForDish(current.id, dish.id) as folio (folio.id)}
		<TeachingFolio {folio} />
	{/each}

	{#if pairing && (wine || second || zero || pairing.stepUp || bottles.length)}
		<section class="block" aria-labelledby="pour-h">
			<h3 class="blockhead" id="pour-h">{here ? say('pourCarte') : say('pour')}</h3>
			<dl class="pairs">
				{#if wine}
					<div>
						<dt>First pick</dt>
						<dd>
							{#if hrefIn('codex', wine.id)}<a href={hrefIn('codex', wine.id)}>{wine.name}</a>{:else}{wine.name}{/if}{#if winePrice}, {winePrice}{/if}
							{#if offNote('codex', wine.id)}<span class="soft"> {offNote('codex', wine.id)}</span>{/if}
							{#if pairing.why}<span class="sub">Why: {pairing.why}</span>{/if}
							{#if pairing.sayIt}<span class="sub">Say: “{pairing.sayIt}”</span>{/if}
						</dd>
					</div>
				{/if}
				{#if second}
					<div>
						<dt>Second choice</dt>
						<dd>
							{#if hrefIn('codex', second.id)}<a href={hrefIn('codex', second.id)}>{second.name}</a>{:else}{second.name}{/if}
							{#if pairing.secondWhy}<span class="sub">{pairing.secondWhy}</span>{/if}
						</dd>
					</div>
				{/if}
				{#if pairing.stepUp}
					<div><dt>Step up</dt><dd>{pairing.stepUp}</dd></div>
				{/if}
				{#if zero}
					<div>
						<dt>Without alcohol</dt>
						<dd>
							{#if hrefIn('ledger', zero.id)}<a href={hrefIn('ledger', zero.id)}>{zero.name}</a>{:else}{zero.name}{/if}
							{#if offNote('ledger', zero.id)}<span class="soft"> {offNote('ledger', zero.id)}</span>{/if}
							{#if pairing.zeroProofWhy}<span class="sub">{pairing.zeroProofWhy}</span>{/if}
						</dd>
					</div>
				{/if}
			</dl>
			{#if bottles.length}
				<h4 class="bottlehead" id="bottle-h">{say('byBottle')}</h4>
				<dl class="pairs bottles">
					{#each bottles as b (b.tier)}
						<div data-tier={b.tier}>
							<dt>{b.label}</dt>
							<dd>
								{#if b.bin}<span class="bin">{say('bin', { bin: b.bin })}</span>{/if}
								{#if hrefIn('codex', b.wineId)}<a href={hrefIn('codex', b.wineId)}>{b.name}</a>{:else}{b.name}{/if}{#if b.vintage}{' '}{b.vintage}{/if}{#if b.price}, {b.price}{/if}{#if b.size}, {b.size}{/if}
								{#if offNote('codex', b.wineId)}<span class="soft"> {offNote('codex', b.wineId)}</span>{/if}
								{#if b.why}<span class="sub">Why: {b.why}</span>{/if}
								{#if b.sayIt}<span class="sub">Say: “{b.sayIt}”</span>{/if}
							</dd>
						</div>
					{/each}
				</dl>
			{/if}
			{#if pairing.whyThisWine || pairing.palate || pairing.serve || pairing.avoid || pairing.principles?.length}
				<details class="more">
					<summary>{say('pairMore')}</summary>
					<dl class="pairs">
						{#if pairing.whyThisWine}<div><dt>Why this wine</dt><dd>{pairing.whyThisWine}</dd></div>{/if}
						{#if pairing.palate}<div><dt>On the palate</dt><dd>{pairing.palate}</dd></div>{/if}
						{#if pairing.serve}<div><dt>How to serve it</dt><dd>{pairing.serve}</dd></div>{/if}
						{#if pairing.avoid}<div><dt>What to avoid</dt><dd>{pairing.avoid}</dd></div>{/if}
						{#if pairing.principles?.length}<div><dt>The principles</dt><dd>{principleWords(pairing.principles)}</dd></div>{/if}
					</dl>
				</details>
			{/if}
		</section>
	{/if}
	{#each places as p (p)}
		<p class="soft tasting">{p}</p>
	{/each}

	{#if pourFacts.length || pourNext.length}
		<section class="block" aria-labelledby="pourfacts-h">
			<h3 class="blockhead" id="pourfacts-h">{dish.kind === 'wine' ? say('theWine') : say('inGlass')}</h3>
			<dl class="pairs">
				{#each pourFacts as [label, text] (label)}<div><dt>{label}</dt><dd>{text}</dd></div>{/each}
				{#each pourNext as [label, text] (label)}<div><dt>{label}</dt><dd>{text}</dd></div>{/each}
			</dl>
		</section>
	{/if}

	<WhoMakes {current} item={dish} />
	<MadeOf {current} item={dish} {linkable} />

	{#if parts.length}
		<section class="block" aria-labelledby="parts-h">
			<h3 class="blockhead" id="parts-h">{say('parts')}</h3>
			<dl class="parts">
				{#each parts as [label, text] (label)}
					<dt>{label}</dt>
					<dd>{text}</dd>
				{/each}
			</dl>
		</section>
	{/if}

	{#if notes.coaching.length || lineup.asks.length || lineup.disputes.length || lineup.mixUps.length || notes.more.length || notes.earlier.length}
		<section class="block" aria-labelledby="floor-h">
			<h3 class="blockhead" id="floor-h">{say('floor')}</h3>
			{#each notes.coaching as c, i (c.q)}
				<details class="coach" open={i === 0}>
					<summary>{c.q}</summary>
					{#each paragraphs(c.note.a) as para, j (j)}<p class="para">{para}</p>{/each}
				</details>
			{/each}
			{#if lineup.asks.length}
				<h4 class="eyebrow">{say('confirm')}</h4>
				<ul class="plain">
					{#each lineup.asks as a (a.id)}
						<li>{a.question} <span class="soft">Ask the {a.askWhom}{#if a.answer?.trim()}. Answered{#if a.answeredOn} on {a.answeredOn}{/if}: {a.answer}{/if}</span></li>
					{/each}
				</ul>
			{/if}
			{#if lineup.disputes.length}
				<h4 class="eyebrow">{say('disagree')}</h4>
				<ul class="plain">
					{#each lineup.disputes as d (d.id)}
						<li>
							<span class="sub">{d.a.text} <span class="soft">({d.a.source}{#if d.a.date}, {d.a.date}{/if})</span></span>
							<span class="sub">{d.b.text} <span class="soft">({d.b.source}{#if d.b.date}, {d.b.date}{/if})</span></span>
						</li>
					{/each}
				</ul>
			{/if}
			{#if lineup.mixUps.length}
				<h4 class="eyebrow">{say('mixUp')}</h4>
				<ul class="plain">
					{#each lineup.mixUps as m (m.id)}
						{@const other = m.aId === dish.id ? m.bId : m.aId}
						{@const otherItem = findItem(current, other)}
						{@const diff = (kept<string>(m.difference) ?? '').trim()}
						<li>
							{#if otherItem && otherItem.kind === 'dish'}
								<button class="linkish" onclick={() => onOpen(other)}>{otherItem.name}</button>
							{:else if otherItem}
								<b>{otherItem.name}</b>
							{/if}
							{#if diff}<span class="sub">{diff}</span>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if notes.more.length}
				<details class="coach">
					<summary>{say('more')} ({notes.more.length})</summary>
					{#each notes.more as n, i (i)}
						<p class="para"><b>{n.q}</b></p>
						{#each paragraphs(n.a) as para, j (j)}<p class="para">{para}</p>{/each}
					{/each}
				</details>
			{/if}
			{#if notes.earlier.length}
				<details class="coach">
					<summary>{say('earlier')} ({notes.earlier.length})</summary>
					{#each notes.earlier as n, i (i)}
						<p class="para"><b>{n.q}</b></p>
						{#each paragraphs(n.a) as para, j (j)}<p class="para">{para}</p>{/each}
					{/each}
				</details>
			{/if}
		</section>
	{/if}

	<section class="block note" aria-labelledby="note-h">
		<p class="eyebrow" id="note-h">{say('eyebrow')}</p>
		<p class="para">{dish.serviceNote?.trim() ? dish.serviceNote.trim() : say('noteNone')}</p>
	</section>

	{#if videos.length}
		<section class="block" aria-labelledby="watch-h">
			<h3 class="blockhead" id="watch-h">{say('watch')}</h3>
			<p class="soft small">{say('videoNote')}</p>
			<VideoList rows={videos} />
		</section>
	{/if}

	{#if dish.kind === 'dish'}
		{#key dish.id}
			<StudyLinks {current} dish={dish as HouseDish} {recipeSlug} housePour={wine?.name ?? ''} />
		{/key}
	{/if}

	{#if onShared && ownRoom}
		<section class="block" aria-labelledby="ownroom-h">
			<h3 class="blockhead" id="ownroom-h">{say('rooms')}</h3>
			<ul class="plain">
				<li>
					{#if hrefIn(ownRoom, dish.id)}<a href={hrefIn(ownRoom, dish.id)}>{say('inRoom', { name: dish.name, room: ROOM_NAMES[ownRoom] })}</a>{:else}{say('inRoom', { name: dish.name, room: ROOM_NAMES[ownRoom] })} <span class="soft">{offNote(ownRoom, dish.id)}</span>{/if}
				</li>
			</ul>
		</section>
	{/if}

	{#if onShared && (wine || zero)}
		<section class="block" aria-labelledby="rooms-h">
			<h3 class="blockhead" id="rooms-h">{say('rooms')}</h3>
			<ul class="plain">
				{#if wine}
					<li>
						{#if hrefIn('codex', wine.id)}<a href={hrefIn('codex', wine.id)}>{say('inRoom', { name: wine.name, room: 'Codex' })}</a>{:else}{say('inRoom', { name: wine.name, room: 'Codex' })} <span class="soft">{offNote('codex', wine.id)}</span>{/if}
					</li>
				{/if}
				{#if zero}
					<li>
						{#if hrefIn('ledger', zero.id)}<a href={hrefIn('ledger', zero.id)}>{say('inRoom', { name: zero.name, room: 'Ledger' })}</a>{:else}{say('inRoom', { name: zero.name, room: 'Ledger' })} <span class="soft">{offNote('ledger', zero.id)}</span>{/if}
					</li>
				{/if}
			</ul>
		</section>
	{/if}

	<div class="drills">
		<button class="chip go" onclick={() => onGo('mode=cards&item=' + encodeURIComponent(dish.id))}>{say('cardsThis')}</button>
		<button class="chip" onclick={() => onGo('mode=say&item=' + encodeURIComponent(dish.id))}>{say('sayBack')}</button>
		{#if drillable >= 4}
			<button class="chip" onclick={() => onGo('mode=drill&section=' + encodeURIComponent(dish.section))}>{say('drillSection')}</button>
		{:else}
			<button class="chip" onclick={() => onGo('mode=drill')}>{say('drillWhole')}</button>
		{/if}
	</div>
	{#if isDish && drillable < 4}<p class="soft small">{say('tooSmall', { section: dish.section })}</p>{/if}

	{#if hers}<p class="soft">{say('hers')}</p>{/if}

	<div class="foot">
		{#if isDish}<button class="chip ghost" onclick={() => onEdit(dish.id)}>{say('edit')}<span class="vh"> {dish.name}</span></button>{/if}
		<div class="steps">
			{#if prev}<button class="chip" onclick={() => onStep(prev.id)}>{say('prev', { name: prev.name })}</button>{/if}
			{#if next}<button class="chip" onclick={() => onStep(next.id)}>{say('next', { name: next.name })}</button>{/if}
		</div>
	</div>
</article>

<style>
	.card {
		background: var(--card); box-shadow: var(--shadow-card); border: 1px solid var(--line);
		border-radius: var(--radius); padding: 14px 16px 18px; margin: 8px 0 18px;
		font-size: 1rem;
	}
	.backline { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
	.pos { color: var(--ink-soft); font-size: 1rem; flex: 1; min-width: 6em; }
	.nextbtn { margin-left: auto; }
	.chip {
		border: 1px solid var(--line); background: var(--paper); color: var(--ink);
		padding: 8px 14px; border-radius: var(--radius); cursor: pointer;
		font: inherit; font-size: 1rem; min-height: 44px; text-align: left;
	}
	.chip:hover { border-color: var(--turmeric); }
	.chip.go { border-color: var(--turmeric-deep); font-weight: 600; }
	.chip.ghost { background: none; color: var(--ink-soft); }
	.eyebrow { margin: 12px 0 2px; color: var(--muted); font-weight: 500; }
	.namerow { display: flex; align-items: baseline; gap: 12px; }
	.namerow h2 { font-family: var(--display); font-size: var(--t-h2); line-height: 1.12; margin: 0; flex: 1; }
	.namerow h2:focus { outline: none; }
	.namerow h2:focus-visible { outline: 2px solid var(--turmeric-deep); outline-offset: 3px; }
	.price { font-variant-numeric: tabular-nums; font-size: 1.1rem; color: var(--ink); flex: none; }
	.soft { color: var(--ink-soft); }
	.small { font-size: 1rem; margin: 2px 0 0; }
	.sayit { font-size: 1.1rem; margin: 0; }
	.ten {
		font-family: var(--display); font-size: 1.25rem; line-height: 1.4; margin: 2px 0 6px;
		border-left: 2px solid var(--turmeric-deep); padding-left: 12px;
	}
	.pourline { margin: 6px 0 4px; line-height: 1.5; }
	.tcourse { margin: 8px 0 4px; padding-left: 12px; border-left: 2px solid var(--turmeric-deep); }
	.tcourse .eyebrow { margin-top: 0; }
	.tcline { margin: 2px 0; font-size: 1.05rem; line-height: 1.5; color: var(--ink); }
	.pourline a, .pairs a, .plain a { color: var(--ink); text-underline-offset: 3px; }
	.toggles { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 4px; }
	.line { margin: 6px 0; line-height: 1.55; max-width: var(--measure); }
	.block { margin: 20px 0 4px; }
	.blockhead { font-family: var(--display); font-size: var(--t-h4, 1.25rem); margin: 0 0 6px; }
	.para { margin: 0 0 8px; line-height: 1.6; max-width: var(--measure); }
	.pairs { margin: 0; }
	.pairs div { padding: 6px 0; border-bottom: 1px dotted var(--line); }
	.pairs dt { font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); }
	.pairs dd { margin: 2px 0 0; line-height: 1.5; }
	.sub { display: block; margin-top: 3px; color: var(--ink-soft); line-height: 1.5; }
	.bottlehead { font-family: var(--display); font-size: var(--t-h5, 1.05rem); margin: 14px 0 2px; }
	.bottles .bin { display: inline-block; margin-right: 6px; font-variant-numeric: tabular-nums; color: var(--ink-soft); }
	.more, .coach { margin: 8px 0; border-bottom: 1px dotted var(--line); }
	.more summary, .coach summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-size: 1.05rem; }
	.tasting { margin: 8px 0 0; }
	.parts { display: grid; grid-template-columns: 8.5em 1fr; gap: 6px 12px; margin: 0; }
	.parts dt { font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); padding-top: 3px; }
	.parts dd { margin: 0; line-height: 1.5; }
	.plain { list-style: none; margin: 0; padding: 0; }
	.plain li { padding: 6px 0; border-bottom: 1px dotted var(--line); line-height: 1.5; min-height: 44px; }
	.linkish {
		background: none; border: 0; padding: 0; min-height: 44px; font: inherit; font-weight: 600;
		color: var(--ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
	}
	.note .para { margin-top: 2px; }
	.drills { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 4px; }
	.foot { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin-top: 16px; border-top: 1px solid var(--line); padding-top: 12px; }
	.steps { display: flex; flex-wrap: wrap; gap: 8px; }
	.vh {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
	}
</style>
