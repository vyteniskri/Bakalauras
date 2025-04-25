import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { useNavigation, useRoute } from "@react-navigation/native";
import { PRIMARY_COLOR } from "../assets/styles";

const FloatingSearchBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const handleSearchPress = () => {
    navigation.navigate("Search"); 
  };

  if (route.name !== "HomeTemplate") {
    return null;
  }

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handleSearchPress}>
      <Ionicons name="search" size={20} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: PRIMARY_COLOR, 
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000", 
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
});

export default FloatingSearchBar;