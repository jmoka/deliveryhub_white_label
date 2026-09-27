import { supabase } from '../lib/supabase';
import { apiPath } from '../lib/apiUrl';

// Authentication Service for Supabase integration
export const authService = {
  // Get current user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase?.auth?.getSession()
      if (error) return { success: false, error: error?.message };
      return { success: true, session }
    } catch (error) {
      return { success: false, error: 'Failed to get session' }
    }
  },

  // Get current user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()
        
      if (error) return { success: false, error: error?.message };
      return { success: true, profile: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch user profile' }
    }
  },

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(profileData)?.eq('id', userId)?.select()?.single()
        
      if (error) return { success: false, error: error?.message };
      return { success: true, profile: data }
    } catch (error) {
      return { success: false, error: 'Failed to update profile' }
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })
      
      if (error) return { success: false, error: error?.message };
      return { success: true, user: data?.user, session: data?.session };
    } catch (error) {
      return { success: false, error: 'Sign in failed' }
    }
  },

  // Sign up new user
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            name: userData?.name || email?.split('@')?.[0],
            role: userData?.role || 'customer',
            ...userData
          }
        }
      })
      
      if (error) return { success: false, error: error?.message };
      return { success: true, user: data?.user, session: data?.session };
    } catch (error) {
      return { success: false, error: 'Sign up failed' }
    }
  },

  // Sign out current user
  async signOut() {
    try {
      const { error } = await supabase?.auth?.signOut()
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Sign out failed' }
    }
  },

  // Update password of the currently authenticated user
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase?.auth?.updateUser({ password: newPassword })
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Password update failed' }
    }
  },

  // Update email of the currently authenticated user — dispara a confirmação
  // nativa do Supabase (double opt-in se "Secure email change" estiver
  // ativo no projeto). user_profiles.email é sincronizado por trigger de
  // banco (on_auth_user_email_updated) depois que a troca é confirmada.
  async updateEmail(newEmail) {
    try {
      const { error } = await supabase?.auth?.updateUser({ email: newEmail })
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Email update failed' }
    }
  },

  // Reset password — via backend (auth-principal/recuperar-senha): usa o
  // e-mail de segurança verificado quando a conta tem um configurado (não
  // depende do e-mail de login, que pode ser fake); sem isso, cai no fluxo
  // nativo do Supabase (mesmo comportamento de sempre, sem regressão).
  async resetPassword(email) {
    try {
      const res = await fetch(apiPath('/api/auth-principal/recuperar-senha'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
      const body = isJson ? await res.json().catch(() => ({})) : {};
      if (!res.ok) return { success: false, error: body?.message ?? `HTTP ${res.status}` };
      return { success: true, modo: body.modo, resetId: body.reset_id };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  },

  // Segundo passo do fluxo por e-mail de segurança (modo === 'seguranca').
  async confirmarRecuperacaoSenha(resetId, codigo, novaSenha) {
    try {
      const res = await fetch(apiPath('/api/auth-principal/recuperar-senha/confirmar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_id: resetId, codigo, nova_senha: novaSenha }),
      });
      const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
      const body = isJson ? await res.json().catch(() => ({})) : {};
      if (!res.ok) return { success: false, error: body?.message ?? `HTTP ${res.status}` };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  },
}

export default authService