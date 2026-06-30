'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name:'', email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    const res  = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem('nm_token', data.token);
    localStorage.setItem('nm_user',  JSON.stringify(data.user));
    router.push('/dashboard');
  };

  const fields = [
    { key:'name',     label:'Full name', type:'text',     placeholder:'Rahul Sharma' },
    { key:'email',    label:'Email',     type:'email',    placeholder:'you@college.edu' },
    { key:'password', label:'Password',  type:'password', placeholder:'8+ characters' },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div className="card fade-up" style={{ width:'100%', maxWidth:'420px' }}>
        <Link href="/" style={{ color:'var(--accent)', fontSize:'.85rem', textDecoration:'none' }}>← NutriMate</Link>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginTop:'1rem', letterSpacing:'-.02em' }}>Create account</h1>
        <p style={{ color:'var(--text-muted)', marginTop:'.3rem', marginBottom:'1.75rem' }}>Start eating smarter today</p>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.4rem' }}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&submit()} />
            </div>
          ))}
          {error && <p style={{ color:'var(--danger)', fontSize:'.84rem' }}>{error}</p>}
          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width:'100%', padding:'.8rem', marginTop:'.25rem' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </div>
        <p style={{ textAlign:'center', marginTop:'1.5rem', color:'var(--text-muted)', fontSize:'.88rem' }}>
          Already have one? <Link href="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
