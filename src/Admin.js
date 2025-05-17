import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import CONFIG from "../config";

const Admin = ({ navigation,route }) => {
  const { adminId } = route.params; 
  const { deviceToken } =route.params;
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = () => {
    setLoading(true);
    fetch(`${CONFIG.API_BASE_URL}/admins/${adminId}/food-items`)
      .then((response) => response.json())
      .then((data) => setFoodItems(data))
      .catch((error) =>
        console.error("Error fetching food items:", error.message)
      )
      .finally(() => setLoading(false));
  };

  const toggleAvailability = (id) => {
    const item = foodItems.find((item) => item.id === id);
    if (item) {
      // Send availability toggle to backend (assuming PUT supported here)
      fetch(`${CONFIG.API_BASE_URL}/food-items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ available: !item.available }),
      })
        .then((response) => response.json())
        .then(() => {
          setFoodItems((prevItems) =>
            prevItems.map((item) =>
              item.id === id
                ? { ...item, available: !item.available }
                : item
            )
          );
        })
        .catch((error) => {
          console.error("Error updating availability:", error.message);
        });
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => {
          // Call API to delete token
          fetch(`${CONFIG.API_BASE_URL}/delete-token`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: deviceToken }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
              } else {
                console.warn("Token deletion failed");
              }
            })
            .catch((err) => {
              console.warn("Error during token deletion:", err);
            })
            .finally(() => {
              navigation.navigate("AdminLogin");
            });
        },
      },
    ]);
  };
  

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  
  return (
    <View style={styles.container}>
       <Text style={styles.navText}></Text>
        <Text style={styles.navText}></Text>
      <FlatList
        data={foodItems}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false} 
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
              <TouchableOpacity
                onPress={() => toggleAvailability(item.id)}
                style={[
                  styles.availabilityButton,
                  {
                    backgroundColor: item.available ? "#4CAF50" : "#F44336",
                  },
                ]}
              >
                <Text style={styles.availabilityButtonText}>
                  {item.available ? "✔️ Available" : "❌ Not Available"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminOrders",{ adminId })}
          style={styles.navButton}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.navIcon}>📋</Text>
          </View>
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("AdminNewItem",{ adminId })}
          style={styles.navButton}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.navIcon}>➕</Text>
          </View>
          <Text style={styles.navText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminDashboard", { adminId })}
          style={styles.navButton}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.navIcon}>📊</Text>
          </View>
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.navButton}>
          <View style={styles.iconContainer}>
            <Text style={styles.navIcon}>🚪</Text>
          </View>
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ff8c00",
  },
  listContainer: {
    paddingBottom: 70,
  },
  item: {
    flexDirection: "row",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  itemDescription: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  itemPrice: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
  },
  availabilityButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  availabilityButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#ffff",
    borderRadius: 0,
    marginBottom: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#ffff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  navIcon: {
    fontSize: 20,
    marginTop: 2,

  },
  navText: {
    fontSize: 12,
    color: "#333",
    marginTop: 2,
  },
});

export default Admin;
