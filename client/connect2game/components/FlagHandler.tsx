import React, { useState } from "react";
import { Alert, TouchableOpacity, Text, StyleSheet } from "react-native";
import Icon from "./Icon";
import axiosInstance from "./axiosInstance";
import { FLASH_ACTIONS, WHITE } from "../assets/styles";

interface FlagHandlerProps {
  userId: string;
}

const FlagHandler: React.FC<FlagHandlerProps> = ({ userId }) => {
  const [isFlagging, setIsFlagging] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);

  const handleFlagProfile = async () => {
    if (isFlagging || isFlagged) return; 
    setIsFlagging(true);

    try {
      const response = await axiosInstance.post(`/reports/flag/${userId}`, {});

      if (response.status === 201) {
        Alert.alert("Profile Flagged", "Thank you for reporting this profile.");
        setIsFlagged(true); 
      }
    } catch (error) {

      if (error.response?.status === 409) {
        try {
          const incrementResponse = await axiosInstance.put(`/reports/flag/${userId}`);
          if (incrementResponse.status === 200) {
            Alert.alert("Profile Flagged", "Thank you for reporting this profile.");
            setIsFlagged(true); 
          }
        } catch (incrementError) {
          Alert.alert("Error", "Failed to increment the flag count. Please try again.");
        }
      } else {
        Alert.alert("Error", "Failed to flag the profile. Please try again.");
      }
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.flagButton,
        isFlagged && styles.flagButtonDisabled,
      ]}
      onPress={handleFlagProfile}
      disabled={isFlagged || isFlagging} 
    >
      <Icon
        name="flag-outline"
        color={isFlagged ? "gray" : FLASH_ACTIONS}
        size={15}
      />
      <Text
        style={[
          styles.flagButtonText,
          isFlagged && styles.flagButtonTextDisabled, 
        ]}
      >
        {isFlagged ? "Reported" : "Report"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flagButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: FLASH_ACTIONS,
    borderRadius: 5,
    backgroundColor: WHITE,
  },
  flagButtonDisabled: {
    borderColor: "gray",
    backgroundColor: "#f0f0f0", 
  },
  flagButtonText: {
    marginLeft: 5,
    color: FLASH_ACTIONS,
    fontSize: 10,
    fontWeight: "bold",
  },
  flagButtonTextDisabled: {
    color: "gray", 
  },
});

export default FlagHandler;