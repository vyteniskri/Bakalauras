import React, { useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Icon, ProfileItem } from "../components";
import styles, { BLACK, PRIMARY_COLOR, WHITE } from "../assets/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import ProgressIndicator from "../components/ProgressIndicator";
import { Video } from "expo-av";
import { fetchProfileData } from "../components/UserProfileData"; 
import axiosInstance from "../components/axiosInstance";


const Profile = ({ navigation, onLogoutSuccess }: { navigation: any; onLogoutSuccess: () => void }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [additionalData, setAdditionalData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); 
  const videoRef = useRef<Video>(null);


  useFocusEffect(
    React.useCallback(() => {
      const fetchUserIdAndData = async () => {
        try {
          setLoading(true); 
          const storedUserId = await AsyncStorage.getItem("userId");
          if (!storedUserId) {
            throw new Error("User ID not found");
          }
          setUserId(storedUserId);

          const profileData = await fetchProfileData(storedUserId);
          setAdditionalData(profileData);
          
          setRefreshKey((prevKey) => prevKey + 1); 
          setCurrentMediaIndex(0); 
        } catch (error) {
          console.error("Error fetching user ID or profile data:", error);
        } finally {
          setLoading(false); 
        }
      };

      fetchUserIdAndData();
    }, [])
  );

  const closeMenu = () => setShowMenu(false);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (videoRef.current) {
          videoRef.current.pauseAsync(); 
        }
      };
    }, [])
  );

  const handleLogout = async () => {
    try {
      const response = await axiosInstance.post("/logout", {
        withCredentials: true,
      });

      if (response.status === 200) {
        closeMenu();
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("userId");
        await AsyncStorage.removeItem("allCategoriesWithFilters");
        onLogoutSuccess();
      }
    } catch (error: unknown) {
    
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

  if (loading || !userId || !additionalData) {
    return (
      <View style={styles2.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  const handleAccountManagement = () => {
    navigation.navigate("ManageAccount"); 
  }

  return (
    <ImageBackground
      source={require("../assets/images/bg.png")} 
      style={styles.bg}
    >
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View>
          <ScrollView style={styles.containerProfile}>
            <View style={styles.mediaContainer}>
              {additionalData.media.length > 0 && (
                <>

                  <TouchableOpacity
                    style={styles.leftTouchableArea}
                    onPress={handlePreviousMedia}
                  />

                  {additionalData.media[currentMediaIndex].type === "photo" ? (
                    <ImageBackground
                      source={{ uri: additionalData.media[currentMediaIndex].uri }}
                      style={styles.photo}
                    ></ImageBackground>
                  ) : (
                    <Video
                      ref={videoRef}
                      source={{ uri: additionalData.media[currentMediaIndex].uri }}
                      style={styles.video}
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
                totalSteps={additionalData.media.length} 
              />
            </View>

            <View style={styles.settingsIconContainer}>
              <TouchableOpacity
                onPress={() => setShowMenu(!showMenu)} 
              >
                <Icon
                  name="settings-sharp"
                  size={25}
                  color={WHITE}
                  style={styles.topIconRight}
                />
              </TouchableOpacity>
            </View>

          
            <ProfileItem
              matches={additionalData.userName} 
              name={additionalData.userName}
              age="25" 
              aboutMe={additionalData.aboutInfo} 
              info1={`Platform: ${additionalData.profileData.platform || "N/A"}`}
              info2={`Gaming Schedule: ${additionalData.profileData.gamingSchedule || "N/A"}`}
              info3={`Player Type: ${additionalData.profileData.playerType || "N/A"}`}
              info4={`Playstyle: ${additionalData.profileData.playstyle || "N/A"}`}
              info5={
                Array.isArray(additionalData.profileData.allTimeGame)
                  ? additionalData.profileData.allTimeGame
                  : (additionalData.profileData.allTimeGame || "").split(", ")
              }
              userId={userId} 
              width={372}
            />


            {showMenu && (
              <View style={styles.logoutContainer}>
                <View style={styles.logout}>

                  <TouchableOpacity
                    onPress={() => {
                      if (videoRef.current) {
                        videoRef.current.pauseAsync(); 
                      }
                      navigation.navigate("Edit"); 
                      closeMenu(); 
                    }}
                  >
                    <View style={styles2.editButton}>
                      <Text style={styles2.editText}>Edit Profile</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleAccountManagement}>
                    <Text style={styles2.editText}>Manage Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutItem}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
};
const styles2 = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: WHITE, 
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  editText: {
    fontSize: 16,
    color: BLACK,
    fontWeight: "bold",
  },
});
export default Profile;