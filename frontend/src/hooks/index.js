import { useState, useEffect, useCallback } from 'react';
import { productsAPI, ordersAPI, chatAPI } from '../api';

// ── Generic async hook ─────────────────────────────────
export const useAsync = (asyncFn, deps = []) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result.data);
      return result.data;
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]
        || 'Something went wrong.';
      setError(Array.isArray(msg) ? msg[0] : msg);
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, execute, setData };
};

// ── Products list with filters ─────────────────────────
 
export const useProducts = (params) => {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.list(params);
      setProducts(data.results || data);
      setCount(data.count || (data.results || data).length);
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // ✅ KEY FIX

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, count, loading, error, refetch: fetchProducts };
};

// ── Single product ─────────────────────────────────────
export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsAPI.detail(id)
      .then(({ data }) => setProduct(data))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading, error, setProduct };
};

// ── My products ────────────────────────────────────────
export const useMyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.myProducts();
      setProducts(data);
    } catch {
      setError('Failed to load your products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));

  return { products, loading, error, refetch: fetch, remove };
};

// ── Orders ─────────────────────────────────────────────
export const useOrders = (asSeller = false) => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    const call = asSeller ? ordersAPI.asSeller() : ordersAPI.list();
    call
      .then(({ data }) => setOrders(data.results || data))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, [asSeller]);

  return { orders, loading, error, setOrders };
};

// ── Conversations ──────────────────────────────────────
export const useConversations = () => {
  const [convs,   setConvs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await chatAPI.conversations();
      setConvs(data.results || data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { convs, loading, refetch: fetch };
};

// ── Messages in a conversation ─────────────────────────
export const useMessages = (convId) => {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetch = useCallback(async () => {
    if (!convId) return;
    try {
      const { data } = await chatAPI.messages(convId);
      setMessages(data.results || data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [convId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  return { messages, loading, refetch: fetch, addMessage };
};
