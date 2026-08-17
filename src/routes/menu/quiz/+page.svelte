<script lang="ts">
	import { base } from '$app/paths';
	import { session } from '$lib/stores/session.svelte';
	import type { MenuDish } from '$lib/persistence/state';

	/* Drills over The Kitchen's Menu — the dishes entered on /menu. The quiz
	 * engine is the lexicon page's, ported: ten a round, distractors from the
	 * same menu section when it has enough dishes, the same verdict ladder, the
	 * same oot:round-complete contract.
	 *
	 * Everything below the H1 sits inside <article class="sheet"> deliberately:
	 * inside Outside Of Time this route is a PAID study surface, and the
	 * monorepo's lock masks `article.sheet` children on locked routes. An
	 * overlay alone is not a gate. Standalone, the class is inert.
	 */

	const QUIZ_LENGTH = 10;
	interface Question {
		kindLabel: string;
		prompt: string;
		target: MenuDish;
		options: MenuDish[];
	}

	let quiz = $state<Question | null>(null);
	let picked = $state<MenuDish | null>(null);
	let qNum = $state(0);
	let right = $state(0);
	let verdict = $state('');

	/* flashcards */
	let deck = $state<MenuDish[] | null>(null);
	let deckIdx = $state(0);
	let revealed = $state(false);

	const dishes = $derived(session.menuDishes);
	const enough = $derived(dishes.length >= 4);

	const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	function optionsFor(target: MenuDish): MenuDish[] {
		const sameSection = dishes.filter((d) => d.section === target.section && d.id !== target.id);
		const chosen = new Map<string, MenuDish>([[target.id, target]]);
		while (chosen.size < 4) {
			const cand = pick(sameSection.length >= 3 ? sameSection : dishes);
			chosen.set(cand.id, cand);
		}
		return [...chosen.values()].sort(() => Math.random() - 0.5);
	}

	/* A dish is drillable when at least one question shape fits it. Price and
	 * allergen questions demand uniqueness, or the question has two right
	 * answers and the guest deserves better than a coin flip. */
	function kindsFor(d: MenuDish): Question[] {
		const out: Question[] = [];
		if (d.description)
			out.push({
				kindLabel: 'Which dish does the menu describe?',
				prompt: `“${d.description}”`,
				target: d,
				options: optionsFor(d)
			});
		if (d.ingredients.length >= 2)
			out.push({
				kindLabel: 'Whose ingredients are these?',
				prompt: d.ingredients.join(' · '),
				target: d,
				options: optionsFor(d)
			});
		if (d.price && dishes.filter((x) => x.price === d.price).length === 1)
			out.push({
				kindLabel: 'Which dish sells at this price?',
				prompt: d.price,
				target: d,
				options: optionsFor(d)
			});
		const unique = d.allergens.find(
			(a) => dishes.filter((x) => x.allergens.includes(a)).length === 1
		);
		if (unique)
			out.push({
				kindLabel: 'The table asks — which dish carries it?',
				prompt: unique,
				target: d,
				options: optionsFor(d)
			});
		return out;
	}

	const drillable = $derived(dishes.filter((d) => kindsFor(d).length > 0));

	function ask() {
		const target = pick(drillable);
		quiz = pick(kindsFor(target));
		picked = null;
	}

	function startQuiz() {
		if (!enough || !drillable.length) return;
		deck = null;
		qNum = 0;
		right = 0;
		verdict = '';
		ask();
	}

	function answer(o: MenuDish) {
		if (picked) return;
		picked = o;
		if (o.id === quiz!.target.id) right++;
		qNum++;
	}

	function nextQuestion() {
		if (qNum >= QUIZ_LENGTH) {
			// The house verdict ladder, verbatim from the lexicon.
			verdict =
				right >= 9
					? 'Chef-level. The pass is yours.'
					: right >= 7
						? 'Solid line cook — a few more services and it’s muscle memory.'
						: right >= 5
							? 'Stage complete — hit the flashcards on what you missed.'
							: 'Back to prep, chef — read the menu again before the next round.';
			// Contract with the OOT monorepo's shared/oot-log.js (hookTable).
			if (typeof window !== 'undefined')
				window.dispatchEvent(
					new CustomEvent('oot:round-complete', {
						detail: { kind: 'quiz', right, of: QUIZ_LENGTH }
					})
				);
			quiz = null;
			return;
		}
		ask();
	}

	function startDeck() {
		quiz = null;
		verdict = '';
		deck = [...dishes].sort(() => Math.random() - 0.5);
		deckIdx = 0;
		revealed = false;
	}
</script>

<svelte:head><title>Drill the Menu — The World Table</title></svelte:head>

<div class="shell view">
	<article class="sheet">
		<h1>Drill the Menu</h1>
		<p class="crumbs"><a href="{base}/menu">◂ My Menu</a></p>

		<p class="lede">
			The Kitchen’s Menu, drilled the way the lexicon is — descriptions, ingredients, prices and
			allergens, asked the way a guest asks.
		</p>

		{#if !enough}
			<p class="empty">
				The drill opens at four dishes. {dishes.length
					? `${dishes.length} on the menu so far — add ${4 - dishes.length} more on `
					: 'Enter the menu on '}<a href="{base}/menu">My Menu</a>.
			</p>
		{:else if !drillable.length}
			<p class="empty">
				The dishes need descriptions, ingredients or prices before the menu can ask about them —
				fill them in on <a href="{base}/menu">My Menu</a>.
			</p>
		{:else}
			{#if !quiz && !verdict && !deck}
				<div class="tools">
					<button class="chip" onclick={startQuiz}>Quiz me ▸ multiple choice</button>
					<button class="chip" onclick={startDeck}>Study mode ▸ flashcards</button>
					<span class="count">{dishes.length} dishes · {drillable.length} drillable</span>
				</div>
			{/if}

			{#if verdict}
				<div class="flash" role="status">
					<p class="eyebrow">Round complete</p>
					<p class="term">Final: {right} / {QUIZ_LENGTH}</p>
					<p class="def">{verdict}</p>
					<div class="flashtools">
						<button class="chip" onclick={startQuiz}>New round ↦</button>
						<button class="chip" onclick={() => (verdict = '')}>Close</button>
					</div>
				</div>
			{:else if quiz}
				<div class="flash">
					<p class="eyebrow">
						{quiz.kindLabel} · question {Math.min(qNum + (picked ? 0 : 1), QUIZ_LENGTH)} of {QUIZ_LENGTH}
					</p>
					<p class="def quizdef">{quiz.prompt}</p>
					<div class="opts">
						{#each quiz.options as o (o.id)}
							<button
								class="opt"
								class:right={picked && o.id === quiz.target.id}
								class:wrong={picked?.id === o.id && o.id !== quiz.target.id}
								disabled={!!picked && o.id !== picked.id && o.id !== quiz.target.id}
								onclick={() => answer(o)}
							>
								{o.name}
							</button>
						{/each}
					</div>
					<div class="flashtools">
						{#if picked}
							<button class="chip" onclick={nextQuestion}>
								{qNum >= QUIZ_LENGTH ? 'See the verdict ↦' : 'Next ↦'}
							</button>
						{/if}
						<button class="chip" onclick={() => ((quiz = null), (qNum = 0))}>Quit the round</button>
					</div>
				</div>
			{:else if deck}
				{@const d = deck[deckIdx]}
				<div class="flash">
					<p class="eyebrow">Card {deckIdx + 1} of {deck.length} · {d.section}</p>
					<p class="term">{d.name}</p>
					{#if revealed}
						{#if d.description}<p class="def">{d.description}</p>{/if}
						{#if d.ingredients.length}<p class="def small">{d.ingredients.join(' · ')}</p>{/if}
						<p class="def small">
							{#if d.allergens.length}Allergens: {d.allergens.join(', ')}.{/if}
							{#if d.price}&nbsp;{d.price}.{/if}
						</p>
					{:else}
						<p class="def">Say the description, the build and the allergens — then flip.</p>
					{/if}
					<div class="flashtools">
						{#if revealed}
							<button
								class="chip"
								onclick={() => {
									if (deckIdx + 1 >= deck!.length) deck = null;
									else {
										deckIdx++;
										revealed = false;
									}
								}}
							>
								{deckIdx + 1 >= deck.length ? 'Done ↦' : 'Next card ↦'}
							</button>
						{:else}
							<button class="chip" onclick={() => (revealed = true)}>Flip ↦</button>
						{/if}
						<button class="chip" onclick={() => (deck = null)}>Close the deck</button>
					</div>
				</div>
			{/if}
		{/if}
	</article>
</div>

<style>
	.view { padding: 26px 0 80px; max-width: 760px; }
	.sheet h1 { font-size: var(--t-h2); margin-bottom: 6px; }
	.crumbs { font-size: var(--t-micro); margin-bottom: 14px; }
	.crumbs a { color: var(--muted); text-decoration: none; }
	.crumbs a:hover { color: inherit; }
	.lede { color: var(--ink-soft); max-width: var(--measure); margin-bottom: 18px; }
	.tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 14px 0; }
	.chip {
		border: 1px solid var(--line); background: var(--card); padding: 8px 14px;
		border-radius: var(--radius); cursor: pointer; font-size: 14px;
	}
	.chip:hover { border-color: var(--turmeric); }
	.count { font-size: var(--t-micro); color: var(--muted); }
	.empty { padding: 40px 12px; color: var(--muted); font-style: italic; }
	.empty a { color: inherit; }

	.flash {
		border: 1px solid var(--line); background: var(--card); border-radius: var(--radius);
		padding: 20px 22px; margin-top: 10px;
	}
	.eyebrow {
		font-size: var(--t-micro); letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
	}
	.term { font-family: var(--display); font-size: 26px; margin-bottom: 6px; }
	.def { max-width: var(--measure); margin-bottom: 6px; }
	.def.small { font-size: var(--t-small); color: var(--muted); }
	.quizdef { font-style: italic; }
	.opts { display: grid; gap: 8px; margin: 14px 0; }
	.opt {
		text-align: left; border: 1px solid var(--line); background: var(--paper, transparent);
		border-radius: var(--radius); padding: 10px 14px; cursor: pointer;
		font-family: var(--display); font-size: 17px;
	}
	.opt:hover:not(:disabled) { border-color: var(--turmeric); }
	.opt.right { border-color: var(--leaf); }
	.opt.wrong { border-color: var(--chili); }
	.opt:disabled { opacity: 0.55; cursor: default; }
	.flashtools { display: flex; gap: 8px; margin-top: 10px; }
</style>
