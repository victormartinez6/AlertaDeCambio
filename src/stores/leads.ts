import { defineStore } from 'pinia';
import { leadService, type Lead } from '../services/leadService';

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    leads: [] as Lead[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    activeLeads: (state) => state.leads.filter(lead => !lead.archived),
    archivedLeads: (state) => state.leads.filter(lead => lead.archived),
  },

  actions: {
    async fetchLeads() {
      this.loading = true;
      this.error = null;
      try {
        const fetchedLeads = await leadService.getLeads();
        // Ordenar leads por data de criação (mais recentes primeiro)
        this.leads = fetchedLeads.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.saveToStorage();
      } catch (err) {
        console.error('Error fetching leads:', err);
        this.error = 'Erro ao carregar leads';
        // Carregar do localStorage como fallback
        const savedLeads = localStorage.getItem('leads');
        if (savedLeads) {
          this.leads = JSON.parse(savedLeads);
        }
      } finally {
        this.loading = false;
      }
    },

    async addLead(leadData: Omit<Lead, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        console.log('Iniciando criação do lead:', leadData);
        
        // Criar lead no Firestore
        const newLead = await leadService.addLead(leadData);
        console.log('Lead criado no Firestore:', newLead);
        console.log('Lead adicionado ao store:', newLead); // Adicionado log
        
        // Adicionar ao estado local
        this.leads = [newLead, ...this.leads];
        this.saveToStorage();
        
        return newLead;
      } catch (error) {
        console.error('Erro ao criar lead:', error);
        this.error = error instanceof Error ? error.message : 'Erro ao criar lead';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateLead(id: string, data: Partial<Lead>) {
      this.loading = true;
      this.error = null;
      try {
        console.log('Iniciando atualização do lead:', { id, data });

        // Verifica se o lead existe no Firestore
        const exists = await leadService.checkLeadExists(id);
        if (!exists) {
          console.error('Lead não encontrado no Firestore:', id);
          throw new Error('Este lead não existe mais no sistema. A página será atualizada.');
        }

        // Atualiza o lead no Firestore
        const updatedLead = await leadService.updateLead(id, {
          ...data,
          updatedAt: new Date().toISOString()
        });
        console.log('Lead atualizado no Firestore:', updatedLead);

        // Atualiza o estado local
        const index = this.leads.findIndex(lead => lead.id === id);
        if (index !== -1) {
          this.leads[index] = updatedLead;
          console.log('Estado local atualizado');
        } else {
          console.warn('Lead não encontrado no estado local:', id);
          // Força um refresh dos leads
          await this.fetchLeads();
        }

        this.saveToStorage();
        return updatedLead;
      } catch (error) {
        console.error('Erro ao atualizar lead:', error);
        this.error = error instanceof Error ? error.message : 'Erro ao atualizar lead';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteLead(id: string) {
      this.loading = true;
      this.error = null;

      try {
        // Primeiro verifica se o lead existe no estado local
        const leadExists = this.leads.find(lead => lead.id === id);
        if (!leadExists) {
          throw new Error('Lead não encontrado no estado local');
        }

        // Remove do estado local primeiro
        const index = this.leads.findIndex(lead => lead.id === id);
        if (index !== -1) {
          this.leads.splice(index, 1);
        }

        // Tenta remover do Firestore
        try {
          await leadService.deleteLead(id);
          this.saveToStorage();
        } catch (firebaseError) {
          // Se falhar no Firestore, reverte a mudança local
          if (leadExists) {
            this.leads.push(leadExists);
          }
          throw firebaseError;
        }
      } catch (err) {
        console.error('Error deleting lead:', err);
        this.error = err instanceof Error ? err.message : 'Erro ao excluir lead';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async checkLeadExists(id: string) {
      try {
        return await leadService.checkLeadExists(id);
      } catch (error) {
        console.error('Erro ao verificar existência do lead:', error);
        return false;
      }
    },

    // Mantemos o localStorage como backup
    saveToStorage() {
      localStorage.setItem('leads', JSON.stringify(this.leads));
    }
  }
});
