import React, { useState, useEffect } from "react";
import {RefreshControl, StyleSheet, TextInput } from "react-native";
import {
  Text,
  TouchableOpacity,
  ImageBackground,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Message } from "../components";
import styles, { GRAY, PRIMARY_COLOR } from "../assets/styles";
import { fetchProfileData } from "../components/UserProfileData";

import { useFocusEffect } from "@react-navigation/native";
import axiosInstance from "../components/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FriendsMessages = ({ userId, navigation }: { userId: string, navigation: any }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0); 
  const profilesPerPage = 9; 
  const [hasMore, setHasMore] = useState(true); 

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultsFriends, setSearchResultsFriends] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  
  const onRefresh = async () => {
    setRefreshing(true); 
    setSkip(0); 
    setHasMore(true); 
    setFriends([]); 
    await fetchFriends(true); 
    setRefreshing(false); 
  };

  const fetchFriends = async (isLoadMore = false) => {
    if (loading || (isLoadMore && !hasMore)) return; 
  
    try {
      const useridCheked = userId || (await AsyncStorage.getItem("userId"));
  
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await axiosInstance.get(
        `/friendships/friends/${useridCheked}?skip=${skip}&take=${profilesPerPage}`
      );
  
      const newFriends = response.data;
  

      const enrichedFriends = await Promise.all(
        newFriends.map(async (friendship: any) => {
          const profileId =
            friendship.foreignKeyProfile1 === useridCheked
              ? friendship.foreignKeyProfile2
              : friendship.foreignKeyProfile1;
  
          let additionalData = null;
          try {
            additionalData = await fetchProfileData(profileId);
          } catch (error) {
            console.error(`Error fetching profile data for profile ID: ${profileId}`, error);
            return null; 
          }

          let isBanned = false;
          try {
            await axiosInstance.get(`/reports/canLogin/${profileId}`);
          } catch (error) {
            if (error.response?.status === 403) {
              isBanned = true; 
            }
          }

          let lastMessage = null;
          try {
            const lastMessageResponse = await axiosInstance.get(
              `/messages/last/${friendship.id}`
            );
            lastMessage = lastMessageResponse.data;
          } catch (error) {
            return null; 
          }
  
          return {
            ...additionalData,
            friendshipId: friendship.id, 
            lastMessage: lastMessage?.text || "", 
            isBanned: isBanned,
          };
        })
      );
  
      const filteredFriends = enrichedFriends.filter((friend) => friend !== null);
  
      setFriends((prev) => {
        const uniqueFriend = filteredFriends.filter(
          (newFriend) =>
            !prev.some(
              (existingfriend) => existingfriend.userId === newFriend.userId
            )
        );
        return [...prev, ...uniqueFriend];
      });
  
      setSkip((prevSkip) => prevSkip + profilesPerPage);

      if (newFriends.length < profilesPerPage) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const searchProfiles = async (query: string) => {
    try {
      

      const response = await axiosInstance.get(`/profiles/search/${query}`);
      const profiles = response.data;
      

      const enrichedProfiles = await Promise.all(
        profiles.map(async (profile: any) => {
          try {
            const isFriendshipResponse = await axiosInstance.get(
              `/friendships/search/${profile.id}`
            );
            const friendship = isFriendshipResponse.data;
            let isBanned = false;
            try {
              await axiosInstance.get(`/reports/canLogin/${profile.id}`);
            } catch (error) {
              if (error.response?.status === 403) {
                isBanned = true; 
              }
            }

            return { ...profile, isFriendship: friendship.isFriendship, friendshipId: friendship.id, isBanned, };
          } catch (error) {
            return null;
          }
        })
      );
      
      const friendsOnly = enrichedProfiles.filter(
        (profile) => profile !== null && profile.isFriendship
      );
      setSearchResultsFriends(friendsOnly);
    } catch (error) {
      console.error("Error searching profiles:", error);
    } finally {
     
    }
  };

  useEffect(() => {
    if (searchQuery) {
      searchProfiles(searchQuery);
    } else {
      setSearchResultsFriends([]);
    }
  }, [searchQuery]);


  const appendProfileToList = async (profile: any) => {
    try {
  
      const profileData = await fetchProfileData(profile.id);
      const updatedProfile = { ...profile, ...profileData }; 

      if (profile.isFriendship) {
        setSearchResultsFriends({ ...profile, ...profileData });
     
      } 
      setSearchResultsFriends([]);
      return updatedProfile; 
    } catch (error) {
      console.error("Error appending profile to list:", error);
      return profile;
    } 
  };

  

   useFocusEffect(
      React.useCallback(() => {
        if (friends.length === 0) {
            setLoading(true);
            setSkip(0); 
            setHasMore(true); 
            fetchFriends();
        }
        return () => {
            setFriends([]); 
            setSkip(0); 
            setHasMore(true); 
            setSearchQuery(""); 

          };
      }, [])
    );

  return (
    <ImageBackground
    source={require("../assets/images/bg.png")}
    style={styles.bg}
  >
    <View style={styles.containerMessages}>
      <View style={styles.top}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles2.searchBarContainer}>
        <TextInput
          style={styles2.searchBar}
          placeholder="Search by username..."
          placeholderTextColor={GRAY}
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      {searchQuery ? (
        searchResultsFriends.length > 0 ? (
          <FlatList
            data={searchResultsFriends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item: profile }) => (
              <TouchableOpacity
                style={styles2.searchResultItem}
                onPress={async () => {
                  const updatedProfile = await appendProfileToList(profile);
                  navigation.navigate("Messaging", {
                    friendshipId: updatedProfile.friendshipId,
                    userName: updatedProfile.username,
                    userImage: updatedProfile.media?.[0]?.uri,
                    isBanned: profile.isBanned,
                  });
                  setSearchQuery(""); 
                }}
              >
                <Text>{profile.username}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles2.loadingContainer}>
            <Text>No results found.</Text>
          </View>
        )
      ) : (
        <>
          {loading && friends.length === 0 ? (
            <View style={styles2.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("Messaging", {
                      friendshipId: item.friendshipId,
                      userName: item.userName,
                      userImage: item.media?.[0]?.uri,
                      isBanned: item.isBanned,
                    });
                  }}
                >
                  <Message
                    image={
                      item.media?.[0]?.type === "photo"
                        ? item.media[0]?.uri
                        : undefined
                    }
                    name={item.userName}
                    lastMessage={item.lastMessage}
                  />
                </TouchableOpacity>
              )}
              onEndReached={() => fetchFriends(true)}
              onEndReachedThreshold={0.02}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                ) : null
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh}  colors={[PRIMARY_COLOR]} />
              } 
            />
          )}
        </>
      )}
    </View>
  </ImageBackground>
  );
};

const styles2 = StyleSheet.create({

  searchBarContainer: {
    marginBottom: 10,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 15,
    padding: 8,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});


export default FriendsMessages;