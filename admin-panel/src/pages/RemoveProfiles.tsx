import { useEffect, useState } from "react";
import api from "../services/api"; 

const RemoveProfiles = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [filters, setFilters] = useState<any[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const profilesPerPage = 5; 
  const [totalProfiles, setTotalProfiles] = useState(0); 

  const handleInvalidateSessions = async (userId: string) => {
    try {
      await api.post(`/invalidate-sessions/${userId}`);

    } catch (error) {
      console.error("Error invalidating sessions:", error);
      alert("Failed to invalidate user sessions.");
    }
  };


  const fetchProfiles = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/profiles/Chunks?page=${page}&pageSize=${profilesPerPage}`);
      const { totalProfiles, profiles } = response.data;
      setTotalProfiles(totalProfiles); 
      setProfiles(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveProfile = async (userId: string) => {
    try {
     await handleInvalidateSessions(userId);
      const response = await api.delete(`/profiles/${userId}`);
      if (response.status === 204) {
        alert("Profile has been removed.");

        window.location.reload();
      } else {
        alert("Failed to remove the profile.");
      }
    } catch (error) {
      console.error("Error removing profile:", error);
      alert("An unexpected error occurred.");
    }
  };


  const confirmRemoveProfile = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this profile?")) {
      handleRemoveProfile(userId);
    }
  };


  const handleViewProfile = async (userId: string) => {
    try {
  

      const profileData: any = {};
  

      try {
        const profileResponse = await api.get(`/profiles/${userId}`);
        profileData.profile = profileResponse.data;
      } catch (error) {
        console.warn("Failed to fetch base profile information:", error);
      }
  

      try {
        const informationFieldResponse = await api.get(`/informationField/${userId}`);
        profileData.informationField = informationFieldResponse.data;
      } catch (error) {
        console.warn("Failed to fetch information fields:", error);
      }
  
      try {
        const photosResponse = await api.get(`/photos/profile/${userId}`);
        profileData.photos = photosResponse.data;
      } catch (error) {
        console.warn("No photos found for user:", userId);
        profileData.photos = [];
      }
  
      try {
        const videosResponse = await api.get(`/videos/profile/${userId}`);
        profileData.videos = videosResponse.data;
      } catch (error) {
        console.warn("No videos found for user:", userId);
        profileData.videos = [];
      }
  
      setLoadingFilters(true);
      try {
        const profileFiltersResponse = await api.get(`/profileFilters/${userId}`);
        const profileFilters = profileFiltersResponse.data;
  
        const subCategoryFilters = await Promise.all(
          profileFilters.map(async (filter: any) => {
            const subCategoryFilterResponse = await api.get(`/subCategoryFilters/Once/${filter.foreignKeySubCategoryFilterId}`);
            return subCategoryFilterResponse.data;
          })
        );
  
        const detailedFilters = await Promise.all(
          subCategoryFilters.map(async (subCategoryFilter: any) => {
            const filterResponse = await api.get(`/filters/${subCategoryFilter.foreignKeyFilterId}`);
            return filterResponse.data;
          })
        );
  
        const subCategories = await Promise.all(
          subCategoryFilters.map(async (subCategoryFilter: any) => {
            const subCategoryResponse = await api.get(`/subCategories2/Id/${subCategoryFilter.foreignKeySubcategory2Id}`);
            return subCategoryResponse.data;
          })
        );
  
        const categories = await Promise.all(
          subCategories.map(async (subCategory: any) => {
            const categoryResponse = await api.get(`/categories2/Id/${subCategory[0]?.foreignKeyCategory2}`);
            return categoryResponse.data;
          })
        );
  
        const combinedFilters = profileFilters.map((filter: any, index: number) => ({
          profileFilter: filter,
          subCategoryFilter: subCategoryFilters[index],
          detailedFilter: detailedFilters[index],
          subCategory: subCategories[index],
          category: categories[index],
        }));
  
        const groupedFilters = combinedFilters.reduce((acc: any, filter: any) => {
          const categoryName = filter.category[0]?.title || "Unknown Category";
          const subCategoryName = filter.subCategory[0]?.title || "Unknown Subcategory";
  
          if (!acc[categoryName]) {
            acc[categoryName] = {};
          }
  
          if (!acc[categoryName][subCategoryName]) {
            acc[categoryName][subCategoryName] = [];
          }
  
          acc[categoryName][subCategoryName].push(filter.detailedFilter);
  
          return acc;
        }, {});
  
        setFilters(groupedFilters);
      } catch (error) {
        console.warn("Failed to fetch filters:", error);
      } finally {
        setLoadingFilters(false);
      }
  
      setSelectedUserProfile({
        ...profileData.profile,
        informationField: profileData.informationField || null,
        photos: profileData.photos || [],
        videos: profileData.videos || [],
      });
    } catch (error) {
      console.error("Unexpected error fetching profile data:", error);
      alert("An unexpected error occurred while fetching profile data.");
    }
  };

  useEffect(() => {
    fetchProfiles(currentPage);
  }, [currentPage]);

  return (
    <div >
    {loading ? (
      <div className="loading-indicator">
        <h2>Loading...</h2>
        <div className="spinner"></div>
      </div>
    ) : (
    <div className="container">
      <div className="reports-table">
        <h1 className="title">Manage Profiles</h1>
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length > 0 ? (
              profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.username}</td>
                  <td>
                    <button
                      className="btn btn-view"
                      onClick={() => handleViewProfile(profile.id)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-ban"
                      onClick={() => confirmRemoveProfile(profile.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              ""
            )}
          </tbody>
        </table>
        <div className="pagination">
          <button
            className="pagination-btn pagination-btn-prev"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &larr; Previous
          </button>
          <span className="pagination-info">Page {Math.ceil(totalProfiles / profilesPerPage) === 0 ? 0 :currentPage} of {Math.ceil(totalProfiles / profilesPerPage)}</span>
          <button
            className="pagination-btn pagination-btn-next"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage * profilesPerPage >= totalProfiles}
          >
            Next &rarr;
          </button>
        </div>
      </div>

      <div className="user-profile">
        <h2 className="title">User Profile</h2>
        {selectedUserProfile ? (
          <div>
            <p><strong>User Name:</strong> {selectedUserProfile.username}</p>
  
            {selectedUserProfile.informationField && (
              <div className="info-section">
                <h3>Information Field</h3>
                <p>{selectedUserProfile.informationField.text}</p>
              </div>
            )}
  
            {selectedUserProfile.photos?.length > 0 && (
              <div className="photos-section">
                <h3>Photos</h3>
                <div className="photos-grid">
                  {selectedUserProfile.photos.map((photo: any) => (
                    <img key={photo.id} src={photo.filePath} alt={`Photo ${photo.number}`} />
                  ))}
                </div>
              </div>
            )}
  
                {selectedUserProfile.videos?.length > 0 && (
                <div className="videos-section">
                    <h3>Videos</h3>
                    <div className="videos-grid">
                    {selectedUserProfile.videos.map((video: any) => (
                        <video
                        key={video.id}
                        controls
                        className="video-item"
                        >
                        <source src={video.filePath} type="video/mp4" />
                        Your browser does not support the video tag.
                        </video>
                    ))}
                    </div>
                </div>
                )}

                <div className="filters-section">
                <h3>Filters</h3>
                {loadingFilters ? (
                    <p>Loading filters...</p>
                ) : (
                    Object.entries(filters).map(([categoryName, subCategories]: any) => (
                    <div key={categoryName} className="category-item">
                        <h4>Category: {categoryName}</h4>
                        {Object.entries(subCategories).map(([subCategoryName, detailedFilters]: any) => (
                        <div className="subcategory-item" style={{ marginLeft: "20px" }}>
                          <h5>Subcategory: {subCategoryName}</h5>
                          <ul>
                            {detailedFilters.map((filter: any, index: number) => (
                              <li key={index}>
                                <p>{filter.text}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                        ))}
                    </div>
                    ))
                )}
                </div>
          </div>
        ) : (
          <p>Select a user to view their profile.</p>
        )}
      </div>
    </div>
    )}
    </div>
  );
};

export default RemoveProfiles;