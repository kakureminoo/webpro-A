import { useState, useEffect } from "react";
import Map from "./Map";
import { 
  auth, provider, signInWithPopup, signOut, signInAnonymously,
  db, collection, addDoc, query, orderBy, limit, getDocs, 
  doc, getDoc, setDoc 
} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import ResetRanking from "./reset.jsx";

// SE
const audioExplore = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
const audioClear   = new Audio("https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg");
const audioTrap    = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");

audioExplore.volume = 0.5;
audioClear.volume = 0.5;
audioTrap.volume = 0.5;

const playSound = (audioObj) => {
  audioObj.currentTime = 0;
  audioObj.play().catch((e) => console.log("音声再生エラー:", e));
};

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
  
  const [nickname, setNickname] = useState("");
  const [inputName, setInputName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [ranking, setRanking] = useState([]);
  const [collectedItems, setCollectedItems] = useState([]);
  const [canExplore, setCanExplore] = useState(false);
  const [currentMapId, setCurrentMapId] = useState("field");
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  const [isTrapped, setIsTrapped] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.isAnonymous) {
          setNickname("ゲスト");
          setIsRegistering(false);
        } else {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setNickname(userSnap.data().name);
          } else {
            setIsRegistering(true);
          }
        }
        fetchRanking();
      } else {
        setNickname("");
        setIsRegistering(false);
        setIsEditing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRegisterName = async () => {
    if (!inputName.trim()) return showToast("名前を入力してください");
    if (inputName.length > 10) return showToast("名前は10文字以内でお願いします");

    try {
      await setDoc(doc(db, "users", user.uid), {
        name: inputName
      });
      setNickname(inputName);
      setIsRegistering(false);
      setIsEditing(false);
      showToast("名前を保存しました！");
    } catch (error) {
      console.error("Error saving nickname:", error);
    }
  };

  const startEditing = () => {
    setInputName(nickname);
    setIsEditing(true);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed", error);
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
      showToast("ログインしてください！");
      return;
    }
    if (isRegistering || isEditing) {
      showToast("ニックネームを決めてください！");
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

    playSound(audioExplore);

    if (!collectedItems.includes(param)) {
      nextItems = [...collectedItems, param];
      setCollectedItems(nextItems);
      showToast(`✨ 「${param}」を見つけた！`);
    } else {
      showToast(`「${param}」はすでに持っている...`);
    }
    setCanExplore(false);

    if (nextItems.length === ALL_ITEMS.length) {
      finishGame();
    }
  }

  // 罠
  function handleTrap() {
    if (isTrapped) return;

    playSound(audioTrap);
    
    setIsTrapped(true); 
    showToast("落とし穴！しばらく動けない！");

    setTimeout(() => {
      setIsTrapped(false);
    }, 500);
  }

  async function finishGame() {
    setGamePhase("clear");
    const clearTime = Date.now() - startTime;
    playSound(audioClear);

    if (user && !user.isAnonymous) {
      try {
        await addDoc(collection(db, "scores"), {
          name: nickname,
          time: clearTime,
          date: new Date()
        });
        await fetchRanking();
        showToast("ランキングに登録されました！");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
      showToast("ゲストプレイのため記録は保存されません");
    }
  }

  if (gamePhase === "start") {
    return (
      <div className="start-screen">
        <h1 className="game-title">世界探索</h1>
        
        <div className="login-box">
          {user ? (
            (isRegistering || isEditing) ? (
              <div className="nickname-form">
                <p>{isEditing ? "新しいニックネーム" : "ニックネームを決めてください"}</p>
                <input 
                  type="text" 
                  placeholder="例：勇者タナカ" 
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  style={{padding: "5px", fontSize: "16px"}}
                />
                <button onClick={handleRegisterName} className="btn-primary" style={{marginLeft:"5px"}}>
                  保存
                </button>
                {isEditing && (
                  <button onClick={() => setIsEditing(false)} style={{marginLeft:"5px", fontSize:"0.8rem"}}>
                    キャンセル
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ marginRight: "10px" }}>
                    ようこそ、<strong>{nickname}</strong> さん
                  </span>
                  {!user.isAnonymous && (
                    <button onClick={startEditing} style={{ fontSize:"0.8rem", padding:"2px 5px" }}>
                      名前変更
                    </button>
                  )}
                </div>
                <button onClick={handleLogout} className="btn-logout">ログアウト</button>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
              <button onClick={handleLogin} className="btn-google">
                G Googleでログインして参加
              </button>
              
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>または</p>

              <button 
                onClick={handleGuestLogin} 
                style={{ 
                  padding: "8px 16px", 
                  fontSize: "0.9rem", 
                  cursor: "pointer",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  color: "#333"
                }}
              >
                👤 ゲストとしてプレイ
              </button>
            </div>
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

        <div style={{ marginTop: "15px", borderTop: "1px dashed #ccc", paddingTop: "10px", textAlign: "right" }}>
             <ResetRanking />
        </div>

        <div className="menu-buttons">
          {user && !isRegistering && !isEditing && (
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
              <p>※ゲストプレイ時は記録されません</p>
              <button onClick={() => setShowDescription(false)}>閉じる</button>
            </div>
          </div>
        )}
        
        {toastMessage && <div className="toast-notification">{toastMessage}</div>}
      </div>
    );
  }

  return (
    <div>
      {isTrapped && <div className="trap-overlay" />}

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
          {!user?.isAnonymous && <p>ランキングに登録されました！</p>}
          <button onClick={() => setGamePhase("start")} style={{marginTop: "10px"}}>
            ランキングを見る
          </button>
        </div>
      )}

      <div className={isTrapped ? "shake-screen" : ""}>
        <Map 
          onReach={setCanExplore} 
          onMapChange={setCurrentMapId} 
          onTrap={handleTrap}
          isTrapped={isTrapped}
        />
      </div>

      <div style={{ height: "60px", margin: "10px" }}>
        {gamePhase === "playing" && canExplore && !isTrapped && (
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

      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
    </div>
  );
}