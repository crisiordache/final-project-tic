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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.token = await userCredential.user.getIdToken();
      localStorage.setItem('token', this.token);
    },

    async logout() {
      await signOut(auth);
      this.user = null;
      this.profile = null;
      this.token = null;
      localStorage.removeItem('token');
    },

    init() {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.user = user;
          this.token = await user.getIdToken();
          
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            this.profile = docSnap.data();
          }
        }
        this.loading = false;
      });
    }
  }
});