import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true
};

// Auth actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app start
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      try {
        if (authService.isAuthenticated()) {
          // Try to get fresh user data
          const result = await authService.getProfile();
          
          if (result.success) {
            dispatch({
              type: AUTH_ACTIONS.SET_USER,
              payload: { user: result.user }
            });
          } else {
            // If profile fetch fails, use stored user data
            const storedUser = authService.getCurrentUser();
            if (storedUser && authService.isAdmin()) {
              dispatch({
                type: AUTH_ACTIONS.SET_USER,
                payload: { user: storedUser }
              });
            } else {
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user }
        });
        return { success: true, message: result.message };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE
        });
        return { success: false, message: result.message, errors: result.errors };
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE
      });
      return { success: false, message: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Get dashboard data
  const getDashboardData = useCallback(async () => {
    return await authService.getDashboardData();
  }, []);

  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    getDashboardData
  }), [state, login, logout, getDashboardData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 