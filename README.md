# AirBeat

Bateria virtual em realidade aumentada que roda no navegador. A câmera frontal mostra você como
num espelho, uma bateria minimalista aparece à sua frente e você toca com as próprias mãos.
Lições curtas ensinam pulsação e ritmo, com nota de precisão e calibragem de latência.

Projeto Aplicado V (Realidade Virtual e Aumentada), UNDF, 2026.2.

## Rodar localmente

Requer Node.js 22.13 ou mais recente.

```bash
npm install
npm run dev        # http://localhost:5173 (a câmera funciona em localhost sem HTTPS)
npm test           # testes automáticos (Vitest)
npm run lint       # ESLint + Prettier
npm run build      # gera dist/
npm run preview    # serve o build local
```

No celular a câmera só abre em HTTPS. Use o link publicado no GitHub Pages.

## Publicação

Todo merge na `main` roda lint, testes e build e publica no GitHub Pages
(`.github/workflows/deploy.yml`). Pull requests rodam lint, testes e build
(`.github/workflows/ci.yml`).

Configuração única no GitHub: _Settings → Pages → Build and deployment → Source: GitHub Actions_.

## Privacidade

O vídeo é processado só no seu dispositivo. Nenhuma imagem é gravada ou enviada.

## Documentos

- `docs/projeto/`: One-Page Concept, XRD, Plano de Projeto e backlog.
- `docs/TESTES.md`: checklist de testes manuais por dispositivo.
- `ASSETS.md`: origem e licença de todo asset usado.
