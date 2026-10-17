/**
 * Cuisine's data, loaded on the first ask and held (routes/cuisine and any
 * surface that deals Cuisine cards).
 *
 * The index (src/lib/data/cuisine/index.json: the chapters, the entry heads,
 * the card and question tuples, the steps and match heads, the tree and the
 * ladder) is one lazy chunk; each chapter's bodies (ch-<key>.json) another,
 * reached through import.meta.glob, so a page loads only the chapters it
 * draws. Every chunk is an emitted script, so the worker precaches them all:
 * Cuisine reads offline from the first launch (the Floor Deck's argument).
 * A chapter with nothing written yet has no file (its head's `file` is null)
 * and is never asked for.
 *
 *   load()            the index; idempotent
 *   ensure(keys)      the chapters named, after the index
 *   ensureAll()       every chapter that has a file
 *   chapter(key)      a loaded chapter, or null
 *   failed, chapterFailed(key)   the index, or one chapter, could not be read
 *   entryBySlug(s)    a loaded entry with its chapter's key, or null
 *   cardById(id)      a loaded card with its entry, or null
 *   questionById(id)  a loaded question with its entry, or null
 *   stepsById(id), matchById(id)
 *   head(id), headBySlug(slug)   an entry's head from the index
 *   cardsOf(entryId)  the ids of an entry's cards, from the index
 */
import type { CzCard, CzChapter, CzEntry, CzHead, CzIndex, CzMatchSet, CzQuestion, CzStepsSet } from '../cuisine';

const CHAPTERS = import.meta.glob('../data/cuisine/ch-*.json');

class CuisineStore {
	#index = $state.raw<CzIndex | null>(null);
	#chapters = $state.raw<Record<string, CzChapter>>({});
	#failed = $state(false);
	/** The chapters whose file could not be read, each until a later ask lands it. */
	#lost = $state.raw<ReadonlySet<string>>(new Set());
	#loading: Promise<CzIndex | null> | null = null;
	#asked = new Map<string, Promise<CzChapter | null>>();

	/** Every loaded entry, card, question, set and match by id, rebuilt when a chapter lands. */
	#byId = $derived.by(() => {
		const entries = new Map<string, { entry: CzEntry; chapter: string }>();
		const cards = new Map<string, { card: CzCard; entry: CzEntry; chapter: string }>();
		const questions = new Map<string, { question: CzQuestion; entry: CzEntry; chapter: string }>();
		const steps = new Map<string, { set: CzStepsSet; chapter: string }>();
		const matches = new Map<string, { set: CzMatchSet; chapter: string }>();
		for (const [key, ch] of Object.entries(this.#chapters)) {
			for (const e of ch.entries) {
				entries.set(e.id, { entry: e, chapter: key });
				for (const c of e.cards) cards.set(c.id, { card: c, entry: e, chapter: key });
				for (const q of e.questions) questions.set(q.id, { question: q, entry: e, chapter: key });
			}
			for (const s of ch.steps) steps.set(s.id, { set: s, chapter: key });
			for (const m of ch.matches) matches.set(m.id, { set: m, chapter: key });
		}
		return { entries, cards, questions, steps, matches };
	});

	#heads = $derived.by(() => {
		const byId = new Map<string, CzHead>();
		const bySlug = new Map<string, CzHead>();
		const cardsOf = new Map<string, string[]>();
		for (const h of this.#index?.entries ?? []) {
			byId.set(h.id, h);
			bySlug.set(h.slug, h);
		}
		for (const [card, entry] of this.#index?.cards ?? []) {
			const list = cardsOf.get(entry);
			if (list) list.push(card);
			else cardsOf.set(entry, [card]);
		}
		return { byId, bySlug, cardsOf };
	});

	/** The index, or null until it has loaded. */
	get index(): CzIndex | null {
		return this.#index;
	}

	/** True while the index could not be read (offline before the worker had it, say); a later load that lands it clears it. */
	get failed(): boolean {
		return this.#failed;
	}

	/** True when this chapter's file could not be read, until a later ask lands it: one chapter's failure never marks another as lost. */
	chapterFailed(key: string): boolean {
		return this.#lost.has(key);
	}

	/** The index; idempotent, the first caller loads and every later one awaits it. */
	load(): Promise<CzIndex | null> {
		if (this.#index) return Promise.resolve(this.#index);
		if (!this.#loading) {
			this.#loading = import('../data/cuisine/index.json').then(
				(m) => {
					this.#index = m.default as unknown as CzIndex;
					this.#failed = false;
					return this.#index;
				},
				() => {
					this.#failed = true;
					this.#loading = null;
					return null;
				}
			);
		}
		return this.#loading;
	}

	/** Load the chapters named (those with a file), after the index. */
	async ensure(keys: Iterable<string>): Promise<void> {
		const index = await this.load();
		if (!index) return;
		const jobs: Promise<CzChapter | null>[] = [];
		for (const key of new Set(keys)) {
			const head = index.chapters.find((c) => c.key === key);
			if (!head?.file || this.#chapters[key]) continue;
			let job = this.#asked.get(key);
			if (!job) {
				const loader = CHAPTERS[`../data/cuisine/${head.file}`];
				if (!loader) continue;
				job = loader().then(
					(m) => {
						const ch = (m as { default: unknown }).default as CzChapter;
						this.#chapters = { ...this.#chapters, [key]: ch };
						if (this.#lost.has(key)) this.#lost = new Set([...this.#lost].filter((k) => k !== key));
						return ch;
					},
					() => {
						this.#lost = new Set([...this.#lost, key]);
						this.#asked.delete(key);
						return null;
					}
				);
				this.#asked.set(key, job);
			}
			jobs.push(job);
		}
		await Promise.all(jobs);
	}

	/** Every chapter that has a file. */
	async ensureAll(): Promise<void> {
		const index = await this.load();
		if (index) await this.ensure(index.chapters.filter((c) => c.file).map((c) => c.key));
	}

	/** True once this chapter's bodies are in (a chapter with no file never is). */
	has(key: string): boolean {
		return !!this.#chapters[key];
	}

	chapter(key: string): CzChapter | null {
		return this.#chapters[key] ?? null;
	}

	entry(id: string): CzEntry | null {
		return this.#byId.entries.get(id)?.entry ?? null;
	}

	entryBySlug(slug: string): { entry: CzEntry; chapter: string } | null {
		const head = this.#heads.bySlug.get(slug);
		return head ? (this.#byId.entries.get(head.id) ?? null) : null;
	}

	cardById(id: string): { card: CzCard; entry: CzEntry; chapter: string } | null {
		return this.#byId.cards.get(id) ?? null;
	}

	questionById(id: string): { question: CzQuestion; entry: CzEntry; chapter: string } | null {
		return this.#byId.questions.get(id) ?? null;
	}

	stepsById(id: string): { set: CzStepsSet; chapter: string } | null {
		return this.#byId.steps.get(id) ?? null;
	}

	matchById(id: string): { set: CzMatchSet; chapter: string } | null {
		return this.#byId.matches.get(id) ?? null;
	}

	head(id: string): CzHead | null {
		return this.#heads.byId.get(id) ?? null;
	}

	headBySlug(slug: string): CzHead | null {
		return this.#heads.bySlug.get(slug) ?? null;
	}

	/** The ids of an entry's cards, from the index (no chapter need be loaded). */
	cardsOf(entryId: string): string[] {
		return this.#heads.cardsOf.get(entryId) ?? [];
	}

	/** The chapters holding these cards (by their entries), for ensure(). */
	chaptersOfCards(ids: Iterable<string>): string[] {
		const want = new Set(ids);
		const out = new Set<string>();
		for (const [card, entry] of this.#index?.cards ?? []) {
			if (!want.has(card)) continue;
			const ch = this.#heads.byId.get(entry)?.chapter;
			if (ch) out.add(ch);
		}
		return [...out];
	}
}

export const cuisine = new CuisineStore();
