import { describe, it, expect } from 'vitest';
import { bareHtmlPath } from './htmlPath';

/**
 * The sitemap and any pasted link may carry the on-disk .html spelling of a
 * prerendered page. The router must resolve it to the same route the bare
 * spelling reaches, at every depth and under either base.
 */
describe('bareHtmlPath', () => {
	it('strips .html from a prerendered page at any depth', () => {
		expect(bareHtmlPath('/table/recipe/acaraje.html')).toBe('/table/recipe/acaraje');
		expect(bareHtmlPath('/table/chapter/alabama.html')).toBe('/table/chapter/alabama');
		expect(bareHtmlPath('/table/recipes.html')).toBe('/table/recipes');
		expect(bareHtmlPath('/recipe/acaraje.html')).toBe('/recipe/acaraje');
	});

	it('maps index.html to the directory, never to a trailing slash', () => {
		expect(bareHtmlPath('/table/index.html')).toBe('/table');
		expect(bareHtmlPath('/index.html')).toBe('/');
	});

	it('leaves the bare spelling alone', () => {
		expect(bareHtmlPath('/table/recipe/acaraje')).toBe('/table/recipe/acaraje');
		expect(bareHtmlPath('/table')).toBe('/table');
		expect(bareHtmlPath('/')).toBe('/');
	});

	it('does not touch a slug that merely contains the letters', () => {
		expect(bareHtmlPath('/table/recipe/html-of-the-day')).toBe('/table/recipe/html-of-the-day');
	});
});
