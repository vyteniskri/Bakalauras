import React, { useEffect, useRef, useState,  } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRIMARY_COLOR, WHITE } from "../assets/styles";
import { Icon } from "../components";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import * as FileSystem from 'expo-file-system';
import axiosInstance from "../components/axiosInstance";


const Edit = ({ navigation, route }: { navigation: any; route: any }) => {
  const [categories, setCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [filters, setFilters] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; filePath: string; number: number | null }[]>([]); 
  const [mainPhoto, setMainPhoto] = useState(null); 
  const [refreshGrid, setRefreshGrid] = useState(false); 
  const [videos, setVideos] = useState<{ id: string; filePath: string; number: number | null  }[]>([]); 
  const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
  const [isMainInfoModalVisible, setIsMainInfoModalVisible] = useState(false); 
  const [userName, setUserName] = useState("");
  const [userNameCopy, setUserNameCopy] = useState("");
  const [selectedMainPhoto, setSelectedMainPhoto] = useState<string | null>(null); 
  const [mainPhotoCopy, setRemoveMainPhoto] = useState<string | null>(null); 

  const [aboutInfoCopy, setAboutInfoCopy] = useState<{ id: number | null; text: string | null }>({
  id: null,
  text: '',
  });
  const [aboutInfo, setAboutInfo] = useState<{ id: number | null; text: string | null }>({
    id: null,
    text: '',
  });
  const [searchQuery, setSearchQuery] = useState(""); 
  const [loadingFilters, setLoadingFilters] = useState(false); 
  const [uploadingPosition, setUploadingPosition] = useState<number | null>(null);


  const [searchOffset, setSearchOffset] = useState(0); 
  const [defaultOffset, setDefaultOffset] = useState(0);
  const [hasMoreFilters, setHasMoreFilters] = useState(true); 
  const [loadingMoreFilters, setLoadingMoreFilters] = useState(false); 
  const limit = 50; 
  const flatListRef = useRef<FlatList<any>>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [numberOfSelectedFilters, setNumberOfSelectedFilters] = useState(0); 
  const [resetFilters, setResetFilters] = useState(true); 


  const handleUpdateInformationField = async () => {

    try {
      const response = await axiosInstance.put(
        `/informationFieldProfile/${aboutInfo.id}`,
        { text: aboutInfo.text },
      );
  
      if (response.status === 200) {

        setAboutInfo({
          id: response.data.id, 
          text: response.data.text, 
        });
        setAboutInfoCopy({
          id: response.data.id, 
          text: response.data.text, 
        });
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          setAboutInfo(aboutInfoCopy);
          Alert.alert('Please try again');
          navigation.navigate("AccessToken"); 
        } else if (status === 422) {
          Alert.alert("About Me Is Incorrect", "Text must be between 2 and 500 characters."); 
          throw new Error("Username already exists");  
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    }
  };


  useEffect(() => {
    const fetchInformationField = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const userId = await AsyncStorage.getItem("userId");
  
        if (token && userId) {
          const aboutProfileInfo = await axiosInstance.get(
            `/informationField/${userId}`
          );
          setAboutInfo({
            id: aboutProfileInfo.data.id, 
            text: aboutProfileInfo.data.text, 
          });
          setAboutInfoCopy({
            id: aboutProfileInfo.data.id, 
            text: aboutProfileInfo.data.text,
          });
        }
      } catch (error) {
        console.error("Error fetching informationField:", error);
      }
    };
    
     fetchInformationField(); 
    
  }, []);


  const handleUpdateMainInformation = async () => {


    if (mainPhoto && userName == userNameCopy && aboutInfo == aboutInfoCopy) {
      setIsMainInfoModalVisible(false);
      return;
    }
    if (!selectedMainPhoto && !mainPhoto) {
      Alert.alert("No Photo Selected", "Please select a photo before pressing Done.");
      return;
    }
    if (userName == ""){
      Alert.alert("No Username Selected", "Please input a username before pressing Done.");
      return;
    }
    if (userName.includes(" ")) {
      Alert.alert("Invalid Username", "Usernames cannot contain spaces.");
      return;
    }
    if (userName.length > 28) {
      Alert.alert("Invalid Username", "Usernames is too long (Max 28 characters).");
      return;
    }
    if (aboutInfo.text == ""){
      Alert.alert("About Me Is Empty", "Please input some information before pressing Done.");
      return;
    }
    if (aboutInfo.text?.length <2 || aboutInfo.text?.length > 500){
      Alert.alert("About Me Is Incorrect", "Text must be between 2 and 500 characters."); 
      return;
    }

    try {
      if (userName !== userNameCopy) {
          await handleUpdateUsername();
      }
      
      if (mainPhotoCopy && selectedMainPhoto) {
        await deletePhoto(mainPhotoCopy.id); 
        await handleUploadMainPhoto();
      }
      if (aboutInfo !== aboutInfoCopy) {
        await handleUpdateInformationField();
      }
      setIsMainInfoModalVisible(false);
      
    
    } catch (error) {

    }
  };

  const handleUpdateUsername = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
  
      const response = await axiosInstance.put(
        `/profiles`,
        { username: userName }, 
      );
      setUserName(response.data.username); 
      setUserNameCopy(response.data.username); 

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          setUserName(userNameCopy);
          Alert.alert('Please try again');
          navigation.navigate("AccessToken");
        } else if (status === 422) {
          setUserName(userNameCopy);
          Alert.alert('Username already exists', "Please try a different one.");
          throw new Error("Username already exists");
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    }
  };

  const handleSelectMainPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled) {
        setSelectedMainPhoto(result.assets[0].uri); 
      }
    } catch (error) {
      console.error("Error selecting main photo:", error);
      Alert.alert("Error", "Failed to select the main photo. Please try again.");
    }
  };

  const handleUploadMainPhoto = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
  
      const formData = new FormData();
      formData.append("file", {
        uri: selectedMainPhoto,
        name: "main_photo.jpg",
        type: "image/jpeg",
      });
  
      const response = await axiosInstance.post(
        `/photos/profile/true/0`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (response.status === 201) {
        setMainPhoto(response.data); 
        setRemoveMainPhoto(mainPhoto);
        setSelectedMainPhoto(null); 
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          Alert.alert('Please try again');
          navigation.navigate("AccessToken");
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    }
  };

useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const userId = await AsyncStorage.getItem("userId");

        if (token && userId) {
          const profileInfo = await axiosInstance.get(
            `/profiles/${userId}`,
          );
          setUserName(profileInfo.data.username);
          setUserNameCopy(profileInfo.data.username);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchUserName();
  }, []);

  const pickVideo = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'You need to grant access to your media library.');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['videos'], 
      allowsEditing: true,
    });
  
    if (!result.canceled) {
      const videoUri = result.assets[0].uri;
  
      try {
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
  
        if (!fileInfo.exists || !fileInfo.size) {
          Alert.alert('Error', 'Unable to determine file size.');
          return;
        }
  
        const fileSize = fileInfo.size;
        if (fileSize > MAX_VIDEO_SIZE) {
          Alert.alert('File Too Large', `The selected video exceeds the 20MB limit.`);
          return;
        }
  
        uploadVideo(index, videoUri);
      } catch (error) {
        console.error('Error checking file size:', error);
        Alert.alert('Error', 'Failed to verify file size.');
      }
    }
  };


  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const userId = await AsyncStorage.getItem("userId");

        if (token && userId) {
          const videosResponse = await axiosInstance.get(
            `/videos/profile/${userId}`,
          );

          const fetchedVideos = videosResponse.data;
          setVideos(fetchedVideos);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, [refreshGrid]);

  const deleteVideo = async (videoId) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      await axiosInstance.delete(`/videos/${videoId}`);

      setVideos((prevVideos) =>
        prevVideos.filter((video) => video.id !== videoId) 
      );
      setRefreshGrid((prev) => !prev);
    } catch (error) {
      if (error.response) {
        
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          Alert.alert('Please try again');
          navigation.navigate("AccessToken");
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    }
  };

  const uploadVideo = async (position: number, videoUri: string) => {
    try {
        setUploadingPosition(position);
        const token = await AsyncStorage.getItem("accessToken");

        const formData = new FormData();
        formData.append("file", {
          uri: videoUri,
          name: "video.mp4",
          type: "video/mp4",
        });

        const response = await axiosInstance.post(
          `/videos/profile/${position}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 201) {
          setVideos((prevVideos) => {
            const updatedVideos = [...prevVideos];
            updatedVideos[position - 1] = response.data; 
            return updatedVideos;
          });
        }
        
        setRefreshGrid((prev) => !prev);
      
    } catch (error) {
      if (error.response) {
        
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          Alert.alert('Please try again');
          navigation.navigate("AccessToken"); 
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    } finally {
      setUploadingPosition(null);
    }
  };

  const uploadPhoto = async (position) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled) {
  
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          name: "photo.jpg",
          type: "image/jpeg",
        });

        var isMain = false;
        if (position === 0) {
          isMain = true; 
        }

        const response = await axiosInstance.post(
          `/photos/profile/${isMain}/${position}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
  
        if (response.status === 201) {
          setPhotos((prevPhotos) => {
            const updatedPhotos = [...prevPhotos];
            updatedPhotos[position - 1] = response.data; 
            return updatedPhotos;
          });
          setRefreshGrid((prev) => !prev);
        }
      }
    } catch (error) {
      if (error.response) {
        
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          Alert.alert('Please try again');
          navigation.navigate("AccessToken"); 
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    }
  };
  
  const deletePhoto = async (photoId) => {
    try {
  
      await axiosInstance.delete(`/photos/${photoId}` );
      
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo, index) =>
          photo?.id === photoId ? null : photo 
        )
      );
      setRefreshGrid((prev) => !prev);
    } catch (error) {
      if (error.response) {
        
        const status = error.response.status;
        if (status === 500) {
          Alert.alert("Error", "Endpoint not found (404). Please try again.");
        } else if (status === 401) {
          Alert.alert('Please try again');
          navigation.navigate("AccessToken"); 
        } else {
          Alert.alert("Error", `An error occurred: ${status}`);
        }
      }
    }
  };


  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const userId = await AsyncStorage.getItem("userId");
  
        if (token && userId) {
          const photosResponse = await axiosInstance.get(
            `/photos/profile/${userId}`
          );
  
          const fetchedPhotos = photosResponse.data;
  
          const mainPhoto = fetchedPhotos.find((photo) => photo.mainOrNot);
          const otherPhotos = fetchedPhotos.filter((photo) => !photo.mainOrNot);
          setMainPhoto(mainPhoto);
          setRemoveMainPhoto(mainPhoto);
          setPhotos(otherPhotos);
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };
  
    fetchPhotos();
  }, [refreshGrid]);




  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("accessToken");
  
        if (token) {
          const categoriesResponse = await axiosInstance.get(
            `/categories2`
          );
          let categoriesData = categoriesResponse.data;
  
          categoriesData = categoriesData.sort((a, b) => a.priority - b.priority);
  
          const categoriesWithSubcategories = await Promise.all(
            categoriesData.map(async (category) => {
              try {
                const subCategoriesResponse = await axiosInstance.get(
                  `/subCategories2/${category.id}`,
                );
                let subCategoriesData = subCategoriesResponse.data;
  
                subCategoriesData = subCategoriesData.sort(
                  (a, b) => a.priority - b.priority
                );

                  const subCategoriesWithVisibility = await Promise.all(
                    subCategoriesData.map(async (subCategory) => {
                      try {
                        const visibilityResponse = await axiosInstance.get(
                          `/subCategoriesProfile/subId/${subCategory.id}`
                        );

                        const isVisible = visibilityResponse.data.length > 0; 
                        return {
                          ...subCategory,
                          visibilityState: isVisible, 
                        };
                      } catch (error) {
                        console.error(
                          `Error fetching visibility for SubCategory ID ${subCategory.id}:`,
                          error
                        );
                        return {
                          ...subCategory,
                          visibilityState: false, 
                        };
                      }
                    })
                  );

                return {
                  ...category,
                  subCategories: subCategoriesWithVisibility,
                };
              } catch (error) {
                console.error(
                  `Error fetching subcategories for Category ID ${category.id}:`,
                  error
                );
                return { ...category, subCategories: [] };
              }
            })
          );
  
          setCategories(categoriesWithSubcategories);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);


  const handleEndReached = () => {
    if (filters.length < limit) return; 
    if (searchQuery.trim() !== "") {
      if (hasMoreFilters && !loadingMoreFilters) {
        setSearchOffset((prevOffset) => prevOffset + limit); 
      }
    } else {
      if (hasMoreFilters && !loadingMoreFilters) {
        setDefaultOffset((prevOffset) => prevOffset + limit); 
      }
    }
  };
  
  useEffect(() => {
    setHasMoreFilters(true);
    setSearchOffset(0); 
    setDefaultOffset(0); 
    setLoadingFilters(true); 
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
    if (debouncedSearchQuery.trim() === "") {
      setFilters([]); 
    }
  }, [debouncedSearchQuery]);


  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); 
  
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);


  useEffect(() => {
    const fetchStoredFilters = async () => {
      try {
        setLoadingMoreFilters(true);
       const storedData = await AsyncStorage.getItem("allCategoriesWithFilters");
      const storedFilters = storedData ? JSON.parse(storedData) : [];

        if (debouncedSearchQuery.trim() !== "") {

                const searchResponse = await axiosInstance.get(
                  `/filters/subcategoryFilter/${selectedSubCategory.id}/search/${searchQuery}?limit=${limit}&offset=${searchOffset}`
                );
                const searchResults = searchResponse.data;
                const updatedFilters = searchResults.map((filter) => ({
                  ...filter,
                  id: filter.filter.id,
                  text: filter.filter.text,
                  subCategoryFilterId: filter.subCategoryFilterId,
                  subCategoryFilterTitle: selectedSubCategory.title,
                }));
                const flaggingSelectedFilters = updatedFilters.map((filter) => ({
                  ...filter,
                  isSelected: storedFilters.some(
                    (storedFilter) =>
                      storedFilter.subCategoryFilterId === filter.subCategoryFilterId
                  ),
                }));

                if (searchOffset === 0) {
                  setFilters(flaggingSelectedFilters);
                } else {
                  setFilters((prevFilters) => {
                    const uniqueFilters = flaggingSelectedFilters.filter(
                      (newFilter) =>
                        !prevFilters.some(
                          (existingFilter) => existingFilter.text === newFilter.text
                        )
                    );
                    return [...prevFilters, ...uniqueFilters];
                  }); 
          
                }

                if (searchResults.length < limit) {
                  setHasMoreFilters(false);
                }
                setLoadingFilters(false); 
        } else {

          const filtersResponse = await axiosInstance.get(
            `/subCategoryFilters/limit/${selectedSubCategory.id}?limit=${limit}&offset=${defaultOffset}`
          );
  
          const subCategoryFiltersData = filtersResponse.data;

          const filtersWithDetails = await Promise.all(
            subCategoryFiltersData.map(async (subCategoryFilter) => {
              try {
                const filterResponse = await axiosInstance.get(
                  `/filters/${subCategoryFilter.foreignKeyFilterId}`
                );
                const filterData = filterResponse.data;
  
                return {
                  ...filterData,
                  subCategoryFilterId: subCategoryFilter.id, 
                  subCategoryFilterTitle: selectedSubCategory.title,
                };
              } catch (error) {
                console.error(
                  `Error fetching filter details for Filter ID ${subCategoryFilter.foreignKeyFilterId}:`,
                  error
                );
                return null; 
              }
            })
          );
  
          const updatedFilters = filtersWithDetails
            .filter((filter) => filter !== null) 
            .map((filter) => ({
              ...filter,
              isSelected: storedFilters.some(
                (storedFilter) =>
                  storedFilter.subCategoryFilterId === filter.subCategoryFilterId
              ),
            }));

          setFilters((prevFilters) => {
            const uniqueFilters = updatedFilters.filter(
              (newFilter) =>
                !prevFilters.some(
                  (existingFilter) => existingFilter.text === newFilter.text
                )
            );
            return [...prevFilters, ...uniqueFilters];
          });
 
  
          if (subCategoryFiltersData.length < limit) {
            setHasMoreFilters(false);
          }
          setLoadingFilters(false); 
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404) {
            setHasMoreFilters(false);
          }
        }
      } finally {
        setLoadingMoreFilters(false);
    
      }
    };
  
    fetchStoredFilters();
  }, [searchOffset, defaultOffset, debouncedSearchQuery]); 
  

  const handleSubCategoryClick = async (subCategory) => {
    setFilters([]); 
    setSelectedSubCategory(subCategory);
    setLoadingFilters(true); 
    setDefaultOffset(0);
    setSearchOffset(0); 
    setHasMoreFilters(true); 
    setNumberOfSelectedFilters(0); 

    try {
      const storedData = await AsyncStorage.getItem("allCategoriesWithFilters");
      const storedFilters = storedData ? JSON.parse(storedData) : [];

      const filtersResponse = await axiosInstance.get(
        `/subCategoryFilters/limit/${subCategory.id}?limit=${limit}&offset=${defaultOffset}`
      );
      const subCategoryFiltersData = filtersResponse.data;
  
      const filtersWithDetails = await Promise.all(
        subCategoryFiltersData.map(async (subCategoryFilter) => {
          try {
            const filterResponse = await axiosInstance.get(
              `/filters/${subCategoryFilter.foreignKeyFilterId}`
            );
            const filterData = filterResponse.data;
  
            return {
              ...filterData,
              subCategoryFilterId: subCategoryFilter.id,
              subCategoryFilterTitle: subCategory.title, 
            };
          } catch (error) {
            console.error(
              `Error fetching filter details for Filter ID ${subCategoryFilter.foreignKeyFilterId}:`,
              error
            );
            return null; 
          }
        })
      );

      const updatedFilters = filtersWithDetails
        .filter((filter) => filter !== null) 
        .map((filter) => ({
          ...filter,
          isSelected: storedFilters.some(
            (storedFilter) =>
              storedFilter.subCategoryFilterId === filter.subCategoryFilterId
          ),
        }));

        setNumberOfSelectedFilters(
          storedFilters.filter(
            (storedFilter) => storedFilter.subCategory === subCategory.title
          ).length
        );

    
      setFilters(updatedFilters); 
    } catch (error) {
      console.error("Error fetching filters:", error);
    } finally {
      setLoadingMoreFilters(false); 
      setLoadingFilters(false);
      setResetFilters(false); 
    }
  };

  const toggleFilterSelection = (subCategoryFilterId) => {
    const MaxNumberOfFilters = selectedSubCategory.maxNumberOfFilters || 0;
  

    if (
      !filters.find((filter) => filter.subCategoryFilterId === subCategoryFilterId)
        .isSelected &&
        numberOfSelectedFilters >= MaxNumberOfFilters
    ) {
      Alert.alert(
        "Limit Reached",
        `You can select only ${MaxNumberOfFilters} filters.`
      );
      return;
    }

    setFilters((prevFilters) => {
      let isSelected = false; 
    
      const updatedFilters = prevFilters.map((filter) => {
        if (filter.subCategoryFilterId === subCategoryFilterId) {
          isSelected = !filter.isSelected; 
          return { ...filter, isSelected: !filter.isSelected };
        }
        return filter;
      });
    
      setNumberOfSelectedFilters((prevCount) =>
        isSelected ? prevCount + 1 : prevCount - 1
      );
    
      return updatedFilters;
    });
    setSelectedFilters((prevSelectedFilters) => {
      if (prevSelectedFilters.includes(subCategoryFilterId)) {
        return prevSelectedFilters.filter((id) => id !== subCategoryFilterId);
      } else {
        return [...prevSelectedFilters, subCategoryFilterId];
      }
    });
  };

  const updateFiltersInDatabase = async () => {
    try {
      if (numberOfSelectedFilters === 0 && selectedSubCategory.canChangeVisibility == false) {
        Alert.alert("Select at least one item");
        setDefaultOffset(0);
        setIsModalVisible(true); 
        setResetFilters(true); 
        await handleSubCategoryClick(selectedSubCategory); 
      
        return;
      }
  
      const token = await AsyncStorage.getItem("accessToken");
  
      if (token) {
        const storedData = await AsyncStorage.getItem("allCategoriesWithFilters");
        const storedFilters = storedData ? JSON.parse(storedData) : []; 
  
        const storedSubCategoryFilterIds = Array.isArray(storedFilters)
          ? storedFilters.map((filter) => filter.subCategoryFilterId)
          : [];
  
        const filtersToAdd = selectedFilters.filter(
          (subCategoryFilterId) =>
            !storedSubCategoryFilterIds.includes(subCategoryFilterId)
        );
  
        const filtersToRemove = selectedFilters.filter((subCategoryFilterId) =>
          storedSubCategoryFilterIds.includes(subCategoryFilterId)
        );
  

        for (const subCategoryFilterId of filtersToAdd) {
          if (subCategoryFilterId) {
            await axiosInstance.post(
              `/profileFilters/${subCategoryFilterId}`,
              null
            );
          }
        }
  
        for (const subCategoryFilterId of filtersToRemove) {
          if (subCategoryFilterId) {
            await axiosInstance.delete(
              `/profileFilters/${subCategoryFilterId}`
            );
          }
        }

        const updatedFilters = [
          ...storedFilters.filter(
            (filter) =>
              !filtersToRemove.includes(filter.subCategoryFilterId) 
          ),
          ...filtersToAdd
          .map((subCategoryFilterId) => {
            const fullFilter = filters.find(
              (f) => f.subCategoryFilterId === subCategoryFilterId
            );
            if (!fullFilter) return null; 
            return {
              subCategoryFilterId,
              filter: fullFilter.text,
              filterId: fullFilter.id,
              subCategory: fullFilter.subCategoryFilterTitle,
            };
          })
          .filter((f) => f !== null),
        ];
        
        await AsyncStorage.setItem(
          "allCategoriesWithFilters",
          JSON.stringify(updatedFilters)
        );


      }
    } catch (error) {
      console.error("Error updating filters in the database:", error);
    }
  };

  const toggleVisibility = async (subCategory) => {
    try {

      if (!subCategory.visibilityState) {
        const response = await axiosInstance.post(
          `/subCategoriesProfile/${subCategory.id}`,
          null
        );
        if (response.status === 201) {
          subCategory.visibilityState = true; 
          setCategories([...categories]); 
        }
      } else {
        const response = await axiosInstance.delete(
          `/subCategoriesProfile/${subCategory.id}`
        );
  
        if (response.status === 204) {
          subCategory.visibilityState = false; 
          setCategories([...categories]); 
        }
      }
    } catch (error) {
    }
  };


  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      ) : (
        
        <ScrollView>
          <Text style={styles.categoryName}>Username, Avatar & Bio</Text>
                <TouchableOpacity
                    style={styles.MainInfo}
                    onPress={() => setIsMainInfoModalVisible(true)}
                  >
                    <Text style={styles.MainInfoText}>Click to view</Text>
                </TouchableOpacity>
          <View style={styles.photosContainer}>
          
          <Text style={styles.mediaHeader}>Add Some Photos</Text>
           <View style={styles.otherPhotosContainer}>
                  {Array.from({ length: 6 }).map((_, index) => {
                    const sortedPhotos = [...photos.filter((p) => p !== null)].sort(
                      (a, b) => (a.number || 0) - (b.number || 0)
                    );
                    const photo = sortedPhotos.find((p) => p.number === index + 1); 

                    return (
                      <View key={index} style={styles.mediaBox}>
                        <TouchableOpacity
                          style={styles.mediaButton}
                          onPress={() => {
                            if (!photo) {
                              uploadPhoto(index + 1); 
                            }
                          }}
                        >
                          {photo ? (
                            <>
                              <Image
                                source={{ uri: photo.filePath }}
                                style={styles.mediaImage}
                              />
                              <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => deletePhoto(photo.id)} 
                              >
                                <Icon name="close-circle" size={20} color={PRIMARY_COLOR} />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <Text style={styles.mediaText}>Photo {index + 1}</Text> 
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
          </View>

          <View style={styles.videosContainer}>
            <Text style={styles.mediaHeader}>Add Some Videos</Text>
            <View style={styles.otherPhotosContainer}>
              {Array.from({ length: 6 }).map((_, index) => {
                const sortedVideos = [...videos.filter((v) => v !== null)].sort(
                  (a, b) => (a.number || 0) - (b.number || 0)
                );
                const video = sortedVideos.find((v) => v.number === index + 1); 

                return (
                  <View key={index} style={styles.mediaBox}>
                    <TouchableOpacity
                      style={styles.mediaButton}
                      onPress={() => {
                        if (!video  && uploadingPosition !== index + 1) {
                          pickVideo(index + 1);
                        }
                      }}
                      disabled={uploadingPosition === index + 1}
                    >
                       {uploadingPosition === index + 1 ? (
                        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                      ) : video ? (
                        <>
                          <Video
                            source={{ uri: video.filePath }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                            shouldPlay={false}
                          />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => deleteVideo(video.id)} 
                          >
                            <Icon name="close-circle" size={20} color={PRIMARY_COLOR} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <Text style={styles.mediaText}>Video {index + 1}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: category }) => (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryName}>{category.title}</Text>
              {category.subCategories.map((subCategory) => (
                <TouchableOpacity
                  key={subCategory.id}
                  style={styles.subCategoryButton}
                  onPress={async () => {
                    setIsModalVisible(true);
                    await handleSubCategoryClick(subCategory);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    
                    {subCategory.canChangeVisibility ? (
                      <>
                      <Text style={styles.subCategoryText}>{subCategory.title}</Text>
                      <TouchableOpacity
                        onPress={async () => {
                          await toggleVisibility(subCategory);
                        }}
                      >
                        <Icon
                          name="eye"
                          size={20}
                          color={subCategory.visibilityState ? PRIMARY_COLOR : "#ccc"}
                        />
                      </TouchableOpacity>
                      </>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <Text style={styles.subCategoryText}>{subCategory.title}</Text>
                      <Text style={{color: PRIMARY_COLOR}}>*</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        </ScrollView>
      )}


<Modal
  visible={isMainInfoModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => {
    setIsMainInfoModalVisible(false);
    setSelectedMainPhoto(null); 
    setMainPhoto(mainPhotoCopy);
    setUserName(userNameCopy);
    setAboutInfo(aboutInfoCopy); 
  }}
>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
  >
    <ScrollView contentContainerStyle={styles.modalScrollContainer}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setIsMainInfoModalVisible(false); 
              setSelectedMainPhoto(null); 
              setMainPhoto(mainPhotoCopy);
              setUserName(userNameCopy);
              setAboutInfo(aboutInfoCopy); 
            }}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={async () => {
              await handleUpdateMainInformation();
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.modalTitle}>Change Your Avatar</Text>

        <View style={styles.containerForMainPhoto}>
          {mainPhoto && !selectedMainPhoto ? (
            <View style={styles.mainPhotoContainer}>
              <Image source={{ uri: mainPhoto.filePath }} style={styles.mainPhoto} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setSelectedMainPhoto(null);
                  setMainPhoto(null);
                }} 
              >
                <Icon name="close-circle" size={30} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>
          ) : selectedMainPhoto ? (
            <View style={styles.mainPhotoContainer}>
              <Image source={{ uri: selectedMainPhoto }} style={styles.mainPhoto} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedMainPhoto(null)} 
              >
                <Icon name="close-circle" size={30} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.mainPhotoContainer, { justifyContent: "center" }]}
              onPress={handleSelectMainPhoto} 
            >
              <Text style={styles.mediaText}>Upload Main Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.modalTitle}>Change Your Username:</Text>
          <TextInput
            style={styles.inputField}
            value={userName} 
            onChangeText={(text) => setUserName(text)} 
            placeholder="Enter your username"
            placeholderTextColor="#888"
          />
        </View>

            <View style={styles.inputContainer}>
              <Text style={styles.modalTitle}>Change About Me Information:</Text>
              <TextInput
                style={styles.aboutMeInputField} 
                value={aboutInfo.text !== null ? aboutInfo.text : undefined} 
                onChangeText={(text) =>
                  setAboutInfo((prev) => ({ ...prev, text })) 
                }
                placeholder="Enter something about yourself"
                placeholderTextColor="#888"
                multiline={true} 
                textAlignVertical="top" 
              />
              <Text style={styles.charCount}>{(aboutInfo.text ?? "").length}/500</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>

      <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {setIsModalVisible(false);  setSearchQuery("");  setSelectedFilters([]);}}
        >
          <View style={styles.modalContainer}>
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setSelectedFilters([]); 
                    setIsModalVisible(false); 
                    setSearchQuery("");
                    setDefaultOffset(0);
                    setSearchOffset(0); 
                    setHasMoreFilters(true); 
                    setLoadingMoreFilters(false); 
                    setFilters([]);
                    setResetFilters(true); 
              
                  }}
                >
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    setDefaultOffset(0);
                    updateFiltersInDatabase();
                    setSelectedFilters([]);
                    setSearchQuery("");
                    setHasMoreFilters(true); 
                    setLoadingMoreFilters(false); 
                    setSearchOffset(0); 
                    setFilters([]);
                    setResetFilters(true);
                 
                  }}
                  disabled={loading}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>
                {selectedSubCategory
                  ? `Select ${selectedSubCategory.title} `
                  : "Select Filters"}
              </Text>
              <Text style={styles.modalDescription}>
                {selectedSubCategory && selectedSubCategory.maxNumberOfFilters > 1
                  ? `Choose up to ${selectedSubCategory.maxNumberOfFilters}`
                  : `Choose only 1`}
              </Text>

              {(!resetFilters && filters.length === 0) || filters.length > 30 || searchQuery !== "" ? (
                <TextInput
                  style={styles.searchBar}
                  placeholder="Search for something cool..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)} 
                />
              ) : ("")}

              {!loadingFilters ? (
                <FlatList
                ref={flatListRef} 
                data={filters} 
                keyExtractor={(item) => item.subCategoryFilterId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      item.isSelected && styles.selectedFilter, 
                    ]}
                    onPress={() => toggleFilterSelection(item.subCategoryFilterId)}
                  >
                    <Text style={styles.filterText}>{item.text}</Text>
                  </TouchableOpacity>
                )}
                numColumns={5} 
                columnWrapperStyle={styles.itemList} 
                ListEmptyComponent={
                  loadingFilters ? (
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} /> 
                  ) : null
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.02} 
                ListFooterComponent={
                  loadingMoreFilters && !loadingFilters ? (
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  ) : null
                }
                />

              ) : ( <ActivityIndicator size="large" color={PRIMARY_COLOR} />)}
              
            </>
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    height: 40,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  charCount: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginBottom: 20,
    fontSize: 14,
    color: '#888',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
   
  },
  aboutMeInputField: {
    width: '100%',
    height: 150,
    borderWidth: 0.5,
    borderColor: PRIMARY_COLOR,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top', 
  },
  inputContainer: {
    marginVertical: 20,
  },
  inputField: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    borderWidth: 0.5,
    borderColor: PRIMARY_COLOR,
    backgroundColor: "#f9f9f9",
  },
  videosContainer: {
    marginTop: -30,
  },
  mediaHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 20,
  },
  removeButton: {
    position: 'absolute',
    bottom: 3, 
    right: 3,
  },
  photosContainer: {
    marginBottom: 20, 
  },
  containerForMainPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPhotoContainer: {
    marginTop: 10,
    alignItems: "center",
    marginBottom: 10, 
    borderColor: PRIMARY_COLOR,
    borderStyle: 'dashed', 
    borderWidth: 3, 
    borderRadius: 8, 
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    width: 157, 
    height: 157, 
  },
  mainPhoto: {
    width: 150,
    height: 150,
    borderRadius: 10, 
  },
  otherPhotosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", 
    marginTop: 0, 
    marginBottom:20
  },
  mediaBox: {
    width: '28%', 
    height: 90, 
    marginVertical: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0',
    borderColor: PRIMARY_COLOR,
    borderStyle: 'dashed', 
   marginHorizontal: 10
   
  },
  mediaButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  mediaText: {
    textAlign: "center",
    color: "#888",
    fontSize: 12, 
  },

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  subCategoryButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 5,
  },
  MainInfo: {
    padding: 10,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 20,
    marginBottom: 5,
    width: "30%",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subCategoryText: {
    fontSize: 16,
    color: "#333",
  },
  MainInfoText: {
    fontSize: 16,
    color: WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: "auto",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 15,
    marginBottom: 10,
    color: "#666",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 20,
    marginBottom: 8,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  itemList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  selectedFilter: {
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },
  filterText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  closeButton: {
    padding: 10,
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  doneButton: {
    padding: 10,
    borderRadius: 20,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
});

export default Edit;
