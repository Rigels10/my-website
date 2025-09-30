// Firebase modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, onSnapshot, orderBy, serverTimestamp, arrayUnion, arrayRemove } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ---- Config (nga projekti yt) ----
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

// Workspace nga query (?space=abc) ose "aic"
const params = new URLSearchParams(location.search);
let WORKSPACE = params.get('space')?.trim() || 'aic';
document.getElementById('ws').textContent = WORKSPACE;
document.getElementById('s-workspace').value = WORKSPACE;
document.getElementById('btnApplyWS').onclick = () => {
  const v = document.getElementById('s-workspace').value.trim() || 'aic';
  const url = new URL(location.href);
  url.searchParams.set('space', v);
  location.href = url.toString();
};

const statusEl = document.getElementById('status');
statusEl.innerHTML = '<span class="ok">Firebase u inicializua ✔</span>';

// Path design:
// spaces/{WORKSPACE}/meta/meta => { users: [] }
// spaces/{WORKSPACE}/tasks/{autoId}
const metaRef  = doc(db, 'spaces', WORKSPACE, 'meta', 'meta');
const tasksCol = collection(db, 'spaces', WORKSPACE, 'tasks');

// ---- Users ----
async function ensureMeta(){
  const s = await getDoc(metaRef);
  if(!s.exists()){
    await setDoc(metaRef, { users: [], updatedAt: serverTimestamp() });
  }else{
    const data = s.data() || {};
    const cleaned = (data.users||[])
      .filter(u => typeof u === 'string' && u.trim())
      .map(u => u.trim().toLowerCase());
    if(JSON.stringify(cleaned)!==JSON.stringify(data.users)){
      await updateDoc(metaRef, { users: Array.from(new Set(cleaned)), updatedAt: serverTimestamp() });
    }
  }
}

async function addUser(email){
  const v = (email||'').trim().toLowerCase();
  if(!v) throw new Error('Vendos email');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error('Email i pavlefshem');
  await ensureMeta();
  await updateDoc(metaRef, { users: arrayUnion(v), updatedAt: serverTimestamp() });
}

async function removeUser(email){
  await updateDoc(metaRef, { users: arrayRemove(email), updatedAt: serverTimestamp() });
}

function renderUsers(users){
  const box = document.getElementById('users');
  box.innerHTML = users.length ? users.map(u => `
    <div class="item">
      <div><code>${u}</code></div>
      <div class="meta"><button class="danger" data-rm="${u}">Hiq</button></div>
    </div>`).join('') : '<div class="item"><div>(bosh)</div></div>';
  box.querySelectorAll('button[data-rm]').forEach(btn=>{
    btn.onclick = async () => { await removeUser(btn.dataset.rm); };
  });

  // mbush dropdown-et
  const ownSel = document.getElementById('t-owner');
  const fOwn   = document.getElementById('f-owner');
  ownSel.innerHTML = users.map(u=>`<option>${u}</option>`).join('') || '<option value="">(s\'ka users)</option>';
  fOwn.innerHTML = '<option value="">Owner: All</option>' + users.map(u=>`<option>${u}</option>`).join('');
}

// real-time users
onSnapshot(metaRef, snap => {
  const data = snap.data() || {users:[]};
  renderUsers((data.users||[]).map(u=>u.trim().toLowerCase()));
});

document.getElementById('btnAddUser').onclick = async () => {
  const v = document.getElementById('u-email').value.trim();
  try{
    await addUser(v);
    document.getElementById('u-email').value='';
    statusEl.innerHTML = '<span class="ok">User u shtua ✔</span>';
  }catch(e){
    statusEl.innerHTML = '<span class="bad">'+(e.message||e)+'</span>';
  }
};

// ---- Tasks ----
function taskItem(t){
  const prBadge = `<span class="badge" style="border-color:${t.priority==='high'?'#ff6b6b':t.priority==='medium'?'#f59e0b':'#3b82f6'}">${t.priority}</span>`;
  const stSel = `<select data-chg="${t.id}">
    ${['OPEN','IN PROGRESS','DONE','CLOSED'].map(s=>`<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
  </select>`;
  const rmBtn = `<button class="danger" data-del="${t.id}">Fshi</button>`;
  return `<div class="item">
    <div>
      <div><strong>${t.title||'(pa titull)'}</strong></div>
      <div class="meta">owner: ${t.owner||'-'} • ${prBadge}</div>
    </div>
    <div class="meta">${stSel} ${rmBtn}</div>
  </div>`;
}

function renderTasks(list){
  const box = document.getElementById('tasks');
  box.innerHTML = list.length ? list.map(taskItem).join('') : '<div class="item"><div>(s\'ka tasks)</div></div>';

  box.querySelectorAll('select[data-chg]').forEach(sel=>{
    sel.onchange = async () => {
      const id = sel.dataset.chg;
      await updateDoc(doc(tasksCol, id), { status: sel.value, updatedAt: serverTimestamp() });
    };
  });
  box.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.onclick = async () => {
      await deleteDoc(doc(tasksCol, btn.dataset.del));
    };
  });
}

function attachTasksListener(){
  const st = document.getElementById('f-status').value;
  const own = document.getElementById('f-owner').value;

  let q = query(tasksCol, orderBy('createdAt','desc'));
  onSnapshot(q, snap => {
    let arr = snap.docs.map(d => ({id:d.id, ...d.data()}));
    if(st)  arr = arr.filter(x=>x.status===st);
    if(own) arr = arr.filter(x=>x.owner===own);
    renderTasks(arr);
  });
}

document.getElementById('f-status').onchange = attachTasksListener;
document.getElementById('f-owner').onchange  = attachTasksListener;
document.getElementById('btnClear').onclick  = () => {
  document.getElementById('f-status').value='';
  document.getElementById('f-owner').value='';
  attachTasksListener();
};

document.getElementById('btnAddTask').onclick = async () => {
  const title = document.getElementById('t-title').value.trim();
  const owner = document.getElementById('t-owner').value || '';
  const priority = document.getElementById('t-priority').value;
  const status = document.getElementById('t-status').value;

  if(!title){ statusEl.innerHTML = '<span class="bad">Shkruaj titullin</span>'; return; }
  await addDoc(tasksCol, { title, owner, priority, status, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  document.getElementById('t-title').value='';
};

// tabs
document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const name = t.dataset.tab;
    document.querySelectorAll('section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
    document.getElementById('tab-'+name).classList.remove('hidden');
  };
});

// start
await ensureMeta();
attachTasksListener();
