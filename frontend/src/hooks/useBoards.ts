"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Board } from "@/types";

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: ["boards", projectId],
    queryFn: async () => {
      const res = await api.get(`/boards/project/${projectId}`);
      return res.data as Board[];
    },
    enabled: !!projectId,
  });
}

export function useBoard(id: string) {
  return useQuery({
    queryKey: ["board", id],
    queryFn: async () => {
      const res = await api.get(`/boards/${id}`);
      return res.data as Board;
    },
    enabled: !!id,
  });
}

export function useCreateBoard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; type?: string }) => {
      const res = await api.post(`/boards/project/${projectId}`, data);
      return res.data as Board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Board> }) => {
      const res = await api.put(`/boards/${id}`, data);
      return res.data as Board;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board", id] });
    },
  });
}

export function useDeleteBoard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/boards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] });
    },
  });
}
