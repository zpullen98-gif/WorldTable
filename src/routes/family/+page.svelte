<script lang="ts">
	import { base } from '$app/paths';
	import { COURSES, formatTime, recipeHref } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import {
		buildFamilyRecipe,
		validateDraft,
		FAMILY_TECHNIQUE_MAX,
		type FamilyDraft
	} from '$lib/authoring';
	import type { Course, Difficulty } from '$lib/types';
	import Ornament from '$lib/components/Ornament.svelte';

	let { data } = $props();

	const blank = (): FamilyDraft => ({
		name: '',
		chapter: 'Family',
		course: 'Main' as Course,
		difficulty: 2 as Difficulty,
		minutes: 45,
		// Blank, and blank stays valid: absent means nobody said.
		serves: null,
		vegetarian: false,
		ingredients: '',
		method: '',
		techniques: [],
		tip: ''
	});

	let draft = $state(blank());

	/**
	 * The techniques offered are ONLY the 26 that have a standard written.
	 *
	 * Bounding the list to those does two things at once: it keeps the picker
	 * short enough to read, and it guarantees a tick means something: a tick
	 * resolving to no standard would leave the dish exactly where it started,
	 * recorded as cooked and nothing more. Rarest first, so the most telling
	 * ones are not buried under Searing.
	 */
	const offered = $derived(
		[...data.standards].sort((a, b) => a.recipeCount - b.recipeCount)
	);
	const atCap = $derived(draft.techniques.length >= FAMILY_TECHNIQUE_MAX);

	function toggleTechnique(slug: string) {
		if (draft.techniques.includes(slug)) {
			draft.techniques = draft.techniques.filter((x) => x !== slug);
		} else if (!atCap) {
			draft.techniques = [...draft.techniques, slug];
		}
	}
	let msg = $state('');

	function save() {
		const problem = validateDraft(draft);
		if (problem) {
			msg = problem;
			return;
		}
		const recipe = buildFamilyRecipe(
			$state.snapshot(draft),
			session.familyRecipes,
			data.pantry,
			data.standards
		);
		session.addFamilyRecipe(recipe);
		msg = `“${recipe.name}” is in the guide, filed under ${recipe.chapter}.`;
		draft = blank();
	}

	function remove(slug: string, name: string) {
		if (confirm(`Remove “${name}” from the guide? Its notes stay until you clear them.`)) {
			session.removeFamilyRecipe(slug);
		}
	}
</script>

<svelte:head><title>The Family Chapter: The World Table</title></svelte:head>

<div class="shell view">
	<!-- A way out, which this page did not have: its only links are into
	     individual family recipes, and those do not exist until the feature has
	     been used. A cook who arrived and added nothing could leave only by the
	     mode bar, whose lit tab is Library, a page that until now did not link
	     back here either. -->
	<nav class="crumbs" data-print="hide">
		<a href="{base}/recipes">The Library</a> · <span>The Family Chapter</span>
	</nav>
	<header class="head">
		<h1>The Family Chapter</h1>
		<p class="lede">
			The recipes that never made it into any book: Nonna’s Sunday sauce, the church-cookbook
			casserole, the thing your father makes without measuring. Added here, they behave like any
			other page of the guide: they appear in the grid, match in the pantry, pin to menus, and cook
			in cook mode. Kept on this device; export a session file from My Menu to carry them.
		</p>
	</header>

	<div class="cols">
		<form
			class="famform"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label>
				<span class="sec">Dish name</span>
				<input bind:value={draft.name} placeholder="e.g. Nonna’s Sunday Sauce" required />
			</label>

			<div class="row">
				<label>
					<span class="sec">Chapter</span>
					<input bind:value={draft.chapter} placeholder="Family" />
				</label>
				<label>
					<span class="sec">Course</span>
					<select bind:value={draft.course}>
						{#each COURSES as c (c)}<option value={c}>{c}</option>{/each}
					</select>
				</label>
				<label>
					<span class="sec">Difficulty</span>
					<select bind:value={draft.difficulty}>
						<option value={1}>Easy</option>
						<option value={2}>Intermediate</option>
						<option value={3}>Advanced</option>
					</select>
				</label>
				<label class="mins">
					<span class="sec">Minutes</span>
					<input type="number" min="1" bind:value={draft.minutes} />
				</label>
				<!-- Optional on purpose: left blank, the dish simply does not claim a
				     yield, which is what every guide recipe now does. -->
				<label class="mins">
					<span class="sec">Serves</span>
					<input type="number" min="1" bind:value={draft.serves} placeholder="—" />
				</label>
			</div>

			<label class="chip veg">
				<input type="checkbox" bind:checked={draft.vegetarian} /> Vegetarian
			</label>

			<label>
				<span class="sec">Ingredients: one per line</span>
				<textarea
					bind:value={draft.ingredients}
					rows="7"
					placeholder="400g spaghetti&#10;FOR THE SAUCE&#10;2 cans San Marzano tomatoes&#10;…"
				></textarea>
			</label>

			<label>
				<span class="sec">Method: one step per line</span>
				<textarea
					bind:value={draft.method}
					rows="7"
					placeholder="Brown the meat hard; don’t crowd the pan.&#10;Simmer 45 min, partially covered.&#10;…"
				></textarea>
			</label>

			<fieldset class="tech">
				<legend class="sec">What it is judged on</legend>
				<p class="techhint">
					Pick up to {FAMILY_TECHNIQUE_MAX} techniques this dish exercises. The two most telling
					are what cook mode grades the plate against: without them the app can only record
					that it was cooked.
				</p>
				<div class="techlist">
					{#each offered as t (t.slug)}
						{@const on = draft.techniques.includes(t.slug)}
						<label class="techopt" class:on>
							<input
								type="checkbox"
								checked={on}
								disabled={!on && atCap}
								onchange={() => toggleTechnique(t.slug)}
							/>
							<span>{t.label}</span>
						</label>
					{/each}
				</div>
				{#if atCap}
					<p class="techhint">
						That is {FAMILY_TECHNIQUE_MAX}: untick one to choose another.
					</p>
				{/if}
			</fieldset>

			<label>
				<span class="sec">From the pass: the family secret</span>
				<input bind:value={draft.tip} placeholder="What the card in the drawer says that the book never did" />
			</label>

			<div class="acts">
				<button type="submit" class="chip go">Add to the guide</button>
				{#if msg}<p class="msg" aria-live="polite">{msg}</p>{/if}
			</div>
		</form>

		<aside class="shelfed">
			<h2 class="sec">On the shelf ({session.familyRecipes.length})</h2>
			{#if session.familyRecipes.length}
				<ul>
					{#each session.familyRecipes as r (r.slug)}
						<li>
							<a href="{base}{recipeHref(r)}">{r.name}</a>
							<span class="meta">{r.chapter} · {formatTime(r.minutes)}</span>
							<button class="unpin" onclick={() => remove(r.slug, r.name)} title="Remove">✕</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty">Nothing yet: the drawer is open.</p>
			{/if}
			<Ornament seed="family-chapter" />
		</aside>
	</div>
</div>

<style>
	/* Same as the crumb rows on /technique/[slug] and /service/[topic]. */
	.crumbs {
		font-size: var(--t-micro);
		color: var(--muted);
		margin-bottom: 12px;
	}

	.tech {
		border: 0;
		padding: 0;
		margin: 0;
	}
	.techhint {
		margin: 4px 0 8px;
		color: var(--ink-soft);
		font-size: var(--t-small, 0.8125rem);
		line-height: 1.5;
	}
	.techlist {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 2px 14px;
	}
	/* 44px rows: this is filled in on a phone, in a kitchen. */
	.techopt {
		display: flex;
		gap: 8px;
		align-items: center;
		min-height: 44px;
		cursor: pointer;
	}
	.techopt.on {
		font-weight: 600;
	}
	.techopt input:disabled + span {
		color: var(--muted);
	}
	.view {
		/* padding-BLOCK: the old `padding: 26px 0 80px` shorthand zeroed the
		   inline padding and beat .shell's 20px gutter - text on the glass. */
		padding-block: 26px 80px;
		max-width: 1000px;
	}
	.head h1 {
		font-size: var(--t-h2);
		margin-bottom: 8px;
	}

	.cols {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 34px;
		margin-top: 24px;
	}
	@media (max-width: 760px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}

	.famform {
		display: grid;
		gap: 14px;
	}
	.famform label {
		display: grid;
		gap: 6px;
	}
	.row {
		display: grid;
		/* FIVE tracks: item 19 added the Serves control and forgot the column, so
		   the field wrapped alone onto a second row at desktop. */
		grid-template-columns: 1.4fr 1fr 1fr 0.7fr 0.7fr;
		gap: 10px;
	}
	@media (max-width: 560px) {
		.row {
			/* minmax(0,1fr), not 1fr: a bare fr floors at the track's min-content,
			   and the inputs' intrinsic width is 163px - two of those plus the gap
			   is 336px in a 280px box. The form scrolled sideways at 320. */
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}

	.sec {
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
	}

	input,
	select,
	textarea {
		/* The load-bearing half of the 320px fix: a grid item refuses to shrink
		   below its content's min-width, and a number input's intrinsic minimum
		   is ~163px. Without this the minmax(0,1fr) tracks above still overflow. */
		min-width: 0;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 9px 12px;
		font-size: 15px;
	}
	textarea {
		resize: vertical;
		line-height: 1.55;
	}

	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 8px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
	}
	.chip.veg {
		display: flex;
		gap: 8px;
		align-items: center;
		justify-self: start;
	}
	.chip.veg input {
		accent-color: var(--leaf);
	}
	.chip.go {
		background: var(--accent-solid);
		border-color: var(--accent-solid);
		color: var(--on-accent);
		font-weight: 600;
	}

	.acts {
		display: flex;
		gap: 14px;
		align-items: center;
		flex-wrap: wrap;
	}
	.msg {
		font-size: var(--t-small);
		color: var(--turmeric-deep);
		font-style: italic;
	}

	.shelfed h2 {
		border-bottom: 1px solid var(--line);
		padding-bottom: 6px;
		margin-bottom: 10px;
		font-weight: 500;
	}
	.shelfed ul {
		list-style: none;
		display: grid;
		gap: 6px;
	}
	.shelfed li {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.shelfed a {
		font-family: var(--display);
		font-size: 17px;
		text-decoration: none;
	}
	.shelfed a:hover {
		color: var(--turmeric-deep);
	}
	.meta {
		font-size: var(--t-micro);
		color: var(--muted);
	}
	.unpin {
		margin-left: auto;
		background: none;
		border: 0;
		cursor: pointer;
		color: var(--muted);
	}
	.unpin:hover {
		color: var(--chili);
	}
	.empty {
		color: var(--muted);
		font-style: italic;
	}
</style>
