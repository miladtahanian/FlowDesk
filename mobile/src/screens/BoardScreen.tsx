import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import api from "../lib/api";
import { Ionicons } from "@expo/vector-icons";

export default function BoardScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const [columns, setColumns] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBoard = async () => {
    try {
      const boardsRes = await api.get(`/boards/project/${projectId}`);
      if (boardsRes.data.length > 0) {
        const boardRes = await api.get(`/boards/${boardsRes.data[0].id}`);
        setColumns(boardRes.data.columns || []);
      }
    } catch {}
  };

  useEffect(() => { fetchBoard(); }, [projectId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBoard();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Board</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal contentContainerStyle={styles.board} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {columns.map((col) => (
          <View key={col.id} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={[styles.dot, { backgroundColor: col.color }]} />
              <Text style={styles.columnTitle}>{col.name}</Text>
              <Text style={styles.count}>{col.tasks?.length || 0}</Text>
            </View>
            <ScrollView style={styles.taskList}>
              {(col.tasks || []).map((task: any) => (
                <View key={task.id} style={styles.taskCard}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.priorityDot, { backgroundColor: task.priority === "urgent" ? "#EF4444" : task.priority === "high" ? "#F97316" : "#EAB308" }]} />
                    <Text style={styles.taskPriority}>{task.priority}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "bold" },
  board: { padding: 12, gap: 12 },
  column: { width: 280, backgroundColor: "#f0f0f0", borderRadius: 12, padding: 12 },
  columnHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  columnTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  count: { fontSize: 12, color: "#666", backgroundColor: "#ddd", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  taskList: { gap: 8 },
  taskCard: { backgroundColor: "#fff", borderRadius: 8, padding: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  taskTitle: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  taskPriority: { fontSize: 11, color: "#666", textTransform: "capitalize" },
});
