import axiosInstance from "../components/axiosInstance"; 

export const manageFriends = {
  sendFriendshipInvitation: async (foreignKey: string, navigation: any) => {
  try {
    const response = await axiosInstance.post(`/friendships/${foreignKey}`, null);
    return response.data; 
  } catch (error) {
    console.error("Error sending friendship invitation:", error);
    throw error; 
  }
},

  checkFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.get(`/friendships/${foreignKey}`); 
      return response.data;
    } catch (error) {
      console.error("Error checking friendshipsssss:", error);
   
      throw error; 
    }
  },

  checkPendingFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.get(`/friendships/pending/${foreignKey}`);
      return response.data; 
    } catch (error) {
      console.error("Error checking pending friendship:", error);
      throw error; 
    }
  },

  acceptFriendship: async (foreignKey: string,  navigation: any) => {
    try {
      const response = await axiosInstance.put(`/friendships/${foreignKey}`, null); 
      return response.data; 
    } catch (error) {
      console.error("Error accepting friendship:", error);

      throw error; 
    }
  },

  removeNewFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.delete(`/friendships/newFriend/${foreignKey}`);
      return response.data; 
    } catch (error) {
      console.error("Error removing newwwww friendship:", error);
    
      throw error; 
    }
  },

  removeFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.delete(`/friendships/${foreignKey}`); 
      return response.data;
    } catch (error) {
      console.error("Error removing friendship:", error);
     
      throw error; 
    }
  },
};