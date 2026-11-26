// Telas das lições: lista, apresentação da lição e resultado. Só preenchem o DOM;
// quem decide o fluxo é o main.js.
import { tendencyText, verdict } from '../scoring.js';

/** @typedef {import('../lessons/lessons.js').Lesson} Lesson */

/** @param {string} id */
const el = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/**
 * @param {Lesson[]} lessons
 * @param {Record<string, number>} best melhor nota por lição
 * @param {(lesson: Lesson) => void} onPick
 */
export function renderLessonList(lessons, best, onPick) {
  const list = el('lesson-list');
  list.replaceChildren(
    ...lessons.map((lesson) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-item';
      const title = document.createElement('span');
      title.textContent = `${lesson.number}. ${lesson.title}`;
      const score = document.createElement('small');
      score.textContent = best[lesson.id] === undefined ? 'nova' : `melhor nota ${best[lesson.id]}`;
      button.append(title, score);
      button.addEventListener('click', () => onPick(lesson));
      return button;
    }),
  );
  return /** @type {HTMLButtonElement | null} */ (list.querySelector('button'));
}

/**
 * @param {Lesson} lesson
 * @param {boolean} calibrated
 */
export function fillLessonIntro(lesson, calibrated) {
  el('lesson-title').textContent = `Lição ${lesson.number} · ${lesson.title}`;
  el('lesson-goal').textContent = lesson.goal;
  el('lesson-info').textContent =
    `${lesson.bpm} BPM · ${lesson.bars} compassos. Primeiro o metrônomo conta 1, 2, 3, 4; ` +
    'depois, bata quando o contorno que desce encaixar na peça.';
  el('lesson-calibration').hidden = calibrated;
}

/**
 * @param {Lesson} lesson
 * @param {ReturnType<typeof import('../scoring.js').summarize>} s
 * @param {boolean} hasNext
 * @param {boolean} isBest
 */
export function fillResult(lesson, s, hasNext, isBest) {
  el('result-title').textContent = `Lição ${lesson.number} · ${lesson.title}`;
  el('result-score').textContent = String(s.score);
  el('result-best').hidden = !isBest;
  el('result-counts').textContent =
    `Perfeito ${s.perfect} · Bom ${s.good} · Errou ${s.miss}` +
    (s.extras ? ` · golpes a mais ${s.extras}` : '');
  el('result-verdict').textContent = verdict(s);
  const tendency = tendencyText(s.tendencyMs);
  el('result-tendency').textContent = tendency ?? '';
  el('result-tendency').hidden = !tendency;
  el('result-next').hidden = !hasNext;
}
