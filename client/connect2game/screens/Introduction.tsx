import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import styles from "../assets/styles";

const Welcome = ({ navigation }: { navigation: any }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    const clearStorageAndAnimate = async () => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    };
    clearStorageAndAnimate();
  }, []);


  return (
    <View style={[styles.introductioncontainer]}>
    <Animated.View style={[styles.introductioncontent, { opacity: fadeAnim }]}>
      <Text style={styles.introductiontitle}>MatchToGame</Text>
      <Text style={styles.introductionsubtitle}>Find your perfect gaming friend</Text>
      <TouchableOpacity style={styles.introductionbutton} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.introductionbuttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.introductionbutton, styles.introductionregisterButton]} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.introductionbuttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.introductionskipbutton, styles.introductionskipButton]} onPress={() =>  navigation.navigate("MatchToGame", { screen: "Explore" })}>
        <Text style={styles.introductionskipbuttonText}>Skip</Text>
      </TouchableOpacity>

    </Animated.View>
  </View>
  );
};

export default Welcome;
