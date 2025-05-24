import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { Order, Position, User } from './types';
import { updateUserBalance } from './auth';

// Create a new order
export const createOrder = async (
  userId: string,
  market: string,
  positionType: 'Buy' | 'Sell',
  amount: number,
  entryPrice: number,
  orderType: 'market' | 'limit' = 'market'
): Promise<Order | null> => {
  try {
    // Ensure all required fields are present and match the schema
    const newOrder = {
      id: uuidv4(),
      user_id: userId,
      market,
      position_type: positionType,
      amount: amount.toString(), // Convert to string for numeric type
      entry_price: entryPrice.toString(), // Convert to string for numeric type
      order_type: orderType,
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order:', error);
      return null;
    }
    
    // Update user balance
    const totalCost = amount * entryPrice;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('current_balance')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user for balance update:', userError);
      return data as Order;
    }
    
    const newBalance = positionType === 'Buy' 
      ? (userData as User).current_balance - totalCost
      : (userData as User).current_balance + totalCost;
    
    await updateUserBalance(userId, newBalance, (userData as User).current_pnl);
    
    // Create a new position if it's a buy order
    if (positionType === 'Buy') {
      await createPosition(userId, market, amount, entryPrice);
    }
    
    return data as Order;
  } catch (error) {
    console.error('Error in createOrder:', error);
    return null;
  }
};

// Get user's orders
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
    
    // Convert numeric strings back to numbers
    return (data as Order[]).map(order => ({
      ...order,
      amount: parseFloat(order.amount as unknown as string),
      entry_price: parseFloat(order.entry_price as unknown as string)
    }));
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return [];
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: 'filled' | 'cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return false;
  }
};

// Create a new position
export const createPosition = async (
  userId: string,
  market: string,
  amount: number,
  entryPrice: number
): Promise<Position | null> => {
  try {
    const newPosition: Omit<Position, 'id' | 'current_price' | 'pnl'> & { id: string } = {
      id: uuidv4(),
      user_id: userId,
      market,
      amount,
      entry_price: entryPrice,
      is_open: true
    };
    
    const { error } = await supabase
      .from('active_positions')
      .insert({
        ...newPosition,
        current_price: entryPrice,
        pnl: 0
      });
    
    if (error) {
      console.error('Error creating position:', error);
      return null;
    }
    
    return {
      ...newPosition,
      current_price: entryPrice,
      pnl: 0
    };
  } catch (error) {
    console.error('Error in createPosition:', error);
    return null;
  }
};

// Update position with current price and PnL
export const updatePosition = async (
  positionId: string,
  currentPrice: number
): Promise<boolean> => {
  try {
    const { data, error: fetchError } = await supabase
      .from('active_positions')
      .select('*')
      .eq('id', positionId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching position for update:', fetchError);
      return false;
    }
    
    const position = data as Position;
    const pnl = (currentPrice - position.entry_price) * position.amount;
    
    const { error: updateError } = await supabase
      .from('active_positions')
      .update({
        current_price: currentPrice,
        pnl
      })
      .eq('id', positionId);
    
    if (updateError) {
      console.error('Error updating position:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updatePosition:', error);
    return false;
  }
};

// Get user's active positions
export const getUserPositions = async (userId: string): Promise<Position[]> => {
  try {
    const { data, error } = await supabase
      .from('active_positions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_open', true);
    
    if (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
    
    return data as Position[];
  } catch (error) {
    console.error('Error in getUserPositions:', error);
    return [];
  }
};

// Close a position
export const closePosition = async (
  positionId: string,
  closePrice: number
): Promise<boolean> => {
  try {
    const { data, error: fetchError } = await supabase
      .from('active_positions')
      .select('*')
      .eq('id', positionId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching position for closing:', fetchError);
      return false;
    }
    
    const position = data as Position;
    const finalPnl = (closePrice - position.entry_price) * position.amount;
    
    // Create a sell order
    await createOrder(
      position.user_id,
      position.market,
      'Sell',
      position.amount,
      closePrice
    );
    
    // Update user balance with profit/loss
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('current_balance, current_pnl')
      .eq('id', position.user_id)
      .single();
    
    if (userError) {
      console.error('Error fetching user for balance update on position close:', userError);
      return false;
    }
    
    const user = userData as User;
    const newBalance = user.current_balance + (position.amount * closePrice) + finalPnl;
    const newPnl = user.current_pnl + finalPnl;
    
    await updateUserBalance(position.user_id, newBalance, newPnl);
    
    // Close the position
    const { error: updateError } = await supabase
      .from('active_positions')
      .update({
        is_open: false,
        current_price: closePrice,
        pnl: finalPnl
      })
      .eq('id', positionId);
    
    if (updateError) {
      console.error('Error closing position:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in closePosition:', error);
    return false;
  }
};