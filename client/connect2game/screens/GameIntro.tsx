import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Alert, BackHandler } from 'react-native';
import axiosInstance from "../components/axiosInstance";
import { PRIMARY_COLOR } from '../assets/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import ProgressIndicator from '../components/ProgressIndicator';
import { useFocusEffect } from '@react-navigation/native';

const GameIntro = ({ navigation, route, onLoginSuccess }: { navigation: any; route: any; onLoginSuccess: () => void }) => {
  const step = route.params?.step || 7;
  const [filters, setFilters] = useState([]);
  const [loadingMoreFilters, setLoadingMoreFilters] = useState(false);
  const [hasMoreFilters, setHasMoreFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchOffset, setSearchOffset] = useState(0);
  const [defaultOffset, setDefaultOffset] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const limit = 30; 
  const flatListRef = useRef<FlatList>(null);
  const [subCategory, setSubCategory] = useState(null);


  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Login'); 
        return true;
      });

      return () => backHandler.remove(); 

    }, [])
  );

  useEffect(() => {
    const fetchSubCategory = async () => {
      try {
        const subCategoryResponse = await axiosInstance.get('/subCategories2/Title/Favorite Game of All Time');
        setSubCategory(subCategoryResponse.data);
      } catch (error) {
        console.error('Error fetching subcategory:', error);
        Alert.alert('Error', 'Failed to fetch subcategory.');
      } 
    };

    fetchSubCategory();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    setFilters([]);
    setSearchOffset(0);
    setDefaultOffset(0);
    setHasMoreFilters(true);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
  }, [debouncedSearchQuery]);


  useEffect(() => {
    const fetchStoredFilters = async () => {
      if (!subCategory) return; 
      try {
        setLoadingMoreFilters(true);

        const endpoint = debouncedSearchQuery.trim()
          ? `/filters/subcategoryFilter/${subCategory.id}/search/${debouncedSearchQuery}?limit=${limit}&offset=${searchOffset}`
          : `/subCategoryFilters/limit/${subCategory.id}?limit=${limit}&offset=${defaultOffset}`;
  
        const response = await axiosInstance.get(endpoint);
        const responseData = response.data;
  
        let updatedFilters;
  
        if (debouncedSearchQuery.trim()) {
          updatedFilters = responseData.map((filter) => ({
            ...filter,
            id: filter.filter.id,
             text: filter.filter.text,
             subCategoryFilterId: filter.subCategoryFilterId,
             subCategoryFilterTitle: subCategory.title,
          }));
        } else {
          const filtersWithDetails = await Promise.all(
            responseData.map(async (subCategoryFilter) => {
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
  
          updatedFilters = filtersWithDetails.filter((filter) => filter !== null);
        }
        setFilters((prevFilters) => {
          const uniqueFilters = updatedFilters.filter(
            (newFilter) =>
              !prevFilters.some(
                (existingFilter) => existingFilter.text === newFilter.text
              )
          );
          return [...prevFilters, ...uniqueFilters];
        });
 
        if (responseData.length < limit) {
          setHasMoreFilters(false); 
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setHasMoreFilters(false);
        } else {
          console.error("Error fetching filters:", error);
          Alert.alert('Error', 'Failed to fetch filters.');
        }
      } finally {
        setLoadingMoreFilters(false);
      }
    };
  
    fetchStoredFilters();
  }, [searchOffset, defaultOffset, debouncedSearchQuery, subCategory]); 

  const handleEndReached = () => {
    if (hasMoreFilters && !loadingMoreFilters) {
      if (debouncedSearchQuery.trim()) {
        setSearchOffset((prevOffset) => prevOffset + limit); 
      } else {
        setDefaultOffset((prevOffset) => prevOffset + limit); 
      }
    }
  };

  const toggleSelection = (filterId: number) => {
    setSelectedFilter(filterId); 

  };

  const handleSubmit = async () => {
    if (!selectedFilter) {
      Alert.alert('Selection Required', 'Please select a game.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('temporaryAccessToken');
      await axiosInstance.post(`/profileFilters/${selectedFilter}`, null);
      try {
        await axiosInstance.put(
          `/registrationSteps`,
          { currentStep: 8 }
        );

      } catch (postError) {
        navigation.navigate('Login');
      }
      await AsyncStorage.removeItem("temporaryAccessToken");
      await AsyncStorage.removeItem("userId");

      await AsyncStorage.setItem("accessToken", token);
      const decodedToken: any = jwtDecode(token);

      const userId = decodedToken.sub;
      await AsyncStorage.setItem("userId", userId);
      onLoginSuccess();
    } catch (error) {
      console.error('Error posting selected items:', error);
       Alert.alert('Please try again');
       navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
       <ProgressIndicator step={step} totalSteps={8} />
      <Text style={styles.header}>Pick Your Favourite Game Of All Time</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a game..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        ref={flatListRef}
        data={filters}
        keyExtractor={(item) => item.subCategoryFilterId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === item.subCategoryFilterId && styles.selectedItem,
            ]}
            onPress={() => toggleSelection(item.subCategoryFilterId)}
          >
            <Text style={styles.filterText}>{item.text}</Text>
          </TouchableOpacity>
        )}
        columnWrapperStyle={styles.itemList} 
        numColumns={5}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.02} 
        ListFooterComponent={
          loadingMoreFilters && hasMoreFilters ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          ) : null
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
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
    width: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 40, 
    paddingHorizontal: 10,
    marginBottom: 80, 
    alignItems: 'center',
    justifyContent: 'flex-start', 
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
    paddingTop: 20,
  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  selectedItem: {
    borderColor: PRIMARY_COLOR,
  },
  filterText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333', 
  },
  footer: {
    width: '110%',
    backgroundColor: '#fff', 
    paddingVertical: 10,
    alignItems: 'center',
    position: 'absolute',
    paddingTop: 10,
    bottom: -80,
  },
  button: {
    width: '80%',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameIntro;