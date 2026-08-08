<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug, formatTime, recipeHref, recipes, TOTALS } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import { buildExport, download, parseImport, describeImport } from '$lib/persistence/portable';
	import Ornament from '$lib/components/Ornament.svelte';

	let { data } = $props();

	const COURSE_ORDER = ['Starter', 'Salad', 'Soup', 'Main', 'Side', 'Bread', 'Dessert', 'Drink'];

	// Pins resolve against the guide AND the family shelf. bySlug alone would
	// silently drop a pinned family recipe from every list on this page.
	const famBySlug = $derived(new Map(session.familyRecipes.map((r) => [r.slug, r])));
	const pinned = $derived(
		session.menu.map((s) => bySlug.get(s) ?? famBySlug.get(s)).filter(Boolean)
	);

	// Ingredient and step lookups with the same two-source resolution: guide
	// recipes from the prerendered maps, family recipes from their own record.
	const ingredientsOf = (slug: string): string[] =>
		data.ingredients[slug] ??
		famBySlug
			.get(slug)
			?.ingredients.filter((e) => e.kind === 'item')
			.map((e) => (e as { kind: 'item'; text: string }).text) ??
		[];
	const stepsOf = (slug: string) => data.steps[slug] ?? famBySlug.get(slug)?.steps ?? [];

	const stats = $derived.by(() => {
		const list = pinned;
		if (!list.length) return null;
		return {
			dishes: list.length,
			minutes: list.reduce((n, r) => n + r!.minutes, 0),
			vegetarian: list.filter((r) => r!.diet.vegetarian).length,
			chapters: new Set(list.map((r) => r!.chapter)).size,
			hardest: Math.max(...list.map((r) => r!.difficulty))
		};
	});

	const courses = $derived(
		COURSE_ORDER.map((c) => ({ course: c, items: pinned.filter((r) => r!.course === c) })).filter(
			(g) => g.items.length
		)
	);

	/* ---- shopping list, one implementation ------------------------------ *
	 * The original had two: a per-dish version at L2973 that was completely
	 * overwritten by the aisle-grouped one at L3347, leaving seven lines of dead
	 * code behind. This is the aisle-grouped one, and it is the only one.
	 */
	const AISLES: Array<[string, RegExp]> = [
		['Produce', /onion|garlic|carrot|celery|tomato|potato|pepper|herb|parsley|cilantro|basil|mint|lemon|lime|ginger|scallion|cabbage|spinach|mushroom|avocado|cucumber|corn|apple|leek|shallot/i],
		['Meat & Fish', /beef|pork|lamb|chicken|turkey|duck|bacon|sausage|fish|salmon|tuna|shrimp|prawn|crab|clam|mussel|anchov|cod/i],
		['Dairy & Cold', /milk|cream|butter|cheese|yogurt|egg|parmigiano|pecorino|mozzarella|ricotta|crema/i],
		['Dry & Pantry', /flour|sugar|rice|pasta|noodle|bean|lentil|stock|broth|oil|vinegar|soy|sauce|paste|can |tin |honey|syrup/i],
		['Spice Rack', /salt|pepper|cumin|coriander|paprika|cinnamon|chili|chile|saffron|turmeric|oregano|thyme|bay|clove|cardamom|nutmeg|seed/i],
		['Wine & Bar', /wine|beer|brandy|rum|whisk|sherry|mirin|sake|vermouth|port/i]
	];

	function aisleFor(line: string): string {
		for (const [name, re] of AISLES) if (re.test(line)) return name;
		return 'Everything Else';
	}

	const shoppingList = $derived.by(() => {
		const byAisle = new Map<string, Array<{ line: string; from: string }>>();
		for (const r of pinned) {
			for (const line of ingredientsOf(r!.slug)) {
				const aisle = aisleFor(line);
				if (!byAisle.has(aisle)) byAisle.set(aisle, []);
				byAisle.get(aisle)!.push({ line, from: r!.name });
			}
		}
		const order = [...AISLES.map(([n]) => n), 'Everything Else'];
		return order.filter((a) => byAisle.has(a)).map((a) => ({ aisle: a, items: byAisle.get(a)! }));
	});

	// Checks are stored against a hash of the menu, so changing the menu doesn't
	// leave stale ticks attached to lines that are no longer on the list.
	const menuHash = $derived([...session.menu].sort().join('|'));

	/* ---- service timeline ---------------------------------------------- */
	const timeline = $derived.by(() =>
		pinned
			.map((r) => ({
				name: r!.name,
				slug: r!.slug,
				// A step with no stated duration gets the original's 4-minute default,
				// but here the UI knows it was a default rather than a measurement.
				total: stepsOf(r!.slug).reduce((n, s) => n + (s.durationSec ?? 240) / 60, 0),
				stated: stepsOf(r!.slug).some((s) => s.durationSec !== null)
			}))
			.sort((a, b) => b.total - a.total)
	);

	/* ---- cellar --------------------------------------------------------- */
	let bottle = $state('');

	/* ---- import / export ------------------------------------------------ */
	let importMsg = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	function doExport() {
		download(buildExport(session.snapshot(), TOTALS.recipes));
	}

	async function doImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			const text = await file.text();

			if (text.trim().startsWith('WT1.')) {
				// A session code from the ORIGINAL app, saved to a text file. Its
				// menu and notes are keyed by array index, so the importer resolves
				// them against recipe order and names what it cannot place instead
				// of dropping it silently.
				const [{ importLegacyCode }, { loadPantry }] = await Promise.all([
					import('$lib/persistence/migrations'),
					import('$lib/data')
				]);
				const pantryLabels = new Set(
					(await loadPantry()).flatMap((g) => g.items.map((it) => it.label))
				);
				const { state, unresolved } = importLegacyCode(
					text,
					recipes.map((r) => r.slug),
					pantryLabels
				);
				const summary = describeImport(state, session.snapshot());
				session.merge(state);
				importMsg =
					`Imported from the original edition — ${summary}.` +
					(unresolved.length
						? ` Could not place ${unresolved.length}: ${unresolved.slice(0, 3).join(', ')}${unresolved.length > 3 ? '…' : ''}`
						: '');
				return;
			}

			const parsed = parseImport(text);
			const summary = describeImport(parsed.data, session.snapshot());
			session.merge(parsed.data);
			importMsg = `Imported — ${summary}.`;
		} catch (err) {
			importMsg = err instanceof Error ? err.message : 'That file could not be read.';
		} finally {
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<svelte:head><title>My Menu — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>My Menu</h1>
		<p class="lede">
			Pin dishes from any recipe to draft a menu. The worksheet tracks course balance, vegetarian
			coverage and prep load, then builds a consolidated shopping list.
		</p>
	</header>

	<div class="tools" data-print="hide">
		<button class="chip" onclick={doExport} disabled={!session.menu.length && !session.pantry.length}
			>Export session</button
		>
		<button class="chip" onclick={() => fileInput?.click()}>Import session…</button>
		<input
			bind:this={fileInput}
			type="file"
			accept=".wtjson,.txt,application/json,text/plain"
			onchange={doImport}
			hidden
		/>
		<button class="chip" onclick={() => window.print()}>Print</button>
		<a class="chip" href="{base}/menu/guest">Guest menu ▸</a>
		{#if session.menu.length}
			<button class="chip" onclick={() => session.clearMenu()}>Clear menu</button>
		{/if}
	</div>
	{#if importMsg}<p class="msg" aria-live="polite">{importMsg}</p>{/if}

	{#if !stats}
		<p class="empty">
			Nothing pinned yet — open any recipe and tap “Add to menu”. A balanced draft usually wants a
			starter or two, mains with a vegetarian option, a side, and one dessert.
		</p>
	{:else}
		<dl class="stats">
			<div><dt>Dishes</dt><dd>{stats.dishes}</dd></div>
			<div><dt>Total time</dt><dd>{formatTime(stats.minutes)}</dd></div>
			<div><dt>Vegetarian</dt><dd>{stats.vegetarian}</dd></div>
			<div><dt>Chapters</dt><dd>{stats.chapters}</dd></div>
		</dl>

		{#each courses as g (g.course)}
			<section class="course">
				<h2 class="sec">{g.course === 'Main' ? 'Mains' : g.course + 's'}</h2>
				<ul>
					{#each g.items as r (r!.slug)}
						<li>
							<a href="{base}{recipeHref(r!)}">{r!.name}</a>
							<span class="meta">{r!.chapter} · {formatTime(r!.minutes)}</span>
							<button class="unpin" onclick={() => session.togglePin(r!.slug)} title="Remove">✕</button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		<section class="shopping">
			<Ornament seed={menuHash} />
			<h2 class="sec">The Shopping List</h2>
			<p class="hint" data-print="hide">Ticks are saved with this menu.</p>
			{#each shoppingList as a (a.aisle)}
				<div class="aisle">
					<h3 class="eyebrow">{a.aisle}</h3>
					<ul>
						{#each a.items as it, i (a.aisle + i)}
							{@const id = `${a.aisle}:${i}`}
							{@const isChecked = session.checked(menuHash).includes(id)}
							<li class:checked={isChecked}>
								<label>
									<input
										type="checkbox"
										checked={isChecked}
										onchange={() => session.toggleChecked(menuHash, id)}
									/>
									<span class="line">{it.line}</span>
									<span class="from">{it.from}</span>
								</label>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</section>

		<section class="timeline">
			<h2 class="sec">Service Timeline</h2>
			<p class="hint">Longest first — start at the top and work down.</p>
			<ol>
				{#each timeline as t (t.slug)}
					<li>
						<span class="nm">{t.name}</span>
						<span class="mins">
							{Math.round(t.total)} min
							{#if !t.stated}<em title="No durations stated in the method">estimated</em>{/if}
						</span>
					</li>
				{/each}
			</ol>
		</section>

		<section class="cellar" data-print="hide">
			<h2 class="sec">The Cellar — cook to the bottle</h2>
			<select bind:value={bottle} class="chip">
				<option value="">Choose what’s already open…</option>
				{#each data.cellar as b (b.slug)}<option value={b.name}>{b.name}</option>{/each}
			</select>
			{#if bottle}
				{@const note = data.cellar.find((b) => b.name === bottle)?.note}
				{#if note}<p class="bottlenote">{note}</p>{/if}
			{/if}
		</section>
	{/if}
</div>

<style>
	.view { padding: 26px 0 80px; max-width: 900px; }
	.head h1 { font-size: var(--t-h2); margin-bottom: 8px; }
	.tools { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 10px; }
	.chip {
		border: 1px solid var(--line); background: var(--card); padding: 8px 14px;
		border-radius: var(--radius); cursor: pointer; font-size: 14px;
	}
	.chip:hover:not(:disabled) { border-color: var(--turmeric); }
	a.chip { text-decoration: none; color: var(--ink); display: inline-flex; align-items: center; }
	.chip:disabled { opacity: 0.45; cursor: default; }
	select.chip { appearance: none; max-width: 280px; }
	.msg { font-size: var(--t-small); color: var(--turmeric-deep); margin-bottom: 10px; }

	.stats { display: flex; flex-wrap: wrap; gap: 26px; border-block: 1px solid var(--line); padding: 14px 0; margin: 14px 0 24px; }
	.stats dt { font-size: var(--t-micro); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
	.stats dd { font-family: var(--display); font-size: 24px; color: var(--turmeric-deep); font-variant-numeric: oldstyle-nums; }

	.sec {
		font-family: var(--text); font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line);
		padding-bottom: 5px; margin: 26px 0 10px; font-weight: 500;
	}
	.hint { font-size: var(--t-micro); color: var(--muted); font-style: italic; margin: -4px 0 8px; }

	.course ul, .shopping ul, .timeline ol { list-style: none; }
	.course li { display: flex; gap: 10px; align-items: baseline; padding: 4px 0; }
	.course a { font-family: var(--display); font-size: 18px; text-decoration: none; }
	.course .meta { font-size: var(--t-micro); color: var(--muted); }
	.unpin { margin-left: auto; background: none; border: 0; cursor: pointer; color: var(--muted); }
	.unpin:hover { color: var(--chili); }

	.aisle { margin-bottom: 14px; break-inside: avoid; }
	.aisle label { display: flex; gap: 8px; align-items: baseline; cursor: pointer; padding: 2px 0; }
	.aisle input { accent-color: var(--leaf); }
	.aisle .line { font-size: 14.5px; }
	.aisle .from { font-size: var(--t-micro); color: var(--muted); margin-left: auto; white-space: nowrap; }
	.aisle li.checked .line { text-decoration: line-through; color: var(--muted); }

	.timeline li { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px dotted var(--line); }
	.timeline .nm { font-family: var(--display); font-size: 17px; }
	.timeline .mins { font-size: var(--t-small); color: var(--muted); font-variant-numeric: oldstyle-nums; }
	.timeline em { font-style: italic; opacity: 0.7; margin-left: 4px; }

	.bottlenote { margin-top: 10px; font-style: italic; color: var(--ink-soft); max-width: var(--measure); }
	.empty { padding: 60px 20px; text-align: center; color: var(--muted); font-style: italic; }
</style>
