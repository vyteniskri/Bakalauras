import React, { useState } from 'react';
import { BackHandler, View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PRIMARY_COLOR } from '../assets/styles'; 
import ProgressIndicator from '../components/ProgressIndicator';
import Icon from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from "../components/axiosInstance";

const AvatarIntro = ({ navigation, route }: { navigation: any; route: any }) => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); 

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Login'); 
        return true; 
      });

      return () => backHandler.remove(); 

    }, [])
  );

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
  };

   const handleSubmit = async () => {
    if (!avatar) {
      Alert.alert('Please select an avatar');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('temporaryAccessToken');
      const photoFormData = new FormData();
      photoFormData.append('file', {
        uri: avatar,
        name: `avatar.jpg`, 
        type: 'image/jpeg',
      });

      const photoResponse = await axiosInstance.post(
        `/photos/profile/true/0`,
        photoFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      try {
        await axiosInstance.put(
          `/registrationSteps`,
          { currentStep: 3 }
        );

      } catch (postError) {
        navigation.navigate('Login');
      }

      navigation.navigate('PlatformIntro', { step: 3 }); 
    } catch (err) {
      console.error('Error:', err);
     Alert.alert('Please try again');

     navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProgressIndicator step={2} totalSteps={8} />
      <Text style={styles.header}>Select Your Avatar</Text>
      <View style={styles.avatarContainer}>
        <TouchableOpacity style={styles.avatarButton} onPress={pickAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>Select Image</Text>
          )}
        </TouchableOpacity>
        {avatar && (
          <TouchableOpacity style={styles.removeButton} onPress={removeAvatar}>
             <Icon name="close-circle" size={30} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color={PRIMARY_COLOR} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40, 
    paddingHorizontal: 10, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 20,
    textAlign: 'left',
    width: '100%',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4, 
    borderWidth: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderColor: PRIMARY_COLOR,
    borderStyle: 'dashed', 
    marginBottom: 20,
    padding:2
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    color: '#888',
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
  removeButton: {
    position: 'absolute',
    bottom: 27, 
    right: 10,
  },
  
});

export default AvatarIntro;