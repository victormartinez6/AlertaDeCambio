import { defineStore } from 'pinia';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyValue: number;
  status: string;
}

export const useLeadStore = defineStore('lead', {
  state: () => ({
    leads: [] as Lead[]
  }),
  
  actions: {
    setLeads(leads: Lead[]) {
      this.leads = leads;
    },
    
    addLead(lead: Lead) {
      this.leads.push(lead);
    },
    
    updateLead(updatedLead: Lead) {
      const index = this.leads.findIndex(lead => lead.id === updatedLead.id);
      if (index !== -1) {
        this.leads[index] = updatedLead;
      }
    },
    
    deleteLead(leadId: string) {
      this.leads = this.leads.filter(lead => lead.id !== leadId);
    }
  }
});
