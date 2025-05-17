import React, { useEffect, useState } from "react";
import Toast from 'react-native-toast-message';

import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Animated
} from "react-native";
import CONFIG from "../config";

const UserFoodItemsScreen = ({ route, navigation }) => {
  const { userId } = route.params; 
  const { restaurantId } = route.params;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartItemCount, setCartItemCount] = useState(0);

  // Animation value for card scaling
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/food-items/${restaurantId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCartItems = async () => {
      try {
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/user-cart-items?userId=${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch cart items");
        }
    
        const cartData = await response.json();
    
        // Filter by current restaurantId
        const filteredCartData = cartData.filter(
          (item) => item.restaurant_id === restaurantId
        );
    
        const totalItems = filteredCartData.reduce(
          (total, item) => total + item.quantity,
          0
        );
        setCartItemCount(totalItems);
      } catch (err) {
        setError(err.message);
      }
    };
    

    fetchItems();
    fetchCartItems();
  }, [restaurantId, userId]);

  const handleAddToCart = async (item) => {
    // Animate the card when adding to cart
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/usercart/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          imageUrl: item.image_url,
          restaurantId:restaurantId,
          quantity: 1, 
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }
      else{
        Toast.show({
          type: 'success',
          text1: '🛒 Item added to cart!',
          text2: 'Checkout when you’re ready 😊',
          position: 'top',
        });
      }

      // Update cart item count
      setCartItemCount(cartItemCount + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderFoodItem = ({ item }) => (
    <Animated.View 
      style={[
        styles.card,
        {
          transform: [{ scale: scaleValue }]
        }
      ]}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.foodImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.priceTag}>
            <Text style={styles.price}>₹{item.price}</Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description || "No description available"}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {item.rating || "4.5"}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addButtonText}>+ Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
  
  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFoodItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Checkout", { userId , restaurantId})}
          style={styles.navButton}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.navIcon}>🛒</Text>
            {cartItemCount > 0 && (
              <View style={styles.cartCountContainer}>
                <Text style={styles.cartCountText}>
                  {cartItemCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.navText}>Checkout</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ff8c00",
  },
  listContainer: {
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  foodImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 15,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  foodName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  priceTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff8c00",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#ff8c00",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor : "#ff8c00",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
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
    position: "relative",
    alignItems: "center",
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    marginBottom: -7,
    lineHeight: 40,
    fontSize: 20,
    paddingLeft: 10,
  },
  cartCountContainer: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#9370DB",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cartCountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  navText: {
    fontSize: 12,
    color: "#333",
  },
});

export default UserFoodItemsScreen;