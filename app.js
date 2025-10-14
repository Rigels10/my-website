// bootstrap Firestore read (opsionale) - mund ta zëvendësosh me kodin tënd
window.addEventListener('load', function(){
  if (!window.firebase) return;
  try{
    const db = firebase.firestore();
    console.log('[AIC] Firestore gati');
  }catch(e){ console.warn(e); }
});
