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
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  joined_at: string;
  user?: User;
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
  members?: ProjectMember[];
  boards?: Board[];
}

export interface ProjectMember {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  joined_at: string;
  user?: User;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  invited_by: string;
  email: string;
  invitation_code: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  inviter?: User;
  project_name?: string;
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
  subtasks?: Subtask[];
  checklists?: Checklist[];
  assignee?: User;
  reporter?: User;
  labels?: Label[];
  attachments?: Attachment[];
  comments_count?: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Checklist {
  id: string;
  task_id: string;
  title: string;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  task_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_by: string;
  created_at: string;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
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

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  due_date: string;
  status: string;
  created_by: string;
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
  recent_activity: ActivityLog[];
}
