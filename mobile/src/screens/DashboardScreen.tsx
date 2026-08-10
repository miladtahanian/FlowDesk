import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useAuthStore } from "../stores/authStore";
import api from "../lib/api";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats", { params: { workspace_id: "current" } });
      setStats(res.data);
    } catch {}
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const statCards = [
    { title: "Projects", value: stats?.total_projects || 0, color: "#3B82F6" },
    { title: "Tasks", value: stats?.total_tasks || 0, color: "#10B981" },
    { title: "Completed", value: stats?.completed_tasks || 0, color: "#8B5CF6" },
    { title: "Overdue", value: stats?.overdue_tasks || 0, color: "#EF4444" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.full_name?.split(" ")[0]}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={statCards}
        numColumns={2}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={[styles.statCard, { borderLeftColor: item.color }]}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.title}</Text>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.projectsBtn} onPress={() => navigation.navigate("Projects")}>
            <Ionicons name="folder-open-outline" size={20} color="#3B82F6" />
            <Text style={styles.projectsBtnText}>View Projects</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  greeting: { fontSize: 20, fontWeight: "bold" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8 },
  content: { padding: 16 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, margin: 6, borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: "bold" },
  statLabel: { fontSize: 14, color: "#666", marginTop: 4 },
  projectsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginTop: 16, gap: 8, borderWidth: 1, borderColor: "#3B82F6" },
  projectsBtnText: { color: "#3B82F6", fontSize: 16, fontWeight: "600" },
});
