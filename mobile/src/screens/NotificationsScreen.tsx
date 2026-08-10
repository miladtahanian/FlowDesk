import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import api from "../lib/api";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/activity/notifications");
      setNotifications(res.data);
    } catch {}
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      await api.put("/activity/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, is_read: new Date().toISOString() })));
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.notif, !item.is_read && styles.unread]}>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifMsg}>{item.message}</Text>
            </View>
            {!item.is_read && <View style={styles.badge} />}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "bold" },
  markRead: { color: "#3B82F6", fontSize: 14 },
  notif: { flexDirection: "row", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", alignItems: "center" },
  unread: { backgroundColor: "#EFF6FF" },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "600" },
  notifMsg: { fontSize: 13, color: "#666", marginTop: 4 },
  badge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3B82F6" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
