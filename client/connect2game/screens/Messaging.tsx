import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Image, Modal, InteractionManager } from "react-native";
import { HubConnectionBuilder } from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../components/axiosInstance";
import { BLACK, PRIMARY_COLOR, SECONDARY_COLOR, WHITE } from "../assets/styles";
import { Icon } from "../components";
import * as ImagePicker from 'expo-image-picker';

const SIGNALR_URL = "http://10.0.2.2:5186/api/chatHub";

const MessagingScreen = ({ route }: { route: any }) => {
  const { friendshipId, isBanned } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connection, setConnection] = useState<any>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null); 

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const inputRef = useRef<TextInput>(null); 
  const [editing, setEditing] = useState(false); 
  const [sending, setSending] = useState(false); 
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [messagesCheck, setMessagesCheck] = useState<any[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null); 

  const [page, setPage] = useState(0); 
  const [loadingMore, setLoadingMore] = useState(false); 
  const PAGE_SIZE = 15; 
  const [hasMore, setHasMore] = useState(true); 

  useEffect(() => {
    if (connection) {
  
      connection.on("ReceivePhoto", (photo: { filePath: string; messageId: number; userId: string; creationDate: string }) => {

        setMessages((prevMessages) => {

          const updatedMessages = prevMessages.map((msg) => {
            if (msg.id === photo.messageId) {

              return { ...msg, photo }; 
            } else {
              return msg;
            }
          });

          return updatedMessages;
        });
  
      });
    }
  
    return () => {
      if (connection) {
        connection.off("ReceivePhoto");
      }
    };
  }, [connection]);
  

  useEffect(() => {
    if (connection) {
      connection.on("ReceiveDeletedMessage", (deletedMessageId: number) => {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== deletedMessageId)
        );
      });
    }
  
    return () => {
      if (connection) {
        connection.off("ReceiveDeletedMessage");
      }
    };
  }, [connection]);


  useEffect(() => {
    if (connection) {
      connection.on("ReceiveUpdatedMessage", (updatedMessage: { id: number; text: string }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === updatedMessage.id ? { ...msg, text: updatedMessage.text } : msg
          )
        );
      });
    }
  
    return () => {
      if (connection) {
        connection.off("ReceiveUpdatedMessage");
      }
    };
  }, [connection]);



  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], 
        allowsEditing: true, 
        aspect: [4, 3], 
        quality: 1, 
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        setSelectedPhoto(photo.uri); 
      } 
    } catch (error) {
      console.error("Error picking photo:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);

      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
  
      if (connection) {
        await connection.invoke("DeleteMessage", friendshipId, messageId);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setEditing(false); 
      setLongPressTriggered(false); 
      setSelectedMessageId(null); 
    }
  };
  
  const fetchMessageHistory = async (isInitialLoad = false) => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const skip = isInitialLoad ? 0 : page * PAGE_SIZE;
      const response = await axiosInstance.get(
        `/messages/${friendshipId}?skip=${skip}&take=${PAGE_SIZE}`
      );

      const messagesWithPhotos = await Promise.all(
        response.data.map(async (message: any) => {
          try {
            const photoResponse = await axiosInstance.get(`/photos/messages/${message.id}`);
            const photo = photoResponse.data; 
            return { ...message, photo: photo || null }; 
          } catch (error) {
            console.error(`Error fetching photo for message ${message.id}:`, error);
            return { ...message, photo: null }; 
          }
        })
      );
  
      
    if (isInitialLoad) {
      setMessages(messagesWithPhotos); 
    } else {
      setMessages((prevMessages) => [...prevMessages, ...messagesWithPhotos]); 
    }

  
    setPage((prevPage) => prevPage + 1); 
  

    if (messagesWithPhotos.length < PAGE_SIZE) {
      setHasMore(false);
    }

    } catch (error) {
      if (error.response && error.response.status === 404) {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  };
  

  useEffect(() => {
    const connectToSignalR = async () => {
    const userId = await AsyncStorage.getItem('userId');
    setUserId(userId);
    await fetchMessageHistory(true);
      const conn = new HubConnectionBuilder()
        .withUrl(SIGNALR_URL)
        .withAutomaticReconnect()
        .build();
     
      conn.on("ReceiveMessage", (message) => {
        setMessages((prevMessages) => [message, ...prevMessages]);
      });
      try {
        await conn.start();
      } catch (error) {

      }
      try {
        await conn.invoke("JoinRoom", friendshipId);
      } catch(error){
      }
     

      setConnection(conn);
    
    };

    connectToSignalR();

    return () => {
      if (connection) {
        connection.invoke("LeaveRoom", friendshipId);
        connection.stop();
      }
    };
  }, [friendshipId]);

  const sendMessage = async () => {
    if (!connection || connection.state !== "Connected") {
      console.error("SignalR connection is not active. Cannot send message.");
      return;
    }
  
    if (!sending) {
      setSending(true);
      try {
        if (newMessage.trim() && editingMessageId || messagesCheck.photo != null ) {
          const response = await axiosInstance.put(`/messages/${editingMessageId}`, { text: newMessage });
          const updatedMessage = response.data;
  
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === editingMessageId ? { ...msg, text: updatedMessage.text } : msg
            )
          );
  
          await connection.invoke("UpdateMessage", friendshipId, updatedMessage.id, updatedMessage.text);
  

          setEditingMessageId(null);
          setSelectedMessageId(null); 
          setNewMessage(""); 
          setEditing(false);
          setMessagesCheck([]);
          Keyboard.dismiss();
        } else {
          const formData = new FormData();
          if (selectedPhoto) {
            formData.append("file", {
              uri: selectedPhoto,
              name: "photo.jpg",
              type: "image/jpeg",
            });
          }
  
          if (selectedPhoto) {
            const messageResponse = await axiosInstance.post(`/messages/${friendshipId}`, { text: newMessage });
            const message = messageResponse.data;
            const photoData = await axiosInstance.post(`/photos/messages/${message.id}`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            const photo = photoData.data;

            await connection.invoke("SendMessage", friendshipId, message.userId, message.text, message.creationDate, message.id);

            await connection.invoke("SendPhoto", friendshipId, photo.filePath, message.id, message.userId, message.creationDate.toString());

            setMessages((prevMessages) => [
              { ...message, photo },...prevMessages, 
            ]);

           
          } else if (newMessage.trim()){
            const messageResponse = await axiosInstance.post(`/messages/${friendshipId}`, { text: newMessage }); 
            const message = messageResponse.data;

            await connection.invoke("SendMessage", friendshipId, message.userId, message.text, message.creationDate, message.id);
            setMessages((prevMessages) => [ message, ...prevMessages,]);
          }

  

          setNewMessage(""); 
          setSelectedPhoto(null);
          scrollToStart();
        }
      } catch (error) {
        console.error("Error sending or editing message:", error);
      } finally {
        setSending(false);
      
      }
    }
  };

 
  const scrollToStart = () => {
    if (flatListRef.current) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100); 
      });
    }
  };

    return (
    <>
      <TouchableWithoutFeedback
        onPress={() => {
          setSelectedMessageId(null);
          setLongPressTriggered(false);
        }}
      >
        <View style={styles.container}>

            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                keyboardShouldPersistTaps="handled"
                inverted
                renderItem={({ item }) => (
                  <View>
                    <View
                      style={[
                        styles.message,
                        item.userId === userId ? styles.myMessage : styles.friendMessage,
                        
                      ]}
                    >
                    
                     
                    <TouchableOpacity
                      onPress={() => {
                        if (!longPressTriggered) {
                          setSelectedMessageId((prev) => (prev === item.id ? null : item.id));
                          const index = messages.findIndex((msg) => msg.id === item.id);
                          try {
                            flatListRef.current?.scrollToIndex({
                              index,
                              animated: true,
                              viewPosition: 0.8,
                            });
                          } catch (error) {
                            console.error("Error scrolling to index:", error);
                          }
                        }
                      }}
                      onLongPress={() => {
                        if (item.userId === userId && selectedPhoto == null) {
                          setLongPressTriggered(true);
                          setSelectedMessageId(item.id);

                          const index = messages.findIndex((msg) => msg.id === item.id);
                          try {
                            flatListRef.current?.scrollToIndex({
                              index,
                              animated: true,
                              viewPosition: 0.8, 
                            });
                          } catch (error) {
                            console.error("Error scrolling to index:", error);
                          }
                        }
                      }}
                      delayLongPress={300}
                    >
                      {item.text != "" && (
                          <Text
                            style={
                              item.userId === userId
                                ? styles.myMessageText
                                : styles.friendMessageText
                            }
                          >
                            {item.text}
                          </Text>
                        )}
                     {item.photo && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: item.photo.filePath }}
                          style={[
                            styles.photo,
                            item.userId === userId ? styles.myPhoto : styles.friendPhoto,
                          ]}
                        />
                        <TouchableOpacity
                          style={[
                            item.userId === userId
                              ? styles.fullScreenButtonMine 
                              : styles.fullScreenButtonFriend, 
                          ]}
                          onPress={() => setFullScreenImage(item.photo.filePath)} 
                        >
                          <Icon
                            name="expand"
                            size={18}
                            color={item.userId === userId ? WHITE : PRIMARY_COLOR} 
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                    </TouchableOpacity>
                    </View>

                    {selectedMessageId === item.id && !longPressTriggered && !editing && (
                      <Text
                        style={[
                          styles.timestamp,
                          item.userId === userId
                            ? styles.myTimestamp
                            : styles.friendTimestamp,
                        ]}
                      >
                        {new Date(item.creationDate).toLocaleString([], {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, 
                        })}
                      </Text>
                    )}

                    {selectedMessageId === item.id && longPressTriggered && (
                      <View
                        style={[
                          styles.messageActions,
                          item.userId === userId
                            ? styles.myMessageActions
                            : styles.friendMessageActions,
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setEditingMessageId(item.id); 
                            setNewMessage(item.text);
                            setLongPressTriggered(false);
                            setEditing(true); 
                            setMessagesCheck(item);
                            inputRef.current?.focus();
                          }}
                        >
                          <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                        <Text>|</Text>
                        <TouchableOpacity
                          onPress={() => deleteMessage(item.id) }
                          
                        >
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                onEndReachedThreshold={0.5} 
                onEndReached={() => {
                  if (!loadingMore) {
                    fetchMessageHistory(); 
                  }
                }}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    </View>
                  ) : null
                }
              />
             {isBanned ? (
              <View style={styles.bannedContainer}>
                <Text style={styles.bannedText}>This gamer is unavailable.</Text>
              </View>
              ) : (
              <>
                {editingMessageId && (
                  <View style={styles.editingIndicator}>
                    <Text style={styles.editingText}>Editing Message</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingMessageId(null); 
                        setNewMessage(""); 
                        setEditing(false); 
                        setSelectedMessageId(null); 
                        setSelectedPhoto(null);
                        setMessagesCheck([]); 
                        Keyboard.dismiss(); 
                      }}
                    >
                      <Icon  style={styles.cancelText} name="close-circle" size={25} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedPhoto && (
                  
                  <View style={styles.selectedPhotoContainer}>
                    <Text style={styles.editingText}>Selected Image: </Text>
                    <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
                    <TouchableOpacity
                      onPress={() => setSelectedPhoto(null)} 
                      style={styles.removePhotoButton}
                    > 
                      <Icon name="close-circle" size={25} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef} 
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline={true} 
                    placeholder={editingMessageId ? "Edit your message..." : "Message..."} 
                  />
                  <TouchableOpacity
                    onPress={() => {
                      sendMessage(); 
                    }}
                    style={[
                      styles.sendButton,
                      ((messagesCheck.photo == null && !selectedPhoto && !newMessage.trim()) || sending) && styles.sendButtonDisabled, 
                    ]}
                    disabled={(messagesCheck.photo == null && !selectedPhoto && !newMessage.trim()) || sending}  
                  >
                    
                    <Icon name="send" size={20} color={WHITE} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickPhoto}
                    style={[
                      styles.photoButton,
                      (editing || selectedPhoto != null || sending) && styles.sendButtonDisabled,
                    ]}
                    disabled={editing || selectedPhoto != null || sending} 
                  >
                    <Icon name="image" size={20} color={WHITE} />
                  </TouchableOpacity>
                </View>
                </>
                )}
            </>
         
        </View>
      </TouchableWithoutFeedback>
        {fullScreenImage && (
          <Modal
            visible={true}
            transparent={true}
            onRequestClose={() => setFullScreenImage(null)} 
          >
            <TouchableWithoutFeedback onPress={() => setFullScreenImage(null)}>
              <View style={styles.fullScreenContainer}>
                <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} />
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </>
    );
  };

const styles = StyleSheet.create({
  bannedContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SECONDARY_COLOR, 
    borderRadius: 10,
    marginTop: 8,
    opacity: 0.5, 
  },
  bannedText: {
    color: BLACK, 
    fontWeight: "bold",
    textAlign: "center",
  },
  imageContainer: {
    position: "relative", 
  },
  fullScreenButtonMine: {
    position: "absolute",
    bottom: 8,
    right: 8, 
    backgroundColor: PRIMARY_COLOR, 
    padding: 8,
    borderRadius: 20,
  },
  fullScreenButtonFriend: {
    position: "absolute",
    bottom: 8,
    right: 8, 
    backgroundColor: WHITE, 
    padding: 8,
    borderRadius: 20,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)", 
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: 'contain', 
  },
  selectedPhotoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderTopWidth: 1, 
    borderTopColor: BLACK, 
    paddingTop: 8, 
  },
  selectedPhoto: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 8,
    marginLeft: 8,
  },
  removePhotoButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 8,
  },
  myPhoto: {
    alignSelf: "flex-end", 
  },
  friendPhoto: {
    alignSelf: "flex-start", 
  },
  photoButton: {
    marginLeft: 8,
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc", 
  },
  editingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 10,
    marginTop: 8, 
    borderTopWidth: 1, 
  borderTopColor: BLACK, 
  },
  editingText: {
    color: BLACK, 
    fontWeight: "bold",
  },
  cancelText: {
    fontWeight: "bold",
    marginLeft: 8,
  },
  messageActions: {
    flexDirection: "row",
    marginTop: 4,
  },
  myMessageActions: {
    justifyContent: "flex-end", 
  },
  friendMessageActions: {
    justifyContent: "flex-start", 
  },
  actionText: {
    color: BLACK,
    fontWeight: "bold",
    marginHorizontal: 8, 
  },
  deleteText: {
    color: "red",
    fontWeight: "bold",
    marginHorizontal: 8, 
  },
  timestamp: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },
  myTimestamp: {
    alignSelf: "flex-end", 
  },
  friendTimestamp: {
    alignSelf: "flex-start", 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { flex: 1, padding: 16},
  message: {
    marginVertical: 4,
    padding: 8,
    borderRadius: 15,
    maxWidth: "58%",
  },
  myMessage: {
    backgroundColor: PRIMARY_COLOR,
    alignSelf: "flex-end", 
  },
  friendMessage: {
    backgroundColor: WHITE,
    alignSelf: "flex-start", 
  },
  myMessageText: {
    color: WHITE,
    fontSize:16
  },
  friendMessageText: {
    color: PRIMARY_COLOR,
    fontSize:16
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 8,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: PRIMARY_COLOR,
    padding: 8,
    borderRadius: 20,
  },
});
export default MessagingScreen;
