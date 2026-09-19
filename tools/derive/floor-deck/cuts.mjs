/* The Floor Deck, section "cuts". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0086', term: 'Ribeye Cap', packet: true, planned: true },
	{ id: 'fd_0087', term: 'Cheek', packet: true, planned: true },
	{ id: 'fd_0088', term: 'Hanger Steak', packet: true, planned: true },
	{ id: 'fd_0089', term: 'Ham Hock', packet: true, planned: true },
	{ id: 'fd_0090', term: 'Ribeye', packet: true, planned: true },
	{ id: 'fd_0091', term: 'Shoulder', packet: true, planned: true },
	{ id: 'fd_0092', term: 'Short Rib', packet: true, planned: true },
	{ id: 'fd_0093', term: 'Tenderloin', packet: true, planned: true },
	{ id: 'fd_0094', term: 'Pork Belly', packet: true, planned: true },
	{ id: 'fd_0095', term: 'New York Strip', planned: true },
	{ id: 'fd_0096', term: 'Porterhouse and T-Bone', planned: true },
	{ id: 'fd_0097', term: 'Flank Steak', planned: true },
	{ id: 'fd_0098', term: 'Skirt Steak', planned: true },
	{ id: 'fd_0099', term: 'Bavette', planned: true },
	{ id: 'fd_0100', term: 'Flat Iron Steak', planned: true },
	{ id: 'fd_0101', term: 'Brisket', planned: true },
	{ id: 'fd_0102', term: 'Oxtail', planned: true },
	{ id: 'fd_0103', term: 'Shank', planned: true },
	{ id: 'fd_0104', term: 'Coulotte', planned: true },
	{ id: 'fd_0105', term: 'Rack of Lamb', planned: true },
	{ id: 'fd_0106', term: 'Pork Chop', planned: true },
	{ id: 'fd_0107', term: 'Wagyu', planned: true }
];

export default cards;
