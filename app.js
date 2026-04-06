const drawings = [
  {
    id: "1",
    name: "図面1",
    url: "https://via.placeholder.com/800x600"
  },
  {
    id: "2",
    name: "図面2",
    url: "https://via.placeholder.com/800x600/ffaaaa"
  }
];

let currentDrawing = null;
let markers = [];

const select = document.getElementById("drawingSelect");
const img = document.getElementById("drawingImage");
const canvas = document.getElementById("markerCanvas");
const ctx = canvas.getContext("2d");

// 図面選択
drawings.forEach(d => {
  const option = document.createElement("option");
  option.value = d.id;
  option.textContent = d.name;
  select.appendChild(option);
});

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
  };
}

// マーカー描画
function drawMarkers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  markers
    .filter(m => m.drawingId === currentDrawing.id)
    .forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
    });
}

// ⭐ iPhone対応（最重要）
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  markers.push({
    x,
    y,
    drawingId: currentDrawing.id
  });

  drawMarkers();
});
