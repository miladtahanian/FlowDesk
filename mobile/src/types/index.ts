export interface User {
  id: string;
  tenant_id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  invitation_code: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
  plan: string;
  max_members: string;
  max_workspaces: string;
  max_projects: string;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  type: string;
  is_default: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  columns?: BoardColumn[];
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  wip_limit: number | null;
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  column_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  position: number;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  assignee_id: string | null;
  reporter_id: string;
  is_completed: boolean;
  completed_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardStats {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_members: number;
  tasks_by_priority: Record<string, number>;
  tasks_by_status: Record<string, number>;
  recent_activity: any[];
}
