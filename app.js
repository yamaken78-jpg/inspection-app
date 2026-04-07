// ===== 要素取得 =====
const viewer = document.getElementById("viewer");
const container = document.getElementById("container");
const img = document.getElementById("image");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const cameraInput = document.getElementById("camera");

// ===== 状態 =====
let scale = 1;
let posX = 0;
let posY = 0;

let points = [];
let currentPoint = null;

// ===== 初期表示 =====
img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  scale = Math.min(vw / img.width, vh / img.height);

  posX = (vw - img.width * scale) / 2;
  posY = (vh - img.height * scale) / 2;

  updateTransform();
  draw();
};

// ===== 変形 =====
function updateTransform(){
  container.style.transform =
    `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// ===== ピンチズーム =====
let startDist = 0;

viewer.addEventListener("touchmove", (e)=>{
  if(e.touches.length === 2){
    e.preventDefault();

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if(startDist === 0){
      startDist = dist;
      return;
    }

    const zoom = dist / startDist;
    scale *= zoom;

    startDist = dist;

    updateTransform();
  }
});

// ===== ピンチ終了 =====
viewer.addEventListener("touchend", ()=>{
  startDist = 0;
});

// ===== パン =====
let startX, startY;

viewer.addEventListener("touchstart", (e)=>{
  if(e.touches.length === 1){
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
});

viewer.addEventListener("touchmove", (e)=>{
  if(e.touches.length === 1){
    e.preventDefault();

    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    posX += dx;
    posY += dy;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;

    updateTransform();
  }
});

// ===== タップ =====
img.addEventListener("click", (e)=>{
  const rect = img.getBoundingClientRect();

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  currentPoint = { x, y };

  cameraInput.click();
});

// ===== 写真処理 =====
cameraInput.addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;

  const base64 = await fileToBase64(file);

  const index = points.length + 1;
  const plotNumber = "B001-" + String(index).padStart(3,"0");

  const pointData = {
    ...currentPoint,
    plotNumber,
    photoBase64: base64
  };

  points.push(pointData);
  draw();

  await sendData(pointData);
});

// ===== 描画 =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.font = "bold 20px Arial";

  points.forEach((p, i)=>{
    const x = p.x * canvas.width;
    const y = p.y * canvas.height;

    ctx.fillStyle = "white";
    ctx.fillRect(x-10, y-18, 28, 22);

    ctx.fillStyle = "red";
    ctx.fillText(i+1, x, y);
  });
}

// ===== 送信 =====
async function sendData(data){
  const url = "YOUR_WEBAPP_URL"; // ←変更

  await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      bridgeId: "B001",
      plotNumber: data.plotNumber,
      x: data.x,
      y: data.y,
      damageType: "ひび割れ",
      damageSize: "3cm",
      damageLevel: "中",
      note: "現場記録",
      photoBase64: data.photoBase64
    })
  });
}

// ===== Base64変換 =====
function fileToBase64(file){
  return new Promise((resolve)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
