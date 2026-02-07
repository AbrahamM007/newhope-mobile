import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// API URL - Update this to your server's IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.175:4000';

// Create axios instance
export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiClient = api;

// Platform-aware storage wrapper
const isWeb = Platform.OS === 'web';

const storage = {
    async setItem(key: string, value: string) {
        if (isWeb) {
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    window.localStorage.setItem(key, value);
                } catch (e) {
                    console.error('Error saving to localStorage', e);
                }
            }
        } else {
            try {
                await SecureStore.setItemAsync(key, value);
            } catch (e) {
                console.error('SecureStore Error:', e);
            }
        }
    },
    async getItem(key: string): Promise<string | null> {
        if (isWeb) {
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    return window.localStorage.getItem(key);
                } catch (e) {
                    console.error('Error reading from localStorage', e);
                    return null;
                }
            }
            return null;
        } else {
            try {
                return await SecureStore.getItemAsync(key);
            } catch (e) {
                console.error('SecureStore Error:', e);
                return null;
            }
        }
    },
    async deleteItem(key: string) {
        if (isWeb) {
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    window.localStorage.removeItem(key);
                } catch (e) {
                    console.error('Error removing from localStorage', e);
                }
            }
        } else {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (e) {
                console.error('SecureStore Error:', e);
            }
        }
    }
};

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Token management
export const setAuthToken = async (token: string) => {
    await storage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const getAuthToken = async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async () => {
    await storage.deleteItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
};

// User storage
export const setStoredUser = async (user: any) => {
    await storage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = async (): Promise<any | null> => {
    const user = await storage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const removeStoredUser = async () => {
    await storage.deleteItem(USER_KEY);
};

// Request interceptor - add token to requests
api.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth
            await removeAuthToken();
            await removeStoredUser();
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (email: string, password: string, firstName: string, lastName: string) => {
        const response = await api.post('/auth/register', {
            email,
            password,
            firstName,
            lastName,
        });
        return response.data;
    },

    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// Events API
export const eventsAPI = {
    getAll: async () => {
        const response = await api.get('/schedule/events');
        return response.data;
    },

    getUpcoming: async (limit: number = 5) => {
        const response = await api.get('/schedule/events');
        // Filter for upcoming events client-side for now
        const now = new Date();
        return response.data
            .filter((e: any) => new Date(e.date) >= now)
            .slice(0, limit);
    },
};

// Services API
export const servicesAPI = {
    getAll: async () => {
        const response = await api.get('/schedule/services');
        return response.data;
    },
};

// CMS API
export const cmsAPI = {
    getSiteConfig: async () => {
        const response = await api.get('/cms/site-config');
        return response.data;
    },

    getMinistries: async () => {
        const response = await api.get('/cms/ministries');
        return response.data;
    },

    getTeam: async () => {
        const response = await api.get('/cms/team');
        return response.data;
    },
};

// Posts API (for feed)
export const postsAPI = {
    getAll: async () => {
        const response = await api.get('/posts');
        return response.data;
    },

    create: async (content: string, mediaUrls?: string[]) => {
        const response = await api.post('/posts', { content, mediaUrls });
        return response.data;
    },

    like: async (postId: string) => {
        const response = await api.post(`/posts/${postId}/like`);
        return response.data;
    },

    comment: async (postId: string, content: string) => {
        const response = await api.post(`/posts/${postId}/comments`, { content });
        return response.data;
    },
};

// Groups API
export const groupsAPI = {
    getAll: async () => {
        const response = await api.get('/groups');
        return response.data;
    },

    getMyGroups: async () => {
        const response = await api.get('/groups/my-groups');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/groups/${id}`);
        return response.data;
    },

    create: async (name: string, description?: string, type?: string) => {
        const response = await api.post('/groups', { name, description, type });
        return response.data;
    },

    join: async (groupId: string) => {
        const response = await api.post(`/groups/${groupId}/join`);
        return response.data;
    },

    leave: async (groupId: string) => {
        const response = await api.post(`/groups/${groupId}/leave`);
        return response.data;
    },

    getMessages: async (groupId: string) => {
        const response = await api.get(`/groups/${groupId}/messages`);
        return response.data;
    },

    sendMessage: async (groupId: string, content: string) => {
        const response = await api.post(`/groups/${groupId}/messages`, { content });
        return response.data;
    },
};

// Messages API (DMs)
export const messagesAPI = {
    getConversations: async () => {
        const response = await api.get('/messages/conversations');
        return response.data;
    },

    getDMMessages: async (userId: string) => {
        const response = await api.get(`/messages/dm/${userId}`);
        return response.data;
    },

    sendDM: async (userId: string, content: string) => {
        const response = await api.post(`/messages/dm/${userId}`, { content });
        return response.data;
    },
};

// Events API
export const eventsFullAPI = {
    getAll: async (upcoming?: boolean) => {
        const response = await api.get('/events', { params: { upcoming } });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    rsvp: async (eventId: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING') => {
        const response = await api.post(`/events/${eventId}/rsvp`, { status });
        return response.data;
    },

    cancelRsvp: async (eventId: string) => {
        const response = await api.delete(`/events/${eventId}/rsvp`);
        return response.data;
    },

    getMyRsvps: async () => {
        const response = await api.get('/events/my/rsvps');
        return response.data;
    },
};

// Serving API
export const servingAPI = {
    getMySchedule: async (upcoming?: boolean) => {
        const response = await api.get('/serving/my-schedule', { params: { upcoming } });
        return response.data;
    },

    respond: async (assignmentId: string, status: 'CONFIRMED' | 'DECLINED') => {
        const response = await api.patch(`/serving/${assignmentId}/respond`, { status });
        return response.data;
    },
};

// Worship Services API
export const worshipAPI = {
    // Services
    getAll: async (upcoming = true) => {
        const response = await api.get('/worship', { params: { upcoming } });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/worship/${id}`);
        return response.data;
    },

    create: async (data: { serviceId?: string; date: string; title: string; notes?: string }) => {
        const response = await api.post('/worship', data);
        return response.data;
    },

    update: async (id: string, data: { title?: string; notes?: string; status?: string; date?: string }) => {
        const response = await api.patch(`/worship/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/worship/${id}`);
        return response.data;
    },

    // Items (Songs, Headers, etc.)
    addItem: async (serviceId: string, item: {
        type?: 'SONG' | 'HEADER' | 'ITEM';
        title: string;
        artist?: string;
        key?: string;
        bpm?: number;
        duration?: string;
        assignee?: string;
        notes?: string;
        youtubeUrl?: string;
        spotifyUrl?: string;
    }) => {
        const response = await api.post(`/worship/${serviceId}/items`, item);
        return response.data;
    },

    updateItem: async (serviceId: string, itemId: string, data: any) => {
        const response = await api.patch(`/worship/${serviceId}/items/${itemId}`, data);
        return response.data;
    },

    deleteItem: async (serviceId: string, itemId: string) => {
        const response = await api.delete(`/worship/${serviceId}/items/${itemId}`);
        return response.data;
    },

    reorderItems: async (serviceId: string, itemOrders: { itemId: string; order: number }[]) => {
        const response = await api.patch(`/worship/${serviceId}/items/reorder`, { itemOrders });
        return response.data;
    },

    // Team members (instruments)
    addMember: async (serviceId: string, data: { userId: string; instrument: string; notes?: string }) => {
        const response = await api.post(`/worship/${serviceId}/members`, data);
        return response.data;
    },

    updateMember: async (serviceId: string, memberId: string, data: { instrument?: string; status?: string; notes?: string }) => {
        const response = await api.patch(`/worship/${serviceId}/members/${memberId}`, data);
        return response.data;
    },

    removeMember: async (serviceId: string, memberId: string) => {
        const response = await api.delete(`/worship/${serviceId}/members/${memberId}`);
        return response.data;
    },

    // Files
    addFile: async (serviceId: string, file: { name: string; url: string; type?: string; size?: number; mimeType?: string }) => {
        const response = await api.post(`/worship/${serviceId}/files`, file);
        return response.data;
    },

    deleteFile: async (serviceId: string, fileId: string) => {
        const response = await api.delete(`/worship/${serviceId}/files/${fileId}`);
        return response.data;
    },

    // My assignments
    getMyAssignments: async (upcoming = true) => {
        const response = await api.get('/worship/my/assignments', { params: { upcoming } });
        return response.data;
    },
};

// Notifications API
export const notificationsAPI = {
    getAll: async (limit = 50) => {
        const response = await api.get('/notifications', { params: { limit } });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    markRead: async (notificationId: string) => {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },

    registerPushToken: async (token: string, platform: 'ios' | 'android') => {
        const response = await api.post('/notifications/push-token', { token, platform });
        return response.data;
    },

    removePushToken: async (token: string) => {
        const response = await api.delete('/notifications/push-token', { data: { token } });
        return response.data;
    },
};

export default api;
