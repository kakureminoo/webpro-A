import { useEffect, useRef, useState } from "react";
import grassedgeImgSrc from "./assets/grassedge.png";
import grassloadImgSrc from "./assets/grassload.png";
import playerImgSrc from "./assets/player.png";
import rockloadImgSrc from "./assets/rockload.png";
import rockedgeImgSrc from "./assets/rockedge.png";

const TILE = 40;
const TILE_OPEN_HOLE = 4;

const grassedgeImg = new Image(); grassedgeImg.src = grassedgeImgSrc;
const grassloadImg = new Image(); grassloadImg.src = grassloadImgSrc;
const rockedgeImg = new Image();  rockedgeImg.src = rockedgeImgSrc;
const rockloadImg = new Image();  rockloadImg.src = rockloadImgSrc;
const playerImg = new Image();    playerImg.src = playerImgSrc;

const MAPS = [
  {
    id: "field",
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,0,1,1,0,1,0,2,0,1,0,1],
      [1,0,3,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,0,1,1,0,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,1,0,0],
      [1,0,0,0,1,0,0,0,1,0,2,0,0,1],
      [1,0,0,1,1,0,3,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    id: "forest",
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,2,2,0,0,0,0,3,0,0,0,0,1],
      [1,0,2,2,1,1,0,1,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,0,1,1,0,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [0,0,1,0,0,0,1,0,0,0,0,1,0,0],
      [1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    id: "mountain",
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,0,2,0,1],
      [1,0,1,0,1,0,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1],
      [1,0,0,3,0,2,0,1,2,0,3,0,0,1],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
];

export default function Map({ onReach, onMapChange, onTrap, isTrapped }) {
  // State

  const canvasRef = useRef(null);
  const [mapIndex, setMapIndex] = useState(0);
  const [player, setPlayer] = useState({ x: 1, y: 1, dir: "down" });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentGrid, setCurrentGrid] = useState(JSON.parse(JSON.stringify(MAPS[0].data)));

  // 初期化

  useEffect(() => {
    let loadedCount = 0;
    const images = [grassedgeImg, grassloadImg, rockedgeImg, rockloadImg, playerImg];
    const total = images.length;
    const checkLoad = () => {
      loadedCount++;
      if (loadedCount === total) setImagesLoaded(true);
    };
    images.forEach((img) => {
      if (img.complete) checkLoad();
      else img.onload = checkLoad;
    });
  }, []);

  useEffect(() => {
    setCurrentGrid(JSON.parse(JSON.stringify(MAPS[mapIndex].data)));
    if (onMapChange) {
      onMapChange(MAPS[mapIndex].id);
    }
  }, [mapIndex, onMapChange]);

  // ゲームロジック

  function tryMove(dx, dy) {
    if (isTrapped) return;

    let newDir = player.dir;
    if (dy < 0) newDir = "up";
    if (dy > 0) newDir = "down";
    if (dx < 0) newDir = "left";
    if (dx > 0) newDir = "right";

    const nx = player.x + dx;
    const ny = player.y + dy;

    // マップ切り替え判定
    if (nx < 0 && mapIndex > 0) {
      setMapIndex(mapIndex - 1);
      setPlayer({ x: MAPS[mapIndex - 1].data[0].length - 2, y: player.y, dir: "left" });
      onReach(false); 
      return;
    }
    if (nx >= currentGrid[0].length && mapIndex < MAPS.length - 1) {
      setMapIndex(mapIndex + 1);
      setPlayer({ x: 1, y: player.y, dir: "right" });
      onReach(false);
      return;
    }

    // 移動判定
    if (currentGrid[ny]) {
      const tileType = currentGrid[ny][nx];
      
      // 障害物と穴
      if (tileType !== 1 && tileType !== TILE_OPEN_HOLE) {
        setPlayer({ x: nx, y: ny, dir: newDir });
        
        if (tileType === 2) {
          onReach(true);
        } else {
          onReach(false);
        }

        if (tileType === 3) {
          if (onTrap) onTrap();
          const newGrid = currentGrid.map(row => [...row]);
          newGrid[ny][nx] = TILE_OPEN_HOLE; // 穴を開ける
          setCurrentGrid(newGrid);
        }
      } else {
        setPlayer(p => ({ ...p, dir: newDir }));
      }
    }
  }


  // 入力・描画の副作用

  // キーボード入力
  useEffect(() => {
    const handleKey = (e) => {
      if (isTrapped) return;
      if (e.key === "ArrowUp"    || e.key === "w") tryMove(0, -1);
      if (e.key === "ArrowDown"  || e.key === "s") tryMove(0, 1);
      if (e.key === "ArrowLeft"  || e.key === "a") tryMove(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d") tryMove(1, 0);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, mapIndex, isTrapped, currentGrid]); 

  // Canvas描画処理
  useEffect(() => {
    if (!imagesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const currentMapId = MAPS[mapIndex].id;

    // マップごとの画像切り替え
    let floorImg, edgeImg;
    if (currentMapId === "mountain") {
      floorImg = rockloadImg;
      edgeImg = rockedgeImg;
    } else if (currentMapId === "forest") {
      floorImg = grassloadImg;
      edgeImg = grassedgeImg;
    } else {
      floorImg = grassloadImg;
      edgeImg = grassedgeImg;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // タイル描画ループ
    currentGrid.forEach((row, y) => {
      row.forEach((tile, x) => {
        let img = floorImg;
        if (tile === 1) img = edgeImg;
        ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
        
        // アイテム地点の強調
        if (tile === 2) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(x * TILE + 5, y * TILE + 5, TILE - 10, TILE - 10);
        }

        // 罠・穴の描画
        if (tile === 3 || tile === 4) {
          const isOpen = (tile === 4);
          const isStepping = (x === player.x && y === player.y && isTrapped);

          if (isOpen) {
             ctx.fillStyle = "black";
          } else {
             ctx.fillStyle = isStepping ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)";
          }
          
          ctx.beginPath();
          const size = isOpen ? TILE/2.2 : (isStepping ? TILE/2.5 : TILE/4);
          ctx.arc(x * TILE + TILE/2, y * TILE + TILE/2, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // プレイヤー描画
    const drawPlayerRotated = () => {
      const cx = player.x * TILE + TILE / 2;
      const cy = player.y * TILE + TILE / 2;
      
      ctx.save();
      ctx.translate(cx, cy);
      
      let angle = 0;
      if (player.dir === "up")    angle = Math.PI; 
      if (player.dir === "down")  angle = 0;
      if (player.dir === "left")  angle = Math.PI / 2;
      if (player.dir === "right") angle = -Math.PI / 2;
      
      ctx.rotate(angle);
      ctx.drawImage(playerImg, -TILE / 2, -TILE / 2, TILE, TILE);
      ctx.restore();
    };

    drawPlayerRotated();

  }, [player, imagesLoaded, mapIndex, isTrapped, currentGrid]);

  // JSX
  return (
    <div style={{ textAlign: "center", paddingBottom: "20px" }}>
      <canvas
        ref={canvasRef}
        width={currentGrid[0].length * TILE}
        height={currentGrid.length * TILE}
        style={{ 
          border: "2px solid #ccc", 
          borderRadius: "4px",
          maxWidth: "100%",
          height: "auto"
        }}
      />

      <div className="d-pad" style={{ 
        marginTop: "20px", 
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div style={{ marginBottom: "5px" }}>
          <button style={btnStyle} onClick={() => tryMove(0, -1)}>▲</button>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={btnStyle} onClick={() => tryMove(-1, 0)}>◀</button>
          <button style={btnStyle} onClick={() => tryMove(0, 1)}>▼</button>
          <button style={btnStyle} onClick={() => tryMove(1, 0)}>▶</button>
        </div>
      </div>
    </div>
  );
}

// スタイル
const btnStyle = {
  width: "60px",
  height: "60px",
  fontSize: "24px",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "#ddd",
  boxShadow: "0 4px 0 #999",
  cursor: "pointer",
  touchAction: "manipulation",
  userSelect: "none",
  margin: "0 5px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 0
};