import React, { useState } from 'react';
import { BackHandler, View, Text, TextInput, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard, TouchableOpacity, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PRIMARY_COLOR } from '../assets/styles';
import ProgressIndicator from '../components/ProgressIndicator';
import axiosInstance from "../components/axiosInstance";

const AboutIntro = ({ navigation }: { navigation: any }) => {
  const [text, setText] = useState('');
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

  const handleSubmit = async () => {
    if (!text) {
      Alert.alert("To continue", "Please enter some text");
      return;
    }

    if (text.length < 2 || text.length > 500) {
      Alert.alert("To continue", "Text must be between 2 and 500 characters.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(
        `/informationFieldProfile`,
        { text }
      );

      try {
        await axiosInstance.put(
          `/registrationSteps`,
          { currentStep: 2 }
        );

      } catch (postError) {
        navigation.navigate('Login');
      }

      navigation.navigate('AvatarIntro', { step: 2 });
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422) {
          Alert.alert("To continue", "Text must be between 2 and 500 characters.");
        } 
      } else {
        Alert.alert("Server Error", "Unable to connect to the server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
     
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <ProgressIndicator step={1} totalSteps={8} />
          <Text style={styles.header}>Tell us something about yourself</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter text..."
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{text.length}/500</Text>
             <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator size="large" color="#0000ff" />}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    width: '100%',
    marginTop: 20,
  },
  input: {
    width: '100%',
    height: 150, 
    borderWidth: 0.5,
    borderColor: PRIMARY_COLOR,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top', 
  },
  charCount: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginBottom: 20,
    fontSize: 14,
    color: '#888',
  },
  footer: {
    width: '110%',
    backgroundColor: '#fff', 
    paddingVertical: 10,
    alignItems: 'center',
    position: 'absolute',
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
});

export default AboutIntro;