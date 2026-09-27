import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase, supabaseConfigured } from "./lib/supabase";
import type { Profile } from "./types";
import {
  BookOpen, Car, ClipboardCheck, BarChart3, LogIn, UserPlus, Menu, X,
  LogOut, Shield, Clock3, ChevronRight
} from "lucide-react";

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabaseConfigured) { setLoading(false); return; }
      const { data } = await supabase.auth.getSession();
      if (data.session && mounted) await loadProfile(data.session.user.id);
      if (mounted) setLoading(false);
    }
    async function loadProfile(userId: string) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data && mounted) setProfile(data as Profile);
    }
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) setProfile(null);
      else await loadProfile(session.user.id);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  if (loading) return <Splash />;

  return (
    <Routes>
      <Route path="/" element={<Home profile={profile} />} />
      <Route path="/entrar" element={<Auth mode="login" setProfile={setProfile} />} />
      <Route path="/criar-conta" element={<Auth mode="signup" setProfile={setProfile} />} />
      <Route path="/app" element={<Protected profile={profile}><Dashboard profile={profile!} /></Protected>} />
      <Route path="/simulados" element={<Protected profile={profile}><Exams /></Protected>} />
      <Route path="/simulado/:categoryId" element={<Protected profile={profile}><Exam /></Protected>} />
      <Route path="/desempenho" element={<Protected profile={profile}><Performance /></Protected>} />
      <Route path="/admin" element={<Protected profile={profile} adminOnly><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Splash() {
  return <div className="splash"><div className="logo-mark">B</div><strong>EU TENHO BIZÚ</strong><span>Carregando...</span></div>;
}

function Layout({ children, profile }: { children: React.ReactNode; profile?: Profile | null }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  async function logout() { await supabase.auth.signOut(); navigate("/"); }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand"><span className="brand-icon">B</span><span>EU TENHO BIZÚ</span></Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X/> : <Menu/>}</button>
        <nav className={open ? "nav open" : "nav"}>
          {profile ? <>
            <Link onClick={() => setOpen(false)} to="/app">Início</Link>
            <Link onClick={() => setOpen(false)} to="/simulados">Simulados</Link>
            <Link onClick={() => setOpen(false)} to="/desempenho">Desempenho</Link>
            <Link onClick={() => setOpen(false)} to="/admin">Admin</Link>
            <button className="nav-logout" onClick={logout}><LogOut size={17}/> Sair</button>
          </> : <>
            <Link to="/entrar">Entrar</Link>
            <Link className="nav-cta" to="/criar-conta">Criar conta</Link>
          </>}
        </nav>
      </header>
      <main>{children}</main>
      <footer>© {new Date().getFullYear()} EU TENHO BIZÚ · Estude. Pratique. Passe.</footer>
    </div>
  );
}

function Home({ profile }: { profile: Profile | null }) {
  return <Layout profile={profile}>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">CONCURSOS & DETRAN</span>
        <h1>Estude.<br/><em>Pratique.</em><br/>Passe.</h1>
        <p>Simulados, questões e desempenho em uma plataforma feita para estudar no computador ou no celular.</p>
        <div className="hero-actions">
          <Link className="btn primary" to={profile ? "/app" : "/criar-conta"}>{profile ? "Ir para minha área" : "Criar conta grátis"} <ChevronRight/></Link>
          <Link className="btn ghost" to="/entrar">Já tenho conta</Link>
        </div>
      </div>
      <div className="hero-card">
        <div className="mini-stat"><BookOpen/><strong>Questões</strong><span>Banco organizado por matéria</span></div>
        <div className="mini-stat"><ClipboardCheck/><strong>Simulados</strong><span>Faça no seu ritmo ou com cronômetro</span></div>
        <div className="mini-stat"><BarChart3/><strong>Desempenho</strong><span>Acompanhe acertos e evolução</span></div>
      </div>
    </section>
    <section className="section">
      <div className="section-title"><span className="eyebrow">DUAS FRENTES</span><h2>Estude o que você precisa.</h2></div>
      <div className="feature-grid">
        <div className="feature"><Shield/><h3>Concursos</h3><p>Estruture matérias por edital e pratique com questões originais.</p></div>
        <div className="feature"><Car/><h3>DETRAN</h3><p>Primeira habilitação com legislação, sinalização e direção defensiva.</p></div>
      </div>
    </section>
  </Layout>;
}

function Auth({ mode, setProfile }: { mode: "login"|"signup"; setProfile: (p: Profile|null)=>void }) {
  const navigate = useNavigate();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [phone,setPhone]=useState("");
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [ok,setOk]=useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setOk("");
    if (!supabaseConfigured) { setError("Configure o Supabase no arquivo .env antes de usar o login."); setBusy(false); return; }
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options:{data:{full_name:name, phone}}});
      if (error) setError(error.message);
      else if (data.user) {
        setOk("Conta criada. Se a confirmação de e-mail estiver ativa, confirme seu e-mail para entrar.");
        if (data.session) navigate("/app");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({email,password});
      if (error) setError(error.message);
      else if (data.user) navigate("/app");
    }
    setBusy(false);
  }
  return <Layout>
    <div className="auth-wrap"><form className="auth-card" onSubmit={submit}>
      <span className="eyebrow">{mode === "login" ? "ACESSO DO ALUNO" : "COMECE AGORA"}</span>
      <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      {mode==="signup" && <input placeholder="Nome completo" value={name} onChange={e=>setName(e.target.value)} required/>}
      {mode==="signup" && <input placeholder="WhatsApp (opcional)" value={phone} onChange={e=>setPhone(e.target.value)}/>}
      <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/>
      {error && <div className="alert error">{error}</div>}{ok && <div className="alert ok">{ok}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? "Aguarde..." : mode==="login" ? <><LogIn/> Entrar</> : <><UserPlus/> Criar conta</>}</button>
      <p className="switch">{mode==="login" ? <>Ainda não tem conta? <Link to="/criar-conta">Criar agora</Link></> : <>Já possui conta? <Link to="/entrar">Entrar</Link></>}</p>
    </form></div>
  </Layout>;
}

function Protected({ profile, children, adminOnly=false }: { profile: Profile|null; children: React.ReactNode; adminOnly?:boolean }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!profile) {
      setIsAdmin(false);
      return;
    }
    supabase.from("user_roles").select("role").eq("user_id", profile.id).eq("role", "admin").maybeSingle().then(({ data }) => {
      if (mounted) setIsAdmin(Boolean(data));
    });
    return () => { mounted = false; };
  }, [profile]);

  if (!profile) return <Navigate to="/entrar" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/app" replace />;
  return <Layout profile={profile}>{children}</Layout>;
}

function Dashboard({profile}:{profile:Profile}) {
  const [categories,setCategories]=useState<any[]>([]);
  useEffect(()=>{ supabase.from("categories").select("*").eq("is_active",true).order("kind").then(({data})=>setCategories(data||[])); },[]);
  const concursos=categories.filter(c=>c.kind==="concurso"), detran=categories.filter(c=>c.kind==="detran");
  return <div className="dashboard container">
    <div className="welcome"><div><span className="eyebrow">ÁREA DO ALUNO</span><h1>Olá, {profile.full_name?.split(" ")[0] || "aluno"}.</h1><p>Escolha uma categoria e comece a praticar.</p></div></div>
    <CategorySection title="Concursos" items={concursos} icon={<Shield/>} empty="Nenhum concurso cadastrado ainda." />
    <CategorySection title="DETRAN" items={detran} icon={<Car/>} empty="Nenhuma categoria do DETRAN cadastrada ainda." />
    {categories.length===0 && <div className="alert">O banco ainda não possui categorias. O administrador poderá cadastrá-las no painel.</div>}
  </div>;
}

function CategorySection({title,items,icon,empty}:{title:string;items:any[];icon:React.ReactNode;empty:string}) {
  return <section className="dash-section"><div className="dash-heading">{<span className="section-icon">{icon}</span>}<h2>{title}</h2></div>
    {items.length ? <div className="category-grid">{items.map(c=><Link className="category-card" to={`/simulado/${c.id}`} key={c.id}><span>{c.name}</span><small>{c.description || "Praticar questões"}</small><ChevronRight/></Link>)}</div> : <div className="muted-box">{empty}</div>}
  </section>;
}

function Exams() {
  const [categories,setCategories]=useState<any[]>([]);
  useEffect(()=>{supabase.from("categories").select("*").eq("is_active",true).order("name").then(({data})=>setCategories(data||[]));},[]);
  return <div className="container page"><span className="eyebrow">PRÁTICA</span><h1>Simulados</h1><p className="lead">Escolha uma categoria.</p><div className="category-grid">{categories.map(c=><Link className="category-card" to={`/simulado/${c.id}`} key={c.id}><span>{c.name}</span><small>{c.kind==="detran"?"DETRAN":"CONCURSO"}</small><ChevronRight/></Link>)}</div></div>;
}

function Exam() {
  const { pathname } = useLocation(); const categoryId = pathname.split("/").pop()!;
  const [category,setCategory]=useState<any>(); const [questions,setQuestions]=useState<any[]>([]);
  const [index,setIndex]=useState(0); const [answers,setAnswers]=useState<Record<string,string>>({}); const [done,setDone]=useState(false); const [score,setScore]=useState(0);
  useEffect(()=>{ (async()=>{ const {data:c}=await supabase.from("categories").select("*").eq("id",categoryId).single(); setCategory(c); const {data:q}=await supabase.from("questions").select("*").limit(20); setQuestions(q||[]); })(); },[categoryId]);
  if (!questions.length) return <div className="container page"><span className="eyebrow">SIMULADO</span><h1>{category?.name || "Carregando..."}</h1><div className="muted-box">Ainda não há questões cadastradas para este simulado.</div></div>;
  if (done) return <Result score={score} total={questions.length}/>;
  const q=questions[index]; const options=[["A",q.option_a],["B",q.option_b],["C",q.option_c],["D",q.option_d],["E",q.option_e]];
  function finish(){ const s=questions.reduce((n,x)=>n+(answers[x.id]===x.correct_option?1:0),0); setScore(s); setDone(true); }
  return <div className="container exam"><div className="exam-top"><div><span className="eyebrow">{category?.name}</span><h1>Questão {index+1} de {questions.length}</h1></div><div className="progress"><span style={{width:`${((index+1)/questions.length)*100}%`}}/></div></div>
    <div className="question-card"><p className="statement">{q.statement}</p><div className="options">{options.map(([letter,text])=><button key={letter} className={answers[q.id]===letter?"option selected":"option"} onClick={()=>setAnswers({...answers,[q.id]:letter})}><b>{letter}</b><span>{text}</span></button>)}</div>
      <div className="exam-actions">{index>0 && <button className="btn ghost" onClick={()=>setIndex(index-1)}>Anterior</button>}{index<questions.length-1 ? <button className="btn primary" onClick={()=>setIndex(index+1)}>Próxima</button> : <button className="btn primary" onClick={finish}>Finalizar</button>}</div>
    </div></div>;
}

function Result({score,total}:{score:number;total:number}) {
  return <div className="container result"><span className="eyebrow">RESULTADO</span><h1>Simulado finalizado.</h1><div className="result-number">{score}<small>/{total}</small></div><p>Você acertou {Math.round(score/total*100)}% das questões.</p><div className="hero-actions"><Link className="btn primary" to="/simulados">Novo simulado</Link><Link className="btn ghost" to="/app">Voltar à área</Link></div></div>;
}

function Performance(){ return <div className="container page"><span className="eyebrow">SEU DESEMPENHO</span><h1>Desempenho</h1><div className="muted-box">O histórico detalhado será exibido aqui conforme os simulados forem realizados.</div></div>; }

function Admin(){
  const [cats,setCats]=useState<any[]>([]); const [name,setName]=useState(""); const [kind,setKind]=useState<"concurso"|"detran">("concurso");
  async function refresh(){const {data}=await supabase.from("categories").select("*").order("name");setCats(data||[]);}
  useEffect(()=>{refresh()},[]);
  async function add(){if(!name.trim())return; await supabase.from("categories").insert({name:name.trim(),kind,is_active:true});setName("");refresh();}
  return <div className="container page"><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Painel administrativo</h1>
    <div className="admin-form"><input placeholder="Nome da categoria" value={name} onChange={e=>setName(e.target.value)}/><select value={kind} onChange={e=>setKind(e.target.value as "concurso"|"detran")}><option value="concurso">Concurso</option><option value="detran">DETRAN</option></select><button className="btn primary" onClick={add}>Adicionar</button></div>
    <div className="admin-list">{cats.map(c=><div className="admin-row" key={c.id}><span><strong>{c.name}</strong><small>{c.kind}</small></span><span>{c.is_active?"Ativa":"Inativa"}</span></div>)}</div>
  </div>;
}

export default App;