let records = [];
let count = 1;
let currentId = null;
let currentMarker = null;
let photoCount = 1;
let db;

// ===== IndexedDB =====
const request = indexedDB.open("inspectionDB", 1);

request.onupgradeneeded = function(e){
  db = e.target.result;
  db.createObjectStore("records", { keyPath: "id" });
};

request.onsuccess = function(e){
  db = e.target.result;
  loadData();
};

// ===== 保存 =====
function saveToDB(){
  const tx = db.transaction("records", "readwrite");
  const store = tx.objectStore("records");
  records.forEach(r => store.put(r));
}

// ===== 読み込み =====
function loadData(){
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");

  const req = store.getAll();

  req.onsuccess = function(){
    records = req.result || [];
    updateUI();
    redrawMarkers();

    if(records.length > 0){
      const maxId = Math.max(...records.map(r => Number(r.id)));
      count = maxId + 1;
    }
  };
}

// ===== 画像圧縮 =====
function compressImage(file){
  return new Promise(resolve => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => img.src = e.target.result;

    img.onload = function(){
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxWidth = 1200;
      let width = img.width;
      let height = img.height;

      if(width > maxWidth){
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressed);
    };

    reader.readAsDataURL(file);
  });
}

// ===== 図面クリック =====
document.getElementById("map").addEventListener("click", function(e){

  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const drawing = document.getElementById("drawing").value;

  const marker = document.createElement("div");
  marker.innerText = count;
  marker.style.left = x + "px";
  marker.style.top = y + "px";
  marker.style.color = "red";
  marker.dataset.id = count;

  marker.dataset.x = x;
  marker.dataset.y = y;
  marker.dataset.drawing = drawing;

  marker.addEventListener("click", function(e){
    e.stopPropagation();

    if(currentMarker) currentMarker.classList.remove("selected");

    currentMarker = marker;
    currentMarker.classList.add("selected");

    currentId = this.dataset.id;

    const data = records.find(r => r.id == currentId);
    if(data){
      document.getElementById("preview").src = data.image;
      document.getElementById("comment").value = data.comment || "";
    }
  });

  document.getElementById("markers").appendChild(marker);

  if(currentMarker) currentMarker.classList.remove("selected");
  currentMarker = marker;
  currentMarker.classList.add("selected");

  currentId = count;

  document.getElementById("photo").click();
  count++;
});

// ===== 写真取得（圧縮＋保存）=====
document.getElementById("photo").addEventListener("change", async function(e){
  const file = e.target.files[0];
  if(!file) return;

  const imgData = await compressImage(file);
  document.getElementById("preview").src = imgData;

  if(!currentId) return;

  const marker = document.querySelector(`[data-id='${currentId}']`);

  const x = marker?.dataset.x;
  const y = marker?.dataset.y;
  const drawing = marker?.dataset.drawing;

  const index = records.findIndex(r => r.id == currentId);

  if(index !== -1){
    records[index].image = imgData;
    records[index].uploaded = false;
  } else {
    records.push({
      id: currentId,
      image: imgData,
      x,
      y,
      drawing,
      uploaded: false
    });
  }

  saveToDB();
});

// ===== マーカー再描画 =====
function redrawMarkers(){
  const container = document.getElementById("markers");
  container.innerHTML = "";

  const currentDrawing = document.getElementById("drawing").value;

  records.forEach(r => {

    // 🔴 今の図面だけ表示
    if(r.x && r.drawing === currentDrawing){

      const marker = document.createElement("div");
      marker.innerText = r.id;
      marker.style.left = r.x + "px";
      marker.style.top = r.y + "px";
      marker.style.color = "red";
      marker.dataset.id = r.id;

      marker.addEventListener("click", function(e){
        e.stopPropagation();

        if(currentMarker) currentMarker.classList.remove("selected");

        currentMarker = marker;
        currentMarker.classList.add("selected");

        currentId = r.id;

        document.getElementById("preview").src = r.image;
        document.getElementById("comment").value = r.comment || "";
      });

      container.appendChild(marker);
    }

  });
}

// ===== 保存 =====
function saveData(){
  const status = document.getElementById("status").value;
  const comment = document.getElementById("comment").value;

  const index = records.findIndex(r => r.id == currentId);

  if(index !== -1){
    records[index].status = status;
    records[index].comment = comment;
  }

  updateUI();
  saveToDB();
}

// ===== UI更新 =====
function updateUI(){
  const list = document.getElementById("list");
  list.innerHTML = "";

  const pending = records.filter(r => !r.uploaded);
  document.getElementById("pending").innerText =
    "未送信：" + pending.length;

  records.forEach(r=>{
    const li = document.createElement("li");

    li.innerText = `No.${r.id}` + (r.x ? "" : "（位置なし）");

    li.onclick = function(){
      currentId = r.id;
      document.getElementById("preview").src = r.image;
      document.getElementById("comment").value = r.comment || "";
    };

    list.appendChild(li);
  });
}

// ===== 図面切替 =====
function changeDrawing(){
  document.getElementById("map").src =
    document.getElementById("drawing").value;

  currentMarker = null;
  currentId = null;

  redrawMarkers();
}

// ===== 取り直し =====
function retakePhoto(){
  if(!currentId){
    alert("マーカー選択してください");
    return;
  }
  document.getElementById("photo").click();
}

// ===== 送信（仮）=====
function uploadAll(){
  records.forEach(r => r.uploaded = true);
  alert("送信完了");
  updateUI();
  saveToDB();
}