import { useEffect, useRef, useState } from "react";
import grassedgeImgSrc from "./assets/grassedge.png";
import grassloadImgSrc from "./assets/grassload.png";
import playerImgSrc from "./assets/player.png"; // 下向き（正面）と想定
import rockloadImgSrc from "./assets/rockload.png";
import rockedgeImgSrc from "./assets/rockedge.png";

// --- 画像の読み込み ---
const grassedgeImg = new Image(); grassedgeImg.src = grassedgeImgSrc;
const grassloadImg = new Image(); grassloadImg.src = grassloadImgSrc;
const rockedgeImg = new Image();  rockedgeImg.src = rockedgeImgSrc;
const rockloadImg = new Image();  rockloadImg.src = rockloadImgSrc;

// プレイヤー画像（今回は1枚を回転させて使いますが、4枚ある場合はここで読み込んでください）
const playerImg = new Image(); playerImg.src = playerImgSrc;

const TILE = 40;
const TILE_OPEN_HOLE = 4; // 開いた後の穴のIDを定義

// マップデータ定義
const MAPS = [
  {
    id: "field",
    data: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,0,1,1,0,1,0,2,0,1,0,1],
      [1,0,3,0,0,0,0,1,0,0,0,1,0,1], // 3: 落とし穴
      [1,1,0,1,1,0,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,1,0,0,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,1,0,0],
      [1,0,0,0,1,0,0,0,1,0,2,0,0,1],
      [1,0,0,1,1,0,3,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    id: "forest", // forest用の画像がないためfieldと同じに設定していますが、変えられます
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
  
  // プレイヤー状態に dir (向き) を追加 (up, down, left, right)
  const [player, setPlayer] = useState({ x: 1, y: 1, dir: "down" });
  
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // 【重要】マップの状態（穴が開いたか等）を管理するためのState
  // マップ切り替え時にリセットするため、初期値は空または現在のマップ
  const [currentGrid, setCurrentGrid] = useState(JSON.parse(JSON.stringify(MAPS[0].data)));

  // 画像ロード監視
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

  // マップ変更時の処理（gridの初期化など）
  useEffect(() => {
    // データをディープコピーしてセット（元のMAPSを汚染しないため、あるいはリセットのため）
    setCurrentGrid(JSON.parse(JSON.stringify(MAPS[mapIndex].data)));
    
    if (onMapChange) {
      onMapChange(MAPS[mapIndex].id);
    }
  }, [mapIndex, onMapChange]);


  function tryMove(dx, dy) {
    if (isTrapped) return;

    // 向きの更新
    let newDir = player.dir;
    if (dy < 0) newDir = "up";
    if (dy > 0) newDir = "down";
    if (dx < 0) newDir = "left";
    if (dx > 0) newDir = "right";

    const nx = player.x + dx;
    const ny = player.y + dy;

    // --- マップ切り替えロジック ---
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

    // --- 通常移動ロジック ---
    if (currentGrid[ny]) {
      const tileType = currentGrid[ny][nx];
      
      // 1(壁) と TILE_OPEN_HOLE(開いた穴) は通れない
      if (tileType !== 1 && tileType !== TILE_OPEN_HOLE) {
        
        // 移動確定
        setPlayer({ x: nx, y: ny, dir: newDir });
        
        // 探索ポイント
        if (tileType === 2) {
          onReach(true);
        } else {
          onReach(false);
        }

        // 落とし穴 (3)
        if (tileType === 3) {
          if (onTrap) onTrap();
          
          // 【重要】穴を開ける処理
          // ReactのStateは不変性が重要なのでコピーして更新
          const newGrid = currentGrid.map(row => [...row]);
          newGrid[ny][nx] = TILE_OPEN_HOLE; // 3 -> 4 に書き換え
          setCurrentGrid(newGrid);
        }
      } else {
        // 壁などで動けなくても向きだけは変える
        setPlayer(p => ({ ...p, dir: newDir }));
      }
    }
  }

  // キー操作
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
  }, [player, mapIndex, isTrapped, currentGrid]); // currentGridを依存配列に追加

  // 描画処理
  useEffect(() => {
    if (!imagesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 現在のマップID取得
    const currentMapId = MAPS[mapIndex].id;

    // --- 【変更点1】マップIDに応じて画像セットを選択 ---
    let floorImg, edgeImg;
    if (currentMapId === "mountain") {
      floorImg = rockloadImg;
      edgeImg = rockedgeImg;
    } else if (currentMapId === "forest") {
      floorImg = grassloadImg; // 森用の画像があればここで指定
      edgeImg = grassedgeImg;
    } else {
      // field
      floorImg = grassloadImg;
      edgeImg = grassedgeImg;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // currentGrid を使って描画
    currentGrid.forEach((row, y) => {
      row.forEach((tile, x) => {
        // 基本タイル
        let img = floorImg;
        if (tile === 1) img = edgeImg;
        ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
        
        // 探索ポイント(2)
        if (tile === 2) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(x * TILE + 5, y * TILE + 5, TILE - 10, TILE - 10);
        }

        // 隠れた落とし穴(3) または 開いた穴(4)
        if (tile === 3 || tile === 4) {
          const isOpen = (tile === 4);
          const isStepping = (x === player.x && y === player.y && isTrapped);
          
          // 開いた穴は濃い色（黒）、隠れた罠は薄い色
          if (isOpen) {
             ctx.fillStyle = "black";
          } else {
             // プレイヤーが踏んでいる時だけ赤くする
             ctx.fillStyle = isStepping ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)";
          }
          
          ctx.beginPath();
          // 開いた穴は大きく描画
          const size = isOpen ? TILE/2.2 : (isStepping ? TILE/2.5 : TILE/4);
          ctx.arc(x * TILE + TILE/2, y * TILE + TILE/2, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // --- 【変更点3】プレイヤーの向き反映 ---
    // 画像を回転させて描画する関数
    const drawPlayerRotated = () => {
      const cx = player.x * TILE + TILE / 2;
      const cy = player.y * TILE + TILE / 2;
      
      ctx.save();
      ctx.translate(cx, cy);
      
      // 向きに合わせて回転角度を設定
      let angle = 0;
      if (player.dir === "up")    angle = Math.PI; // 画像が下向きの場合、上に行くには180度回転
      if (player.dir === "down")  angle = 0;
      if (player.dir === "left")  angle = Math.PI / 2;
      if (player.dir === "right") angle = -Math.PI / 2;
      
      ctx.rotate(angle);
      // 回転の中心に画像を配置
      ctx.drawImage(playerImg, -TILE / 2, -TILE / 2, TILE, TILE);
      ctx.restore();
    };

    drawPlayerRotated();

    /* もし4枚の別々の画像を使う場合は、上記 drawPlayerRotated の代わりに以下のように書いてください：
    
    let pImg = playerDownImg;
    if (player.dir === "up") pImg = playerUpImg;
    if (player.dir === "left") pImg = playerLeftImg;
    if (player.dir === "right") pImg = playerRightImg;
    ctx.drawImage(pImg, player.x * TILE, player.y * TILE, TILE, TILE);
    */

  }, [player, imagesLoaded, mapIndex, isTrapped, currentGrid]);

  return (
    <canvas
      ref={canvasRef}
      width={currentGrid[0].length * TILE}
      height={currentGrid.length * TILE}
      style={{ border: "2px solid #ccc", borderRadius: "4px" }}
    />
  );
}