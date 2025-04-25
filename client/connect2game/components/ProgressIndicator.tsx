import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PRIMARY_COLOR } from '../assets/styles';

const ProgressIndicator = ({ step, totalSteps }: { step: number; totalSteps: number }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.step,
            index < step && styles.activeStep,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 0,
    paddingHorizontal: 0,
  },
  step: {
    flex: 1,
    height: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 0,
  },
  activeStep: {
    backgroundColor: PRIMARY_COLOR,
  },
});

export default ProgressIndicator;