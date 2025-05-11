import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  Pressable
} from "react-native";
import { Icon, ProfileItem } from "../components";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles, { BLACK, DARK_GRAY, DISLIKE_ACTIONS, FLASH_ACTIONS, GRAY, LIKE_ACTIONS, PRIMARY_COLOR, WHITE } from "../assets/styles";
import { useFocusEffect } from "@react-navigation/native";
import { fetchProfileData } from "../components/UserProfileData";
import ProgressIndicator from "../components/ProgressIndicator";
import { Video } from "expo-av";
import { manageFriends } from "../components/ManageFriends";
import axiosInstance from "../components/axiosInstance";
import FlagHandler from "../components/FlagHandler";

const Matches = ({ navigation }: { navigation: any }) => {

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0); 
    const videoRef = React.useRef<Video>(null);
    const [modalVisible, setModalVisible] = useState(false); 
    const [openedCardId, setOpenedCardId] = useState<number | null>(null); 
    const [searchQuery, setSearchQuery] = useState(""); 
    const [isFriendsExpanded, setIsFriendsExpanded] = useState(false); 
    const [isPendingExpanded, setIsPendingExpanded] = useState(false); 
    const [loadingWhole1, setLoadingWhole1] = useState(false); 
    const [loadingWhole2, setLoadingWhole2] = useState(false); 


    const [currentFriends, setCurrentFriends] = useState<any[]>([]); 
    const [pendingFriends, setPendingFriends] = useState<any[]>([]); 
    const [loadingCurrentFriends, setLoadingCurrentFriends] = useState(false); 
    const [loadingPendingFriends, setLoadingPendingFriends] = useState(false); 
    const [pageCurrentFriends, setPageCurrentFriends] = useState(0); 
    const [pagePendingFriends, setPagePendingFriends] = useState(0); 
    const [hasMoreCurrentFriends, setHasMoreCurrentFriends] = useState(true); 
    const [hasMorePendingFriends, setHasMorePendingFriends] = useState(true);

    const profilesPerPage = 4; 


    const [selectedFriend, setSelectedFriend] = useState<any>(null); 
    const [optionsVisible, setOptionsVisible] = useState(false); 

    const [searchResultsFriends, setSearchResultsFriends] = useState<any[]>([]); 

    const [searchResultsNonFriends, setSearchResultsNonFriends] = useState<any[]>([]); 
    const [searching, setSearching] = useState(false); 
    
    const [searchedFriend, setSearchedFriend] = useState<any>(null); 
    const [searchedNonFriend, setSearchedNonFriend] = useState<any>(null);
   

    const searchProfiles = async (query: string) => {
      try {

        const response = await axiosInstance.get(`/profiles/search/${query}`); 
        const profiles = response.data;
    
        const enrichedProfiles = await Promise.all(
          profiles.map(async (profile: any) => {
            try {
              const isFriendshipResponse = await axiosInstance.get(`/friendships/search/${profile.id}`);
              const friendship = isFriendshipResponse.data;

              let isBanned = false;
              try {
                await axiosInstance.get(`/reports/canLogin/${profile.id}`);
              } catch (error) {
                if (error.response?.status === 403) {
                  isBanned = true; 
                }
              }
              return { ...profile, isFriendship: friendship.isFriendship, friendshipID: friendship.id, isBanned  };
            } catch (error) {
           
              return null; 
            }
          })
        );
    
        const friendsOnly = enrichedProfiles.filter(
          (profile) => profile !== null && profile.isFriendship
        );
    
        const nonFriendsOnly = enrichedProfiles.filter(
          (profile) => profile !== null && !profile.isFriendship
        );
    
    
        setSearchResultsFriends(friendsOnly);
        setSearchResultsNonFriends(nonFriendsOnly);
      } catch (error) {
       
        setSearchResultsFriends([]);
        setSearchResultsNonFriends([]);
        setIsFriendsExpanded(false);
        setIsPendingExpanded(false);
      } 
    };

    useEffect(() => {
      if (searchQuery) {
        searchProfiles(searchQuery); 
        setSearchedFriend(null);
        setSearchedNonFriend(null);
      } else {
        setSearchResultsFriends([]); 
        setSearchResultsNonFriends([]); 
        
      }
    }, [searchQuery]);


    const handleRemoveFriend = async () => {
      if (selectedFriend) {
    
        Alert.alert(
          "Remove Friend",
          `Are you sure you want to remove ${selectedFriend.userName} as a friend?`,
          [
            {
              text: "Cancel",
              style: "cancel", 
              onPress: () => {
                setOptionsVisible(false);
              }
            },
            {
              text: "Remove",
              style: "destructive", 
              onPress: async () => {
                try {

                  await manageFriends.removeFriendship(selectedFriend.friendshipID, navigation);
    
                  setCurrentFriends((prevFriends) =>
                    prevFriends.filter((friend) => friend.userId !== selectedFriend.userId)
                  );
    
                  setSearchedFriend(null);
                  setPageCurrentFriends((prevPage) => Math.max(0, prevPage - 1));
                  fetchCurrentFriends(Math.max(0, pageCurrentFriends - 1));
                  setOptionsVisible(false);
                } catch (error) {
                }
              },
            },
          ],
          { cancelable: true } 
        );
      }
    };

    const handleMessageFriend = () => {
      if (selectedFriend) {
        setOptionsVisible(false); 
        navigation.navigate("Messaging", { friendshipId: selectedFriend.friendshipID, userName: selectedFriend.userName, userImage: selectedFriend.media?.[0]?.uri}); // Navigate to the chat screen
      }
    };

  const fetchCurrentFriends = async (pageN: number) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      setLoadingCurrentFriends(true);
      const skip = Math.max(0, pageN * profilesPerPage - 1);
  
      const response = await axiosInstance.get(
        `/friendships/friends/${userId}?skip=${skip}&take=${profilesPerPage}`
      );
  
      const currentFriendsData = response.data;
  
      const enrichedCurrentFriends = await Promise.all(
        currentFriendsData.map(async (friendship: any) => {
          const profileId =
            friendship.foreignKeyProfile1 === userId
              ? friendship.foreignKeyProfile2
              : friendship.foreignKeyProfile1;
  
          const additionalData = await fetchProfileData(profileId);
  
          let isBanned = false;
          try {
            await axiosInstance.get(`/reports/canLogin/${profileId}`);
          } catch (error) {
            if (error.response?.status === 403) {
              isBanned = true; 
            }
          }
  
          return { ...additionalData, isFriendship: true, friendshipID: friendship.id, isBanned };
        })
      );
  
      setCurrentFriends((prev) => {
        const uniqueFriends = enrichedCurrentFriends.filter(
          (newFriend) => !prev.some((existingFriend) => existingFriend.userId === newFriend.userId)
        );
        return [...prev, ...uniqueFriends];
      });
  
      if (currentFriendsData.length < profilesPerPage) {
        setHasMoreCurrentFriends(false);
      }
      setLoadingWhole1(false);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setLoadingWhole1(false);
        setHasMoreCurrentFriends(false);
      } else {
      }
    } finally {
      setLoadingCurrentFriends(false);
      
    }
  };


  const fetchPendingFriends = async (pageN: number) => {
    try {
      setLoadingPendingFriends(true);
      const userId = await AsyncStorage.getItem("userId");
      const profilesPerPage = 6; 
      const skip = Math.max(0, pageN * profilesPerPage - 1);
  
      const response = await axiosInstance.get(
        `/friendships/fewPending/${userId}?skip=${skip}&take=${profilesPerPage}`
      );
  
      const pendingFriendsData = response.data;
  

      const enrichedPendingFriends = await Promise.all(
        pendingFriendsData.map(async (friendship: any) => {
          const profileId =
            friendship.foreignKeyProfile1 === userId
              ? friendship.foreignKeyProfile2
              : friendship.foreignKeyProfile1;
          
              let isBanned = false;
              try {
                await axiosInstance.get(`/reports/canLogin/${profileId}`);
              } catch (error) {
                if (error.response?.status === 403) {
                  isBanned = true; 
                }
              }
              
          const additionalData = await fetchProfileData(profileId);
          return { ...additionalData, isFriendship: false, isBanned };
        })
      );
  
      setPendingFriends((prev) => {
        const uniquePending = enrichedPendingFriends.filter(
          (newPending) => !prev.some((existingPending) => existingPending.userId === newPending.userId)
        );
        return [...prev, ...uniquePending];
      });
  
      if (pendingFriendsData.length < profilesPerPage) {
        setHasMorePendingFriends(false);
      }
      setLoadingWhole2(false);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setHasMorePendingFriends(false);
        setLoadingWhole2(false);
      } else {
      }
    } finally {
      setLoadingPendingFriends(false);
    
    }
  };


  const loadMoreCurrentFriends = () => {
    if (!loadingCurrentFriends && hasMoreCurrentFriends) {
      const nextPage = pageCurrentFriends + 1;
      setPageCurrentFriends(nextPage);
      fetchCurrentFriends(nextPage);
    }
  };


  const loadMorePendingFriends = () => {
    if (!loadingPendingFriends && hasMorePendingFriends) {
      const nextPage = pagePendingFriends + 1;
      setPagePendingFriends(nextPage);
      fetchPendingFriends(nextPage);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (currentFriends.length === 0 && pendingFriends.length === 0) {
        setSearchQuery(""); 
        setLoadingWhole1(true);
        setLoadingWhole2(true);
        setPageCurrentFriends(0);
        setPagePendingFriends(0);
        setHasMoreCurrentFriends(true);
        setHasMorePendingFriends(true);
        fetchCurrentFriends(0);
        fetchPendingFriends(0);
        setIsFriendsExpanded(false); 
        setIsPendingExpanded(false); 
      
      } 

      return () => {
        setSearchQuery(""); 
        setCurrentFriends([]); 
        setPendingFriends([]); 
        setPageCurrentFriends(0); 
        setPagePendingFriends(0); 
        setHasMoreCurrentFriends(true); 
        setHasMorePendingFriends(true); 
        setIsFriendsExpanded(false); 
        setIsPendingExpanded(false);
       
      };
    }, [])
  );



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
  
    const handleNextMedia = (profile: any) => {
      setCurrentMediaIndex((prevIndex) => {
        if (prevIndex < (profile.media?.length || 0) - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    };
    
    const handlePreviousMedia = (profile: any) => {
      setCurrentMediaIndex((prevIndex) => {

        if (prevIndex > 0) {
          return prevIndex - 1;
        }
        return prevIndex;
      });
    };

    const acceptFriendshipRequest = async (profile: any) => {
      const storedToken = await AsyncStorage.getItem("accessToken");
    
      if (profile && storedToken) {
        try {
          await manageFriends.acceptFriendship(profile.userId, navigation); 
          setPendingFriends((prevProfiles) =>
            prevProfiles.filter((p) => p.userId !== profile.userId)
          );

          setSearchedNonFriend(null);
          setPagePendingFriends((prevPage) => Math.max(0, prevPage - 1));
          fetchPendingFriends(Math.max(0, pageCurrentFriends - 1));

          fetchCurrentFriends(Math.max(0, pageCurrentFriends - 1));
        } catch (error) {
          
        } finally {
          fetchCurrentFriends(Math.max(0, pageCurrentFriends - 1));
        }
      }
    };

    const declineFriendshipRequest = async (profile: any) => {
      const storedToken = await AsyncStorage.getItem("accessToken");
    
      if (profile && storedToken) {
        try {
          await manageFriends.removeNewFriendship(profile.userId, navigation); 
          setPendingFriends((prevProfiles) =>
            prevProfiles.filter((p) => p.userId !== profile.userId)
          );
          setSearchedNonFriend(null);
          setPagePendingFriends((prevPage) => Math.max(0, prevPage - 1));
          fetchPendingFriends(Math.max(0, pageCurrentFriends - 1));
        } catch (error) {
         
        }
      }
    };


    const appendProfileToList = async (profile: any) => {
      try {
        setSearching(true); 
    

        const profileData = await fetchProfileData(profile.id);
    
        if (profile.isFriendship) {
          
          setIsFriendsExpanded(true);
          setSearchedFriend({ ...profile, ...profileData });
        } else {


          setIsPendingExpanded(true);
          setSearchedNonFriend({ ...profile, ...profileData });
        }
    

        setSearchResultsFriends([]);
        setSearchResultsNonFriends([]);
      } catch (error) {
      } finally {
        setSearching(false); 
      }
    };

    const handleLongPressFriend = React.useCallback((friend: any) => {
      setSelectedFriend(friend);
      setOptionsVisible(true);
    }, []);




    return (
      <View style={styles2.container}>
        <View style={styles2.searchBarContainer}>
            <TextInput
              style={styles2.searchBar}
              placeholder="Search by username..."
              placeholderTextColor={GRAY}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
            />   

              {searchQuery && (searchResultsFriends.length > 0 || searchResultsNonFriends.length > 0) && (
                <FlatList
                  data={[...searchResultsFriends, ...searchResultsNonFriends]} 
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item: profile }) => (
                    <TouchableOpacity
                    style={styles2.searchResultItem}
                      onPress={async () => { appendProfileToList(profile); }}
                  >
                    <Text >{profile.username}</Text>
                  </TouchableOpacity>
                  )}
                 
                />
              )}


          </View>
        { (loadingCurrentFriends && currentFriends.length == 0) || (loadingWhole1 || loadingWhole2) || searching ? (
          <View style={styles2.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>

        ) : currentFriends.length === 0 && pendingFriends.length === 0 && !loadingCurrentFriends  ? (
    
            <Text style={styles2.noFriendsText}>No friends? Go find some!</Text>
        
         ) : ( 
          
         
         <><View style={[
                styles2.containerFriends,
                isFriendsExpanded ? { paddingBottom: 60 } : { paddingBottom: 0, }
              ]}>
                {(currentFriends.length > 0 && !searchQuery) || (searchedFriend && !searching) ? (
                  <View>
                    <TouchableOpacity
                      onPress={() => setIsFriendsExpanded(!isFriendsExpanded)} 
                      style={styles2.categoryHeader}
                    >
                      <View style={styles2.rowContainer}>
                        <Text style={styles2.groupTitle}>Friends</Text>
                        <Icon
                          type="Foundation"
                          name={isFriendsExpanded ? "chevron-down" : "minus"}
                          size={25}
                          color={PRIMARY_COLOR} />
                      </View>
                    </TouchableOpacity>
                    {isFriendsExpanded && (
                      <FlatList
                        data={searchQuery ? (searchedFriend ? [searchedFriend] : []) : currentFriends} 
                        keyExtractor={(item) => item.userId.toString()}
                        renderItem={({ item: profile }) => (
                          <TouchableOpacity
                          style={[
                            styles2.containerCardItem,
                            profile.isBanned && { opacity: 0.5 }, 
                          ]}
                            onLongPress={() => handleLongPressFriend(profile)} 
                            onPress={() => {
                              if (!profile.isBanned) {
                                handleOpenModal(profile.userId); 
                              }
                            }}
                          >
                            <Image
                              source={{ uri: profile.media?.[0]?.uri }}
                              style={styles2.imageStyle} 
                              />

                             
                            <Text style={styles2.descriptionCardItem}  numberOfLines={1} ellipsizeMode="tail">{profile.userName}</Text>

                             {profile.isBanned ? (
                                <Text style={styles2.unavailableText}>This gamer is unavailable</Text> 
                              ) : (
                                ""
                              )}
                              
                            {optionsVisible && (
                              <Modal
                                transparent={true}
                                visible={optionsVisible}
                                onRequestClose={() => setOptionsVisible(false)} 
                              >
                                <View style={modalStyles2.modalContainer}>
                                  <Pressable
                                    style={modalStyles2.modalContent}
                                  >
                                    <Text style={modalStyles2.modalTitle}>{selectedFriend?.userName || "Unknown"}</Text>
                                    {!selectedFriend?.isBanned && ( 
                                      <Pressable
                                        style={({ pressed }) => [
                                          modalStyles2.optionButton,
                                          pressed && { backgroundColor: "#e0e0e0" }, 
                                        ]}
                                        onPress={handleMessageFriend}
                                      >
                                        <Text style={modalStyles2.optionText}>Message</Text>
                                      </Pressable>
                                    )}
                                    <Pressable
                                      style={({ pressed }) => [
                                        modalStyles2.optionButton,
                                        pressed && { backgroundColor: "#e0e0e0" }, 
                                      ]}
                                      onPress={handleRemoveFriend}
                                    >
                                      <Text style={modalStyles2.optionText}>Remove</Text>
                                    </Pressable>
                                  </Pressable>
                                  <Pressable
                                    style={({ pressed }) => [
                                      modalStyles2.modalContentClose,
                                      pressed && { backgroundColor: "#f0f0f0" }, 
                                    ]}
                                    onPress={() => setOptionsVisible(false)} 
                                  >
                                    <Text style={modalStyles2.closeButtonText}>Cancel</Text>
                                  </Pressable>
                                </View>
                              </Modal>
                            )}
                            {openedCardId === profile.userId && (
                              <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalVisible}
                                onRequestClose={() => {
                                  handleCloseModal(); 
                                  setCurrentMediaIndex(0); 
                                } }

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
                                              onPress={() => handlePreviousMedia(profile)} />

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
                                              onPress={() => handleNextMedia(profile)} />
                                          </>
                                        )}
                                      </View>

                                      <View style={styles.progressIndicatorContainer}>
                                        <ProgressIndicator
                                          step={currentMediaIndex + 1}
                                          totalSteps={profile?.media?.length || 0} />
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
                                        info5={Array.isArray(profile?.profileData?.allTimeGame)
                                          ? profile.profileData.allTimeGame
                                          : (profile?.profileData?.allTimeGame || "").split(", ")}
                                        userId={profile?.userId} />
                                    </ScrollView>

    
                                    <TouchableOpacity style={styles.miniButton} onPress={() => { handleCloseModal(); setCurrentMediaIndex(0); } }>
                                      <Icon name="chevron-down-outline" color={FLASH_ACTIONS} size={25} />
                                    </TouchableOpacity>

                                    <FlagHandler userId={profile.userId} />
                                  </View>
                                </View>
                              </Modal>
                            )}
                          </TouchableOpacity>
                        )}
                        numColumns={2}
                        columnWrapperStyle={styles2.row}
                        onEndReached={loadMoreCurrentFriends}
                        onEndReachedThreshold={0.02} 
                        ListFooterComponent={loadingCurrentFriends ? <ActivityIndicator size="large" color={PRIMARY_COLOR} /> : null} />
                    )}
                  </View>
                ) : (
                  ""
                )}
              </View><View style={[
                styles2.containerPending,
                isPendingExpanded ? { paddingBottom: 130, } : { paddingBottom: 0, },
              ]}>
                  {(pendingFriends.length > 0 && !searchQuery) || (searchedNonFriend && !searching) ? (
                    <View>
                      <TouchableOpacity
                        onPress={() => setIsPendingExpanded(!isPendingExpanded)} 
                        style={styles2.categoryHeader}
                      >
                        <View style={styles2.rowContainer}>
                          <Text style={styles2.groupTitle}>Pending</Text>
                          <Icon
                            type="Foundation"
                            name={isPendingExpanded ? "chevron-down" : "minus"}
                            size={25}
                            color={PRIMARY_COLOR} />
                        </View>
                      </TouchableOpacity>
                      {isPendingExpanded && (
                        <FlatList
                          data={searchQuery ? (searchedNonFriend ? [searchedNonFriend] : []) : pendingFriends} 
                          keyExtractor={(item) => item.userId.toString()}
                          renderItem={({ item: profile }) => (
                            <TouchableOpacity
                              style={styles3.containerCardItem}
                              onPress={() => handleOpenModal(profile.userId)} 
                            >

                              <Image source={{ uri: profile.media?.[0]?.uri }} style={styles3.imageStyle} />

                              <View style={styles3.matchesCardItem}>
                                <Text
                                  style={styles3.matchesTextCardItem}
                                  numberOfLines={1} 
                                  ellipsizeMode="tail" 
                                >
                                  {profile.userName || "Unknown"}
                                </Text>
                              </View>

                              {profile.aboutInfo && (
                                <Text
                                  style={styles3.descriptionCardItem}
                                  numberOfLines={3}
                                  ellipsizeMode="tail"
                                >
                                  {profile.aboutInfo}
                                </Text>
                              )}

                              <View style={styles3.actionsCardItem}>
                                <TouchableOpacity style={styles3.button} onPress={() => declineFriendshipRequest(profile)}>
                                  <Icon type="Foundation" name="minus-thick" color={DISLIKE_ACTIONS} size={25} />
                                </TouchableOpacity>


                                <TouchableOpacity style={styles3.button} onPress={() => acceptFriendshipRequest(profile)}>
                                  <Icon type="MaterialCommunityIcons" name="gamepad-round" color={LIKE_ACTIONS} size={25} />
                                </TouchableOpacity>
                              </View>

                              {openedCardId === profile.userId && (
                                <Modal
                                  animationType="slide"
                                  transparent={true}
                                  visible={modalVisible}
                                  onRequestClose={() => {
                                    handleCloseModal(); 
                                    setCurrentMediaIndex(0); 
                                  } }

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
                                                onPress={() => handlePreviousMedia(profile)} />

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
                                                onPress={() => handleNextMedia(profile)} />
                                            </>
                                          )}
                                        </View>

                                        <View style={styles.progressIndicatorContainer}>
                                          <ProgressIndicator
                                            step={currentMediaIndex + 1}
                                            totalSteps={profile?.media?.length || 0} />
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
                                          info5={Array.isArray(profile?.profileData?.allTimeGame)
                                            ? profile.profileData.allTimeGame
                                            : (profile?.profileData?.allTimeGame || "").split(", ")}
                                          userId={profile?.userId} />
                                      </ScrollView>

                                      <TouchableOpacity style={styles.miniButton} onPress={() => { handleCloseModal(); setCurrentMediaIndex(0); } }>
                                        <Icon name="chevron-down-outline" color={FLASH_ACTIONS} size={25} />
                                      </TouchableOpacity>
                                      <FlagHandler userId={profile.userId} />
                                    </View>
                                  </View>
                                </Modal>
                              )}
                            </TouchableOpacity>
                            
                          )}
                          numColumns={3}
                          columnWrapperStyle={styles3.row}
                          onEndReached={loadMorePendingFriends}
                          onEndReachedThreshold={0.02}
                          ListFooterComponent={loadingPendingFriends ? <ActivityIndicator size="large" color={PRIMARY_COLOR} /> : null} />
                      )}
                    </View>
                  ) : (
                    ""
                  )}

                </View></>   
     )}        
      </View>
      
    );
    
};

const styles2 = StyleSheet.create({
  unavailableText: {
    color: DARK_GRAY,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY,
  },

  containerFriends: {
    marginTop: 10,
    marginHorizontal: 10,
    overflow: "hidden", 
    height: "auto", 
  },
  containerPending: {
    marginTop: 10,
    marginHorizontal: 10,
    paddingTop: 10,
    overflow: "hidden", 
    height: "auto", 
  },
  rowContainer: {
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%", 
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 15,
    backgroundColor: WHITE,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 1,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowColor: BLACK,
    shadowOffset: { height: 2, width: 0 },
  },
  searchBarContainer: {
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  
  searchBar: {
    width: "95%",
    height: 40,
  
    borderRadius: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
  },
  
  noFriendsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    textAlign: "center",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginVertical: 10,
    textAlign: "left",
  },
  container: {
    flex: 1, 
    marginTop: 10,
    marginHorizontal: 10,
    marginLeft: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    justifyContent: "center", 
    alignItems: "center", 
    height: "100%",
    width: "100%",
  },
  containerCardItem: {
    backgroundColor: WHITE,
    borderRadius: 8,
    alignItems: "center",
    margin: 6, 
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 8, 
    shadowColor: BLACK,
    shadowOffset: { height: 10, width: 5 }, 
    width: "45%", 
    height: 220, 
    borderColor:  PRIMARY_COLOR,
 
  },
  imageStyle: {
    width: "100%", 
    height: "70%", 
    borderRadius: 8,

  },
  descriptionCardItem: {
    color: DARK_GRAY,
    textAlign: "center",
    height: 40, 
    paddingHorizontal: 10,
    justifyContent: "center",
    fontSize: 13, 
    marginTop: 10, 
    maxHeight: 20, 
  },
  row: {
    flex: 1,
    justifyContent: "space-between", 
    marginBottom: 20,

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
    justifyContent: "center", // Center content vertically

  },
});

const styles3 = StyleSheet.create({
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
    justifyContent: "space-between", 
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
});

const modalStyles2 = StyleSheet.create({
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    bottom: 60
  },
  modalContent: {
    width: "80%",
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalContentClose: {
    width: "80%",
    backgroundColor: WHITE,
    borderRadius: 10,
    marginTop: 5,
    alignItems: "center",
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  optionButton: {
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: WHITE,
    alignItems: "center",
  },
  optionText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
  },
  closeButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Matches;