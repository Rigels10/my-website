# AIC Export ZIP — Firebase ready

- One ZIP with one `.xlsx` per Space, one sheet per List.
- ZIP name: `<workspace>-YYYY-MM-DD.zip` (e.g. `aic-2025-10-08.zip`).

## Deploy to Firebase
```bash
npm i -g firebase-tools
firebase login
firebase use aic-m-4460f
firebase deploy --only hosting
```

## Firestore
Create a collection `spaces` with documents shaped like:
```json
{
  "name": "Pallati i Sportit Asllan Rusi",
  "lists": [
    { "name": "Hapi 1", "columns": [ {"id":"c1","name":"Kosto","type":"text"} ], "tasks": [] }
  ]
}
```
