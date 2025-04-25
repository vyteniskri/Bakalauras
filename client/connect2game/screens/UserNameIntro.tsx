import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIMARY_COLOR } from '../assets/styles';

const UserNameIntro = ({ navigation }: { navigation: any }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const getToken = async () => {
        const storedToken = await AsyncStorage.getItem('accessToken');
        setToken(storedToken);
      };
      getToken();
    }, [])
  );

  const handleSubmit = async () => {
    if (!text) {
      Alert.alert("To continue", "Please enter some text");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `http://10.0.2.2:5186/api/informationFieldProfile`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigation.navigate("Media");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 422) {
          Alert.alert("To continue", "Text must be between 5 and 500 letters.");
        } else if (err.response.status === 401) {
          Alert.alert("Please try again");
          navigation.navigate("AccessToken");
        }
      } else {
        Alert.alert("Server Error", "Unable to connect to the server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <Text style={styles.header}>What's your gamer tag?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter tag"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    width: '100%',
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  button: {
    position: "absolute",
    bottom: 20,
    width: '90%',
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
});

export default UserNameIntro;