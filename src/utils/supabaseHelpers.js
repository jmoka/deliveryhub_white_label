import { supabase } from '../lib/supabase';

// Supabase helper utilities
export const supabaseHelpers = {
  // Format phone number to E.164 format
  formatPhoneToE164(phoneNumber, countryCode = '+55') {
    if (!phoneNumber) return null
    
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '')
    
    // If it starts with country code digits, use as is
    if (digits.startsWith('55') && digits.length >= 12) {
      return parseInt(digits, 10)
    }
    
    // Otherwise, add Brazilian country code
    const fullNumber = `55${digits}`
    return parseInt(fullNumber, 10)
  },

  // Format E.164 phone back to display format
  formatPhoneForDisplay(e164Phone) {
    if (!e164Phone) return ''
    
    const phoneStr = e164Phone.toString()
    
    // Brazilian phone: +55 (11) 99999-9999
    if (phoneStr.startsWith('55') && phoneStr.length >= 12) {
      const areaCode = phoneStr.substring(2, 4)
      const firstPart = phoneStr.substring(4, 9)
      const secondPart = phoneStr.substring(9)
      return `+55 (${areaCode}) ${firstPart}-${secondPart}`
    }
    
    return `+${phoneStr}`
  },

  // Parse address JSON safely
  parseAddress(addressJson) {
    if (!addressJson) return {}
    
    try {
      if (typeof addressJson === 'string') {
        return JSON.parse(addressJson)
      }
      return addressJson
    } catch (error) {
      return {}
    }
  },

  // Format address for display
  formatAddressForDisplay(addressJson) {
    const address = this.parseAddress(addressJson)
    
    if (!address || typeof address !== 'object') return ''
    
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.number) parts.push(address.number)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zip) parts.push(address.zip)
    
    return parts.join(', ')
  },

  // Format currency (Brazilian Real)
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'R$ 0,00'
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  },

  // Format date for display
  formatDate(dateString, options = {}) {
    if (!dateString) return ''
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    
    return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options })
      .format(new Date(dateString))
  },

  // Format date for API (ISO string)
  formatDateForAPI(date) {
    if (!date) return null
    return new Date(date).toISOString()
  },

  // Check if user has role
  checkUserRole(userProfile, requiredRole) {
    return userProfile?.role === requiredRole
  },

  // Check if user is admin
  isAdmin(userProfile) {
    return this.checkUserRole(userProfile, 'admin')
  },

  // Check if user is customer
  isCustomer(userProfile) {
    return this.checkUserRole(userProfile, 'customer')
  },

  // Generate error message for Supabase errors
  getErrorMessage(error, defaultMessage = 'Something went wrong') {
    if (!error) return defaultMessage
    
    // Handle specific Supabase error codes
    switch (error.code) {
      case 'PGRST116':
        return 'Record not found'
      case '23505':
        return 'This record already exists'
      case '23503':
        return 'This action would violate data constraints'
      case '42501':
        return 'You do not have permission to perform this action'
      case 'auth/user-not-found':
        return 'User not found'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'Email already in use'
      case 'auth/weak-password':
        return 'Password is too weak'
      case 'auth/invalid-email':
        return 'Invalid email address'
      default:
        return error.message || defaultMessage
    }
  },

  // Handle real-time subscriptions
  createRealtimeSubscription(table, callback, filters = {}) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          ...filters
        },
        callback
      )
      .subscribe()
    
    return channel
  },

  // Remove real-time subscription
  removeRealtimeSubscription(channel) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  },

  // Upload file to Supabase Storage
  async uploadFile(bucket, path, file, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        })
      
      if (error) return { success: false, error: error.message }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'File upload failed' }
    }
  },

  // Get public URL for uploaded file
  getPublicUrl(bucket, path) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      
      return data?.publicUrl || null
    } catch (error) {
      return null
    }
  },

  // Delete file from storage
  async deleteFile(bucket, paths) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(Array.isArray(paths) ? paths : [paths])
      
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'File deletion failed' }
    }
  }
}

export default supabaseHelpers