// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDQcPWZp7ofDABcuj_-wUXgxoQgpdRMlI",
  authDomain: "alerta-de-cambio.firebaseapp.com",
  projectId: "alerta-de-cambio",
  storageBucket: "alerta-de-cambio.firebasestorage.app",
  messagingSenderId: "486624655085",
  appId: "1:486624655085:web:ed1f5eaba7f6cb204ffee4"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
const db = getFirestore(app)
const auth = getAuth(app)

// Export the services
export { db, auth }
