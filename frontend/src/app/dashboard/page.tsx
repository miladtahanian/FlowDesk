"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DashboardStats } from "@/types";
import {
  FolderKanban,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  BarChart3,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchStats();
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const wsRes = await api.get("/workspaces/");
      const workspaces = wsRes.data.items || [];
      if (workspaces.length === 0) {
        setStats({
          total_projects: 0,
          total_tasks: 0,
          completed_tasks: 0,
          overdue_tasks: 0,
          total_members: 0,
          tasks_by_priority: {},
          tasks_by_status: {},
          recent_activity: [],
        });
        return;
      }
      setWorkspaceId(workspaces[0].id);
      const res = await api.get("/dashboard/stats", {
        params: { workspace_id: workspaces[0].id },
      });
      setStats(res.data);
    } catch {
      setStats({
        total_projects: 0,
        total_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: 0,
        total_members: 0,
        tasks_by_priority: {},
        tasks_by_status: {},
        recent_activity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t("dashboard.projects"),
      value: stats?.total_projects || 0,
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: t("dashboard.totalTasks"),
      value: stats?.total_tasks || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: t("dashboard.overdue"),
      value: stats?.overdue_tasks || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: t("dashboard.members"),
      value: stats?.total_members || 0,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  const completionRate = stats
    ? stats.total_tasks > 0
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
      : 0
    : 0;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("dashboard.welcome")}, <span suppressHydrationWarning>{user?.full_name || ""}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("dashboard.taskOverview")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("dashboard.completionRate")}
                      </span>
                      <span className="text-sm font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} size="md" />

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("dashboard.completed")}</span>
                          <span className="font-medium text-green-600">{stats?.completed_tasks || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("dashboard.pending")}</span>
                          <span className="font-medium text-yellow-600">
                            {(stats?.total_tasks || 0) - (stats?.completed_tasks || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("dashboard.overdue")}</span>
                          <span className="font-medium text-red-600">{stats?.overdue_tasks || 0}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(stats?.tasks_by_priority || {}).map(([priority, count]) => (
                          <div key={priority} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  priority === "urgent"
                                    ? "bg-red-500"
                                    : priority === "high"
                                    ? "bg-orange-500"
                                    : priority === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              />
                              <span className="text-muted-foreground capitalize">{priority}</span>
                            </div>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t("dashboard.recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="space-y-3">
                    {(stats?.recent_activity || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("dashboard.noActivity")}
                      </p>
                    ) : (
                      (stats?.recent_activity || []).slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.entity_type}: {activity.entity_name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
