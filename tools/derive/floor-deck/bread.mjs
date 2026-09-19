/* The Floor Deck, section "bread". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0234', term: 'Beignets', packet: true, planned: true },
	{ id: 'fd_0235', term: 'Brioche', packet: true, planned: true },
	{ id: 'fd_0236', term: 'Focaccia', packet: true, planned: true },
	{ id: 'fd_0237', term: 'Sourdough', packet: true, planned: true },
	{ id: 'fd_0238', term: 'Macaron', packet: true, planned: true },
	{ id: 'fd_0239', term: 'Macaroon', packet: true, planned: true },
	{ id: 'fd_0240', term: 'Meringue', packet: true, planned: true },
	{ id: 'fd_0241', term: 'Tart', packet: true, planned: true },
	{ id: 'fd_0242', term: 'Torte', packet: true, planned: true },
	{ id: 'fd_0243', term: 'Pâte à Choux', planned: true },
	{ id: 'fd_0244', term: 'Puff Pastry', planned: true },
	{ id: 'fd_0245', term: 'Clafoutis', planned: true },
	{ id: 'fd_0246', term: 'Galette', planned: true },
	{ id: 'fd_0247', term: 'Pavlova', planned: true },
	{ id: 'fd_0248', term: 'Soufflé', planned: true }
];

export default cards;
