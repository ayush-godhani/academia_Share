
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch Firestore profile from backend
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/profile');
      setUserProfile(res.data.user);
      return res.data.user;
    } catch (err) {
      console.error('fetchProfile failed:', err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Register
  const register = async ({
    firstName,
    lastName,
    email,
    password,
    userType,
    institution,
    newsletter,
  }) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = cred.user.uid;

    await api.post('/auth/register', {
      uid,
      firstName,
      lastName,
      email,
      userType,
      institution,
      newsletter,
    });

    const token = await cred.user.getIdToken();

    api.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${token}`;

    await fetchProfile();

    return cred.user;
  };

  // Login
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = await cred.user.getIdToken();

    api.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${token}`;

    await fetchProfile();

    return cred.user;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Get Firebase token
  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  // Change Password
  const changePassword = async (
    currentPassword,
    newPassword
  ) => {
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error('User not logged in.');
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    await reauthenticateWithCredential(
      user,
      credential
    );

    await updatePassword(user, newPassword);
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setCurrentUser(user);

        if (user) {
          const token = await user.getIdToken();

          api.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${token}`;

          await fetchProfile();
        } else {
          delete api.defaults.headers.common[
            'Authorization'
          ];
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    profileLoading,
    register,
    login,
    logout,
    getToken,
    fetchProfile,
    changePassword,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);