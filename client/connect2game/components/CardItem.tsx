import React, { useState } from "react";
import {
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ImageBackground,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";
import Icon from "./Icon";
import { CardItemT } from "../types";
import styles, {
  DISLIKE_ACTIONS,
  FLASH_ACTIONS,
  LIKE_ACTIONS,
  PRIMARY_COLOR,
  WHITE,
} from "../assets/styles";
import ProgressIndicator from "./ProgressIndicator";
import ProfileItem from "./ProfileItem";
import FlagHandler from "./FlagHandler";


const CardItem = ({
  description,
  hasActions,
  hasVariant,
  image,
  name,
  additionalData, 
  userId,
  onLike, 
  onDislike, 
  setModalVisible,
}: CardItemT & {
   additionalData?: any; 
   userId?: string; 
   onLike?: () => void; 
   onDislike?: () => void; 
   setModalVisible?: (visible: boolean) => void;
  }) => {
  const [modalVisible, setLocalModalVisible] = useState(false); 
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); 
  const videoRef = React.useRef<Video>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const imageStyle = [
    {
      borderRadius: 8,
      width: hasVariant ? screenWidth / 2 - 40 : screenWidth - 100,
      height: hasVariant ? 150 : 300,
      margin: hasVariant ? 5 : 15,
    },
  ];


  const handleOpenModal = () => {
    setLocalModalVisible(true);
    setModalVisible?.(true);
  };

  const handleCloseModal = () => {
    setLocalModalVisible(false);
    setModalVisible?.(false);
    if (videoRef.current) {
      videoRef.current.pauseAsync(); 
    }
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prevIndex) => {
      if (prevIndex < additionalData.media.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  const handlePreviousMedia = () => {
    setCurrentMediaIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  return (
    <ImageBackground source={require("../assets/images/bg.png")}  
    style={styles.containerCardItem}
      imageStyle={{
        tintColor: "rgb(255, 255, 255)", 
      }} 
   >
      <ImageBackground 
        source={{ uri: image }} 
        style={imageStyle} />
    
      <View style={styles.matchesCardItem}>
        <Text style={styles.matchesTextCardItem}>
         {name} 
        </Text>
      </View>

      {description && (
        <Text style={styles.descriptionCardItem} numberOfLines={3} ellipsizeMode="tail">
          {description}
        </Text>
      )}

      {hasActions && (
        <View style={styles.actionsCardItem}>
          <TouchableOpacity style={styles.button} onPress={onDislike}>
          <Icon type="Foundation" name="minus-thick" color={DISLIKE_ACTIONS} size={35} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniButton} onPress={handleOpenModal}>
            <Icon name="chevron-up-outline" color={FLASH_ACTIONS} size={25} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onLike}>
          <Icon type="MaterialCommunityIcons" name="gamepad-round" color={LIKE_ACTIONS} size={35} />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={modalStyles.modalContainer}>
          <View
            style={[
              modalStyles.modalContent,
              {
                width: screenWidth * 0.95, 
                maxHeight: screenHeight * 0.95, 
              },
            ]}
          >
            <ScrollView contentContainerStyle={modalStyles.scrollContent}>
              <View
                style={[
                  modalStyles.mediaContainer,
                  {
                    height: screenHeight * 0.4, 
                  },
                ]}
              >
                {additionalData?.media?.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={styles.leftTouchableArea}
                      onPress={handlePreviousMedia}
                    />

                    {additionalData.media[currentMediaIndex].type === "photo" ? (
                      <ImageBackground
                        source={{ uri: additionalData.media[currentMediaIndex].uri }}
                        style={modalStyles.mediaImage}
                      ></ImageBackground>
                    ) : (
                      <Video
                        ref={videoRef}
                        source={{ uri: additionalData.media[currentMediaIndex].uri }}
                        style={modalStyles.mediaVideo}
                        shouldPlay={true}
                        resizeMode="cover"
                        isLooping={true}
                      ></Video>
                    )}

                    <TouchableOpacity
                      style={styles.rightTouchableArea}
                      onPress={handleNextMedia}
                    />
                  </>
                )}
              </View>

              <View style={styles.progressIndicatorContainer}>
                <ProgressIndicator
                  step={currentMediaIndex + 1}
                  totalSteps={additionalData?.media?.length || 0}
                />
              </View>

              <ProfileItem
                matches={additionalData?.userName || "Unknown"}
                name={additionalData?.userName || "Unknown"}
                age="25"
                aboutMe={additionalData?.aboutInfo || "No description available"}
                info1={`Platform: ${additionalData?.profileData?.platform || "N/A"}`}
                info2={`Gaming Schedule: ${additionalData?.profileData?.gamingSchedule || "N/A"}`}
                info3={`Player Type: ${additionalData?.profileData?.playerType || "N/A"}`}
                info4={`Playstyle: ${additionalData?.profileData?.playstyle || "N/A"}`}
                info5={
                  Array.isArray(additionalData?.profileData?.allTimeGame)
                    ? additionalData.profileData.allTimeGame
                    : (additionalData?.profileData?.allTimeGame || "").split(", ")
                }
                userId={userId}
              />
            </ScrollView>

            <TouchableOpacity style={styles.miniButton} onPress={handleCloseModal}>
              <Icon name="chevron-down-outline" color={FLASH_ACTIONS} size={25} />
            </TouchableOpacity>
            
            <FlagHandler userId={userId} />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const modalStyles = StyleSheet.create({
  mediaContainer: {
    position: "relative",
    width: "100%",

  },
  mediaImage: {
    width: "100%",
    height: "100%",

  },
  mediaVideo: {
    width: "100%",
    height: "100%",

  },
  scrollContent: {
    flexGrow: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    
  },
  modalContent: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center", 

  },
});

export default CardItem;