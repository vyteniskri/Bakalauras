import React, { createRef, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Matches, Profile, Login, Introduction, Register, HomeTemplate, AboutIntro, 
  MediaIntro, SelectCategoriesIntro, AvatarIntro, PlatformIntro, SchedulePlaystile, GameIntro, Edit, Search, FilteredProfiles, FriendsMessages, Messaging, ResetPassword } from "./screens";
import styles, { PRIMARY_COLOR, DARK_GRAY, WHITE, BLACK } from "./assets/styles";
import TabBarIcon from "./components/TabBarIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Linking, LogBox } from "react-native";
import { OptionalCategory, FloatingSearchBar, Notification, Icon } from "./components";
import axiosInstance, { setNavigation } from "./components/axiosInstance";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
import { NavigationContainerRef } from "@react-navigation/native";
import PreviewWrapper from "./components/Preview";
import MannageAccount from "./screens/ManageAccount";


LogBox.ignoreAllLogs(true);
const navigationRef = createRef<NavigationContainerRef<{}>>();
const App = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [homeKey, setHomeKey] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false); 
  const [clicked, setClicked] = useState(true);
  const [warning, setWarning] = useState<any>(null);


  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const reportsResponse = await axiosInstance.get(`/reports/Once`);
        const reportId = reportsResponse.data.id;

        const warningsResponse = await axiosInstance.get(`warnings/${reportId}`);
        const warningData = warningsResponse.data;

        const clicked = warningData.clicked;
        setClicked(clicked);
        setWarning(warningData);
      } catch (error) {
      }
    };

    fetchWarnings();
  }, [refreshKey, homeKey]);

  const toggleNotifications = async () => {
    setNotificationsVisible((prev) => !prev); 

    if (!clicked) {
      try {

        axiosInstance.put(`/warnings/${warning.id}`);
        setClicked(true); 
      } catch (error) {
      }
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        const storedToken = await AsyncStorage.getItem("accessToken");

        setToken(storedToken);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [refreshKey, homeKey]); 

  if (!token && loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <NavigationContainer
      key={refreshKey && token} 
      ref={navigationRef}
      onReady={() => {
        setNavigation(() => setRefreshKey((prev) => prev + 1)); 
      }}
    >
      <Stack.Navigator>
      { !token  && (
          <Stack.Screen
          name="Introduction"
          component={Introduction}
          options={{
            headerLeft: () => null,  
            headerTitle: () => <View />, 
            headerStyle: {
              backgroundColor: PRIMARY_COLOR, 
            },
          }}
        />
        ) }
        <Stack.Screen
          name="MatchToGame"
          options={({ navigation }) => ({
            headerStyle: {
              backgroundColor: PRIMARY_COLOR, 
            },
            headerTintColor: WHITE, 
            headerShown: true,
            headerLeft: () => null,
            headerRight: () => (
              <View style={{ flexDirection: "row" }}>
                {token === null && !loading && (
                  <View style={{ paddingTop: 10, paddingRight: 15 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: PRIMARY_COLOR,
                        width: 100,
                        height: 40,
                        borderRadius: 25,
                        justifyContent: "center",
                        alignItems: "center",
                        borderColor: "white",
                        borderWidth: 2,
                        shadowColor: "rgba(0, 0, 0, 0.75)",
                        shadowOffset:  { width: 1, height: 1 }, 
                        shadowRadius: 2,

                      }}
                      onPress={() => navigation.navigate("Introduction")}
                    >
                      <Text style={{ 
                        color: "white",
                         fontSize: 18, 
                         fontWeight: "bold" ,
                         textShadowColor: "rgba(0, 0, 0, 0.75)", 
                         textShadowOffset: { width: 1, height: 1 }, 
                         textShadowRadius: 2, 
                         }}>Join Now</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {token && (
                   <TouchableOpacity  
                   style={{
                       paddingRight: 20,
                     }} onPress={toggleNotifications}>
 
                     <Icon type="FontAwesome5" name="bell" size={30} color={WHITE} />
                     {!clicked && (
                        <View style={styles.Circle} />
                      )}
                  </TouchableOpacity>
                )}
              </View>
            ),
          })}
        >
        
          {() => (
            <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            <Tab.Navigator
              screenOptions={{
                showLabel: false,
                activeTintColor: PRIMARY_COLOR,
                inactiveTintColor: DARK_GRAY,
              }}
            >
             
             <Tab.Screen
                name="HomeTemplate"
                options={{
                  tabBarLabel: "Match",
                  tabBarIcon: ({ focused }) => (
                    <TabBarIcon focused={focused} typ="Ionicons" iconName="search" text="Match" />
                  ),
                  headerShown: false,
                }}
               
                listeners={{
                  tabPress: (e) => {
                    if (token) {
                      setHomeKey((prev) => prev + 1);
                    }
                  },
                }}
              >
               {(props) =>
                  !loading && ( 
                    <PreviewWrapper
                      imageWidth={400}
                      imageHeight={400}
                      isLoggedIn={token}
                      previewImages={[
                        require("./preview/Match1.png"),
                        require("./preview/Match2.png"),
                      ]}
                      previewText={
                        <Text>
                          Discover and connect with other gamers.{" "}
                          <Text style={{ fontWeight: "bold", color: PRIMARY_COLOR }}>Join Now!</Text>
                        </Text>
                      }
                    >
                      <>
                        <HomeTemplate {...props} />
                        <FloatingSearchBar />
                      </>
                    </PreviewWrapper>
                  )
                }
              </Tab.Screen>
              <Tab.Screen
                  name="Friends"
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <TabBarIcon focused={focused} typ="Ionicons" iconName="people" text="Matches" />
                    ),
                    headerShown: false,
                  }}>
                     {(props) => (
                    <PreviewWrapper
                      imageWidth={590} 
                      imageHeight={590} 
                      isLoggedIn={token}
                      previewImages={[require("./preview/Friends.png")]}
                      previewText={
                        <Text>
                          Grow your gaming friends list. <Text style={{ fontWeight: "bold", color: PRIMARY_COLOR }}>Join Now!</Text>
                        </Text>
                      }
                    >
                      <Matches {...props} />
                    </PreviewWrapper>
                )}
              </Tab.Screen>
                    <Tab.Screen
                      name="Messages"
                    
                      options={{
                        tabBarIcon: ({ focused }) => (
                          <TabBarIcon focused={focused} typ="Ionicons" iconName="chatbubble" text="FriendsMessages" />
                        ),
                        headerShown: false,
                      }} >
                       {(props) => (
                          <PreviewWrapper
                            imageWidth={440} 
                            imageHeight={440} 
                            isLoggedIn={token}
                            previewImages={[require("./preview/Messages.png")]}
                            previewText={
                              <Text>
                                Share the most thrilling experiences with your gaming buddies. <Text style={{ fontWeight: "bold", color: PRIMARY_COLOR }}>Join Now!</Text>
                              </Text>
                            }
                          >
                             <FriendsMessages {...props} />
                          </PreviewWrapper>
                      )}
                    </Tab.Screen>

                    <Tab.Screen
                      name="Profile"
                      options={{
                        tabBarIcon: ({ focused }) => (
                          <TabBarIcon focused={focused} typ="Ionicons" iconName="person" text="Profile" />
                        ),
                        headerShown: false,
                      }}
                    >
                      {(props) => (
                      <PreviewWrapper
                          imageWidth={450} 
                          imageHeight={450} 
                          isLoggedIn={token} 
                          previewImages={[require("./preview/Profile.png")]}
                          previewText={
                            <Text>
                              Express yourself and create the coolest looking gamer account.
                              <Text style={{ fontWeight: "bold", color: BLACK }}> Anonymity </Text>
                              <Text style={{ fontWeight: "bold"}}>is key 🤫.</Text>
                              <Text style={{ fontWeight: "bold", color: PRIMARY_COLOR }}> Join Now!</Text>
                            </Text>
                          }
                        >
                        <Profile
                          {...props}
                          onLogoutSuccess={() => setRefreshKey((prev) => prev + 1)} 
                        />
                       </PreviewWrapper>
                    )}
                  </Tab.Screen>
            </Tab.Navigator>
                    {notificationsVisible && (
                      <Notification
                        visible={notificationsVisible}
                        onClose={() => setNotificationsVisible(false)}
                      />
                    )}
            </KeyboardAvoidingView>
          )}
        </Stack.Screen>
        <Stack.Screen name="Login">
          {(props) => <Login {...props} onLoginSuccess={() => setRefreshKey((prev) => prev + 1)} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={Register} />   
        <Stack.Screen name="AboutIntro" component={AboutIntro} options={{  headerShown: false}} />
        <Stack.Screen name="AvatarIntro" component={AvatarIntro} options={{  headerShown: false}} />
        <Stack.Screen name="PlatformIntro" component={PlatformIntro} options={{  headerShown: false}} />
        <Stack.Screen name="SchedulePlaystile" component={SchedulePlaystile} options={{  headerShown: false}} />
        <Stack.Screen name="MediaIntro" component={MediaIntro} options={{  headerShown: false}}  />
        <Stack.Screen name="GameIntro" options={{  headerShown: false}}>
          {(props) => <GameIntro {...props} onLoginSuccess={() => setRefreshKey((prev) => prev + 1)} />}
        </Stack.Screen>
        <Stack.Screen name="OptionalCategory" component={OptionalCategory} options={{  headerShown: false}} /> 
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="FilteredProfiles" component={FilteredProfiles} options={{  headerShown: true, title: "Found Profiles"}} /> 
        <Stack.Screen name="Profile">
          {(props) => ( <Profile {...props} onLogoutSuccess={() => setRefreshKey((prev) => prev + 1)} />)}
        </Stack.Screen>
        <Stack.Screen
              name="Messaging"
              component={Messaging}
              options={({ route }) => ({
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={{ uri: route.params.userImage }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 10,
                      }}
                    />
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: WHITE }}>
                      {route.params.userName}
                    </Text>
                  </View>
                ),
                headerStyle: {
                  backgroundColor: PRIMARY_COLOR,
                },
                headerTintColor: WHITE, 
              })}
            />
        <Stack.Screen name="SelectCategoriesIntro" component={SelectCategoriesIntro} options={{  headerShown: false}}  />
        <Stack.Screen name="Edit" component={Edit} options={{  headerShown: true, title: "Edit Profile"}} />
        <Stack.Screen name="ManageAccount">
          {(props) => (
            <MannageAccount
              {...props}
              onAccountUpdate={() => {
                AsyncStorage.removeItem("accessToken").then(() => {
                  setRefreshKey((prev) => prev + 1);
                });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ResetPassword" component={ResetPassword}/>
      </Stack.Navigator>
    </NavigationContainer>

  );
};

export default App;

