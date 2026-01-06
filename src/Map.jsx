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

// ▼ マップデータを3つに増やしました
const MAPS = [
  {
    id: "field",
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,0,1,1,0,1,0,2,0,1,0,1], // 2が探索ポイント
      [1,0,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,0,1,1,0,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,1,0,0],
      [1,0,0,0,1,0,0,0,1,0,2,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    id: "forest",
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,2,2,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,2,1,1,0,1,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,0,1,1,0,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [0,0,1,0,0,0,1,0,0,0,0,1,0,0], // 左端が道(0)で前マップへ
      [1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    id: "mountain", // 新しいマップ
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,0,2,0,1],
      [1,0,1,0,1,0,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1],
      [1,0,0,0,0,2,0,1,2,0,0,0,0,1],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,1], // 入口
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
];

export default function Map({ onReach, onMapChange }) {
  const canvasRef = useRef(null);

  const [mapIndex, setMapIndex] = useState(0);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const MAP = MAPS[mapIndex].data;

  // 画像読み込み処理
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

  // マップ変更時に親へ通知
  useEffect(() => {
    if (onMapChange) {
      onMapChange(MAPS[mapIndex].id);
    }
  }, [mapIndex, onMapChange]);

  // 移動・探索判定ロジック
  function tryMove(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;

    // 前のマップへ (左移動)
    if (nx < 0 && mapIndex > 0) {
      setMapIndex(mapIndex - 1);
      setPlayer({ x: MAPS[mapIndex - 1].data[0].length - 2, y: player.y });
      // マップ移動直後はボタンを消す
      onReach(false); 
      return;
    }

    // 次のマップへ (右移動)
    if (nx >= MAP[0].length && mapIndex < MAPS.length - 1) {
      setMapIndex(mapIndex + 1);
      setPlayer({ x: 1, y: player.y });
      onReach(false);
      return;
    }

    // 通常移動
    if (MAP[ny] && MAP[ny][nx] !== 1) {
      setPlayer({ x: nx, y: ny });
      
      // 探索ポイント(2)に乗ったらボタン表示
      if (MAP[ny][nx] === 2) {
        onReach(true);
      } else {
        onReach(false);
      }
    }
  }

  // キー入力
 // キー入力
  useEffect(() => {
    const handleKey = (e) => {
      // 矢印キー または WASDキー で移動
      if (e.key === "ArrowUp"    || e.key === "w") tryMove(0, -1);
      if (e.key === "ArrowDown"  || e.key === "s") tryMove(0, 1);
      if (e.key === "ArrowLeft"  || e.key === "a") tryMove(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d") tryMove(1, 0);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, mapIndex]);

  // 描画
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
        
        // デバッグ用: 探索ポイントを少し目立たせる（薄い黄色）
        // 画像があるなら画像切り替えが良いですが、今回は簡易的に枠線で
        if (tile === 2) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(x * TILE + 5, y * TILE + 5, TILE - 10, TILE - 10);
        }
      });
    });

    ctx.drawImage(playerImg, player.x * TILE, player.y * TILE, TILE, TILE);
  }, [player, imagesLoaded, mapIndex]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP[0].length * TILE}
      height={MAP.length * TILE}
      style={{ border: "2px solid #333", borderRadius: "4px" }}
    />
  );
}