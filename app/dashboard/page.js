'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DAYS  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const MEALS = ['breakfast','lunch','dinner'];

const GOAL_INFO = {
  bulk:     { label:'Bulk 💪',         desc:'Gain muscle & strength',    color:'var(--accent-orange)' },
  maintain: { label:'Maintain ⚖️',     desc:'Stay balanced & healthy',   color:'var(--accent)' },
  lose:     { label:'Lose Weight 🔥',  desc:'Burn fat, keep muscle',     color:'var(--accent-purple)' },
};

// ─── PlanCard ────────────────────────────────────────────────────────────────
function PlanCard({ data }) {
  const sections = [
    { key:'restaurantOptions', icon:'🍽️', title:'Restaurant Food Options',    color:'var(--accent-orange)' },
    { key:'diyOptions',        icon:'🥘', title:'DIY Cook Yourself Options',  color:'var(--accent)' },
    { key:'snackingOptions',   icon:'🥜', title:'Healthy Snacking Options',   color:'var(--accent-purple)' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {data.summary && (
        <div style={{ background:'rgba(110,231,183,.08)', border:'1px solid rgba(110,231,183,.2)', borderRadius:'14px', padding:'1rem' }}>
          <p style={{ fontSize:'.9rem', fontWeight:600, color:'var(--accent)' }}>📋 {data.summary}</p>
        </div>
      )}
      {sections.map(({ key, icon, title, color }) => {
        const items = data[key];
        if (!items?.length) return null;
        return (
          <div key={key} className="card" style={{ padding:'1.25rem' }}>
            <h4 style={{ fontSize:'.75rem', fontWeight:700, color, marginBottom:'.9rem', letterSpacing:'.05em', textTransform:'uppercase' }}>{icon} {title}</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{ background:'var(--surface-2)', borderRadius:'10px', padding:'.85rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.3rem', gap:'.5rem' }}>
                    <span style={{ fontWeight:700, fontSize:'.92rem' }}>{item.name}</span>
                    <div style={{ display:'flex', gap:'.35rem', flexShrink:0 }}>
                      {item.cost     && <span className="tag tag-green">💰 {item.cost}</span>}
                      {item.calories && <span className="tag tag-orange">🔥 {item.calories}</span>}
                    </div>
                  </div>
                  {item.from        && <p style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:'.2rem' }}>📍 {item.from}</p>}
                  {item.ingredients && <p style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:'.2rem' }}>🛒 {item.ingredients}</p>}
                  {item.prep        && <p style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:'.2rem' }}>⏱ {item.prep}</p>}
                  {item.why         && <p style={{ fontSize:'.78rem', color, marginTop:'.3rem', fontWeight:600 }}>✓ {item.why}</p>}
                  {item.benefit     && <p style={{ fontSize:'.78rem', color, marginTop:'.3rem', fontWeight:600 }}>✓ {item.benefit}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {data.dailyTip && (
        <div style={{ background:'rgba(167,139,250,.08)', border:'1px solid rgba(167,139,250,.2)', borderRadius:'12px', padding:'1rem' }}>
          <p style={{ fontSize:'.84rem', color:'var(--accent-purple)', fontWeight:600 }}>💡 Tip: {data.dailyTip}</p>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [token, setToken]   = useState('');
  const [user, setUser]     = useState(null);
  const [activeTab, setTab] = useState('setup');

  // Setup form state
  const [dietGoal,       setDietGoal]       = useState('maintain');
  const [dailyBudget,    setDailyBudget]    = useState('');
  const [monthlyBudget,  setMonthlyBudget]  = useState('');
  const [messMenu,       setMessMenu]       = useState('');
  const [skipRules,      setSkipRules]      = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);

  // Chat state
  const [sessions,       setSessions]       = useState([]);
  const [activeSession,  setActiveSession]  = useState(null); // full session object
  const [messages,       setMessages]       = useState([]);
  const [chatInput,      setChatInput]      = useState('');
  const [chatLoading,    setChatLoading]    = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const messagesEndRef = useRef(null);

  // Restaurants state
  const [restaurants,    setRestaurants]    = useState([]);
  const [restLoading,    setRestLoading]    = useState(false);
  const [locationCity,   setLocationCity]   = useState('');
  const [locError,       setLocError]       = useState('');

  // ── Bootstrap ──
  useEffect(() => {
    const t = localStorage.getItem('nm_token');
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    const cached = localStorage.getItem('nm_user');
    if (cached) {
      const u = JSON.parse(cached);
      applyUser(u);
    }
    fetch('/api/profile', { headers:{ Authorization:`Bearer ${t}` } })
      .then(r => r.json()).then(d => { if (d.user) { applyUser(d.user); localStorage.setItem('nm_user', JSON.stringify(d.user)); } });
  }, [router]);

  function applyUser(u) {
    setUser(u);
    setDietGoal(u.dietGoal || 'maintain');
    setDailyBudget(u.dailyBudget?.toString() || '');
    setMonthlyBudget(u.monthlyBudget?.toString() || '');
    setMessMenu(u.messMenu || '');
    setSkipRules(u.skipRules || []);
  }

  // ── Load sessions when switching to plan tab ──
  useEffect(() => {
    if (activeTab === 'plan' && token) loadSessions();
  }, [activeTab, token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    const res  = await fetch('/api/chat-history', { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    setSessions(data.sessions || []);
    setSessionsLoading(false);
  };

  const openSession = async (sessionId) => {
    const res  = await fetch(`/api/chat-history/${sessionId}`, { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.session) {
      setActiveSession(data.session);
      setMessages(data.session.messages || []);
    }
  };

  const newChat = async () => {
    const res  = await fetch('/api/chat-history', { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (data.session) {
      setSessions(prev => [data.session, ...prev]);
      setActiveSession(data.session);
      setMessages([]);
    }
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    await fetch(`/api/chat-history/${sessionId}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
    setSessions(prev => prev.filter(s => s._id !== sessionId));
    if (activeSession?._id === sessionId) { setActiveSession(null); setMessages([]); }
  };

  const sendMessage = async (text) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    setChatInput('');
    setMessages(prev => [...prev, { role:'user', content:msg }]);
    setChatLoading(true);

    const res  = await fetch('/api/diet-plan', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ message:msg, sessionId: activeSession?._id }),
    });
    const data = await res.json();
    setChatLoading(false);

    if (data.response) {
      setMessages(prev => [...prev, { role:'assistant', content: data.response.message || '', planData: data.response }]);
      // If session just created, update sidebar
      if (data.sessionId && !activeSession) {
        setActiveSession({ _id: data.sessionId });
        await loadSessions();
      } else {
        // Update title in sidebar
        loadSessions();
      }
    }
  };

  // ── Setup helpers ──
  const toggleSkip = (day, meal) => {
    setSkipRules(prev => {
      const exists = prev.find(r => r.day===day && r.meal===meal);
      return exists ? prev.filter(r => !(r.day===day && r.meal===meal)) : [...prev, {day, meal}];
    });
  };
  const isSkipped = (day, meal) => skipRules.some(r => r.day===day && r.meal===meal);

  const saveProfile = async () => {
    setSaving(true);
    const res  = await fetch('/api/profile', {
      method:'PUT',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ dietGoal, dailyBudget: dailyBudget ? Number(dailyBudget):null, monthlyBudget: monthlyBudget ? Number(monthlyBudget):null, messMenu, skipRules }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.user) { setUser(data.user); localStorage.setItem('nm_user', JSON.stringify(data.user)); setSaved(true); setTimeout(()=>setSaved(false),2200); }
  };

  // ── Restaurants ──
  const getLocation = () => {
    setLocError(''); setRestLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      try {
        const geoRes  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const geoData = await geoRes.json();
        const city    = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'your area';
        setLocationCity(city);
        await fetch('/api/profile', { method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ location:{ lat, lng, city } }) });
        const restRes  = await fetch(`/api/restaurants?lat=${lat}&lng=${lng}&radius=2000`);
        const restData = await restRes.json();
        setRestaurants(restData.restaurants || []);
      } catch { setLocError('Failed to fetch location data'); }
      setRestLoading(false);
    }, () => { setLocError('Location permission denied'); setRestLoading(false); });
  };

  const logout = () => { localStorage.clear(); router.replace('/login'); };

  if (!user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--text-muted)' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* ── Header ── */}
      <header style={{ height:'58px', borderBottom:'1px solid var(--border)', padding:'0 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(15,17,23,.92)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          <span style={{ fontSize:'1.25rem', fontWeight:900, letterSpacing:'-.03em', color:'var(--accent)' }}>NutriMate</span>
          <span className="tag tag-green">{GOAL_INFO[dietGoal]?.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          <span style={{ color:'var(--text-muted)', fontSize:'.88rem' }}>Hi, {user.name?.split(' ')[0]} 👋</span>
          <button className="btn btn-ghost" onClick={logout} style={{ padding:'.35rem .9rem', fontSize:'.82rem' }}>Logout</button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div style={{ borderBottom:'1px solid var(--border)', padding:'0 1.25rem', display:'flex' }}>
        {[['setup','⚙️ Setup'],['plan','💬 Diet Plan'],['restaurants','📍 Nearby']].map(([tab, label]) => (
          <button key={tab} onClick={()=>setTab(tab)} style={{ padding:'.85rem 1.25rem', background:'none', border:'none', cursor:'pointer', fontSize:'.88rem', fontWeight:600, color: activeTab===tab ? 'var(--accent)':'var(--text-muted)', borderBottom: activeTab===tab ? '2px solid var(--accent)':'2px solid transparent', transition:'all .2s' }}>
            {label}
          </button>
        ))}
      </div>

      <main style={{ flex:1, overflow:'hidden', display:'flex' }}>

        {/* ════════════ SETUP TAB ════════════ */}
        {activeTab === 'setup' && (
          <div className="fade-up" style={{ flex:1, padding:'1.5rem', overflowY:'auto', maxWidth:'1100px', width:'100%', margin:'0 auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:'1.25rem' }}>

              {/* Diet Goal */}
              <div className="card">
                <h2 style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'.9rem' }}>Your Goal</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                  {Object.entries(GOAL_INFO).map(([key, info]) => (
                    <button key={key} onClick={()=>setDietGoal(key)} style={{ background: dietGoal===key ? `rgba(${key==='bulk'?'251,146,60':key==='maintain'?'110,231,183':'167,139,250'},.1)`:'var(--surface-2)', border:`1px solid ${dietGoal===key ? info.color:'var(--border)'}`, borderRadius:'12px', padding:'.85rem 1rem', cursor:'pointer', textAlign:'left', transition:'all .2s' }}>
                      <div style={{ fontWeight:700, color: dietGoal===key ? info.color:'var(--text)' }}>{info.label}</div>
                      <div style={{ fontSize:'.78rem', color:'var(--text-muted)', marginTop:'.2rem' }}>{info.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="card">
                <h2 style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'.9rem' }}>Budget</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.4rem' }}>Daily budget (₹)</label>
                    <input className="input" type="number" placeholder="e.g. 150" value={dailyBudget} onChange={e=>setDailyBudget(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.4rem' }}>Monthly budget (₹)</label>
                    <input className="input" type="number" placeholder="e.g. 3000" value={monthlyBudget} onChange={e=>setMonthlyBudget(e.target.value)} />
                  </div>
                  {(dailyBudget || monthlyBudget) && (
                    <div style={{ background:'var(--surface-2)', borderRadius:'10px', padding:'.7rem', fontSize:'.82rem', color:'var(--text-muted)' }}>
                      Per meal ≈ ₹{dailyBudget ? Math.round(Number(dailyBudget)/3) : Math.round(Number(monthlyBudget)/90)}
                    </div>
                  )}
                </div>
              </div>

              {/* Mess Menu */}
              <div className="card">
                <h2 style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'.5rem' }}>Mess Menu</h2>
                <p style={{ fontSize:'.8rem', color:'var(--text-muted)', marginBottom:'.75rem' }}>Paste your hostel mess weekly menu. AI uses this to suggest mess items first.</p>
                <textarea className="input" rows={7} placeholder={'Monday:\n  Breakfast: Poha, Chai\n  Lunch: Dal, Rice, Sabji\n  Dinner: Roti, Paneer\n\nTuesday:\n  ...'} value={messMenu} onChange={e=>setMessMenu(e.target.value)} style={{ resize:'vertical', fontFamily:'monospace', fontSize:'.82rem' }} />
              </div>

              {/* Skip Schedule */}
              <div className="card" style={{ gridColumn:'1 / -1' }}>
                <h2 style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'.4rem' }}>Meal Skip Schedule</h2>
                <p style={{ fontSize:'.8rem', color:'var(--text-muted)', marginBottom:'1.1rem' }}>Mark meals you regularly skip — AI won't plan those.</p>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ borderCollapse:'separate', borderSpacing:'5px' }}>
                    <thead>
                      <tr>
                        <th style={{ width:'60px' }}></th>
                        {MEALS.map(m => <th key={m} style={{ color:'var(--text-muted)', fontWeight:600, fontSize:'.78rem', padding:'.35rem .5rem', textAlign:'center', textTransform:'capitalize', minWidth:'70px' }}>{m}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => (
                        <tr key={day}>
                          <td style={{ color:'var(--text-muted)', fontSize:'.8rem', fontWeight:600, padding:'.35rem .5rem', textTransform:'capitalize' }}>{day.slice(0,3)}</td>
                          {MEALS.map(meal => {
                            const sk = isSkipped(day, meal);
                            return (
                              <td key={meal} style={{ padding:'.35rem .5rem', textAlign:'center' }}>
                                <button onClick={()=>toggleSkip(day, meal)} style={{ width:'58px', height:'32px', borderRadius:'8px', border:`1px solid ${sk?'var(--danger)':'var(--border)'}`, background: sk?'rgba(248,113,113,.1)':'var(--surface-2)', cursor:'pointer', fontSize:'.72rem', color: sk?'var(--danger)':'var(--text-dim)', fontWeight:700, transition:'all .15s' }}>
                                  {sk ? 'skip' : '✓'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save */}
              <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:'.75rem', alignItems:'center' }}>
                {saved && <span style={{ color:'var(--accent)', fontSize:'.88rem', fontWeight:600 }}>✓ Saved!</span>}
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ padding:'.7rem 2rem' }}>
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PLAN TAB ════════════ */}
        {activeTab === 'plan' && (
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

            {/* Sidebar */}
            <div style={{ width: sidebarOpen ? '260px':'0', minWidth: sidebarOpen ? '260px':'0', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden', transition:'width .25s, min-width .25s', background:'var(--surface)' }}>
              <div style={{ padding:'.9rem', display:'flex', gap:'.5rem' }}>
                <button className="btn btn-primary" onClick={newChat} style={{ flex:1, fontSize:'.82rem', padding:'.55rem' }}>+ New chat</button>
                <button className="btn btn-ghost" onClick={()=>setSidebarOpen(false)} style={{ padding:'.55rem .7rem', fontSize:'.85rem' }}>←</button>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'0 .6rem .6rem' }}>
                {sessionsLoading ? (
                  [1,2,3].map(n => <div key={n} className="skeleton" style={{ height:'42px', marginBottom:'.4rem' }} />)
                ) : sessions.length === 0 ? (
                  <p style={{ color:'var(--text-dim)', fontSize:'.8rem', padding:'.5rem', textAlign:'center' }}>No chats yet</p>
                ) : sessions.map(s => (
                  <div key={s._id} onClick={()=>openSession(s._id)} style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.55rem .65rem', borderRadius:'9px', cursor:'pointer', background: activeSession?._id===s._id ? 'var(--surface-2)':'transparent', marginBottom:'.25rem', transition:'background .15s' }}
                    onMouseEnter={e=>{ if(activeSession?._id!==s._id) e.currentTarget.style.background='rgba(255,255,255,.04)'; }}
                    onMouseLeave={e=>{ if(activeSession?._id!==s._id) e.currentTarget.style.background='transparent'; }}>
                    <span style={{ fontSize:'.82rem', color:'var(--text-muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>💬 {s.title}</span>
                    <button onClick={e=>deleteSession(e,s._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:'.75rem', padding:'2px 4px', borderRadius:'4px', flexShrink:0 }} title="Delete">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Chat toolbar */}
              <div style={{ padding:'.6rem 1rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'.75rem' }}>
                {!sidebarOpen && <button className="btn btn-ghost" onClick={()=>setSidebarOpen(true)} style={{ padding:'.4rem .7rem', fontSize:'.85rem' }}>☰</button>}
                <span style={{ color:'var(--text-muted)', fontSize:'.85rem' }}>
                  {activeSession ? `Session: ${sessions.find(s=>s._id===activeSession._id)?.title || 'Chat'}` : 'Select or start a new chat'}
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'1.25rem' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign:'center', paddingTop:'3rem' }} className="fade-up">
                    <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>🥗</div>
                    <h3 style={{ fontSize:'1.2rem', fontWeight:700, marginBottom:'.6rem' }}>Ask NutriMate anything</h3>
                    <p style={{ color:'var(--text-muted)', fontSize:'.9rem', marginBottom:'1.75rem', maxWidth:'380px', margin:'0 auto 1.75rem' }}>Get AI-powered diet suggestions based on your mess menu, budget, and {dietGoal} goal.</p>
                    <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', justifyContent:'center' }}>
                      {["Plan today's meals","High-protein breakfast ideas","Budget snacks under ₹30","How to hit protein target?"].map(q => (
                        <button key={q} className="btn btn-ghost" onClick={()=>sendMessage(q)} style={{ fontSize:'.82rem' }}>{q}</button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom:'1.25rem', display:'flex', flexDirection:'column', alignItems: msg.role==='user' ? 'flex-end':'flex-start' }}>
                    {msg.role === 'user' ? (
                      <div style={{ background:'var(--accent)', color:'#0f1117', padding:'.65rem 1rem', borderRadius:'16px 16px 4px 16px', maxWidth:'72%', fontWeight:600, fontSize:'.9rem' }}>
                        {msg.content}
                      </div>
                    ) : (
                      <div style={{ maxWidth:'100%', width:'100%' }}>
                        {msg.planData?.type === 'plan' ? (
                          <PlanCard data={msg.planData} />
                        ) : (
                          <div className="card" style={{ borderRadius:'16px 16px 16px 4px', padding:'1rem' }}>
                            <p style={{ fontSize:'.9rem', lineHeight:1.7 }}>{msg.planData?.message || msg.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ display:'flex', gap:'6px', alignItems:'center', padding:'.5rem 0' }}>
                    {[0,1,2].map(n => (
                      <div key={n} className="dot-blink" style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)', animationDelay:`${n*0.18}s` }} />
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{ padding:'.9rem 1.25rem', borderTop:'1px solid var(--border)', display:'flex', gap:'.65rem' }}>
                <input className="input" placeholder="Ask about meals, nutrition, budget…" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()} />
                <button className="btn btn-primary" onClick={()=>sendMessage()} disabled={chatLoading||!chatInput.trim()} style={{ whiteSpace:'nowrap', padding:'.65rem 1.1rem' }}>Send ↑</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ RESTAURANTS TAB ════════════ */}
        {activeTab === 'restaurants' && (
          <div className="fade-up" style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
            <h2 style={{ fontSize:'1.25rem', fontWeight:800, marginBottom:'.4rem' }}>Nearby Food Options</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'.9rem', marginBottom:'1.1rem' }}>Find restaurants and cafes near you using OpenStreetMap — no API key needed.</p>
            {locError && <p style={{ color:'var(--danger)', fontSize:'.84rem', marginBottom:'.75rem' }}>{locError}</p>}
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
              <button className="btn btn-primary" onClick={getLocation} disabled={restLoading}>
                {restLoading ? '🔍 Searching…' : '📍 Use my location'}
              </button>
              {locationCity && <span style={{ color:'var(--text-muted)', fontSize:'.88rem' }}>Showing results near <strong style={{ color:'var(--text)' }}>{locationCity}</strong></span>}
            </div>

            {restLoading && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1rem' }}>
                {[1,2,3,4,5,6].map(n => <div key={n} className="skeleton" style={{ height:'130px' }} />)}
              </div>
            )}

            {!restLoading && restaurants.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1rem' }}>
                {restaurants.map(r => (
                  <div key={r.id} className="card card-hover">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.4rem' }}>
                      <h3 style={{ fontWeight:700, fontSize:'.95rem', flex:1, paddingRight:'.5rem' }}>{r.name}</h3>
                      <span className="tag tag-green">{r.distance < 1000 ? `${r.distance}m` : `${(r.distance/1000).toFixed(1)}km`}</span>
                    </div>
                    <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', marginBottom:'.4rem' }}>
                      <span className="tag tag-orange">{r.type}</span>
                      {r.cuisine && <span className="tag tag-purple">{r.cuisine}</span>}
                    </div>
                    {r.address && <p style={{ fontSize:'.76rem', color:'var(--text-muted)', marginTop:'.35rem' }}>📍 {r.address}</p>}
                    {r.openingHours && <p style={{ fontSize:'.76rem', color:'var(--text-muted)', marginTop:'.2rem' }}>🕐 {r.openingHours}</p>}
                    <a href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}&zoom=17`} target="_blank" rel="noreferrer"
                      style={{ display:'inline-block', marginTop:'.65rem', fontSize:'.78rem', color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>
                      View on map →
                    </a>
                  </div>
                ))}
              </div>
            )}

            {!restLoading && restaurants.length === 0 && locationCity && (
              <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
                <p style={{ fontSize:'2rem', marginBottom:'.5rem' }}>😔</p>
                <p>No named places found within 2km. OSM coverage may be limited here.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
