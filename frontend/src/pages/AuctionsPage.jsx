import React, { useState } from 'react';
import { useAuctions } from '../hooks/useAuctions';
import Navbar from '../components/layout/Navbar';
import { formatPrice } from '../utils';

const TABS = [
  { key: 'active', label: '🔥 Live' },
  { key: 'ended', label: '🏁 Ended' },
  { key: 'scheduled', label: '⏳ Upcoming' },
];

export default function AuctionsPage() {
  const [tab, setTab] = useState('active');

  const { auctions, loading } = useAuctions({ status: tab });

  return (
    <div style={{ background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:20 }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding:'10px 18px',
                borderRadius:20,
                border:'none',
                cursor:'pointer',
                background: tab === t.key ? '#2d6a4f' : '#e9f5ec',
                color: tab === t.key ? '#fff' : '#2d6a4f',
                fontWeight:600
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div>Loading...</div>
        ) : auctions.length === 0 ? (
          <div style={{ textAlign:'center', color:'#5a7a5e' }}>
            No auctions found
          </div>
        ) : (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(4,1fr)',
            gap:16
          }}>
            {auctions.map(a => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function AuctionCard({ auction }) {
  const isEnded = auction.status === 'ended';

  return (
    <div style={{
      background:'#fff',
      border:'1px solid #d0ebd6',
      borderRadius:12,
      padding:12
    }}>
      <div style={{ fontWeight:600 }}>{auction.product_title}</div>

      <div style={{ margin:'6px 0', color:'#2d6a4f', fontWeight:700 }}>
        {formatPrice(auction.current_price)}
      </div>

      {/* STATUS */}
      <div style={{
        fontSize:11,
        padding:'4px 10px',
        borderRadius:20,
        display:'inline-block',
        background:
          auction.status === 'active' ? '#d8f3dc' :
          auction.status === 'ended' ? '#fee2e2' :
          '#fff3cd',
        color:
          auction.status === 'active' ? '#2d6a4f' :
          auction.status === 'ended' ? '#991b1b' :
          '#856404',
        fontWeight:600
      }}>
        {auction.status.toUpperCase()}
      </div>

      {/* WINNER (only ended) */}
      {isEnded && auction.winner_name && (
        <div style={{ marginTop:8, fontSize:12 }}>
          🏆 Winner: <b>{auction.winner_name}</b>
        </div>
      )}
    </div>
  );
}