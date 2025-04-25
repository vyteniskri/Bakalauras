import React, { useState, useEffect } from "react";
import styles, { BLACK, PRIMARY_COLOR } from "../assets/styles";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import Icon2 from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import axiosInstance from "../components/axiosInstance";

const Login = ({ navigation, route, onLoginSuccess }: { navigation: any; route: any; onLoginSuccess: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    try {
      setIsModalVisible(false); 
      setIsLoading(true); 
      const response = await axiosInstance.post("/forgotpassword", { email });
      Alert.alert(
        "Password Reset",
        "Check your email" 
      );
    } catch (error) {
      console.error("Error sending password reset email:", error);
      Alert.alert("Error", "Failed to send password reset email. Please try again.");
    } finally {
      setIsLoading(false); 
    }
    
  };


  const manageToken = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      await AsyncStorage.setItem("temporaryAccessToken", token);

      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("userId");
  }

  const checkBanStatus = async (userId) => {
    try {
      const response = await axiosInstance.get(`/reports/canLogin/${userId}`);
      return true; 
    } catch (error) {
      if (error.response?.status === 403) {
        const utcBanTime = error.response.data.detail;
  
        const banDate = new Date(utcBanTime);
        const currentDate = new Date();

        const hundredYearsInMilliseconds = 99 * 365 * 24 * 60 * 60 * 1000;
        if (banDate.getTime() - currentDate.getTime() >= hundredYearsInMilliseconds) {
          Alert.alert("Access Denied", "Your account is permanently banned.");
          return false;
        }
  
        const localBanTime = banDate.toLocaleString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
  
        Alert.alert("Access Denied", `Your account is banned until: ${localBanTime}`);
        return false;
      }
    }
  };
  

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Can't login", "Please fill in both fields");
      return;
    }
  
    try {
      const response = await axiosInstance.post(
        "/login",
        { username, password },
        { withCredentials: true }
      );
  
      if (response.status === 200) {
        const accessToken = response.data.accessToken;
        await AsyncStorage.setItem("accessToken", accessToken);
  
        const decodedToken: any = jwtDecode(accessToken);
        const userId = decodedToken.sub;
  
        if (userId) {
          await AsyncStorage.setItem("userId", userId);
          const canLogin = await checkBanStatus(userId);

          if (canLogin != null && !canLogin) {
            return; 
          }
          try {
            const registrationStepResponse = await axiosInstance.get(
              `/registrationSteps`
            );
          
            if (registrationStepResponse.status === 200) {
              const currentStep = registrationStepResponse.data.currentStep;
  
              switch (currentStep) {
                case 1:
                  await manageToken();
                  navigation.navigate("AboutIntro");
                  break;
                case 2:
                  await manageToken();
                  navigation.navigate("AvatarIntro");
                  break;
                case 3:
                  await manageToken();
                  navigation.navigate("PlatformIntro");
                  break;
                case 4:
                  await manageToken();
                  navigation.navigate("SelectCategoriesIntro");
                  break;
                case 5:
                  await manageToken();
                  navigation.navigate("SchedulePlaystile");
                  break;
                case 6:
                  await manageToken();
                  navigation.navigate("MediaIntro");
                  break;
                case 7:
                  await manageToken();
                  navigation.navigate("GameIntro");
                  break;
                default:
                  onLoginSuccess();
                  break;
              }
            }
          } catch (error) {
            if (error.response) {
              if (error.response.status == 500 || error.response.status === 404) {
                try {
                  await axiosInstance.post(
                    `/registrationSteps`,
                    { currentStep: 1 }
                  );

                  await manageToken();

                  navigation.navigate("AboutIntro");
                } catch (postError) {
                  console.error("Error initializing registration step:", postError);
                  Alert.alert("Error", "Failed to initialize registration step. Please try again.");
                }
              } else {
                console.error("Error fetching registration step:", error);
                Alert.alert("Error", "Unable to verify registration step. Please try again.");
              }
            }
          }
        } else {
          Alert.alert("Error", "Cannot connect to the server. Please try again.");
        }
      }
    } catch (error: unknown) {
      if (error.response) {
        if (error.response.status === 422) {
          Alert.alert("Login failed", "Invalid username or password.");
        }
      } else {
        Alert.alert("Error", "Cannot connect to the server. Please try again.");
      }
    }
  };

  return (  
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <ScrollView>
    {isLoading && (
      <View style={styles2.loginContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    ) }
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Go MatchToGame!</Text>
      <Text style={styles.subtitle}>Please login to continue</Text>

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
        
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={styles.signupTextContainer}
      >
        <Text style={styles.signupText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Text style={styles.signupText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Modal
            visible={isModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles2.modalBackground}>
              <View style={styles2.modalContainer}>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles2.closeButton} 
                >
                  <Icon2 name="close-circle" size={30} color={PRIMARY_COLOR} />
                </TouchableOpacity>

                <Text style={styles2.modalTitle}>Reset Password</Text>
                <TextInput
                  style={styles2.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles2.modalButton} onPress={handleForgotPassword}>
                  <Text style={styles2.modalButtonText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        
    </View>
    </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles2 = StyleSheet.create({
  loginContainer: {
    flex: 1,
    position: "absolute",
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 10, 
  },
  input: {
    width: "100%", 
    height: 40,
    fontSize: 16,
    color: BLACK,
    borderBottomWidth: 1, 
    borderBottomColor: "#ccc",
    marginBottom: 20, 
    paddingHorizontal: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10, 
    right: 10,
    zIndex: 10, 
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalButton: {
    marginTop: 10,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default Login;