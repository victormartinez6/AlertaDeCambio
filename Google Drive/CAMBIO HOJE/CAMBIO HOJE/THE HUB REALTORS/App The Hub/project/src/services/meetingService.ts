import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where } from 'firebase/firestore';
import { useAuthStore } from '../stores/auth';

export interface Meeting {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  location?: string;
  isOnlineMeeting: boolean;
  meetingUrl?: string;
  attendees: string[];
  notes?: string;
  leadName?: string;
  userId: string;
}

export class MeetingService {
  async getAllMeetings(): Promise<Meeting[]> {
    try {
      const authStore = useAuthStore();
      const userId = authStore.user?.uid;
      
      const meetingsRef = collection(db, 'meetings');
      const q = query(meetingsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Meeting[];
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }
  }

  async createMeeting(meetingData: Omit<Meeting, 'id'>): Promise<Meeting> {
    try {
      const meetingsRef = collection(db, 'meetings');
      
      // Remover campos undefined
      const cleanData = Object.entries(meetingData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const docRef = await addDoc(meetingsRef, cleanData);
      
      return {
        id: docRef.id,
        ...cleanData
      };
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  async updateMeeting(id: string, meetingData: Partial<Meeting>): Promise<void> {
    try {
      const meetingRef = doc(db, 'meetings', id);
      
      // Remover campos undefined e id
      const cleanData = Object.entries(meetingData).reduce((acc, [key, value]) => {
        if (value !== undefined && key !== 'id') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      await updateDoc(meetingRef, cleanData);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  async deleteMeeting(id: string): Promise<void> {
    try {
      const meetingRef = doc(db, 'meetings', id);
      await deleteDoc(meetingRef);
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }
}

export const meetingService = new MeetingService();
