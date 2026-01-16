import React from 'react';
import { SafeAreaView } from 'react-native';
import InsideScreen from './src/screens/InsideScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <InsideScreen />
    </SafeAreaView>
  );
}
