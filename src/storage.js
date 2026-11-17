// localStorage sempre dentro de try/catch: em aba anônima, com cookies bloqueados ou
// cota cheia ele lança erro, e o app tem que funcionar igual, só sem lembrar.

const PREFIX = 'airbeat:';

/**
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @param {Storage | undefined} [store] injetável para testes
 * @returns {T}
 */
export function load(key, fallback, store = safeStore()) {
  try {
    const raw = store?.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {Storage | undefined} [store]
 * @returns {boolean} false se não deu para salvar
 */
export function save(key, value, store = safeStore()) {
  try {
    store?.setItem(PREFIX + key, JSON.stringify(value));
    return Boolean(store);
  } catch {
    return false;
  }
}

/** Até ler `localStorage` pode lançar erro (Safari com cookies bloqueados). */
function safeStore() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
