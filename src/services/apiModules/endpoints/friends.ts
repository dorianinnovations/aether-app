/**
 * Friends API Endpoints
 * Friend management, lookup, requests, and social connections
 */

import { api } from '../core/client';

export const FriendsAPI = {
  async addFriend(username: string): Promise<any> {
    const response = await api.post('/friends/add', { username });
    return response.data;
  },

  async getFriendsList(): Promise<any> {
    const response = await api.get('/friends/list');
    return response.data;
  },

  async lookupUser(username: string): Promise<any> {
    const response = await api.get(`/friends/lookup/${username}`);
    return response.data;
  },

  async removeFriend(username: string): Promise<any> {
    const response = await api.delete('/friends/remove', { data: { username } });
    return response.data;
  },

  async getUserUsername(): Promise<any> {
    const response = await api.get('/friends/my-username');
    return response.data;
  },

  async getFriendRequests(): Promise<any> {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  async acceptFriendRequest(username: string): Promise<any> {
    const response = await api.post('/friends/requests/accept', { username });
    return response.data;
  },

  async declineFriendRequest(username: string): Promise<any> {
    const response = await api.post('/friends/requests/decline', { username });
    return response.data;
  },

  // Friend Messaging Endpoints
  async sendDirectMessage(friendUsername: string, message: string): Promise<any> {
    const response = await api.post('/friend-messaging/send', { 
      toUsername: friendUsername, 
      content: message 
    });
    return response.data;
  },

  async getDirectMessages(friendUsername: string, page: number = 1, limit: number = 50): Promise<any> {
    const response = await api.get(`/friend-messaging/conversation/${friendUsername}?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getDirectMessageConversations(): Promise<any> {
    const response = await api.get('/friend-messaging/conversations');
    return response.data;
  },

  async getMessagingHeatMap(friendUsername: string): Promise<any> {
    const response = await api.get(`/friend-messaging/heat-map/${friendUsername}`);
    return response.data;
  },

  async getMessagingStats(friendUsername: string): Promise<any> {
    const response = await api.get(`/friend-messaging/stats/${friendUsername}`);
    return response.data;
  },

  async getAllActiveStreaks(): Promise<any> {
    const response = await api.get('/friend-messaging/streaks');
    return response.data;
  },
};