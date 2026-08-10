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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Layout, Users, UserPlus, Trash2, Copy, Check } from "lucide-react";
import type { Project, Board, ProjectMember, ProjectInvitation } from "@/types";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("boards");
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [boardType, setBoardType] = useState("kanban");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusLabel = project?.status ? t(`project.statusOptions.${project.status}`) : "";
  const priorityLabel = project?.priority ? t(`project.priorityOptions.${project.priority}`) : "";

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchData();
  }, [isAuthenticated, projectId]);

  const fetchData = async () => {
    try {
      const [projRes, boardsRes, membersRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/boards/project/${projectId}`),
        api.get(`/projects/${projectId}/members`),
      ]);
      setProject(projRes.data);
      setBoards(Array.isArray(boardsRes.data) ? boardsRes.data : []);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);

      try {
        const invRes = await api.get(`/projects/${projectId}/invitations`);
        setInvitations(Array.isArray(invRes.data) ? invRes.data : []);
      } catch (err) {
        console.warn("Failed to fetch invitations:", err);
      }
    } catch (err: any) {
      console.error("Failed to fetch project data:", err);
      if (err.response?.status === 404) { 
        toast.error(t("project.notFound")); 
        router.push(`/workspaces/${workspaceId}`); 
      } else {
        toast.error(err.response?.data?.detail || t("common.failed")); 
      }
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreateBoard = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post(`/boards/project/${projectId}`, { name, type: boardType });
      setBoards([...boards, res.data]);
      setShowCreate(false); setName(""); setBoardType("kanban");
      toast.success(t("board.createSuccess"));
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleInvite = async () => {
    if (!inviteCode.trim()) return;
    setCreating(true);
    try {
      await api.post(`/projects/${projectId}/invite`, { invitation_code: inviteCode });
      setShowInvite(false); setInviteCode("");
      toast.success(t("project.inviteSuccess"));
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
    finally { setCreating(false); }
  };

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await api.post(`/projects/${projectId}/invitations/${invitationId}/accept`);
      toast.success(t("project.inviteAccepted"));
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    try {
      await api.post(`/projects/${projectId}/invitations/${invitationId}/decline`);
      toast.success(t("project.inviteDeclined"));
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      toast.success(t("project.memberRemoved"));
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.detail || t("common.failed")); }
  };

  const copyInviteCode = () => {
    if (user?.invitation_code) {
      navigator.clipboard.writeText(user.invitation_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6"><Skeleton className="h-8 w-48 mb-6" /></main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <Link href={`/workspaces/${workspaceId}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
              <ArrowLeft size={14} /> {t("workspace.backToWorkspaces")}
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: project?.color || "#10B981" }}>{project?.name?.charAt(0)}</div>
                <div>
                  <h1 className="text-2xl font-bold">{project?.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {statusLabel && <Badge variant="outline">{statusLabel}</Badge>}
                    {priorityLabel && <Badge variant="outline">{priorityLabel}</Badge>}
                  </div>
                </div>
              </div>
              {project?.description && <p className="text-muted-foreground mt-2 ml-15">{project.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowInvite(true)}><UserPlus size={16} className="mr-2" /> {t("project.invite")}</Button>
              <Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" /> {t("board.create")}</Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="boards">{t("project.boards")}</TabsTrigger>
              <TabsTrigger value="members">{t("project.members")} ({members.length})</TabsTrigger>
              <TabsTrigger value="invitations">{t("project.invitations")} ({invitations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="boards">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => (
                  <Link key={board.id} href={`/workspaces/${workspaceId}/projects/${projectId}/boards/${board.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center"><Layout size={20} className="text-primary" /></div>
                          <div><CardTitle className="text-lg">{board.name}</CardTitle><span className="text-xs text-muted-foreground capitalize">{t(`board.typeOptions.${board.type}`)}</span></div>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-sm text-muted-foreground">{board.description || t("common.noData")}</p></CardContent>
                    </Card>
                  </Link>
                ))}
                {boards.length === 0 && <Card className="col-span-full"><CardContent className="p-12 text-center text-muted-foreground">{t("board.noBoards")}</CardContent></Card>}
              </div>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardContent className="p-0">
                  {members.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">{t("project.noMembers")}</div>
                  ) : (
                    <div className="divide-y">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {m.user?.full_name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-medium">{m.user?.full_name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{m.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">{m.role}</Badge>
                            {m.role !== "admin" && user?.id !== m.user_id && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMember(m.user_id)}>
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <CardContent className="p-0">
                  {invitations.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">{t("project.noInvitations")}</div>
                  ) : (
                    <div className="divide-y">
                      {invitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium">{inv.email}</p>
                            <p className="text-sm text-muted-foreground">{t("project.invitedBy")} {inv.inviter?.full_name || "Unknown"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={inv.status === "pending" ? "secondary" : inv.status === "accepted" ? "default" : "destructive"}>{inv.status}</Badge>
                            {inv.status === "pending" && inv.email === user?.email && (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleAcceptInvite(inv.id)}>{t("common.accept")}</Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeclineInvite(inv.id)}>{t("common.decline")}</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Modal open={showCreate} onClose={() => setShowCreate(false)}>
            <ModalHeader><ModalTitle>{t("board.create")}</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <Input placeholder={t("board.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <label className="text-sm font-medium mb-2 block">{t("board.type")}</label>
                <div className="flex gap-2">
                  {["kanban", "scrum", "list"].map((type) => (
                    <Button key={type} variant={boardType === type ? "default" : "outline"} onClick={() => setBoardType(type)}>{t(`board.typeOptions.${type}`)}</Button>
                  ))}
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleCreateBoard} disabled={creating}>{creating ? t("common.creating") : t("common.create")}</Button>
            </ModalFooter>
          </Modal>

          <Modal open={showInvite} onClose={() => setShowInvite(false)}>
            <ModalHeader><ModalTitle>{t("project.inviteMember")}</ModalTitle></ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("project.yourInviteCode")}</label>
                <div className="flex gap-2">
                  <Input value={user?.invitation_code || ""} readOnly />
                  <Button variant="outline" onClick={copyInviteCode}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("project.shareInviteCode")}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("project.enterInviteCode")}</label>
                <Input placeholder={t("project.inviteCodePlaceholder")} value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleInvite} disabled={creating || !inviteCode.trim()}>{creating ? t("common.sending") : t("common.send")}</Button>
            </ModalFooter>
          </Modal>
        </main>
      </div>
    </div>
  );
}
