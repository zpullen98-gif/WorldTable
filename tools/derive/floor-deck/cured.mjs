/* The Floor Deck, section "cured". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0064', term: 'Andouille', packet: true, planned: true },
	{ id: 'fd_0065', term: 'Chorizo', packet: true, planned: true },
	{ id: 'fd_0066', term: 'Coppa', packet: true, planned: true },
	{ id: 'fd_0067', term: 'Country Ham', packet: true, planned: true },
	{ id: 'fd_0068', term: 'Guanciale', packet: true, planned: true },
	{ id: 'fd_0069', term: 'Lardo', packet: true, planned: true },
	{ id: 'fd_0070', term: 'Lomo', packet: true, planned: true },
	{ id: 'fd_0071', term: 'Pancetta', packet: true, planned: true },
	{ id: 'fd_0072', term: 'Pastrami', packet: true, planned: true },
	{ id: 'fd_0073', term: 'Pâté', packet: true, planned: true },
	{ id: 'fd_0074', term: 'Prosciutto', packet: true, planned: true },
	{ id: 'fd_0075', term: 'Rillettes', packet: true, planned: true },
	{ id: 'fd_0076', term: 'Speck', packet: true, planned: true },
	{ id: 'fd_0077', term: 'Tasso', packet: true, planned: true },
	{ id: 'fd_0078', term: 'Charcuterie', planned: true },
	{ id: 'fd_0079', term: 'Bresaola', planned: true },
	{ id: 'fd_0080', term: 'Soppressata', planned: true },
	{ id: 'fd_0081', term: "'Nduja", planned: true },
	{ id: 'fd_0082', term: 'Jamón Ibérico', planned: true },
	{ id: 'fd_0083', term: 'Bacon', planned: true },
	{ id: 'fd_0084', term: 'Terrine', planned: true },
	{ id: 'fd_0085', term: 'Corned Beef', planned: true }
];

export default cards;
