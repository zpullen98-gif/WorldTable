import { foliosForCard, foliosForLexicon, TEACHING_FOLIOS } from './teaching-folios';
import type { PlateIndexes, PlateRef } from './plates';

/** Reuse the reviewed identity joins. A shared word is not a shared subject. */
export function foliosForStudyRef(ref: string) {
	if (ref.startsWith('c:')) return foliosForCard(ref.slice(2));
	if (ref.startsWith('t:')) return foliosForLexicon(ref.slice(2));
	return [];
}

export function plateForStudyRef(ref: string, indexes: PlateIndexes | null): PlateRef | undefined {
	if (ref.startsWith('c:')) return indexes?.byCard.get(ref.slice(2));
	if (ref.startsWith('t:')) return indexes?.byLexicon.get(ref.slice(2));
	return undefined;
}

/** Preserve the lesson's explicit order, omit retired links and repeated ids. */
export function studiesForIds(ids: readonly string[] = []) {
	return [...new Set(ids)].flatMap(id => {
		const folio = TEACHING_FOLIOS.find(folio => folio.id === id);
		return folio ? [folio] : [];
	});
}
