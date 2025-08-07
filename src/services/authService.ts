/**
 * Unified Authentication Service
 * Centralized authentication logic with standardized patterns and error handling
 */

import { AuthAPI, TokenManager } from './api';
import { User, StandardAPIResponse } from '../types/api';
import { StorageCleanup } from '../utils/storageCleanup';
import { logger } from '../utils/logger';

// ========================================
// AUTHENTICATION STATE MANAGEMENT
// ========================================

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

class AuthenticationService {
  private static instance: AuthenticationService;
  private _state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null
  };

  private _listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  public get state(): AuthState {
    return { ...this._state };
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private setState(updates: Partial<AuthState>): void {
    this._state = { ...this._state, ...updates };
    this._listeners.forEach(listener => listener(this._state));
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  private async initializeAuth(): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const token = await TokenManager.getToken();
      const user = await TokenManager.getUserData();

      if (token && user) {
        this.setState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false
        });
      } else {
        this.setState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false
        });
      }
    } catch (error) {
      logger.error('Auth initialization failed:', error);
      this.setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication initialization failed'
      });
    }
  }

  // ========================================
  // AUTHENTICATION METHODS
  // ========================================

  public async signup(
    email: string, 
    password: string, 
    name?: string, 
    username?: string
  ): Promise<StandardAPIResponse<User>> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await AuthAPI.signup(email, password, name, username);
      
      if (response.success && response.data) {
        this.setState({
          isAuthenticated: true,
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          error: null
        });

        return {
          success: true,
          status: 'success',
          data: response.data.user,
          message: 'Account created successfully'
        };
      }
      
      throw new Error('Signup failed: Invalid response format');

    } catch (error: unknown) {
      const errorMessage = (error as any).message || 'Signup failed';
      this.setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: errorMessage
      });

      return {
        success: false,
        status: 'error',
        error: {
          code: (error as any).code || 'SIGNUP_FAILED',
          message: errorMessage,
          statusCode: (error as any).statusCode || (error as any).status || 400
        }
      };
    }
  }

  public async login(
    emailOrUsername: string, 
    password: string
  ): Promise<StandardAPIResponse<User>> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await AuthAPI.login(emailOrUsername, password);
      
      if (response.success && response.data) {
        this.setState({
          isAuthenticated: true,
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          error: null
        });

        return {
          success: true,
          status: 'success',
          data: response.data.user,
          message: 'Login successful'
        };
      }
      
      throw new Error('Login failed: Invalid response format');

    } catch (error: unknown) {
      const errorMessage = (error as any).message || 'Login failed';
      this.setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: errorMessage
      });

      return {
        success: false,
        status: 'error',
        error: {
          code: (error as any).code || 'LOGIN_FAILED',
          message: errorMessage,
          statusCode: (error as any).statusCode || (error as any).status || 401
        }
      };
    }
  }

  public async logout(): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      await AuthAPI.logout();
      
      this.setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null
      });

    } catch (error) {
      // Even if logout API call fails, we should clear local state
      logger.error('Logout API call failed:', error);
      
      this.setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null
      });
    }
  }

  public async refreshToken(): Promise<boolean> {
    try {
      const response = await AuthAPI.refreshToken();
      
      if (response.success && response.data) {
        this.setState({
          token: response.data.token,
          error: null
        });
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('Token refresh failed:', error);
      await this.logout(); // Clear auth state on refresh failure
      return false;
    }
  }

  // ========================================
  // USERNAME VALIDATION
  // ========================================

  public async checkUsernameAvailability(
    username: string
  ): Promise<StandardAPIResponse<{ available: boolean; message?: string }>> {
    try {
      const response = await AuthAPI.checkUsernameAvailability(username);
      return response;
    } catch (error: unknown) {
      return {
        success: false,
        status: 'error',
        error: {
          code: 'USERNAME_CHECK_FAILED',
          message: (error as any).message || 'Could not check username availability',
          statusCode: (error as any).statusCode || (error as any).status || 500
        }
      };
    }
  }

  // ========================================
  // SPOTIFY INTEGRATION
  // ========================================

  public async connectSpotify(): Promise<StandardAPIResponse<any>> {
    try {
      const response = await AuthAPI.connectSpotify();
      return response;
    } catch (error: unknown) {
      return {
        success: false,
        status: 'error',
        error: {
          code: 'SPOTIFY_CONNECT_FAILED',
          message: (error as any).message || 'Failed to connect Spotify account',
          statusCode: (error as any).statusCode || (error as any).status || 500
        }
      };
    }
  }

  public async disconnectSpotify(): Promise<StandardAPIResponse<any>> {
    try {
      const response = await AuthAPI.disconnectSpotify();
      return response;
    } catch (error: unknown) {
      return {
        success: false,
        status: 'error',
        error: {
          code: 'SPOTIFY_DISCONNECT_FAILED',
          message: (error as any).message || 'Failed to disconnect Spotify account',
          statusCode: (error as any).statusCode || (error as any).status || 500
        }
      };
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  public isAuthenticated(): boolean {
    return this._state.isAuthenticated;
  }

  public getCurrentUser(): User | null {
    return this._state.user;
  }

  public getCurrentToken(): string | null {
    return this._state.token;
  }

  public getAuthState(): AuthState {
    return this.state;
  }

  public clearError(): void {
    this.setState({ error: null });
  }

  // ========================================
  // STORAGE MANAGEMENT
  // ========================================

  public async cleanupUserStorage(userId?: string): Promise<void> {
    const targetUserId = userId || this._state.user?.id;
    if (targetUserId) {
      await StorageCleanup.cleanupUserStorage(targetUserId);
    }
  }
}

// Export singleton instance
export const authService = AuthenticationService.getInstance();

// Export class for testing
export { AuthenticationService };

// ========================================
// REACT HOOK FOR AUTHENTICATION
// ========================================

import { useState, useEffect } from 'react';

export function useAuthentication() {
  const [authState, setAuthState] = useState<AuthState>(authService.state);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signup: authService.signup.bind(authService),
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    refreshToken: authService.refreshToken.bind(authService),
    checkUsernameAvailability: authService.checkUsernameAvailability.bind(authService),
    connectSpotify: authService.connectSpotify.bind(authService),
    disconnectSpotify: authService.disconnectSpotify.bind(authService),
    clearError: authService.clearError.bind(authService),
    cleanupUserStorage: authService.cleanupUserStorage.bind(authService),
  };
}