import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";
import CONFIG from "../config";
import * as Device from 'expo-device';


const Login = ({ navigation }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [token, setToken] = useState(null);
  const [user_id, setId] = useState("");
  const [user_name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone_number, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const deviceId = Device.osInternalBuildId || Device.osBuildId || 'unknown';
    console.log("Device ID:", deviceId);
    setToken(deviceId);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/verify-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: token }),
        });
        const data = await response.json();
        console.log("✅ Verify Token Response:", data);
  
        if (data && data.valid) {
          const userId = data.user_id;
          console.log("🔐 Token is valid. User ID:", userId);
          navigation.navigate("HomeScreen", { userId ,deviceToken : token});
        } else {
          navigation.navigate("Login");
        }
      } catch (error) {
        console.log("🚨 Error during token verification:", error);
        Toast.show({
          type: "error",
          text1: "Login Check Failed",
          text2: "Please login again",
          position: "top",
        });
        navigation.navigate("Login");
      }
    };
  
    if (token) {
      verifyToken();
    }
  }, [navigation, token]);

  const handleLogin = async () => {
    if (!user_id || !password) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter both user ID and Password",
        position: "top",
      });
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const userId = user_id;
        if (token) {
          console.log("🔑 JWT Token:", token);
          await fetch(`${CONFIG.API_BASE_URL}/store-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, token }),
          });
          Toast.show({
            type: "success",
            text1: "Login Successful",
            text2: "Redirecting to user Dashboard",
            position: "top",
            visibilityTime: 300,
            onHide: () => {
              navigation.navigate("HomeScreen", { userId ,deviceToken : token});
            },
          });
        } else {
          console.log("⚠️ Token is undefined. Cannot store in AsyncStorage.");
          Toast.show({
            type: "error",
            text1: "Login Error",
            text2: "Token not received. Please try again.",
            position: "top",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Invalid credentials",
          position: "top",
        });
      }
    } catch (error) {
      console.log("🚨 Error during login:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Login failed. Please try again.",
        position: "top",
      });
    }
  };

  const handleRegister = async () => {
    if (!user_id || !user_name || !password || !phone_number) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill all fields",
        position: "top",
      });
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, user_name, password, phone_number }),
      });

      const data = await response.json();

      if (data.message && data.message.toLowerCase().includes("successfully")) {
        Toast.show({
          type: "success",
          text1: "Registration Successful",
          text2: "You can now log in",
          position: "top",
        });
        setIsRegistering(false);
      } else {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: data.message || "Please try again",
          position: "top",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Registration failed. Try again.",
        position: "top",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar backgroundColor="#ffff" barStyle="dark-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/main.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              {isRegistering && (
                <View style={styles.inputContainer}>
                  <Icon
                    name="person-circle-outline"
                    size={24}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Full Name"
                    value={user_name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Icon
                  name="person-outline"
                  size={24}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="User ID"
                  value={user_id}
                  onChangeText={setId}
                  style={styles.input}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>

              {isRegistering && (
                <View style={styles.inputContainer}>
                  <Icon
                    name="call-outline"
                    size={24}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Phone Number"
                    value={phone_number}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Icon
                  name="lock-closed-outline"
                  size={24}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconContainer}
                >
                  <Icon
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={isRegistering ? handleRegister : handleLogin}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                {isRegistering ? "Register" : "Login"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsRegistering(!isRegistering)}
              style={{ marginTop: 15, alignSelf: "center" }}
            >
              <Text style={{ color: "#333" }}>
                {isRegistering
                  ? "Already have an account? Login"
                  : "Don't have an account? Register"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff8c00",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    backgroundColor: '#fff',
    alignItems: "center",
    marginBottom: 40,
    borderRadius: 50,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 0,
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  eyeIconContainer: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: "#ff8c00",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Login;