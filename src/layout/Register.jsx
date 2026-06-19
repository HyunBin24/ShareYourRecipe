import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../Common.module.css';
import logo from '../assets/logo.png';
import logoTitle from '../assets/logoTitle.png';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // AI 코드(안티그래비티): 수정 모드 관련
  const editData = location.state?.recipeEdit;
  const isEditMode = !!editData;

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState([]);
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState("");
  const [photo, setPhoto] = useState(null);
  const fileInputRef = useRef(null); // AI 도움(제미나이): 이전 파일 이름 지우기 위함

  // AI 도움(안티그래비티): 로그인 관련
  const [user, setUser] = useState(null);
  // AI 도움(안티그래비티): 중복 클릭 등록 방지를 위함
  const [submitting, setSubmitting] = useState(false); 

  // AI 코드(안티그래비티): 등록 클릭 시 로그인 여부 체크를 위함
  const authAlertShown = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
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
    checkAuth();
  }, [navigate]);

  // AI 코드(제미나이): 미리보기 사진을 담을 곳
  const [photoUrl, setPhotoUrl] = useState("");

  // AI 코드(안티그래비티): 수정 모드 여부에 따라 등록 UI 설정을 위함
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDifficulty(editData.difficulty !== undefined ? String(editData.difficulty) : "");
      setType(editData.type ? editData.type.split(", ").map(t => t.trim()) : []);
      setIngredients(editData.ingredients || "");
      setRecipe(editData.recipe || "");
      setPhotoUrl(editData.photo || "");
    } else {
      setTitle("");
      setDifficulty("");
      setType([]);
      setIngredients("");
      setRecipe("");
      setPhotoUrl("");
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [location.key]);

  // AI 코드(제미나이): 체크박스 변경 함수
  const handleTypeChange = (e) => {
    const {value, checked} = e.target;
    if (checked) {
      setType([...type, value]);
    } else {
      setType(type.filter((t) => t !== value));
    }
  }

  // AI 코드(제미나이): 사진 등록하기
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoUrl(URL.createObjectURL(file))
    }
  }

  // 등록, 수정 함수
  const handleRegister = async () => {
    if (submitting) return;

    // AI 코드(안티그래비티): 수정/등록 시 세션 유효성 더블 체크를 위함
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      navigate("/my");
      return;
    }
    const currentUserId = session.user.id;

    if (title.trim() == '') {
      alert('제목을 입력하세요!');
      return;
    }

    if (difficulty === "") {
      alert("난이도를 선택하세요!");
      return;
    }

    if (type.length === 0) {
      alert('종류을 입력하세요!');
      return;
    }

    if (ingredients.trim() == '') {
      alert('재료을 입력하세요!');
      return;
    }

    if (recipe.trim() == '') {
      alert('레시피을 입력하세요!');
      return;
    }

    setSubmitting(true);

    // AI 코드(제미나이): 사진 먼저 storage에 업로드 후 url과 글 db에 업로드
    try {
      let finalPhotoUrl = isEditMode ? (editData.photo || "") : "";

      if (photo) {
        const photoExtension = photo.name.split('.').pop(); 
        const safePhotoName = `${Date.now()}.${photoExtension}`; 

        const { error: storageError } = await supabase.storage
          .from("recipe-image") 
          .upload(safePhotoName, photo, { cacheControl: '3600', upsert: false });

        if (storageError) {
          alert("사진 업로드에 실패했습니다.. " + storageError.message);
          setSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("recipe-image")
          .getPublicUrl(safePhotoName);
          
        finalPhotoUrl = urlData.publicUrl; 
      }

      const recipeData = {
        title: title,
        difficulty: difficulty,
        type: type.join(", "),
        ingredients: ingredients,
        recipe: recipe,
        photo: finalPhotoUrl,
        user_id: currentUserId
      };

      if (isEditMode) {
        const { error: dbError } = await supabase
          .from("recipe")
          .update(recipeData)
          .eq("id", editData.id);

        if (dbError) {
          alert("레시피 수정에 실패했습니다.. " + dbError.message);
        } else {
          alert("레시피 수정에 성공했습니다.");
          navigate("/my");
        }
      } else {
        const { error: dbError } = await supabase
          .from("recipe")
          .insert([recipeData]);

        if (dbError) {
          alert("레시피 등록에 실패했습니다.. " + dbError.message);
        } else {
          alert("레시피 등록에 성공했습니다.");
          navigate("/my");
        }
      }
    } catch (err) {
      alert(err)
    } finally {
      setSubmitting(false);
    }
  };

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
  };

  // AI 도움(안티그래비티): 로그인 전에 등록. 즐겨찾기 눌렀을 때를 위함
  const handleFooterNav = (e, path) => {
    if (!user && (path === '/register' || path === '/bookmarks')) {
      e.preventDefault();
      alert("로그인이 필요합니다!");
      navigate('/my');
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

  return (
    
    <div style={{display: "flex", flexDirection: "column", height: "100dvh", width: "100%", overflow: "hidden", backgroundColor: "#fff", boxSizing: "border-box", position: "fixed", top: 0, left: 0}}>
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
          <span style={{fontSize: "clamp(15px, 3vw, 18px)", fontWeight: "bold", color: "#333", whiteSpace: "nowrap"}}>레시피 등록</span>
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
        <div style={{display: "flex", flexWrap: "wrap", width: "100%", boxSizing: "border-box", padding: "15px", alignItems: "stretch"}}>
          <div
            style={{
              flex: "1 1 400px",
              padding: "10px",
              boxSizing: "border-box",
              borderRight: window.innerWidth > 800 ? "2px solid #ccc" : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            {/* 사진 등록 */}
            <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginBottom: "8px", display: "block"}}>이미지 미리보기</label>
            {/* AI 코드(제미나이): 이미지 미리보기 */}
            {photoUrl ? (
            
              // 이미지가 있는 경우
                <div style={{width: "100%", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "12px", border: "1px solid #f2f2f2", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa", marginBottom: "16px"}}>
                  <img src={photoUrl} alt={title} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                </div>
            ) : (
            
              // 이미지가 없는 경우
              <div style={{width: "100%", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "12px", border: "1px solid #f2f2f2", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa", marginBottom: "16px"}}>
                  <img src={logo} alt={title} style={{width: "100%", height: "100%", objectFit: "contain"}} />
              </div>
            )}

            <div style={{marginBottom: '16px', display: "flex", alignItems: "center", flexWrap: "wrap"}}>
              <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginRight: "10px", boxSizing: "border-box"}}>사진 등록</label>
              {/* AI 도움(제미나이): 사진 등록을 위함 */}
              <input type="file" ref={fileInputRef} style={{fontSize: "clamp(12px, 2vw, 15px)"}} onChange={handlePhotoChange} />
            </div>
          </div>
          
          <div style={{flex: "1 1 400px", padding: "10px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center"}}>
            {/* 제목 */}
            <div style={{marginBottom: '16px'}}>
              <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginBottom: "6px", display: "block"}}>제목</label>
              <textarea value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요!" style={{width: "100%", height: "30px", resize: "none", border: "2px solid #ccc", fontSize: "clamp(12px, 2vw, 15px)", borderRadius: '8px', boxSizing: "border-box"}}></textarea>
            </div>
          
            {/* 난이도 */}
            <div style={{marginBottom: '16px'}}>
              <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginBottom: "6px", display: "block"}}>난이도</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{fontSize: "clamp(12px, 2vw, 15px)", width: "100%", height: "30px", color: "#787878", borderRadius: '8px', boxSizing: "border-box"}}>
                <option value="">난이도를 선택하세요!</option>
                <option value="0">쉬움</option>
                <option value="1">보통</option>
                <option value="2">어려움</option>
              </select>
            </div>
          
            {/* 종류 */}
            <div style={{marginBottom: '16px'}}>
              <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2.5vw, 15px)", marginBottom: "6px", display: "block"}}>종류</label>
              <div style={{width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ccc', display: 'flex', flexWrap: 'wrap', boxSizing: 'border-box', gap: '8px', color: "#888"}}>
                <label style={{marginRight: '10px', boxSizing: 'border-box', fontSize: 'clamp(12px, 2vw, 14px)'}}>
                  <input type="checkbox" value="한식" checked={type.includes("한식")} onChange={handleTypeChange} /> 한식
                </label>
                <label style={{marginRight: '10px', boxSizing: 'border-box', fontSize: 'clamp(12px, 2vw, 14px)'}}>
                  <input type="checkbox" value="중식" checked={type.includes("중식")} onChange={handleTypeChange} /> 중식
                </label>
                <label style={{marginRight: '10px', boxSizing: 'border-box', fontSize: 'clamp(12px, 2vw, 14px)'}}>
                  <input type="checkbox" value="일식" checked={type.includes("일식")} onChange={handleTypeChange} /> 일식
                </label>
                <label style={{marginRight: '10px', boxSizing: 'border-box', fontSize: 'clamp(12px, 2vw, 14px)'}}>
                  <input type="checkbox" value="양식" checked={type.includes("양식")} onChange={handleTypeChange} /> 양식
                </label>
                <label style={{fontSize: 'clamp(12px, 2vw, 14px)'}}>
                  <input type="checkbox" value="기타" checked={type.includes("기타")} onChange={handleTypeChange} /> 기타
                </label>
              </div>
            </div>
          
            {/* 재료 */}
            <div style={{marginBottom: '16px'}}>
              <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginBottom: "6px", display: "block"}}>재료</label>
              <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="재료를 입력하세요!" style={{width: "100%", height: "50px", resize: "none", border: "2px solid #ccc", fontSize: "clamp(12px, 2vw, 15px)", borderRadius: '8px', boxSizing: "border-box"}}></textarea>
            </div>
          
            {/* 레시피 */}
            <div>
              <label style={{fontWeight: "600", color: "#888", fontSize: "clamp(13px, 2vw, 15px)", marginBottom: "6px", display: "block"}}>간단 레시피</label>
              <textarea value={recipe} onChange={(e) => setRecipe(e.target.value)} placeholder="레시피를 입력하세요!" style={{width: "100%", height: "300px", resize: "none", border: "2px solid #ccc", fontSize: "clamp(12px, 2vw, 15px)", borderRadius: '8px', boxSizing: "border-box"}}></textarea>
            </div>
          </div>

          {/* 최종 수정 / 등록 */}
          <div style={{width: "100%", display: "flex", justifyContent: "right", padding: "10px"}}>
            <button onClick={handleRegister} className={styles.btn} style={{borderRadius: '8px', padding: "10px 30px", boxSizing: "border-box", border: "none", color: "#fff", fontWeight: "bold", fontSize: "clamp(12px, 2vw, 16px)", cursor: "pointer", margin: "0"}}>
              {isEditMode ? "수정" : "등록"}
            </button>
          </div>
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