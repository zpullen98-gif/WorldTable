import type { TeachingFolio } from './teaching-folios';

// Reviewed against the four numbered panels. The complete artwork remains available.
const fourViews = [0.005, 0.49].flatMap(y => [0.005, 0.505].map(x => ({
	x, y, width: 0.49, height: y < 0.1 ? 0.48 : 0.505
})));
const artwork = (id: string) => ({ src: `standards/${id}-study-v1.webp`, thumb: `standards/${id}-study-v1.thumb.webp`, width: 1536, height: 1024 });

/** Readiness and communication studies, not a restaurant's verified operating procedures. */
export const PROFESSIONAL_PASS_TEACHING_FOLIOS: readonly TeachingFolio[] = [
	{
		id: 'mise-to-pass', group: 'professional-pass', title: 'Mise en place: from station to pass',
		intro: 'Follow a mushroom-and-polenta exercise from prepared ingredients to a coordinated handoff. Order at the station creates room to pay attention.',
		scope: 'This is an illustrative kitchen exercise, not a Brennan’s recipe or station plan. The picture does not establish cooking temperatures, holding conditions, portion weights or allergen controls; confirm those separately.',
		image: artwork('mise-to-pass'), focus: fourViews,
		subjects: [
			{ name: 'Organise the mise', description: 'Read the recipe and service plan first. Gather equipment, measure ingredients and complete the needed preparation. Arrange the station in working order, keeping food under its required storage conditions.', image: 'Prepared mushrooms, herbs, butter and a cream jug beside cookware and a pan of polenta.' },
			{ name: 'Coordinate the cooking', description: 'Use the service order to time the components together. The mushrooms and polenta have separate checks; readiness is more than having every pan on the stove.', image: 'Mushrooms cooking in a sauté pan beside a separate saucepan of polenta.' },
			{ name: 'Check the plates', description: 'Compare the portions and placement, check the actual order and verify seasoning and required temperatures. A matching appearance is a consistency cue, not proof that the plates meet every requirement.', image: 'Two matching plates of mushrooms over creamy polenta at the pass.' },
			{ name: 'Make a clear handoff', description: 'Confirm table, seat, dish and any agreed modifications with the runner or server. Resolve uncertainty before pickup. A declared-allergy order follows its own verified handoff and is carried separately.', image: 'The two finished plates on a tray at the pass, supported by a server’s hands.' }
		],
		learning: {
			observe: 'Trace the movement from ingredients to pans, plates and pickup. Name one check that cannot be performed from the picture alone.',
			explain: 'Mise en place includes understanding the work as well as preparing ingredients. A tidy station helps, but timing, communication and verification carry the dish through service.',
			apply: 'Before your next shift, rehearse one dish: components, order of work, checks at the pass and the words you will use to confirm the pickup.',
			question: 'Two plates look identical at the pass. What still needs checking before you carry them?',
			answer: 'Confirm the order, table and seats, any modifications, required temperature checks and readiness of the whole pickup. Appearance alone does not verify ingredients, allergens or the correct guest.'
		},
		links: [{ label: 'Mise en place lesson and practice', href: '/cuisine?ch=foundations&e=mise-en-place' }, { label: 'The allergy conversation', href: '/cuisine?ch=safety&e=allergen-conversation' }],
		techniques: [], dishes: [],
		sources: [
			{ title: 'Culinary Institute of America: perfect your mise en place', url: 'https://www.ciafoodies.com/perfect-your-mise-en-place/' },
			{ title: 'ServSafe: communication when serving guests with food allergies', url: 'https://www.servsafe.com/ServSafe-Blog/May-2018/Communication-is-Key-to-Safely-Serving-Guests-with' }
		]
	},
	{
		id: 'thermometer-placement', group: 'professional-pass', title: 'The thermometer: measure the food, not its colour',
		intro: 'Compare probe placement in a thin portion and a thick boneless portion. The measuring area must reach the place you intend to check.',
		scope: 'The small insets are simplified placement diagrams, not anatomical sections or a scale for insertion depth. This fine-tip digital probe represents one instrument type: follow your own model’s sensing-area, calibration and care instructions. Blank displays provide no temperature reading.',
		image: artwork('thermometer-placement'), focus: fourViews,
		subjects: [
			{ name: 'Know the sensing area', description: 'Check where your thermometer measures and how far it must be inserted. A fine-tip thermocouple and a dial stem can need different depths. Check accuracy according to the manufacturer and your kitchen’s procedure.', image: 'An unbranded folding digital food thermometer with a blank screen and an enlarged probe-tip detail.' },
			{ name: 'Enter a thin portion from the side', description: 'For a thin patty, insert a suitable probe through the side so its sensing area reaches the centre. Avoid measuring against the cooking surface. The inset shows the intended internal location.', image: 'A probe entering the side of an intact thin patty, with a separate diagram placing the tip at its centre.' },
			{ name: 'Check a thick portion internally', description: 'Place the sensing area in the thickest part, away from bone, fat and gristle. Check more than one location in large or irregular food. Read against the food’s required time-and-temperature standard; do not assume carryover will make it safe.', image: 'A probe entering an intact thick boneless roast, with a separate centre-placement diagram.' },
			{ name: 'Clean between checks', description: 'The picture shows washing only. Wash, rinse, sanitise and air-dry the food-contact probe between uses, following the instrument and sanitiser instructions. Keep non-waterproof electronics out of the water.', image: 'The metal probe being washed over a sink with a soapy cloth while the handle stays above the water.' }
		],
		learning: {
			observe: 'Locate the entry point and the intended measuring point in each food. Notice that the display supplies no reading to memorise.',
			explain: 'Surface browning describes the exterior. A correctly placed, accurate thermometer measures an internal location; its result must still be checked against the appropriate cooking process.',
			apply: 'With your trainer, identify the sensing area of the actual kitchen probe. Practise side entry on a thin portion and identify the required cleaning steps before the next food.',
			question: 'A patty is brown outside and the probe touches its upper surface. Have you established its internal cooking temperature?',
			answer: 'No. Use a suitable clean probe with its sensing area inside the centre, normally entering a thin patty from the side. Check the actual reading and required time-and-temperature standard; surface colour and predicted carryover are not substitutes.'
		},
		links: [{ label: 'Cooking temperatures and measurement', href: '/cuisine?ch=safety&e=cooking-temperatures' }, { label: 'Resting, carryover and the thermometer', href: '/lexicon#resting-carryover-and-the-thermometer' }],
		techniques: [], dishes: [],
		sources: [
			{ title: 'USDA FSIS: food thermometers and correct placement', url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/food-thermometers' },
			{ title: 'NC State Extension: measuring the heat and cleaning the probe', url: 'https://content.ces.ncsu.edu/measuring-the-heat' },
			{ title: 'USDA FSIS: cleaning a food thermometer', url: 'https://ask.fsis.usda.gov/article/What-is-the-proper-way-to-clean-a-food-thermometer' }
		]
	},
	{
		id: 'allergy-handoff', group: 'professional-pass', title: 'The allergy handoff: listen, verify, prepare, confirm',
		intro: 'Follow the information as carefully as the plate. A clear conversation must reach the kitchen and return with a verified answer.',
		scope: 'This is a general communication example, not Brennan’s approved allergy procedure. The rice-and-broccoli plate is illustrative: its appearance cannot establish ingredients, cross-contact controls or suitability for any particular guest.',
		image: artwork('allergy-handoff'), focus: fourViews,
		subjects: [
			{ name: 'Listen and record', description: 'Ask which ingredient must be avoided, record the guest’s exact concern and repeat it back. Identify the guest’s seat. Bring the request to the designated chef or manager before promising an accommodation.', image: 'A guest speaking with a server who holds a notepad at the table.' },
			{ name: 'Verify the whole preparation', description: 'Check the current recipe, ingredient labels, sauces, garnishes and preparation arrangements with the responsible person. A familiar dish name or an old recipe is not enough. Explain honestly if the kitchen cannot accommodate the request.', image: 'The server and chef consulting a recipe binder and a packaged ingredient.' },
			{ name: 'Control cross-contact', description: 'Use the verified ingredients, cleaned and sanitised equipment and work area, and proper handwashing. The picture shows plating, not proof of those controls. If an unwanted ingredient contacts the food, remake the dish; picking it off is insufficient.', image: 'A chef using tongs to place broccoli beside rice on a clean-looking plate at an orderly workstation.' },
			{ name: 'Confirm at pickup and service', description: 'Confirm the designated dish and any agreed modifications with the kitchen. Carry it separately and deliver it directly to the identified guest. If its identity or preparation is uncertain, pause and check again.', image: 'The server delivering the single prepared plate directly to the same seated guest.' }
		],
		learning: {
			observe: 'Identify who receives the request, who verifies it and who delivers the plate. Which parts of ingredient checking and cleaning remain invisible?',
			explain: 'Allergen cross-contact can happen through ingredients, utensils, surfaces or handling. Removing a visible garnish or applying heat does not reliably remove the allergen risk.',
			apply: 'Practise: “Thank you for telling me. I’ll check the ingredients and preparation with our chef before confirming what we can offer.” Then rehearse the pickup confirmation.',
			question: 'The kitchen notices the unwanted garnish on an otherwise correct allergy order. Can you remove it and serve the plate?',
			answer: 'No. Stop the pickup, tell the responsible chef or manager, and have the dish remade using the verified ingredients and controls. Confirm the replacement’s identity before carrying it separately to the guest.'
		},
		links: [{ label: 'Allergen conversation, checks and practice', href: '/cuisine?ch=safety&e=allergen-conversation' }],
		techniques: [], dishes: [],
		sources: [
			{ title: 'FARE: avoiding allergen cross-contact', url: 'https://www.foodallergy.org/resources/avoiding-cross-contact' },
			{ title: 'ServSafe: communication from guest to kitchen and back', url: 'https://www.servsafe.com/ServSafe-Blog/May-2018/Communication-is-Key-to-Safely-Serving-Guests-with' },
			{ title: 'FDA: allergen removal and transfer during retail cleaning', url: 'https://www.fda.gov/food/retail-food-protection/allergen-removal-and-transfer-using-wiping-and-cleaning-methods-retail-food-establishments' }
		]
	},
	{
		id: 'foster-readiness', group: 'professional-pass', title: 'Bananas Foster: the readiness before the theatre',
		intro: 'Begin with the guest and the preparation. This study connects Brennan’s signature dessert with the checks that make tableside hospitality composed and informed.',
		scope: 'The ingredients follow Brennan’s published recipe; the cart and finished arrangement are illustrative, not verified house equipment or plating. This is a readiness overview, not an ignition tutorial. Perform flambé only with hands-on training and the house’s approved equipment and procedures.',
		image: artwork('foster-readiness'), focus: fourViews,
		subjects: [
			{ name: 'Confirm the guest’s order', description: 'Describe bananas in a warm butter, brown-sugar and cinnamon sauce with banana liqueur and rum, served with vanilla ice cream. Check dietary and alcohol concerns before starting. Flambé does not make the dessert alcohol-free.', image: 'A server discussing the dessert with a seated guest before any cooking begins.' },
			{ name: 'Prepare the components', description: 'Recognise lengthwise banana pieces, butter, light brown sugar, cinnamon and separately measured spirits. Follow the current house recipe for quantities and service portions; the illustration is not a measuring guide.', image: 'Banana pieces, butter, brown sugar and cinnamon arranged beside two small metal cups of spirits.' },
			{ name: 'Check the unlit station', description: 'With equipment off, check stability, clearances, utensils, a suitable lid and the house’s fire-response equipment and procedures. Keep stock alcohol bottles away from heat; never pour directly from a bottle near a flame. Not every required item is pictured.', image: 'A generic tableside cart with a pan on an unlit burner, a nearby lid and a spoon on its rest.' },
			{ name: 'Recognise the serving contrast', description: 'The illustration pairs warm sauced bananas with cold vanilla ice cream. Confirm the house’s actual portion, presentation and service timing with your trainer. Explain the dessert clearly without promising that its alcohol has disappeared.', image: 'Lengthwise banana pieces in a glossy brown sauce with a scoop of vanilla ice cream.' }
		],
		learning: {
			observe: 'Separate guest confirmation, ingredient preparation, equipment readiness and the finished serving. Notice that none of the views demonstrates ignition.',
			explain: 'The theatre rests on preparation and clear communication. A flame can be dramatic, but it does not prove that every bit of alcohol has been removed.',
			apply: 'At lineup, confirm the current recipe, the trained operator, the approved cart checks and how to handle an alcohol-avoidance request. Verify an alternative dessert rather than guessing.',
			question: 'A guest must avoid alcohol. Is Bananas Foster suitable simply because it is flambéed?',
			answer: 'No. The recipe includes alcoholic ingredients and flambé is not an alcohol-free guarantee. Explain this, consult the chef or manager, and offer an alternative whose ingredients and preparation have been verified.'
		},
		links: [{ label: 'Bananas Foster at the table', href: '/cuisine?ch=brennans&e=bananas-foster-at-the-table' }, { label: 'Flambé safety and training', href: '/cuisine?ch=safety&e=flambe-safety' }, { label: 'Bananas Foster pastry lesson', href: '/cuisine?ch=pastry&e=bananas-foster' }],
		techniques: [], dishes: ['d-w6h1p19m'],
		sources: [
			{ title: 'Brennan’s: published Bananas Foster ingredients and recipe', url: 'https://www.brennansneworleans.com/bananas-foster' },
			{ title: 'Rouxbe: flambé safety note', url: 'https://pastryarts.rouxbe.com/tips-techniques/511-flambeing-safety-note' },
			{ title: 'Cornell University: study of flambé and ethanol loss', url: 'https://news.cornell.edu/stories/2012/06/study-flamb-doesnt-seem-enhance-flavor' }
		]
	}
];
