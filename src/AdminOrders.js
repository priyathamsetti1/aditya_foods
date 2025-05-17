import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import CONFIG from "../config";

const { width } = Dimensions.get('window');

const AdminOrders = () => {
  const route = useRoute();
  const { adminId } = route.params;
  const [orders, setOrders] = useState([]);
  const [otpInputs, setOtpInputs] = useState({});
  const [view, setView] = useState("pending");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${CONFIG.API_BASE_URL}/orders`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filteredOrders = data.filter((order) => {
            return order.admin_id === Number(adminId);
          });
          setOrders(filteredOrders);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Invalid data format from server',
          });
        }
      })
      .catch((err) => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch orders',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleVerifyOTP = (orderId) => {
    const enteredOtp = otpInputs[orderId];
    fetch(`${CONFIG.API_BASE_URL}/orders/${orderId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp: enteredOtp }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetch(`${CONFIG.API_BASE_URL}/orders/${orderId}/complete`, {
            method: "PUT",
          })
            .then((res) => res.json())
            .then(() => {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Order marked as completed!',
              });
              fetchOrders();
            });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Invalid OTP',
            text2: 'Please enter a valid OTP',
          });
        }
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Verification failed',
        });
      });
  };

  const renderOrderItem = ({ item }) => {
    const isMatchingStatus =
      (view === "pending" && item.status === "pending") ||
      (view === "completed" && item.status === "completed");

    const matchesSearch =
      searchText === "" ||
      item.ordered_person_id.toString().includes(searchText);

    if (isMatchingStatus && matchesSearch) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Icon name="receipt-outline" size={20} color="#4a4a4a" />
              <Text style={styles.title}>  Order Id #{item.id}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {item.status === "pending" ? "Pending" : "Completed"}
              </Text>
            </View>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Icon name="person-outline" size={18} color="#666" />
              <Text style={styles.detailText}>
                {" "}Ordered Person ID: {item.ordered_person_id}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="call-outline" size={18} color="#666" />
              <Text style={styles.detailText}>
                {" "}Phone: {item.phone_number}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="cash-outline" size={18} color="#666" />
              <Text style={styles.detailText}> Amount: ₹{item.amount}</Text>
            </View>
          </View>

          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Order Items:</Text>
            {item.items.map((food, index) => (
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

          {view === "pending" && (
            <View style={styles.otpSection}>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP to Complete Order"
                value={otpInputs[item.id] || ""}
                onChangeText={(text) =>
                  setOtpInputs((prev) => ({ ...prev, [item.id]: text }))
                }
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => handleVerifyOTP(item.id)}
              >
                <Icon name="checkmark-done-outline" size={20} color="white" />
                <Text style={styles.verifyText}>  Verify OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Icon name="search-outline" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by Ordered Person ID"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navButton, view === "pending" && styles.activeButton]}
          onPress={() => setView("pending")}
        >
          <Icon name="time-outline" size={20} color="#333" />
          <Text style={styles.navText}>  Pending Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, view === "completed" && styles.activeButton]}
          onPress={() => setView("completed")}
        >
          <Icon name="checkmark-done-outline" size={20} color="#333" />
          <Text style={styles.navText}>  Successful Orders</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
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
  container: { 
    flex: 1, 
    backgroundColor: "#ff8c00" 
  },
  searchBar: {
    marginTop:20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
  navBar: {
    marginTop:10,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  activeButton: {
    backgroundColor: "#ffff",
  },
  navText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
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
    fontSize: 14,
  },
  itemsSection: {
    marginTop: 10,
  },
  itemsTitle: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
    fontSize : 16,
    fontWeight: 'bold',
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
    fontSize : 16,
    fontWeight: 'bold',
  },
  quantityBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  quantityText: {
    fontSize : 16,
    fontWeight: 'bold',
    color: '#666',
  },
  otpSection: {
    marginTop: 10,
  },
  otpInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default AdminOrders;