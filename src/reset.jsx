import { useState } from "react";
// ▼▼▼ パスを修正しました（同じフォルダにある想定） ▼▼▼
import { db } from "./firebase"; 
import { collection, getDocs, writeBatch } from "firebase/firestore";

export default function ResetRanking() {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("【警告】ランキングを全て削除しますか？")) return;

    const password = prompt("管理者パスワードを入力してください");
    if (password !== "admin123") {
      alert("パスワードが違います");
      return;
    }

    setLoading(true);

    try {
      const batch = writeBatch(db);
      // コレクション名が "scores" か "ranking" か確認してください。
      // あなたのApp.jsを見ると "scores" を使っているので "scores" に合わせます。
      const querySnapshot = await getDocs(collection(db, "scores")); 

      if (querySnapshot.empty) {
        alert("削除するデータがありませんでした。");
        setLoading(false);
        return;
      }

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      alert("ランキングをリセットしました！");
      window.location.reload();

    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReset} 
      disabled={loading}
      style={{ 
        backgroundColor: "red", 
        color: "white", 
        padding: "5px 10px", 
        fontSize: "0.8rem",
        cursor: loading ? "not-allowed" : "pointer",
        border: "none",
        borderRadius: "4px"
      }}
    >
      {loading ? "削除中..." : "⚠ ランキングリセット"}
    </button>
  );
}