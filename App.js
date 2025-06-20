import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './components/AuthScreen';
import ClientScreen from './components/ClientScreen';
import { QueueProvider } from './context/QueueContext';

const Stack = createStackNavigator();

function App() {
  return (
    <QueueProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Client">
          <Stack.Screen 
            name="Client" 
            component={ClientScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueueProvider>
  );
}

export default App;