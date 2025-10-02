# Setup i shpejtë

1) Firebase Console → Authentication → aktivizo "Email/Password".
2) Firestore → krijo dokumente role për përdoruesit te `spaces/{workspace}/users/{uid}` (ose me fushë `email` për fallback).
   Shembull doc:
   {
     "email": "user@domain.com",
     "role": "editor",
     "name": "Emri"
   }
3) Sigurohu që `firebaseConfig` në `app.js` (ose ku e ke vendosur) ka vlerat e projektit tënd.
4) `firebase deploy --only hosting` ose shërbeje statikisht me GitHub Pages.

Tips për Rules (shkurt):
- Lejo `read` të `users` vetëm kur `request.auth != null`.
- Lejo `write` vetëm kur roli i user-it është "editor".