<script lang="ts">
	import { base } from '$app/paths';
	import { bySlug } from '$lib/data';
	import { session } from '$lib/stores/session.svelte';
	import Ornament from '$lib/components/Ornament.svelte';

	let { data } = $props();

	// Progress is real, because the cooked log now persists.
	const cooked = $derived(new Set(session.cookedLog.map((e) => e.slug)));

	/* How many times each dish has been made. The tick used to be the whole
	   story, which made a dish cooked once look identical to one cooked five
	   times — and now that un-ticking removes only the MOST RECENT cook (see
	   session.toggleCooked), a bare ✓ that needed four taps to clear would be
	   baffling. The count says why. */
	const times = $derived.by(() => {
		const m = new Map<string, number>();
		for (const e of session.cookedLog) m.set(e.slug, (m.get(e.slug) ?? 0) + 1);
		return m;
	});
	const total = $derived(data.study.reduce((n, s) => n + s.recipes.length, 0));
	const done = $derived(
		data.study.reduce((n, s) => n + s.recipes.filter((r) => cooked.has(r)).length, 0)
	);
</script>

<svelte:head><title>The Path of Study — The World Table</title></svelte:head>

<div class="shell view">
	<header class="head">
		<h1>The Path of Study</h1>
		<p class="lede">
			A guided curriculum — ten semesters from first omelette to restaurateur’s capstone. Each
			course lists its dishes in teaching order and the Lexicon reading that explains <i>why</i> they
			work. Cook in sequence; the techniques compound.
		</p>
		<p class="progress" aria-live="polite">{done} of {total} dishes marked cooked</p>
	</header>

	<ol class="semesters">
		{#each data.study as s (s.n)}
			<li class="semester">
				<p class="eyebrow">Semester {s.n}</p>
				<h2>{s.title}</h2>
				<p class="desc">{s.description}</p>

				<h3 class="sec">Dishes, in teaching order</h3>
				<ul class="dishes">
					{#each s.recipes as slug (slug)}
						{@const r = bySlug.get(slug)}
						{#if r}
							{@const n = times.get(slug) ?? 0}
							<li class:done={cooked.has(slug)}>
								<a href="{base}/recipe/{slug}">{r.name}</a>
								<button
									class="mark"
									aria-pressed={n > 0}
									onclick={() => session.toggleCooked(slug)}
									aria-label={n === 0
										? `Mark ${r.name} as cooked`
										: n === 1
											? `${r.name} cooked once — tap to undo`
											: `${r.name} cooked ${n} times — tap to remove the most recent`}
									title={n === 0
										? 'Mark as cooked'
										: n === 1
											? 'Cooked once — tap to undo'
											: `Cooked ${n} times — tap to remove the most recent`}
								>
									{n === 0 ? '○' : n === 1 ? '✓' : n}
								</button>
							</li>
						{/if}
					{/each}
				</ul>

				{#if s.skills.length}
					<h3 class="sec">The skills it drills</h3>
					<p class="skills">
						{#each s.skills as k (k.slug)}
							<a href="{base}/technique/{k.slug}">
								{k.label}<span class="w">{k.dishes}</span>
							</a>
						{/each}
					</p>
				{/if}

				{#if s.terms.length}
					<h3 class="sec">The reading</h3>
					<p class="terms">
						{#each s.terms as t (t)}
							<a href="{base}/lexicon#{t}">{data.termName[t] ?? t}</a>
						{/each}
					</p>
				{/if}
			</li>
		{/each}
	</ol>

	<section class="filmroom">
		<Ornament seed="screening-room" />
		<h2>The Screening Room</h2>
		<p class="lede">
			Twelve films worth studying frame by frame — a canon of technique on camera. Every recipe in
			the guide also carries its own <em>Film school</em> links.
		</p>
		<div class="reel">
			{#each data.films as f (f.url)}
				<a class="filmcard" href={f.url} target="_blank" rel="noopener">
					<span class="eyebrow">{f.kind}</span>
					<h3>{f.title}</h3>
					<p>{f.blurb}</p>
				</a>
			{/each}
		</div>
	</section>
</div>

<style>
	.view {
		padding: 26px 0 80px;
	}
	.head h1 {
		font-size: var(--t-h2);
		margin-bottom: 8px;
	}
	.progress {
		margin-top: 10px;
		font-size: var(--t-small);
		color: var(--turmeric-deep);
		font-variant-numeric: oldstyle-nums;
	}

	.semesters {
		list-style: none;
		display: grid;
		gap: 18px;
		margin-top: 26px;
	}
	.semester {
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric);
		border-radius: var(--radius);
		background: var(--card);
		padding: 18px 20px;
	}
	.semester h2 {
		font-size: var(--t-h3);
		margin: 3px 0 8px;
	}
	.desc {
		color: var(--ink-soft);
		max-width: var(--measure);
	}

	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 16px 0 8px;
		font-weight: 500;
	}

	.dishes {
		list-style: none;
		display: grid;
		gap: 3px;
	}
	.dishes li {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.dishes a {
		text-decoration: none;
		font-size: 15.5px;
	}
	.dishes a:hover {
		color: var(--turmeric-deep);
	}
	.dishes li.done a {
		color: var(--muted);
		text-decoration: line-through;
		text-decoration-color: var(--line-strong);
	}
	.mark {
		background: none;
		border: 0;
		cursor: pointer;
		color: var(--turmeric-deep);
		font-size: 13px;
		padding: 0 2px;
	}

	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.skills a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: var(--t-small);
		color: var(--ink-soft);
		text-decoration: none;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 3px 5px 3px 8px;
		min-height: 26px;
	}
	.skills a:hover {
		border-color: var(--turmeric);
		color: var(--ink);
	}
	/* The weight: how many of this semester's dishes drill the skill. It is the
	   whole point of deriving these — it shows where a semester really leans. */
	.skills .w {
		font-size: var(--t-micro);
		color: var(--muted);
		border-left: 1px solid var(--line);
		padding-left: 6px;
		font-variant-numeric: tabular-nums;
	}

	.terms {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.terms a {
		font-size: var(--t-small);
		color: var(--turmeric-deep);
		text-decoration: none;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 2px 8px;
	}
	.terms a:hover {
		border-color: var(--turmeric);
	}

	.filmroom {
		margin-top: 44px;
		border-top: 1px solid var(--line);
		padding-top: 10px;
	}
	.filmroom h2 {
		font-size: var(--t-h3);
		margin-bottom: 6px;
	}
	.reel {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
		margin-top: 16px;
	}
	.filmcard {
		display: block;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 12px 14px;
		text-decoration: none;
		background: var(--card);
	}
	.filmcard:hover {
		border-color: var(--turmeric-deep);
	}
	.filmcard h3 {
		margin: 4px 0;
		font-size: 15.5px;
	}
	.filmcard p {
		font-size: 12.5px;
		color: var(--muted);
		line-height: 1.45;
	}
</style>
