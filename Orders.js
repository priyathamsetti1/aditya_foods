import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import CONFIG from "../config";

const { width, height } = Dimensions.get('window');

const Orders = () => {
  const route = useRoute();
  const { userId } = route.params;
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchRestaurants(), fetchOrders()]);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/restaurants`);
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch restaurants',
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/orders`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const filteredOrders = data.filter((order) => order.ordered_person_id === userId);
        setOrders(filteredOrders);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid data format from server',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch orders',
      });
    }
  };

  const renderOrderItem = ({ item }) => {
    const restaurant = restaurants.find((rest) => rest.id === item.admin_id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIdContainer}>
            <Icon name="receipt-outline" size={20} color="#4a4a4a" />
            <Text style={styles.title}>  Order Id #{item.id}</Text>
          </View>
          <View style={styles.statusBadge}>]]
            <Text style={styles.statusText}>
              {item.status === "pending" ? "Pending" : "Completed"}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <DetailRow 
            icon="person-outline" 
            text={`Ordered Person ID: ${item.ordered_person_id}`} 
          />
          <DetailRow 
            icon="call-outline" 
            text={`Phone: ${item.phone_number}`} 
          />
          <DetailRow 
            icon="cash-outline" 
            text={`Amount: ₹${item.amount}`} 
          />
          
          {restaurant && (
            <>
              <DetailRow 
                icon="restaurant-outline" 
                text={`Restaurant Name: ${restaurant.restaurant_name}`} 
              />
              <DetailRow 
                icon="location-outline" 
                text={`Restaurant Address: ${restaurant.restaurant_location}`} 
              />
            </>
          )}
          
          <DetailRow 
            icon="key-outline" 
            text={`OTP: ${item.otp}`} 
          />
        </View>

        <OrderItemsList items={item.items} />
      </View>
    );
  };

  const DetailRow = ({ icon, text }) => (
    <View style={styles.detailRow}>
      <Icon name={icon} size={18} color="#666" />
      <Text style={styles.detailText}> {text}</Text>
    </View>
  );

  const OrderItemsList = ({ items }) => (
    <View style={styles.itemsSection}>
      <Text style={styles.itemsTitle}>Order Items:</Text>
      {items.map((food, index) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.itemDetails}>
            <Icon name="restaurant-outline" size={16} color="#444" />
            <Text style={styles.itemName}> {food.name}</Text>
          </View>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>× {food.quantity}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const LoadingComponent = () => (
    <View style={styles.loaderContainer}>
    <LottieView
      source={require("../assets/screen-20250416-02345221744828316.json")}
      autoPlay
      loop
      style={{ width: 200, height: 200 }}
    />
    {/* <Text style={styles.loaderText}>Loading...</Text> */}
  </View>

  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Orders</Text>
      
      {loading ? (
        <LoadingComponent />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="document-text-outline" size={50} color="#888" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff8c00',
  },
  loadingImage: {
    width: 1000,
    height: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: "#ff8c00",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#333',
  },
  orderDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  detailText: {
    color: '#666',
    fontSize: 16,
  },
  itemsSection: {
    marginTop: 10,
  },
  itemsTitle: {
    fontWeight: '2000',
    marginBottom: 5,
    color: '#333',
    fontSize: 16,
    fontWeight: "bold",

  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    color: '#444',
    fontSize: 16,
    fontWeight: "bold",

  },
  quantityBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24, 
    textAlign: 'center', 
    fontWeight: 'bold', 
    marginVertical: 10
  }
});

export default Orders;