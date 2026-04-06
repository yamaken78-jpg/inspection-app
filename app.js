document.addEventListener("DOMContentLoaded", function(){

// ===== Firebase =====
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAGBBJ_XoOtE2jBdzGlokm7zuzyUV4dRQs",
  authDomain: "tenkenapp-d4ea1.firebaseapp.com",
  projectId: "tenkenapp-d4ea1",
  storageBucket: "tenkenapp-d4ea1.firebasestorage.app.appspot.com"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ===== GAS =====
const GAS_URL = "https://script.google.com/macros/s/AKfycbwEXiwDd-FZKfV9rsfiUlFz-nlXrDWXPRQyeGjBaHVVwY0heMMus8YdTJle0OtIoKXU/exec";

// ===== 変数 =====
let bridges = [];
let currentBridge;
let currentDrawing;
let records = [];
let currentId = null;
let count = 1;

// ===== 画像圧縮 =====
function compressImage(file){
  return new Promise(resolve=>{
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => img.src = e.target.result;

    img.onload = ()=>{
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const w = 800;
      const scale = w / img.width;

      canvas.width = w;
      canvas.height = img.height * scale;

      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL("image/jpeg",0.6));
    };

    reader.readAsDataURL(file);
  });
}

// ===== GAS取得 =====
async function loadDriveData(){

  try{
    const res = await fetch(GAS_URL);
    bridges = await res.json();

    console.log("取得成功", bridges);

    initBridge();

  }catch(e){
    console.error("GAS取得失敗", e);

    bridges = [{ name:"テスト橋", drawings:[] }];
    initBridge();
  }
}

// ===== 橋 =====
function initBridge(){

  const sel = document.getElementById("bridge");
  sel.innerHTML = "";

  bridges.forEach((b,i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = b.name;
    sel.appendChild(opt);
  });

  currentBridge = bridges[0];
  loadDrawing();

  sel.onchange = ()=>{
    currentBridge = bridges[sel.value];
    loadDrawing();
  };
}

// ===== 図面 =====
function loadDrawing(){

  const sel = document.getElementById("drawing");
  sel.innerHTML = "";

  currentBridge.drawings.forEach((d,i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });

  sel.onchange = changeMap;

  if(currentBridge.drawings.length > 0){
    changeMap();
  }
}

// ===== 表示 =====
function changeMap(){

  currentDrawing =
    currentBridge.drawings[
      document.getElementById("drawing").value
    ];

  document.getElementById("map").src = currentDrawing.url;

  redraw();
}

// ===== マーカー =====
document.getElementById("map").onclick = function(e){

  if(!currentDrawing) return;

  const rect = e.target.getBoundingClientRect();

  const x = (e.clientX - rect.left)/rect.width;
  const y = (e.clientY - rect.top)/rect.height;

  records.push({
    id: count,
    x,y,
    bridge: currentBridge.name,
    drawing: currentDrawing.name,
    uploaded:false
  });

  currentId = count;
  count++;

  document.getElementById("photo").click();
};

// ===== 写真 =====
document.getElementById("photo").onchange = async function(e){

  const file = e.target.files[0];
  if(!file) return;

  const img = await compressImage(file);

  document.getElementById("preview").src = img;

  const rec = records.find(r=>r.id===currentId);
  if(rec) rec.image = img;

  redraw();
  updateList();
};

// ===== 再描画 =====
function redraw(){

  const box = document.getElementById("markers");
  box.innerHTML="";

  records.forEach(r=>{
    if(r.drawing === currentDrawing?.name){

      const m = document.createElement("div");
      m.innerText = r.id;

      m.style.left = (r.x*100)+"%";
      m.style.top = (r.y*100)+"%";

      m.onclick = (e)=>{
        e.stopPropagation();
        selectRecord(r.id);
      };

      box.appendChild(m);
    }
  });
}

// ===== 選択 =====
function selectRecord(id){

  currentId = id;

  const r = records.find(x=>x.id===id);

  document.getElementById("preview").src = r.image || "";
  document.getElementById("comment").value = r.comment || "";
}

// ===== 保存 =====
document.getElementById("saveBtn").onclick = function(){

  const r = records.find(x=>x.id===currentId);
  if(r){
    r.comment = document.getElementById("comment").value;
  }

  updateList();
};

// ===== 削除 =====
document.getElementById("deleteBtn").onclick = function(){

  records = records.filter(r=>r.id!==currentId);

  redraw();
  updateList();
};

// ===== 一覧 =====
function updateList(){

  const ul = document.getElementById("list");
  ul.innerHTML = "";

  records.forEach(r=>{
    const li = document.createElement("li");

    li.innerText =
      `${r.bridge}/${r.drawing}/${r.id}/${r.uploaded?"済":"未"}`;

    li.onclick = ()=>selectRecord(r.id);

    ul.appendChild(li);
  });

  const pending = records.filter(r=>!r.uploaded).length;
  document.getElementById("pending").innerText =
    `未送信：${pending}`;
}

// ===== 送信 =====
document.getElementById("uploadBtn").onclick = async function(){

  for(const r of records){

    if(r.uploaded || !r.image) continue;

    const name =
      `${r.bridge}/${r.drawing}/${r.id}.jpg`;

    const ref = storage.ref().child(name);

    await ref.putString(r.image,'data_url');

    r.uploaded = true;
  }

  updateList();
  alert("送信完了");
};

// ===== 起動 =====
loadDriveData();

});