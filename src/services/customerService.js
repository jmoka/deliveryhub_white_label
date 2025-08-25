import { supabase } from '../lib/supabase';

// Customer Service for managing customer data
export const customerService = {
  // Get user's customer profile
  async getUserCustomerProfile(userId) {
    try {
      const { data, error } = await supabase?.from('customers')?.select(`
          id,
          name,
          email,
          phone_e164,
          address_json,
          notes,
          created_at,
          updated_at
        `)?.eq('user_id', userId)?.single()
      
      if (error && error?.code !== 'PGRST116') { // PGRST116 = not found
        return { success: false, error: error?.message };
      }
      
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch customer profile' }
    }
  },

  // Get all customers (Admin only)
  async getAllCustomers(filters = {}) {
    try {
      let query = supabase?.from('customers')?.select(`
          id,
          name,
          email,
          phone_e164,
          address_json,
          notes,
          created_at,
          updated_at,
          user_id
        `)?.order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.searchTerm) {
        query = query?.or(`name.ilike.%${filters?.searchTerm}%,email.ilike.%${filters?.searchTerm}%`)
      }
      
      if (filters?.startDate) {
        query = query?.gte('created_at', filters?.startDate)
      }
      
      if (filters?.endDate) {
        query = query?.lte('created_at', filters?.endDate)
      }
      
      const { data, error } = await query
      
      if (error) return { success: false, error: error?.message };
      return { success: true, customers: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch customers' }
    }
  },

  // Get single customer by ID
  async getCustomer(customerId) {
    try {
      const { data, error } = await supabase?.from('customers')?.select(`
          id,
          name,
          email,
          phone_e164,
          address_json,
          notes,
          created_at,
          updated_at,
          user_id
        `)?.eq('id', customerId)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch customer' }
    }
  },

  // Create or update customer profile
  async upsertCustomerProfile(userId, customerData) {
    try {
      const { data, error } = await supabase?.from('customers')?.upsert({
          user_id: userId,
          name: customerData?.name,
          email: customerData?.email,
          phone_e164: customerData?.phone_e164,
          address_json: customerData?.address_json,
          notes: customerData?.notes,
          updated_at: new Date()?.toISOString()
        }, {
          onConflict: 'user_id'
        })?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: 'Failed to save customer profile' }
    }
  },

  // Update customer profile
  async updateCustomerProfile(customerId, customerData) {
    try {
      const { data, error } = await supabase?.from('customers')?.update({
          ...customerData,
          updated_at: new Date()?.toISOString()
        })?.eq('id', customerId)?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: 'Failed to update customer profile' }
    }
  },

  // Delete customer (Admin only)
  async deleteCustomer(customerId) {
    try {
      const { error } = await supabase?.from('customers')?.delete()?.eq('id', customerId)
      
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete customer' }
    }
  },

  // Get customer order history
  async getCustomerOrderHistory(customerId) {
    try {
      const { data, error } = await supabase?.from('orders')?.select(`
          id,
          total,
          status,
          payment_method,
          created_at,
          updated_at,
          restaurants (
            id,
            name,
            logo_url
          ),
          order_items (
            id,
            quantity,
            unit_price,
            products (
              id,
              name,
              image_url
            )
          )
        `)?.eq('customer_id', customerId)?.order('created_at', { ascending: false })
      
      if (error) return { success: false, error: error?.message };
      return { success: true, orders: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch customer order history' }
    }
  },

  // Get customer statistics (Admin only)
  async getCustomerStatistics() {
    try {
      const { data, error } = await supabase?.from('customers')?.select('id, created_at')
      
      if (error) return { success: false, error: error?.message };
      
      const stats = {
        total_customers: data?.length || 0,
        new_customers_this_month: 0,
        new_customers_this_week: 0
      }
      
      if (data?.length > 0) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
        
        stats.new_customers_this_month = data?.filter(customer => 
          new Date(customer.created_at) >= startOfMonth
        )?.length
        
        stats.new_customers_this_week = data?.filter(customer => 
          new Date(customer.created_at) >= startOfWeek
        )?.length
      }
      
      return { success: true, statistics: stats }
    } catch (error) {
      return { success: false, error: 'Failed to get customer statistics' }
    }
  }
}

export default customerService