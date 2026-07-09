/**
 * PizzaFlow — AuthService
 * Abstrai a autenticação do administrador no Firebase Authentication com fallback para mock local.
 */

import { auth, isFirebaseActive } from './firebase.js';
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';

let currentUser = null;
let authChecked = false;
const listeners = new Set();

if (isFirebaseActive) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authChecked = true;
    listeners.forEach(cb => cb(user));
  });
} else {
  // Modo Mock: verifica se já estava logado via localStorage
  try {
    const saved = localStorage.getItem('pizzaflow_admin_logged');
    if (saved) {
      currentUser = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao ler localStorage do Admin', e);
  }
  authChecked = true;
}

export const AuthService = {
  /**
   * Se inscreve nas mudanças de estado de autenticação
   */
  subscribe(callback) {
    listeners.add(callback);
    callback(currentUser);
    return () => listeners.delete(callback);
  },

  /**
   * Realiza login com e-mail e senha
   */
  async login(email, password) {
    if (isFirebaseActive) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      currentUser = userCredential.user;
      return currentUser;
    } else {
      // Login Mock padrão para teste local fácil
      if (email === 'admin@pizzaflow.com' && password === 'admin123') {
        currentUser = { email, uid: 'mock-admin-uid', displayName: 'Admin PizzaFlow' };
        localStorage.setItem('pizzaflow_admin_logged', JSON.stringify(currentUser));
        listeners.forEach(cb => cb(currentUser));
        return currentUser;
      }
      throw new Error('E-mail ou senha incorretos. (Dica de teste mock: admin@pizzaflow.com / admin123)');
    }
  },

  /**
   * Efetua logout
   */
  async logout() {
    if (isFirebaseActive) {
      await fbSignOut(auth);
      currentUser = null;
    } else {
      currentUser = null;
      localStorage.removeItem('pizzaflow_admin_logged');
      listeners.forEach(cb => cb(null));
    }
  },

  /**
   * Retorna usuário autenticado
   */
  getCurrentUser() {
    return currentUser;
  },

  /**
   * Verifica se está autenticado
   */
  isAuthenticated() {
    return !!currentUser;
  },

  /**
   * Retorna se a sessão inicial foi verificada
   */
  isReady() {
    return authChecked;
  }
};
