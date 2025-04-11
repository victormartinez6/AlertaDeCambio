import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
}

// Função para carregar colunas do localStorage
const loadColumnsFromStorage = (): KanbanColumn[] => {
  const savedColumns = localStorage.getItem('kanban_columns');
  if (savedColumns) {
    return JSON.parse(savedColumns);
  }
  
  // Colunas iniciais só serão usadas se não houver dados no localStorage
  const initialColumns = [
    { id: 'new', title: 'New', color: 'bg-blue-100', order: 0 },
    { id: 'contacted', title: 'Contacted', color: 'bg-yellow-100', order: 1 },
    { id: 'qualified', title: 'Qualified', color: 'bg-green-100', order: 2 },
    { id: 'lost', title: 'Lost', color: 'bg-red-100', order: 3 }
  ];

  // Salvar colunas iniciais no localStorage
  localStorage.setItem('kanban_columns', JSON.stringify(initialColumns));
  return initialColumns;
};

export const useKanbanStore = defineStore('kanban', {
  state: () => ({
    columns: loadColumnsFromStorage()
  }),

  getters: {
    sortedColumns: (state) => {
      return [...state.columns].sort((a, b) => a.order - b.order);
    }
  },

  actions: {
    saveToStorage() {
      localStorage.setItem('kanban_columns', JSON.stringify(this.columns));
    },

    addColumn(title: string, color: string = 'bg-gray-100') {
      const maxOrder = Math.max(...this.columns.map(col => col.order), -1);
      const newColumn: KanbanColumn = {
        id: uuidv4(),
        title,
        color,
        order: maxOrder + 1
      };
      this.columns.push(newColumn);
      this.saveToStorage();
    },

    updateColumn(id: string, data: Partial<KanbanColumn>) {
      const index = this.columns.findIndex(col => col.id === id);
      if (index !== -1) {
        this.columns[index] = {
          ...this.columns[index],
          ...data
        };
        this.saveToStorage();
      }
    },

    deleteColumn(id: string) {
      const index = this.columns.findIndex(col => col.id === id);
      if (index !== -1) {
        this.columns.splice(index, 1);
        // Reorder remaining columns
        this.columns.forEach((col, idx) => {
          col.order = idx;
        });
        this.saveToStorage();
      }
    },

    reorderColumns(fromIndex: number, toIndex: number) {
      const columns = [...this.columns].sort((a, b) => a.order - b.order);
      const [movedColumn] = columns.splice(fromIndex, 1);
      columns.splice(toIndex, 0, movedColumn);
      
      // Update orders
      columns.forEach((col, idx) => {
        this.updateColumn(col.id, { order: idx });
      });
      this.saveToStorage();
    }
  }
});
