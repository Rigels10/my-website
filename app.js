import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, onSnapshot, orderBy, serverTimestamp, arrayUnion } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Config i projektit tend (e njejta si me pare)
const firebaseConfig = {
  apiKey: "AIzaSyDjttdgfTjtLtxdDNSYIqtKmh4FNYaB9vw",
  authDomain: "aic-projects-57baa.firebaseapp.com",
  projectId: "aic-projects-57baa",
  storageBucket: "aic-projects-57baa.firebasestorage.app",
  messagingSenderId: "267074355981",
  appId: "1:267074355981:web:38dd5942c5c8849218e644",
  measurementId: "G-4X4GTKYP2R"
};

const app = initializeApp(firebaseConfig);
\1
const auth = getAuth(app);

const params = new URLSearchParams(location.search);
const WORKSPACE = params.get("space")?.trim() || "aic";
document.getElementById("ws").textContent = WORKSPACE;

const statusEl = document.getElementById("status");
statusEl.innerHTML = '<span class="ok">Firebase u inicializua</span>';

// Paths
const metaRef  = doc(db, "spaces", WORKSPACE, "meta", "meta"); // users array
const tasksCol = collection(db, "spaces", WORKSPACE, "tasks");

// Ensure meta exists & clean users
async function ensureMeta(){
  const s = await getDoc(metaRef);
  if(!s.exists()){
    await setDoc(metaRef, { users: [], updatedAt: serverTimestamp() });
  }else{
    const data = s.data()||{};
    const users = (data.users||[]).filter(u=>typeof u==="string" && u.trim()).map(u=>u.trim().toLowerCase());
    if(JSON.stringify(users)!==JSON.stringify(data.users)){
      await updateDoc(metaRef, { users, updatedAt: serverTimestamp() });
    }
  }
}

// Fill owners
function fillOwners(users){
  const addSel = document.getElementById("t-owner");
  const fSel   = document.getElementById("f-owner");
  addSel.innerHTML = users.map(u=>`<option>${u}</option>`).join('') || '<option value="">(s\'ka users)</option>';
  fSel.innerHTML   = '<option value="">Owner: All</option>' + users.map(u=>`<option>${u}</option>`).join('');
}

// Render tasks list
function badge(p){ return `<span class="badge">${p}</span>`; }
function itemView(t){
  return `<div class="item">
    <div>
      <div class="title">${t.title||"(pa titull)"}</div>
      <div class="meta">owner: ${t.owner||"-"} • ${badge(t.priority||"medium")}</div>
    </div>
    <div class="meta">
      <select class="small" data-status="${t.id}">
        ${["OPEN","IN PROGRESS","DONE","CLOSED"].map(s=>`<option ${t.status===s?"selected":""}>${s}</option>`).join("")}
      </select>
      <button class="danger" data-del="${t.id}">Fshi</button>
    </div>
  </div>`;
}
function render(tasks){
  const box = document.getElementById("list");
  box.innerHTML = tasks.length ? tasks.map(itemView).join("") : '<div class="item"><div>(s\'ka tasks)</div></div>';

  box.querySelectorAll("select[data-status]").forEach(sel=>{
    sel.onchange = async () => {
      await updateDoc(doc(tasksCol, sel.dataset.status), { status: sel.value, updatedAt: serverTimestamp() });
    };
  });
  box.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.onclick = async () => { await deleteDoc(doc(tasksCol, btn.dataset.del)); };
  });
}

// Subscribe
function attach(){
  const fStatus = document.getElementById("f-status").value;
  const fOwner  = document.getElementById("f-owner").value;
  const q = query(tasksCol, orderBy("createdAt","desc"));
  onSnapshot(q, snap => {
    let arr = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    if(fStatus) arr = arr.filter(x=>x.status===fStatus);
    if(fOwner)  arr = arr.filter(x=>x.owner===fOwner);
    render(arr);
  });
}

document.getElementById("f-status").onchange = attach;
document.getElementById("f-owner").onchange  = attach;
document.getElementById("btnClear").onclick  = () => {
  document.getElementById("f-status").value="";
  document.getElementById("f-owner").value="";
  attach();
};

// Add task
document.getElementById("btnAdd").onclick = async () => {
  const title = document.getElementById("t-title").value.trim();
  const owner = document.getElementById("t-owner").value || "";
  const priority = document.getElementById("t-priority").value;
  const status = document.getElementById("t-status").value;
  if(!title){ statusEl.innerHTML = '<span class="bad">Shkruaj titullin</span>'; return; }
  await addDoc(tasksCol, { title, owner, priority, status, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  document.getElementById("t-title").value="";
};

// Real-time users -> owners
onSnapshot(metaRef, snap => {
  const data = snap.data()||{};
  fillOwners((data.users||[]).map(u=>u.trim().toLowerCase()));
});

await ensureMeta();
attach();

// === Auth session + role lookup (added) ===
const SESSION_KEY = "APP_SESSION";
const setSession = (s)=>localStorage.setItem(SESSION_KEY, JSON.stringify(s||{}));
const getSession = ()=>{ try{ return JSON.parse(localStorage.getItem(SESSION_KEY))||{}; }catch(e){ return {}; } };

async function fetchRoleFor(user){
  try{
    if(!user) return { role: 'viewer', name: '' };
    const email = (user.email||'').toLowerCase();
    const WORKSPACE = (new URLSearchParams(location.search).get('space') || 'aic').trim().toLowerCase();
    const { getDoc, doc, collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js");

    // First try by uid
    const byUidRef = doc(db, "spaces", WORKSPACE, "users", user.uid);
    const byUid = await getDoc(byUidRef);
    if(byUid.exists()){
      const d = byUid.data()||{};
      return { role: (d.role||'viewer').toLowerCase(), name: d.name || email.split('@')[0] };
    }
    // Fallback by email
    const usersCol = collection(db, "spaces", WORKSPACE, "users");
    const q = query(usersCol, where("email","==", email));
    const res = await getDocs(q);
    if(!res.empty){
      const d = res.docs[0].data()||{};
      return { role: (d.role||'viewer').toLowerCase(), name: d.name || email.split('@')[0] };
    }
    return { role: 'viewer', name: email.split('@')[0] };
  }catch(err){
    console.error("fetchRoleFor failed", err);
    const email = (user?.email||"").toLowerCase();
    return { role: 'viewer', name: email ? email.split('@')[0] : "" };
  }
}

window.AppAuth = {
  get session(){ return getSession(); },
  async signIn(email, password){
    const cred = await signInWithEmailAndPassword(auth, email, password).catch(async (e)=>{
      if(e.code === 'auth/user-not-found'){
        // Optional auto-create as viewer
        const created = await createUserWithEmailAndPassword(auth, email, password);
        return { user: created.user };
      }
      throw e;
    });
    const role = await fetchRoleFor(cred.user);
    setSession({ email: email.toLowerCase(), name: role.name, role: role.role });
    window.dispatchEvent(new CustomEvent('role-changed', { detail: getSession() }));
    return getSession();
  },
  async signOut(){
    await fbSignOut(auth);
    setSession({});
    window.dispatchEvent(new CustomEvent('role-changed', { detail: getSession() }));
  }
};

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    setSession({});
    window.dispatchEvent(new CustomEvent('role-changed', { detail: getSession() }));
    return;
  }
  const role = await fetchRoleFor(user);
  setSession({ email: (user.email||'').toLowerCase(), name: role.name, role: role.role });
  window.dispatchEvent(new CustomEvent('role-changed', { detail: getSession() }));
});
