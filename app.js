// 図面リスト
const drawings = [
  { id: "1", name: "図面1", url: "https://via.placeholder.com/800x600" },
  { id: "2", name: "図面2", url: "https://via.placeholder.com/800x600/ffaaaa" }
];

let currentDrawing = null;
let markers = [];

const select = document.getElementById("drawingSelect");
const img = document.getElementById("drawingImage");
const canvas = document.getElementById("markerCanvas");
const ctx = canvas.getContext("2d");
const coordList = document.getElementById("coordList");

// 図面選択プルダウン作成
drawings.forEach(d => {
  const option = document.createElement("option");
  option.value = d.id;
  option.textContent = d.name;
  select.appendChild(option);
});

// 図面切替
select.addEventListener("change", () => {
  loadDrawing(select.value);
});

// 初期表示
loadDrawing(drawings[0].id);

// 図面読み込み
function loadDrawing(id) {
  currentDrawing = drawings.find(d => d.id === id);
  img.src = currentDrawing.url;

  img.onload = () => {
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    drawMarkers();
    updateCoordList();
  };
}

// マーカー描画
function drawMarkers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentMarkers = markers.filter(m => m.drawingId === currentDrawing.id);

  currentMarkers.forEach((m, index) => {
    // 赤丸描画
    ctx.beginPath();
    ctx.arc(m.x, m.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    // 番号描画
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(index + 1, m.x, m.y);
  });
}

// 座標リスト更新
function updateCoordList() {
  const currentMarkers = markers.filter(m => m.drawingId === currentDrawing.id);
  coordList.innerHTML = currentMarkers
    .map((m, i) => `番号 ${i + 1}: x=${Math.round(m.x)}, y=${Math.round(m.y)}`)
    .join("<br>");
}

// ⭐ iPhone対応（タップ／クリック）
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  markers.push({ x, y, drawingId: currentDrawing.id });
  drawMarkers();
  updateCoordList();
});
