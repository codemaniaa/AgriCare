import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const G1 = '#2d6a4f';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 64px)', padding:24, textAlign:'center' }}>

        {/* Illustration */}
        <div style={{ fontSize:80, marginBottom:16, lineHeight:1 }}>🌾</div>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:48, fontWeight:600, color:'#1a2e1d', marginBottom:8, lineHeight:1 }}>
          404
        </h1>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:500, color:'#2d6a4f', marginBottom:12 }}>
          Crop Not Found
        </h2>
        <p style={{ fontSize:14, color:'#5a7a5e', marginBottom:32, maxWidth:380, lineHeight:1.7 }}>
          Looks like this page has been harvested already. The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={() => navigate(-1)}
            style={{ padding:'11px 24px', border:`1.5px solid ${G1}`, borderRadius:10, background:'transparent', color:G1, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            ← Go Back
          </button>
          <Link to="/"
            style={{ padding:'11px 24px', background:G1, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
            🏠 Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
