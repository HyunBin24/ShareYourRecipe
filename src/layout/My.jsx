import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../Common.module.css';
import logo from '../assets/logo.png';
import logoTitle from '../assets/logoTitle.png';

export default function My() {
  const navigate = useNavigate();
  
  // AI 코드(안티그래비티): 로그인/회원가입 코드
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [myRecipes, setMyRecipes] = useState([]);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState([]);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // AI 도움(제미나이): 랜덤 함수
  const handleRandom = async () => {
    const {data: allRecipe, error} = await supabase
      .from("recipe")
      .select("*");
    
    if (error) {
      alert("레시피 뽑기에 실패했어요..")
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
  }

  // AI 도움(안티그래비티): 로그인 전에 등록. 즐겨찾기 눌렀을 때를 위함
  const handleFooterNav = (e, path) => {
    if (!user && (path === '/register' || path === '/bookmarks')) {
      e.preventDefault();
      alert("로그인이 필요합니다!");
      navigate('/my');
    }
  };

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

  // AI 코드(안티그래비티): 사용자 데이터 가져오기
  useEffect(() => {
    if (!user) {
      setMyRecipes([]);
      setBookmarkedRecipes([]);
      return;
    }

    const fetchUserData = async () => {
      setUserDataLoading(true);
      const { data: myData, error: myError } = await supabase
        .from('recipe')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true });
      if (!myError) {
        setMyRecipes(myData || []);
      }

      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmark')
        .select(`recipe (*)`)
        .eq('user_id', user.id);

      if (!bookmarkError && bookmarkData) {
        const recipes = bookmarkData
          .map(b => b.recipe)
          .filter(r => r !== null);
        setBookmarkedRecipes(recipes);
      }
      setUserDataLoading(false);
    };

    fetchUserData();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSignUp && nickname.trim() == "") {
      alert("닉네임을 확인해주세요!");
      return;
    }

    if (email.trim() == "") {
      alert("이메일을 확인해주세요!")
      return;
    }

    if (password.trim() == "") {
      alert("비밀번호를 확인해주세요!")
      return;
    }

    setLoading(true);

    // AI 코드(안티그래비티): 회원가입, 로그인 처리를 위함
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim()
            }
          }
        });
        if (error) throw error;
        setIsEmailSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      alert("인증 오류: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("로그아웃 실패: " + error.message);
    } else {
      navigate('/');
    }
  };

  // AI 코드(안티그래비티): 즐겨찾기 추가/삭제를 위함
  const handleBookmarkToggle = async (e, recipeId) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const isBookmarked = bookmarkedRecipes.some(r => r.id === recipeId);
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmark')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
        if (error) throw error;
        setBookmarkedRecipes(prev => prev.filter(r => r.id !== recipeId));
      } else {
        const { error } = await supabase
          .from('bookmark')
          .insert({ user_id: user.id, recipe_id: recipeId });
        if (error) throw error;
        const { data: recipeData, error: recipeErr } = await supabase
          .from('recipe')
          .select('*')
          .eq('id', recipeId)
          .single();
        if (!recipeErr && recipeData) {
          setBookmarkedRecipes(prev => [...prev, recipeData].sort((a, b) => a.id - b.id));
        }
      }
    } catch (err) {
      alert("즐겨찾기 토글에 실패했습니다: " + err.message);
    }
  };

  // AI 코드(안티그래비티): 메일 발송 관련
  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResendMsg('확인 메일이 다시 전송되었습니다.');
    } catch (err) {
      setResendMsg('재발송에 실패했습니다: ' + err.message);
    } finally {
      setResendLoading(false);
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
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", flex: "0 0 auto", padding: "0 10px"}}>
          <span style={{fontSize: "clamp(15px, 3vw, 18px)", fontWeight: "bold", color: "#333", whiteSpace: "nowrap"}}>MY</span>
        </div>
  
        {/* 로그인, 로그아웃 */}
        <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1, minWidth: "0", fontSize: "13px"}}>
          {user ? (
            <span onClick={handleLogout} style={{textDecoration: "none", color: "#333", fontWeight: "bold", whiteSpace: "nowrap", cursor: "pointer", fontSize: "clamp(11px, 3vw, 13px)",  userSelect: "none"}}>
              로그아웃
            </span>
          ) : (
            <span onClick={() => navigate("/login")} style={{textDecoration: "none", color: "#333", fontWeight: "bold", whiteSpace: "nowrap", cursor: "pointer", fontSize: "clamp(11px, 3vw, 13px)", userSelect: "none"}}>
              로그인
            </span>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main style={{flex: "1", overflowY: "auto", overflowX: "hidden", width: "100%", boxSizing: "border-box", backgroundColor: "#fff"}}>
        {user ? (
          <div style={{width: "100%", boxSizing: "border-box"}}>
            {/* AI 코드(안티그래비티): 로그인 후 사용자 부분 */}
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "#ffc765", marginBottom: "0", boxSizing: "border-box", width: "100%", minHeight: "72px", flexWrap: "wrap", gap: "12px"}}>
              <div style={{display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{width: "44px", height: "44px", borderRadius: "50%", border: "2px solid #fff", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#333"}}></span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "clamp(15px, 3vw, 18px)", fontWeight: "bold", color: "#fff" }}>
                    {user.user_metadata?.nickname || user.email.split('@')[0]}
                  </span>
                </div>
              </div>

              <button onClick={handleLogout} style={{padding: "6px 18px", borderRadius: "24px", border: "1.5px solid #e33737", backgroundColor: "transparent", color: "#e33737", fontWeight: "bold", fontSize: "clamp(11px, 2vw, 13px)", cursor: "pointer", outline: "none"}} 
                onPointerEnter={(e) => {
                  e.target.style.backgroundColor = "#e33737";
                  e.target.style.color = "#fff";
                }}
                onPointerLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#e33737";
                }}
              >
                로그아웃
              </button>
            </div>

            {/* AI 코드(안티그래비티): 내가 등록한 레시피만 보이도록 함 */}
            <div style={{ padding: "15px 15px" }}>
            {userDataLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: "15px", color: "#888", margin: 0 }}>로딩 중...</p>
              </div>
            ) : myRecipes.length == 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: "clamp(12px, 2.5vw, 14px)" }}>
                등록된 레시피가 없습니다
              </div>
            ) : (
              <ul className={styles.recipeGrid}>
                {myRecipes.map((data) => (
                  <li key={data.id} className={styles.list} onClick={() => {navigate("/detail", {state: {recipeDetail: data}})}} >
                    {/* 이미지 */}
                    <div className={styles.recipeImageWrapper}>
                      <img src={data.photo || logo} style={{width: "100%", height: "100%", objectFit: data.photo ? "cover" : "contain"}} alt={data.title}></img>
                    </div>

                    <div style={{ padding: "8px 4px 4px 4px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                      {/* 제목, 즐겨찾기 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                        <p style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "600", textAlign: "left", margin: "0 0 4px 0", color: "#333", wordBreak: "break-all", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {data.title}
                        </p>

                        <span onClick={(e) => handleBookmarkToggle(e, data.id)} style={{ fontSize: "clamp(16px, 3vw, 18px)", color: bookmarkedRecipes.some(r => r.id === data.id) ? "#FFD700" : "#ccc", cursor: "pointer", userSelect: "none" }}>
                          ★
                        </span>
                      </div>

                      {/* 레시피 */}
                      <p style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#888", textAlign: "left", margin: "0 0 6px 0" }}>
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
          </div>
        ) : (
          // AI 코드(안티그래비티): 회원가입
          <div style={{minHeight: "75dvh", display: "flex", justifyContent: "center", alignItems: "center", padding: "15px 15px", boxSizing: "border-box", width: "100%"}}>
            {isEmailSent ? (
              <div style={{width: '100%', maxWidth: '400px', padding: '30px', boxSizing: 'border-box', borderRadius: '12px', backgroundColor: '#fcfcfc', textAlign: 'center', border: "1px solid #555"}}>
                <h2 style={{marginBottom: '12px', color: '#555'}}>메일을 확인해 주세요!</h2>
                <p style={{fontSize: '14px', color: '#555', marginBottom: '8px', lineHeight: '1.6' }}>
                  인증 확인 메일을 발송했습니다.
                </p>
                <button onClick={handleResend} disabled={resendLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ffc765', backgroundColor: '#fff', color: '#ffc765', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginBottom: '12px'}}>
                  {resendLoading ? '전송 중...' : '인증 메일 재발송'}
                </button>
                {resendMsg && <p style={{ fontSize: '13px', color: '#ffc765', marginBottom: '12px' }}>{resendMsg}</p>}
                <p style={{ fontSize: '13px', color: '#888' }}>
                  <span onClick={() => {setIsEmailSent(false); setIsSignUp(false); setPassword('');}} style={{color: '#ffc765', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline'}}>
                    로그인 화면으로 돌아가기
                  </span>
                </p>
              </div>
            ) : (
              <div style={{width: '100%', maxWidth: '400px', padding: '30px', boxSizing: 'border-box', borderRadius: '12px', backgroundColor: '#fcfcfc', border: "1px solid #555"}}>
                <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#ffc765'}}>
                  {isSignUp ? '회원가입' : '로그인'}
                </h2>
                <form onSubmit={handleAuth}>
                  {isSignUp && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>닉네임</label>
                      <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임을 입력해 주세요" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #ccc', fontSize: '16px' }} />
                    </div>
                  )}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>이메일</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #ccc', fontSize: '16px' }} />
                  </div>
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>비밀번호</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자리 이상 비밀번호" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #ccc', fontSize: '16px' }} />
                  </div>
                  <button type="submit" disabled={loading} className={styles.myBtn} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '15px' }}>
                    {loading ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                  {isSignUp ? (
                    <p>이미 계정이 있으신가요? <span onClick={() => setIsSignUp(false)} style={{ color: '#ffc765', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>로그인</span></p>
                  ) : (
                    <p>아직 회원이 아니신가요? <span onClick={() => setIsSignUp(true)} style={{ color: '#ffc765', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>회원가입</span></p>
                  )}
                </div>
              </div>
            )}
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
  );
}