import { useEffect, useRef, useState } from "react";
import grassedgeImgSrc from "./assets/grassedge.png";
import grassloadImgSrc from "./assets/grassload.png";
import playerImgSrc from "./assets/player.png";

const grassedgeImg = new Image();
grassedgeImg.src = grassedgeImgSrc;

const grassloadImg = new Image();
grassloadImg.src = grassloadImgSrc;

const playerImg = new Image();
playerImg.src = playerImgSrc;

const TILE = 40;

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
  const canvasRef = useRef(null);
  const [mapIndex, setMapIndex] = useState(0);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const MAP = MAPS[mapIndex].data;

  // ▼▼▼ ここが消えていたため復元しました（画像ロード処理） ▼▼▼
  useEffect(() => {
    let loadedCount = 0;
    const images = [grassedgeImg, grassloadImg, playerImg];
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

  // ▼▼▼ ここが消えていたため復元しました（マップ変更通知） ▼▼▼
  useEffect(() => {
    if (onMapChange) {
      onMapChange(MAPS[mapIndex].id);
    }
  }, [mapIndex, onMapChange]);


  function tryMove(dx, dy) {
    // スタン中なら動かない
    if (isTrapped) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    // マップ移動ロジック
    if (nx < 0 && mapIndex > 0) {
      setMapIndex(mapIndex - 1);
      setPlayer({ x: MAPS[mapIndex - 1].data[0].length - 2, y: player.y });
      onReach(false); 
      return;
    }
    if (nx >= MAP[0].length && mapIndex < MAPS.length - 1) {
      setMapIndex(mapIndex + 1);
      setPlayer({ x: 1, y: player.y });
      onReach(false);
      return;
    }

    // 通常移動
    if (MAP[ny] && MAP[ny][nx] !== 1) {
      setPlayer({ x: nx, y: ny });
      
      const tileType = MAP[ny][nx];

      // 探索ポイント
      if (tileType === 2) {
        onReach(true);
      } else {
        onReach(false);
      }

      // 落とし穴
      if (tileType === 3) {
        if (onTrap) onTrap();
      }
    }
  }

  // キー操作
  useEffect(() => {
    const handleKey = (e) => {
      if (isTrapped) return; // スタン中は無効

      if (e.key === "ArrowUp"    || e.key === "w") tryMove(0, -1);
      if (e.key === "ArrowDown"  || e.key === "s") tryMove(0, 1);
      if (e.key === "ArrowLeft"  || e.key === "a") tryMove(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d") tryMove(1, 0);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, mapIndex, isTrapped]);

  // 描画処理
  useEffect(() => {
    if (!imagesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    MAP.forEach((row, y) => {
      row.forEach((tile, x) => {
        let img;
        if (tile === 1) img = grassedgeImg;
        else img = grassloadImg;
        ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
        
        // 探索ポイント(2)
        if (tile === 2) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(x * TILE + 5, y * TILE + 5, TILE - 10, TILE - 10);
        }

        // 落とし穴(3)
        if (tile === 3) {
          // プレイヤーがこの罠の上にいて、かつスタン中(isTrapped)なら「赤」にする
          const isStepping = (x === player.x && y === player.y && isTrapped);
          
          ctx.fillStyle = isStepping ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)";
          
          ctx.beginPath();
          const size = isStepping ? TILE/2.5 : TILE/4;
          ctx.arc(x * TILE + TILE/2, y * TILE + TILE/2, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    ctx.drawImage(playerImg, player.x * TILE, player.y * TILE, TILE, TILE);
  }, [player, imagesLoaded, mapIndex, isTrapped]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP[0].length * TILE}
      height={MAP.length * TILE}
      style={{ border: "2px solid #ccc", borderRadius: "4px" }}
    />
  );
}