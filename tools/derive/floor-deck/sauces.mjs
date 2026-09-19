/* The Floor Deck, section "sauces". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0195', term: 'Aioli', packet: true, planned: true },
	{ id: 'fd_0196', term: 'Béarnaise', packet: true, planned: true },
	{ id: 'fd_0197', term: 'Hollandaise', packet: true, planned: true },
	{ id: 'fd_0198', term: 'Emulsion', packet: true, planned: true },
	{ id: 'fd_0199', term: 'Jus', packet: true, planned: true },
	{ id: 'fd_0200', term: 'Vinaigrette', packet: true, planned: true },
	{ id: 'fd_0201', term: 'Mignonette', packet: true, planned: true },
	{ id: 'fd_0202', term: 'Gastrique', packet: true, planned: true },
	{ id: 'fd_0203', term: 'Coulis', packet: true, planned: true },
	{ id: 'fd_0204', term: 'Consommé', packet: true, planned: true },
	{ id: 'fd_0205', term: 'Beurre Blanc', planned: true },
	{ id: 'fd_0206', term: 'Demi-Glace', planned: true },
	{ id: 'fd_0207', term: 'Velouté', planned: true },
	{ id: 'fd_0208', term: 'Béchamel', planned: true },
	{ id: 'fd_0209', term: 'Remoulade', planned: true },
	{ id: 'fd_0210', term: 'Chimichurri', planned: true },
	{ id: 'fd_0211', term: 'Salsa Verde', planned: true },
	{ id: 'fd_0212', term: 'Pesto', planned: true },
	{ id: 'fd_0213', term: 'Romesco', planned: true },
	{ id: 'fd_0214', term: 'Stock', planned: true },
	{ id: 'fd_0215', term: 'Agrodolce', planned: true }
];

export default cards;
