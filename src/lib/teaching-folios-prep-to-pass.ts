import type { TeachingFolio } from './teaching-folios';

// Inspected against the generated compositions; each crop retains its view number.
const fourViews = [0.012, 0.495].flatMap(y => [0.012, 0.505].map(x => ({
	x, y, width: 0.483, height: 0.488
})));
const sixViews = [{ y: 0.045, height: 0.42 }, { y: 0.475, height: 0.465 }].flatMap(row =>
	[{ x: 0.017, width: 0.318 }, { x: 0.345, width: 0.312 }, { x: 0.666, width: 0.318 }].map(col => ({ ...col, ...row })));
const threeViews = [{ x: 0.009, width: 0.328 }, { x: 0.343, width: 0.315 }, { x: 0.666, width: 0.325 }]
	.map(col => ({ ...col, y: 0.024, height: 0.946 }));
const artwork = (id: string) => ({ src: `standards/${id}-study-v1.webp`, thumb: `standards/${id}-study-v1.thumb.webp`, width: 1536, height: 1024 });

/** General cooking studies. Exact dish identities give applications, not
 * approval of a restaurant's production formula, quantities or presentation. */
export const PREP_TO_PASS_TEACHING_FOLIOS: readonly TeachingFolio[] = [
	{
		id: 'blanch-cool-finish', group: 'cooks-eye', title: 'Blanch, cool, drain and finish',
		intro: 'Follow slender green beans through a preparation for later service. Look beyond their green colour.',
		scope: 'This is a prep-ahead example. An ice bath is optional when vegetables go straight to their next cooking step or to service. Timing and the desired bite depend on the vegetable, its size and the recipe.',
		image: artwork('blanch-cool-finish'), focus: fourViews,
		subjects: [
			{ name: 'Prepare an even batch', description: 'Trim the beans and compare their size. Similar pieces cook more evenly; a thick bean and a fine haricot vert need different checks.', image: 'A small orderly batch of raw slender green beans.' },
			{ name: 'Blanch and check', description: 'Briefly cook in boiling water for this method. Test a sample for the intended bite; brightness alone cannot tell you its texture.', image: 'Green beans in bubbling water in a stainless-steel cooking pan.' },
			{ name: 'Cool for later service', description: 'Transfer the beans to an ice-water bath to stop further cooking promptly. Remove them once cold, rather than leaving them to soak.', image: 'The same beans in a bowl of water and visible ice.' },
			{ name: 'Drain before the finish', description: 'Drain well so carried water does not dilute the finish. Refrigerate promptly if holding for later; reheat and season according to the recipe.', image: 'Drained green beans with a lightly dressed finished portion beside them.' }
		],
		learning: {
			observe: 'Identify the water bath, the cooling bath and the drainage stage. Then name the texture check the picture cannot perform.',
			explain: 'Blanching and shocking are separate actions. Cooling interrupts cooking; draining prepares the vegetable for an effective final seasoning or reheating.',
			apply: 'Practise describing haricots verts as slender green beans. At lineup, ask whether today’s vegetables are blanched ahead or cooked directly to order.',
			question: 'The beans are bright green. What else must you check, and must every blanch end in ice water?',
			answer: 'Check the actual bite against the recipe. Use an ice bath for this prep-ahead method; immediate service or another cooking step may not need it.'
		},
		links: [{ label: 'Blanching and shocking', href: '/technique/blanching-and-shocking' }, { label: 'Blanch and shock in the Lexicon', href: '/lexicon#blanch-and-shock' }, { label: 'Boiling, blanching and steaming', href: '/cuisine?ch=methods&e=boil-blanch-and-steam' }],
		techniques: ['blanching-and-shocking'], dishes: [],
		sources: [{ title: 'Wegmans: blanching and shocking vegetables', url: 'https://www.wegmans.com/cooking-techniques/blanching-and-shocking-vegetables' }]
	},
	{
		id: 'coating-frying', group: 'cooks-eye', title: 'Coating and frying: know each layer',
		intro: 'The first four views follow a breaded chicken cutlet. The last two show a separate battered-courgette example.',
		scope: 'These general examples do not specify Brennan’s shrimp or pickle coatings. Keep raw-poultry breading and equipment separate from ready-to-eat food. Measure the required internal temperature; a golden crust or pale cut face cannot establish safety.',
		image: artwork('coating-frying'), focus: sixViews,
		subjects: [
			{ name: 'A light flour coat', description: 'Coat the cutlet evenly and shake off loose flour. This first layer helps the egg coating adhere.', image: 'A thin chicken cutlet with a light, even flour dusting.' },
			{ name: 'An egg coating', description: 'Cover the floured cutlet with beaten egg, then let excess drip away. This wet layer gives the crumbs a surface to grip.', image: 'A cutlet covered with a thin glossy yellow egg layer.' },
			{ name: 'An even crumb layer', description: 'Press the crumbs gently onto both sides. Look for coverage without thick loose clumps; the coating is still raw at this stage.', image: 'An uncooked cutlet evenly covered with pale breadcrumbs.' },
			{ name: 'Read the cooked structure', description: 'The cut edge separates crumb crust from chicken. Use a food thermometer for the centre; use the surface to assess coating quality.', image: 'A golden breaded cutlet sliced to reveal its crust and interior.' },
			{ name: 'A separate batter method', description: 'Courgette is coated with a liquid batter. This is a different preparation, not an extra layer added after breadcrumbs.', image: 'A courgette baton being coated in pale liquid batter.' },
			{ name: 'Drain without piling', description: 'Space the fried pieces on a rack over a tray so excess oil can drain. Cook in manageable batches and check the oil between batches.', image: 'Separate crisp battered courgette pieces resting on a wire rack over a tray.' }
		],
		learning: {
			observe: 'Compare powder, liquid egg, separate crumbs and a continuous batter coating. Notice the rack beneath the finished vegetables.',
			explain: 'Flour, egg and crumb build distinct layers. Batter combines flour and liquid into a coating before frying. Neither method gives a universal cooking time.',
			apply: 'For Popcorn Shrimp or Fried Pickles, confirm the current coating and fryer arrangements with the kitchen. Then explain the real texture and ingredients to your guest.',
			question: 'Does a golden exterior show that a chicken cutlet is safe, or that fried pickles use the same coating?',
			answer: 'Neither. Check the chicken’s internal temperature and the kitchen’s verified process. Confirm the pickle recipe independently; a frying technique does not establish its ingredients or allergens.'
		},
		links: [{ label: 'Dredge, crumb and batter', href: '/technique/the-coat-before-the-fry-dredge-crumb-batter' }, { label: 'Deep and shallow frying', href: '/lexicon#deep-and-shallow-frying' }, { label: 'Frying lesson', href: '/cuisine?ch=methods&e=frying' }],
		techniques: ['the-coat-before-the-fry-dredge-crumb-batter', 'deep-frying'], dishes: ['d-e1rol7wr', 'd-fswku8o2', 'd-5f1lj940'],
		sources: [
			{ title: 'Rouxbe: chicken cutlet breading and rack drainage', url: 'https://rouxbe.com/recipes/1523-chicken-parmigiana-pollo-alla-parmigiana' },
			{ title: 'Tefal: courgette in a liquid tempura batter', url: 'https://www.tefal.com/recipe/Courgette-tempura/r/108891' },
			{ title: 'USDA FSIS: food thermometers and the limits of colour', url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/food-thermometers' }
		]
	},
	{
		id: 'sugar-caramel', group: 'cooks-eye', title: 'Sugar: cooled texture and caramel colour',
		intro: 'Read two different tests: cooled syrup samples across the top, then caramel colours across the bottom.',
		scope: 'The upper samples represent fully cooled cold-water tests. Never touch or taste hot syrup. The listed ranges are sea-level guides from the Exploratorium; use the recipe, an accurate thermometer and altitude adjustment. The caramel row is a colour comparison, not a temperature scale.',
		image: artwork('sugar-caramel'), focus: sixViews,
		subjects: [
			{ name: 'Soft-ball test', description: 'At roughly 235–240°F (113–116°C), a cooled syrup sample forms a soft ball that flattens readily. Its shape, rather than amber colour, identifies the test.', image: 'A pale translucent cooled syrup ball spreading into a soft mound.' },
			{ name: 'Firm-ball test', description: 'At roughly 245–250°F (118–121°C), the cooled sample holds a ball but remains pliable. Compare its retained shape with the softer sample.', image: 'A pale translucent cooled syrup ball retaining its rounded form.' },
			{ name: 'Hard-crack test', description: 'At roughly 300–310°F (149–154°C), cooled syrup forms brittle threads that snap. This is a texture check, not the name for dark caramel.', image: 'Clear to faintly golden brittle sugar threads with broken ends.' },
			{ name: 'Pale caramel', description: 'A light golden colour marks early browning in this comparison. Watch against a pale background and follow the recipe’s intended flavour.', image: 'A thin layer of pale golden caramel in an ivory dish.' },
			{ name: 'Amber caramel', description: 'The deeper amber sample shows more browning. Caramelisation creates flavours beyond simple sweetness.', image: 'An amber caramel sample in a matching ivory dish.' },
			{ name: 'Dark caramel', description: 'The darker sample illustrates a stronger colour, not a universally better result. Control residual heat and stop before the batch develops a burnt flavour.', image: 'A dark reddish-brown caramel sample in a matching ivory dish.' }
		],
		learning: {
			observe: 'Separate the upper row’s cooled shapes from the lower row’s colours. A clear syrup can already have a useful confectionery structure.',
			explain: 'Water loss changes syrup concentration and its cooled texture. Caramel browning adds a different set of changes; the two observations are not interchangeable.',
			apply: 'Connect New Orleans Bread Pudding’s pralines and whiskey caramel with two different sugar preparations. Confirm the house formulas before describing a precise stage.',
			question: 'Would you wait for amber colour when a recipe asks for soft ball?',
			answer: 'No. Use the specified temperature and cooled-texture test. Amber colour belongs to the separate caramel comparison, and would not be the soft-ball endpoint.'
		},
		links: [{ label: 'Sugar stages and caramel', href: '/technique/sugar-stages-and-caramel' }, { label: 'Caramel stages in the Lexicon', href: '/lexicon#caramel-stages-and-sugar-work' }, { label: 'Caramel lesson', href: '/cuisine?ch=pastry&e=caramel' }],
		techniques: ['sugar-stages-and-caramel'], dishes: ['d-un9zb9af'],
		sources: [
			{ title: 'Exploratorium: candy stages and cold-water tests', url: 'https://annex.exploratorium.edu/cooking/bread/sugar-stages.html' },
			{ title: 'Colorado State University Extension: candy making at elevation', url: 'https://extension.colostate.edu/resource/candy-making-at-high-elevation/' }
		]
	},
	{
		id: 'choux-structure', group: 'cooks-eye', title: 'Choux: from cooked paste to a hollow shell',
		intro: 'Follow the paste from the saucepan to a cut-open puff. The empty cavity is part of the intended structure.',
		scope: 'A general unfilled cream-puff study, not a Brennan’s dish or formula. Paste consistency, piping size, oven settings and drying depend on the chosen recipe. A collapsed shell alone cannot reveal its cause.',
		image: artwork('choux-structure'), focus: fourViews,
		subjects: [
			{ name: 'Cook the panade', description: 'The flour and hot liquid form a thick cohesive paste. Follow the recipe’s cooking step before cooling enough to incorporate eggs.', image: 'A smooth pale paste gathered together in a saucepan.' },
			{ name: 'Incorporate the eggs', description: 'Mix eggs in gradually, incorporating each addition. The finished paste is smooth and pipeable; the lifted sample shows a soft tapered V.', image: 'Glossy choux paste hanging in a thick tapered V from a lifted spatula.' },
			{ name: 'Pipe with room to expand', description: 'Similar-sized mounds help the batch bake consistently. Leave space between them and keep the recipe’s intended shape.', image: 'Even pale choux mounds spaced apart on a lined baking tray.' },
			{ name: 'Examine the baked cavity', description: 'Steam expands the paste while the shell sets. The cut puff reveals a hollow interior; complete the recipe’s drying and cooling before filling.', image: 'Golden baked puffs with one cut open to show a large empty cavity.' }
		],
		learning: {
			observe: 'Compare the compact cooked paste with the room inside the baked shell. Look for a pipeable paste rather than a pourable batter.',
			explain: 'Choux uses moisture turning to steam for lift. Its structure must set and dry enough to hold the space that expansion creates.',
			apply: 'Use this to explain the shell of a profiterole or éclair, then connect its filling to the custard study. Name the shell and filling separately at the table.',
			question: 'A puff collapses after baking. Does the picture prove that too much egg was added?',
			answer: 'No. Review the formula, paste consistency, piping, oven and drying process. Similar-looking collapse can follow different problems; the still image is not a diagnosis.'
		},
		links: [{ label: 'Choux technique', href: '/technique/choux-pastry' }, { label: 'Choux lesson', href: '/cuisine?ch=pastry&e=choux' }],
		techniques: ['choux-pastry'], dishes: [],
		sources: [
			{ title: 'King Arthur Baking: pâte à choux method', url: 'https://www.kingarthurbaking.com/recipes/pate-a-choux-recipe' },
			{ title: 'King Arthur Baking: choux expansion, setting and drying', url: 'https://www.kingarthurbaking.com/blog/2018/06/12/pate-a-choux-perfected' }
		]
	},
	{
		id: 'panisse-grits-polenta', group: 'cooks-eye', title: 'Panisse, grits and polenta: start with the ingredient',
		intro: 'Three side-by-side preparations connect a dry ingredient with its cooked texture and serving form.',
		scope: 'These selected examples show chickpea panisse, maize grits and maize polenta. Grind, colour and consistency vary. Hominy involves alkali-treated maize; not all grits are hominy. Rice grits are a different ingredient. Illustrations cannot confirm allergens or a house recipe.',
		image: artwork('panisse-grits-polenta'), focus: threeViews,
		subjects: [
			{ name: 'Chickpea panisse', description: 'Finely milled chickpea flour cooks into a thick mixture that can be cooled, cut and fried. The illustrated crisp batons come from a legume, not maize.', image: 'Chickpeas and pale chickpea flour above a set block and golden panisse batons.' },
			{ name: 'Maize grits', description: 'Ground maize cooks into a spoonable porridge in this example. Grits can also be cooled and formed into cakes; the recipe determines the final texture.', image: 'Pale ground maize above a bowl of creamy grits with visible fine grains.' },
			{ name: 'Maize polenta', description: 'This example uses yellow maize meal cooked to a soft consistency. Polenta can also be set and fried; colour or firmness alone cannot distinguish it from grits.', image: 'Yellow maize meal above a bowl of soft golden polenta.' }
		],
		learning: {
			observe: 'Name the source ingredient first. Then describe whether the preparation is spoonable, set or crisp at the surface.',
			explain: 'Ingredient and method are separate questions. Similar-looking starch preparations can use different plants, grinds and finishing techniques.',
			apply: 'Fish Bouillabaisse names chickpea panisse. New Orleans Shrimp & Grits names a fried pimento-cheese grit cake, not the creamy bowl shown here. Use that distinction in your tableside description.',
			question: 'A guest asks whether panisse is polenta, and whether all grits are made from hominy. How do you answer?',
			answer: 'Panisse here is made from chickpea flour; the illustrated polenta uses maize. Some grits use hominy, while others use ground maize without that treatment. Check the actual product and recipe.'
		},
		links: [{ label: 'Polenta in the Lexicon', href: '/lexicon#polenta' }, { label: 'Shrimp and grits lesson', href: '/cuisine?ch=brennans&e=shrimp-and-grits' }],
		techniques: [], dishes: ['d-iwmu4qf7', 'd-bqznncn6', 'd-594lmt4x'],
		sources: [
			{ title: 'David Lebovitz: chickpea panisse method', url: 'https://www.davidlebovitz.com/panisses-1/' },
			{ title: 'Anson Mills: coarse maize grits', url: 'https://www.ansonmills.com/recipes/489' },
			{ title: 'Anson Mills: soft maize polenta', url: 'https://www.ansonmills.com/recipes/532' },
			{ title: 'Anson Mills: fresh hominy grits and lime treatment', url: 'https://www.ansonmills.com/recipes/618' }
		]
	},
	{
		id: 'beurre-blanc-process', group: 'cooks-eye', title: 'Beurre blanc: reduction, emulsion and separation',
		intro: 'Follow the acidic reduction into a smooth butter sauce, then compare it with a separate failure example.',
		scope: 'This wine, vinegar, shallot and butter example follows a classic general method. It does not specify Brennan’s preserved-lemon version. The fourth view is a separated sauce, not a desirable final stage.',
		image: artwork('beurre-blanc-process'), focus: fourViews,
		subjects: [
			{ name: 'Keep a little reduction', description: 'Reduce wine, vinegar and shallot to a small amount of liquid. A completely dry pan would not show the intended starting base.', image: 'A small pool of pale reduction with finely chopped shallots in a saucepan.' },
			{ name: 'Work in chilled butter', description: 'Whisk in pieces of chilled butter gradually with controlled gentle heat. Keep the mixture moving as each addition joins the sauce.', image: 'Butter cubes partly melting into a pale creamy mixture beside a whisk.' },
			{ name: 'A cohesive sauce', description: 'The sauce looks creamy and unified, with no free oily layer. Judge its consistency and seasoning against the intended recipe.', image: 'Smooth ivory butter sauce coating a spoon above a white serving bowl.' },
			{ name: 'A separated comparison', description: 'Visible yellow fat and thinner liquid show separation. Check the temperature and method before attempting a recipe-specific recovery.', image: 'Yellow butterfat pools and thin pale liquid visibly separated in a white serving bowl.' }
		],
		learning: {
			observe: 'Compare the unified surface in view 3 with the separate fat and liquid in view 4.',
			explain: 'Gradual butter incorporation creates an emulsion. Excess heat can disrupt it; this classic method uses no egg yolk.',
			apply: 'For Redfish Véronique, describe the preserved-lemon beurre blanc named in the house notes. Learn the underlying emulsion here, then confirm the actual finish at lineup.',
			question: 'Is a yellow oil slick the intended result, and is an egg yolk required for this classic beurre blanc?',
			answer: 'No to both. The oil slick signals separation in this comparison. This wine-and-vinegar reduction is mounted with butter without an egg-yolk base.'
		},
		links: [{ label: 'Beurre blanc technique', href: '/technique/beurre-blanc' }, { label: 'Beurre blanc lesson', href: '/cuisine?ch=butter-emulsions&e=beurre-blanc' }],
		techniques: ['beurre-blanc'], dishes: ['d-s1bqzuks'],
		sources: [{ title: 'James Beard Foundation: beurre blanc method', url: 'https://archive.jamesbeard.org/recipes/beurre-blanc' }]
	}
];
