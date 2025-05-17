import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import CONFIG from "../config";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = ({ route }) => {
  const { userId } = route.params;
  const { deviceToken } = route.params;
  const [restaurants, setRestaurants] = useState([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = React.useRef(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/restaurants`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }

        const data = await response.json();
        setRestaurants(data);
        setFeaturedRestaurants(data.slice(0, 5));
        const uniqueLocations = [
          ...new Set(data.map((restaurant) => restaurant.restaurant_location)),
        ];
        setLocations(uniqueLocations);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const autoScroll = setInterval(() => {
      if (featuredRestaurants.length > 0) {
        const nextIndex = (currentIndex + 1) % featuredRestaurants.length;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * 400, // Adjust this value based on your card width + margin
          animated: true,
        });
      }
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(autoScroll);
  }, [currentIndex, featuredRestaurants]);

  const handleNavigate = (screen) => {
    navigation.navigate(screen);
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
              navigation.navigate("Login");
            });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Home</Text>

          {/* Featured Restaurants Section */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            style={styles.featuredContainer}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / 360
              );
              setCurrentIndex(newIndex);
            }}
          >
            {featuredRestaurants.map((item, index) => (
              <TouchableOpacity
                key={item._id?.toString() ?? index.toString()}
                style={styles.featuredCard}
                onPress={() =>
                  navigation.navigate("UserFoodItemsScreen", {
                    restaurantId: item.id,
                    userId,
                  })
                }
              >
                <Image
                  source={{ uri: item.restaurant_image }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredContent}>
                  <View style={styles.featuredDetails}>
                    <Text style={styles.featuredName} numberOfLines={2}>
                      {item.restaurant_name}
                    </Text>
                    <View style={styles.featuredFooter}>
                      <View style={styles.featuredRating}>
                        <Text style={styles.ratingText}>4.5</Text>
                        <Text style={styles.starIcon}>⭐</Text>
                      </View>
                      <View style={styles.featuredTag}>
                        <Text style={styles.tagText}>Featured</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pagination dots */}
          <View style={styles.paginationDots}>
            {featuredRestaurants.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: currentIndex === index ? "#ff8c00" : "#ccc" },
                ]}
              />
            ))}
          </View>

          {/* Location Section */}
          <View style={styles.locationSection}>
            <Text style={styles.title}>Pick Your Near Location</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.locationContainer}
            >
              <TouchableOpacity
                style={[
                  styles.locationCard,
                  !selectedLocation && styles.selectedLocationCard,
                ]}
                onPress={() => setSelectedLocation(null)}
              >
                <Text style={styles.locationIcon}>🌎</Text>
                <Text style={styles.locationName}>All Locations</Text>
              </TouchableOpacity>
              {locations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationCard,
                    selectedLocation === location && styles.selectedLocationCard,
                  ]}
                  onPress={() => setSelectedLocation(location)}
                >
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationName}>{location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.title}>Restaurants</Text>

          {/* Restaurant List */}
          <View style={styles.restaurantList}>
            {(selectedLocation
              ? restaurants.filter(
                  (r) => r.restaurant_location === selectedLocation
                )
              : restaurants
            ).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("UserFoodItemsScreen", {
                    restaurantId: item.id,
                    userId,
                  })
                }
              >
                <Image
                  source={{ uri: item.restaurant_image }}
                  style={styles.image}
                />
                <View style={styles.cardContent}>
                  <View style={styles.headerContainer}>
                    <Text style={styles.restaurantName}>
                      {item.restaurant_name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>4.5</Text>
                      <Text style={styles.starIcon}>⭐</Text>
                    </View>
                  </View>
                  <View style={styles.infoContainer}>
                    <View style={styles.locationContainer}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.location}>
                        {item.restaurant_location}
                      </Text>
                    </View>
                    <View style={styles.additionalInfo}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoIcon}>⏰</Text>
                        <Text style={styles.infoText}>30-40 min</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoIcon}>🕒</Text>
                        <Text style={styles.infoText}>24/7 availability</Text>
                      </View>
                    </View>
                    <View style={styles.tagContainer}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>Popular</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>Trending</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add padding at bottom for navbar */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Navbar - Outside ScrollView to stay fixed */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Orders", { userId })}
        >
          <View style={styles.icon}>
            <Text style={styles.iconText}>📝</Text>
          </View>
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("AccountScreen", { userId })}
        >
          <View style={styles.icon}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>🚪</Text>
          </View>
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff8c00",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 70,
  },
  card: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    height: 160,
  },

  image: {
    width: 130,
    height: "100%",
    borderRadius: 15,
  },

  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 4,
    borderRadius: 8,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginRight: 2,
  },

  starIcon: {
    fontSize: 12,
  },

  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },

  location: {
    fontSize: 14,
    color: "#95a5a6",
  },

  additionalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },

  infoText: {
    fontSize: 12,
    color: "#7f8c8d",
  },

  tagContainer: {
    flexDirection: "row",
    gap: 8,
  },

  tag: {
    backgroundColor: "#fff3e6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffd700",
  },

  tagText: {
    fontSize: 12,
    color: "#ff8c00",
    fontWeight: "600",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#ff8c00",
  },

  scrollContainer: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
  },

  restaurantList: {
    marginTop: 10,
  },

  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  
  navItem: {
    alignItems: "center",
  },
  
  icon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -4,
  },
  
  iconText: {
    fontSize: 20,
    color: "#ff8c00",
  },
  
  navText: {
    color: "#333",
    fontSize: 12,
  },
  error: {
    color: "red",
    fontSize: 18,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },

  featuredContainer: {
    height: 380,
    marginBottom: 10,
  },

  featuredCard: {
    width: 380,
    height: 360,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    elevation:    8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
  },

  featuredImage: {
    width: "100%",
    height: 270, // Larger image
    resizeMode: "cover",
  },

  featuredContent: {
    padding: 2,
  },

  featuredDetails: {
    gap: 0,
  },

  featuredName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
    marginLeft: 10,
  },

  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  featuredRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 6,
    borderRadius: 12,
    marginLeft: 10,
  },

  featuredTag: {
    backgroundColor: "#fff3e6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffd700",
    marginRight: 10,
  },

  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
    paddingHorizontal: 10,
  },
  locationSection: {
    marginBottom: 20,
  },

  locationContainer: {
    flexDirection: "row",
    paddingVertical: 10,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 15,
    marginRight: 12,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  selectedLocationCard: {
    backgroundColor: "#fff3e6",
    borderColor: "#ff8c00",
    borderWidth: 2,
  },

  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  locationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },

  noRestaurantsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  noRestaurantsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 5,
  },

  currentLocation: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#ffff",
  },

  headerText: {
    fontSize: 20,
    color: "#333",
  },

  accountIcon: {
    fontSize: 20,
    color: "#ffffff",
  },
});

export default HomeScreen;