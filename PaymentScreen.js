import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { StyleSheet, TouchableOpacity, Text, View, Alert } from "react-native";
import React, { useEffect, useState, useContext } from "react";
import RazorpayCheckout from "react-native-razorpay";
import { useRouter } from "expo-router";
import CartContext from "../context/CartContext";
import OrdersContext from "../context/OrdersContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../axiosConfig";
import Toast from "react-native-toast-message";
// import { useNotification } from "../context/NotificationsContext";
import { Ionicons } from "@expo/vector-icons";

const PaymentScreen = () => {
  const router = useRouter();
  const [paymentHandled, setPaymentHandled] = useState(false);
  // const { expoPushToken, notification, error } = useNotification();
  const { userProfile, userToken } = useLocalSearchParams();

  const {
    cartItems,
    updateQuantity,
    calculateTotal,
    clearCart,
    currentRestaurant,
  } = useContext(CartContext);
  const { addOrder } = useContext(OrdersContext);
  const userProfileDetails = userProfile ? JSON.parse(userProfile) : {};

  useEffect(() => {
    if (
      userProfileDetails?.userId &&
      userProfileDetails?.email &&
      userProfileDetails?.phone &&
      userToken &&
      !paymentHandled
    ) {
      setPaymentHandled(true);
      handlePayment(userProfileDetails, userToken);
    }
  }, [userProfileDetails, userToken, paymentHandled]);

  const placeOrder = async (ide) => {
    // router.push("/PaymentScreen");
    console.log("into the functions");
    console.log("anteen_name", currentRestaurant);
    const newOrder = {
      userEmail: userProfileDetails.email,
      userName: userProfileDetails.name,
      userPhone: userProfileDetails.phone,
      items: cartItems
        .map((item) => `${item.name} x ${item.quantity}`)
        .join(", "),
      totalAmount: calculateTotal(),
      status: "pending",
      userToken: userToken,
      userId: userProfileDetails.userId,
      payment_id: ide,
      canteen_name: currentRestaurant,
      // canteen_name: canteen_name,
    };
    console.log("new schema loaded");

    try {
      const response = await axios.post("/place-order", newOrder);
      // if (response.data.success) {
      //   addOrder({ ...newOrder, id: response.data.id });
      //   clearCart();
      //   console.log("success order placed");
      //   // JSON.stringify(notification?.request.content.data, null, 2);
      //   router.replace("/OrdersScreen");
      //   // router.reset({
      //   //   index: 0,
      //   //   routes: [{ name: "OrdersScreen" }],
      //   // });
      // }
      if (response.data.success) {
        addOrder({ ...newOrder, id: response.data.id });

        // Defer to next render tick
        setTimeout(() => {
          clearCart();
          router.replace("/OrdersScreen");
        }, 0);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      // Alert.alert("Error", "There was an issue placing your order.");
      Toast.show({
        type: "error",
        text1: "Order Failed to Place",
      });
      router.push("/UserCartScreen");
    }
  };

  const handlePayment = (user, token) => {
    const razorpayKeyId = "rzp_test_cyicVHrZH1TfRh";

    const options = {
      description: "Pay and Enjoy the meal",
      image: "",
      currency: "INR",
      key: razorpayKeyId,
      amount: Math.ceil(calculateTotal()) * 100,
      name: "Aditya Foods",
      prefill: {
        email: user.email,
        contact: user.phone,
        name: user.name,
      },
      theme: { color: "#F37254" },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        Toast.show({
          type: "success",
          text1: "Payment Successful",
        });

        // ✅ Send complete info
        placeOrder(data.razorpay_payment_id);
        // router.push("/OrdersScreen");
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
        });
        console.log(error);
      });
  };

  // const handlePayment = () => {
  //   const razorpayKeyId = "rzp_test_cyicVHrZH1TfRh";

  //   const options = {
  //     description: "Pay and Enjoy the meal",
  //     image: "",
  //     currency: "INR",
  //     key: razorpayKeyId,
  //     amount: Math.ceil(calculateTotal()) * 100,
  //     name: "Aditya Foods",
  //     prefill: {
  //       email: userProfile.email,
  //       contact: userProfile.phone,
  //       name: userProfile.name,
  //     },
  //     theme: { color: "#F37254" },
  //   };

  //   RazorpayCheckout.open(options)
  //     .then((data) => {
  //       Toast.show({
  //         type: "success",
  //         text1: "Payment Successful",
  //       });
  //       placeOrder(data.razorpay_payment_id);
  //       // console.log(data);
  //     })
  //     .catch((error) => {
  //       Toast.show({
  //         type: "error",
  //         text1: "Payment Failed",
  //       });
  //       console.log(error);
  //     });
  // };
  if (!userProfileDetails?.email || !userToken) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }
  //  else {
  //   console.log("no id");
  //   router.replace("AuthScreen");
  // }
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC", // Light cream background
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513", // Dark brown text
    marginBottom: 30,
  },
  payButton: {
    backgroundColor: "#FF8C00", // Vibrant #ff8c00
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

// const styles = StyleSheet.create({});
