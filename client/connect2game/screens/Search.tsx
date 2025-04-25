import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import axiosInstance from "../components/axiosInstance";
import { PRIMARY_COLOR } from "../assets/styles";
import { useNavigation } from "@react-navigation/native";

const Search = () => {
  const [query, setQuery] = useState(""); 
  const [filters, setFilters] = useState([]);
  const [page, setPage] = useState(1); 
  const [isLoading, setIsLoading] = useState(false); 
  const [hasMore, setHasMore] = useState(true); 
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); 
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation(); 

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(query);
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    if (debouncedSearchQuery.trim() !== "") {
      setPage(1); 
      setHasMore(true); 
      fetchFilters(debouncedSearchQuery, 1); 
    } else {
      setFilters([]); 
    }
  }, [debouncedSearchQuery]);

  const fetchFilters = async (searchQuery, pageNumber = 1) => {
  
    try {
      setIsLoading(true);
      const filtersResponse = await axiosInstance.get(`/filters/search/${searchQuery}`, {
        params: { page: pageNumber, pageSize: 30 }, 
      });
      const filtersData = filtersResponse.data;

      if (filtersData.length > 0) {
        setFilters((prevFilters) => (pageNumber === 1 ? filtersData : [...prevFilters, ...filtersData])); 
        setPage(pageNumber); 
      } else {
        setHasMore(false); 
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (text) => {
    setQuery(text);
    setFilters([]); 
    setPage(1); 
    setHasMore(true); 
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
  };

  const handleLoadMore = () => {
    if (debouncedSearchQuery.trim() !== "" && hasMore) {
      fetchFilters(debouncedSearchQuery, page + 1);
    }
  };

  const handleFilterSelect = (filterId, text) => {
    navigation.navigate("FilteredProfiles", { filterId, text });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search filters..."
        value={query}
        onChangeText={handleInputChange}
      />
      <FlatList
        ref={flatListRef}
        data={filters}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => handleFilterSelect(item.id, item.text)} 
          >
            <Text>{item.text}</Text> 
          </TouchableOpacity>
        )}
        ListFooterComponent={
          isLoading ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : null
        }
        onEndReached={handleLoadMore} 
        onEndReachedThreshold={0.02}
       
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchBar: {
    height: 40,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default Search;