import type { TeachingFolio } from './teaching-folios';

const triptych = [0.02, 0.34, 0.66].map(x => ({ x, y: 0.05, width: 0.32, height: 0.88 }));
const pastaViews = [0, 1].flatMap(row => [0, 1, 2].map(col => ({
	x: 0.025 + col * 0.315, y: row === 0 ? 0.09 : 0.505, width: 0.315, height: row === 0 ? 0.4 : 0.37
})));
const artwork = (name: string) => ({ src: `standards/${name}-study-v1.webp`, thumb: `standards/${name}-study-v1.thumb.webp`, width: 1536, height: 1024 });

/** Original illustrations of general technique. House IDs supply application,
 * not an assertion of a current production formula, portion or plating standard. */
export const COOKS_EYE_TEACHING_FOLIOS: readonly TeachingFolio[] = [
	{
		id: 'brown-butter-study', group: 'cooks-eye', title: 'Brown butter: read the milk solids',
		intro: 'Follow the particles in the pan and spoon. The pale pan makes the change easier to see.',
		scope: 'An illustrated comparison, not a timer or a house recipe. The third view is a scorched batch, not a desired next stage. Check aroma and the intended recipe as well as appearance.',
		image: artwork('brown-butter'), focus: triptych,
		subjects: [
			{ name: 'Melting and foaming', description: 'Pale foam covers much of the yellow liquid. The milk solids have not yet developed the toasted colour shown in the middle view.', image: 'Pale foamy butter in an ivory pan, with a pale spoon sample.' },
			{ name: 'Toasted milk solids', description: 'Golden-brown particles stand out against the clear butterfat. Watch the solids closely; the pan remains hot after it leaves the heat.', image: 'Golden butterfat with brown particles, repeated in the spoon below.' },
			{ name: 'Scorched solids', description: 'Very dark particles mark a burnt comparison. Straining out the particles does not reliably remove the bitter flavour; make a fresh batch.', image: 'Near-black particles in darkened butter, with a matching spoon sample.' }
		],
		learning: {
			observe: 'Compare the particles, not only the overall colour of the liquid.',
			explain: 'Browning milk solids creates toasted flavour. Brown butter is different from clarified butter, from which solids have been removed.',
			apply: 'Use Swordfish Grenobloise to connect the technique with its brown butter, lemon and capers. Confirm the current finish with the kitchen.',
			question: 'Which view suits a brown-butter finish, and what would you check beyond colour?',
			answer: 'View 2 illustrates toasted solids. Check the aroma and the recipe’s intended stage, and account for continuing heat. View 3 is a failure comparison.'
		},
		links: [{ label: 'Brown-butter technique', href: '/technique/brown-butter' }],
		techniques: ['brown-butter'], dishes: ['d-jgihqqda', 'd-5p5b1hjn'],
		sources: [{ title: 'King Arthur Baking: how to brown butter', url: 'https://www.kingarthurbaking.com/blog/2020/01/08/brown-butter' }]
	},
	{
		id: 'custard-structures', group: 'cooks-eye', title: 'Custards: pouring, piping and setting',
		intro: 'Three separate preparations show how a cream can flow, hold a ridge or retain a smooth scoop.',
		scope: 'These are different formulas, not successive stages of one custard. The chocolate example is a general chilled crémeux; it does not specify Brennan’s recipe, gelatin content or plating. Appearance cannot establish safe preparation.',
		image: artwork('custard-structures'), focus: triptych,
		subjects: [
			{ name: 'Crème anglaise', description: 'A pouring custard coats the spoon and flows back into the bowl. A starch-free stirred custard needs gentle, recipe-specific heating.', image: 'Pale vanilla cream flowing from a spoon into a bowl.' },
			{ name: 'Crème pâtissière', description: 'Pastry cream holds visible piped ridges. Its starch changes both structure and cooking method; follow its formula rather than a blanket rule against boiling custards.', image: 'Thick pale pastry cream in piped ridges, with a small piped sample below.' },
			{ name: 'Chilled chocolate crémeux', description: 'This dense, smooth example retains a scoop. A chocolate crémeux may combine a custard base with chocolate; its chilled structure depends on the formula.', image: 'A smooth dark chocolate cream with a scooped hollow and a dense spoonful.' }
		],
		learning: {
			observe: 'Look for flow, a held ridge and a retained scoop. The examples should not all have the same consistency.',
			explain: 'Egg, starch, chocolate and chilling contribute differently. Tempering is a mixing step, not a universal final temperature.',
			apply: 'Describe Chocolate Crémeux as smooth and creamy, then use the saved dish ingredients to explain its crumble, oil and salt. Do not infer allergens from the image.',
			question: 'Why would “never boil any custard” be misleading?',
			answer: 'A starch-free pouring custard and a starch-thickened pastry cream need different treatment. Use the specific formula and its verified process, not a single rule for every cream.'
		},
		links: [{ label: 'Tempering a custard', href: '/technique/tempering-a-custard' }, { label: 'Pastry-cream lesson', href: '/cuisine?ch=pastry&e=creme-patissiere' }],
		techniques: ['tempering-a-custard'], dishes: ['d-kgmv4fmp'],
		sources: [
			{ title: 'King Arthur Baking: pastry cream', url: 'https://www.kingarthurbaking.com/recipes/pastry-cream-creme-patissiere-recipe' },
			{ title: 'Valrhona: chocolate crémeux and its structure', url: 'https://www.valrhona.com/en/l-ecole-valrhona/discover-l-ecole-valrhona/chocolate-terminology/chocolate-cremeux/be-inspired' }
		]
	},
	{
		id: 'meringue-peaks', group: 'cooks-eye', title: 'Meringue: choose the intended peak',
		intro: 'Compare the drooping peak, bent tip and upright tip in matched bowls and whisk samples.',
		scope: 'These views compare texture. They do not identify French, Swiss or Italian preparation, pasteurisation or a safe-to-eat state. Stiffer is not always better; use the peak called for by the recipe.',
		image: artwork('meringue-peaks'), focus: triptych,
		subjects: [
			{ name: 'Soft peak', description: 'The peak bends over readily and settles into the foam. Check with the whisk rather than judging only the shiny surface.', image: 'A low drooping mound of white foam with a softly falling whisk sample.' },
			{ name: 'Medium peak', description: 'The body holds more shape while the tip bends. Peak names vary between recipes; match the recipe’s described behaviour.', image: 'A taller white peak with a visibly curved tip.' },
			{ name: 'Stiff peak', description: 'The lifted tip stands upright. This useful endpoint for some recipes is different from dry, clumpy overbeaten foam.', image: 'A firm tall upright white peak with a matching whisk sample.' }
		],
		learning: {
			observe: 'Compare the tip and the body beneath it, then check the actual mixture with a whisk.',
			explain: 'Whipping changes the foam’s ability to hold shape. A glossy surface alone cannot tell you the required endpoint.',
			apply: 'Connect Lemon Tart with its meringue component. Learn the texture here, then confirm the kitchen’s preparation and finish.',
			question: 'Your recipe asks for soft peaks. Should you keep whipping until view 3?',
			answer: 'No. View 1 is the intended comparison. More stiffness is a different result, not an automatic improvement.'
		},
		links: [{ label: 'Whipping a meringue', href: '/technique/whipping-a-meringue' }, { label: 'Meringue methods', href: '/cuisine?ch=pastry&e=meringues' }],
		techniques: ['whipping-a-meringue'], dishes: ['d-lfwbmoys'],
		sources: [{ title: 'King Arthur Baking: meringue rules', url: 'https://www.kingarthurbaking.com/blog/2018/05/17/meringue-rules' }]
	},
	{
		id: 'puff-pastry-layers', group: 'cooks-eye', title: 'Puff pastry: read the layers',
		intro: 'Look at the cut edge: a raw laminate, open baked layers and a closer layered structure.',
		scope: 'Layer thickness is enlarged for clarity; this is not a scale drawing or a fold-count specification. The lower third sample is a structural comparison, not proof of one baking fault. This is unyeasted puff pastry, not croissant dough.',
		image: artwork('puff-pastry'), focus: triptych,
		subjects: [
			{ name: 'Raw laminate', description: 'Dough and butter form distinct thin layers. Keep them separate through the recipe’s rolling, folding and chilling method.', image: 'An enlarged pale raw pastry edge with fine alternating strata.' },
			{ name: 'Open baked layers', description: 'Steam helps separate the layers during baking. The cut face shows delicate leaves and open spaces, rather than a bread-like crumb.', image: 'A tall golden pastry with many thin lifted leaves and open spaces.' },
			{ name: 'Closer baked layers', description: 'The leaves sit closer together and the piece is lower. The picture alone cannot explain the cause or whether that texture suits a particular recipe.', image: 'A lower golden pastry piece with closer layers visible at the cut edge.' }
		],
		learning: {
			observe: 'Use the cut edge, not only the glossy top, to describe the structure.',
			explain: 'Lamination separates dough with fat; water turning to steam helps lift the layers. Fold schedules and desired rise vary.',
			apply: 'Lamb Shank en Croûte combines tender lamb with pastry. Describe that contrast without assuming the house’s pastry supplier, fold count or assembly method.',
			question: 'Does a lower puff-pastry sample prove the oven was too cold?',
			answer: 'No. It is an observation, not a diagnosis. Review the formula, handling, intended shape and baking process before deciding why it rose differently.'
		},
		links: [{ label: 'Lamination technique', href: '/technique/lamination' }],
		techniques: ['lamination'], dishes: ['d-00p5tuen'],
		sources: [{ title: 'King Arthur Baking: puff pastry at the bakery', url: 'https://www.kingarthurbaking.com/blog/2013/08/02/puff-pastry-layer-it-like-the-pros' }]
	},
	{
		id: 'braise-confit-render', group: 'cooks-eye', title: 'Braise, confit and render: three different jobs',
		intro: 'Compare the cooking medium and the job it does. These are three separate methods, not a sequence.',
		scope: 'General method illustrations, not Brennan’s production instructions. Liquid depth, heat, time and the final texture depend on the recipe. A still cannot demonstrate tenderness, safe cooking, cooling or storage.',
		image: artwork('braise-confit-render'), focus: triptych,
		subjects: [
			{ name: 'Braising in liquid', description: 'Browned meat sits partly in a stock-based liquid in this example. Gentle moist cooking can tenderise a tougher cut; check the actual meat for the recipe’s intended texture.', image: 'Browned short-rib pieces partly submerged in brown liquid with vegetables.' },
			{ name: 'Duck confit in fat', description: 'The duck legs are covered by clear melted fat. Traditional duck confit uses seasoned or cured legs cooked gently in fat; crisping the skin is a separate finishing choice.', image: 'Two duck legs visible below a continuous clear golden fat surface.' },
			{ name: 'Rendering fat', description: 'Heating fatty tissue releases liquid fat. The small browned skin pieces are cracklings; rendering produces a cooking fat rather than a braised meat sauce.', image: 'Small curled golden skin pieces surrounded by clear released fat.' }
		],
		learning: {
			observe: 'Compare stock-based liquid, covering fat and fat released from small trimmings.',
			explain: 'Braising tenderises in a moist environment; confit cooks gently in fat; rendering releases fat from tissue.',
			apply: 'Relate braising to Eggs Owen and fall lamb, and confit to Duck Confit Waffle. Learn the distinction without treating these examples as house formulas.',
			question: 'Can the picture or a fixed cooking time prove that a braise is ready?',
			answer: 'No. Check tenderness, measured cooking requirements and the intended finish. An intact portion and pulled meat can both be correct for different recipes.'
		},
		links: [{ label: 'Braising', href: '/technique/braising' }, { label: 'Confit', href: '/technique/confit' }, { label: 'Rendering fat', href: '/technique/rendering-fat-and-cooking-in-what-runs-out' }],
		techniques: ['braising', 'confit', 'rendering-fat-and-cooking-in-what-runs-out'], dishes: ['d-44jfmkdb', 'd-00p5tuen', 'd-vbtv3rru'],
		sources: [
			{ title: 'Rouxbe: braising and combination cooking', url: 'https://rouxbe.com/cooking-school/braising-combination-cooking' },
			{ title: 'Culinary Institute of America: A Taste of France, duck confit and rendering, page 56', url: 'https://www.ciaconsulting.org/wp-content/uploads/2025/03/CIP-A-Taste-of-France-Course-Guide-v210-CP.pdf' }
		]
	},
	{
		id: 'agnolotti-shaping', group: 'cooks-eye', title: 'Agnolotti del plin: fold, pinch and seal',
		intro: 'Follow the filled sheet into compact pinched pockets, then examine the wrapper and filling in section.',
		scope: 'An illustrative general shaping sequence. Dough thickness, quantities, filling, size and cooking method are recipe-specific. The brown-green filling is a visual example, not an ingredient specification or Brennan’s approved shape.',
		image: artwork('agnolotti-shaping'), focus: pastaViews,
		subjects: [
			{ name: 'Place the filling', description: 'Spaced small mounds leave clean dough available for the fold and seals. Follow the recipe’s amount and spacing.', image: 'Three filling mounds spaced along one side of a pasta sheet.' },
			{ name: 'Fold and close', description: 'Fold the sheet over the filling and close the long edge. Avoid trapping air or filling in the seam.', image: 'A folded strip covering three mounds with a clean long margin.' },
			{ name: 'Pinch between pockets', description: 'Pinching between the mounds creates the defining constrictions. Preserve sealed dough between adjacent portions.', image: 'Connected filled pockets separated by upright pinched divisions.' },
			{ name: 'Separate the plin', description: 'Cut through the sealed areas to separate the pockets. The pinched ends should remain closed.', image: 'Three separate compact folded pockets with upright pinched ends.' },
			{ name: 'Inspect a seam', description: 'Look for a closed end and a compact folded form. An intact appearance still needs a careful hands-on seal check.', image: 'An enlarged folded pouch showing its narrow lip and pinched ends.' },
			{ name: 'Read the section', description: 'The cut example separates the thin wrapper from the filling. Learn the structure without inferring exact ingredients from its colour.', image: 'Two cut halves showing a thin pasta wrapper around fine brown-green filling.' }
		],
		learning: {
			observe: 'Follow the upright pinches from the joined row into the separated pockets.',
			explain: 'Plin refers to the pinch. The filled sheet is folded and pinched before the individual pockets are separated.',
			apply: 'For Brennan’s fall Agnolotti del Plin, use the saved ingredient list to explain pork, collards, ricotta, Parmesan and lemon pangrattato. This study explains the pasta form.',
			question: 'Which view creates the divisions that must stay sealed when the pasta is cut?',
			answer: 'View 3. The pinched dough divides the filling into pockets; the cuts in view 4 must preserve those seals.'
		},
		links: [{ label: 'Fresh pasta', href: '/technique/fresh-pasta' }, { label: 'Fresh-pasta lesson', href: '/cuisine?ch=larder&e=fresh-pasta' }],
		techniques: ['fresh-pasta'], dishes: ['d-u34mwyw8'],
		sources: [{ title: 'Eataly: agnolotti del plin shaping method', url: 'https://www.eataly.com/us_en/magazine/recipes/pasta-recipes/agnolotti-del-plin' }]
	}
];
