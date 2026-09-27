<!--
  One plate.

  The picture first, in a box of its own proportions so the page does not
  jump while it arrives; it is fetched on demand and kept by the worker
  afterwards. A link opens it at full size for the small print. Then, right
  under the picture, WHAT THE PLATE GETS WRONG, when it does: the plate is a
  drawing that was generated, and a poster that teaches a wrong fact to a
  new hire is worse than no poster, so the corrections sit where the eye
  lands after the picture, not in a footnote.

  Then the transcription, the whole plate as text: every card with its facts
  as the plate prints them, linked to the deck card and the Lexicon entry
  where one exists; the side panels; the words printed around the edge. It
  is the plate for a screen reader, for search, and for a reader whose
  picture has not arrived.

  Last, the quiz: eight questions drawn from the plate, options and all, so
  a right answer proves the plate was read. Nothing is recorded, and the
  page says so; the ladders belong to the deck and the Lexicon, which grade
  what they ask.

  Headings: h1, then h2 for the four parts, h3 for a cut chart's primal
  groups. Items are list rows, not headings: forty h4s would drown the
  outline the way 779 h2s once drowned the Lexicon's.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { NUMERAL } from '$lib/levels';
	import { PLATE_QUIZ_LENGTH, displayName, plateHref, plateQuiz, type PlateQuestion } from '$lib/plates';

	let { data } = $props();
	const plate = $derived(data.plate);

	const facts = (item: { facts: Array<[string, string]> }) => item.facts.filter((f) => f[1].trim());
	const edge = $derived([plate.tagline, ...plate.corners, plate.regionLine, plate.footer].filter((s): s is string => Boolean(s)));

	/* ---- the quiz: in memory, never stored ---- */
	let questions = $state<PlateQuestion[]>([]);
	let at = $state(0);
	let picked = $state<string | null>(null);
	let right = $state(0);
	let missed = $state<Array<{ about: string; answer: string }>>([]);
	let finished = $state(false);
	let announce = $state('');
	const q = $derived(questions[at] ?? null);

	function start() {
		questions = plateQuiz(plate, Math.random);
		at = 0;
		picked = null;
		right = 0;
		missed = [];
		finished = false;
		announce = questions.length ? `Question 1 of ${questions.length}.` : '';
	}
	function answer(o: string) {
		if (!q || picked) return;
		picked = o;
		if (o === q.answer) {
			right++;
			announce = 'Right.';
		} else {
			missed = [...missed, { about: q.about, answer: q.answer }];
			announce = `Not that. The plate says ${q.answer}.`;
		}
	}
	function next() {
		if (at + 1 >= questions.length) {
			finished = true;
			announce = `Finished: ${right} of ${questions.length}.`;
			return;
		}
		at++;
		picked = null;
		announce = `Question ${at + 1} of ${questions.length}.`;
	}
	function close() {
		questions = [];
		finished = false;
		announce = '';
	}
</script>

<svelte:head><title>{plate.title} · The Plates · The World Table</title></svelte:head>

<div class="shell view">
	<nav class="crumbs"><a href="{base}/">Home</a> · <a href="{base}/plates">The Plates</a></nav>
	<p class="eyebrow">
		{plate.kindTitle}{#if data.level} · Level {NUMERAL[data.level]}{data.levelName ? `, ${data.levelName}` : ''}{/if}
	</p>
	<h1>{plate.title}</h1>
	{#if plate.tagline}<p class="lede">{plate.tagline}</p>{/if}
	<p class="stat">{plate.count} on the plate · read, never graded</p>

	<figure class="plate">
		<span class="box" style="aspect-ratio: {plate.image.width} / {plate.image.height}">
			<img
				src="{base}/{plate.image.src}"
				alt="{plate.title}: an illustrated reference plate. Its full text is transcribed below."
				width={plate.image.width}
				height={plate.image.height}
				decoding="async"
			/>
		</span>
		<figcaption>
			<a href="{base}/{plate.image.src}" target="_blank" rel="noopener">Open the plate at full size</a>
			<span class="muted">for the small print. Pinch to zoom on a phone.</span>
		</figcaption>
	</figure>

	{#if plate.corrections.length}
		<section class="corrections" aria-labelledby="corr-h">
			<h2 id="corr-h">What the plate gets wrong</h2>
			<p class="secnote">
				The picture was generated, and these are its errors of fact, checked against the kitchen and
				the Lexicon. Read the plate with them.
			</p>
			<ul>
				{#each plate.corrections as c (c.on + c.says)}
					<li>
						<strong>{c.on}</strong> <span class="says">prints “{c.says}”.</span>
						{c.should}
						<span class="why">{c.why}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="text" aria-labelledby="text-h">
		<h2 id="text-h">On the plate</h2>
		{#each plate.groups as g, gi (gi)}
			{#if g.title}
				<h3>{g.title}</h3>
				{#if g.note}<p class="gnote">{g.note}</p>{/if}
			{/if}
			<ul class="items">
				{#each g.items as it (displayName(it))}
					<li>
						<span class="name">
							{it.name}{#if it.sub}<span class="sub"> ({it.sub})</span>{/if}
							{#if it.printed}<span class="printed">printed “{it.printed}”</span>{/if}
						</span>
						{#if facts(it).length}
							<span class="facts">
								{#each facts(it) as f (f[0])}<span class="fact"><span class="flabel">{f[0]}</span> {f[1]}</span>{/each}
							</span>
						{/if}
						{#if it.links?.deck || it.links?.lexicon}
							<span class="links">
								{#if it.links.deck}<a href="{base}/service/deck/study?card={it.links.deck}">The card</a>{/if}
								{#if it.links.lexicon}<a href="{base}/lexicon#{it.links.lexicon}">The Lexicon</a>{/if}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/each}
	</section>

	{#if plate.panels.length}
		<section class="panels" aria-labelledby="panels-h">
			<h2 id="panels-h">Also on the plate</h2>
			{#each plate.panels as pan (pan.title)}
				<h3>{pan.title}</h3>
				<ul>
					{#each pan.lines as line, i (i)}<li>{line}</li>{/each}
				</ul>
			{/each}
		</section>
	{/if}

	<section class="quiz" aria-labelledby="quiz-h">
		<h2 id="quiz-h">Quiz yourself</h2>
		<p class="secnote">
			Up to {PLATE_QUIZ_LENGTH} questions drawn from the plate, answers and all. Nothing is recorded:
			the plate is a reference, and the deck and the Lexicon are where a word is graded.
		</p>
		<p class="live" aria-live="polite">{announce}</p>
		{#if finished}
			<div class="flash">
				<p class="term">{right} of {questions.length}</p>
				{#if missed.length}
					<p class="def">The plate says otherwise on:</p>
					<ul class="missed">
						{#each missed as m (m.about + m.answer)}<li><strong>{m.about}</strong>: {m.answer}</li>{/each}
					</ul>
				{:else}
					<p class="def">Every answer as the plate prints it.</p>
				{/if}
				<div class="flashtools">
					<button class="chip" onclick={start}>Again</button>
					<button class="chip" onclick={close}>Close</button>
				</div>
			</div>
		{:else if q}
			<div class="flash">
				<p class="eyebrow">Question {at + 1} of {questions.length}</p>
				<p class="def prompt">{q.prompt}</p>
				<div class="opts">
					{#each q.options as o (o)}
						<button
							class="opt"
							class:right={picked && o === q.answer}
							class:wrong={picked === o && o !== q.answer}
							disabled={!!picked && o !== picked && o !== q.answer}
							onclick={() => answer(o)}
						>
							{o}
						</button>
					{/each}
				</div>
				<div class="flashtools">
					{#if picked}
						<button class="chip go" onclick={next}>{at + 1 >= questions.length ? 'See how it went' : 'Next question'}</button>
					{/if}
					<button class="chip" onclick={close}>Close</button>
				</div>
			</div>
		{:else}
			<button class="chip go start" onclick={start}>Ask me about this plate</button>
		{/if}
	</section>

	{#if edge.length}
		<p class="edge">Printed around the edge: {edge.join(' · ')}</p>
	{/if}

	<nav class="neighbours" aria-label="Other plates">
		{#if data.prev}<a href={plateHref(base, data.prev.slug)}>Before: {data.prev.title}</a>{/if}
		<a href="{base}/plates">The wall</a>
		{#if data.next}<a href={plateHref(base, data.next.slug)}>Next: {data.next.title}</a>{/if}
	</nav>
</div>

<style>
	.view { padding-block: 26px 80px; max-width: 900px; }
	.crumbs { font-size: var(--t-small); margin-bottom: 8px; }
	.crumbs a { display: inline-block; padding-block: 10px; color: var(--muted); }
	.eyebrow {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase;
		color: var(--turmeric-deep);
	}
	h1 { font-size: var(--t-h1); margin: 4px 0 8px; }
	.lede { font-size: var(--t-lede); color: var(--ink-soft); max-width: var(--measure); }
	.stat { margin-top: 8px; font-size: var(--t-small); color: var(--muted); font-variant-numeric: tabular-nums; }

	.plate { margin: 20px 0 0; }
	.box {
		display: block; width: 100%; background: var(--paper-raised);
		border: var(--rule) solid var(--line); border-radius: var(--radius); overflow: hidden;
	}
	.box img { display: block; width: 100%; height: 100%; }
	figcaption { margin-top: 8px; font-size: var(--t-small); }
	figcaption a { color: var(--ink); display: inline-block; padding-block: 8px; text-underline-offset: 3px; }
	.muted { color: var(--muted); }

	section { margin-top: 26px; padding-top: 14px; border-top: 1px solid var(--line); }
	h2 { font-family: var(--display); font-size: var(--t-h3); margin-bottom: 4px; }
	h3 { font-family: var(--display); font-size: var(--t-h4); margin: 16px 0 2px; }
	.secnote { color: var(--ink-soft); max-width: var(--measure); font-size: var(--t-small); margin-bottom: 10px; }
	.gnote { font-size: var(--t-small); color: var(--muted); margin-bottom: 4px; }

	/* the corrections: a caution, the /service "gaps" idiom, and never a verdict colour */
	.corrections ul { list-style: none; margin: 0; padding: 0; max-width: var(--measure); }
	.corrections li {
		border-left: 2px solid var(--turmeric-deep); background: var(--paper-raised);
		padding: 10px 14px; margin: 0 0 8px; line-height: 1.45;
	}
	.corrections .says { color: var(--muted); }
	.corrections .why { display: block; margin-top: 2px; font-size: var(--t-small); color: var(--muted); }

	.items { list-style: none; margin: 0; padding: 0; }
	.items li { padding: 8px 0; border-bottom: 1px solid var(--line); line-height: 1.45; }
	.items li:last-child { border-bottom: 0; }
	.name { font-family: var(--display); font-size: var(--t-h4); }
	.sub { color: var(--muted); font-size: var(--t-body); }
	.printed { margin-left: 8px; font-size: var(--t-small); color: var(--muted); font-style: italic; }
	.facts { display: block; font-size: var(--t-small); color: var(--ink-soft); }
	.fact { margin-right: 14px; }
	.flabel {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase;
		color: var(--muted); margin-right: 4px;
	}
	.links { display: block; margin-top: 2px; font-size: var(--t-small); }
	.links a { display: inline-block; padding-block: 6px; margin-right: 14px; color: var(--ink); text-underline-offset: 3px; }

	.panels ul { margin: 0 0 6px; padding-left: 1.2em; color: var(--ink-soft); font-size: var(--t-small); }
	.panels li { padding: 2px 0; }

	.live { min-height: 1.4em; font-size: var(--t-small); color: var(--muted); }
	.start { min-height: 44px; }
	.flash {
		border: 1px solid var(--turmeric); background: var(--card);
		padding: 24px; margin-top: 8px; text-align: center; border-radius: var(--radius);
	}
	.flash .eyebrow { color: var(--muted); }
	.flash .term { font-family: var(--display); font-size: var(--t-h2); margin: 6px 0 10px; }
	.flash .def { max-width: 62ch; margin: 0 auto 14px; color: var(--ink-soft); }
	.prompt { font-family: var(--display); font-size: 20px; line-height: 1.4; color: var(--ink); }
	.opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; max-width: 640px; margin: 0 auto 14px; }
	.opt {
		border: 1px solid var(--line); background: var(--paper); padding: 10px 14px; min-height: 44px;
		border-radius: var(--radius); cursor: pointer; font-family: var(--display); font-size: 16px; color: var(--ink);
	}
	.opt:hover:not(:disabled) { border-color: var(--turmeric); }
	.opt:disabled { opacity: 0.45; cursor: default; }
	.opt.right { border-color: var(--leaf); color: var(--leaf); font-weight: 600; opacity: 1; }
	.opt.wrong { border-color: var(--chili); color: var(--chili); opacity: 1; }
	.flashtools { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; align-items: center; }
	.flashtools .chip { min-height: 44px; }
	.missed { list-style: none; margin: 0 auto 14px; padding: 0; max-width: 62ch; text-align: left; font-size: var(--t-small); color: var(--ink-soft); }
	.missed li { padding: 4px 0; }

	.edge { margin-top: 26px; font-size: var(--t-small); color: var(--muted); font-style: italic; max-width: var(--measure); }
	.neighbours { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--line); font-size: var(--t-small); }
	.neighbours a { display: inline-block; padding-block: 10px; color: var(--ink); text-underline-offset: 3px; }
</style>
