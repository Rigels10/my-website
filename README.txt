AIC - Tasks & Users (Firebase)

Si ta perdoresh
---------------
1) Hap `index.html` me GitHub Pages ose lokalisht (duke pasur internet per CDN).
2) Workspace ID merret nga query param: `?space=aic` (default aic).
3) Tab USERS: shto/hiq email-e. Ato perdoren si owner te tasks.
4) Tab TASKS: shto task, ndrysho status, filtro sipas owner/status – real-time ne te gjitha pajisjet.
5) Rregullat e Firestore jane ne `firestore.rules.txt` (per demo lejojne te gjithe; shtrengoji sipas nevojes).

Struktura e te dhenave
----------------------
spaces/{WORKSPACE}/meta/meta => { users: [..] }
spaces/{WORKSPACE}/tasks/{autoId} => { title, owner, priority, status, createdAt, updatedAt }
