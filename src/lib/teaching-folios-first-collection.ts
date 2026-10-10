import type { TeachingFolio } from './teaching-folios';

/** General cooking studies: observable cues, with recipe-specific endpoints.
 *  Numbered subjects follow the image from left to right. They are not house
 *  plating records, temperatures, timers or evidence of a single fault cause.
 */
export const FIRST_COLLECTION_TEACHING_FOLIOS: readonly TeachingFolio[] = [
	{
		id: 'aromatics-standard', group: 'knife-and-heat', title: 'Aromatics: from raw to browned',
		intro: 'Compare the same diced onion at three stages. Look at the centre of each piece, its edges and the pan beneath it.',
		scope: 'Sweating aims for softened onion without browning. Browned onion is a different useful result when the recipe calls for it; the picture cannot tell you how soft a piece feels.',
		image: { src: 'standards/aromatics-standard-v1.webp', thumb: 'standards/aromatics-standard-v1.thumb.webp', width: 1536, height: 1024 },
		subjects: [
			{ name: 'Raw onion', description: 'Opaque white pieces with firm-looking edges mark the starting point. Even cutting helps the pieces cook at a similar pace.', image: 'Opaque white onion dice in a shallow metal pan.' },
			{ name: 'Sweated onion', description: 'Look for a translucent appearance without brown edges. Check a piece for tenderness as well; colour alone does not establish the endpoint.', image: 'Pale, translucent onion dice with a light sheen and no brown edges.' },
			{ name: 'Browned onion', description: 'Golden-brown edges and deposits on the pan show a different stage. Choose it for a recipe that wants browned flavour, not as the endpoint of a colourless sweat.', image: 'Golden-brown onion pieces with browned deposits on the pan.' }
		],
		links: [
			{ label: 'Sweating aromatics', href: '/technique/sweating-aromatics-soft-never-browned' },
			{ label: 'Sweat, sauté and sear', href: '/lexicon#sweat-vs-saute-vs-sear' },
			{ label: 'Practise with pasta e fagioli', href: '/recipe/pasta-e-fagioli' }
		],
		techniques: ['sweating-aromatics-soft-never-browned'], dishes: [],
		sources: [ { title: 'Rouxbe: How to Sweat Ingredients', url: 'https://rouxbe.com/cooking-school/how-to-sweat-ingredients' } ]
	},
	{
		id: 'simmer-standard', group: 'knife-and-heat', title: 'Read the water: poach, simmer, boil',
		intro: 'Compare a quiet surface with a gentle simmer and a rolling boil. Choose the movement that suits the food and the recipe.',
		scope: 'These matched pans illustrate different levels of water movement. A still picture cannot measure temperature or show the rhythm of the bubbles; use the linked lesson and observe your own pan.',
		image: { src: 'standards/simmer-standard-v1.webp', thumb: 'standards/simmer-standard-v1.thumb.webp', width: 1536, height: 1024 },
		subjects: [
			{ name: 'Quiet poaching water', description: 'The surface is mostly calm, without vigorous bubbles disturbing it. Gentle treatment is useful for delicate foods; follow their specific cooking method.', image: 'Clear water with a nearly still surface in a metal pan.' },
			{ name: 'Gentle simmer', description: 'Small bubbles break the surface with less disturbance than a rolling boil. Watch their frequency and the movement of the liquid, not only the heat setting.', image: 'A few small bubbles breaking the surface of clear water.' },
			{ name: 'Rolling boil', description: 'Vigorous bubbles and strong surface movement distinguish this pan. A boil is useful when called for, but it is not interchangeable with a gentle simmer.', image: 'Clear water with vigorous bubbles across its agitated surface.' }
		],
		links: [
			{ label: 'Holding a bare simmer', href: '/technique/the-bare-simmer-holding-liquid-below-the-boil' },
			{ label: 'Poach, simmer and boil', href: '/lexicon#poach-simmer-boil' },
			{ label: 'Apply gentle heat to poached eggs', href: '/technique/poaching-eggs' }
		],
		techniques: ['the-bare-simmer-holding-liquid-below-the-boil', 'poaching-eggs'], dishes: [],
		sources: [ { title: 'Rouxbe: What Is Simmering?', url: 'https://shop.rouxbe.com/tips-techniques/336-what-is-simmering' } ]
	},
	{
		id: 'pan-sauce-standard', group: 'sauces-and-eggs', title: 'From fond to pan sauce',
		intro: 'Follow the brown deposits left after cooking into a loosened liquid and a more concentrated sauce.',
		scope: 'This is a general pan-sauce sequence, not a complete recipe. The ingredients determine the final body; reducing a liquid does not guarantee that it will coat a spoon, and not every sauce needs a butter finish.',
		image: { src: 'standards/pan-sauce-standard-v1.webp', thumb: 'standards/pan-sauce-standard-v1.thumb.webp', width: 1536, height: 1024 },
		subjects: [
			{ name: 'Brown fond', description: 'Brown deposits remain after the cooked food is removed. These flavourful bits are the starting point here; scorched black residue is not the target.', image: 'Brown cooking deposits on the exposed base of a metal pan.' },
			{ name: 'Deglaze', description: 'The recipe’s liquid loosens the deposits as they are scraped from the pan. Notice the exposed metal and the colour carried into the liquid.', image: 'A wooden utensil loosening brown deposits into liquid in the same pan.' },
			{ name: 'Reduce and check', description: 'The finished sauce appears cohesive, with a small sample in the spoon. Check its consistency and flavour against the recipe before deciding whether it needs further reduction or finishing.', image: 'Glossy brown pan sauce with a spoon holding a small sample.' }
		],
		links: [
			{ label: 'Deglazing and pan sauces', href: '/technique/deglazing-and-pan-sauces' },
			{ label: 'Reducing a sauce', href: '/technique/reducing-a-sauce' },
			{ label: 'Reduction, nappe and mounting', href: '/lexicon#reduction-nappe-and-mounting' },
			{ label: 'Practise with chicken piccata', href: '/recipe/chicken-piccata' }
		],
		techniques: ['deglazing-and-pan-sauces', 'reducing-a-sauce'], dishes: [],
		sources: [ { title: 'Rouxbe: How to Make Pan Sauce', url: 'https://rouxbe.com/cooking-school/how-to-make-pan-sauce' } ]
	},
	{
		id: 'straining-standard', group: 'sauces-and-eggs', title: 'Straining: what stays, what passes',
		intro: 'Look at the cooked pieces caught in the mesh, then the liquid collected beneath it.',
		scope: 'This study shows solids separated from liquid by a fine-mesh sieve. Straining does not automatically make a liquid perfectly clear; pressing, filtering and clarification serve different goals.',
		image: { src: 'standards/straining-standard-v1.webp', thumb: 'standards/straining-standard-v1.thumb.webp', width: 1536, height: 1024 },
		subjects: [
			{ name: 'Solids retained', description: 'The fine mesh catches the larger cooked vegetable pieces while liquid drains into a bowl. Use a stable sieve and a receiving bowl with enough capacity.', image: 'Cooked vegetable pieces retained in a fine-mesh sieve set over a bowl.' },
			{ name: 'Liquid collected', description: 'The strained liquid has no visible large vegetable pieces. Follow the recipe on whether to press the solids or let them drain; those choices can change the result.', image: 'A bowl of smooth-looking strained liquid without large vegetable pieces.' }
		],
		links: [
			{ label: 'Straining and passing through a sieve', href: '/technique/straining-and-passing-through-a-sieve' },
			{ label: 'Sieves, tamis and food mills', href: '/lexicon#sieves-chinois-tamis-and-food-mill' },
			{ label: 'Compare the strained and blended routes in barszcz', href: '/recipe/barszcz' }
		],
		techniques: ['straining-and-passing-through-a-sieve'], dishes: [],
		sources: [ { title: 'Rouxbe: Stock Fundamentals, straining and cooling', url: 'https://rouxbe.com/cooking-school/how-to-make-stock-fundamentals' } ]
	},
	{
		id: 'puree-texture-standard', group: 'sauces-and-eggs', title: 'Potato texture: rustic, smooth, gluey',
		intro: 'Compare the surface and body of three plain potato preparations. Coarse and smooth can both be intentional; a sticky, gluey result is a different observation.',
		scope: 'These are plain potato preparations. The third illustrates a gluey texture that overworking can produce; appearance alone cannot prove how it happened. Choose a coarse or smooth finish to suit the recipe.',
		image: { src: 'standards/puree-texture-standard-v1.webp', thumb: 'standards/puree-texture-standard-v1.thumb.webp', width: 1536, height: 1024 },
		subjects: [
			{ name: 'Rustic mash', description: 'Small pieces and an uneven surface remain. This can be a deliberate style when the potato is tender; visible pieces alone do not prove it is undercooked.', image: 'A pale mound of roughly mashed potato with visible small pieces.' },
			{ name: 'Smooth finish', description: 'A ricer is one way to make evenly textured potato before gently incorporating the recipe’s additions. Look for the smooth result; the picture cannot identify the tool used.', image: 'A pale, evenly textured potato mound with soft smooth folds.' },
			{ name: 'Gluey texture', description: 'The sticky appearance and short stretch at the spoon contrast with the first two finishes. Excessive mixing can make potato gluey; stop mixing once the recipe’s desired texture is reached.', image: 'A glossy, sticky-looking potato mixture clinging in a short stretch to a spoon.' }
		],
		links: [
			{ label: 'Mashing and puréeing', href: '/technique/mashing-and-pureeing' },
			{ label: 'Sieves, tamis and food mills', href: '/lexicon#sieves-chinois-tamis-and-food-mill' },
			{ label: 'Practise a potato mash with champ', href: '/recipe/champ' }
		],
		techniques: ['mashing-and-pureeing'], dishes: [],
		sources: [ { title: 'Idaho Potato Commission: texture, ricing and overmixing', url: 'https://idahopotato.com/dr-potato/print/my-potato-has-large-lumps-in-it-and-after-baking-and-mashing-it-the-lumps-are-not-going-away-what-is-this' } ]
	}
];
