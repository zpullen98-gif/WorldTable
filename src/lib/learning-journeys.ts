/**
 * Small applied routes through the existing curriculum.
 * These links need no active house and make no claim about a live menu.
 * Fall lessons are the dated training-sheet collection; their service checks
 * remain the authority for what needs confirmation at lineup.
 */
export interface LearningJourney {
	id: string;
	title: string;
	outcome: string;
	steps: { label: string; href: string; why: string }[];
	selfCheck: string;
}

export const learningJourneys: readonly LearningJourney[] = [
	{
		id: 'read-a-plate',
		title: 'Read a plate, then tell its story',
		outcome: 'Turn unfamiliar menu words into a short, useful description of flavour and texture.',
		steps: [
			{ label: 'Identify: capers', href: '/foundations?term=vegetables-capers', why: 'Learn the ingredient before describing what it contributes. Notice the distinction between capers and caperberries.' },
			{ label: 'Compare: the fish', href: '/cuisine?ch=larder&e=swordfish', why: 'Build a vocabulary for texture, then separate the species from its cooking method and sauce.' },
			{ label: 'Describe: Swordfish Grenobloise', href: '/menu?view=fall&item=swordfish-grenobloise', why: 'Use the training sheet to name the fish, sauce and accompaniments. Read the checks before making a dietary promise.' },
			{ label: 'Practise: the whole dish', href: '/flashcards?deck=fall%3Aitem%3Aswordfish-grenobloise', why: 'Recall the components, explain one unfamiliar word and give the tableside description aloud.' }
		],
		selfCheck: 'Can I describe the dish in one sentence, explain a caper in everyday English and name one detail to confirm with the kitchen?'
	},
	{
		id: 'heat-and-tenderness',
		title: 'Choose heat to suit the cut',
		outcome: 'Explain why a tender cut and a working muscle need different treatment.',
		steps: [
			{ label: 'Identify: tenderloin', href: '/foundations?term=cuts-tenderloin', why: 'Start with the cut and its natural tenderness, before attaching a cooking method to it.' },
			{ label: 'Compare: braise and daube', href: '/cuisine?ch=methods&e=braise-and-daube', why: 'Learn how time, gentle heat and liquid change connective tissue; compare that goal with quick cooking.' },
			{ label: 'Describe: Lamb Shank en Croûte', href: '/menu?view=fall&item=lamb-shank-en-croute', why: 'Separate the slow-cooked filling, pastry and jus. Keep the sheet’s ingredients distinct from general daube traditions.' },
			{ label: 'Practise: braising decisions', href: '/cuisine?deck=e%3Acz-kdr0l5yp', why: 'Test the method, then explain why tenderness cannot be promised from a fixed cooking time alone.' }
		],
		selfCheck: 'Can I explain why shank benefits from slow cooking, what en croûte means and which parts of the house preparation still need confirmation?'
	},
	{
		id: 'sauce-family',
		title: 'Follow the sauce family',
		outcome: 'Connect a named sauce to its base, texture and role on the plate.',
		steps: [
			{ label: 'Identify: the mother sauces', href: '/cuisine?view=tree', why: 'Find the brown-sauce branch and see how a family is organised before memorising individual names.' },
			{ label: 'Compare: espagnole', href: '/cuisine?ch=mother-sauces&e=espagnole', why: 'Read its construction and follow the linked demi-glace comparison. The two names are related, but are not interchangeable.' },
			{ label: 'Describe: Chateau Espagnole', href: '/menu?view=fall&item=chateau-espagnole', why: 'Connect the sauce to the tenderloin and frascarelli in the supplied sheet. Do not turn a classic recipe into an assumed house recipe.' },
			{ label: 'Practise: the sauce', href: '/cuisine?deck=e%3Acz-r3uwjiif', why: 'Recall its base, method and common faults, then translate that knowledge into a guest-friendly description.' }
		],
		selfCheck: 'Can I distinguish espagnole from demi-glace and describe the sauce’s role without promising an unconfirmed ingredient?'
	},
	{
		id: 'pasta-and-place',
		title: 'Travel from pasta shape to plate',
		outcome: 'Use origin and technique to explain a dish without losing sight of its actual ingredients.',
		steps: [
			{ label: 'Identify: fresh pasta and agnolotti', href: '/cuisine?ch=larder&e=fresh-pasta', why: 'Learn the vocabulary of dough, filling and shape, then connect it to the regional tradition.' },
			{ label: 'Compare: the house pasta', href: '/menu?view=fall&item=agnolotti-del-plin', why: 'Compare the general tradition with the pork, greens, cheeses and lemon pangrattato listed on the training sheet.' },
			{ label: 'Describe: an allergy question', href: '/cuisine?ch=safety&e=allergen-conversation', why: 'Practise checking the filling, pasta, crumb and preparation rather than treating the main ingredient as the whole dish.' },
			{ label: 'Practise: Agnolotti del Plin', href: '/flashcards?deck=fall%3Aitem%3Aagnolotti-del-plin', why: 'Say the name, explain the shape and rehearse a concise description before testing the deeper ingredient notes.' }
		],
		selfCheck: 'Can I distinguish the regional background from this house version, explain pangrattato and pass an ingredient question to the kitchen clearly?'
	},
	{
		id: 'guest-questions',
		title: 'Answer the question behind the order',
		outcome: 'Give clear menu guidance while recognising when the kitchen must confirm an answer.',
		steps: [
			{ label: 'Identify: the guest’s need', href: '/cuisine?ch=safety&e=allergen-conversation', why: 'Learn to clarify the request, communicate it accurately and check the complete preparation.' },
			{ label: 'Compare: tartare components', href: '/menu?view=fall&item=steak-tartare-rye', why: 'Locate the raw beef, egg in the dressing, separate yolk and rye tuile. Removing a visible garnish does not describe the whole preparation.' },
			{ label: 'Describe: a different raw dish', href: '/menu?view=fall&item=tuna-crudo-tasting', why: 'Apply the same questioning to fish, salsa seca and accompaniments. Use the lesson’s explicit checks instead of transferring assumptions from tartare.' },
			{ label: 'Practise: the conversation', href: '/cuisine?deck=e%3Acz-d4n4pv0s', why: 'Rehearse what you can explain, what you must check and how you report the answer back to the guest.' }
		],
		selfCheck: 'Can I name the complete dish, state what is known and ask a precise kitchen question without saying that an unverified modification is safe?'
	},
	{
		id: 'dessert-texture',
		title: 'Finish with texture and clarity',
		outcome: 'Describe a dessert through its custard, texture and finishing elements.',
		steps: [
			{ label: 'Identify: crème anglaise', href: '/cuisine?ch=pastry&e=creme-anglaise', why: 'Understand a pouring custard and the care needed when heating it, before learning more elaborate desserts.' },
			{ label: 'Compare: crème pâtissière', href: '/cuisine?ch=pastry&e=creme-patissiere', why: 'Compare a thicker pastry cream with anglaise. Similar names do not mean identical ingredients or methods.' },
			{ label: 'Describe: Chocolate Crémeux', href: '/menu?view=fall&item=chocolate-cremeux-tasting', why: 'Return to the actual sheet for the crémeux, cocoa nib crumble, lemon olive oil and salt. Read its dietary notes and confirmation points.' },
			{ label: 'Practise: the dessert', href: '/flashcards?deck=fall%3Aitem%3Achocolate-cremeux-tasting', why: 'Recall each component, explain the contrasts and practise a short closing recommendation aloud.' }
		],
		selfCheck: 'Can I explain crémeux without calling every custard the same thing, describe the contrasting textures and identify the details that require a kitchen check?'
	}
];
