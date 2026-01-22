import { defineStore } from 'pinia';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    token: null,
    loading: true
  }),

  actions: {
    async login(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.token = await userCredential.user.getIdToken();
        localStorage.setItem('token', this.token);
      } catch (error) {
        throw error;
      }
    },

    async logout() {
      await signOut(auth);
      this.user = null;
      this.profile = null;
      this.token = null;
      localStorage.removeItem('token');
    },

    init() {
      this.loading = true;

      onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            this.user = user;
            this.token = await user.getIdToken();
            
            try {
              const docRef = doc(db, "users", user.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                this.profile = docSnap.data();
              }
            } catch (fsError) {
              console.error("Firestore error (User Profile):", fsError);
            }
          } else {
            this.user = null;
            this.profile = null;
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
        } finally {
          this.loading = false;
        }
      });
    }
  }
});