export interface FolioFocus { x: number; y: number; width: number; height: number }

/** A focus viewport must stay inside its source and correspond to every key view. */
export function validFolioFocus(focus: readonly FolioFocus[] | undefined, views: number): readonly FolioFocus[] {
	if (!focus || focus.length !== views || !views) return [];
	return focus.every(rect => [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) &&
		rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0 &&
		rect.x + rect.width <= 1.000001 && rect.y + rect.height <= 1.000001) ? focus : [];
}

/** Percentages are relative to the clipped viewport, not the whole source image. */
export function folioFocusStyle(focus: FolioFocus, image: { width: number; height: number }) {
	return {
		aspect: `${image.width * focus.width} / ${image.height * focus.height}`,
		width: `${100 / focus.width}%`, height: `${100 / focus.height}%`,
		left: `${-100 * focus.x / focus.width}%`, top: `${-100 * focus.y / focus.height}%`
	};
}
