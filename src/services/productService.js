import { supabase } from '../lib/supabase';

// Product Service for managing product catalog
export const productService = {
  // Get all products with categories (Public access)
  async getProducts(filters = {}) {
    try {
      let query = supabase?.from('products')?.select(`
          id,
          name,
          description,
          price,
          image_url,
          is_active,
          category_id,
          created_at,
          updated_at,
          categories (
            id,
            name,
            restaurant_id
          )
        `)?.eq('is_active', true)
      
      // Apply filters
      if (filters?.categoryId) {
        query = query?.eq('category_id', filters?.categoryId)
      }
      
      if (filters?.searchTerm) {
        query = query?.ilike('name', `%${filters?.searchTerm}%`)
      }
      
      if (filters?.maxPrice) {
        query = query?.lte('price', filters?.maxPrice)
      }
      
      if (filters?.minPrice) {
        query = query?.gte('price', filters?.minPrice)
      }
      
      const { data, error } = await query?.order('name', { ascending: true })
      
      if (error) return { success: false, error: error?.message };
      return { success: true, products: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch products' }
    }
  },

  // Get products by restaurant
  async getProductsByRestaurant(restaurantId) {
    try {
      const { data, error } = await supabase?.from('products')?.select(`
          id,
          name,
          description,
          price,
          image_url,
          is_active,
          category_id,
          categories (
            id,
            name,
            restaurant_id
          )
        `)?.eq('categories.restaurant_id', restaurantId)?.eq('is_active', true)?.order('category_id')?.order('name')
      
      if (error) return { success: false, error: error?.message };
      return { success: true, products: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch restaurant products' }
    }
  },

  // Get single product by ID
  async getProduct(productId) {
    try {
      const { data, error } = await supabase?.from('products')?.select(`
          id,
          name,
          description,
          price,
          image_url,
          is_active,
          category_id,
          created_at,
          updated_at,
          categories (
            id,
            name,
            restaurant_id
          )
        `)?.eq('id', productId)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, product: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch product' }
    }
  },

  // Create new product (Admin only)
  async createProduct(productData) {
    try {
      const { data, error } = await supabase?.from('products')?.insert([{
          name: productData?.name,
          description: productData?.description,
          price: productData?.price,
          image_url: productData?.image_url,
          category_id: productData?.category_id,
          is_active: productData?.is_active !== undefined ? productData?.is_active : true
        }])?.select(`
          id,
          name,
          description,
          price,
          image_url,
          is_active,
          category_id,
          categories (
            id,
            name,
            restaurant_id
          )
        `)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, product: data }
    } catch (error) {
      return { success: false, error: 'Failed to create product' }
    }
  },

  // Update product (Admin only)
  async updateProduct(productId, productData) {
    try {
      const { data, error } = await supabase?.from('products')?.update(productData)?.eq('id', productId)?.select(`
          id,
          name,
          description,
          price,
          image_url,
          is_active,
          category_id,
          categories (
            id,
            name,
            restaurant_id
          )
        `)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, product: data }
    } catch (error) {
      return { success: false, error: 'Failed to update product' }
    }
  },

  // Delete product (Admin only)
  async deleteProduct(productId) {
    try {
      const { error } = await supabase?.from('products')?.delete()?.eq('id', productId)
      
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete product' }
    }
  },

  // Toggle product active status (Admin only)
  async toggleProductStatus(productId, isActive) {
    try {
      const { data, error } = await supabase?.from('products')?.update({ is_active: isActive })?.eq('id', productId)?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, product: data }
    } catch (error) {
      return { success: false, error: 'Failed to toggle product status' }
    }
  }
}

export default productService