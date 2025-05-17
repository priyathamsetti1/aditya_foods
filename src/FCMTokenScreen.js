// src/screens/FCMTokenScreen.js

import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, Clipboard, ActivityIndicator } from "react-native";
import messaging from "@react-native-firebase/messaging";

const FCMTokenScreen = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const requestPermissionAndGetToken = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert("Permission denied", "Push notification permission is not granted.");
        setLoading(false);
        return;
      }

      const fcmToken = await messaging().getToken();

      if (fcmToken) {
        console.log("✅ FCM Token:", fcmToken);
        setToken(fcmToken);
      } else {
        Alert.alert("❌ Failed to get FCM token");
      }
    } catch (error) {
      console.error("⚠️ Error getting FCM token:", error);
      Alert.alert("Error", "Something went wrong while fetching FCM token.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestPermissionAndGetToken();
  }, []);

  const handleCopy = () => {
    Clipboard.setString(token);
    Alert.alert("Copied", "FCM Token copied to clipboard!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FCM Token Screen</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : token ? (
        <>
          <Text style={styles.label}>Your FCM Token:</Text>
          <Text selectable style={styles.tokenText}>{token}</Text>
          <Button title="Copy Token" onPress={handleCopy} />
        </>
      ) : (
        <Text style={styles.label}>No token available</Text>
      )}
    </View>
  );
};

export default FCMTokenScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  tokenText: {
    fontSize: 14,
    marginBottom: 20,
    color: "#333",
  },
});
