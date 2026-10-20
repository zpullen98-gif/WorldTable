import { describe, expect, it } from 'vitest';
import { learningJourneys } from './learning-journeys';
import { foundationEntryById } from './foundations';
import { fallItemById, fallMembers } from './fall-menu';
import cuisineIndex from './data/cuisine/index.json';

describe('applied learning journeys', () => {
	it('offers six bounded routes from identification to recall', () => {
		expect(learningJourneys).toHaveLength(6);
		expect(new Set(learningJourneys.map(j => j.id)).size).toBe(6);
		for (const journey of learningJourneys) {
			expect(journey.steps.map(s => s.label.split(':')[0])).toEqual(['Identify', 'Compare', 'Describe', 'Practise']);
			expect(journey.selfCheck).toMatch(/^Can I /);
		}
	});

	it('resolves every lesson and every practice deck without requiring a live house', () => {
		for (const journey of learningJourneys) for (const step of journey.steps) {
			expect(step.href).toMatch(/^\/(?:foundations|cuisine|menu|flashcards)\?/);
			const url = new URL(step.href, 'https://example.test');
			const q = url.searchParams;
			if (url.pathname === '/foundations') {
				expect(foundationEntryById.has(q.get('term')!), step.href).toBe(true);
			} else if (url.pathname === '/menu') {
				expect(q.get('view')).toBe('fall');
				expect(fallItemById.get(q.get('item')!)?.kind, step.href).toBe('dish');
			} else if (url.pathname === '/flashcards') {
				expect(fallMembers(q.get('deck')!).length, step.href).toBeGreaterThan(0);
			} else if (q.has('e')) {
				expect(cuisineIndex.entries.some(e => e.chapter === q.get('ch') && e.slug === q.get('e')), step.href).toBe(true);
			} else if (q.has('deck')) {
				const entryId = q.get('deck')!.slice(2);
				expect(q.get('deck')).toMatch(/^e:cz-/);
				expect(cuisineIndex.entries.some(e => e.id === entryId), step.href).toBe(true);
				expect(cuisineIndex.cards.some(card => card[1] === entryId), step.href).toBe(true);
			} else {
				expect(q.get('view'), step.href).toBe('tree');
				expect(cuisineIndex.tree.mothers.length).toBeGreaterThan(0);
			}
		}
	});
});
