import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../components/axiosInstance";

export const fetchProfileData = async (userId: string) => {
  try {

    const currentUserId = await AsyncStorage.getItem("userId");

    if (!userId) {
      throw new Error("Missing token or userId");
    }

    const profileInfo = await axiosInstance.get(
      `/profiles/${userId}`
    );
    const userName = profileInfo.data.username;

    const aboutProfileInfo = await axiosInstance.get(
      `/informationField/${userId}`
    );
    const aboutInfo = aboutProfileInfo.data.text;

    const profileResponse = await axiosInstance.get(
      `/photos/profile/${userId}`,
    );

    const photos = profileResponse.data.map(
      (photo: { filePath: string; mainOrNot: boolean; number: number }) => ({
        type: "photo",
        uri: photo.filePath,
        mainOrNot: photo.mainOrNot,
        number: photo.number,
      })
    );


    const sortedPhotos = photos.sort((a, b) => {
      if (a.mainOrNot) return -1;
      if (b.mainOrNot) return 1;
      return (a.number || 0) - (b.number || 0);
    });

    let combinedMedia = [...sortedPhotos]; 

    try {
      const videoResponse = await axiosInstance.get(
        `/videos/profile/${userId}`
      );
    
      const videos = videoResponse.data.map(
        (video: { filePath: string; number: number }) => ({
          type: "video",
          uri: video.filePath,
          number: video.number,
        })
      );
    
      const sortedVideos = videos.sort((a, b) => (a.number || 0) - (b.number || 0));

      combinedMedia = [...sortedPhotos, ...sortedVideos];
    } catch (error) {
    }


    const profileFiltersResponse = await axiosInstance.get(
      `/profileFilters/${userId}`,
    );
    const profileFilters = profileFiltersResponse.data;

    const categoryData = {
      platform: [],
      gamingSchedule: [],
      playerType: [],
      playstyle: [],
      allTimeGame: [],
    };
  
    const subcategoriesWithFilters: Array<{ filterId?: string; subCategoryFilterId: string; filter: string; subCategory: string }> = [];

    for (const filter of profileFilters) {
      try {
        const subCategoryFilterResponse = await axiosInstance.get(
          `/subCategoryFilters/Once/${filter.foreignKeySubCategoryFilterId}`
        );
        const subCategoryFilter = subCategoryFilterResponse.data;

        const subCategoryResponse = await axiosInstance.get(
          `/subCategories2/Id/${subCategoryFilter.foreignKeySubcategory2Id}`
        );
        const subCategory =
          subCategoryResponse.data.length > 0
            ? subCategoryResponse.data[0]
            : null;

        if (!subCategory) continue;

        const filterResponse = await axiosInstance.get(
          `/filters/${subCategoryFilter.foreignKeyFilterId}`
        );
        const filterDetails = filterResponse.data;

        if (!filterDetails || !filterDetails.text) continue;

        if (userId === currentUserId) {
          subcategoriesWithFilters.push({
            filterId: filterDetails.id,
            subCategoryFilterId: subCategoryFilter.id,
            filter: filterDetails.text,
            subCategory: subCategory.title,
          });
        }
        

        if (subCategory.title === "Platform") {
          categoryData.platform.push(filterDetails.text);
        } else if (subCategory.title === "Gaming Schedule") {
          categoryData.gamingSchedule.push(filterDetails.text);
        } else if (subCategory.title === "Player Type") {
          categoryData.playerType.push(filterDetails.text);
        } else if (subCategory.title === "Playstyle") {
          categoryData.playstyle.push(filterDetails.text);
        } else if (subCategory.title === "Favorite Game of All Time") {
          categoryData.allTimeGame.push(filterDetails.text);
        }
      } catch (error) {
        continue;
      }
    }
   
    if (userId === currentUserId) {
      await AsyncStorage.setItem(
        "allCategoriesWithFilters",
        JSON.stringify(subcategoriesWithFilters)
      );
    }

    return {
      userId,
      userName,
      aboutInfo,
      media: combinedMedia,
      profileData: {
        platform: categoryData.platform.join(", ") || "N/A",
        gamingSchedule: categoryData.gamingSchedule.join(", ") || "N/A",
        playerType: categoryData.playerType.join(", ") || "N/A",
        playstyle: categoryData.playstyle.join(", ") || "N/A",
        allTimeGame: categoryData.allTimeGame.join(", ") || "N/A",
      },
    };
  } catch (error) {
    throw error; 
  }
};