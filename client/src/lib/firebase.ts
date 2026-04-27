// Import the functions you need from the SDKs you need 
import { initializeApp } from "firebase/app"; 
import { getAnalytics } from "firebase/analytics"; 
// TODO: Add SDKs for Firebase products that you want to use 
// https://firebase.google.com/docs/web/setup#available-libraries 

// Your web app's Firebase configuration 
// For Firebase JS SDK v7.20.0 and later, measurementId is optional 
const firebaseConfig = { 
  apiKey: "AIzaSyAvNWjVo-iRa0Rrm4AS5HkF7kmKjPwYjiU", 
  authDomain: "mds1-31961.firebaseapp.com", 
  projectId: "mds1-31961", 
  storageBucket: "mds1-31961.firebasestorage.app", 
  messagingSenderId: "557513986059", 
  appId: "1:557513986059:web:f24586bffa91cad63af70e", 
  measurementId: "G-BHKY8M9RMV" 
}; 

// Initialize Firebase 
const app = initializeApp(firebaseConfig); 

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };
