import { create } from "zustand";
import type { Workspace, Project, Board } from "../types";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  projects: Project[];
  activeProject: Project | null;
  boards: Board[];
  activeBoard: Board | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setBoards: (boards: Board[]) => void;
  setActiveBoard: (board: Board | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  activeProject: null,
  boards: [],
  activeBoard: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  setBoards: (boards) => set({ boards }),
  setActiveBoard: (board) => set({ activeBoard: board }),
}));
