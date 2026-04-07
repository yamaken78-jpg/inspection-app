const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let img = new Image();
img.src = "sample.jpg";

let points = [];

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  draw();
};

// タップで座標取得
canvas.addEventListener("click", function(e){
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const point = {
    x: x / canvas.width,
    y: y / canvas.height
  };

  points.push(point);
  draw();
});

// 描画処理（番号のみ）
function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = "red";
  ctx.font = "16px Arial";

  points.forEach((p, index) => {
    const x = p.x * canvas.width;
    const y = p.y * canvas.height;

    // 番号だけ表示
    ctx.fillText(index + 1, x, y);
  });
}

// データ送信
async function sendData(){
  const url = "https://script.google.com/macros/s/AKfycbyKLwuKSwacD_hKFIrf1_edh6SVoUdOoAIf5fmwkBkW3keLCRYrvlBIUlXyQMtC8wHhOQ/exec";

  for(let i=0; i<points.length; i++){
    const payload = {
      bridgeId: "B001",
      plotNumber: "B001-" + String(i+1).padStart(3,"0"),
      x: points[i].x,
      y: points[i].y,
      damageType: "ひび割れ",
      damageSize: "3cm",
      damageLevel: "中",
      note: "テスト"
    };

    await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  alert("送信完了！");
}