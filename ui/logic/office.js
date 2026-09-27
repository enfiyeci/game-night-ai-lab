// The framed constitution on the office wall (eras 3-5 art) appears once the lab has written one: from era 3, after
// the player adopts a draft in the Safety document or a model has learned one (constitution-era3 plan, Task 2).
// Until that lane lands, neither field exists and the wall stays bare.
export const constitutionOnWall = (state) => state.era >= 3
  && ((state.constitution?.version ?? 0) > 0 || Boolean(state.constitutionDraft));
