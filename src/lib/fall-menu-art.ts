import data from './data/fall-menu-art-2026.json';

export interface FallArtwork {
	itemId: string; src: string; thumbnailSrc: string; width: number; height: number;
	thumbnailWidth: number; thumbnailHeight: number; title: string; alt: string;
	caption: string; cues: { label: string; text: string }[]; context: string;
	reviewedOn: string; sources: { title: string; url: string }[];
}
// One reviewed catalogue is shared with the Ledger; only each app's asset root differs.
export const fallArtwork = (data.items as FallArtwork[]).map((art) => ({
	...art,
	src: art.src.replace(/^img\/fall-2026\//, 'house/brennans/fall-'),
	thumbnailSrc: art.thumbnailSrc.replace(/^img\/fall-2026\//, 'house/brennans/fall-')
}));
export const fallArtworkById = new Map(fallArtwork.map((art) => [art.itemId, art]));
