using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;

namespace Connect2Game.MessagingSignalR
{
    public class ChatHub : Hub
    {
        public async Task JoinRoom(int friendshipId)
        {


            if (friendshipId <= 0)
            {
                throw new ArgumentException("Friendship ID must be a positive number.", nameof(friendshipId));
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, friendshipId.ToString()); 
        }

        public async Task LeaveRoom(int friendshipId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, friendshipId.ToString());
        }

        public async Task SendMessage(int friendshipId, string userId, string text, string creationDate, int messageId)
        {
            var message = new { userId, text, creationDate, id = messageId };

            await Clients.OthersInGroup(friendshipId.ToString()).SendAsync("ReceiveMessage", message);
        }

        public async Task UpdateMessage(int friendshipId, int id, string updatedText)
        {
            var updatedMessage = new { id, text = updatedText };
            await Clients.OthersInGroup(friendshipId.ToString()).SendAsync("ReceiveUpdatedMessage", updatedMessage);
        }

        public async Task DeleteMessage(int friendshipId, int messageId)
        {
            await Clients.OthersInGroup(friendshipId.ToString()).SendAsync("ReceiveDeletedMessage", messageId);
        }

        public async Task SendPhoto(int friendshipId, string photoUrl, int messageId, string userId, string creationDate)
        {
            var photoData = new
            {
                filePath = photoUrl,
                messageId,
                userId,
                creationDate
            };
            await Clients.OthersInGroup(friendshipId.ToString()).SendAsync("ReceivePhoto", photoData);
        }
    }
}
