import { describe, it, expect } from 'vitest';
import {
	summarize,
	localDay,
	summaryKeyFor,
	writeSummary,
	markHistory,
	SUMMARY_BASE,
	HISTORY_FLAG,
	type StorageLike
} from './oot-summary';

/**
 * The three numbers The Pass reads (contract B) and the one device flag the
 * shared home row reads (contract C). Pure, so the tests are exact.
 */
function fakeStorage(): StorageLike & { map: Map<string, string> } {
	const map = new Map<string, string>();
	return {
		map,
		getItem: (k) => map.get(k) ?? null,
		setItem: (k, v) => void map.set(k, v)
	};
}

describe('summarize', () => {
	it('counts distinct dishes, every graded answer, and the local day of the latest of either', () => {
		const cook = new Date(2026, 8, 3, 23, 30).getTime(); // 3 Sep 23:30 local
		const drill = new Date(2026, 8, 5, 8, 0).getTime();
		const s = summarize({
			cookedLog: [
				{ slug: 'coq-au-vin', at: cook },
				{ slug: 'coq-au-vin', at: cook - 86400e3, grade: 'met' },
				{ slug: 'cacio-e-pepe', at: cook }
			],
			drillLog: [{ slug: 'maillard', at: drill, grade: 'close' }]
		});
		expect(s).toEqual({ dishesCooked: 2, roundsAnswered: 1, lastDay: '2026-09-05' });
	});

	it('is empty-safe: zeros and no day', () => {
		expect(summarize({ cookedLog: [], drillLog: [] })).toEqual({
			dishesCooked: 0,
			roundsAnswered: 0,
			lastDay: ''
		});
	});

	it('the last day is the LOCAL day, never the UTC one', () => {
		// 23:30 local on the 3rd is often the 4th in UTC; the answer is the 3rd.
		const late = new Date(2026, 8, 3, 23, 30).getTime();
		expect(localDay(late)).toBe('2026-09-03');
		expect(summarize({ cookedLog: [{ slug: 'x', at: late }], drillLog: [] }).lastDay).toBe('2026-09-03');
	});
});

describe('summaryKeyFor', () => {
	it('mirrors the session key: bare stays bare, a named suffix travels', () => {
		expect(summaryKeyFor('session')).toBe(SUMMARY_BASE);
		expect(summaryKeyFor('session::p-abc')).toBe(`${SUMMARY_BASE}::p-abc`);
	});
	it('falls back to the bare key for anything it does not recognise', () => {
		expect(summaryKeyFor('something-else')).toBe(SUMMARY_BASE);
	});
});

describe('writeSummary', () => {
	it('writes the JSON under the derived key and sets the history flag', () => {
		const st = fakeStorage();
		const out = writeSummary({ cookedLog: [{ slug: 'a', at: 1 }], drillLog: [] }, 'session::p1', st);
		expect(out).toEqual({ dishesCooked: 1, roundsAnswered: 0, lastDay: localDay(1) });
		expect(JSON.parse(st.map.get(`${SUMMARY_BASE}::p1`)!)).toEqual(out);
		expect(st.map.get(HISTORY_FLAG)).toBe('1');
	});

	it('returns null and throws nothing when there is no storage, or the write fails', () => {
		expect(writeSummary({ cookedLog: [], drillLog: [] }, 'session', null)).toBeNull();
		const broken: StorageLike = {
			getItem: () => null,
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		};
		expect(writeSummary({ cookedLog: [], drillLog: [] }, 'session', broken)).toBeNull();
	});

	it('the history flag is set once and never rewritten', () => {
		const st = fakeStorage();
		let writes = 0;
		const counting: StorageLike = {
			getItem: (k) => st.getItem(k),
			setItem: (k, v) => {
				writes++;
				st.setItem(k, v);
			}
		};
		markHistory(counting);
		markHistory(counting);
		expect(writes).toBe(1);
		expect(st.map.get(HISTORY_FLAG)).toBe('1');
	});
});
