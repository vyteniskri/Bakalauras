import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { PRIMARY_COLOR } from "../assets/styles";

const PreviewWrapper = ({ isLoggedIn, children, previewImages, previewText, imageWidth, imageHeight }: any) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (isLoggedIn) {
    return children; 
  }

  const handleNextImage = () => {
    if (currentImageIndex < previewImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <View style={styles.previewContainer}>
      {previewImages && previewImages.length > 0 && (
        <View style={styles.imageContainer}>
          <Image
            source={previewImages[currentImageIndex]}
            style={[
              styles.previewImage,
              { width: imageWidth || "100%", height: imageHeight || "100%" }, 
            ]}
          />
          {previewImages.length > 1 && (
            <View style={styles.navigationContainer}>

              <TouchableOpacity
                onPress={handlePreviousImage}
                style={[styles.arrowButton, currentImageIndex === 0 && styles.disabledButton]}
                disabled={currentImageIndex === 0} 
              >
                <Ionicons name="arrow-back" size={24} color={"white"} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextImage}
                style={[styles.arrowButton, currentImageIndex === previewImages.length - 1 && styles.disabledButton]}
                disabled={currentImageIndex === previewImages.length - 1} 
              >
                <Ionicons name="arrow-forward" size={24} color={"white"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      <Text style={styles.previewText}>{previewText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    marginTop: 60,
    resizeMode: "contain",
  },
  navigationContainer: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: -20,
    bottom: 80,
  },
  arrowButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: PRIMARY_COLOR, 
    opacity: 0.5,
  },
  previewText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 100,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default PreviewWrapper;