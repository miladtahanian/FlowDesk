"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useSearch(query: string, enabled = true) {
  const [results, setResults] = useState<{
    workspaces: any[];
    projects: any[];
    boards: any[];
    tasks: any[];
    users: any[];
  }>({ workspaces: [], projects: [], boards: [], tasks: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2 || !enabled) {
      setResults({ workspaces: [], projects: [], boards: [], tasks: [], users: [] });
      return;
    }

    const controller = new AbortController();
    const search = async () => {
      setLoading(true);
      try {
        const res = await api.get("/search/", { params: { q: query }, signal: controller.signal });
        setResults(res.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search failed:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, enabled]);

  return { results, loading };
}

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToPage = (p: number) => setPage(Math.max(1, p));
  const reset = () => setPage(1);

  return { page, pageSize, setPage, setPageSize, nextPage, prevPage, goToPage, reset };
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function useKeyboard(key: string, handler: () => void, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      if (modifiers?.ctrl && !event.ctrlKey && !event.metaKey) return;
      if (modifiers?.shift && !event.shiftKey) return;
      if (modifiers?.alt && !event.altKey) return;
      handler();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [key, handler, modifiers]);
}
