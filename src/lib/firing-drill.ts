/**
 * The firing drill — repetition under load, built from the cook's own menu.
 *
 * The handoff line that specified this feature is one sentence: "The Pass
 * computes collisions; that is a drill." The insight holds with one
 * correction: a collision is the MOMENT worth rehearsing, but the pass only
 * reports collisions — it does not resolve them, so they cannot be quizzed
 * (a quiz needs a defensible right answer). What the pass DOES compute, and
 * defends, is the firing order: which step starts when, back-timed so
 * everything lands together. Reading that order cold, fast, from your own
 * menu, is the trainable skill — and the shot clock is the load.
 *
 * Everything here is derived from a Pass the caller already built, so the
 * drill trains against the venue's real menu and tonight's real plan, not an
 * invented scenario. No question is authored; no answer is opinion. The
 * correct answer is arithmetic the pass already did.
 *
 * Per-person by design: the score lands in the cook's own drillLog, which no
 * manager view reads. Same line every practise feature walks.
 */
import type { Pass, PassStep } from './pass';

export interface FiringQuestion {
	/** The steps offered, in presentation order. */
	options: Array<{ dish: string; text: string; startsAtMin: number }>;
	/** Index into options of the step that starts FIRST. */
	answer: number;
	/**
	 * How far apart first and second place are, in minutes. Small gap = hard
	 * question. Kept so the results screen can say which calls were tight.
	 */
	gapMin: number;
}

/** Questions per run and seconds per question. The clock IS the load. */
export const QUESTIONS_PER_RUN = 8;
export const SECONDS_PER_QUESTION = 20;

/**
 * Steps a question may use: hands-on steps with distinct start times.
 *
 * Zero-hands steps are excluded because "when does the simmer start" is not a
 * decision anybody makes under pressure — the pan does not need you. Ties are
 * excluded per-question rather than globally: two steps starting at the same
 * minute have no defensible "first", so they never appear together.
 */
function usable(pass: Pass): PassStep[] {
	return pass.steps.filter((s) => s.handsOnMin > 0);
}

/**
 * A pass can host the drill when it has at least three hands-on steps with at
 * least three distinct start times. The page uses this to say "pin more
 * dishes" rather than rendering a one-question quiz that grades a whole run.
 */
export function canDrill(pass: Pass): boolean {
	const starts = new Set(usable(pass).map((s) => s.startsAtMin));
	return starts.size >= 3;
}

/**
 * Build a run of questions from the pass.
 *
 * `rand` is injected (0..1) so tests are deterministic and the runtime passes
 * Math.random. Sampling is by distinct start time first, then a step within
 * each time — so a dish with many steps cannot crowd a question with itself.
 */
export function firingQuestions(
	pass: Pass,
	count = QUESTIONS_PER_RUN,
	rand: () => number = Math.random
): FiringQuestion[] {
	const pool = usable(pass);
	const byStart = new Map<number, PassStep[]>();
	for (const s of pool) {
		const at = byStart.get(s.startsAtMin) ?? [];
		at.push(s);
		byStart.set(s.startsAtMin, at);
	}
	const starts = [...byStart.keys()];
	// .length, because starts is an array here. This shipped as .size in draft
	// — undefined < 3 is false — so the refusal never fired and a too-small
	// pass crashed downstream instead of returning []. The test caught it.
	if (starts.length < 3) return [];

	const pick = <T>(xs: T[]): T => xs[Math.min(xs.length - 1, Math.floor(rand() * xs.length))];

	const out: FiringQuestion[] = [];
	for (let i = 0; i < count; i++) {
		// Three DISTINCT start times per question — see usable()'s tie note.
		const chosen: number[] = [];
		const remaining = [...starts];
		while (chosen.length < 3) {
			const idx = Math.min(remaining.length - 1, Math.floor(rand() * remaining.length));
			chosen.push(remaining.splice(idx, 1)[0]);
		}
		const steps = chosen.map((t) => pick(byStart.get(t)!));
		// Shuffle presentation so the answer is not positional.
		const order = steps
			.map((s, n) => ({ s, k: rand(), n }))
			.sort((a, b) => a.k - b.k)
			.map((x) => x.s);
		// Times count DOWN: the largest startsAtMin begins first.
		const first = Math.max(...order.map((s) => s.startsAtMin));
		const sorted = [...chosen].sort((a, b) => b - a);
		out.push({
			options: order.map((s) => ({ dish: s.dish, text: s.text, startsAtMin: s.startsAtMin })),
			answer: order.findIndex((s) => s.startsAtMin === first),
			gapMin: sorted[0] - sorted[1]
		});
	}
	return out;
}

/**
 * met / close / missed, the grammar every log in this app speaks.
 *
 * Thresholds match the calibration bench's spirit: met is a run you can trust,
 * close says the skill is forming, missed says read the plan again slowly. A
 * timeout counts as wrong — under load, not deciding IS a decision.
 */
export function gradeRun(correct: number, total: number): 'met' | 'close' | 'missed' {
	if (total <= 0) return 'missed';
	const share = correct / total;
	if (share >= 0.8) return 'met';
	if (share >= 0.6) return 'close';
	return 'missed';
}
