import { describe, it, expect } from 'vitest';
import {
	fromLine,
	mergeProducers,
	mintProducerId,
	normaliseProducer,
	normaliseProducers,
	producersForDish,
	pruneDish,
	relinkArrivals,
	setDishProducers,
	type Producer
} from './producers';

const pr = (id: string, patch: Partial<Producer> = {}): Producer => ({
	id,
	name: `Producer ${id}`,
	place: '',
	kind: 'farm',
	supplies: '',
	story: '',
	dishIds: [],
	ts: 1,
	...patch
});

describe('a producer, read from disk or a file', () => {
	it('keeps a clean row as it is, trimmed', () => {
		expect(
			normaliseProducer({
				id: 'pr-a',
				name: '  Sweet Grass Dairy ',
				place: 'Thomasville, Georgia ',
				kind: 'creamery',
				supplies: 'the Green Hill',
				story: 'A family herd on grass.',
				dishIds: ['d-1'],
				ts: 5
			})
		).toEqual({
			id: 'pr-a',
			name: 'Sweet Grass Dairy',
			place: 'Thomasville, Georgia',
			kind: 'creamery',
			supplies: 'the Green Hill',
			story: 'A family herd on grass.',
			dishIds: ['d-1'],
			ts: 5
		});
	});

	it('drops a row with no string id or no name rather than minting one', () => {
		expect(normaliseProducer(null)).toBeNull();
		expect(normaliseProducer('pr-a')).toBeNull();
		expect(normaliseProducer({ name: 'No id' })).toBeNull();
		expect(normaliseProducer({ id: 7, name: 'Numeric id' })).toBeNull();
		expect(normaliseProducer({ id: 'pr-a', name: '   ' })).toBeNull();
		expect(normaliseProducer({ id: 'pr-a' })).toBeNull();
	});

	it('coerces the rest: missing text to empty, unknown kind to other, dishes to unique strings', () => {
		expect(
			normaliseProducer({ id: 'pr-a', name: 'Mill', kind: 'bakery', dishIds: ['d-1', 3, 'd-1', null, '', 'd-2'] })
		).toEqual({
			id: 'pr-a',
			name: 'Mill',
			place: '',
			kind: 'other',
			supplies: '',
			story: '',
			dishIds: ['d-1', 'd-2'],
			ts: 0
		});
		expect(normaliseProducer({ id: 'pr-a', name: 'X', dishIds: 'd-1' })?.dishIds).toEqual([]);
	});

	it('reads a non-array list as empty, and a duplicated id once', () => {
		expect(normaliseProducers('nope')).toEqual([]);
		expect(normaliseProducers({ 0: pr('a') })).toEqual([]);
		expect(normaliseProducers([pr('a', { name: 'First' }), null, pr('a', { name: 'Second' })]).map((p) => p.name)).toEqual([
			'First'
		]);
	});
});

describe('merging two devices', () => {
	it('is a union by id, the newer ts winning, in a stable order', () => {
		const mine = [pr('a', { ts: 5, story: 'mine' }), pr('b', { ts: 5, story: 'mine' })];
		const theirs = [pr('c', { ts: 1 }), pr('b', { ts: 9, story: 'theirs' }), pr('a', { ts: 2, story: 'theirs' })];
		const out = mergeProducers(mine, theirs);
		expect(out.map((p) => p.id)).toEqual(['a', 'b', 'c']);
		expect(out.map((p) => p.story)).toEqual(['mine', 'theirs', '']);
	});

	it('keeps mine on a tie, so merging a file twice changes nothing', () => {
		const mine = [pr('a', { ts: 5, story: 'mine' })];
		const file = [pr('a', { ts: 5, story: 'theirs' }), pr('b')];
		const once = mergeProducers(mine, file);
		expect(once[0].story).toBe('mine');
		expect(mergeProducers(once, file)).toEqual(once);
	});

	it('treats garbage on either side as nothing', () => {
		expect(mergeProducers([pr('a')], undefined)).toEqual([pr('a')]);
		expect(mergeProducers('x', [pr('a')])).toEqual([pr('a')]);
	});
});

describe('the link to dishes', () => {
	const list = [pr('a', { dishIds: ['d-1', 'd-2'] }), pr('b', { dishIds: ['d-2'] }), pr('c')];

	it('finds who is on a dish', () => {
		expect(producersForDish(list, 'd-2').map((p) => p.id)).toEqual(['a', 'b']);
		expect(producersForDish(list, 'd-9')).toEqual([]);
	});

	it('prunes a removed dish from every producer, without restamping', () => {
		const out = pruneDish(list, 'd-2');
		expect(out.map((p) => p.dishIds)).toEqual([['d-1'], [], []]);
		expect(out.map((p) => p.ts)).toEqual([1, 1, 1]);
	});

	it('returns the same array when no producer carried the dish', () => {
		expect(pruneDish(list, 'd-9')).toBe(list);
	});

	it('leaves exactly the named producers on the dish, restamping only those that changed', () => {
		const out = setDishProducers(list, 'd-2', ['b', 'c'], 99);
		expect(producersForDish(out, 'd-2').map((p) => p.id)).toEqual(['b', 'c']);
		expect(out.map((p) => p.ts)).toEqual([99, 1, 99]);
		expect(out[0].dishIds).toEqual(['d-1']);
		// b already carried it: untouched, the same object
		expect(out[1]).toBe(list[1]);
	});

	it('changes nothing, and returns the same array, when the ticks match what is stored', () => {
		expect(setDishProducers(list, 'd-2', ['a', 'b'], 99)).toBe(list);
	});

	it('clears a dish off everyone with an empty pick', () => {
		expect(producersForDish(setDishProducers(list, 'd-2', [], 99), 'd-2')).toEqual([]);
	});
});

describe('minting an id', () => {
	it('is pr- and eight base36 characters', () => {
		expect(mintProducerId()).toMatch(/^pr-[0-9a-z]{8}$/);
	});

	it('steps past an id already taken', () => {
		let n = 0;
		// the first eight draws spell pr-00000000, the next eight pr-11111111
		const rand = () => (n++ < 8 ? 0 : 1 / 36);
		expect(mintProducerId(['pr-00000000'], rand)).toBe('pr-11111111');
	});
});

describe('the line on a dish card', () => {
	const a = pr('a', { name: 'Sweet Grass Dairy', place: 'Thomasville, Georgia' });
	const b = pr('b', { name: 'Singing Brook Farm' });
	const c = pr('c', { name: 'Anson Mills', place: 'Columbia, South Carolina' });

	it('names one producer and its place, and leaves out an empty place', () => {
		expect(fromLine([a])).toBe('From Sweet Grass Dairy, Thomasville, Georgia');
		expect(fromLine([b])).toBe('From Singing Brook Farm');
		expect(fromLine([])).toBe('');
	});

	it('joins several the way a person says them', () => {
		expect(fromLine([a, b])).toBe('From Sweet Grass Dairy, Thomasville, Georgia and Singing Brook Farm');
		expect(fromLine([a, b, c])).toBe(
			'From Sweet Grass Dairy, Thomasville, Georgia; Singing Brook Farm; and Anson Mills, Columbia, South Carolina'
		);
		const bare = [pr('x', { name: 'X' }), pr('y', { name: 'Y' }), pr('z', { name: 'Z' })];
		expect(fromLine(bare)).toBe('From X, Y and Z');
	});
});

describe('a dish that arrives through an import brings its credits', () => {
	it('adds the file links for an arrived dish only, and never restamps', () => {
		const merged = [pr('a', { dishIds: ['k'], ts: 5 }), pr('b', { ts: 5 })];
		const theirs = [pr('a', { dishIds: ['x', 'y'], ts: 5 }), pr('b', { dishIds: ['x'], ts: 2 })];
		const out = relinkArrivals(merged, theirs, new Set(['x']));
		// 'y' was not brought by this import, so my copy's choice stands for it
		expect(out.map((p) => [p.dishIds, p.ts])).toEqual([
			[['k', 'x'], 5],
			[['x'], 5]
		]);
	});

	it('returns the same list when nothing arrived or nothing changes', () => {
		const merged = [pr('a', { dishIds: ['x'] })];
		expect(relinkArrivals(merged, [pr('a', { dishIds: ['x'] })], new Set())).toBe(merged);
		expect(relinkArrivals(merged, [pr('a', { dishIds: ['x'] })], new Set(['x']))).toBe(merged);
		expect(relinkArrivals(merged, undefined, new Set(['x']))).toBe(merged);
	});
});
