import { supabase } from '../lib/supabase';

// Order Service for managing orders and order items
export const orderService = {
  // Get user's orders
  async getUserOrders(userId) {
    try {
      const { data, error } = await supabase?.from('orders')?.select(`
          id,
          customer_id,
          restaurant_id,
          total,
          status,
          payment_method,
          created_at,
          updated_at,
          customers (
            id,
            name,
            email,
            phone_e164
          ),
          restaurants (
            id,
            name,
            address,
            logo_url
          ),
          order_items (
            id,
            quantity,
            unit_price,
            products (
              id,
              name,
              description,
              image_url
            )
          )
        `)?.eq('user_id', userId)?.order('created_at', { ascending: false })
      
      if (error) return { success: false, error: error?.message };
      return { success: true, orders: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch user orders' }
    }
  },

  // Get all orders (Admin only)
  async getAllOrders(filters = {}) {
    try {
      let query = supabase?.from('orders')?.select(`
          id,
          customer_id,
          restaurant_id,
          total,
          status,
          payment_method,
          created_at,
          updated_at,
          customers (
            id,
            name,
            email,
            phone_e164
          ),
          restaurants (
            id,
            name,
            address,
            logo_url
          ),
          order_items (
            id,
            quantity,
            unit_price,
            products (
              id,
              name,
              description,
              image_url
            )
          )
        `)?.order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.status) {
        query = query?.eq('status', filters?.status)
      }
      
      if (filters?.restaurantId) {
        query = query?.eq('restaurant_id', filters?.restaurantId)
      }
      
      if (filters?.startDate) {
        query = query?.gte('created_at', filters?.startDate)
      }
      
      if (filters?.endDate) {
        query = query?.lte('created_at', filters?.endDate)
      }
      
      const { data, error } = await query
      
      if (error) return { success: false, error: error?.message };
      return { success: true, orders: data || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch all orders' }
    }
  },

  // Get single order by ID
  async getOrder(orderId) {
    try {
      const { data, error } = await supabase?.from('orders')?.select(`
          id,
          customer_id,
          restaurant_id,
          total,
          status,
          payment_method,
          created_at,
          updated_at,
          customers (
            id,
            name,
            email,
            phone_e164,
            address_json
          ),
          restaurants (
            id,
            name,
            address,
            logo_url,
            business_hours,
            payment_config
          ),
          order_items (
            id,
            quantity,
            unit_price,
            products (
              id,
              name,
              description,
              image_url,
              price
            )
          )
        `)?.eq('id', orderId)?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, order: data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch order' }
    }
  },

  // Create new order
  async createOrder(orderData) {
    try {
      // Create the main order
      const { data: orderResult, error: orderError } = await supabase?.from('orders')?.insert([{
          customer_id: orderData?.customer_id,
          restaurant_id: orderData?.restaurant_id,
          total: orderData?.total,
          status: orderData?.status || 'pending',
          payment_method: orderData?.payment_method,
          user_id: orderData?.user_id
        }])?.select()?.single()
      
      if (orderError) return { success: false, error: orderError?.message };
      
      // Create order items if provided
      if (orderData?.items?.length > 0) {
        const orderItems = orderData?.items?.map(item => ({
          order_id: orderResult?.id,
          product_id: item?.product_id,
          quantity: item?.quantity,
          unit_price: item?.unit_price
        }))
        
        const { error: itemsError } = await supabase?.from('order_items')?.insert(orderItems)
        
        if (itemsError) return { success: false, error: itemsError?.message };
      }
      
      // Return the complete order
      return await this.getOrder(orderResult?.id);
    } catch (error) {
      return { success: false, error: 'Failed to create order' }
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase?.from('orders')?.update({ 
          status,
          updated_at: new Date()?.toISOString()
        })?.eq('id', orderId)?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, order: data }
    } catch (error) {
      return { success: false, error: 'Failed to update order status' }
    }
  },

  // Update order payment method
  async updateOrderPaymentMethod(orderId, paymentMethod) {
    try {
      const { data, error } = await supabase?.from('orders')?.update({ 
          payment_method: paymentMethod,
          updated_at: new Date()?.toISOString()
        })?.eq('id', orderId)?.select()?.single()
      
      if (error) return { success: false, error: error?.message };
      return { success: true, order: data }
    } catch (error) {
      return { success: false, error: 'Failed to update payment method' }
    }
  },

  // Delete order (Admin only)
  async deleteOrder(orderId) {
    try {
      const { error } = await supabase?.from('orders')?.delete()?.eq('id', orderId)
      
      if (error) return { success: false, error: error?.message };
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete order' }
    }
  },

  // Get order statistics (Admin only)
  async getOrderStatistics(filters = {}) {
    try {
      let query = supabase?.from('orders')?.select('status, total, created_at')
      
      if (filters?.startDate) {
        query = query?.gte('created_at', filters?.startDate)
      }
      
      if (filters?.endDate) {
        query = query?.lte('created_at', filters?.endDate)
      }
      
      const { data, error } = await query
      
      if (error) return { success: false, error: error?.message };
      
      // Calculate statistics
      const stats = {
        total_orders: data?.length || 0,
        total_revenue: data?.reduce((sum, order) => sum + (order?.total || 0), 0) || 0,
        pending_orders: data?.filter(order => order?.status === 'pending')?.length || 0,
        completed_orders: data?.filter(order => order?.status === 'completed')?.length || 0,
        canceled_orders: data?.filter(order => order?.status === 'canceled')?.length || 0,
        average_order_value: 0
      }
      
      if (stats?.total_orders > 0) {
        stats.average_order_value = stats?.total_revenue / stats?.total_orders
      }
      
      return { success: true, statistics: stats }
    } catch (error) {
      return { success: false, error: 'Failed to get order statistics' }
    }
  }
}

export default orderService