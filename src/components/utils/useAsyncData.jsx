import { useState, useEffect, useCallback } from "react";

/**
 * Hook for loading async data with loading and error states
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Array} deps - Dependencies to trigger refetch
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useAsyncData(fetchFn, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      console.error('useAsyncData error:', error);
      setState({ data: null, loading: false, error });
    }
  }, [fetchFn]);

  useEffect(() => {
    let cancelled = false;
    
    loadData().then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [loadData, ...deps]);

  const refetch = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch
  };
}

/**
 * Hook for paginated data loading
 * @param {Function} fetchFn - Async function that takes page number
 * @param {number} pageSize - Items per page
 * @returns {Object} - { data, loading, error, hasMore, loadMore }
 */
export function usePaginatedData(fetchFn, pageSize = 20) {
  const [state, setState] = useState({
    data: [],
    page: 1,
    loading: true,
    error: null,
    hasMore: true
  });

  const loadPage = useCallback(async (page) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newData = await fetchFn(page, pageSize);
      setState(prev => ({
        data: page === 1 ? newData : [...prev.data, ...newData],
        page,
        loading: false,
        error: null,
        hasMore: newData.length === pageSize
      }));
    } catch (error) {
      console.error('usePaginatedData error:', error);
      setState(prev => ({ ...prev, loading: false, error }));
    }
  }, [fetchFn, pageSize]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore) return;
    loadPage(state.page + 1);
  }, [state.loading, state.hasMore, state.page, loadPage]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore
  };
}