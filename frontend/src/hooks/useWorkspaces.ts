"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Workspace, PaginatedResponse } from "@/types";

export function useWorkspaces(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["workspaces", page, pageSize],
    queryFn: async () => {
      const res = await api.get("/workspaces/", { params: { page, page_size: pageSize } });
      return res.data as PaginatedResponse<Workspace>;
    },
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${id}`);
      return res.data as Workspace;
    },
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; icon?: string }) => {
      const res = await api.post("/workspaces/", data);
      return res.data as Workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; color?: string; icon?: string } }) => {
      const res = await api.put(`/workspaces/${id}`, data);
      return res.data as Workspace;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
