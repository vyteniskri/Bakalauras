using Azure.Storage.Blobs;
using Connect2Game.Model;
using Microsoft.Extensions.Options;

namespace Connect2Game.Azure
{
    public class AzureBlobServicePhotos
    {
      
        private readonly BlobContainerClient containerClient;

        public AzureBlobServicePhotos(IOptions<AzureStorageSettings> azureStorageOptions)
        {
            string connectionString = azureStorageOptions.Value.ConnectionString;
            string containerName = "photos";

            containerClient = new BlobContainerClient(connectionString, containerName);
            containerClient.CreateIfNotExists();
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName)
        {
            try
            {
                var blobClient = containerClient.GetBlobClient(fileName);
                await blobClient.UploadAsync(fileStream, overwrite: true);
                return blobClient.Uri.ToString(); 
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task DeleteFileAsync(string fileName)
        {
            try
            {
                var blobClient = containerClient.GetBlobClient(fileName);
                await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
            }
        }

     
    }
}
