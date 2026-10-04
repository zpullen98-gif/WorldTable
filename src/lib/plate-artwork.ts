import type { PlateTeaching } from './types';

/** A complete folio's reading order and the authored visual descriptions.
 *  The same description accompanies the page image and its enlarged view.
 *  Archived poster text and quiz facts are deliberately not used here.
 */
export function plateIllustrationAlt(teaching: PlateTeaching): string {
	const subjects = teaching.subjects.map((subject, index) => `${index + 1}. ${subject.name}: ${subject.image.trim()}`);
	return `${teaching.title}. Six illustrated subjects, read left to right from the top row. ${subjects.join(' ')}`;
}

/** Only a loaded, local teaching folio (or original archive) may be warmed after claim.
 *  The caller checks image completion; this function limits the URL to this
 *  wing and strips harmless fragments without accepting queries or subfolders.
 */
export function plateArtworkUrl(src: string, base: string, documentUrl: string): string | null {
	try {
		const document = new URL(documentUrl);
		const url = new URL(src, document);
		if (url.origin !== document.origin || url.search) return null;
		const folder = ['plates', 'standards', 'house/brennans'].find(folder => url.pathname.startsWith(`${base}/${folder}/`));
		if (!folder) return null;
		const root = `${base}/${folder}/`;
		const file = url.pathname.slice(root.length);
		const current = /^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9]\d*(?:\.thumb)?\.webp$/.test(file);
		const archive = folder === 'plates' && /^archive\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(file);
		if (!current && !archive) return null;
		url.hash = '';
		return url.href;
	} catch {
		return null;
	}
}

/** Warm only the rendition the responsive picture has actually loaded. */
export function mastheadArtworkUrl(src: string, base: string, documentUrl: string): string | null {
	try {
		const document = new URL(documentUrl);
		const url = new URL(src, document);
		const root = `${base}/house/`;
		if (url.origin !== document.origin || url.search || !url.pathname.startsWith(root)) return null;
		if (!/^world-table-library-v[1-9]\d*(?:\.phone)?\.webp$/.test(url.pathname.slice(root.length))) return null;
		url.hash = '';
		return url.href;
	} catch {
		return null;
	}
}
