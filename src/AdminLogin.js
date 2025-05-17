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
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import CONFIG from "../config";
import * as Device from 'expo-device';


const Login = ({ navigation, route }) => {
  const deviceToken = route?.params?.device_token;
  const [id, setId] = useState("");
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState("");
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
          const admin_id = data.admin_id;
          console.log("🔐 Token is valid. User ID:", admin_id);
          navigation.navigate("Admin", { adminId : admin_id ,deviceToken : token});
        } else {
          navigation.navigate("AdminLogin");
        }
      } catch (error) {
        console.log("🚨 Error during token verification:", error);
        Toast.show({
          type: "error",
          text1: "Login Check Failed",
          text2: "Please login again",
          position: "top",
        });
        navigation.navigate("AdminLogin");
      }
    };
  
    if (token) {
      verifyToken();
    }
  }, [navigation, token]);

  const handleLogin = async () => {
    // Validate inputs
    if (!id || !password) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both ID and Password',
        position: 'top'
      });
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (data.success) {
        const adminId = id;
        // Store token
        await fetch(`${CONFIG.API_BASE_URL}/store-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_id: adminId, deviceToken }),
        });
        await fetch(`${CONFIG.API_BASE_URL}/store-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_id: adminId, token }),
        });
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Redirecting to Admin Dashboard',
          position: 'top',
          visibilityTime: 300,
          onHide: () => {
            navigation.navigate("Admin", { adminId: id, token });
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid credentials',
          position: 'top'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Login failed. Please try again.',
        position: 'top'
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar 
        backgroundColor="#ffff" 
        barStyle="dark-content" 
      />
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
              <View style={styles.inputContainer}>
                <Icon 
                  name="person-outline" 
                  size={24} 
                  color="#666" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  placeholder="Admin ID"
                  value={id}
                  onChangeText={setId}
                  style={styles.input}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>

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
              onPress={handleLogin} 
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login</Text>
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
    backgroundColor: '#ff8c00',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    backgroundColor: '#fff',
    alignItems: "center",
    marginBottom: 40,
    borderRadius:50,
  },
  logo: {
    width: 200,  // Increased width
    height: 200, // Increased height
    borderRadius: 0,  // Removed border radius
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: 'white',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIconContainer: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Login;