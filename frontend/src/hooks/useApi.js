import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

/**
 * Generic data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi('/groups/my-groups');
 *   const { data, loading, refetch } = useApi('/users', { params: { role: 'teacher' } });
 */
export function useApi(url, options = {}) {
  const [data, setData]       = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async (overrideUrl, overrideOptions) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(overrideUrl ?? url, overrideOptions ?? options);
      if (mountedRef.current) {
        setData(res.data);
        setError(null);
      }
      return res.data;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Request failed');
      }
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    if (url) fetch();
    return () => { mountedRef.current = false; };
  }, [url]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Mutation hook for POST/PUT/PATCH/DELETE.
 *
 * Usage:
 *   const { mutate, loading } = useMutation();
 *   await mutate('post', '/users', payload);
 */
export function useMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const mutate = useCallback(async (method, url, data, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api[method](url, data, options);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
