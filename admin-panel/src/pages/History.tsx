import { useEffect, useState } from "react";
import api from "../services/api";

const History = () => {
  const [reports, setReports] = useState<{ id: number; userId: number; banTime?: string; flaggedCount?: number; creationDate: string }[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [filters, setFilters] = useState<any[]>([]); 
  const [loadingFilters, setLoadingFilters] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reportsPerPage = 5;
  const [page, setPage] = useState(false);


  const fetchReports = async (page: number, isBanned?: boolean) => {
    try {
      setPage(true);
      const response = await api.get(`/reports?page=${page}&pageSize=${reportsPerPage}${isBanned !== undefined ? `&isBanned=${isBanned}` : ""}`);
      const { reports, totalReports } = response.data;
  
      setReports(reports); 
      setTotalPages(Math.ceil(totalReports / reportsPerPage)); 
    } catch (error) {
      console.error("Error fetching reports:", error);
      alert("Failed to fetch reports.");
    } finally {
      setPage(false);
    }
  };

  useEffect(() => {
    fetchReports(currentPage, false);
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
};



  const handleRemoveUser = (recordId: number) => {
    api.delete(`/reports/${recordId}`)
      .then((response) => {
        alert(`Record ID ${recordId} has been removed from this list.`);

        window.location.reload();
      })
      .catch((error) => {
        console.error("Error deleting report:", error);
        alert("Failed to delete report.");
      });
  };




  const handleViewProfile = async (userId: string) => {
    try {
  

      const profileResponse = await api.get(`/profiles/${userId}`);
      const profile = profileResponse.data;
  

      const informationFieldResponse = await api.get(`/informationField/${userId}`);
      const informationField = informationFieldResponse.data;
  

      let photos = [];
      try {
        const photosResponse = await api.get(`/photos/profile/${userId}`);
        photos = photosResponse.data;
      } catch (error) {
        console.warn("No photos found for user:", userId);
      }
  
      let videos = [];
      try {
        const videosResponse = await api.get(`/videos/profile/${userId}`);
        videos = videosResponse.data;
      } catch (error) {
        console.warn("No videos found for user:", userId);
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
        console.error("Error fetching filters:", error);
      } finally {
        setLoadingFilters(false);
      }
  
      setSelectedUserProfile({
        ...profile,
        informationField,
        photos,
        videos,
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      alert("Failed to fetch profile data.");
    }
  };



  
  return (
    <div >
    {page ? (
      <div className="loading-indicator">
        <h2>Loading...</h2>
        <div className="spinner"></div>
      </div>
    ) : (
    <div className="container">
      <div className="reports-table">
        <h1 className="title">Banned Users History</h1>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ban Time</th>
              <th>Flagged Count</th>
              <th>Last Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report: any) => {
              return (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{new Date(report.banTime).toLocaleString()}</td> 
                  <td>{report.flaggedCount}</td>
                  <td>{new Date(report.creationDate).toLocaleString()}</td> 
                  <td>
                    <button
                      className="btn btn-view"
                      onClick={() => handleViewProfile(report.userId)}
                    >
                      View
                    </button>
                  
                        <button
                            className="btn btn-remove"
                            onClick={() => handleRemoveUser(report.id)}
                            >
                            Remove
                        </button>
                 
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
            <button
                className="pagination-btn pagination-btn-prev"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
            >
                &larr; Previous
            </button>
            <span className="pagination-info">
                Page {totalPages === 0 ? 0 :currentPage} of {totalPages}
            </span>
            <button
                className="pagination-btn pagination-btn-next"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
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
                                <p>Text: {filter.text}</p>
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

export default History;