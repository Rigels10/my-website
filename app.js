import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, onSnapshot, orderBy, serverTimestamp, arrayUnion } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

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
const db  = getFirestore(app);

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
