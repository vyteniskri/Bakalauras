import React, { useEffect, useRef, useState } from "react";
import { View, ImageBackground, ActivityIndicator, StyleSheet, Text } from "react-native";
import Swiper from "react-native-deck-swiper";
import { CardItem } from "../components";
import styles, { PRIMARY_COLOR } from "../assets/styles";
import { fetchProfileData } from "../components/UserProfileData"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { manageFriends } from "../components/ManageFriends";
import axiosInstance from "../components/axiosInstance";


const Home =  ({ navigation, route }: { navigation: any; route: any }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true); 
 const [numberOfTimesSwipped, setNumberOfTimesSwiped] = useState(0);
 const swiperRef = useRef<any>(null);
 const [modalVisible, setModalVisible] = useState(false); 
const [activated, setActivated] = useState(0); 
  const [noContect, setNoContact] = useState(false); 

const fetchProfiles = async (timesLooped: number = 0) => {
  try {

    if (timesLooped >= 10) {
      setNoContact(true); 
      return; 
    }

    setLoading(true);

    const response = await axiosInstance.get("/profiles");
    const profiles = response.data;

    if (profiles.length > 0) {

      const enrichedProfiles = await Promise.all(
        profiles.map(async (profile: any) => {
          try {
            const additionalData = await fetchProfileData(profile.id);
            return { ...profile, ...additionalData };
          } catch (error) {
            return null; 
          }
        })
      );


      const validProfiles = enrichedProfiles.filter((profile) => profile !== null);

      if (validProfiles.length > 0) {
        setProfiles(validProfiles); 
      } else {
        await fetchProfiles(timesLooped + 1); 
      }

    } else {
      await fetchProfiles(timesLooped + 1); 
    }

    setLoading(false);
  } catch (error) {
    setLoading(false); 
  }
};


    useEffect(() => {
   
       
        fetchProfiles();
      
    }, []);


  

    useEffect(() => {;
      if (numberOfTimesSwipped == profiles.length - 1) {
        fetchProfiles();
      }
    }, [numberOfTimesSwipped, activated]);
    
    const onSwiped = (index: number) => {
      setNumberOfTimesSwiped(index);
      setActivated((prev) => prev + 1);
    };


    const onSwipedRight = async (index: number) => {
      const profile = profiles[index]; 
      const storedToken = await AsyncStorage.getItem("accessToken");
    
      if (profile && storedToken) {
        try {
              const isFriendship = await manageFriends.checkFriendship(
                profile.id,
              navigation
            );
            const isFriendshipPending = await manageFriends.checkPendingFriendship(
              profile.id,
            navigation
          );
          if (!isFriendship) {
            await manageFriends.sendFriendshipInvitation(profile.id, navigation); 
            return;
          }
          if(isFriendshipPending) {
            await manageFriends.acceptFriendship(profile.id, navigation); 
            return;
          }
          
        } catch (error) {
          
        }
      }
    };

    const onSwipedLeft = async (index: number) => {
      const profile = profiles[index];
      const storedToken = await AsyncStorage.getItem("accessToken");
    
      if (profile && storedToken) {
        try {
          await manageFriends.removeNewFriendship(profile.id, navigation);
        } catch (error) {
         
        }
      }
    };


  if (loading) {
    return (
      <View style={styles2.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (noContect) {
    return (
      <View style={styles2.loadingContainer}>
        <Text>No profiles found. Please try again later.</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={require("../assets/images/bg.png")} style={styles.bg}>
      <View style={styles.containerHome}>
        <View style={styles.top}>
        </View>

        <Swiper
          ref={swiperRef} 
          cards={profiles}
          renderCard={(profile) => (
            <CardItem
              hasActions
              image={profile.media?.[0]?.uri || null}
              name={profile.userName || "Unknown"}
              description={profile.aboutInfo || "No description available"}
              additionalData={profile}
              userId={profile.id}
              onLike={() => swiperRef.current.swipeRight()} 
              onDislike={() => swiperRef.current.swipeLeft()} 
              setModalVisible={setModalVisible}
            />
          )}
          onSwiped={onSwiped}
          onSwipedRight={onSwipedRight}
          onSwipedLeft={onSwipedLeft}
          verticalSwipe={false}
          horizontalSwipe={!modalVisible} 
          cardIndex={0}
          backgroundColor="transparent"
          horizontalThreshold={200} 
          verticalThreshold={200}
          cardHorizontalMargin={0}
          marginTop={0}
          stackSize={3}
          stackScale={7}
          marginBottom={0}
        />
      </View>
    </ImageBackground>
  );
};

const styles2 = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;