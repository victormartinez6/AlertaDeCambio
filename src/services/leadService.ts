import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, getDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FileAttachment } from './fileService';
import { webhookService } from './webhookService';

const COLLECTION_NAME = 'leads';
const leadsCollection = collection(db, COLLECTION_NAME);

export interface FamilyMember {
  name: string;
  relationship: string;
  phone: string;
  countryCode: string;
}

interface Note {
  text: string;
  timestamp: string;
  author: string;
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  status: string;
  source: string;
  priority: string;
  notes: Note[];
  attachments?: FileAttachment[];
  archived?: boolean;
  kanbanColumn?: string;
  propertyValue?: number;
  createdAt?: string;
  updatedAt?: string;
  familyMembers?: FamilyMember[];
  userId?: string;
}

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error('Usuário não autenticado. Por favor, faça login.'));
      }
    });
  });
};

export const leadService = {
  async getLeads(): Promise<Lead[]> {
    try {
      const user = await getCurrentUser();
      const q = query(
        leadsCollection,
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const leads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      return leads.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error in getLeads:', error);
      throw error;
    }
  },

  async addLead(leadData: Omit<Lead, 'id'>): Promise<Lead> {
    try {
      const user = await getCurrentUser();
      
      // Garantir que todos os campos obrigatórios estejam presentes
      const newLead = {
        name: leadData.name || '',
        email: leadData.email || '',
        phone: leadData.phone || '',
        countryCode: leadData.countryCode || '',
        status: leadData.status || 'new',
        kanbanColumn: leadData.kanbanColumn || 'new',
        priority: leadData.priority || 'medium',
        source: leadData.source || 'website',
        notes: leadData.notes || [],
        familyMembers: leadData.familyMembers || [],
        propertyValue: Number(leadData.propertyValue) || 100000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
        userId: user.uid
      };

      console.log('Dados do novo lead antes de salvar:', newLead);

      // Criar documento no Firestore
      const docRef = await addDoc(leadsCollection, newLead);
      console.log('Documento criado no Firestore com ID:', docRef.id);
      
      // Buscar o documento recém-criado
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Erro ao criar lead: documento não encontrado após criação');
      }

      // Retornar o lead com o ID do Firestore
      const createdLead = {
        id: docRef.id,
        ...docSnap.data()
      } as Lead;

      // Disparar webhook (não bloqueia a operação principal)
      webhookService.trigger('lead.created', createdLead).catch(error => {
        console.error('Erro ao disparar webhook:', error);
      });

      console.log('Lead criado com sucesso, dados completos:', createdLead);
      return createdLead;
    } catch (error) {
      console.error('Erro detalhado ao criar lead:', error);
      throw error;
    }
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    try {
      console.log('Iniciando atualização do lead no Firestore:', { id, leadData });

      // Verificar se o documento existe
      const docRef = doc(leadsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error('Lead não encontrado no Firestore:', id);
        throw new Error('Este lead não existe mais no sistema');
      }

      // Remover campos undefined ou null
      const cleanData = { ...leadData };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === null) {
          delete cleanData[key];
        }
      });

      // Atualizar o documento
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: new Date().toISOString()
      });

      // Buscar o documento atualizado
      const updatedDoc = await getDoc(docRef);
      const updatedLead = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Lead;

      // Disparar webhook (não bloqueia a operação principal)
      webhookService.trigger('lead.updated', updatedLead).catch(error => {
        console.error('Erro ao disparar webhook:', error);
      });

      console.log('Lead atualizado com sucesso:', updatedLead);
      return updatedLead;
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      throw error;
    }
  },

  async deleteLead(id: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const docRef = doc(leadsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Lead não encontrado');
      }
      
      const leadDoc = docSnap.data() as Lead;
      if (leadDoc.userId !== user.uid) {
        throw new Error('Você não tem permissão para deletar este lead');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error in deleteLead:', error);
      throw error;
    }
  },

  async getLeadByEmail(email: string): Promise<Lead | null> {
    try {
      const user = await getCurrentUser();
      const searchEmail = email.toLowerCase().trim();
      
      // Busca todos os leads do usuário
      const allLeadsQuery = query(
        leadsCollection,
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(allLeadsQuery);
      let foundLead: Lead | null = null;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.email?.toLowerCase().trim() === searchEmail) {
          foundLead = {
            id: doc.id,
            ...data
          } as Lead;
        }
      });
      
      if (foundLead) {
        console.log('Lead encontrado:', foundLead);
        return foundLead;
      }
      
      console.log('Nenhum lead encontrado com este email');
      return null;
    } catch (error) {
      console.error('Error in getLeadByEmail:', error);
      throw error;
    }
  },

  async checkLeadExists(id: string): Promise<boolean> {
    try {
      console.log('Verificando existência do lead:', id);
      const docRef = doc(leadsCollection, id);
      const docSnap = await getDoc(docRef);
      const exists = docSnap.exists();
      console.log('Lead existe?', exists);
      return exists;
    } catch (error) {
      console.error('Erro ao verificar existência do lead:', error);
      return false;
    }
  },

  async getLead(id: string): Promise<Lead> {
    try {
      const docRef = doc(leadsCollection, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Lead não encontrado');
      }
      const lead = {
        id: docSnap.id,
        ...docSnap.data()
      } as Lead;
      return lead;
    } catch (error) {
      console.error('Error in getLead:', error);
      throw error;
    }
  },
};
