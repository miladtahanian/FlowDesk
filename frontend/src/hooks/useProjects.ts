"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Project, PaginatedResponse } from "@/types";

export function useProjects(workspaceId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["projects", workspaceId, page, pageSize],
    queryFn: async () => {
      const res = await api.get(`/projects/workspace/${workspaceId}`, { params: { page, page_size: pageSize } });
      return res.data as PaginatedResponse<Project>;
    },
    enabled: !!workspaceId,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data as Project;
    },
    enabled: !!id,
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      status?: string;
      priority?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      const res = await api.post(`/projects/workspace/${workspaceId}`, data);
      return res.data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await api.put(`/projects/${id}`, data);
      return res.data as Project;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });
}

export function useDeleteProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}
