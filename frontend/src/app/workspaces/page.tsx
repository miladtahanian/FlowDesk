"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Folder, Briefcase, Rocket, Star, Heart, Zap, Target, Globe } from "lucide-react";
import type { Workspace } from "@/types";
import { toast } from "sonner";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];
const ICONS = ["folder", "briefcase", "rocket", "star", "heart", "zap", "target", "globe"];
const ICON_COMPONENTS: Record<string, any> = {
  folder: Folder,
  briefcase: Briefcase,
  rocket: Rocket,
  star: Star,
  heart: Heart,
  zap: Zap,
  target: Target,
  globe: Globe,
};

export default function WorkspacesPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("folder");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchWorkspaces();
  }, [isAuthenticated]);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces/");
      setWorkspaces(res.data.items || []);
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/workspaces/", { name, description, color, icon });
      setWorkspaces([...workspaces, res.data]);
      setShowCreate(false);
      resetForm();
      toast.success(t("workspace.createSuccess"));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t("common.failed"));
    } finally { setCreating(false); }
  };

  const handleEdit = async () => {
    if (!selectedWs || !name.trim()) return;
    setCreating(true);
    try {
      const res = await api.put(`/workspaces/${selectedWs.id}`, { name, description, color, icon });
      setWorkspaces(workspaces.map(w => w.id === selectedWs.id ? res.data : w));
      setShowEdit(false);
      resetForm();
      toast.success(t("workspace.updateSuccess"));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t("common.failed"));
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!selectedWs) return;
    setCreating(true);
    try {
      await api.delete(`/workspaces/${selectedWs.id}/`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== selectedWs.id));
      setShowDelete(false);
      setSelectedWs(null);
      toast.success(t("workspace.deleteSuccess"));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t("common.failed"));
    } finally { setCreating(false); }
  };

  const resetForm = () => { setName(""); setDescription(""); setColor("#3B82F6"); setIcon("folder"); setSelectedWs(null); };

  const openEdit = (ws: Workspace) => { setSelectedWs(ws); setName(ws.name); setDescription(ws.description || ""); setColor(ws.color); setIcon(ws.icon); setShowEdit(true); };
  const openDelete = (ws: Workspace) => { setSelectedWs(ws); setShowDelete(true); };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t("workspace.title")}</h1>
            <Button onClick={() => { resetForm(); setShowCreate(true); }}><Plus size={16} className="mr-2" /> {t("workspace.create")}</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? Array(3).fill(0).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)
            : workspaces.map((ws) => {
              const Icon = ICON_COMPONENTS[ws.icon] ?? Folder;
              return (
                <Card key={ws.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/workspaces/${ws.id}`} className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: ws.color }}>{ws.name.charAt(0)}</div>
                        <div>
                          <CardTitle className="text-lg">{ws.name}</CardTitle>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
                            <Icon size={14} aria-hidden />
                          </span>
                        </div>
                      </Link>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ws)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(ws)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/workspaces/${ws.id}`}><p className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">{ws.description || t("common.noData")}</p></Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Modal open={showCreate} onClose={() => setShowCreate(false)}>
            <ModalHeader><ModalTitle>{t("workspace.create")}</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <Input placeholder={t("workspace.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder={t("workspace.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
              <div>
                <label className="text-sm font-medium mb-2 block">{t("workspace.color")}</label>
                <div className="flex gap-2">{COLORS.map((c) => <button key={c} className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />)}</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("workspace.icon")}</label>
                <div className="flex gap-2 flex-wrap">{ICONS.map((i) => <button key={i} className={`px-3 py-1 rounded-md text-sm border ${icon === i ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setIcon(i)}>{i}</button>)}</div>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleCreate} disabled={creating}>{creating ? t("common.creating") : t("common.create")}</Button>
            </ModalFooter>
          </Modal>

          <Modal open={showEdit} onClose={() => setShowEdit(false)}>
            <ModalHeader><ModalTitle>{t("workspace.edit")}</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <Input placeholder={t("workspace.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder={t("workspace.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
              <div>
                <label className="text-sm font-medium mb-2 block">{t("workspace.color")}</label>
                <div className="flex gap-2">{COLORS.map((c) => <button key={c} className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />)}</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("workspace.icon")}</label>
                <div className="flex gap-2 flex-wrap">{ICONS.map((i) => <button key={i} className={`px-3 py-1 rounded-md text-sm border ${icon === i ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setIcon(i)}>{i}</button>)}</div>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowEdit(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleEdit} disabled={creating}>{creating ? t("common.saving") : t("common.save")}</Button>
            </ModalFooter>
          </Modal>

          <Modal open={showDelete} onClose={() => setShowDelete(false)}>
            <ModalHeader><ModalTitle>{t("workspace.delete")}</ModalTitle></ModalHeader>
            <p className="text-muted-foreground">{t("workspace.deleteConfirm")}</p>
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
