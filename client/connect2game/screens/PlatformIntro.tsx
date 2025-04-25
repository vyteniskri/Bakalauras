import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { PRIMARY_COLOR } from '../assets/styles'; 
import ProgressIndicator from '../components/ProgressIndicator';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from "../components/axiosInstance";

const PlatformIntro = ({ navigation, route }: { navigation: any; route: any }) => {
  const step = route.params?.step || 3;
  const [subCategory, setSubCategory] = useState(null);
  const [subCategoryFilters, setSubCategoryFilters] = useState([]);
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);


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
    const fetchData = async () => {
      try {
        const subCategoryResponse = await axiosInstance.get('/subCategories2/Title/Platform');
        const subCategoryData = subCategoryResponse.data;
        setSubCategory(subCategoryData);

        const subCategoryFiltersResponse = await axiosInstance.get(`/subCategoryFilters/${subCategoryData.id}`);
        const subCategoryFiltersData = subCategoryFiltersResponse.data;
        setSubCategoryFilters(subCategoryFiltersData);

        const filterPromises = subCategoryFiltersData.map(async (subCategoryFilter: { foreignKeyFilterId: any }) => {
          const filterResponse = await axiosInstance.get(`/filters/${subCategoryFilter.foreignKeyFilterId}`);
          return filterResponse.data;
        });

        const filtersData = await Promise.all(filterPromises);
        setFilters(filtersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSelection = (filterId: string) => {
    setSelectedItems((prevSelectedItems) => {
      if (prevSelectedItems.includes(filterId)) {
        return prevSelectedItems.filter((id) => id !== filterId);
      } else if (prevSelectedItems.length < 3) {
        return [...prevSelectedItems, filterId];
      } else {
        return prevSelectedItems;
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one item.');
      return;
    }

    try {
      const selectedSubCategoryFilters = subCategoryFilters.filter((subCategoryFilter) =>
        selectedItems.includes(subCategoryFilter.foreignKeyFilterId)
      );

      for (const subCategoryFilter of selectedSubCategoryFilters) {
        await axiosInstance.post(`/profileFilters/${subCategoryFilter.id}`, null);
      }

      try {
        await axiosInstance.put(
          `/registrationSteps`,
          { currentStep: 4 }
        );

      } catch (postError) {
        navigation.navigate('Login');
      }

      navigation.navigate('SelectCategoriesIntro', { step: 4 });
    } catch (error) {
      navigation.navigate('Login');
      console.error('Error posting selected items:', error);
      Alert.alert('Please try again');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProgressIndicator step={step} totalSteps={8} />
      <Text style={styles.header}>Select Your Gaming Platforms</Text>
      <Text style={styles.modalDescription}> Choose up to {subCategory.maxNumberOfFilters}</Text>
        {subCategory && (
           <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View key={subCategory.id} style={styles.subCategoryContainer}>
            <Text style={styles.subCategoryHeader}>{subCategory.text}</Text>
            <View style={styles.itemList}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.item,
                    selectedItems.includes(filter.id) && styles.selectedItem,
                  ]}
                  onPress={() => toggleSelection(filter.id)}
                >
                  <Text style={styles.itemText}>{filter.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          </ScrollView>
        )}
     
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalDescription: {
    fontSize: 15,
    marginBottom: 20,
    color: "#666",
    textAlign: 'left',
    width: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 40, 
    paddingHorizontal: 10, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 80, 
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
    paddingTop:20
  },
  subCategoryContainer: {
    marginBottom: 20,
    width: '100%',
  },
  subCategoryHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  item: {
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    margin: 5, 
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', 
  },
  selectedItem: {
    borderColor: PRIMARY_COLOR,
  },
  itemText: {
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
    paddingTop: 20,
    bottom: 0,
  },
  button: {
    width: '80%',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PlatformIntro;