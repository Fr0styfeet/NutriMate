'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem('nm_token')) router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', top:'-200px', right:'-200px', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(110,231,183,.08) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-300px', left:'-200px', width:'700px', height:'700px', borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,.06) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="fade-up" style={{ textAlign:'center', maxWidth:'640px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', background:'rgba(110,231,183,.1)', border:'1px solid rgba(110,231,183,.25)', borderRadius:'20px', padding:'.4rem 1rem', marginBottom:'2rem' }}>
          <span style={{ color:'var(--accent)', fontSize:'.78rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' }}>✦ AI-Powered Diet Planning</span>
        </div>

        <h1 style={{ fontSize:'clamp(2.2rem,6vw,4rem)', fontWeight:900, lineHeight:1.05, letterSpacing:'-.03em', marginBottom:'1.25rem' }}>
          Eat smart,{' '}
          <span style={{ color:'var(--accent)', display:'block' }}>on a student budget.</span>
        </h1>

        <p style={{ color:'var(--text-muted)', fontSize:'1.1rem', lineHeight:1.7, marginBottom:'2.5rem' }}>
          NutriMate plans meals around your mess menu, daily budget, and fitness goals — powered by Gemini AI and saved per session.
        </p>

        <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/register"><button className="btn btn-primary" style={{ fontSize:'1rem', padding:'.8rem 2rem' }}>Get started free</button></Link>
          <Link href="/login"><button className="btn btn-ghost" style={{ fontSize:'1rem', padding:'.8rem 2rem' }}>Sign in</button></Link>
        </div>

        <div style={{ display:'flex', gap:'2rem', justifyContent:'center', marginTop:'3rem', flexWrap:'wrap' }}>
          {['🎯 Bulk / Maintain / Cut','🍱 Mess menu aware','📍 Nearby restaurants','💬 Saved chat history'].map(f => (
            <span key={f} style={{ color:'var(--text-muted)', fontSize:'.88rem' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
