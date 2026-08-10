"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { Workspace, Project } from "@/types";
import { toast } from "sonner";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];
const STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function WorkspaceDetailPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#10B981");
  const [status, setStatus] = useState("planning");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchData();
  }, [isAuthenticated, workspaceId]);

  const fetchData = async () => {
    try {
      const [wsRes, projRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}`),
        api.get(`/projects/workspace/${workspaceId}`),
      ]);
      setWorkspace(wsRes.data);
      setProjects(projRes.data.items || []);
    } catch (err: any) {
      if (err.response?.status === 404) { toast.error(t("workspace.notFound")); router.push("/workspaces"); }
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const body: any = { name, description, color, status, priority };
      if (startDate) body.start_date = startDate;
      if (endDate) body.end_date = endDate;
      const res = await api.post(`/projects/workspace/${workspaceId}`, body);
      setProjects([...projects, res.data]);
      setShowCreate(false); resetForm();
      toast.success(t("project.createSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleEdit = async () => {
    if (!selectedProject || !name.trim()) return;
    setCreating(true);
    try {
      const body: any = { name, description, color, status, priority };
      if (startDate) body.start_date = startDate;
      if (endDate) body.end_date = endDate;
      const res = await api.put(`/projects/${selectedProject.id}`, body);
      setProjects(projects.map(p => p.id === selectedProject.id ? res.data : p));
      setShowEdit(false); resetForm();
      toast.success(t("project.updateSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    setCreating(true);
    try {
      await api.delete(`/projects/${selectedProject.id}`);
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setShowDelete(false); setSelectedProject(null);
      toast.success(t("project.deleteSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const resetForm = () => { setName(""); setDescription(""); setColor("#10B981"); setStatus("planning"); setPriority("medium"); setStartDate(""); setEndDate(""); setSelectedProject(null); };
  const openEdit = (proj: Project) => { setSelectedProject(proj); setName(proj.name); setDescription(proj.description || ""); setColor(proj.color); setStatus(proj.status); setPriority(proj.priority); setStartDate(proj.start_date?.split("T")[0] || ""); setEndDate(proj.end_date?.split("T")[0] || ""); setShowEdit(true); };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <Link href="/workspaces" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
              <ArrowLeft size={14} /> {t("workspace.backToWorkspaces")}
            </Link>
          </div>

          {loading ? <Skeleton className="h-8 w-48 mb-6" /> : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: workspace?.color }}>{workspace?.name?.charAt(0)}</div>
                  <div><h1 className="text-2xl font-bold">{workspace?.name}</h1><p className="text-muted-foreground">{workspace?.description}</p></div>
                </div>
                <Button onClick={() => { resetForm(); setShowCreate(true); }}><Plus size={16} className="mr-2" /> {t("project.create")}</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((proj) => (
                  <Card key={proj.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Link href={`/workspaces/${workspaceId}/projects/${proj.id}`} className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: proj.color }}>{proj.name.charAt(0)}</div>
                          <div>
                            <CardTitle className="text-lg">{proj.name}</CardTitle>
                            <div className="flex gap-1 mt-1">
                              {proj.status && <Badge variant="outline" className="text-xs">{t(`project.statusOptions.${proj.status}`)}</Badge>}
                              {proj.priority && <Badge variant="outline" className="text-xs">{t(`project.priorityOptions.${proj.priority}`)}</Badge>}
                            </div>
                          </div>
                        </Link>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(proj)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedProject(proj); setShowDelete(true); }}><Trash2 size={14} /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/workspaces/${workspaceId}/projects/${proj.id}`}><p className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">{proj.description || t("common.noData")}</p></Link>
                      {(proj.start_date || proj.end_date) && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {proj.start_date && <span>{t("project.startDate")}: {new Date(proj.start_date).toLocaleDateString()}</span>}
                          {proj.start_date && proj.end_date && <span> - </span>}
                          {proj.end_date && <span>{t("project.endDate")}: {new Date(proj.end_date).toLocaleDateString()}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {projects.length === 0 && <Card className="col-span-full"><CardContent className="p-12 text-center text-muted-foreground">{t("workspace.noProjects")}</CardContent></Card>}
              </div>
            </>
          )}

          {[showCreate, showEdit].map((open, idx) => (
            <Modal key={idx} open={open} onClose={() => idx === 0 ? setShowCreate(false) : setShowEdit(false)}>
              <ModalHeader><ModalTitle>{idx === 0 ? t("project.create") : t("project.edit")}</ModalTitle></ModalHeader>
              <div className="space-y-4">
                <Input placeholder={t("project.name")} value={name} onChange={(e) => setName(e.target.value)} />
                <Textarea placeholder={t("project.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("project.color")}</label>
                  <div className="flex gap-2">{COLORS.map((c) => <button key={c} className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("project.status")}</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{t(`project.statusOptions.${s}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("project.priority")}</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{t(`project.priorityOptions.${p}`)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-2 block">{t("project.startDate")}</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div><label className="text-sm font-medium mb-2 block">{t("project.endDate")}</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                </div>
              </div>
              <ModalFooter>
                <Button variant="outline" onClick={() => idx === 0 ? setShowCreate(false) : setShowEdit(false)}>{t("common.cancel")}</Button>
                <Button onClick={idx === 0 ? handleCreate : handleEdit} disabled={creating}>{creating ? t("common.saving") : idx === 0 ? t("common.create") : t("common.save")}</Button>
              </ModalFooter>
            </Modal>
          ))}

          <Modal open={showDelete} onClose={() => setShowDelete(false)}>
            <ModalHeader><ModalTitle>{t("project.delete")}</ModalTitle></ModalHeader>
            <p className="text-muted-foreground">{t("project.deleteConfirm")}</p>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDelete(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={creating}>{creating ? t("common.deleting") : t("common.delete")}</Button>
            </ModalFooter>
          </Modal>
        </main>
      </div>
    </div>
  );
}
