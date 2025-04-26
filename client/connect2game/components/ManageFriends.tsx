import axiosInstance from "../components/axiosInstance"; 

export const manageFriends = {
  sendFriendshipInvitation: async (foreignKey: string, navigation: any) => {
  try {
    const response = await axiosInstance.post(`/friendships/${foreignKey}`, null);
    return response.data; 
  } catch (error) {
    throw error; 
  }
},

  checkFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.get(`/friendships/${foreignKey}`); 
      return response.data;
    } catch (error) {
   
      throw error; 
    }
  },

  checkPendingFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.get(`/friendships/pending/${foreignKey}`);
      return response.data; 
    } catch (error) {
      throw error; 
    }
  },

  acceptFriendship: async (foreignKey: string,  navigation: any) => {
    try {
      const response = await axiosInstance.put(`/friendships/${foreignKey}`, null); 
      return response.data; 
    } catch (error) {

      throw error; 
    }
  },

  removeNewFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.delete(`/friendships/newFriend/${foreignKey}`);
      return response.data; 
    } catch (error) {
    
      throw error; 
    }
  },

  removeFriendship: async (foreignKey: string, navigation: any) => {
    try {
      const response = await axiosInstance.delete(`/friendships/${foreignKey}`); 
      return response.data;
    } catch (error) {
     
      throw error; 
    }
  },
};