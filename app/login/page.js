'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem('nm_token', data.token);
    localStorage.setItem('nm_user',  JSON.stringify(data.user));
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div className="card fade-up" style={{ width:'100%', maxWidth:'420px' }}>
        <Link href="/" style={{ color:'var(--accent)', fontSize:'.85rem', textDecoration:'none' }}>← NutriMate</Link>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginTop:'1rem', letterSpacing:'-.02em' }}>Welcome back</h1>
        <p style={{ color:'var(--text-muted)', marginTop:'.3rem', marginBottom:'1.75rem' }}>Sign in to your account</p>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.4rem' }}>Email</label>
            <input className="input" type="email" placeholder="you@college.edu" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.4rem' }}>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&submit()} />
          </div>
          {error && <p style={{ color:'var(--danger)', fontSize:'.84rem' }}>{error}</p>}
          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width:'100%', padding:'.8rem', marginTop:'.25rem' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <p style={{ textAlign:'center', marginTop:'1.5rem', color:'var(--text-muted)', fontSize:'.88rem' }}>
          No account? <Link href="/register" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
