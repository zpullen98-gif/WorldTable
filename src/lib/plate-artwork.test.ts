import { describe, expect, it } from 'vitest';
import { mastheadArtworkUrl, plateArtworkUrl, plateIllustrationAlt } from './plate-artwork';
import type { PlateTeaching } from './types';
import authored from '../../tools/derive/plates/teaching.json';

describe('folio alternative text', () => {
	it('describes every numbered subject in reading order without reusing archive or quiz copy', () => {
		for (const teaching of Object.values(authored) as PlateTeaching[]) {
			const alt = plateIllustrationAlt(teaching);
			expect(alt).toContain('read left to right from the top row');
			let previous = -1;
			for (const [index, subject] of teaching.subjects.entries()) {
				const description = `${index + 1}. ${subject.name}: ${subject.image}`;
				expect(alt).toContain(description);
				const position = alt.indexOf(description);
				expect(position).toBeGreaterThan(previous);
				previous = position;
			}
		}
	});
});

describe('responsive masthead artwork', () => {
	const page = 'https://example.test/table/';
	it.each(['world-table-library-v1.webp', 'world-table-library-v1.phone.webp'])(
		'accepts the selected rendition %s without selecting the other', file => {
			expect(mastheadArtworkUrl(`/table/house/${file}`, '/table', page)).toBe(`https://example.test/table/house/${file}`);
		}
	);
	it.each(['https://other.test/table/house/world-table-library-v1.phone.webp', '/house/world-table-library-v1.phone.webp', '/table/house/unrelated.webp', '/table/house/world-table-library-v1.webp?fetch=all'])(
		'rejects unrelated image %s', src => expect(mastheadArtworkUrl(src, '/table', page)).toBeNull()
	);
});

describe('first-visit artwork URL boundary', () => {
	const page = 'https://example.test/table/plates/beef-cuts';
	it.each(['beef-cuts-v2.webp', 'beef-cuts-v3.webp', 'beef-cuts-v12.thumb.webp', 'archive/beef-cuts.webp'])(
		'accepts the loaded local image %s across independent revisions', file => {
			expect(plateArtworkUrl(`/table/plates/${file}#view`, '/table', page)).toBe(`https://example.test/table/plates/${file}`);
		}
	);
	it('works for the standalone root deployment', () => {
		expect(plateArtworkUrl('/plates/pacific-fish-v3.webp', '', 'http://localhost:4173/plates/pacific-fish'))
			.toBe('http://localhost:4173/plates/pacific-fish-v3.webp');
	});
	it.each(['standards/poached-egg-standard-v1.webp', 'standards/roux-colour-ladder-v1.thumb.webp', 'house/brennans/brennans-sauces-v1.webp', 'plates/louisiana-larder-v1.webp'])(
		'accepts a loaded companion folio at %s', path => {
			expect(plateArtworkUrl(`/table/${path}`, '/table', page)).toBe(`https://example.test/table/${path}`);
		}
	);
	it.each([
		'https://other.test/table/plates/beef-cuts-v3.webp',
		'/plates/beef-cuts-v3.webp', '/table-old/plates/beef-cuts-v3.webp',
		'/table/plates/beef-cuts-v3.webp?download=1', '/table/plates/beef-cuts.webp',
		'/table/plates/beef-cuts-v0.webp', '/table/plates/beef-cuts-v03.webp',
		'/table/plates/beef-cuts-v3.svg', '/table/plates/extra/beef-cuts-v3.webp',
		'/table/plates/archive/extra/beef-cuts.webp', '/table/plates/%2fbeef-cuts-v3.webp',
		'/table/standards/archive/beef-cuts.webp', '/table/house/another-house/brennans-sauces-v1.webp',
		'/table/standards/extra/poached-egg-standard-v1.webp',
		'data:image/webp;base64,AA==', 'http://['
	])('rejects an unrelated or malformed source: %s', src => {
		expect(plateArtworkUrl(src, '/table', page)).toBeNull();
	});
});
