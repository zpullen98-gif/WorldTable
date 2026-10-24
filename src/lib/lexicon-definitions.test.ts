import { describe, expect, it } from 'vitest';
import { applyLexiconDefinitions } from '../../tools/derive/lexicon-definitions.mjs';
import overrides from './data/overrides.json';
import lexicon from './data/lexicon.json';
import techniques from './data/techniques.json';

describe('reviewed definitions preserve archived identities and every reading surface', () => {
	it('changes only the definition without mutating the extracted entry', () => {
		const source = [{ slug: 'example', definition: 'Archived words', recipes: ['one'], term: 'Example' }];
		const revised = applyLexiconDefinitions(source, {
			example: { definition: 'Reviewed words', reason: 'A documented correction', sources: ['https://example.org/source'] }
		});
		expect(source[0].definition).toBe('Archived words');
		expect(revised[0]).toEqual({ ...source[0], definition: 'Reviewed words' });
	});

	it('rejects an orphan ruling instead of silently losing a correction', () => {
		expect(() => applyLexiconDefinitions([], {
			missing: { definition: 'Reviewed', reason: 'Review', sources: ['https://example.org'] }
		})).toThrow('unknown slug missing');
	});

	it('requires a reason and sources for every correction', () => {
		const entry = [{ slug: 'example', definition: 'Archived' }];
		expect(() => applyLexiconDefinitions(entry, {
			example: { definition: 'Reviewed', reason: '', sources: ['https://example.org'] }
		})).toThrow('needs a reason');
		expect(() => applyLexiconDefinitions(entry, {
			example: { definition: 'Reviewed', reason: 'Review', sources: [] }
		})).toThrow('needs source URLs');
	});

	it('ships the correction in the Lexicon and every anchored technique', () => {
		for (const [slug, ruling] of Object.entries(overrides.lexiconDefinitions)) {
			expect(lexicon.find((e) => e.slug === slug)?.definition).toBe(ruling.definition);
			for (const technique of techniques.filter((t) => t.lexiconSlug === slug)) {
				expect(technique.definition).toBe(ruling.definition);
			}
		}
	});
});
