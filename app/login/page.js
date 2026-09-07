"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Giriş başarısız.");
    }
  }

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    }}>
      <div className="panel form" style={{ 
        width: '100%', 
        maxWidth: 400, 
        padding: '40px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)',
        border: '1px solid rgba(255, 255, 255, 1)',
        borderRadius: '16px'
      }}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <div style={{fontSize: 40, marginBottom: '10px'}}>🌐</div>
          <h2 style={{marginTop: 0, marginBottom: 5, color: 'var(--text)', fontSize: 24}}>Ağ Envanteri</h2>
          <p style={{margin: 0, color: 'var(--text-dim)', fontSize: 14}}>Devam etmek için giriş yapın.</p>
        </div>
        
        {error && <div className="error-note" style={{marginBottom: 20}}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label style={{fontSize: 13, fontWeight: 500}}>E-posta Adresi</label>
            <input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="ör. admin@sirket.com"
              style={{padding: '12px 14px', fontSize: 14, background: '#f8fafc', border: '1px solid #e2e8f0'}}
              required 
            />
          </div>
          <div className="field" style={{marginTop: 16}}>
            <label style={{fontSize: 13, fontWeight: 500}}>Şifre</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={{padding: '12px 14px', fontSize: 14, background: '#f8fafc', border: '1px solid #e2e8f0'}}
              required 
            />
          </div>
          <button className="submit-btn" style={{width: '100%', marginTop: 24, padding: '12px', fontSize: 14, fontWeight: 600}}>
            Giriş Yap
          </button>
        </form>
        
        <p style={{fontSize: 13, textAlign: 'center', marginTop: 24, color: 'var(--text-dim)'}}>
          Hesabınız yok mu? <Link href="/register" style={{color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none'}}>Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
