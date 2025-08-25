import { supabase } from '../lib/supabase';

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

  // Reset password
  async resetPassword(email) {
    try {
      const { data, error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/reset-password`,
      })
      
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Password reset failed' }
    }
  }
}

export default authService