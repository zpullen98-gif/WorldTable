/**
 * Generate the PWA icons.
 *
 * Hand-rasterised rather than pulled from a library: the icon is a flat
 * geometric mark (almanac paper, a ruled index-card band, a turmeric rule and a
 * serif T), so a tiny PNG encoder is less machinery than adding an image
 * dependency, and it keeps the icon in the same token colours as the app.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'static');

const PAPER = [0x19, 0x16, 0x12];
const CARD = [0x21, 0x1d, 0x16];
const TURMERIC = [0xc2, 0xa0, 0x55];
const INK = [0xea, 0xe2, 0xce];

function crc32(buf) {
	let c = ~0;
	for (let i = 0; i < buf.length; i++) {
		c ^= buf[i];
		for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
	}
	return ~c >>> 0;
}

function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(td));
	return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
	// Raw scanlines, filter byte 0 per row.
	const raw = Buffer.alloc(size * (size * 4 + 1));
	let p = 0;
	for (let y = 0; y < size; y++) {
		raw[p++] = 0;
		for (let x = 0; x < size; x++) {
			const [r, g, b, a = 255] = pixel(x, y, size);
			raw[p++] = r;
			raw[p++] = g;
			raw[p++] = b;
			raw[p++] = a;
		}
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // RGBA
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0))
	]);
}

/**
 * The mark: a card on paper, a dashed header band, a turmeric rule, and a
 * bold serif "T" cut out of the ink.
 *
 * @param inset fraction of the canvas kept clear at the edges. Maskable icons
 *        need a safe zone, since the launcher may crop to a circle.
 */
function draw(inset) {
	return (x, y, size) => {
		const u = size / 100;
		const pad = inset * size;
		const inner = size - pad * 2;
		const cx = (x - pad) / inner;
		const cy = (y - pad) / inner;

		if (cx < 0 || cx > 1 || cy < 0 || cy > 1) return [...PAPER, 255];

		// card
		if (cx < 0.06 || cx > 0.94 || cy < 0.06 || cy > 0.94) return [...PAPER, 255];

		// header band with the dashed rule beneath it
		if (cy < 0.24) {
			const dash = Math.floor(((cx - 0.06) * inner) / (6 * u)) % 2 === 0;
			return dash ? [0x3a, 0x33, 0x22, 255] : [...CARD, 255];
		}
		if (cy < 0.26) return [...TURMERIC, 255];

		// serif T
		const inT =
			// crossbar
			(cy > 0.4 && cy < 0.5 && cx > 0.24 && cx < 0.76) ||
			// stem
			(cy >= 0.5 && cy < 0.78 && cx > 0.44 && cx < 0.56) ||
			// foot serif
			(cy >= 0.74 && cy < 0.78 && cx > 0.34 && cx < 0.66);
		if (inT) return [...INK, 255];

		return [...CARD, 255];
	};
}

writeFileSync(join(OUT, 'icon-192.png'), png(192, draw(0.06)));
writeFileSync(join(OUT, 'icon-512.png'), png(512, draw(0.06)));
// Maskable: 20% safe zone so a circular crop never clips the mark.
writeFileSync(join(OUT, 'icon-maskable-512.png'), png(512, draw(0.2)));
writeFileSync(
	join(OUT, 'favicon.svg'),
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#191612"/>
  <rect x="6" y="6" width="88" height="88" fill="#211D16"/>
  <rect x="6" y="6" width="88" height="18" fill="#2a2418"/>
  <rect x="6" y="24" width="88" height="2" fill="#C2A055"/>
  <path d="M24 40h52v10H56v28h-12V50H24z" fill="#EAE2CE"/>
  <rect x="34" y="74" width="32" height="4" fill="#EAE2CE"/>
</svg>
`
);

console.log('  wrote icon-192.png, icon-512.png, icon-maskable-512.png, favicon.svg');
