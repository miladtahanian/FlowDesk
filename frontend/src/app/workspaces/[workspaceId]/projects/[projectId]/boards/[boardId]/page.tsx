"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useBoardStore } from "@/stores/boardStore";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Board, Task } from "@/types";
import { toast } from "sonner";
import { priorityColors, timeAgo } from "@/lib/utils";

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function BoardPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const workspaceId = params.workspaceId as string;
  const { t } = useTranslation();
  const getColumnDisplayName = (name: string) => {
    if (!name) return name;
    // trim whitespace and common delimiters that might be stored with the name
    const cleaned = name.trim().replace(/[#\s]+$/g, "").replace(/^\s+/, "");
    // if the column name itself is an i18n key like 'board.columns.todo', resolve it
    if (cleaned.startsWith("board.columns.")) {
      return t(cleaned);
    }
    const normalized = cleaned.toLowerCase();
    switch (normalized) {
      case "to do":
      case "todo":
        return t("board.columns.todo");
      case "in progress":
      case "inprogress":
      case "in-progress":
        return t("board.columns.inProgress");
      case "review":
        return t("board.columns.review");
      case "done":
        return t("board.columns.done");
      default:
        return name;
    }
  };
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");
  const [boardName, setBoardName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { columns, setColumns, moveTask } = useBoardStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchBoards();
  }, [isAuthenticated, projectId]);

  const fetchBoards = async () => {
    try {
      const res = await api.get(`/boards/project/${projectId}`);
      setBoards(res.data);
      if (res.data.length > 0) loadBoard(res.data[0].id);
    } catch (err: any) {
      console.error("Failed to fetch boards:", err);
      toast.error(err.response?.data?.detail || "Failed to load boards");
    } finally { 
      setLoading(false); 
    }
  };

  const loadBoard = async (boardId: string) => {
    try { 
      const res = await api.get(`/boards/${boardId}`); 
      setActiveBoard(res.data); 
      setColumns(res.data.columns || []); 
    } catch (err: any) {
      console.error("Failed to load board:", err);
      toast.error(err.response?.data?.detail || "Failed to load board");
    }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post(`/boards/project/${projectId}`, { name: boardName, type: "kanban" });
      setBoards([...boards, res.data]); setShowCreateBoard(false); setBoardName(""); loadBoard(res.data.id);
      toast.success(t("board.createSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !selectedColumnId) return;
    setCreating(true);
    try {
      const body: any = { title: taskTitle, description: taskDescription, column_id: selectedColumnId, priority: taskPriority };
      if (taskDueDate) body.due_date = taskDueDate;
      await api.post("/tasks/", body); loadBoard(activeBoard!.id); setShowCreateTask(false); resetTaskForm();
      toast.success(t("task.createSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleEditTask = async () => {
    if (!selectedTask || !taskTitle.trim()) return;
    setCreating(true);
    try {
      const body: any = { title: taskTitle, description: taskDescription, priority: taskPriority };
      if (taskDueDate) body.due_date = taskDueDate;
      await api.put(`/tasks/${selectedTask.id}`, body); loadBoard(activeBoard!.id); setShowEditTask(false); resetTaskForm();
      toast.success(t("task.updateSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setCreating(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}`); loadBoard(activeBoard!.id); setShowDeleteTask(false); setSelectedTask(null);
      toast.success(t("task.deleteSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const resetTaskForm = () => { setTaskTitle(""); setTaskDescription(""); setTaskPriority("medium"); setTaskDueDate(""); setSelectedTask(null); };
  const openEditTask = (task: Task) => { setSelectedTask(task); setTaskTitle(task.title); setTaskDescription(task.description || ""); setTaskPriority(task.priority); setTaskDueDate(task.due_date?.split("T")[0] || ""); setShowEditTask(true); };

  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (columnId: string, position: number) => {
    if (!draggedTask) return;
    moveTask(draggedTask.id, draggedTask.column_id, columnId, position); setDraggedTask(null);
    try { await api.put(`/tasks/${draggedTask.id}/move`, { column_id: columnId, position }); } catch { loadBoard(activeBoard!.id); }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <a href={`/workspaces/${workspaceId}/projects/${projectId}`} className="text-sm text-muted-foreground hover:text-foreground">{t("board.backToProject")}</a>
              <h1 className="text-2xl font-bold">{t("board.title")}</h1>
              {boards.length > 0 && <div className="flex gap-2">{boards.map((b) => <Button key={b.id} variant={activeBoard?.id === b.id ? "default" : "outline"} size="sm" onClick={() => loadBoard(b.id)}>{b.name}</Button>)}</div>}
            </div>
            <Button onClick={() => setShowCreateBoard(true)}><Plus size={16} className="mr-2" /> {t("board.create")}</Button>
          </div>

          {loading ? (
            <div className="flex gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="flex-1 min-w-[280px]"><Skeleton className="h-10 w-full mb-4" /><Skeleton className="h-32 w-full mb-2" /><Skeleton className="h-32 w-full" /></div>)}</div>
          ) : columns.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((col) => (
                <div key={col.id} className="flex-shrink-0 w-72 bg-muted/50 rounded-lg border border-border" onDragOver={handleDragOver} onDrop={(e) => handleDrop(col.id, (col.tasks || []).length)}>
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />
                      <h3 className="font-semibold text-sm">{getColumnDisplayName(col.name)}</h3>
                      <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded-full border border-border">{col.tasks?.length || 0}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { resetTaskForm(); setSelectedColumnId(col.id); setShowCreateTask(true); }}><Plus size={14} /></Button>
                  </div>
                  <div className="space-y-2 p-2 min-h-[200px]">
                    {(col.tasks || []).map((task) => (
                      <div key={task.id} draggable onDragStart={() => handleDragStart(task)} className="cursor-grab active:cursor-grabbing">
                        <Card className="hover:shadow-md transition-shadow bg-background">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
                              <div className="flex gap-1 ml-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEditTask(task); }}><Pencil size={12} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowDeleteTask(true); }}><Trash2 size={12} /></Button>
                                <GripVertical size={14} className="text-muted-foreground mt-0.5" />
                              </div>
                            </div>
                            {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority] || "bg-gray-400"}`} />
                                <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                              </div>
                              {task.due_date && <span className="text-xs text-muted-foreground">{timeAgo(task.due_date)}</span>}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : <Card><CardContent className="p-12 text-center text-muted-foreground">{boards.length === 0 ? t("board.noBoards") : t("board.selectBoard")}</CardContent></Card>}

          <Modal open={showCreateBoard} onClose={() => setShowCreateBoard(false)}>
            <ModalHeader><ModalTitle>{t("board.create")}</ModalTitle></ModalHeader>
            <div className="space-y-4"><Input placeholder={t("board.name")} value={boardName} onChange={(e) => setBoardName(e.target.value)} /></div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowCreateBoard(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleCreateBoard} disabled={creating}>{creating ? t("common.creating") : t("common.create")}</Button>
            </ModalFooter>
          </Modal>

          {[showCreateTask, showEditTask].map((open, idx) => (
            <Modal key={idx} open={open} onClose={() => idx === 0 ? setShowCreateTask(false) : setShowEditTask(false)}>
              <ModalHeader><ModalTitle>{idx === 0 ? t("task.create") : t("task.edit")}</ModalTitle></ModalHeader>
              <div className="space-y-4">
                <Input placeholder={t("task.taskTitle")} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <Textarea placeholder={t("task.description")} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("task.priority")}</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{t(`task.priorityOptions.${p}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("task.dueDate")}</label>
                    <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <ModalFooter>
                <Button variant="outline" onClick={() => idx === 0 ? setShowCreateTask(false) : setShowEditTask(false)}>{t("common.cancel")}</Button>
                <Button onClick={idx === 0 ? handleCreateTask : handleEditTask} disabled={creating}>{creating ? t("common.saving") : idx === 0 ? t("common.create") : t("common.save")}</Button>
              </ModalFooter>
            </Modal>
          ))}

          <Modal open={showDeleteTask} onClose={() => setShowDeleteTask(false)}>
            <ModalHeader><ModalTitle>{t("task.delete")}</ModalTitle></ModalHeader>
            <p className="text-muted-foreground">{t("task.deleteConfirm")}</p>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDeleteTask(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDeleteTask} disabled={creating}>{creating ? t("common.deleting") : t("common.delete")}</Button>
            </ModalFooter>
          </Modal>
        </main>
      </div>
    </div>
  );
}
