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
    async fetchUserProfile() {
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
        
        const response = await fetch("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        this.profile = data.user; 
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
        if (user) {
          this.user = user;
          this.token = await user.getIdToken();
          await this.fetchUserProfile();
        } else {
          this.user = null;
          this.profile = null;
        }
        this.loading = false;
      });
    }
  }
});