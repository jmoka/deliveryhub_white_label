import { supabase } from '../lib/supabase';

// Restaurant Service for managing restaurant data
export const restaurantService = {
  // Get all restaurants with public access
  async getRestaurants() {
    try {
      const { data, error } = await supabase?.from('restaurants')?.select(`
          id,
          name,
          address,
          logo_url,
          business_hours,
          payment_config,
          created_at,
          updated_at
        `)?.order('created_at', { ascending: false })
      
      if (error) return { success: false, error: error?.message };
      return { success: true, restaurants: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch restaurants' }
    }
  },

  // Get single restaurant by ID
  async getRestaurant(restaurantId) {
    try {
      const { data, error } = await supabase?.from('restaurants')?.select(`
          id,
          name,
          address,
          logo_url,
          business_hours,
          payment_config,
          created_at,
          updated_at
        `)?.eq('id', restaurantId)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, restaurant: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch restaurant' }
    }
  },

  // Create new restaurant (Admin only)
  async createRestaurant(restaurantData) {
    try {
      const { data, error } = await supabase?.from('restaurants')?.insert([{
          name: restaurantData?.name,
          address: restaurantData?.address,
          logo_url: restaurantData?.logo_url,
          business_hours: restaurantData?.business_hours,
          payment_config: restaurantData?.payment_config,
        }])?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, restaurant: data }
    } catch (error) {
      return { success: false, error: 'Failed to create restaurant' }
    }
  },

  // Update restaurant (Admin only)
  async updateRestaurant(restaurantId, restaurantData) {
    try {
      const { data, error } = await supabase?.from('restaurants')?.update(restaurantData)?.eq('id', restaurantId)?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, restaurant: data }
    } catch (error) {
      return { success: false, error: 'Failed to update restaurant' }
    }
  },

  // Delete restaurant (Admin only)
  async deleteRestaurant(restaurantId) {
    try {
      const { error } = await supabase?.from('restaurants')?.delete()?.eq('id', restaurantId)
      
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete restaurant' }
    }
  }
}

export default restaurantService