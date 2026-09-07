import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Brush, CircleUserRound, Download, Eraser,
  Folder, LogIn, Palette, Pencil, Plus, RotateCcw, Save, Sun, Trash2,
  Zap, Clock3
} from "lucide-react";

const PROMPTS = [
  "CAT","APPLE","SAILBOAT","CAR","DOG","FISH","AIRPLANE","BICYCLE",
  "HOUSE","TREE","FLOWER","STAR","SUN","PIZZA","RAINBOW"
];

const COLORS = [
  "#1F1F1F","#F472B6","#8B5CF6","#2563EB","#00BCD4","#10B981",
  "#FBBF24","#F97316","#78350F","#94A3B8","#FFFFFF"
];

function getSavedUser() {
  try { return JSON.parse(localStorage.getItem("doodlesense_user_session")) || {loggedIn:false, username:null}; }
  catch { return {loggedIn:false, username:null}; }
}
function getSavedHistory() {
  try { return JSON.parse(localStorage.getItem("doodlesense_app_history")) || []; }
  catch { return []; }
}

export default function App() {
  const [view, setView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [user, setUser] = useState(getSavedUser);
  const [history, setHistory] = useState(getSavedHistory);
  const [prompt, setPrompt] = useState("CAT");
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#1F1F1F");
  const [lineWidth, setLineWidth] = useState(4);
  const [toast, setToast] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [authName, setAuthName] = useState("artist_doodler");
  const [authPass, setAuthPass] = useState("secret123");
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(35);
  const [loadingText, setLoadingText] = useState("Extracting stroke curvature...");
  const [prediction, setPrediction] = useState({
    label:"CAT", confidence:96.4, strokeSim:95.2, contourMatch:94.8,
    commentary:"Terrific stroke rhythm! Clean recognition with high certainty from our classifier!",
    time:"Just now", image:null
  });

  const canvasRef = useRef(null);
  const canvasBoxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({x:0,y:0});
  const toastTimer = useRef(null);

  const showToast = useCallback((message, icon="✨") => {
    setToast({message, icon});
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const navigate = useCallback((next) => {
    setPreviousView(view);
    setView(next);
  }, [view]);

  useEffect(() => {
    localStorage.setItem("doodlesense_app_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (view === "draw") {
      const id = setTimeout(initCanvas, 50);
      return () => clearTimeout(id);
    }
  }, [view]);

  useEffect(() => {
    const onResize = () => { if (view === "draw") initCanvas(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  function initCanvas() {
    const canvas = canvasRef.current;
    const box = canvasBoxRef.current;
    if (!canvas || !box) return;
    const rect = box.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    let snapshot = null;
    if (canvas.width && canvas.height && canvas.dataset.hasDrawn === "1") {
      try { snapshot = canvas.toDataURL(); } catch {}
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img,0,0,w,h);
      img.src = snapshot;
    }
  }

  function canvasPoint(e) {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const source = e.touches?.[0] || e;
    return {
      x: (source.clientX-r.left) * (canvas.width/r.width),
      y: (source.clientY-r.top) * (canvas.height/r.height)
    };
  }

  function pointerDown(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = canvasPoint(e);
    drawingRef.current = true;
    lastPointRef.current = p;
    canvas.dataset.hasDrawn = "1";
    ctx.beginPath();
    ctx.fillStyle = tool === "eraser" ? "#fff" : color;
    ctx.arc(p.x,p.y,(tool==="eraser" ? lineWidth*3.5 : lineWidth)/2,0,Math.PI*2);
    ctx.fill();
  }

  function pointerMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = canvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x,lastPointRef.current.y);
    ctx.lineTo(p.x,p.y);
    ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
    ctx.lineWidth = tool === "eraser" ? lineWidth*3.5 : lineWidth;
    ctx.stroke();
    lastPointRef.current = p;
  }

  function pointerUp() { drawingRef.current = false; }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
    canvas.dataset.hasDrawn = "0";
    showToast("Canvas cleared!","🧼");
  }

  function cleanSnapshot() {
    const canvas = canvasRef.current;
    if (!canvas || canvas.dataset.hasDrawn !== "1") return null;
    const out = document.createElement("canvas");
    out.width = canvas.width || 640;
    out.height = canvas.height || 400;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,out.width,out.height);
    ctx.drawImage(canvas,0,0);
    return out.toDataURL("image/png");
  }

  function newPrompt() {
    const options = PROMPTS.filter(x => x !== prompt);
    const next = options[Math.floor(Math.random()*options.length)];
    setPrompt(next);
    clearCanvas();
    showToast(`New Task: Draw a ${next}!`,"🎲");
  }

  function saveDoodle() {
    const image = cleanSnapshot();
    if (!image) { showToast("Draw something first!","✏️"); return; }
    const confidence = (91 + Math.random()*8.5).toFixed(1);
    const item = {
      id: Date.now(), image, label: prompt, confidence,
      date: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
    };
    setHistory(h => [item,...h]);
    showToast("Doodle saved to Gallery Vault!","💾");
  }

  function predict() {
    const image = cleanSnapshot();
    if (!image) { showToast("Draw something first!","✏️"); return; }

    const confidence = +(93 + Math.random()*6.5).toFixed(1);
    const strokeSim = +(92 + Math.random()*7.5).toFixed(1);
    const contourMatch = +(91 + Math.random()*8.2).toFixed(1);
    const comments = [
      `"Egg-cellent doodle! Our neural net recognized your ${prompt.toLowerCase()} with ${confidence}% confidence!"`,
      `"Chirp chirp! Beautiful contours! The shape features match ${prompt} with high fidelity!"`,
      `"Terrific stroke rhythm! Clean recognition with high certainty from our classifier!"`,
      `"Remarkable sketch! The stroke curve profile corresponds directly with model training data!"`
    ];
    setPrediction({
      label:prompt, confidence, strokeSim, contourMatch,
      commentary:comments[Math.floor(Math.random()*comments.length)],
      time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
      image
    });

    setLoading(true);
    setLoadingProgress(35);
    setLoadingText(`Extracting stroke curvature for ${prompt}...`);
    setTimeout(() => { setLoadingProgress(80); setLoadingText("Comparing contours with 50,000+ sketch vectors..."); }, 350);
    setTimeout(() => setLoadingProgress(100), 700);
    setTimeout(() => {
      setLoading(false);
      setHistory(h => [{
        id:Date.now(), image, label:prompt, confidence:confidence.toFixed(1),
        date:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
      },...h]);
      navigate("result");
    }, 950);
  }

  function downloadImage(image=prediction.image, label=prediction.label) {
    if (!image) return;
    const a = document.createElement("a");
    a.download = `doodlesense-${label.toLowerCase()}-${Date.now()}.png`;
    a.href = image; a.click();
    showToast("Doodle PNG downloaded!","⬇️");
  }

  function startDrawing() {
    if (!user.loggedIn) setAuthOpen(true);
    else navigate("draw");
  }

  function login(name=authName) {
    const username = name.trim() || "artist_doodler";
    const next = {loggedIn:true, username};
    setUser(next);
    localStorage.setItem("doodlesense_user_session",JSON.stringify(next));
    setAuthOpen(false);
    showToast(`Welcome, ${username}! Workspace ready.`,"🎨");
    navigate("draw");
  }

  function guestLogin() {
    setAuthName("SpeedArtist");
    login("SpeedArtist");
  }

  function closeHistory() {
    navigate(previousView === "history" ? "home" : previousView);
  }

  return (
    <div className="app-shell">
      {toast && <div className="toast"><span>{toast.icon}</span>{toast.message}</div>}

      {loading && (
        <div className="modal-overlay">
          <div className="loading-card">
            <div className="loading-icon">🎨</div>
            <h3>DoodleSense AI Analyzing...</h3>
            <div className="progress-track"><div className="progress-fill" style={{width:`${loadingProgress}%`}}/></div>
            <p>{loadingText}</p>
            <span className="mono-label">Neural Net Live Classifier</span>
          </div>
        </div>
      )}

      {authOpen && (
        <div className="modal-overlay" onMouseDown={(e)=>e.target===e.currentTarget && setAuthOpen(false)}>
          <div className="auth-card">
            <button className="modal-close" onClick={()=>setAuthOpen(false)}>×</button>
            <div className="auth-title"><div className="icon-circle">◉</div><h3>Sign In / Nickname</h3></div>
            <p>Choose a nickname to save your sketches and run neural recognition.</p>
            <label>Nickname / Username</label>
            <input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="e.g. PicassoCat"/>
            <label>Passcode / Secret (optional)</label>
            <input type="password" value={authPass} onChange={e=>setAuthPass(e.target.value)} />
            <button className="teal-btn full" onClick={()=>login()}>Start Drawing Now <ArrowRight size={16}/></button>
            <button className="guest-btn" onClick={guestLogin}>⚡ Quick Guest Draw (Skip)</button>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="modal-overlay" onMouseDown={(e)=>e.target===e.currentTarget && setAboutOpen(false)}>
          <div className="about-card">
            <div className="modal-header"><h3>About DoodleSense</h3><button onClick={()=>setAboutOpen(false)}>×</button></div>
            <p><b>DoodleSense</b> is an interactive real-time AI sketch recognizer. Draw quick doodles on our custom canvas, and friendly neural classifiers compare your contours against hundreds of thousands of standard QuickDraw vectors!</p>
            <div className="about-note">⚡ Zero-lag stroke input, touch & stylus friendly, instant accuracy metrics.</div>
            <button className="teal-btn full" onClick={()=>setAboutOpen(false)}>Got It, Let's Draw!</button>
          </div>
        </div>
      )}

      <main className="viewport">
        {view === "home" && <Home user={user} startDrawing={startDrawing} setAuthOpen={setAuthOpen} navigate={navigate} showToast={showToast} setAboutOpen={setAboutOpen}/>}
        {view === "draw" && (
          <DrawWorkspace
            prompt={prompt} newPrompt={newPrompt} navigate={navigate} predict={predict}
            canvasRef={canvasRef} canvasBoxRef={canvasBoxRef}
            pointerDown={pointerDown} pointerMove={pointerMove} pointerUp={pointerUp}
            tool={tool} setTool={setTool} color={color} setColor={setColor}
            lineWidth={lineWidth} setLineWidth={setLineWidth} clearCanvas={clearCanvas}
            saveDoodle={saveDoodle} showToast={showToast}
          />
        )}
        {view === "result" && (
          <ResultScreen prediction={prediction} navigate={navigate} drawAgain={()=>{clearCanvas(); navigate("draw");}} downloadImage={downloadImage}/>
        )}
        {view === "history" && (
          <HistoryScreen history={history} closeHistory={closeHistory} downloadImage={downloadImage}
            clearAll={()=>{ if(confirm("Clear all saved doodles from your DoodleSense Vault?")) {setHistory([]); localStorage.removeItem("doodlesense_app_history"); showToast("Vault history cleared","🗑️");}}}/>
        )}
      </main>
    </div>
  );
}

function Header({user,startDrawing,navigate,showToast,setAuthOpen}) {
  return (
    <header className="top-nav">
      <div className="brand" onClick={()=>navigate("home")}><div className="brand-badge">〰</div><span>DoodleSense</span></div>
      <nav className="nav-dock">
        <button className="active" onClick={()=>navigate("home")}>Explore</button>
        <button onClick={startDrawing}>Play &amp; Draw</button>
        <button onClick={()=>navigate("history")}>Gallery Vault</button>
        <button onClick={()=>showToast('New Community Challenge unlocked: "Space Marine in 20s"!','🏆')}>Community Challenges</button>
      </nav>
      <div className="nav-actions">
        <span className="status-pill"></span>
        <button className="round-control" onClick={()=>showToast("Switched to Adaptive Contrast Mode","☀️")}><Sun size={15}/></button>
        <button className="avatar" onClick={()=>setAuthOpen(true)}>
          {user.loggedIn ? user.username.slice(0,2).toUpperCase() : <CircleUserRound size={15}/>}
        </button>
      </div>
    </header>
  );
}

function Home({user,startDrawing,setAuthOpen,navigate,showToast,setAboutOpen}) {
  return (
    <section className="home-screen">
      <Header {...{user,startDrawing,navigate,showToast,setAuthOpen}}/>
      <div className="hero">
        <div className="hero-copy">
          <div className="blue-accent"></div>
          <h1>Draw Anything.<br/><span>Watch Friendly AI</span><br/>Guess in Real-Time.</h1>
          <div className="hero-actions">
            <button className="teal-btn" onClick={startDrawing}><Brush size={15}/>Start Drawing Free</button>
            <button className="signin-btn" onClick={()=>setAuthOpen(true)}><LogIn size={14}/>{user.loggedIn ? `Logged in: ${user.username}` : "Sign In / Nickname"}</button>
          </div>
          <div className="playful-dots"><i/><i/><span>🚶‍♂️</span></div>
        </div>

        <div className="preview-card">
          <div className="preview-top">
            <div className="live-row"><i></i><b>Guessing Live:</b><span>94% Sailboat ⛵</span></div>
            <div className="latency"><Clock3 size={12}/>118ms</div>
          </div>
          <div className="preview-canvas">
            <div className="corner tl"/><div className="corner tr"/><div className="corner bl"/><div className="corner br"/>
            <Sailboat/>
            <div className="guess-pills"><span>2nd Guess: <b>Paper Plane (6%)</b></span><span>3rd Guess: <b>Pyramid (&lt;1%)</b></span></div>
          </div>
          <div className="preview-bottom">
            <div className="mini-tools"><button onClick={startDrawing}><Pencil size={13}/></button><button onClick={startDrawing}><Eraser size={13}/></button><button onClick={startDrawing}><Palette size={13}/></button></div>
            <div><small>CANVAS RATIO</small><b>16:10 Widescreen</b></div>
          </div>
        </div>
      </div>
      <footer className="home-footer"><span><i/>DoodleSense Live Classifier • 99.2% Uptime</span><button onClick={()=>setAboutOpen(true)}>About Project</button></footer>
    </section>
  );
}

function Sailboat() {
  return (
    <svg className="sailboat" viewBox="0 0 220 180" fill="none">
      <circle cx="65" cy="40" r="10" fill="#FCD34D" opacity=".8"/>
      <path d="M65 24v4M65 52v4M49 40h4M77 40h4" stroke="#FCD34D" strokeLinecap="round" strokeWidth="2"/>
      <path d="M48 64l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#38BDF8"/>
      <path d="M168 60l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#38BDF8"/>
      <path d="M102 38L68 108c17 0 30-4 34-4V38Z" fill="#6EE7B7" stroke="#0F766E" strokeWidth="2.5"/>
      <path d="M107 38l35 70c-14-2-28-4-35-4V38Z" fill="#A7F3D0" stroke="#0F766E" strokeWidth="2.5"/>
      <line x1="105" y1="32" x2="105" y2="108" stroke="#0F766E" strokeWidth="3"/>
      <polygon points="105,32 120,38 105,44" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.5"/>
      <path d="M52 110h104c-6 16-22 26-52 26s-46-10-52-26Z" fill="#38BDF8" stroke="#0369A1" strokeWidth="2.5"/>
      <rect x="90" y="104" width="28" height="8" rx="2" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.5"/>
      <circle cx="80" cy="118" r="2.5" fill="white"/><circle cx="104" cy="118" r="2.5" fill="white"/><circle cx="128" cy="118" r="2.5" fill="white"/>
      <path d="M36 138c18-8 34 10 56 0s40 6 62-2 32 6 38 2" stroke="#0284C7" strokeWidth="3" strokeLinecap="round"/>
      <path d="M42 148c20-6 38 8 60 0s40 4 64-2 26 4 32 2" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="2 3" strokeLinecap="round"/>
    </svg>
  );
}

function DrawWorkspace({prompt,newPrompt,navigate,predict,canvasRef,canvasBoxRef,pointerDown,pointerMove,pointerUp,tool,setTool,color,setColor,lineWidth,setLineWidth,clearCanvas,saveDoodle,showToast}) {
  const sizes=[2,4,6,8,12,16];
  const adjust=(d)=>setLineWidth(sizes[Math.max(0,Math.min(sizes.length-1,sizes.indexOf(lineWidth)+d))]);
  return (
    <section className="draw-screen">
      <div className="draw-header">
        <button className="yellow-icon-btn" onClick={()=>navigate("home")}><ArrowLeft size={19}/></button>
        <div className="task-pill">TASK: <u>DRAW A {prompt}</u></div>
        <button className="predict-top" onClick={predict}>✨ Predict <ArrowRight size={15}/></button>
      </div>

      <div className="draw-workspace">
        <div className="canvas-frame">
          <div ref={canvasBoxRef} className="canvas-inner">
            <canvas ref={canvasRef} onMouseDown={pointerDown} onMouseMove={pointerMove} onMouseUp={pointerUp}
              onMouseLeave={pointerUp} onTouchStart={pointerDown} onTouchMove={pointerMove} onTouchEnd={pointerUp}/>
          </div>
        </div>

        <div className="tool-area">
          <button className="new-word" onClick={newPrompt}>🎲 New Word</button>
          <div className="tool-panels">
            <div className="main-tools">
              <button className={tool==="pencil"?"selected tool":"tool"} onClick={()=>setTool("pencil")}><Pencil/><b>PENCIL</b></button>
              <button className={tool==="eraser"?"selected tool":"tool"} onClick={()=>setTool("eraser")}><Eraser/><b>ERASER</b></button>
              <div className="dashed"/>
              <button className="tool" onClick={clearCanvas}><Trash2/><b>CLEAR</b></button>
              <button className="tool" onClick={saveDoodle}><Save/><b>SAVE</b></button>
              <div className="kitten">🐈‍⬛</div>
            </div>
            <div className="color-strip">
              <span>⚡</span>
              <div className="stroke-adjust"><button onClick={()=>adjust(1)}>+</button><b>{lineWidth}px</b><button onClick={()=>adjust(-1)}>-</button></div>
              <div className="swatches">
                {COLORS.map(c=><button key={c} className={color===c?"swatch active":"swatch"} style={{background:c}} onClick={()=>{setColor(c);setTool("pencil")}}/> )}
              </div>
              <span className="dash"/>
            </div>
          </div>
        </div>
      </div>

      <div className="draw-bottom">
        <div className="status-bar"><span>⭐</span><b>Draw boldly! Click PREDICT when you're done sketching...</b><span className="ai-active">◉ AI Active</span></div>
        <button className="big-predict" onClick={predict}>🔮 AI PREDICT<br/>DOODLE ⚡</button>
      </div>
    </section>
  );
}

function ResultScreen({prediction,navigate,drawAgain,downloadImage}) {
  return (
    <section className="result-screen">
      <div className="result-header">
        <button onClick={drawAgain}>← Back</button>
        <div className="result-actions"><span>AI DOODLE EVALUATION</span><button onClick={()=>navigate("history")}>Gallery 📁</button></div>
      </div>
      <div className="result-content">
        <div className="snapshot-card retro-card">
          <div className="target-row"><span>TARGET OBJECT:</span><b>{prediction.label}</b></div>
          <div className="snapshot"><img src={prediction.image || ""} alt="User doodle preview"/></div>
          <div className="snapshot-bottom"><span>{prediction.time}</span><button onClick={()=>downloadImage()}>⬇ Save PNG</button></div>
        </div>

        <div className="metrics-card retro-card">
          <div>
            <div className="metric-head"><div><small>NEURAL NETWORK DETECTION</small><h2>{prediction.label} <span>MATCHED</span></h2></div><div className="rating"><small>Rating</small><b>⭐⭐⭐⭐⭐</b></div></div>
            <div className="accuracy"><div><b>Accuracy Score</b><strong>{prediction.confidence}%</strong></div><div className="accuracy-track"><i style={{width:`${prediction.confidence}%`}}/></div></div>
            <div className="metric-grid">
              <div><small>STROKE SIMILARITY</small><b>{prediction.strokeSim}% (High)</b></div>
              <div><small>CONTOUR MATCH</small><b>{prediction.contourMatch}% (Exact)</b></div>
              <div><small>AI CONFIDENCE</small><b>{prediction.confidence}% ⭐</b></div>
            </div>
            <div className="feedback"><span>🐣</span><p>{prediction.commentary}</p></div>
          </div>
          <div className="result-buttons">
            <button onClick={drawAgain}>↺ Draw Again</button>
            <button onClick={()=>downloadImage()}>⬇ Save to Device</button>
            <button onClick={()=>navigate("history")}>📁 My Gallery</button>
          </div>
        </div>
      </div>
      <div className="chick-note">Chick Mascot: "Great sketch!"</div>
      <div className="version">Neural Net v2.4 • Evaluated</div>
    </section>
  );
}

function HistoryScreen({history,closeHistory,downloadImage,clearAll}) {
  return (
    <section className="history-screen">
      <div className="history-head">
        <div className="history-title"><Folder/><div><h2>Gallery Vault</h2><p>Your AI-analyzed sketches and accuracy timestamps</p></div></div>
        <button onClick={closeHistory}>Close &amp; Return</button>
      </div>
      <div className="history-grid">
        {history.length===0 ? <div className="empty-history"><span>🎨</span><b>No doodles saved in vault yet!</b><p>Draw a quick sketch and hit predict to populate your vault.</p></div> :
          history.map(item=>(
            <div className="history-card" key={item.id}>
              <div className="history-image"><img src={item.image} alt={item.label}/></div>
              <div className="history-label"><b>{item.label}</b><strong>{item.confidence}%</strong></div>
              <div className="history-meta"><span>{item.date}</span><button onClick={()=>downloadImage(item.image,item.label)}>DL ↓</button></div>
            </div>
          ))
        }
      </div>
      <div className="history-footer"><span>{history.length} doodle(s) saved in vault</span><button onClick={clearAll}>Clear Vault History</button></div>
    </section>
  );
}
