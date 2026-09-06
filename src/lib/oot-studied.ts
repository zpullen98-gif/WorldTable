/**
 * "Studied today", as the whole product counts it.
 *
 * The definition is the shared layer's, recorded in shared/oot-profiles.js:
 * a person studied today when they COMPLETED something: a round of a quiz or
 * a drill, a dish cooked, a morning kept. Opening an app is not studying, and
 * neither is answering one question and walking away. This wing has four
 * places where a round completes and one where a dish does:
 *
 *   the lexicon quiz        routes/lexicon        tenth question answered
 *   the menu quiz           routes/menu/quiz      tenth question answered
 *   the firing drill        routes/practise/firing last question answered
 *   the service drill       routes/service/drill  round finished
 *   markCooked              stores/session        cook mode's last screen
 *
 * Every one of them calls this and nothing else, so the definition cannot
 * drift between sites: a site that called markStudied() without touch(), or
 * touch() on a page open, would be one more copy to keep honest.
 *
 * `touch()` beside `markStudied()` is what The Pass's "active this week"
 * reads; markStudied alone feeds the streak and studiedToday. Both are
 * write-once per hour and per day respectively inside the shared layer, so
 * calling this on every round costs a JSON write at most once a day.
 *
 * Standalone there is no window.OOT and this is a no-op. A hardened browser
 * can throw on the window access itself, so the whole thing is guarded: the
 * round still counted in the session record, which is the wing's own truth.
 */
export function markStudied(): boolean {
	try {
		if (typeof window === 'undefined') return false;
		const p = window.OOT && window.OOT.profiles;
		if (!p) return false;
		p.markStudied();
		if (typeof p.touch === 'function') p.touch();
		return true;
	} catch {
		return false;
	}
}
