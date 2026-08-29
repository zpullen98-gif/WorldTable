<script lang="ts">
	import { base } from '$app/paths';
	import type { RecipeSummary } from '$lib/types';
	import { formatTime, recipeHref } from '$lib/data';
	import { DIFFICULTY_LABEL } from '$lib/types';

	let { recipe }: { recipe: RecipeSummary } = $props();
</script>

<a class="card" href="{base}{recipeHref(recipe)}" data-slug={recipe.slug}>
	<span class="tab">{recipe.chapter}</span>
	<h3>{recipe.name}</h3>
	<p class="sub">{recipe.flavorTags.slice(0, 3).join(' · ')}</p>
	<div class="badges">
		<span class="badge d{recipe.difficulty}">{DIFFICULTY_LABEL[recipe.difficulty]}</span>
		<span class="badge">{formatTime(recipe.minutes)}</span>
		{#if recipe.diet.vegetarian}<span class="badge veg">Vegetarian</span>{/if}
		{#if recipe.source === 'family'}<span class="badge fam">Family</span>{/if}
	</div>
</a>

<style>
	/* The index-card signature: a ruled header band with a punched tab. */
	.card {
		position: relative;
		display: block;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 38px 16px 14px;
		text-decoration: none;
		color: var(--ink);
		box-shadow: var(--shadow-card);
		transition:
			transform 0.12s ease,
			border-color 0.12s ease;

		/* Off-screen cards keep their DOM node, so find-in-page, print and the
		   accessibility tree all still see 970 recipes, but cost no layout or
		   paint. This is why the grid needs no virtualisation. */
		content-visibility: auto;
		contain-intrinsic-size: auto 172px;
	}
	.card:hover {
		transform: translateY(-2px);
		border-color: var(--turmeric);
	}

	.card::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 26px;
		border-bottom: 1px dashed var(--line);
		background: repeating-linear-gradient(
			90deg,
			transparent 0 6px,
			color-mix(in srgb, var(--turmeric) 12%, transparent) 6px 12px
		);
	}

	.tab {
		position: absolute;
		top: 5px;
		left: 12px;
		right: 12px;
		font-size: 10.5px;
		letter-spacing: var(--tracking-tab);
		text-transform: uppercase;
		color: var(--turmeric-deep);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	h3 {
		font-size: var(--t-h4);
		font-weight: 600;
		line-height: 1.25;
		margin-bottom: 6px;
	}

	.sub {
		font-size: var(--t-small);
		color: var(--muted);
		margin-bottom: 10px;
		min-height: 2.6em;
		font-style: italic;
	}

	.badges {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		font-size: 11px;
	}
	.badge {
		border: 1px solid var(--line);
		padding: 2px 7px;
		border-radius: var(--radius);
		color: var(--muted);
		font-variant-numeric: oldstyle-nums;
	}
	.badge.d1 {
		color: var(--leaf);
		border-color: var(--leaf);
	}
	.badge.d2 {
		color: var(--turmeric-deep);
		border-color: var(--turmeric);
	}
	.badge.d3 {
		color: var(--chili);
		border-color: var(--chili);
	}
	.badge.veg {
		color: var(--leaf);
	}
	.badge.fam {
		color: var(--turmeric-deep);
		border-color: var(--turmeric-deep);
	}
</style>
