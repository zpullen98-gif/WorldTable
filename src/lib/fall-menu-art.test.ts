import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fallArtwork, fallArtworkById } from './fall-menu-art';
import { fallMenu, fallCards } from './fall-menu';
import { plateArtworkUrl } from './plate-artwork';

describe('Fall teaching images', () => {
	it('covers every seasonal item once without adding or changing study cards', () => {
		expect(fallArtwork).toHaveLength(17);
		expect([...fallArtworkById.keys()].sort()).toEqual(fallMenu.items.map(i => i.id).sort());
		expect(fallCards).toHaveLength(119);
		for (const art of fallArtwork) {
			expect(art.alt.length).toBeGreaterThan(60);
			expect(art.cues.length).toBeGreaterThanOrEqual(3);
			expect(art.caption).toMatch(/illustrat/i);
			expect(art.context.length).toBeGreaterThan(50);
			expect(art.sources.length).toBeGreaterThan(0);
			for (const cue of art.cues) { expect(cue.label).toBeTruthy(); expect(cue.text.length).toBeGreaterThan(20); }
		}
	});
	it('ships versioned, bounded WebP files eligible for the existing on-demand cache', () => {
		let total = 0;
		for (const art of fallArtwork) for (const path of [art.src, art.thumbnailSrc]) {
			expect(path).toMatch(/^house\/brennans\/fall-[a-z0-9-]+-v1(?:\.thumb)?\.webp$/);
			const file = resolve('static', path), bytes = statSync(file).size;
			total += bytes;
			expect(bytes).toBeLessThan(path.includes('.thumb.') ? 80 * 1024 : 512 * 1024);
			expect(readFileSync(file).subarray(8, 12).toString()).toBe('WEBP');
			expect(plateArtworkUrl('/table/' + path, '/table', 'https://example.test/table/menu')).toBe('https://example.test/table/' + path);
		}
		expect(total).toBeLessThan(8 * 1024 * 1024);
	});
});
