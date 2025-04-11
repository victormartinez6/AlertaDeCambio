import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { webhookService } from './webhookService';

const COLLECTION_NAME = 'exchange_alerts';
const alertsCollection = collection(db, COLLECTION_NAME);

export interface ExchangeAlert {
  id?: string;
  name: string;
  email: string;
  whatsapp: string;
  ddi: string;
  notificationChannels: string[];
  notificationType: 'target' | 'daily';
  targetRate?: number;
  validUntil: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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

export const alertService = {
  async getAlerts(): Promise<ExchangeAlert[]> {
    try {
      const user = await getCurrentUser();
      const q = query(
        alertsCollection,
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExchangeAlert[];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  async addAlert(alertData: Omit<ExchangeAlert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ExchangeAlert> {
    try {
      const user = await getCurrentUser();
      
      const newAlert = {
        ...alertData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(alertsCollection, newAlert);
      const createdAlert = {
        id: docRef.id,
        ...newAlert
      };

      // Disparar evento de criação
      webhookService.trigger('exchange.alert.created', {
        Bundle: {
          Type: 'AlertCreated',
          EventDate: new Date().toISOString(),
          Payload: {
            Type: 'Alert',
            Content: {
              Alert: {
                Id: createdAlert.id,
                Type: alertData.type,
                Status: 'active',
                CreatedAtUTC: createdAlert.createdAt,
                UpdatedAtUTC: createdAlert.updatedAt
              },
              User: {
                Id: createdAlert.userId,
                Name: alertData.name,
                Email: alertData.email,
                Phone: {
                  DDI: alertData.ddi,
                  Number: alertData.whatsapp.replace(/\D/g, ''),
                  Full: `${alertData.ddi}${alertData.whatsapp.replace(/\D/g, '')}`
                }
              },
              Currency: {
                Pair: alertData.pair,
                TargetRate: alertData.targetRate,
                empty: false
              },
              Notification: {
                Type: alertData.notificationType,
                Channels: {
                  Email: alertData.notificationChannels.includes('email'),
                  WhatsApp: alertData.notificationChannels.includes('whatsapp')
                },
                UsingInactivityFlow: false,
                UsingWaitingFlow: false,
                InactivityFlowAt: '',
                WaitingFlowAt: '',
                Open: true,
                Private: false,
                Waiting: false,
                WaitingSinceUTC: '',
                TotalUnread: 0
              },
              Tags: [],
              OrganizationMembers: [],
              LastMessage: {
                Message: '',
                Visibility: '',
                Id: createdAlert.id,
                CreatedAtUTC: createdAlert.createdAt
              }
            }
          }
        }
      }).catch(error => {
        console.error('Erro ao disparar webhook de criação:', error);
      });

      return createdAlert;
    } catch (error) {
      console.error('Error adding alert:', error);
      throw error;
    }
  },

  async updateAlert(id: string, alertData: Partial<ExchangeAlert>): Promise<ExchangeAlert> {
    try {
      const user = await getCurrentUser();
      const alertRef = doc(alertsCollection, id);
      
      const updateData = {
        ...alertData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(alertRef, updateData);
      
      const updatedAlert = {
        id,
        ...alertData,
        userId: user.uid,
        updatedAt: updateData.updatedAt
      } as ExchangeAlert;

      // Disparar evento de atualização
      webhookService.trigger('exchange.alert.updated', {
        Bundle: {
          Type: 'AlertUpdated',
          EventDate: new Date().toISOString(),
          Payload: {
            Type: 'Alert',
            Content: {
              Alert: {
                Id: updatedAlert.id,
                Type: updatedAlert.type,
                Status: 'active',
                CreatedAtUTC: updatedAlert.createdAt,
                UpdatedAtUTC: updatedAlert.updatedAt
              },
              Changes: alertData // Incluir campos alterados
            }
          }
        }
      }).catch(error => {
        console.error('Erro ao disparar webhook de atualização:', error);
      });
      
      return updatedAlert;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  },

  async deleteAlert(id: string): Promise<void> {
    try {
      const alertRef = doc(alertsCollection, id);
      
      // Obter dados do alerta antes de excluir
      const alert = await this.getAlert(id);
      
      await deleteDoc(alertRef);

      // Disparar evento de exclusão
      webhookService.trigger('exchange.alert.deleted', {
        Bundle: {
          Type: 'AlertDeleted',
          EventDate: new Date().toISOString(),
          Payload: {
            Type: 'Alert',
            Content: {
              Alert: {
                Id: id,
                DeletedAtUTC: new Date().toISOString()
              },
              PreviousData: alert // Incluir dados do alerta excluído
            }
          }
        }
      }).catch(error => {
        console.error('Erro ao disparar webhook de exclusão:', error);
      });

    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },

  async getAlert(id: string): Promise<ExchangeAlert | null> {
    try {
      const alertRef = doc(alertsCollection, id);
      const alertDoc = await getDoc(alertRef);
      
      if (alertDoc.exists()) {
        return {
          id: alertDoc.id,
          ...alertDoc.data()
        } as ExchangeAlert;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting alert:', error);
      throw error;
    }
  },

  async triggerAlert(id: string, currentRate: number): Promise<void> {
    try {
      const alert = await this.getAlert(id);
      if (!alert) {
        throw new Error('Alerta não encontrado');
      }

      // Disparar evento de trigger
      webhookService.trigger('exchange.alert.triggered', {
        Bundle: {
          Type: 'AlertTriggered',
          EventDate: new Date().toISOString(),
          Payload: {
            Type: 'Alert',
            Content: {
              Alert: {
                Id: alert.id,
                Type: alert.type,
                Status: 'triggered',
                TriggeredAtUTC: new Date().toISOString()
              },
              Currency: {
                Pair: alert.pair,
                TargetRate: alert.targetRate,
                CurrentRate: currentRate
              }
            }
          }
        }
      }).catch(error => {
        console.error('Erro ao disparar webhook de trigger:', error);
      });

    } catch (error) {
      console.error('Error triggering alert:', error);
      throw error;
    }
  }
};
