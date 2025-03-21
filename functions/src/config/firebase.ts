import * as admin from 'firebase-admin'

// Inicializa o admin do Firebase se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp()
}

export const db = admin.firestore()
