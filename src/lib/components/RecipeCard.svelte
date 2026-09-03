<script lang="ts">
	import { base } from '$app/paths';
	import type { RecipeSummary } from '$lib/types';
	import { formatTime, recipeHref } from '$lib/data';
	import { DIFFICULTY_LABEL, ADVANCE_MIN } from '$lib/types';

	/**
	 * h3 by default, one level below RecipeBrowser's own h2 - which is
	 * itself one level below the page's h1 on /recipes. On a chapter page
	 * RecipeBrowser's heading IS the page's h1 (see its headingLevel prop),
	 * so a card staying at h3 there would skip h2 entirely; RecipeBrowser
	 * passes headingLevel="h2" down to every card it renders in that case.
	 */
	let {
		recipe,
		headingLevel = 'h3'
	}: { recipe: RecipeSummary; headingLevel?: 'h2' | 'h3' } = $props();
</script>

<a class="card" href="{base}{recipeHref(recipe)}" data-slug={recipe.slug}>
	<span class="tab">{recipe.chapter}</span>
	<!-- Two static branches, not <svelte:element this={headingLevel}>: this
	     card renders up to 1844 times on /recipes (the h3 default), and a
	     dynamic element forces Svelte to resolve the tag at runtime on every
	     one of them instead of compiling a fixed tag - measurably slower to
	     hydrate at that count, which is exactly the render this project has
	     an established rule against re-slowing (content-visibility exists on
	     this same file for the identical reason). -->
	{#if headingLevel === 'h2'}
		<h2>{recipe.name}</h2>
	{:else}
		<h3>{recipe.name}</h3>
	{/if}
	<p class="sub">{recipe.flavorTags.slice(0, 3).join(' · ')}</p>
	<div class="badges">
		<span class="badge d{recipe.difficulty}">{DIFFICULTY_LABEL[recipe.difficulty]}</span>
		<span class="badge">{formatTime(recipe.minutes)}</span>
		<!-- The time badge is ACTIVE minutes, so on its own it reads as a promise
		     the dish cannot keep: Guanciale is thirty minutes of work and five
		     weeks of hanging. Quote the method's own words rather than rounding
		     them into a number the recipe never says. -->
		{#if (recipe.advanceMin ?? 0) >= ADVANCE_MIN && recipe.advancePhrase}
			<span class="badge plan">plus {recipe.advancePhrase}</span>
		{/if}
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
		   accessibility tree all still see every recipe on screen, but cost no
		   layout or paint. This is why the grid needs no virtualisation. */
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

	:is(h2, h3) {
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
	/* Dashed, because it is not a property of the dish the way Vegetarian is:
	   it is a warning about the calendar, and it should read as attached to the
	   time badge beside it rather than as another label. */
	.badge.plan {
		border-style: dashed;
		border-color: var(--turmeric);
		color: var(--turmeric-deep);
	}
</style>
