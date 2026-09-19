/* The Floor Deck, section "preparations". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0216', term: 'Carpaccio', packet: true, planned: true },
	{ id: 'fd_0217', term: 'Tartare', packet: true, planned: true },
	{ id: 'fd_0218', term: 'Frittata', packet: true, planned: true },
	{ id: 'fd_0219', term: 'Ragout', packet: true, planned: true },
	{ id: 'fd_0220', term: 'Crudo', planned: true },
	{ id: 'fd_0221', term: 'Ceviche', planned: true },
	{ id: 'fd_0222', term: 'Gravlax', planned: true },
	{ id: 'fd_0223', term: 'Tataki', planned: true },
	{ id: 'fd_0224', term: 'Escabeche', planned: true },
	{ id: 'fd_0225', term: 'Gratin', planned: true },
	{ id: 'fd_0226', term: 'Croquette', planned: true },
	{ id: 'fd_0227', term: 'Roulade', planned: true },
	{ id: 'fd_0228', term: 'Ballotine', planned: true },
	{ id: 'fd_0229', term: 'Cassoulet', planned: true },
	{ id: 'fd_0230', term: 'Bouillabaisse', planned: true },
	{ id: 'fd_0231', term: 'En Papillote', planned: true },
	{ id: 'fd_0232', term: 'Meunière', planned: true },
	{ id: 'fd_0233', term: 'Amandine', planned: true }
];

export default cards;
