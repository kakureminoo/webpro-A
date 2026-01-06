// src/App.jsx
import { useState, useEffect } from "react";
import Map from "./Map";
// firebase.js から doc, getDoc, setDoc を読み込む
import { auth, provider, signInWithPopup, signOut, db, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const ITEM_DATA = {
  field:  ["薬草", "石ころ", "謎の種"],
  forest: ["キノコ", "カブトムシ", "きれいな花"],
  mountain: ["秘石", "化石", "伝説の剣"],
};

const ALL_ITEMS = [
  ...ITEM_DATA.field,
  ...ITEM_DATA.forest,
  ...ITEM_DATA.mountain
];

export default function App() {
  const [gamePhase, setGamePhase] = useState("start");
  const [showDescription, setShowDescription] = useState(false);
  const [user, setUser] = useState(null);
  
  // ▼ ニックネーム関連の変数を追加
  const [nickname, setNickname] = useState("");
  const [inputName, setInputName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [ranking, setRanking] = useState([]);
  const [collectedItems, setCollectedItems] = useState([]);
  const [canExplore, setCanExplore] = useState(false);
  const [currentMapId, setCurrentMapId] = useState("field");
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // ▼ ログインしたら、ニックネーム登録済みか確認する
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // 登録済みならニックネームをセット
          setNickname(userSnap.data().name);
        } else {
          // 未登録なら登録画面へ
          setIsRegistering(true);
        }
        fetchRanking();
      } else {
        setNickname("");
        setIsRegistering(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ▼ ニックネームを保存する関数
  const handleRegisterName = async () => {
    if (!inputName.trim()) return alert("名前を入力してください");
    if (inputName.length > 10) return alert("名前は10文字以内でお願いします");

    try {
      // データベースの "users" コレクションに保存
      await setDoc(doc(db, "users", user.uid), {
        name: inputName
      });
      setNickname(inputName);
      setIsRegistering(false);
    } catch (error) {
      console.error("Error saving nickname:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setNickname("");
  };

  const fetchRanking = async () => {
    const q = query(collection(db, "scores"), orderBy("time", "asc"), limit(10));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    setRanking(data);
  };

  useEffect(() => {
    let interval;
    if (gamePhase === "playing") {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [gamePhase, startTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  function startGame() {
    if (!user) {
      alert("ログインしてください！");
      return;
    }
    if (isRegistering) {
      alert("先にニックネームを決めてください！");
      return;
    }
    setCollectedItems([]);
    setCanExplore(false);
    setCurrentMapId("field");
    setStartTime(Date.now());
    setCurrentTime(0);
    setGamePhase("playing");
  }

  function explore() {
    const candidates = ITEM_DATA[currentMapId];
    const param = candidates[Math.floor(Math.random() * candidates.length)];
    let nextItems = collectedItems;

    if (!collectedItems.includes(param)) {
      nextItems = [...collectedItems, param];
      setCollectedItems(nextItems);
      alert(`「${param}」を見つけた！`);
    } else {
      alert(`「${param}」を見つけた。（すでに登録済み）`);
    }
    setCanExplore(false);

    if (nextItems.length === ALL_ITEMS.length) {
      finishGame();
    }
  }

  async function finishGame() {
    setGamePhase("clear");
    const clearTime = Date.now() - startTime;

    if (user) {
      try {
        await addDoc(collection(db, "scores"), {
          name: nickname, // ▼ ここをGoogle名ではなくニックネームに変更
          time: clearTime,
          date: new Date()
        });
        await fetchRanking();
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  }

  if (gamePhase === "start") {
    return (
      <div className="start-screen">
        <h1 className="game-title">架空世界探索</h1>
        
        <div className="login-box">
          {user ? (
            isRegistering ? (
              // ▼ ニックネーム登録フォーム
              <div className="nickname-form">
                <p>ニックネームを決めてください</p>
                <input 
                  type="text" 
                  placeholder="例：勇者タナカ" 
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  style={{padding: "5px", fontSize: "16px"}}
                />
                <button onClick={handleRegisterName} className="btn-primary" style={{marginLeft:"5px"}}>
                  決定
                </button>
              </div>
            ) : (
              <div>
                <p>ようこそ、<strong>{nickname}</strong> さん</p>
                <button onClick={handleLogout} className="btn-logout">ログアウト</button>
              </div>
            )
          ) : (
            <button onClick={handleLogin} className="btn-google">
              G Googleでログインして参加
            </button>
          )}
        </div>

        <div className="ranking-board">
          <h3>🏆 世界ランキング (TOP 10)</h3>
          <ul>
            {ranking.map((score, index) => (
              <li key={index}>
                <span className="rank">{index + 1}位</span>
                <span className="name">{score.name}</span>
                <span className="time">{formatTime(score.time)}</span>
              </li>
            ))}
            {ranking.length === 0 && <li>まだ記録がありません</li>}
          </ul>
        </div>

        <div className="menu-buttons">
          {/* ログイン済みかつ登録完了ならスタートボタン表示 */}
          {user && !isRegistering && (
            <button onClick={startGame} className="btn-primary">
              ゲームスタート
            </button>
          )}
          <button onClick={() => setShowDescription(true)} className="btn-secondary">
            説明・概要
          </button>
        </div>

        {showDescription && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>遊び方</h2>
              <p>ログインしてタイムアタックに挑戦！</p>
              <p>クリアタイムは世界ランキングに登録されます。</p>
              <button onClick={() => setShowDescription(false)}>閉じる</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="game-header">
        <div className="player-info">
          {user?.photoURL && <img src={user.photoURL} alt="icon" style={{width:24, borderRadius:'50%', verticalAlign:'middle', marginRight:5}}/>}
          <span>{nickname}</span>
        </div>
        <div className="timer-display">
          TIME: <span className="time-value">{formatTime(currentTime)}</span>
        </div>
        <button onClick={() => setGamePhase("start")} style={{ fontSize: "0.8rem", width: "auto" }}>
          中断
        </button>
      </div>

      {gamePhase === "clear" && (
        <div className="clear-message">
          <h2>🎉 CONGRATULATIONS! 🎉</h2>
          <p>記録: {formatTime(currentTime)}</p>
          <p>ランキングに登録されました！</p>
          <button onClick={() => setGamePhase("start")} style={{marginTop: "10px"}}>
            ランキングを見る
          </button>
        </div>
      )}

      <Map onReach={setCanExplore} onMapChange={setCurrentMapId} />

      <div style={{ height: "60px", margin: "10px" }}>
        {gamePhase === "playing" && canExplore && (
          <button onClick={explore} className="btn-explore">
             🔍 探索する
          </button>
        )}
      </div>

      <h2>図鑑 ({collectedItems.length} / {ALL_ITEMS.length})</h2>
      <div className="item-list">
        {ALL_ITEMS.map((item) => (
          <div key={item} className={`item-card ${collectedItems.includes(item) ? "found" : "unknown"}`}>
            {collectedItems.includes(item) ? item : "？？？"}
          </div>
        ))}
      </div>
    </div>
  );
}