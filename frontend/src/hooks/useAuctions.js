import { useState, useEffect, useCallback, useRef } from 'react';
import { auctionsAPI } from '../api';

const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

/* ── useAuctions — paginated list ──────────────────────*/
export function useAuctions(params = {}) {
  const [auctions, setAuctions] = useState([]);
  const [count,    setCount]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const { data } = await auctionsAPI.list(p);
      setAuctions(data.results || data);
      setCount(data.count || (data.results || data).length);
    } catch { setError('Failed to load auctions.'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);
  return { auctions, count, loading, error, refetch: fetch };
}

/* ── useAuction — single auction detail ───────────────*/
export function useAuction(id) {
  const [auction,  setAuction]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await auctionsAPI.detail(id);
      setAuction(data);
    } catch { setError('Auction not found.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { auction, loading, error, setAuction, refetch: fetch };
}

/* ── useAuctionWS — real-time WebSocket ────────────────
   Connects to ws://host/ws/auction/<id>/
   Updates auction state on every incoming bid broadcast.
*/
export function useAuctionWS(auctionId, onBidUpdate, onAuctionEnd) {
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const [connected,  setConnected]  = useState(false);
  const [lastBid,    setLastBid]    = useState(null);

  const connect = useCallback(() => {
    if (!auctionId) return;
    const url = `${WS_BASE}/ws/auction/${auctionId}/`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }

      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);

      ws._pingInterval = ping;
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // 🔨 Bid update
        if (data.type === 'bid_update') {
          setLastBid(data);
          onBidUpdate && onBidUpdate(data);
        }

        // 🏁 Auction ended
        if (data.type === 'AUCTION_ENDED') {
          onAuctionEnd && onAuctionEnd(data);
        }

      } catch {}
    };

    ws.onclose = (e) => {
      setConnected(false);
      if (ws._pingInterval) clearInterval(ws._pingInterval);

      if (![1000, 4004].includes(e.code)) {
        reconnectRef.current = setTimeout(connect, 4000);
      }
    };

    ws.onerror = () => ws.close();

  }, [auctionId, onBidUpdate, onAuctionEnd]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close(1000, 'unmount');
    };
  }, [connect]);

  return { connected, lastBid };
}

/* ── useCountdown — live countdown timer ─────────────*/
export function useCountdown(endTimeStr) {
  const calc = () => {
    if (!endTimeStr) return { h:0, m:0, s:0, total:0, expired:true };
    const diff = Math.max(0, new Date(endTimeStr) - Date.now());
    const total = Math.floor(diff / 1000);
    return {
      h:       Math.floor(total / 3600),
      m:       Math.floor((total % 3600) / 60),
      s:       total % 60,
      total,
      expired: total <= 0,
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!endTimeStr) return;
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimeStr]);

  return time;
}
