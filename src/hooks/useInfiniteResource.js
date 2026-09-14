import { useCallback, useEffect, useRef, useState } from "react";

export function useInfiniteResource({ loadPage, getItemKey, resetKey }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);
  const itemsRef = useRef([]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;

    const requestId = requestIdRef.current;
    const currentOffset = offsetRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    isLoadingRef.current = true;
    if (currentOffset === 0) {
      setItems([]);
      setHasMore(true);
    }
    setIsLoading(true);
    setError("");

    try {
      const response = await loadPage(currentOffset, controller.signal);
      if (controller.signal.aborted || requestId !== requestIdRef.current)
        return;

      const batch = Array.isArray(response?.results) ? response.results : [];
      const existingKeys = new Set(itemsRef.current.map(getItemKey));
      const uniqueBatch = batch.filter((item) => {
        const key = getItemKey(item);
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
      const nextItems = [...itemsRef.current, ...uniqueBatch];
      const nextOffset = currentOffset + batch.length;
      const responseHasMore = response?.has_more ?? response?.hasMore;
      const nextHasMore =
        responseHasMore === undefined
          ? batch.length > 0
          : Boolean(responseHasMore);

      itemsRef.current = nextItems;
      offsetRef.current = nextOffset;
      hasMoreRef.current = nextHasMore && batch.length > 0;
      setItems(nextItems);
      setHasMore(hasMoreRef.current);
    } catch (requestError) {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setError(requestError.message);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [getItemKey, loadPage]);

  useEffect(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    itemsRef.current = [];
    offsetRef.current = 0;
    hasMoreRef.current = true;
    isLoadingRef.current = false;
    loadMore();

    return () => controllerRef.current?.abort();
  }, [loadMore, resetKey]);

  return { items, isLoading, hasMore, error, loadMore };
}
