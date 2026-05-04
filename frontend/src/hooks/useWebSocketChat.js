import { useEffect, useRef, useCallback, useState } from 'react';

const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export function useWebSocketChat(conversationId, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Not authenticated.');
      return;
    }

    // 🔥 IMPORTANT: close old socket before new one
    if (wsRef.current) {
      wsRef.current.close(1000, 'Switching conversation');
      wsRef.current = null;
    }

    const url = `${WS_BASE}/ws/chat/${conversationId}/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS Connected:", conversationId);
      setConnected(true);
      setError(null);

      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage && onMessage(data);
      } catch {
        console.warn('WS parse error', event.data);
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WS Closed:", conversationId);
      setConnected(false);

      if (![1000, 4001, 4003].includes(event.code)) {
        reconnectRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {
      console.log("🔥 WS Error");
      setError('WebSocket connection error.');
      ws.close();
    };

  }, [conversationId, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);

      if (wsRef.current) {
        wsRef.current.close(1000, 'Cleanup');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: text }));
      return true;
    }
    return false;
  }, []);

  return { sendMessage, connected, error };
}