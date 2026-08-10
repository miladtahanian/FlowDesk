import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import api from "../lib/api";
import { Ionicons } from "@expo/vector-icons";

export default function ProjectsScreen({ navigation }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/workspaces/");
      const workspaces = res.data.items || [];
      if (workspaces.length > 0) {
        const projRes = await api.get(`/projects/workspace/${workspaces[0].id}`);
        setProjects(projRes.data.items || []);
      }
    } catch {}
  };

  useEffect(() => { fetchProjects(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Projects</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Board", { projectId: item.id })}>
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardStatus}>{item.status}</Text>
              {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No projects yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 16 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardStatus: { fontSize: 12, color: "#666", textTransform: "capitalize", marginTop: 2 },
  cardDesc: { fontSize: 14, color: "#888", marginTop: 8 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
