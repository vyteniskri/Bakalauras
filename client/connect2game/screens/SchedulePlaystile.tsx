import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { PRIMARY_COLOR } from '../assets/styles'; 
import ProgressIndicator from '../components/ProgressIndicator';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from "../components/axiosInstance";

const SchedulePlaystile = ({ navigation, route }: { navigation: any; route: any }) => {
  const [subCategoryFiltersSchedule, setSubCategoryFiltersSchedule] = useState([]);
  const [subCategoryFiltersPlayerType, setSubCategoryFiltersPlayerType] = useState([]);
  const [subCategoryFiltersPlayStyle, setSubCategoryFiltersPlayStyle] = useState([]);
  const [filtersSchedule, setFiltersSchedule] = useState([]);
  const [filtersPlayerType, setFiltersPlayerType] = useState([]);
  const [filtersPlayStyle, setFiltersPlayStyle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: string }>({});
  const step = route.params?.step || 5;

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
        const subCategoryScheduleResponse = await axiosInstance.get('/subCategories2/Title/Gaming Schedule');
        const subCategoryScheduleData = subCategoryScheduleResponse.data;

        const subCategoryFiltersScheduleResponse = await axiosInstance.get(
          `/subCategoryFilters/${subCategoryScheduleData.id}`
        );
        const subCategoryFiltersScheduleData = subCategoryFiltersScheduleResponse.data;
        setSubCategoryFiltersSchedule(subCategoryFiltersScheduleData);

        const filterPromisesSchedule = subCategoryFiltersScheduleData.map(async (subCategoryFilter: { foreignKeyFilterId: any }) => {
          const filterResponse = await axiosInstance.get(`/filters/${subCategoryFilter.foreignKeyFilterId}`);
          return filterResponse.data;
        });
        const filtersScheduleData = await Promise.all(filterPromisesSchedule);
        setFiltersSchedule(filtersScheduleData);

        const subCategoryPlayerTypeResponse = await axiosInstance.get('/subCategories2/Title/Player Type');
        const subCategoryPlayerTypeData = subCategoryPlayerTypeResponse.data;

        const subCategoryFiltersPlayerTypeResponse = await axiosInstance.get(
          `/subCategoryFilters/${subCategoryPlayerTypeData.id}`
        );
        const subCategoryFiltersPlayerTypeData = subCategoryFiltersPlayerTypeResponse.data;
        setSubCategoryFiltersPlayerType(subCategoryFiltersPlayerTypeData);

        const filterPromisesPlayerType = subCategoryFiltersPlayerTypeData.map(async (subCategoryFilter: { foreignKeyFilterId: any }) => {
          const filterResponse = await axiosInstance.get(`/filters/${subCategoryFilter.foreignKeyFilterId}`);
          return filterResponse.data;
        });
        const filtersPlayerTypeData = await Promise.all(filterPromisesPlayerType);
        setFiltersPlayerType(filtersPlayerTypeData);

        const subCategoryPlayStyleResponse = await axiosInstance.get('/subCategories2/Title/Playstyle');
        const subCategoryPlayStyleData = subCategoryPlayStyleResponse.data;

        const subCategoryFiltersPlayStyleResponse = await axiosInstance.get(
          `/subCategoryFilters/${subCategoryPlayStyleData.id}`
        );
        const subCategoryFiltersPlayStyleData = subCategoryFiltersPlayStyleResponse.data;
        setSubCategoryFiltersPlayStyle(subCategoryFiltersPlayStyleData);

        const filterPromisesPlayStyle = subCategoryFiltersPlayStyleData.map(async (subCategoryFilter: { foreignKeyFilterId: any }) => {
          const filterResponse = await axiosInstance.get(`/filters/${subCategoryFilter.foreignKeyFilterId}`);
          return filterResponse.data;
        });
        const filtersPlayStyleData = await Promise.all(filterPromisesPlayStyle);
        setFiltersPlayStyle(filtersPlayStyleData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSelection = (category: string, filterId: string) => {
    setSelectedItems((prevSelectedItems) => {
      const currentSelections = prevSelectedItems[category] || [];
  
      if (category === 'playStyle') {
        if (currentSelections.includes(filterId)) {
          return {
            ...prevSelectedItems,
            [category]: currentSelections.filter((id: string) => id !== filterId),
          };
        } else if (currentSelections.length < 3) {
          return {
            ...prevSelectedItems,
            [category]: [...currentSelections, filterId],
          };
        } else {
          
          return prevSelectedItems;
        }
      }
  
      return {
        ...prevSelectedItems,
        [category]: prevSelectedItems[category] === filterId ? '' : filterId,
      };
    });
  };

  const handleSubmit = async () => {

    const requiredCategories = ['schedule', 'playerType', 'playStyle'];
    const missingCategories = requiredCategories.filter((category) => !selectedItems[category] || selectedItems[category].length === 0);
  
    if (missingCategories.length > 0) {
      Alert.alert(
        'Selection Required',
        'Please select one item from each category before proceeding.'
      );
      return;
    }
  
    try {
      for (const category of requiredCategories) {
        const selectedFilterIds = Array.isArray(selectedItems[category]) ? selectedItems[category] : [selectedItems[category]];
        const subCategoryFilters =
          category === 'schedule'
            ? subCategoryFiltersSchedule
            : category === 'playerType'
            ? subCategoryFiltersPlayerType
            : subCategoryFiltersPlayStyle;
  
        for (const selectedFilterId of selectedFilterIds) {
          const selectedSubCategoryFilter = subCategoryFilters.find(
            (subCategoryFilter) => subCategoryFilter.foreignKeyFilterId === selectedFilterId
          );
  
          if (selectedSubCategoryFilter) {
            await axiosInstance.post(`/profileFilters/${selectedSubCategoryFilter.id}`, null);
          }
        }
      }
  
      try {
        await axiosInstance.put(
          `/registrationSteps`,
          { currentStep: 6 }
        );
      } catch (postError) {
        navigation.navigate('Login');
      }

      navigation.navigate('MediaIntro', { step: 6 });
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
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>What Is Your Gaming Schedule</Text>
        <Text style={styles.modalDescription}>Choose 1 </Text>
        {subCategoryFiltersSchedule && (
          <View key={subCategoryFiltersSchedule.id} style={styles.subCategoryContainer}>
            <Text style={styles.subCategoryHeader}>{subCategoryFiltersSchedule.text}</Text>
            <View style={styles.itemList}>
              {filtersSchedule.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.item,
                    selectedItems['schedule'] === filter.id && styles.selectedItem,
                  ]}
                  onPress={() => toggleSelection('schedule', filter.id)}
                >
                  <Text style={styles.itemText}>{filter.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <Text style={styles.header}>What Kind Of Gamer Are You</Text>
        <Text style={styles.modalDescription}>Choose 1 </Text>
        {subCategoryFiltersPlayerType && (
          <View key={subCategoryFiltersPlayerType.id} style={styles.subCategoryContainer}>
            <Text style={styles.subCategoryHeader}>{subCategoryFiltersPlayerType.text}</Text>
            <View style={styles.itemList}>
              {filtersPlayerType.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.item,
                    selectedItems['playerType'] === filter.id && styles.selectedItem,
                  ]}
                  onPress={() => toggleSelection('playerType', filter.id)}
                >
                  <Text style={styles.itemText}>{filter.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      <Text style={styles.header}>What Is Your Playstyle</Text>
        <Text style={styles.modalDescription}>Choose up to 3 </Text>
        {subCategoryFiltersPlayStyle && (
          <View key={subCategoryFiltersPlayStyle.id} style={styles.subCategoryContainer}>
            <Text style={styles.subCategoryHeader}>{subCategoryFiltersPlayStyle.text}</Text>
            <View style={styles.itemList}>
              {filtersPlayStyle.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.item,
                    selectedItems['playStyle']?.includes(filter.id) && styles.selectedItem,
                  ]}
                  onPress={() => toggleSelection('playStyle', filter.id)}
                >
                  <Text style={styles.itemText}>{filter.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    alignSelf: 'flex-start',
    fontSize: 15,
    marginBottom: 10,
    color: "#666",
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 10, 
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 150,
  },
  header: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
    paddingTop: 20,
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
    alignItems: 'center'
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

export default SchedulePlaystile;