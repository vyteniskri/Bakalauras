using Azure.Storage.Blobs;
using Microsoft.Extensions.Options;

namespace Connect2Game.Azure
{
    public class AzureBlobServiceVideos
    {
       
        private readonly BlobContainerClient containerClient;

        public AzureBlobServiceVideos(IOptions<AzureStorageSettings> azureStorageOptions)
        {
            string connectionString = azureStorageOptions.Value.ConnectionString;
            string containerName = "videos";

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
