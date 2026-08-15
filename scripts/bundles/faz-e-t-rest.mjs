import { REST_A } from './faz-e-rest-a.mjs';
import { REST_B } from './faz-e-rest-b.mjs';
import { REST_C } from './faz-e-rest-c.mjs';
import { REST_D } from './faz-e-rest-d.mjs';

/** Merged remaining EN→[pt,id,es,de,fr,hu,ja,ko,ru] */
export const REST = { ...REST_A, ...REST_B, ...REST_C, ...REST_D };
