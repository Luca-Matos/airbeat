// Alterna as telas de sobreposição. Uma por vez; posicionamento e menu ficam
// sobre o vídeo, as outras cobrem tudo.

const SCREEN_IDS = ['intro', 'loading', 'error', 'position', 'menu', 'lessons', 'lesson', 'result'];

/**
 * Mostra só a tela pedida; `null` esconde todas (fica só o palco com o vídeo).
 * @param {'intro' | 'loading' | 'error' | 'position' | 'menu' | 'lessons' | 'lesson' | 'result' | null} name
 */
export function showScreen(name) {
  for (const id of SCREEN_IDS) {
    document.getElementById(`screen-${id}`).hidden = id !== name;
  }
}

/** @param {string} text */
export function showLoading(text) {
  document.getElementById('loading-text').textContent = text;
  showScreen('loading');
}

/** @param {string} text */
export function showError(text) {
  document.getElementById('error-text').textContent = text;
  showScreen('error');
}
