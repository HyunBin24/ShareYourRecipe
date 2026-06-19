import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../Common.module.css';
import logo from '../assets/logo.png';
import logoTitle from '../assets/logoTitle.png';

export default function Detail() {
  // AI 도움(제미나이): Recipe.jsx에서 선택된 레시피 정보 받기 
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.recipeDetail;

  const [recipe, setRecipe] = useState(data);
  const [loading, setLoading] = useState(true); // AI 도움(제미나이): 로딩 시 "로딩 중..." 화면이 뜨도록 함
  const [user, setUser] = useState(null); // AI 도움(안티그래비티): 로그인 감지를 위함
  const [isBookmarked, setIsBookmarked] = useState(false); 

  // AI 코드(안티그래비티): 로그인 세션 관련
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // AI 코드(안티그래비티): 즐겨찾기 여부를 가져오기 위함
  useEffect(() => {
    if (!recipe) return;

    const fetchStats = async () => {
      if (user) {
        const { data: bookmarkData } = await supabase
          .from('bookmark')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', recipe.id)
          .maybeSingle();
        setIsBookmarked(!!bookmarkData);
      } else {
        setIsBookmarked(false);
      }
    };

    fetchStats();
  }, [recipe, user]);

  // AI 코드(제미나이): 로딩 시 로딩 중을 보여주기 위함
  useEffect(() => {
    if (data) {
      setRecipe(data);
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500)

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [data])

  // AI 코드(안티그래비티): 즐겨찾기 추가/삭제를 위함
  const handleToggleBookmark = async () => {
    if (!user) {
      alert("로그인이 필요합니다!");
      navigate("/my");
      return;
    }

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmark')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipe.id);
        if (error) throw error;
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from('bookmark')
          .insert({ user_id: user.id, recipe_id: recipe.id });
        if (error) throw error;
        setIsBookmarked(true);
      }
    } catch (err) {
      alert("즐겨찾기 설정에 실패했습니다: " + err.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("로그아웃에 실패했습니다: " + error.message);
    } else {
      navigate('/');
    }
  };

  // 삭제 함수
  const handleDelete = async(id) => {
    const {error} = await supabase
      .from("recipe")
      .delete()
      .eq("id", id)
      
      if (error) {
        alert("레시피 삭제에 실패했습니다.. " + error.message)
      } else {
        navigate("/my");
      }
  }

  // AI 도움(제미나이): 랜덤 함수
  const handleRandom = async () => {
    const {data: allRecipe, error} = await supabase
      .from("recipe")
      .select("*");
    
    if (error) {
      alert("레시피 뽑기에 실패했어요..")
    } else { 
      // AI 코드(제미나이): 레시피가 겹치지 않도록 함 (바로 전 레시피)
      const filteredRecipe = allRecipe.filter(item => item.title !== recipe?.title);

      const targetRecipe = filteredRecipe.length > 0 ? filteredRecipe : allRecipe;

      const randomIndex = Math.floor(Math.random() * targetRecipe.length);
      const newRandomRecipe = targetRecipe[randomIndex];

      navigate("/random", { state: { recipeRandom: newRandomRecipe } });
    }
  }

  // AI 도움(안티그래비티): 로그인 전에 등록. 즐겨찾기 눌렀을 때를 위함
  const handleFooterNav = (e, path) => {
    if (!user && (path === '/register' || path === '/bookmarks')) {
      e.preventDefault();
      alert("로그인이 필요합니다!");
      navigate('/my');
    }
  };

  return (
    
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", overflow: "hidden", backgroundColor: "#ffffff", boxSizing: "border-box", position: "fixed", top: 0, left: 0 }}>
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
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", flex: "0 0 auto",  padding: "0 10px"}}>
          <span style={{fontSize: "clamp(15px, 3vw, 18px)", fontWeight: "bold", color: "#333", whiteSpace: "nowrap"}}>상세 레시피</span>
        </div>
  
        {/* 로그인, 로그아웃 */}
        <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1, minWidth: "0", fontSize: "13px"}}>
          {user ? (
            <span onClick={handleLogout} style={{textDecoration: "none", color: "#000", fontWeight: "bold", whiteSpace: "nowrap", cursor: "pointer", fontSize: "clamp(11px, 3vw, 13px)",  userSelect: "none"}}>
              로그아웃
            </span>
          ) : (
            <span onClick={() => navigate("/my")} style={{textDecoration: "none", color: "#000", fontWeight: "bold", whiteSpace: "nowrap", cursor: "pointer", fontSize: "clamp(11px, 3vw, 13px)", userSelect: "none"}}>
              로그인
            </span>
          )}
        </div>
      </header>
  
      {/* 메인 */}
      <main style={{flex: "1", overflowY: "auto", overflowX: "hidden", width: "100%", boxSizing: "border-box", backgroundColor: "#fff"}}>
        {loading ? (
          <div style={{display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center"}}>
            <p style={{fontSize: "clamp(17px, 2vw, 25px)", margin: 0, color: "#888"}}>로딩 중...</p>
          </div>
        ) : recipe ? (
          <div key={recipe.id} style={{display: "flex", flexWrap: "wrap", width: "100%", boxSizing: "border-box", padding: "15px", alignItems: "stretch"}}>
            {/* 제목, 즐겨찾기 */}
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", margin: "0 0 20px 0", flexWrap: "wrap", gap: "10px"}}>
              <p style={{fontSize: "clamp(22px, 3vw, 30px)", fontWeight: "bold", margin: 0, textAlign: "left"}}>{recipe.title}</p>
              
              <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
                {/* AI 도움(안티그래비티): 즐겨찾기 색상 바뀌게 */}
                <span onClick={handleToggleBookmark} style={{ fontSize: "clamp(24px, 3vw, 28px)", color: user && isBookmarked ? "#FFD700" : "#ccc", cursor: "pointer", userSelect: "none" }}>
                  ★
                </span>
              </div>
            </div>

            <div style={{flex: "1 1 350px", padding: "10px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "flex-start"}}>
              <div style={{ width: "100%", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "12px", border: "1px solid #888", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" }}>
                <img src={recipe.photo || logo} alt={recipe.title} style={{width: "100%", height: "100%", objectFit: recipe.photo ? "cover" : "contain"}}/>
              </div>
            </div>

            <div style={{flex: "1 1 400px", padding: "10px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "flex-start", textAlign: "left"}}>
              <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>
                {/* 난이도 */}
                <div style={{display: "flex", alignItems: "center" }}>
                  <span style={{fontWeight: "bold", width: "80px", color: "#888", fontSize: "clamp(13px, 2vw, 15px)"}}>난이도</span>
                  <span style={{fontSize: "clamp(13px, 2vw, 15px)", color: "#000" }}>
                    {recipe.difficulty == 0 ? "쉬움" : recipe.difficulty == 1 ? "보통" : "어려움"}
                  </span>
                </div>

                {/* 종류 */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", width: "80px", color: "#888", fontSize: "clamp(13px, 2vw, 15px)" }}>종류</span>
                  <span style={{ fontSize: "clamp(13px, 2vw, 15px)", color: "#000"}}>{recipe.type}</span>
                </div>

                {/* 재료 */}
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "bold", width: "80px", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginTop: "2px" }}>재료</span>
                  <span style={{ fontSize: "clamp(13px, 2vw, 15px)", color: "#000", flex: 1, lineHeight: "1.4" }}>{recipe.ingredients}</span>
                </div>

                {/* 간단 레시피 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontWeight: "bold", color: "#888", fontSize: "clamp(13px, 2vw, 15px)" }}>간단 레시피</span>
                  <p style={{fontSize: "clamp(13px, 2vw, 15px)", textAlign: "left", whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#000", margin: 0, border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px", boxSizing: "border-box"}}>
                    {recipe.recipe}
                  </p>
                </div>
              </div>
            </div>

            {/* 수정, 삭제 */}
            {/* AI 도움(안티그래비티): 로그인한 사람과 등록한 사람이 같을 때만 수정, 삭제할 수 있도록 함 */}
            {user && recipe.user_id === user.id && (
              <div style={{width: "100%", justifyContent: "right", display: "flex", padding: "10px", gap: "10px"}}>
                <button 
                  onClick={() => navigate("/register", { state: { recipeEdit: recipe } })} 
                  className={styles.btn} 
                  style={{padding: "10px 30px", boxSizing: "border-box", border: "none", color: "#fff", fontWeight: "bold", fontSize: "clamp(12px, 2vw, 16px)", borderRadius: '8px', cursor: "pointer", margin: 0}}>
                  수정
                </button>
                
                <button onClick={() => {if (window.confirm("삭제하겠습니까?")) {handleDelete(recipe.id);}}} className={styles.redBtn} style={{padding: "10px 30px", boxSizing: "border-box", border: "none", color: "#fff", fontWeight: "bold", fontSize: "clamp(12px, 2vw, 16px)", borderRadius: '8px', cursor: "pointer", margin: 0}}>
                  삭제
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
            <p style={{fontSize: "clamp(17px, 2vw, 25px)", margin: 0}}>레시피가 없습니다.</p>
          </div>
        )}
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
          <span style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold" }}>홈</span>
        </Link> 

        <Link to="/register" onClick={(e) => handleFooterNav(e, '/register')} className={styles.footerBtn}>
          <span style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold" }}>등록</span>
        </Link> 

        <Link to="/bookmarks" onClick={(e) => handleFooterNav(e, '/bookmarks')} className={styles.footerBtn}>
          <span style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold" }}>즐겨찾기</span>
        </Link> 

        <div className={styles.footerBtn} onClick={handleRandom} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold" }}>뭐 먹지?</span>
        </div> 

        <Link to="/my" className={styles.footerBtn}>
          <span style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold" }}>MY</span>
        </Link>
      </footer>
      
    </div>

  )
}