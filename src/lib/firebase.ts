// Firebase Configuration for Manuscript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDPoKDlu2gzIXXiKH5PVTWdaTaPsKjjSw4",
    authDomain: "manuscript-19149.firebaseapp.com",
    projectId: "manuscript-19149",
    storageBucket: "manuscript-19149.firebasestorage.app",
    messagingSenderId: "76409923840",
    appId: "1:76409923840:web:186cc72c7ad7a67910ebe5",
    measurementId: "G-D8DFBJ37B6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
