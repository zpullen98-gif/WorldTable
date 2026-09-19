/* The Floor Deck, section "southern". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0001', term: 'Black-Eyed Peas', packet: true, planned: true },
	{ id: 'fd_0002', term: 'Chicken-Fried', packet: true, planned: true },
	{ id: 'fd_0003', term: 'Chow-Chow', packet: true, planned: true },
	{ id: 'fd_0004', term: 'Coleslaw', packet: true, planned: true },
	{ id: 'fd_0005', term: 'Hash', packet: true, planned: true },
	{ id: 'fd_0006', term: 'Hoecakes', packet: true, planned: true },
	{ id: 'fd_0007', term: 'Hominy', packet: true, planned: true },
	{ id: 'fd_0008', term: "Hoppin' John", packet: true, planned: true },
	{ id: 'fd_0009', term: 'Muscadine', packet: true, planned: true },
	{ id: 'fd_0010', term: 'Scuppernong', packet: true, planned: true },
	{ id: 'fd_0011', term: 'Sorghum', packet: true, planned: true },
	{ id: 'fd_0012', term: 'Red-Eye Gravy', packet: true, planned: true },
	{ id: 'fd_0013', term: 'Succotash', packet: true, planned: true },
	{ id: 'fd_0014', term: 'Collard Greens', planned: true },
	{ id: 'fd_0015', term: 'Pot Likker', planned: true },
	{ id: 'fd_0016', term: 'Field Peas', planned: true },
	{ id: 'fd_0017', term: 'Benne', planned: true },
	{ id: 'fd_0018', term: 'Carolina Gold Rice', planned: true },
	{ id: 'fd_0019', term: 'Pimento Cheese', planned: true },
	{ id: 'fd_0020', term: 'Cornbread', planned: true },
	{ id: 'fd_0021', term: 'Hushpuppies', planned: true },
	{ id: 'fd_0022', term: 'Okra', planned: true },
	{ id: 'fd_0023', term: 'Boiled Peanuts', planned: true },
	{ id: 'fd_0024', term: 'Pepper Vinegar', planned: true }
];

export default cards;
