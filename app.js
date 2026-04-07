const img = document.getElementById("image");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const cameraInput = document.getElementById("camera");

let points = [];
let currentPoint = null;

// ===== 画像読み込み =====
img.onload = () => {
  resizeCanvas();
  draw();
};

// ===== リサイズ対応（最重要）=====
function resizeCanvas(){
  const rect = img.getBoundingClientRect();

  // 表示サイズに合わせる
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  // 内部解像度も同期（ズレ防止）
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// ===== 画面ズーム・回転対応 =====
window.addEventListener("resize", () => {
  resizeCanvas();
  draw();
});

// ===== タップ取得 =====
img.addEventListener("click", function(e){
  const rect = img.getBoundingClientRect();

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  currentPoint = { x, y };

  cameraInput.click();
});

// ===== 写真撮影 =====
cameraInput.addEventListener("change", async function(e){
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

// ===== 描画（ズーム対応）=====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const rect = img.getBoundingClientRect();

  // フォントサイズをズームに応じて調整
  const scale = rect.width / img.naturalWidth;
  ctx.font = `bold ${20 * scale}px Arial`;

  points.forEach((p, index) => {
    const x = p.x * canvas.width;
    const y = p.y * canvas.height;

    // 背景（スケール対応）
    ctx.fillStyle = "white";
    ctx.fillRect(
      x - 10 * scale,
      y - 18 * scale,
      28 * scale,
      22 * scale
    );

    // 番号
    ctx.fillStyle = "red";
    ctx.fillText(index+1, x, y);
  });
}

// ===== 送信 =====
async function sendData(data){
  const url = "YOUR_WEBAPP_URL";

  const payload = {
    bridgeId: "B001",
    plotNumber: data.plotNumber,
    x: data.x,
    y: data.y,
    damageType: "ひび割れ",
    damageSize: "3cm",
    damageLevel: "中",
    note: "現場記録",
    photoBase64: data.photoBase64
  };

  await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ===== Base64変換 =====
function fileToBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
