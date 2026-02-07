import { Tabs, useRouter } from 'expo-router';
import { Home, Newspaper, HandHelping, Users, Play, MessageCircle, Bell } from 'lucide-react-native';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import theme from '@/lib/theme';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.brandDark,
        },
        headerShadowVisible: false,
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push('/announcements')} style={styles.headerIcon}>
              <Bell size={22} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/messages')} style={styles.headerIcon}>
              <MessageCircle size={22} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ),
        tabBarActiveTintColor: theme.colors.brandGreen,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'NewHope',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ size, color }) => <Newspaper size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="serve"
        options={{
          title: 'Serve',
          tabBarIcon: ({ size, color }) => <HandHelping size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ size, color }) => <Play size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
});
