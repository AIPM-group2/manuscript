import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    type User
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// User store - will be populated by Firebase auth state
export const user = writable<User | null>(null);
export const authLoading = writable(true);
export const authError = writable<string | null>(null);

// API Key store (separate from auth)
export const apiKey = writable('');

// Initialize auth state listener
if (browser) {
    // Load saved API key
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        apiKey.set(savedApiKey);
    }

    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, (firebaseUser) => {
        user.set(firebaseUser);
        authLoading.set(false);
    });
}

// Email/Password Login
export async function login(email: string, password: string): Promise<boolean> {
    authError.set(null);
    authLoading.set(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user.set(userCredential.user);
        authLoading.set(false);
        return true;
    } catch (error: any) {
        console.error('Login error:', error);
        authError.set(getErrorMessage(error.code));
        authLoading.set(false);
        return false;
    }
}

// Email/Password Signup
export async function signup(email: string, password: string, name: string): Promise<boolean> {
    authError.set(null);
    authLoading.set(true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update display name
        if (name && userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name });
        }

        user.set(userCredential.user);
        authLoading.set(false);
        return true;
    } catch (error: any) {
        console.error('Signup error:', error);
        authError.set(getErrorMessage(error.code));
        authLoading.set(false);
        return false;
    }
}

// Google Sign-In
export async function signInWithGoogle(): Promise<boolean> {
    authError.set(null);
    authLoading.set(true);

    try {
        const result = await signInWithPopup(auth, googleProvider);
        user.set(result.user);
        authLoading.set(false);
        return true;
    } catch (error: any) {
        console.error('Google sign-in error:', error);
        authError.set(getErrorMessage(error.code));
        authLoading.set(false);
        return false;
    }
}

// Logout
export async function logout(): Promise<void> {
    try {
        await signOut(auth);
        user.set(null);
        localStorage.removeItem('apiKey');
        apiKey.set('');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Save API Key
export function saveApiKey(key: string): void {
    localStorage.setItem('apiKey', key);
    apiKey.set(key);
}

// Helper: Convert Firebase error codes to user-friendly messages
function getErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try logging in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/password sign-in is not enabled.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed. Please try again.';
        case 'auth/cancelled-popup-request':
            return 'Only one popup request is allowed at a time.';
        default:
            return 'An error occurred. Please try again.';
    }
}
