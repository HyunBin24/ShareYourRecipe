import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../Common.module.css';
import logo from '../assets/logo.png';
import logoTitle from '../assets/logoTitle.png';

export default function Bookmark() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState([]);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // AI 도움(제미나이): 랜덤 함수
  const handleRandom = async () => {
    const {data: allRecipe, error} = await supabase
      .from("recipe")
      .select("*");
    
    if (error) {
      alert("레시피 뽑기에 실패했어요..");
    } else { 
      const targetRecipe = allRecipe;

      if (targetRecipe.length === 0) {
        alert("등록된 레시피가 없습니다..");
        return;
      }

      const randomIndex = Math.floor(Math.random() * targetRecipe.length);
      const newRandomRecipe = targetRecipe[randomIndex];

      navigate("/random", { state: { recipeRandom: newRandomRecipe } });
    }
  };

  // AI 코드(안티그래비티): 로그인 세션 관리를 위함
  const authAlertShown = useRef(false);
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!authAlertShown.current) {
          authAlertShown.current = true;
          alert("로그인이 필요합니다!");
          navigate("/my");
        }
      } else {
        setUser(session.user);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // AI 코드(안티그래비티): 즐겨찾기 목록을 가져옴
  useEffect(() => {
    if (!user) {
      setBookmarkedRecipes([]);
      return;
    }

    const fetchBookmarks = async () => {
      setUserDataLoading(true);
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmark')
        .select(`
          recipe (
            *
          )
        `)
        .eq('user_id', user.id);

      if (!bookmarkError && bookmarkData) {
        const recipes = bookmarkData
          .map(b => b.recipe)
          .filter(r => r !== null);
        setBookmarkedRecipes(recipes);
      }
      setUserDataLoading(false);
    };

    fetchBookmarks();
  }, [user]);

  // AI 코드(안티그래비티): 로그아웃을 위함
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("로그아웃 실패: " + error.message);
    } else {
      navigate('/');
    }
  };

  // AI 코드(안티그래비티): 즐겨찾기 삭제를 위함
  const handleBookmarkToggle = async (e, recipeId) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmark')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);
      if (error) throw error;
      setBookmarkedRecipes(prev => prev.filter(r => r.id !== recipeId));
    } catch (err) {
      alert("즐겨찾기 해제에 실패했습니다: " + err.message);
    }
  };

  // AI 도움(안티그래비티): 로그인 전에 등록. 즐겨찾기 눌렀을 때를 위함
  const handleFooterNav = (e, path) => {
    if (!user && (path === '/register' || path === '/bookmarks')) {
      e.preventDefault();
      alert("로그인이 필요합니다!");
      navigate('/my');
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", overflow: "hidden", backgroundColor: "#fff", boxSizing: "border-box", position: "fixed", top: 0, left: 0 }}>
      {/* 헤더 */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        height: "10dvh",
        width: "100%",
        boxSizing: "border-box",
        padding: "0 15px",
        borderBottom: "1px solid #e0e0e0",
        flexShrink: 0
      }}>
        {/* 로고 */}
        <div style={{display: "flex", alignItems: "center", flex: 1, minWidth: "0", justifyContent: "flex-start"}}>
          <Link to="/" style={{display: "flex", alignItems: "center", textDecoration: "none"}}>
            <img src={logoTitle} alt="Shape Your Recipe!" style={{width:"100%", height: "100%", objectFit: "contain", maxWidth: "170px"}}/>
          </Link>
        </div>
  
        {/* 제목 */}
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", flex: "0 0 auto", padding: "0 10px"}}>
          <span style={{fontSize: "clamp(15px, 3vw, 18px)", fontWeight: "bold", color: "#333", whiteSpace: "nowrap"}}>즐겨찾기</span>
        </div>
  
        {/* 로그인, 로그아웃 */}
        <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1, minWidth: "0", fontSize: "13px"}}>
          {user ? (
            <span onClick={handleLogout} style={{textDecoration: "none", color: "#000", fontWeight: "bold", whiteSpace: "nowrap", cursor: "pointer", fontSize: "clamp(11px, 3vw, 13px)",  userSelect: "none"}}>
              로그아웃
            </span>
          ) : (
            <span onClick={() => navigate("/login")} style={{textDecoration: "none", color: "#000", fontWeight: "bold", whiteSpace: "nowrap", cursor: "pointer", fontSize: "clamp(11px, 3vw, 13px)", userSelect: "none"}}>
              로그인
            </span>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main style={{flex: "1", overflowY: "auto", overflowX: "hidden", width: "100%", boxSizing: "border-box", backgroundColor: "#ffffff"}}>
        <div style={{padding: "15px 15px"}}>
          {userDataLoading ? (
            <div style={{textAlign: "center", padding: "40px 0"}}>
              <p style={{fontSize: "15px", color: "#888", margin: 0}}>로딩 중...</p>
            </div>
          ) : bookmarkedRecipes.length == 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: "clamp(12px, 2vw, 14px)" }}>
              즐겨찾기한 레시피가 없습니다. 
            </div>
          ) : (
            <ul className={styles.recipeGrid}>
              {bookmarkedRecipes.map((data) => (
                <li key={data.id} className={styles.list} onClick={() => {navigate("/detail", {state: {recipeDetail: data}})}} >
                  <div className={styles.recipeImageWrapper}>
                    <img src={data.photo || logo} style={{width: "100%", height: "100%", objectFit: data.photo ? "cover" : "contain"}} alt={data.title}></img>
                  </div>

                  <div style={{padding: "8px 4px 4px 4px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between"}}>
                    {/* 제목, 즐겨찾기 */}
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto"}}>
                      <p style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "600", textAlign: "left", margin: "0 0 4px 0", color: "#333", wordBreak: "break-all", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"}}>
                        {data.title}
                      </p>

                      <span onClick={(e) => handleBookmarkToggle(e, data.id)} style={{fontSize: "clamp(16px, 3vw, 18px)", color: "#FFD700", cursor: "pointer", userSelect: "none"}}>
                        ★
                      </span>
                    </div>

                    {/* 레시피 */}
                    <p style={{fontSize: "clamp(11px, 2vw, 13px)", color: "#888", textAlign: "left", margin: "0 0 6px 0"}}>
                      {data.type || "레시피"}
                    </p>

                    {/* 난이도 */}
                    <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#ffc765" }}>
                      {data.difficulty == 0 ? '쉬움' : data.difficulty == 1 ? '보통' : '어려움'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* 풋터 */}
      <footer style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "#fff",
        height: "10dvh",
        width: "100%",
        borderTop: "1px solid #e0e0e0",
        boxSizing: "border-box",
        flexShrink: 0
      }}>
        <Link to="/" className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>홈</span>
        </Link> 

        <Link to="/register" onClick={(e) => handleFooterNav(e, '/register')} className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>등록</span>
        </Link> 

        <Link to="/bookmarks" onClick={(e) => handleFooterNav(e, '/bookmarks')} className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>즐겨찾기</span>
        </Link>

        <div className={styles.footerBtn} onClick={handleRandom} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>뭐 먹지?</span>
        </div> 

        <Link to="/my" className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>MY</span>
        </Link>
      </footer>
    </div>
  );
}
