<script lang="ts">
	import { base } from '$app/paths';
	import { tick } from 'svelte';
	import PlateIllustration from '$lib/components/PlateIllustration.svelte';
	import PlateArchive from '$lib/components/PlateArchive.svelte';
	import { PLATE_QUIZ_LENGTH, plateHref, plateQuiz, type PlateQuestion } from '$lib/plates';

	let { data } = $props();
	const plate = $derived(data.plate);
	const teaching = $derived(plate.teaching);
	function subjectLinks(name: string) {
		// Reuse only an unambiguous exact item in this same plate. No fuzzy,
		// cross-species or cross-plate matching is introduced by the guide.
		const matches = plate.groups.flatMap(group => group.items).filter(item => item.name === name && !item.sub);
		return matches.length === 1 ? matches[0].links : undefined;
	}
	let questions = $state<PlateQuestion[]>([]);
	let at = $state(0);
	let picked = $state<string | null>(null);
	let right = $state(0);
	let missed = $state<Array<{ about: string; answer: string }>>([]);
	let finished = $state(false);
	let announce = $state('');
	let questionPanel = $state<HTMLDivElement>();
	let startButton = $state<HTMLButtonElement>();
	const q = $derived(questions[at] ?? null);

	function close() {
		questions = [];
		at = 0;
		picked = null;
		right = 0;
		missed = [];
		finished = false;
		announce = '';
	}
	$effect(() => { void plate.slug; close(); });
	async function start() {
		close();
		questions = plateQuiz(plate, Math.random);
		announce = questions.length ? 'Question 1 of ' + questions.length + '.' : '';
		await tick();
		questionPanel?.focus({ preventScroll: true });
	}
	async function stop() { close(); await tick(); startButton?.focus({ preventScroll: true }); }
	function answer(option: string) {
		if (!q || picked !== null) return;
		picked = option;
		if (option === q.answer) {
			right++;
			announce = 'Correct. ' + q.answer + '.';
		} else {
			missed = [...missed, { about: q.about, answer: q.answer }];
			announce = 'The answer is ' + q.answer + '.';
		}
	}
	async function next() {
		if (at + 1 >= questions.length) {
			finished = true;
			announce = 'Finished: ' + right + ' of ' + questions.length + '.';
			await tick();
			questionPanel?.focus({ preventScroll: true });
			return;
		}
		at++;
		picked = null;
		announce = 'Question ' + (at + 1) + ' of ' + questions.length + '.';
		await tick();
		questionPanel?.focus({ preventScroll: true });
	}
</script>

<svelte:head><title>{teaching.title} · The Plates · The World Table</title></svelte:head>

<div class="shell view plate-folio">
	<nav class="crumbs"><a href="{base}/">Home</a> · <a href="{base}/plates">The Plates</a></nav>
	<header class="folio-intro">
		<p class="eyebrow">{[plate.kindTitle, data.levelName].filter(Boolean).join(' · ')}</p>
		<h1>{teaching.title}</h1>
		<p class="lede">{teaching.intro}</p>
		<p class="stat">{teaching.subjects.length} illustrated subjects · {plate.count} original archive entries · read, never graded</p>
	</header>
	<nav class="folio-jumps" aria-label="On this plate">
		<a href="#teaching-guide">Read the guide</a><a href="#plate-check">Check your understanding</a><a href="#plate-sources">Sources</a>
	</nav>

	<div class="folio-spread">
		<div class="art-column">
			<PlateIllustration src="{base}/{plate.image.src}" title={teaching.title} width={plate.image.width} height={plate.image.height} />
			<ol class="illustration-key" aria-label="Illustration key, read left to right from the top row">
				{#each teaching.subjects as subject, index (subject.id)}
					<li><a href="#subject-{subject.id}"><span aria-hidden="true">{index + 1}</span>{subject.name}</a></li>
				{/each}
			</ol>
			<p class="key-note">Read left to right, from the top row.</p>
		</div>
		<section class="teaching-guide" id="teaching-guide" aria-labelledby="teaching-h">
			<p class="eyebrow">The field guide</p>
			<h2 id="teaching-h">Look closely. Learn the difference.</h2>
			<p class="scope-note">{teaching.scope}</p>
			<ol class="subjects">
				{#each teaching.subjects as subject, index (subject.id)}
					{@const links = subjectLinks(subject.name)}
					<li class="subject" id="subject-{subject.id}">
						<div class="subject-heading"><span class="subject-number" aria-hidden="true">{index + 1}</span><h3>{subject.name}</h3></div>
						<p class="subject-summary">{subject.summary}</p>
						<dl class="subject-facts">{#each subject.facts as fact (fact[0])}<div><dt>{fact[0]}</dt><dd>{fact[1]}</dd></div>{/each}</dl>
						<p class="distinction"><strong>Remember</strong> {subject.distinction}</p>
						{#if links?.deck || links?.lexicon}
							<div class="subject-links">
								{#if links.deck}<a href="{base}/service/deck/study?card={links.deck}">Practise in the deck<span class="sr-only">: {subject.name}</span></a>{/if}
								{#if links.lexicon}<a href="{base}/lexicon#{links.lexicon}">Read the Lexicon<span class="sr-only">: {subject.name}</span></a>{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	</div>

	<section class="sources" id="plate-sources" aria-labelledby="sources-h">
		<h2 id="sources-h">Read further</h2>
		<p class="secnote">The teaching notes draw on these references. The illustration is a study aid; use the written guide for the distinctions.</p>
		<ul>{#each teaching.sources as source (source.url)}<li><a href={source.url} target="_blank" rel="noopener">{source.title}<span class="sr-only"> in a new tab</span></a></li>{/each}</ul>
	</section>

	<section class="quiz" id="plate-check" aria-labelledby="quiz-h" data-print="hide">
		<p class="eyebrow">A moment to recall</p>
		<h2 id="quiz-h">Check your understanding</h2>
		<p class="secnote">Up to {PLATE_QUIZ_LENGTH} questions from the teaching guide. Nothing is recorded; this is a quiet self-check.</p>
		<p class="live sr-only" aria-live="polite">{announce}</p>
		{#if finished}
			<div class="flash" bind:this={questionPanel} tabindex="-1" role="group" aria-label="Self-check results" aria-describedby="plate-result">
				<p class="term" id="plate-result">{right} of {questions.length}</p>
				{#if missed.length}
					<p class="def">Return to these subjects in the guide:</p>
					<ul class="missed">{#each missed as miss, index (index)}<li><strong>{miss.answer}</strong>{#if miss.about !== miss.answer}<span>{miss.about}</span>{/if}</li>{/each}</ul>
				{:else}<p class="def">You recognized every subject in this self-check.</p>{/if}
				<div class="flashtools"><button class="chip" onclick={start}>Again</button><button class="chip" onclick={stop}>Close self-check</button></div>
			</div>
		{:else if q}
			<div class="flash" bind:this={questionPanel} tabindex="-1" role="group" aria-label="Self-check question" aria-describedby="plate-question">
				<p class="eyebrow">Question {at + 1} of {questions.length}</p>
				<p class="def prompt" id="plate-question">{q.prompt}</p>
				<div class="opts">
					{#each q.options as option (option)}
						<button class="opt" class:right={picked !== null && option === q.answer} class:wrong={picked === option && option !== q.answer} disabled={picked !== null} onclick={() => answer(option)}>{option}</button>
					{/each}
				</div>
				{#if picked !== null}<p class="answer-note">{picked === q.answer ? 'Correct.' : 'The answer is ' + q.answer + '.'}</p>{/if}
				<div class="flashtools">
					{#if picked !== null}<button class="chip go" onclick={next}>{at + 1 >= questions.length ? 'See how it went' : 'Next question'}</button>{/if}
					<button class="chip" onclick={stop}>Close self-check</button>
				</div>
			</div>
		{:else}<button class="chip go start" bind:this={startButton} onclick={start}>Ask me about this plate</button>{/if}
	</section>

	<PlateArchive {plate} />
	<nav class="neighbours" aria-label="Other plates">
		{#if data.prev}<a href={plateHref(base, data.prev.slug)}>Before: {data.prev.title}</a>{/if}
		<a href="{base}/plates">The wall</a>
		{#if data.next}<a href={plateHref(base, data.next.slug)}>Next: {data.next.title}</a>{/if}
	</nav>
</div>

<style>
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
	.view { padding-block: 26px 80px; max-width: 1180px; }
	.crumbs { font-size: var(--t-small); margin-bottom: 8px; }.crumbs a { display: inline-block; min-height: 44px; padding-block: 10px; color: var(--muted); }
	.folio-intro { max-width: 800px; }
	.eyebrow { font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--turmeric-deep); }
	h1 { font-family: var(--house-display); font-size: clamp(30px, 4vw, 48px); font-weight: 500; line-height: 1.2; margin: 8px 0 16px; }
	.lede { font-size: var(--t-lede); color: var(--ink-soft); max-width: var(--measure); line-height: 1.6; }
	.stat { margin-top: 12px; font-size: var(--t-small); color: var(--muted); }
	.folio-jumps { display: flex; flex-wrap: wrap; gap: 0 22px; padding: 10px 0 18px; margin: 12px 0 24px; border-bottom: 1px solid var(--house-frame); }
	.folio-jumps a { min-height: 44px; display: inline-flex; align-items: center; color: var(--ink); font-size: var(--t-small); text-underline-offset: 4px; }
	.art-column { min-width: 0; align-self: start; }
	.illustration-key { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); list-style: none; padding: 12px 0 0; margin: 0; gap: 2px 12px; }
	.illustration-key a { display: flex; align-items: center; gap: 9px; min-height: 44px; line-height: 1.3; color: var(--ink); font-size: var(--t-small); text-decoration: none; overflow-wrap: anywhere; }
	.illustration-key a:hover { text-decoration: underline; text-underline-offset: 4px; }
	.illustration-key a > span { font-family: var(--house-display); font-size: 16px; color: var(--turmeric-deep); width: 18px; flex-shrink: 0; text-align: center; }
	.key-note { margin-top: 6px; font-size: var(--t-micro); color: var(--muted); }
	.teaching-guide { min-width: 0; margin-top: 30px; }
	h2 { font-family: var(--house-display); font-weight: 500; font-size: clamp(23px, 2.4vw, 29px); line-height: 1.35; margin: 7px 0 12px; }
	.scope-note { color: var(--ink-soft); font-size: 17px; line-height: 1.6; }
	.subjects { list-style: none; padding: 0; margin: 22px 0 0; }
	.subject { padding: 22px 0; border-top: 1px solid var(--house-frame); scroll-margin-top: calc(var(--modebar-h) + 28px); }
	.subject-heading { display: flex; align-items: baseline; gap: 12px; }
	.subject-number { font-family: var(--house-display); color: var(--turmeric-deep); font-size: 19px; width: 26px; flex-shrink: 0; }
	h3 { margin: 0; font-family: var(--house-display); font-size: 21px; font-weight: 500; line-height: 1.4; }
	.subject-summary { margin: 10px 0 14px; line-height: 1.65; font-size: 18px; color: var(--ink); }
	.subject-facts { margin: 0; color: var(--ink-soft); font-size: 17px; line-height: 1.55; }
	.subject-facts > div { display: grid; grid-template-columns: minmax(74px, .3fr) minmax(0, 1fr); gap: 10px; padding: 5px 0; }
	.subject-facts dt { font-size: 14px; font-weight: 600; color: var(--muted); }.subject-facts dd { margin: 0; }
	.distinction { margin: 14px 0 0; padding: 10px 13px; border-left: 2px solid var(--turmeric-deep); background: var(--paper-raised); color: var(--ink-soft); font-size: 17px; line-height: 1.6; }
	.distinction strong { color: var(--ink); }
	.subject-links { display: flex; flex-wrap: wrap; gap: 0 20px; margin-top: 6px; }.subject-links a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-size: var(--t-small); text-underline-offset: 4px; }
	.sources, .quiz { border-top: 1px solid var(--house-frame); margin-top: 32px; padding-top: 24px; }
	.secnote { color: var(--ink-soft); max-width: var(--measure); font-size: 17px; line-height: 1.6; }
	.sources ul { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 4px 22px; }
	.sources a { min-height: 44px; display: inline-flex; align-items: center; color: var(--ink); font-size: var(--t-small); }
	.live { min-height: 1.4em; margin-top: 10px; color: var(--muted); font-size: var(--t-small); }.start { min-height: 44px; }
	.flash { border: 1px solid var(--house-frame); background: var(--house-panel); padding: 26px; margin-top: 8px; border-radius: 3px; text-align: center; }
	.term { font-family: var(--house-display); font-size: 30px; margin: 0 0 12px; }
	.def { max-width: 60ch; margin: 10px auto 18px; color: var(--ink-soft); }.prompt { font-family: var(--display); font-size: 23px; line-height: 1.45; color: var(--ink); }
	.opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-width: 720px; margin: 0 auto 16px; }
	.opt { border: 1px solid var(--line-strong); background: var(--paper); padding: 13px 16px; min-height: 48px; border-radius: 3px; cursor: pointer; font: 18px/1.45 var(--display); color: var(--ink); }
	.opt:hover:not(:disabled) { border-color: var(--turmeric-deep); }.opt:disabled { cursor: default; opacity: 1; color: var(--muted); }
	.opt.right { border: 2px solid var(--leaf); color: var(--leaf); font-weight: 600; }.opt.wrong { border: 2px solid var(--chili); color: var(--chili); }
	.answer-note { margin: 12px 0; color: var(--ink); }.flashtools { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }.flashtools .chip { min-height: 44px; }
	.missed { list-style: none; margin: 0 auto 20px; padding: 0; max-width: 60ch; text-align: left; color: var(--ink-soft); }.missed li { padding: 9px 0; }.missed span { display: block; font-size: var(--t-small); }
	.neighbours { display: flex; flex-wrap: wrap; gap: 6px 22px; margin-top: 28px; border-top: 1px solid var(--line); padding-top: 14px; font-size: var(--t-small); }.neighbours a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); }
	@media screen and (min-width: 850px) {
		.folio-spread { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 36px; align-items: start; }
		.teaching-guide { margin-top: 0; }
		/* Reserve the keys and control first; the artwork fits the remaining view. */
		.art-column { position: sticky; top: calc(var(--modebar-h) + 14px); height: min(850px, calc(100dvh - var(--modebar-h) - 28px)); display: grid; grid-template-rows: minmax(0, 1fr) auto auto; }
	}
	@media (max-width: 520px) { .folio-jumps { gap: 0 16px; }.subject-facts > div { display: block; }.subject-facts dt { margin-bottom: 2px; }.subject-heading { gap: 8px; }h3 { font-size: 20px; }.flash { padding: 20px 14px; }.opts { grid-template-columns: 1fr; }.prompt { font-size: 21px; } }
</style>
