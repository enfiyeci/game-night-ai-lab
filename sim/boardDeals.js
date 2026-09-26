// Deals made in a board meeting (spec §5.2). Task 2 fills in the catalogue, making and judging.
export const openDeal = (state, id) => (state.boardDeals ?? []).some((deal) => deal.member === id && deal.status === 'open');
