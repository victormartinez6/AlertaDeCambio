import { defineStore } from 'pinia';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
    isInitialized: false
  }),
  
  actions: {
    init() {
      return new Promise((resolve) => {
        // Unsubscribe any existing listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user ? 'logged in' : 'logged out');
          this.user = user;
          this.isInitialized = true;
          unsubscribe(); // Unsubscribe after first initialization
          resolve(user);
        });
      });
    },

    async register(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        this.user = user;
        return true;
      } catch (error: any) {
        this.error = error.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim();
        return false;
      } finally {
        this.loading = false;
      }
    },

    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        this.user = user;
        return true;
      } catch (error: any) {
        this.error = error.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim();
        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;
      try {
        await signOut(auth);
        this.user = null;
        return true;
      } catch (error: any) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});