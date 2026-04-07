const img = document.getElementById("image");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const cameraInput = document.getElementById("camera");

let points = [];
let currentPoint = null;

// 画像読み込み後にサイズ合わせ
img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  draw();
};

// タップ（画像側で取得）
img.addEventListener("click", function(e){
  const rect = img.getBoundingClientRect();

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  currentPoint = { x, y };

  cameraInput.click();
});

// 写真撮影後
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

// 描画
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.font = "bold 20px Arial";

  points.forEach((p, index) => {
    const x = p.x * canvas.width;
    const y = p.y * canvas.height;

    ctx.fillStyle = "white";
    ctx.fillRect(x-10, y-18, 28, 22);

    ctx.fillStyle = "red";
    ctx.fillText(index+1, x, y);
  });
}

// 送信
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

// Base64変換
function fileToBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
