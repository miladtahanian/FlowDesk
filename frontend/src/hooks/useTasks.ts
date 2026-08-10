"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Task, Comment } from "@/types";

export function useTasksByColumn(columnId: string) {
  return useQuery({
    queryKey: ["tasks", "column", columnId],
    queryFn: async () => {
      const res = await api.get(`/tasks/column/${columnId}`);
      return res.data as Task[];
    },
    enabled: !!columnId,
  });
}

export function useMyTasks(skip = 0, limit = 50) {
  return useQuery({
    queryKey: ["tasks", "my", skip, limit],
    queryFn: async () => {
      const res = await api.get("/tasks/my", { params: { skip, limit } });
      return res.data as Task[];
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const res = await api.get(`/tasks/${id}`);
      return res.data as Task;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      column_id: string;
      priority?: string;
      due_date?: string;
      assignee_id?: string;
      label_ids?: string[];
    }) => {
      const res = await api.post("/tasks/", data);
      return res.data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await api.put(`/tasks/${id}`, data);
      return res.data as Task;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", id] });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { column_id: string; position: number } }) => {
      const res = await api.put(`/tasks/${id}/move`, data);
      return res.data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/comments`);
      return res.data as Comment[];
    },
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const res = await api.post(`/tasks/${taskId}/comments`, { content });
      return res.data as Comment;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/tasks/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}
