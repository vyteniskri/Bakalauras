import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PRIMARY_COLOR } from '../assets/styles';
import { Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import ProgressIndicator from '../components/ProgressIndicator';
import axiosInstance from "../components/axiosInstance";
import { Icon } from '../components';

const MediaIntro = ({ navigation, route }: { navigation: any; route: any }) => {
  const [photos, setPhotos] = useState<any[]>(Array(6).fill(null)); 
  const [videos, setVideos] = useState<any[]>(Array(6).fill(null)); 
  const [loading, setLoading] = useState(false);
  const step = route.params?.step || 6;
  const removePhoto = (index: number) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = null;
    setPhotos(updatedPhotos);
  };

  const removeVideo = (index: number) => {
    const updatedVideos = [...videos];
    updatedVideos[index] = null;
    setVideos(updatedVideos);
  };


    useFocusEffect(
          React.useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
              navigation.navigate('Login'); 
              return true; 
            });
      
            return () => backHandler.remove(); 
      
          }, [])
        );



  const pickPhoto = async (index: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const updatedPhotos = [...photos];
      updatedPhotos[index] = result.assets[0].uri;
      setPhotos(updatedPhotos);
    }
  };

  const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
  const pickVideo = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Denied', 'You need to grant access to your media library.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'], 
      allowsEditing: true,
    });

    if (!result.canceled) {
      const videoUri = result.assets[0].uri;

      try {
        const fileInfo = await FileSystem.getInfoAsync(videoUri);

        if (!fileInfo.exists || !fileInfo.size) {
          Alert.alert('Error', 'Unable to determine file size.');
          return;
        }

        const fileSize = fileInfo.size;
        if (fileSize > MAX_VIDEO_SIZE) {
          Alert.alert('File too large', `The selected video exceeds the 20MB limit.`);
          return;
        }

        const updatedVideos = [...videos];
        updatedVideos[index] = videoUri;
        setVideos(updatedVideos);
      } catch (error) {
        console.error('Error checking file size:', error);
        Alert.alert('Error', 'Failed to verify file size.');
      }
    }
  };

  const handleSubmit = async () => {
    if (photos.every(photo => photo === null) && videos.every(video => video === null)) {
      Alert.alert('To continue', 'Please select at least one photo or video.');
      return;
    }
    setLoading(true); 
    try {
      for (let index = 0; index < photos.length; index++) {
        const photoUri = photos[index];
        if (photoUri) {
          const photoFormData = new FormData();
          photoFormData.append('file', {
            uri: photoUri,
            name: `photo${index + 1}.jpg`, 
            type: 'image/jpeg',
          });

          await axiosInstance.post(
            `/photos/profile/false/${index + 1}`,
            photoFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

        }
      }

      for (let index = 0; index < videos.length; index++) {
        const videoUri = videos[index];
        if (videoUri) {
          const videoFormData = new FormData();
          videoFormData.append('file', {
            uri: videoUri,
            name: `video${index + 1}.mp4`, 
            type: 'video/mp4',
          });


           await axiosInstance.post(
            `/videos/profile/${index + 1}`,
            videoFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

        }
      }

      try {
        await axiosInstance.put(
          `/registrationSteps`,
          { currentStep: 7 }
        );

      } catch (postError) {
        navigation.navigate('Login');
      }
      
      navigation.navigate("GameIntro", { step: 7 });
    } catch (err) {
      console.error('Error:', err);
     
        if (err.response) {
          if (err.response.status === 401) {
            Alert.alert('Please try again');
            navigation.navigate('Login');
          } else {
            Alert.alert('Error', `Something went wrong: ${err.response.status}`);
          }
        } else {
          Alert.alert('Network Error', 'Please check your internet connection');
        }
      
    } finally {
      setLoading(false); 
    }
    
  };

  const handleSkip = async () => {
    try {
      await axiosInstance.put(
        `/registrationSteps`,
        { currentStep: 7 }
      );

      navigation.navigate('GameIntro', { step: 7 });
    } catch (error) {
      navigation.navigate('Login');
      console.error('Error posting selected items:', error);
      Alert.alert('Please try again');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10, fontSize: 16, color: PRIMARY_COLOR }}></Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <ProgressIndicator step={step} totalSteps={8} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      <Text style={styles.header}>Add Some Cool Images and Videos</Text>
      <View style={styles.mediaGrid}>

        {Array.from({ length: 6 }, (_, index) => (
          <View key={`photo-${index}`} style={styles.mediaBox}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => {
                if (photos[index] === null) {
                  pickPhoto(index)
                }
              }}
            >
              {photos[index] ? (
                <Image source={{ uri: photos[index] }} style={styles.mediaImage} />
              ) : (
                <Text style={styles.mediaText}>Photo {index + 1}</Text>
              )}
            </TouchableOpacity>
            {photos[index] && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Icon name="close-circle" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.mediaGrid}>

        {Array.from({ length: 6 }, (_, index) => (
          <View key={`video-${index}`} style={styles.mediaBox}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => {
                if (videos[index] === null) {
                  pickVideo(index)
                }
              }}
            >
              {videos[index] ? (
                <Video source={{ uri: videos[index] }} style={styles.mediaVideo} />
              ) : (
                <Text style={styles.mediaText}>Video {index + 1}</Text>
              )}
            </TouchableOpacity>
            {videos[index] && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeVideo(index)}
              >
                <Icon name="close-circle" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
             <TouchableOpacity style={styles.button} onPress={handleSubmit}>
               <Text style={styles.buttonText}>Next</Text>
             </TouchableOpacity>
           </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    paddingHorizontal: 10, 
  },
  header: {
    fontSize: 22, 
    fontWeight: 'bold',
    marginBottom: 20, 
    textAlign: 'center',
    marginTop: 20,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', 
    marginBottom: 10, 
  },
  mediaBox: {
    width: '28%', 
    height: 90, 
    margin: 4, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0',
    borderColor: PRIMARY_COLOR,
    borderStyle: 'dashed', 
  },
  mediaButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  mediaText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12, 
  },
  removeButton: {
    position: 'absolute',
    bottom: 3, 
    right: 3,
  },
  footer: {
    width: '110%',
    backgroundColor: '#fff', 
    paddingVertical: 10,
    alignItems: 'center',
    position: 'absolute',
    paddingTop: 20,
    bottom: 0,
  },
  button: {
    width: '80%',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  skipButton: {
    position: 'static',
    paddingTop:10,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 12,
  },
  skipButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
  },
  
});

export default MediaIntro;