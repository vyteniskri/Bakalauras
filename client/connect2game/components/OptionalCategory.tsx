
import { useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import styles, { PRIMARY_COLOR, } from "../assets/styles";
import { useFocusEffect } from "@react-navigation/native";
import axiosInstance from "../components/axiosInstance";

const OptionalCategory = ({ userId }: { userId?: string }) => {
    const [groupedFilters, setGroupedFilters] = useState({});
    const [loading, setLoading] = useState(true); 

    const fetchProfileData = async () => {
        setLoading(true);
        try {
          if (userId) {
            const subCategoriesProfile = await fetchSubCategoriesProfile(userId);

            const subCategoriesProfileIds = subCategoriesProfile.map(
              (profile) => profile.foreignKeySubcategory2
            );
      
            const subCategories = await fetchSubCategories(subCategoriesProfileIds);

            const profileFilters = await fetchProfileFilters(userId);

            const subCategoryFilters = await Promise.all(
              profileFilters.map(async (profileFilter) => {
                const response = await axiosInstance.get(
                  `/subCategoryFilters/Once/${profileFilter.foreignKeySubCategoryFilterId}`
                );
                return response.data;
              })
            );


            const filteredSubCategoryFilters = await Promise.all(
              subCategoryFilters
                .filter((subCategoryFilter) =>
                  subCategoriesProfileIds.includes(
                    subCategoryFilter.foreignKeySubcategory2Id
                  )
                )
               
            );
      
            const foundFilters = await Promise.all(
              filteredSubCategoryFilters.map(async (subCategoryFilter) => {
                const response = await axiosInstance.get(
                  `/filters/${subCategoryFilter.foreignKeyFilterId}`
                );
                return {
                  ...response.data,
                  foreignKeySubcategory2Id: subCategoryFilter.foreignKeySubcategory2Id,
                  subCategoryName: subCategoryFilter.subCategoryName,
                };
              })
            );

      
            const groupedFilters = {};
            subCategories.forEach((subCategory) => {
              groupedFilters[subCategory.id] = {
                subCategoryTitle: subCategory.title,
                priority: subCategory.priority, 
                filters: foundFilters.filter(
                  (filter) =>
                    filter.foreignKeySubcategory2Id === subCategory.id 
                ),
              };
            });
      
            setGroupedFilters(groupedFilters);
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        } finally {
          setLoading(false); 
        }
      };

      const fetchSubCategoriesProfile = async (userId) => {
        const response = await axiosInstance.get(
          `/subCategoriesProfile/userId/${userId}`
        );
        return response.data; 
      };

      const fetchSubCategories = async (subCategoryIds) => {
        const subCategories = await Promise.all(
          subCategoryIds.map(async (id) => {
            const response = await axiosInstance.get(
              `/subCategories2/Id/${id}`
            );
            return response.data;
          })
        );
        return subCategories.flat(); 
      };


      const fetchProfileFilters = async (userId) => {
        const response = await axiosInstance.get(
          `/profileFilters/${userId}`
        );
        return response.data; 
      };



      useFocusEffect(
        useCallback(() => {
          fetchProfileData();
        }, [])
      );
      
      if (loading) {
        return (
          <View>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        );
      }

      return (
        <View>
          {Object.keys(groupedFilters)
            .filter((subCategoryId) => groupedFilters[subCategoryId].filters.length > 0)
            .sort((a, b) => {
              // Sort subcategories by priority
              const priorityA = groupedFilters[a].priority || 0;
              const priorityB = groupedFilters[b].priority || 0;
              return priorityA - priorityB;
            })
            .map((subCategoryId) => (
              <View key={subCategoryId} style={styles.fullRow}>
                <Text style={styles.centeredText}>
                  {groupedFilters[subCategoryId].subCategoryTitle}
                </Text>
                <View style={styles.info}>
                  <View style={styles.itemList}>
                    {groupedFilters[subCategoryId].filters.map((filter) => (
                      <View key={filter.id} style={styles.item}>
                        <Text style={styles.itemText}>{filter.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
        </View>
      );
};
  

export default OptionalCategory;