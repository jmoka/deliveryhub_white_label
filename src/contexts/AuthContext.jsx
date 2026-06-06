import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Get initial session - Use Promise chain
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        }
        setLoading(false)
      })?.catch((error) => {
        setAuthError('Failed to get session. Please check your Supabase connection.')
        setLoading(false)
      })

    // Listen for auth changes - NEVER ASYNC callback
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
        setAuthError(null)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchUserProfile = (userId) => {
    supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()?.then(({ data, error }) => {
        if (error) {
          setAuthError(`Failed to fetch user profile: ${error?.message}`)
          return
        }
        setUserProfile(data)
      })
  }

  const signIn = async (email, password) => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.')
        return { success: false, error: 'Connection failed' }
      }
      
      setAuthError('Something went wrong. Please try again.')
      return { success: false, error: 'Authentication failed' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, userData = {}) => {
    setAuthError(null)
    setLoading(true)
    
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
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.')
        return { success: false, error: 'Connection failed' }
      }
      
      setAuthError('Something went wrong. Please try again.')
      return { success: false, error: 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase?.auth?.signOut()
      if (error) {
        setAuthError(error?.message)
      }
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      setAuthError('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setAuthError(null)

  const isAdmin = () => {
    return userProfile?.role === 'admin'
  }

  const isRestaurantOwner = () => {
    return userProfile?.role === 'restaurant_owner'
  }

  const isAuthenticated = () => {
    return !!user
  }

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    clearError,
    isAdmin,
    isRestaurantOwner,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider