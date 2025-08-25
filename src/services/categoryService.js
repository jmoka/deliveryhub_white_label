import { supabase } from '../lib/supabase';

// Category Service for managing product categories
export const categoryService = {
  // Get all categories (Public access)
  async getCategories(restaurantId = null) {
    try {
      let query = supabase?.from('categories')?.select(`
          id,
          name,
          restaurant_id,
          created_at,
          updated_at
        `)?.order('name', { ascending: true })
      
      // Filter by restaurant if specified
      if (restaurantId) {
        query = query?.eq('restaurant_id', restaurantId)
      }
      
      const { data, error } = await query
      
      if (error) return { success: false, error: error?.message };
      return { success: true, categories: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch categories' }
    }
  },

  // Get single category by ID
  async getCategory(categoryId) {
    try {
      const { data, error } = await supabase?.from('categories')?.select(`
          id,
          name,
          restaurant_id,
          created_at,
          updated_at
        `)?.eq('id', categoryId)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, category: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch category' }
    }
  },

  // Get categories with product counts
  async getCategoriesWithProductCount(restaurantId = null) {
    try {
      let query = supabase?.from('categories')?.select(`
          id,
          name,
          restaurant_id,
          created_at,
          updated_at,
          products!inner (
            count
          )
        `)?.order('name', { ascending: true })
      
      // Filter by restaurant if specified
      if (restaurantId) {
        query = query?.eq('restaurant_id', restaurantId)
      }
      
      const { data, error } = await query
      
      if (error) return { success: false, error: error?.message };
      
      // Process data to include product count
      const processedData = data?.map(category => ({
        ...category,
        product_count: category?.products?.length || 0,
        products: undefined // Remove the products array
      })) || []
      
      return { success: true, categories: processedData }
    } catch (error) {
      return { success: false, error: 'Failed to fetch categories with counts' }
    }
  },

  // Create new category (Admin only)
  async createCategory(categoryData) {
    try {
      const { data, error } = await supabase?.from('categories')?.insert([{
          name: categoryData?.name,
          restaurant_id: categoryData?.restaurant_id
        }])?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, category: data }
    } catch (error) {
      return { success: false, error: 'Failed to create category' }
    }
  },

  // Update category (Admin only)
  async updateCategory(categoryId, categoryData) {
    try {
      const { data, error } = await supabase?.from('categories')?.update(categoryData)?.eq('id', categoryId)?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, category: data }
    } catch (error) {
      return { success: false, error: 'Failed to update category' }
    }
  },

  // Delete category (Admin only)
  async deleteCategory(categoryId) {
    try {
      const { error } = await supabase?.from('categories')?.delete()?.eq('id', categoryId)
      
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete category' }
    }
  }
}

export default categoryService