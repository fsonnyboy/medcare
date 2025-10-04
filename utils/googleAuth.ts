import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthData } from '@/types/auth';

// // Configure Google Sign-In
export const configureGoogleSignIn = () => {
  
  GoogleSignin.configure({
    webClientId: "526614041029-pbsamas636jgkh7m1nnaic6s7p76mjpu.apps.googleusercontent.com",
    scopes: [
      'profile',
      'email',
      'openid',
    ],
    offlineAccess: true,
  });

};

// Sign in with Google using native Google Sign-In
export const signInWithGoogle = async (): Promise<GoogleAuthData> => {
  try {

    // Check if Google Play Services is available (Android only)
    const isAvailable = await GoogleSignin.hasPlayServices();
    if (!isAvailable) {
      throw new Error('Google Play Services is not available');
    }


    // Sign in with Google
    const result = await GoogleSignin.signIn();

    const { data } = result;

    if (!data) {
      throw new Error('No data received from Google Sign-In');
    }

    const { user, idToken } = data;

    if (!user || !idToken) {
      throw new Error('Invalid response from Google Sign-In - missing user or idToken');
    }

    // Get access token separately
    const tokens = await GoogleSignin.getTokens();
    const accessToken = tokens.accessToken;

    const googleAuthData: GoogleAuthData = {
      idToken: idToken,
      accessToken: accessToken || '',
      user: {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        photo: user.photo || undefined,
      },
    };

    return googleAuthData;

  } catch (error: any) {
    const errorString = JSON.stringify(error, null, 2);
    
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in is already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services is not available');
    } else {
      throw new Error(error.message || 'Google Sign-In failed. Please try again.');
    }
  }
};

// Sign out from Google
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error: any) {
    throw new Error('Failed to sign out from Google');
  }
};

// Check if user is signed in to Google
export const isSignedInToGoogle = async (): Promise<boolean> => {
  try {
    const user = await GoogleSignin.getCurrentUser();
    const isSignedIn = !!user;
    return isSignedIn;
  } catch (error: any) {
    return false;
  }
};

// Get current Google user
export const getCurrentGoogleUser = async () => {
  try {
    const user = await GoogleSignin.getCurrentUser();
    return user;
  } catch (error: any) {
    return null;
  }
};