<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';

	let { data } = $props();

	const COURSE_ORDER = ['Starter', 'Salad', 'Soup', 'Main', 'Side', 'Bread', 'Dessert', 'Drink'];

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

	// The date is stamped client-side. During prerender there is no "tonight" —
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

<svelte:head><title>Guest Menu — The World Table</title></svelte:head>

<div class="page">
	<nav class="tools" data-print="hide">
		<a class="chip" href="{base}/menu">← Back to the worksheet</a>
		<button class="chip go" onclick={() => window.print()} disabled={!pinned.length}>
			Print the menu
		</button>
	</nav>

	{#if pinned.length}
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
			{#if dateline}<p class="date">{dateline}</p>{/if}
		</article>
	{:else}
		<p class="empty" data-print="hide">
			Nothing pinned yet — the guest menu sets itself from the dishes on your worksheet.
		</p>
	{/if}
</div>

<style>
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
		background: var(--turmeric);
		border-color: var(--turmeric);
		color: var(--paper);
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* The card itself is always ink-on-white — it is a physical object being
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
