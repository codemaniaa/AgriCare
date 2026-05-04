import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionsAPI } from '../api';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/common';
import { formatPrice } from '../utils';

const G1 = '#2d6a4f';

export default function AuctionHistoryPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await auctionsAPI.list({ status: 'ended' });
      setAuctions(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding:40, textAlign:'center' }}>
          <Spinner />
        </div>
      </>
    );
  }

  return (
    <div style={{ background:'#f8fdf9', minHeight:'100vh' }}>
      <Navbar />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:20 }}>
        <h2 style={{ fontFamily:"'Playfair Display'", marginBottom:20 }}>
          🏁 Auction History
        </h2>

        {auctions.length === 0 ? (
          <div style={{ textAlign:'center', color:'#5a7a5e' }}>
            No completed auctions yet.
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {auctions.map(a => (
              <div key={a.id}
                onClick={() => navigate(`/auctions/${a.id}`)}
                style={{
                  background:'#fff',
                  border:'1px solid #d0ebd6',
                  borderRadius:14,
                  cursor:'pointer',
                  overflow:'hidden'
                }}
              >
                {/* Image */}
                <div style={{ height:160, background:'#f0faf2' }}>
                  {a.product_image
                    ? <img src={a.product_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>🌾</div>}
                </div>

                {/* Info */}
                <div style={{ padding:14 }}>
                  <div style={{ fontWeight:600, marginBottom:6 }}>
                    {a.product_title}
                  </div>

                  <div style={{ fontSize:13, marginBottom:6 }}>
                    💰 Final Price: <strong>{formatPrice(a.current_price)}</strong>
                  </div>

                  <div style={{ fontSize:12, marginBottom:6 }}>
                    👤 Winner: <strong>{a.winner_name || 'No bids'}</strong>
                  </div>

                  <div style={{ fontSize:12, color:'#5a7a5e' }}>
                    📊 Bids: {a.total_bids}
                  </div>

                  <div style={{ fontSize:11, color:'#888', marginTop:6 }}>
                    ⏱ Ended: {new Date(a.auction_end).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}