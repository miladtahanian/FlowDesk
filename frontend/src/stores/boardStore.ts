import { create } from "zustand";
import type { Board, BoardColumn, Task } from "@/types";

interface BoardState {
  board: Board | null;
  columns: BoardColumn[];
  setBoard: (board: Board | null) => void;
  setColumns: (columns: BoardColumn[]) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, position: number) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  columns: [],
  setBoard: (board) => set({ board, columns: board?.columns || [] }),
  setColumns: (columns) => set({ columns }),
  moveTask: (taskId, fromColumnId, toColumnId, position) =>
    set((state) => {
      const newColumns = state.columns.map((col) => {
        if (col.id === fromColumnId && fromColumnId !== toColumnId) {
          return { ...col, tasks: (col.tasks || []).filter((t) => t.id !== taskId) };
        }
        if (col.id === toColumnId) {
          const task = state.columns
            .find((c) => c.id === fromColumnId)
            ?.tasks?.find((t) => t.id === taskId);
          if (!task) return col;
          const tasks = [...(col.tasks || [])];
          tasks.splice(position, 0, { ...task, column_id: toColumnId, position });
          return { ...col, tasks };
        }
        return col;
      });
      if (fromColumnId === toColumnId) {
        const col = newColumns.find((c) => c.id === fromColumnId);
        if (col?.tasks) {
          const taskIdx = col.tasks.findIndex((t) => t.id === taskId);
          if (taskIdx > -1) {
            const [task] = col.tasks.splice(taskIdx, 1);
            col.tasks.splice(position, 0, task);
          }
        }
      }
      return { columns: newColumns };
    }),
}));
