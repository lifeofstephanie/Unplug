import { create } from 'zustand';

type NodeStatus = 'locked' | 'available' | 'completed';

interface CourseNode {
  id: string;
  title: string;
  status: NodeStatus;
  xp: number;
}

interface CourseState {
  nodes: CourseNode[];
  completeNode: (id: string) => void;
  unlockNext: (id: string) => void;
  reset: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  nodes: [],

  completeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, status: 'completed' } : n
      ),
    }));

    get().unlockNext(id);
  },

  unlockNext: (id) => {
    const nodes = get().nodes;
    const index = nodes.findIndex((n) => n.id === id);

    if (index >= 0 && nodes[index + 1]) {
      set((state) => ({
        nodes: state.nodes.map((n, i) =>
          i === index + 1 ? { ...n, status: 'available' } : n
        ),
      }));
    }
  },

  reset: () => set({ nodes: [] }),
}));