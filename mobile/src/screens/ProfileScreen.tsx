import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || "U"}</Text>
        </View>

        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>

        <View style={styles.info}>
          <InfoRow icon="person-outline" label="Username" value={user?.username} />
          <InfoRow icon="business-outline" label="Role" value={user?.role} />
          <InfoRow icon="calendar-outline" label="Joined" value={user?.created_at?.split("T")[0]} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color="#666" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 18, fontWeight: "bold" },
  content: { alignItems: "center", padding: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  avatarText: { fontSize: 32, color: "#fff", fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  role: { fontSize: 14, color: "#3B82F6", marginTop: 4, textTransform: "capitalize" },
  info: { width: "100%", marginTop: 32, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee", gap: 12 },
  infoLabel: { fontSize: 14, color: "#666", flex: 1 },
  infoValue: { fontSize: 14, fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 32, padding: 16, width: "100%", backgroundColor: "#FEF2F2", borderRadius: 12 },
  logoutText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
});
