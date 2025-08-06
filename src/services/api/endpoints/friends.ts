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
};