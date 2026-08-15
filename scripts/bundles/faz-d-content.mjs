/**
 * Faz D content packs — loaded by faz-d-build.mjs
 */
import { loadChat } from './faz-d-chat.mjs';
import { loadLegal } from './faz-d-legal.mjs';
import { loadDocsHub } from './faz-d-docs.mjs';
import { loadEconomy } from './faz-d-economy.mjs';
import { loadErrors } from './faz-d-errors.mjs';

export function loadRest(add, addMany, _PRODUCT) {
  loadChat(add, addMany);
  loadLegal(add, addMany);
  loadDocsHub(add, addMany);
  loadEconomy(add, addMany);
  loadErrors(add, addMany);
}
