// Simple in-memory users store for the demo
(function(){
  window.APP_USERS = (window.APP_USERS || [
    { email: "info@aicorporation.al", name: "AIC", role: "editor" },
    { email: "edit@aicorporation.al", name: "Editor", role: "editor" },
    { email: "view@aicorporation.al", name: "Viewer", role: "viewer" }
  ]);
  window.UsersStore = (function(){
    let arr = Array.isArray(window.APP_USERS) ? window.APP_USERS.slice() : [];
    return {
      all: function(){ return arr.slice(); },
      add: function(u){
        const email = (u && u.email || "").toLowerCase();
        arr = arr.filter(x => (x.email||"").toLowerCase() !== email).concat([u]);
      },
      remove: function(email){
        const e = (email||"").toLowerCase();
        arr = arr.filter(x => (x.email||"").toLowerCase() != e);
      }
    };
  })();
})();
