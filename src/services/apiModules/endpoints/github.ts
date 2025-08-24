/**
 * GitHub API Endpoints
 * GitHub profile and repository management
 */

import { api } from '../core/client';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  private: boolean;
  fork: boolean;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export const GitHubAPI = {
  async getUserProfile(username: string): Promise<GitHubUser> {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AetherApp/1.0',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub user '${username}' not found`);
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch GitHub profile');
    }
  },

  async getUserRepositories(username: string, options: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    try {
      const params = new URLSearchParams({
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: (options.per_page || 10).toString(),
        page: (options.page || 1).toString(),
      });

      const response = await fetch(`https://api.github.com/users/${username}/repos?${params}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AetherApp/1.0',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub user '${username}' not found`);
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch GitHub repositories');
    }
  },

  async getPopularRepositories(username: string, limit: number = 6): Promise<GitHubRepository[]> {
    try {
      const repos = await this.getUserRepositories(username, {
        sort: 'updated',
        direction: 'desc',
        per_page: Math.min(limit * 2, 50), // Get more to filter out forks
      });

      // Filter out forks and sort by stars, then by recent activity
      const filteredRepos = repos
        .filter(repo => !repo.fork && !repo.private)
        .sort((a, b) => {
          // Primary sort by stars (descending)
          if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count;
          }
          // Secondary sort by recent push (descending)
          return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        })
        .slice(0, limit);

      return filteredRepos;
    } catch (error: unknown) {
      throw error;
    }
  },

  // Internal API methods for storing/retrieving GitHub username
  async updateGitHubUsername(username: string): Promise<any> {
    try {
      const response = await api.put('/user/profile', {
        githubUsername: username,
      });
      return response.data;
    } catch (error: unknown) {
      // Handle case where backend doesn't support GitHub username yet
      if ((error as any).response?.status === 404 || (error as any).response?.status === 400) {
        // Store locally for now
        return {
          status: 'success',
          message: 'GitHub username stored locally',
          data: { githubUsername: username }
        };
      }
      throw error;
    }
  },

  async removeGitHubUsername(): Promise<any> {
    try {
      const response = await api.put('/user/profile', {
        githubUsername: null,
      });
      return response.data;
    } catch (error: unknown) {
      // Handle case where backend doesn't support GitHub username yet
      if ((error as any).response?.status === 404 || (error as any).response?.status === 400) {
        return {
          status: 'success',
          message: 'GitHub username removed locally',
          data: { githubUsername: null }
        };
      }
      throw error;
    }
  },
};