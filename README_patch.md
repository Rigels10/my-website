# Deploy notes (cache fixes)

Ky paketim bën dy gjëra kryesore:
1) **Lehtëson cache-n** për `.js/.css` në `firebase.json` (`public,max-age=600`) dhe mban `HTML` me `no-cache`.
2) Shton **cache-buster** automatik `?v=1760445928` në `index.html` për skriptet/stilet lokale, dhe komenton disa rreshta të rrezikshme (`provider.setCustomParameters(...)` dhe `catch` pa `try`).

## Si ta përdorësh
1. Zëvendëso skedarët në projektin tënd me këta në folderin `patched/`.
2. Bëj deploy:
   ```bash
   firebase deploy
   ```
3. Testo në shfletues me **Hard Refresh** (Ctrl/Cmd+Shift+R).

## Variante DEV/PROD (opsionale)
- **DEV**: lëre `max-age=600` (ose `no-cache`) gjatë zhvillimit.
- **PROD**: nëse përdor një build që vendos hash në emrat e skedarëve (p.sh. Vite/CRA: `app.abc123.js`), mund të rrisësh cache-n në `31536000,immutable` për `.js/.css`.

> Nëse sheh ndonjë error në Console pas patch-it, më dërgo një screenshot që ta rregullojmë shpejt.
