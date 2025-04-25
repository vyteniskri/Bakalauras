import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Modal, ScrollView, ImageBackground, Dimensions, Image } from "react-native";
import { useRoute } from "@react-navigation/native";
import styles, { BLACK, FLASH_ACTIONS, GRAY, LIKE_ACTIONS, PRIMARY_COLOR, WHITE } from "../assets/styles";
import { fetchProfileData } from "../components/UserProfileData"; 
import { Icon, ProfileItem } from "../components";
import { Video } from "expo-av";
import ProgressIndicator from "../components/ProgressIndicator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { manageFriends } from "../components/ManageFriends";
import axiosInstance from "../components/axiosInstance";
import FlagHandler from "../components/FlagHandler";

const FilteredProfiles = ({ navigation }: { navigation: any;})  => {
  interface Profile {
    id: number;
    userId: string; 
    userName?: string;
    aboutInfo?: string;
    media?: { uri: string }[];
    [key: string]: any; 
  }
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false); 
  const route = useRoute(); 
  const { filterId, text } = route.params; 
  const numColumns = 3; 

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); 
  const videoRef = React.useRef<Video>(null);
  const [modalVisible, setModalVisible] = useState(false); 
  const [openedCardId, setOpenedCardId] = useState<number | null>(null); 
  const [page, setPage] = useState(0); 
 const [hasMore, setHasMore] = useState(true);

  const loadMoreProfiles = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchProfiles(nextPage);
    }
  };

  const fetchProfiles = async (pageN: number) => {
    setLoading(true);
    const storedUserId = await AsyncStorage.getItem("userId");
    const profilesPerPage = 9;
    try {
      const subCategoryResponse = await axiosInstance.get(
        `/subCategoryFilters/Filter/${filterId}`
      );
      const subCategories = subCategoryResponse.data;
      const allProfiles = [];
      const nonFilteredProfiles = [];
      for (const subCategory of subCategories) {
        const profilesResponse = await axiosInstance.get(
          `/profileFilters/forSubcategory/${subCategory.id}?skip=${pageN * profilesPerPage}&take=${profilesPerPage}`
        );
        const profilesData = profilesResponse.data;
        nonFilteredProfiles.push(...profilesData); 

        const enrichedProfiles = await Promise.all(
          profilesData.map(async (profile) => {
            
            let isBanned = false;
            try {
              await axiosInstance.get(`/reports/canLogin/${profile.userId}`);
            } catch (error) {
              if (error.response?.status === 403) {
                isBanned = true; 
              }
            }
            if (isBanned) {
              return null; 
            }


            const response = await axiosInstance.get(`/friendships/${profile.userId}`); 
              const isFriendship = response.data;
              const isFriendshipPending = await manageFriends.checkPendingFriendship(
                profile.userId,
                navigation
              );
              
              if (!isFriendship || isFriendshipPending) {
                try {
                  const additionalData = await fetchProfileData(profile.userId); 
                  return { ...profile, ...additionalData, userId: profile.userId  }; 
                } catch (error) {
                  return null; 
                }
              } else {
                return null; 
              }
           
          })
        );
        const filteredEnrichedProfiles = enrichedProfiles.filter((profile) => profile !== null);
        allProfiles.push(...filteredEnrichedProfiles); 
      }

      const filteredProfiles = allProfiles.filter(
        (profile: any, index: number, self: any[]) =>
          profile.userId !== storedUserId &&
          index === self.findIndex((p) => p.userId === profile.userId) 
      );

      setProfiles((prevProfiles) => {
        const newProfiles = filteredProfiles.filter(
          (newProfile) => !prevProfiles.some((existingProfile) => existingProfile.userId === newProfile.userId)
        );
        return [...prevProfiles, ...newProfiles];
      });
      if (nonFilteredProfiles.length < profilesPerPage) {
        setHasMore(false); 
      }

    } catch (error) {
     
    } finally {
      setLoading(false);
    }
  };

const handleOpenModal = (profileId: number) => {
  setOpenedCardId(profileId); 
  setCurrentMediaIndex(0); 
  setModalVisible(true); 
};

  const handleCloseModal = () => {
    setModalVisible(false); 
    setOpenedCardId(null); 
    if (videoRef.current) {
      videoRef.current.pauseAsync(); 
    }
  };

  const handleNextMedia = (profile: Profile) => {
    setCurrentMediaIndex((prevIndex) => {
      if (prevIndex < (profile.media?.length || 0) - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };
  
  const handlePreviousMedia = (profile: Profile) => {
    setCurrentMediaIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  useEffect(() => {
  if (profiles.length === 0) {
    fetchProfiles(0);
  }
   else if (profiles.length < 9 && hasMore) {
      loadMoreProfiles();
    }
  }, [filterId, profiles.length]);


  const acceptFriendshipRequest = async (profile: Profile) => {
    const storedToken = await AsyncStorage.getItem("accessToken");
    if (profile && storedToken) {
      try {
            const isFriendship = await manageFriends.checkFriendship(
              profile.userId,
            navigation
          );
          const isFriendshipPending = await manageFriends.checkPendingFriendship(
            profile.userId,
          navigation
        );
        if (!isFriendship) {
          await manageFriends.sendFriendshipInvitation(profile.userId, navigation); 
          setProfiles((prevProfiles) =>
            prevProfiles.filter((p) => p.id !== profile.id)
          );
          return;
        }
        if(isFriendshipPending) {
          await manageFriends.acceptFriendship(profile.userId, navigation);
          setProfiles((prevProfiles) =>
            prevProfiles.filter((p) => p.id !== profile.id)
          );
          return;
        }
        
      } catch (error) {
       
      }
    }
  };



  return (
    <View style={styles2.container}>
    
        <View style={styles2.container}>
          <Text style={styles2.filterText}>Search results for: {text}</Text>

     <FlatList
     key={numColumns} 
     data={profiles}
     keyExtractor={(item) => item.id.toString()}
     renderItem={({ item: profile }) => {

       return (
        <TouchableOpacity
            style={styles2.containerCardItem}
            onPress={() => handleOpenModal(profile.id)} 
          >

           <Image source={{ uri: profile.media?.[0]?.uri }} style={styles2.imageStyle} />

           <View style={styles2.matchesCardItem}>
            <Text
              style={styles2.matchesTextCardItem}
              numberOfLines={1} 
              ellipsizeMode="tail" 
            >
              {profile.userName || "Unknown"}
            </Text>
          </View>
   
           {profile.aboutInfo && (
             <Text
               style={styles2.descriptionCardItem}
               numberOfLines={3}
               ellipsizeMode="tail"
             >
               {profile.aboutInfo}
             </Text>
           )}
   
           <View style={styles2.actionsCardItem}>
           
   
             <TouchableOpacity style={styles2.button} onPress={() => acceptFriendshipRequest(profile)} >
               <Icon type="MaterialCommunityIcons" name="gamepad-round" color={LIKE_ACTIONS} size={25} />
             </TouchableOpacity>
           </View>
   
           {openedCardId === profile.id && (
           <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                handleCloseModal(); 
                setCurrentMediaIndex(0);
              }}
              
           >
             <View style={modalStyles.modalContainer}>
               <View
                 style={[
                   modalStyles.modalContent,
                   {
                     width: Dimensions.get("window").width * 0.95, 
                     maxHeight: Dimensions.get("window").height * 0.95,
                   },
                 ]}
               >
                 <ScrollView contentContainerStyle={modalStyles.scrollContent}>
                   <View
                     style={[
                       modalStyles.mediaContainer,
                       {
                         height: Dimensions.get("window").height * 0.4, 
                       },
                     ]}
                   >
                     {profile.media?.length > 0 && (
                       <>
                          <TouchableOpacity
                                style={styles.leftTouchableArea}
                                onPress={() => handlePreviousMedia(profile)}
                            />

                         {profile.media[currentMediaIndex]?.type === "photo" ? (
                           <ImageBackground
                             source={{ uri: profile.media[currentMediaIndex]?.uri }}
                             style={modalStyles.mediaImage}
                           ></ImageBackground>
                         ) : (
                           <Video
                             source={{ uri: profile.media[currentMediaIndex]?.uri }}
                             style={modalStyles.mediaVideo}
                             shouldPlay={true}
                             resizeMode="cover"
                             isLooping={true}
                           ></Video>
                         )}
   
                         <TouchableOpacity
                              style={styles.rightTouchableArea}
                              onPress={() => handleNextMedia(profile)}
                          />
                       </>
                     )}
                   </View>

                   <View style={styles.progressIndicatorContainer}>
                    <ProgressIndicator
                      step={currentMediaIndex + 1}
                      totalSteps={profile?.media?.length || 0}
                    />
                  </View>
                     
                                <ProfileItem
                                   matches={profile?.userName || "Unknown"}
                                   name={profile?.userName || "Unknown"}
                                   age="25"
                                   aboutMe={profile?.aboutInfo || "No description available"}
                                   info1={`Platform: ${profile?.profileData?.platform || "N/A"}`}
                                   info2={`Gaming Schedule: ${profile?.profileData?.gamingSchedule || "N/A"}`}
                                   info3={`Player Type: ${profile?.profileData?.playerType || "N/A"}`}
                                   info4={`Playstyle: ${profile?.profileData?.playstyle || "N/A"}`}
                                   info5={
                                     Array.isArray(profile?.profileData?.allTimeGame)
                                       ? profile.profileData.allTimeGame
                                       : (profile?.profileData?.allTimeGame || "").split(", ")
                                   }
                                   userId={profile?.userId}
                                 />
                              </ScrollView>
   
                 <TouchableOpacity style={styles.miniButton} onPress={() => {handleCloseModal(); setCurrentMediaIndex(0);}}>
                   <Icon name="chevron-down-outline" color={FLASH_ACTIONS} size={25} />
                 </TouchableOpacity>

                 <FlagHandler userId={profile.userId} />
               </View>
             </View>
           </Modal>
           )}
         </TouchableOpacity>
       );
     }}
     ListEmptyComponent={
       !loading && profiles.length === 0 ? (
         <Text style={styles2.noResultsText}>No profiles found.</Text>
       ) : null
     }
     numColumns={3}
      onEndReached={loadMoreProfiles}
      onEndReachedThreshold={0.02}
      
     columnWrapperStyle={styles2.row} 
     ListFooterComponent={
      loading ? (
        <View style={styles2.loadingFooter}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      ) : null
    }
   />
      </View>
           
      
    </View>
  );
};

const styles2 = StyleSheet.create({
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  filterText: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    textAlign: "left",
    paddingBottom: 20,
  },
  container: {
    marginTop: 10,
    marginHorizontal: 10,
    paddingBottom: 50,
  },
  containerCardItem: {
    backgroundColor: WHITE,
    borderRadius: 10,
    alignItems: "center",
    margin: 6, 
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 8, 
    shadowColor: BLACK,
    shadowOffset: { height: 10, width: 5 },
    width: "30%", 
    height: 185, 
    borderColor:  PRIMARY_COLOR,
    borderWidth: 1,
  },
  imageStyle: {
    width: "90%", 
    height: 80, 
    borderRadius: 10,
    marginTop: 5, 
  },
  matchesCardItem: {
    marginTop: -10, 
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 4, 
    paddingHorizontal: 4, 
    borderRadius: 15, 
    marginBottom: 15, 
    maxWidth: "90%", 
    minWidth: "20%", 
    maxHeight: 20, 
  },
  matchesTextCardItem: {
    color: WHITE,
    fontWeight: "bold",
    fontSize: 7, 
    textAlign: "center",
   
  },
  descriptionCardItem: {
    color: GRAY,
    textAlign: "center",
    height: 40,
    paddingHorizontal: 10, 
    justifyContent: "center",
    fontSize: 8, 
    marginTop: -10,
  },
  actionsCardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, 
    bottom: 16,
    justifyContent: "center",
    width: "100%", 
    paddingHorizontal: 10, 
  },
  button: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: WHITE,
    
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowColor: BLACK,
    shadowOffset: { height: 20, width: 5 },
  },
  row: {
    flex: 1,
    marginBottom: 16, 
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

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

export default FilteredProfiles;