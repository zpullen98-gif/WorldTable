import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { houseAnswerReading, drillAnswerReading, menuAnswerReading, fallAnswerReading } from './house-answer-reading';
import { dealRound, tableDrillHouse } from './house-drill-round';
import { DRILL_KINDS } from './house/house-drills';
import type { House } from './house/house-schema';
import { fallMenu } from './fall-menu';

const pack = JSON.parse(readFileSync(new URL('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url), 'utf8')).house as House;
const fixture = () => JSON.parse(readFileSync(new URL('./house/fixtures/house-drill.json', import.meta.url), 'utf8')) as House;
const paragraphs = (reading: ReturnType<typeof houseAnswerReading>) => reading?.sections.flatMap(s => s.paragraphs).join('\n') ?? '';

describe('answer-side reading', () => {
	it('provides context beyond the correct label for every question in the shipped house pool', () => {
		const h = tableDrillHouse(pack);
		const round = dealRound(h, DRILL_KINDS, null, () => .37);
		expect(round.length).toBeGreaterThan(300);
		for (const q of round) {
			const reading = drillAnswerReading(h, q);
			expect(reading.title, q.kind + ':' + q.itemId).toBeTruthy();
			expect(paragraphs(reading).length, q.kind + ':' + q.itemId).toBeGreaterThan(q.answer.length + 20);
			for (const link of reading.links) expect(h.dishes.some(d => link.href === '/menu#' + d.id)).toBe(true);
		}
	});
	it('shows full kept explanations, five parts and component context without exposing unkept marks', () => {
		const h = fixture();
		const d = h.dishes[0];
		d.why = { by: 'person', ts: 1, value: 'The full explanation that goes beyond the short answer.' };
		d.origin = { by: 'maitre', ts: 2, value: 'UNKEPT SHOULD NOT APPEAR' };
		h.components = [{ id: 'c-reading', name: 'The cooking method', kind: 'technique', itemIds: [d.id], termIds: [], ts: 1, explain: { by: 'person', ts: 1, value: 'A longer component explanation, tied by its exact item ID.' } }];
		const text = paragraphs(houseAnswerReading(h, d.id));
		expect(text).toContain(d.why.value);
		expect(text).toContain('A longer component explanation');
		expect(text).not.toContain('UNKEPT');
	});
	it('keeps pairing preference separate from a claim that every alternative is wrong', () => {
		const h = tableDrillHouse(pack);
		const q = dealRound(h, ['firstPickFor'], 1, () => .2)[0];
		expect(paragraphs(drillAnswerReading(h, q))).toContain('Other pairings may work');
	});
	it('resolves producer-place answers through their subject, not the answer target ID', () => {
		const p = { id: 'pr-test', name: 'Named farm', place: 'A recorded town', kind: 'farm' as const, supplies: 'The greens', story: 'A full farmer story.', dishIds: [], ts: 1 };
		const q = { kindLabel: 'Where is the producer?', prompt: 'Where?', target: { id: 'place:a recorded town', name: p.place }, options: [] };
		const reading = menuAnswerReading(null, [], [p], q, 'producer:pr-test');
		expect(reading.title).toBe(p.name);
		expect(paragraphs(reading)).toContain(p.story);
	});
	it('finds the full producer profile when the quiz shortens a comma or bracket in the name', () => {
		const h = fixture();
		for (const who of ['Named Farm, Louisiana', 'Named Farm (Louisiana)']) {
			h.components = [{ id: 'c-reading', name: 'Greens', kind: 'ingredient', itemIds: [h.dishes[0].id], termIds: [], ts: 1, producer: { by: 'person', ts: 1, value: { type: 'farm', who, where: 'Louisiana', founded: '', history: 'The full producer history.', facts: [], notes: [], sayIt: 'The farm grows these greens.', askKitchen: [] } } }];
			const q = { kind: 'producerOf' as const, itemId: h.dishes[0].id, answer: 'Named Farm', stem: 'Who?', options: [] };
			expect(paragraphs(drillAnswerReading(h, q))).toContain('The full producer history.');
		}
	});
	it('covers every dish, service scenario, component and fall item without altering data', () => {
		const before = JSON.stringify(pack);
		for (const item of [...pack.dishes, ...(pack.components ?? []), ...pack.scenarios, ...pack.mixUps, ...pack.lexicon, ...pack.tastings]) expect(houseAnswerReading(pack, item.id)).not.toBeNull();
		for (const item of fallMenu.items) {
			const reading = fallAnswerReading(item);
			expect(paragraphs(reading)).toContain(item.tableside);
			expect(reading?.links[0].href).toContain(encodeURIComponent(item.id));
		}
		expect(JSON.stringify(pack)).toBe(before);
	});
});
