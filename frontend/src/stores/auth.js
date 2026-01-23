import { defineStore } from 'pinia';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    token: null,
    loading: true
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.profile?.role === 'admin',
    firstName: (state) => {
      if (!state.profile?.name) return '';
      return state.profile.name.split(' ')[0];
    }
  },

  actions: {
    async fetchUserProfile(uid) {
      try {
        const res = await fetch("http://localhost:3000/api/users/profile", {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        const data = await res.json();
        this.profile = data.user;
        
      } catch (error) {
        console.error(error);
      }
    },


    async login(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        this.token = await userCredential.user.getIdToken();
        localStorage.setItem('token', this.token);
        
        await this.fetchUserProfile(userCredential.user.uid);
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
        if (user) {
          this.user = user;
          this.token = await user.getIdToken();
          await this.fetchUserProfile(user.uid);
        } else {
          this.user = null;
          this.profile = null;
        }
        this.loading = false;
      });
    }
  }
});