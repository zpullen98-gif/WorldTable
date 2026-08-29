<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { house } from '$lib/stores/house.svelte';

	let { data } = $props();

	/**
	 * All TEN courses, not the eight this listed. Breakfast (59 recipes) and
	 * Sauce (22) were missing, and `courses` filters on this list, so a pinned
	 * omelette was silently absent from the card a guest was handed.
	 */
	const COURSE_ORDER = [
		'Breakfast',
		'Starter',
		'Salad',
		'Soup',
		'Main',
		'Side',
		'Sauce',
		'Bread',
		'Dessert',
		'Drink'
	];

	/**
	 * Two menus, and the card must say which it is printing.
	 *
	 * This page printed PINNED GUIDE RECIPES only, so a venue that had entered,
	 * priced and allergen-marked its whole menu tapped Print and handed a guest
	 * a card listing Pizza Margherita. The house menu is the obvious default,
	 * but silently repointing would break the dinner-party use this was built
	 * for, so the pinned mode stays as a labelled choice.
	 */
	let mode = $state<'house' | 'pinned'>('house');
	const houseDishes = $derived(house.dishes);
	const showing = $derived(mode === 'house' && houseDishes.length ? 'house' : 'pinned');

	/** The venue's own menu, in the sections the kitchen typed. */
	const houseSections = $derived.by(() => {
		const m = new Map<string, typeof houseDishes>();
		for (const d of houseDishes) {
			if (house.is86(d.id)) continue; // 86'd tonight is not on tonight's card
			const key = d.section || 'The Menu';
			if (!m.has(key)) m.set(key, []);
			m.get(key)!.push(d);
		}
		return [...m.entries()].map(([section, items]) => ({ section, items }));
	});

	const famBySlug = $derived(new Map(session.familyRecipes.map((r) => [r.slug, r])));
	const pinned = $derived(
		session.menu.map((s) => bySlug.get(s) ?? famBySlug.get(s)).filter(Boolean)
	);

	const courses = $derived(
		COURSE_ORDER.map((c) => ({
			course: c === 'Main' ? 'Mains' : c === 'Bread' ? 'Bread' : `${c}s`,
			items: pinned.filter((r) => r!.course === c)
		})).filter((g) => g.items.length)
	);

	const descriptionOf = (slug: string) =>
		data.flavor[slug] ?? famBySlug.get(slug)?.flavor.sentence ?? '';

	// The date is stamped client-side. During prerender there is no "tonight":
	// a build-machine timestamp baked into the HTML would be confidently wrong
	// on every table it was ever set on.
	let dateline = $state('');
	onMount(() => {
		dateline = new Date().toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	});
</script>

<svelte:head><title>Guest Menu: The World Table</title></svelte:head>

<div class="page">
	<nav class="tools" data-print="hide">
		<a class="chip" href="{base}/menu">← Back to the worksheet</a>
		{#if houseDishes.length}
			<button class="chip" class:on={showing === 'house'} onclick={() => (mode = 'house')}>
				The kitchen's menu
			</button>
			<button class="chip" class:on={showing === 'pinned'} onclick={() => (mode = 'pinned')}>
				Pinned from the guide
			</button>
		{/if}
		<button
			class="chip go"
			onclick={() => window.print()}
			disabled={showing === 'house' ? !houseSections.length : !pinned.length}
		>
			Print the menu
		</button>
	</nav>

	{#if showing === 'house' && houseSections.length}
		<article class="gm">
			<h1>The World <span>Table</span></h1>
			<p class="orn" aria-hidden="true">❦</p>

			{#each houseSections as g (g.section)}
				<h2>{g.section}</h2>
				{#each g.items as d (d.id)}
					<div class="dish">
						<p class="name">{d.name}{#if d.price}<span class="price">{d.price}</span>{/if}</p>
						{#if d.description}<p class="desc">{d.description}</p>{/if}
					</div>
				{/each}
			{/each}

			<p class="orn" aria-hidden="true">❧</p>
			<!--
				Fixed, and not removable. The card carries NO allergen marks: this
				screen's marks are a kitchen record, and a printed list reads to a
				guest as a guarantee the derivation cannot make. The invitation to
				ask is the only honest thing a menu can say about an allergy.
			-->
			<p class="allergy">
				Before you order, please tell us about any allergy or intolerance.
			</p>
			{#if dateline}<p class="date">{dateline}</p>{/if}
		</article>
	{:else if showing === 'pinned' && pinned.length}
		<article class="gm">
			<h1>The World <span>Table</span></h1>
			<p class="orn" aria-hidden="true">❦</p>

			{#each courses as g (g.course)}
				<h2>{g.course}</h2>
				{#each g.items as r (r!.slug)}
					<div class="dish">
						<p class="name">{r!.name}</p>
						<p class="desc">{descriptionOf(r!.slug)}</p>
					</div>
				{/each}
			{/each}

			<p class="orn" aria-hidden="true">❧</p>
			<p class="allergy">
				Before you order, please tell us about any allergy or intolerance.
			</p>
			{#if dateline}<p class="date">{dateline}</p>{/if}
		</article>
	{:else}
		<p class="empty" data-print="hide">
			{#if showing === 'house'}
				No dishes on the kitchen's menu yet: enter them on the worksheet and they print here.
			{:else}
				Nothing pinned yet: the guest menu sets itself from the dishes on your worksheet.
			{/if}
		</p>
	{/if}
</div>

<style>
	.chip.on {
		font-weight: 700;
	}
	.price {
		float: right;
		font-variant-numeric: tabular-nums;
	}
	.allergy {
		margin-top: 18px;
		text-align: center;
		font-size: 0.86rem;
		font-style: italic;
	}
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 26px 20px 80px;
	}
	.tools {
		display: flex;
		gap: 10px;
		justify-content: space-between;
		margin-bottom: 26px;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 8px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
		text-decoration: none;
		color: var(--ink);
	}
	.chip.go {
		background: var(--accent-solid);
		border-color: var(--accent-solid);
		color: var(--on-accent);
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* The card itself is always ink-on-white: it is a physical object being
	   previewed, and previewing it in night service would lie about the print. */
	.gm {
		background: #fff;
		color: #141210;
		padding: 60px 30px;
		text-align: center;
		box-shadow: var(--shadow-lift);
	}
	.gm h1 {
		font-family: var(--display);
		font-weight: 600;
		font-size: 34px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.gm h1 span {
		display: block;
		font-size: 13px;
		letter-spacing: 0.32em;
		color: #8a6d2e;
		margin-top: 6px;
	}
	.orn {
		color: #8a6d2e;
		font-size: 15px;
		margin: 14px 0 6px;
	}
	.gm h2 {
		font-family: var(--text);
		font-size: 11px;
		letter-spacing: 0.36em;
		text-transform: uppercase;
		color: #8a6d2e;
		margin: 30px 0 4px;
		font-weight: 500;
	}
	.gm h2::after {
		content: '';
		display: block;
		width: 54px;
		margin: 8px auto 0;
		border-bottom: 1px solid #8a6d2e;
	}
	.dish {
		margin: 16px 0;
		break-inside: avoid;
	}
	.name {
		font-family: var(--display);
		font-size: 21px;
		font-weight: 600;
	}
	.desc {
		font-style: italic;
		color: #5a5343;
		font-size: 14px;
		margin-top: 3px;
		max-width: 48ch;
		margin-inline: auto;
	}
	.date {
		font-size: 11px;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: #5a5343;
		margin-top: 36px;
	}

	.empty {
		text-align: center;
		color: var(--muted);
		font-style: italic;
		padding: 60px 0;
	}

	@media print {
		.page {
			padding: 0;
			max-width: none;
		}
		.gm {
			box-shadow: none;
			padding: 40px 10px;
		}
	}
</style>
