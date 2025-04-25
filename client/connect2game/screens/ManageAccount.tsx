import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axiosInstance from "../components/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRIMARY_COLOR } from "../assets/styles";

const ManageAccount = ({ navigation, onAccountUpdate }: { navigation: any; onAccountUpdate: () => void }) => {
  const handleDeleteProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.delete(`/profiles/${userId}`);

      if (response.status === 204) {
        Alert.alert("Success", "Your profile has been deleted.");
        onAccountUpdate(); 
      } else {
        Alert.alert("Error", "Failed to delete the profile.");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert("Error", "Profile not found.");
      } else {
        console.error("Error deleting profile:", error);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };

  const confirmDeleteProfile = () => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete your profile? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteProfile,
        },
      ]
    );
  };

  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Your Account</Text>
      <Text style={styles.description}>
        Deleting your profile is a permanent action. This means:{"\n\n"}
        • Your account and all associated data (such as filters, connections with other people, and personal information) will be permanently removed from our system.{"\n\n"}
        • You will no longer be able to access your profile or any features that require a user account.{"\n\n"}
        • This action cannot be undone.{"\n\n"}
        If you're sure you want to delete your profile, press Delete Profile and confirm your decision.{"\n\n"}
        We're sorry to see you go. Thank you for your time and for being part of our community 😊.
      </Text>
      <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteProfile}>
        <Text style={styles.deleteButtonText}>Delete Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ManageAccount;
