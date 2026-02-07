import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useFrameworkReady } from '@/useFrameworkReady';

function RootLayoutContent() {
  useFrameworkReady();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="messages" options={{ presentation: 'card' }} />
            <Stack.Screen name="events" options={{ presentation: 'card' }} />
            <Stack.Screen name="prayer" options={{ presentation: 'card' }} />
            <Stack.Screen name="give" options={{ presentation: 'card' }} />
            <Stack.Screen name="announcements" options={{ presentation: 'card' }} />
            <Stack.Screen name="directory" options={{ presentation: 'card' }} />
            <Stack.Screen name="profile" options={{ presentation: 'card' }} />
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
