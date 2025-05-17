import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  TouchableOpacity 
} from "react-native";
import CONFIG from "../config";

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 cards per row with padding

const AdminDashboard = ({ route }) => {
  const { adminId } = route.params;
  const [orderCounts, setOrderCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/orders`);
      const allOrders = await response.json();
      const today = new Date().toLocaleDateString("en-IN");  
      // console.log("Today's Date:", today);

      const todaysOrders = allOrders.filter((order) => {
        const orderDate = new Date(order.date).toLocaleDateString("en-IN");
        // console.log("Order Date:", orderDate);

        return (
          order.admin_id?.toString() === adminId.toString() &&
          orderDate === today
        );
      });

      const counts = {};
      let totalSalesAmount = 0;
      let totalOrderCount = 0;

      todaysOrders.forEach((order) => {
        // Sum total sales amount
        totalSalesAmount += order.amount || 0;
        totalOrderCount++;

        // Count item quantities
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach((item) => {
          if (counts[item.name]) {
            counts[item.name] += item.quantity;
          } else {
            counts[item.name] = item.quantity;
          }
        });
      });

      // Calculate average order value
      const averageOrderValue = totalOrderCount > 0 
        ? totalSalesAmount / totalOrderCount 
        : 0;

      setOrderCounts(counts);
      setTotalSales(totalSalesAmount);
      setOrderStats({
        totalOrders: totalOrderCount,
        averageOrderValue: averageOrderValue
      });

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const data = Object.entries(orderCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const getCardStyle = (index) => {
    const colorSchemes = [
      ['#6A5ACD', '#483D8B'],
      ['#4CAF50', '#2E7D32'],
      ['#FF5722', '#F4511E'],
      ['#2196F3', '#1565C0']
    ];
    const colorIndex = index % colorSchemes.length;
    return {
      backgroundColor: colorSchemes[colorIndex][0],
      borderBottomColor: colorSchemes[colorIndex][1],
    };
  };

  const renderCard = ({ item, index }) => (
    <TouchableOpacity style={styles.cardContainer}>
      <View 
        style={[
          styles.card, 
          getCardStyle(index),
          styles.cardShadow
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>📊</Text>
          </View>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemCount}>Sold: {item.count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Today's Sales Dashboard</Text>
        
        {/* Sales Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <View style={styles.totalSalesCard}>
            <Text style={styles.totalSalesIcon}>💰</Text>
            <View>
              <Text style={styles.totalSalesLabel}>Total Sales</Text>
              <Text style={styles.totalSalesText}>
                {totalSales.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.totalSalesCard}>
            <Text style={styles.totalSalesIcon}>🛒</Text>
            <View>
              <Text style={styles.totalSalesLabel}>Total Orders</Text>
              <Text style={styles.totalSalesText}>
                {orderStats.totalOrders}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.totalSalesCard}>
          <Text style={styles.totalSalesIcon}>📈</Text>
          <View>
            <Text style={styles.totalSalesLabel}>Avg. Order Value</Text>
            <Text style={styles.totalSalesText}>
              {orderStats.averageOrderValue.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
      
      <FlatList
        data={data}
        keyExtractor={(item) => item.name}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders placed today.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff8c00",
    paddingTop: 50,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  totalSalesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F3FF',
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    width: '48%', // Adjusted for two cards in a row
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalSalesIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  totalSalesLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalSalesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: cardWidth,
  },
  card: {
    borderRadius: 15,
    padding: 15,
    borderBottomWidth: 5,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIconContainer: {
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 10,
  },
  cardIcon: {
    fontSize: 30,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  emptyText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 50,
  },
});

export default AdminDashboard;