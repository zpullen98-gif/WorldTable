import { describe, expect, it } from 'vitest';
import { folioFocusStyle, validFolioFocus } from './folio-focus';

describe('illustration focus viewports', () => {
	it('accepts bounded crops only when every numbered key has a matching view', () => {
		const views = [{ x: 0, y: 0, width: .5, height: 1 }, { x: .5, y: 0, width: .5, height: 1 }];
		expect(validFolioFocus(views, 2)).toBe(views);
		expect(validFolioFocus(views, 3)).toEqual([]);
		expect(validFolioFocus(undefined, 2)).toEqual([]);
		for (const rect of [
			{ x: -.1, y: 0, width: .5, height: 1 },
			{ x: 0, y: -.1, width: .5, height: 1 },
			{ x: .6, y: 0, width: .5, height: 1 },
			{ x: 0, y: .2, width: .5, height: 1 },
			{ x: 0, y: 0, width: 0, height: 1 },
			{ x: 0, y: 0, width: 1, height: NaN }
		]) expect(validFolioFocus([rect], 1)).toEqual([]);
	});
	it('positions a lower-right quarter at its natural proportions without changing the source', () => {
		expect(folioFocusStyle({ x: .5, y: .5, width: .5, height: .5 }, { width: 1536, height: 1024 })).toEqual({
			aspect: '768 / 512', width: '200%', height: '200%', left: '-100%', top: '-100%'
		});
	});
});
