import React, { useState } from "react";
import styles, { PRIMARY_COLOR } from "../assets/styles";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axiosInstance from "../components/axiosInstance";

const Register = ({ navigation }: { navigation: any }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{}|;:'",.<>?/\\`~]).{6,}$/;

    if (!email) {
      Alert.alert("Can't register", "Please fill in your email");
      return;
    } 

    if (!emailRegex.test(email)) {
        Alert.alert("Invalid email", "Please enter a valid email address (e.g., ILoveGaming@gmail.com)");
        return;
    }

    if (!username) {
        Alert.alert("Can't register", "Please fill in your username");
        return;
    }
     if (username.includes(" ")) {
          Alert.alert("Invalid Username", "Usernames cannot contain spaces.");
          return;
    }
    if (username.length > 28) {
     Alert.alert("Invalid Username", "Usernames is too long (Max 28 characters).");
      return;
    }
    if (!password) {
        Alert.alert("Can't register", "Please fill in your password");
        return;
    }

    if (!passwordRegex.test(password)) {
        Alert.alert("Invalid password", "Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character.");
        return;
    }

    if (password !== repeatPassword) {
        Alert.alert("Passwords do not match", "Please make sure both passwords match.");
        return;
    }

    try {
        setLoading(true);
        const response = await axiosInstance.post("/register", 
            { username, email, password } 
        );
    
        if (response.status === 201) {
        
            navigation.navigate("Login", { from: "Register" });
        } 
      } catch (error: unknown) {  
        if (error.response) {
          if (error.response.status === 422) {
            Alert.alert("Register failed","Please select a different username");
          } 
        } else {
          Alert.alert("Error", "Cannot connect to the server. Please try again.");
        }
      } finally {
        setLoading(false); 
      }
  };

  return (  
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.loginTitle}>Welcome!</Text>
          <Text style={styles.subtitle}>Please register to continue</Text>

          <View style={styles.inputContainer}>
            <Icon name="envelope" size={20} color="gray" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputContainer}>
            <Icon name="user" size={20} color="gray" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="gray" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="gray" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Repeat Password"
              value={repeatPassword}
              onChangeText={setRepeatPassword}
              secureTextEntry
            />
          </View>
          
          {loading ? (
                <View style={styles2.loadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  </View>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
              <Text style={styles.loginButtonText}>Register</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};
const styles2 = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
export default Register;