import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';
import styles from '../Common.module.css';
import logo from '../assets/logo.png';
import logoTitle from '../assets/logoTitle.png';

export default function Start() {
  const navigate = useNavigate(); // AI 도움(제미나이): 페이지 이동 도움

  const [loading, setLoading] = useState(true); // AI 도움(제미나이): 로딩 시 "로딩 중..." 화면이 뜨도록 함
  const [list, setList] = useState([]); 
  const [user, setUser] = useState(null); // AI 도움(안티그래비티): 로그인 감지를 위함
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set()); // AI 도움(안티그래비티): 즐겨찾기한 사용자 ID 담을 그릇(set)

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

  // AI 코드(안티그래비티): 사용자의 즐겨찾기 목록을 위함
  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      return;
    }

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from('bookmark')
        .select('recipe_id')
        .eq('user_id', user.id);
      if (!error && data) {
        setBookmarkedIds(new Set(data.map(b => b.recipe_id)));
      }
    };
    fetchBookmarks();
  }, [user]);

  useEffect(() => { 
    const fetchRecipe = async () => { 
      setLoading(true);
      const {data, error} = await supabase
        .from("recipe")
        .select("*")
        .order("title", {ascending: true});

        if (error) {
          alert("데이터를 불러오지 못했습니다.. " + error.message);
        } else {
          setList(data || []);
        }
        setLoading(false);
    }
    fetchRecipe();
  }, [])

  // AI 코드(안티그래비티): 즐겨찾기 추가/삭제를 위함
  const handleBookmarkToggle = async (e, recipeId) => {
    e.stopPropagation(); 
    if (!user) {
      alert("로그인이 필요합니다!");
      navigate("/my");
      return;
    }

    try {
      if (bookmarkedIds.has(recipeId)) {
        const { error } = await supabase
          .from('bookmark')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
        if (error) throw error;
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('bookmark')
          .insert({ user_id: user.id, recipe_id: recipeId });
        if (error) throw error;
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.add(recipeId);
          return next;
        });
      }
    } catch (err) {
      alert("즐겨찾기 토글에 실패했습니다.. " + err.message);
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

  // AI 코드(제미나이): 레시피를 랜덤으로 뽑는 함수 -> Random으로 정보 보내기
  const handleRandom = () => {
    if (list.length == 0) {
      alert("등록된 레시피가 없습니다..")
      return;
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    const randomRecipe = list[randomIndex];

    navigate('/random', {state: {recipeRandom: randomRecipe}});
  }

  // AI 도움(안티그래비티): 로그인 전에 등록. 즐겨찾기 눌렀을 때를 위함
  const handleFooterNav = (e, path) => {
    if (!user && (path === '/register' || path === '/bookmarks')) {
      e.preventDefault();
      alert("로그인이 필요합니다!");
      navigate('/my');
    }
  };

  // UI
  return (

    <div style={{display: "flex", flexDirection: "column", height: "100dvh", width: "100%", overflow: "hidden", backgroundColor: "#ffffff", boxSizing: "border-box", position: "fixed", top: 0, left: 0 }}>
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
          <span style={{fontSize: "clamp(15px, 3vw, 18px)", fontWeight: "bold", color: "#333", whiteSpace: "nowrap"}}>레시피 보기</span>
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
      <main style={{flex: "1", overflowY: "auto", overflowX: "hidden", width: "100%", boxSizing: "border-box", backgroundColor: "#ffffff"}}>
        {loading ? (
          
          // 로딩 중
          <div style={{display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center"}}>
            <p style={{fontSize: "clamp(17px, 2.5vw, 25px)", margin: 0, color: "#888"}}>로딩 중...</p>
          </div>
        ) : list.length == 0 ? (
        
          // 등록된 레시피 X
          <div style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
            <p style={{fontSize: "clamp(17px, 2.5vw, 25px)"}}>등록된 레시피가 없습니다.</p>
            <p style={{fontSize: "clamp(17px, 2.5vw, 25px)"}}>레시피를 등록해주세요!</p>
          </div>
        ) : (
        
          // 등록된 레시피 O
          <div style={{width: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "15px"}}>
              <ul className={styles.recipeGrid}>
                {list.map((data) => (
                  // AI 도움(제미나이): Detail.jsx에 선택된 레시피 정보 보내기
                  <li key={data.id} className={styles.list} onClick={() => {navigate("/detail", {state: {recipeDetail: data}})}}>
                    {data.photo ? (
                      <div className={styles.recipeImageWrapper}>
                        <img src={data.photo} style={{width: "100%", height: "100%", objectFit: "cover"}} alt={data.title}></img>
                      </div>
                    ) : (
                      <div className={styles.recipeImageWrapper}>
                        <img src={logo} style={{width: "100%", height: "100%", objectFit: "contain"}} alt="이미지 없음"></img>
                      </div>
                    )}
      
                    <div style={{ padding: "8px 4px 4px 4px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between"}}>
                      {/* 제목, 즐겨찾기 */}
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto"}}>
                        {/* 제목 */}
                        <p style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "600", textAlign: "left", cursor: "pointer", margin: "0 0 4px 0", lineHeight: "1.3", color: "#333", overflow: "hidden", wordBreak: "break-all", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical"}}>
                          {data.title}
                        </p>
                        
                        {/* AI 도움(안티그래비티): 즐겨찾기 색상 바뀌게 */}
                        <span onClick={(e) => handleBookmarkToggle(e, data.id)} style={{fontSize: "clamp(16px, 3vw, 18px)", color: user && bookmarkedIds.has(data.id) ? "#FFD700" : "#ccc", cursor: "pointer", userSelect: "none"}}>
                          ★
                        </span>
                      </div>
                      
                  
                      {/* 종류 */}
                      <p style={{fontSize: "clamp(11px, 2vw, 13px)", color: "#888", textAlign: "left", margin: "0 0 6px 0"}}>
                        {data.type}
                      </p>
                      
                      {/* 난이도 */}
                      <span style={{fontSize: "clamp(11px, 2vw, 13px)", color: "#ffc765"}}>
                        {data.difficulty == 0 ? '쉬움' : data.difficulty == 1 ? '보통' : '어려움'}
                      </span>

                    </div>
                  </li>
                ))}
              </ul>
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
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>홈</span>
        </Link> 

        <Link to="/register" onClick={(e) => handleFooterNav(e, '/register')} className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>등록</span>
        </Link> 

        <Link to="/bookmarks" onClick={(e) => handleFooterNav(e, '/bookmarks')} className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>즐겨찾기</span>
        </Link> 

        <div className={styles.footerBtn} onClick={handleRandom} style={{cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>뭐 먹지?</span>
        </div> 

        <Link to="/my" className={styles.footerBtn}>
          <span style={{fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "bold"}}>MY</span>
        </Link>
      </footer>
    </div>

  )
}