import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import CONFIG from '../config';
import * as Notifications from 'expo-notifications';


const Checkout = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const { restaurantId } = route.params;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user-cart-items?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart items');
      }
      const data = await response.json();
  
      // ✅ Filter items only for the current restaurant
      const filteredData = data.filter(item => item.restaurant_id === restaurantId);
  
      setCartItems(filteredData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
   
  async function sendPushNotification(expoPushToken) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'New Order Received',
      body: 'You have a new order!',
      data: { screen: 'PendingOrders' },
    };
  
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }

  const deleteCartItems = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/delete-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, restaurantId }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete cart items');
      }
        setCartItems([]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const calculateTotal = () => {
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotalAmount(total);
  };

  const handleQuantityChange = async (itemId, action) => {
    try {
      const endpoint = action === 'increase' ? '/usercart/increment-item' : '/usercart/decrement-item';
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId , restaurantId}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update item quantity');
      }

      // Re-fetch cart items to update the UI
      fetchCartItems();

      // Animate the change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty!');
      return;
    }
  
    const finalAmount = (totalAmount + 10) * 100; 
  
    const options = {
      description: 'Order Payment',
      image: 'https://drive.google.com/file/d/1zQA-5pjFI-AbDpMdajHNgqtnY4HElF0u/view?usp=drive_link', // optional
      currency: 'INR',
      key: 'rzp_test_cyicVHrZH1TfRh', 
      amount: finalAmount,
      name: 'Aditya Foods',
      prefill: {
        email: 'customer@example.com',
        contact: '9876543210',
        name: 'Customer Name',
      },
      theme: { color: '#ff8c00' },
    };
  
    RazorpayCheckout.open(options)
      .then(async (data) => {
        // Payment successful → now place order
        setLoading(true);
        try {
          const orderData = {
            items: cartItems.map(item => ({
              id: item.id,
              name: item.item_name,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount,
            orderDate: new Date().toISOString(),
            status: 'pending',
            user_id: userId,
            admin_id: restaurantId,
            payment_id: data.razorpay_payment_id,
          };
  
          const response = await fetch(`${CONFIG.API_BASE_URL}/place-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to place order');
          }
  
          const tokenResponse = await fetch(`${CONFIG.API_BASE_URL}/admin-tokens?adminId=${restaurantId}`);
          const { tokens } = await tokenResponse.json();
  
          for (const token of tokens) {
            await sendPushNotification(token);
          }
  
          Toast.show({
            type: 'success',
            text1: '✅ Order placed!',
            text2: 'Payment successful and order placed 🎉',
            position: 'top',
            visibilityTime: 2000,
            onHide: () => {
              deleteCartItems();
              navigation.navigate('Orders', { userId });
            },
          });
        } catch (error) {
          Alert.alert('Order Error', error.message);
        } finally {
          setLoading(false);
        }
      })
      .catch((error) => {
        Alert.alert('Payment Failed', error.description || 'Payment process was cancelled');
      });
  };
  

  const renderItem = ({ item }) => (
    <Animated.View style={[styles.cartItem, { opacity: fadeAnim }]}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, 'decrease')}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, 'increase')}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.itemTotal}>
        ₹{(item.price * item.quantity).toFixed(2)}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      {cartItems.length > 0 ? (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.continueShopping}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      )}

      {cartItems.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal:</Text>
            <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Platform Fee:</Text>
            <Text style={styles.summaryAmount}>₹10.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>
              ₹{(totalAmount + 10).toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeOrderText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    
    <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff8c00',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    backgroundColor: '#ff8c00',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c00',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff8c00',
  },
  placeOrderButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  continueShopping: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Checkout;