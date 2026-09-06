/**
 * Reading a printed menu out of a photograph.
 *
 * This is the first half of "bring your menu in instead of typing it": it turns
 * a picture into plain text and stops there. Splitting that text into dishes,
 * and putting them in front of the cook to correct, belongs to the screen that
 * calls this.
 *
 * NOTHING HERE EVER PRODUCES AN ALLERGEN. A photograph of a menu says what a
 * dish is called and what it costs; it does not say what is in the pan. The
 * kitchen's allergen line is the one field in this app where "empty" and
 * "checked, and it holds none" must never be confused, which is why MenuDish
 * carries `allergensCheckedAt` alongside `allergens`. An importer that guessed
 * from words on a menu would write the second when it only ever knew the first.
 * So this module returns text. It does not build a MenuDish, and it must never
 * be extended to fill either field.
 *
 * One engine, and it is the device's own: the Shape Detection API's
 * TextDetector. On a phone this is the platform OCR that already reads
 * receipts and business cards. Nothing is downloaded, nothing is sent, and it
 * answers in well under a second.
 *
 * There was a second engine here, tesseract.js, for the browsers without one.
 * It came off because the library fetches its worker, its wasm core and its
 * language data from a CDN on first use, and this app ships a build gate that
 * forbids a third-party resource outright: it is installed from a folder of
 * static files and promises to work with no connection at all. Four megabytes
 * off jsDelivr, on the one screen where somebody is photographing their own
 * menu, is not a promise worth breaking.
 *
 * It can come back the moment that core and language data are hosted here
 * rather than fetched, which is a decision about carrying roughly four
 * megabytes of binaries in this repository, not a decision about this file.
 *
 * Where the platform has no reader, imageToText says so in one sentence and
 * the screen points at the two doors that need no engine: paste the text, or
 * give the menu's address. Both phone platforms lift text out of a photo
 * in the camera roll, so "paste it" is a real instruction rather than a shrug.
 */

export type OcrProgress = (pct: number, note: string) => void;

export interface OcrResult {
	text: string;
	engine: 'native';
}

/** Said the same way wherever a read comes back blank, because the fix is the same. */
const NO_TEXT =
	'No text came out of that photo. Fill the frame with the menu, hold it straight on, and try again in even light.';

/**
 * The slice of the Shape Detection API we use. It is not in TypeScript's DOM
 * library because it never became a standard, which is also why it is reached
 * through a property check on `window` rather than a bare global.
 */
interface DetectedText {
	rawValue: string;
	boundingBox: { top: number; left: number; height: number };
}

interface TextDetectorLike {
	detect(image: ImageBitmapSource): Promise<DetectedText[]>;
}

/** The constructor if this browser has it, else null. */
function nativeDetector(): (new () => TextDetectorLike) | null {
	if (typeof window === 'undefined') return null;
	const ctor = (window as unknown as { TextDetector?: new () => TextDetectorLike }).TextDetector;
	// createImageBitmap decodes the file for the detector, so a browser missing
	// either half cannot take the native path.
	if (typeof ctor !== 'function' || typeof createImageBitmap !== 'function') return null;
	return ctor;
}

/**
 * Whether this device can read a photograph at all. Asked before the picker
 * is offered, because a cook who is about to photograph a menu on a browser
 * that cannot read one should be told before they take the picture.
 */
export function ocrPlan(): { native: boolean } {
	return { native: nativeDetector() !== null };
}

/**
 * Reads a photograph of a menu and returns its text, one line per line of the
 * menu as best the engine can tell.
 *
 * @param file the picture, straight from a file input or a camera capture
 * @param onProgress called with 0 to 100 and a short note; safe to omit
 * @throws Error with a sentence the cook can act on, never a raw engine message
 */
export async function imageToText(file: Blob, onProgress?: OcrProgress): Promise<OcrResult> {
	// Monotonic on purpose: a bar that slides back reads as a fault rather than
	// as bookkeeping.
	let shown = 0;
	const report = (pct: number, note: string) => {
		shown = Math.max(shown, pct);
		onProgress?.(Math.round(shown), note);
	};

	// An empty type is left alone rather than rejected: a Blob assembled in code
	// often carries none, and the decoder below gives a better answer than a
	// guess would. A type we can read and that is not an image is refused here,
	// because "that is a PDF" is the useful answer, where the reader would only
	// have said it found no words.
	if (file.type && !file.type.startsWith('image/')) {
		throw new Error(
			`That is ${describeType(file.type)}, not a photo. Take a picture of the menu, or pick a JPEG, PNG or WebP file.`
		);
	}

	const native = nativeDetector();
	if (native) {
		report(0, 'Reading the photo');
		const text = await detectNative(native, file);
		report(100, 'Done reading');
		return { text, engine: 'native' };
	}

	// No engine on this device, and none is fetched. Said as one thing to do
	// next rather than as a limitation: the paste box and the address box are
	// both on this screen, and both phone platforms will lift the text out of
	// the photo for the cook to paste.
	throw new Error(
		'This browser cannot read photographs. Select the text on the picture and paste it into the box above, or give the address of the menu instead.'
	);
}

/**
 * The platform's own recogniser.
 *
 * A failure here is final: there is no second engine to fall back to, so the
 * message says what to do instead rather than what threw.
 */
async function detectNative(ctor: new () => TextDetectorLike, file: Blob): Promise<string> {
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new Error(
			'That picture would not open. Try a JPEG or PNG straight from the camera roll.'
		);
	}

	let blocks: DetectedText[];
	try {
		blocks = await new ctor().detect(bitmap);
	} catch {
		// Chrome exposes TextDetector on platforms whose OCR backend is missing,
		// where every detect() rejects. Nothing this app can do about it, so say
		// what it means rather than what threw.
		throw new Error(
			'This browser will not read photographs. Open the app in Chrome on the phone, or type the dishes in on the menu screen.'
		);
	} finally {
		bitmap.close();
	}

	// The detector returns blocks in whatever order it found them, and a menu is
	// read down the page and then across. A dish and its price are two blocks a
	// long way apart on one line, and keeping them on one line is exactly what
	// the screen after this one needs; sorting on the top edge alone splits
	// them, because the two boxes are never at quite the same height.
	//
	// The tempting fix, comparing tops with a tolerance inside the sort, is a
	// trap: "within half a block of each other" is not transitive, so a column
	// of dishes each a pixel lower than the last chains together and comes out
	// in an order nobody can predict. The blocks are cut into lines first, top
	// to bottom, and only then read left to right inside a line.
	const lines: DetectedText[][] = [];
	let line: DetectedText[] | null = null;
	for (const b of blocks.slice().sort((a, z) => a.boundingBox.top - z.boundingBox.top)) {
		const head = line === null ? undefined : line[0];
		if (
			line !== null &&
			head !== undefined &&
			b.boundingBox.top - head.boundingBox.top <
				Math.min(head.boundingBox.height, b.boundingBox.height) / 2
		) {
			line.push(b);
		} else {
			line = [b];
			lines.push(line);
		}
	}

	// A single space between blocks on a line: menu-parse is handed one shape
	// of text whatever produced it.
	const text = lines
		.map((l) =>
			l
				.sort((a, z) => a.boundingBox.left - z.boundingBox.left)
				.map((b) => b.rawValue.trim())
				.filter(Boolean)
				.join(' ')
		)
		.filter(Boolean)
		.join('\n');

	if (!text) throw new Error(NO_TEXT);
	return text;
}

/**
 * Names what was actually handed over, so the refusal is about this file and
 * not about files in general.
 *
 * Anything off the short list is quoted as its own media type rather than
 * squeezed into a sentence: "a file of type application/vnd.ms-excel" reads,
 * where the obvious shortcut ("an application/vnd.ms-excel file") does not.
 */
function describeType(type: string): string {
	const [group, sub = ''] = type.split(';')[0].trim().toLowerCase().split('/');
	if (sub === 'pdf') return 'a PDF';
	if (group === 'video') return 'a video';
	if (group === 'audio') return 'a sound file';
	if (group === 'text') return 'a text file';
	return `a file of type ${group}${sub ? `/${sub}` : ''}`;
}
