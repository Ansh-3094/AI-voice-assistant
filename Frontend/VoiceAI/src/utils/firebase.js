
import { initializeApp } from "firebase/app";
import {getAuth , GoogleAuthProvider} from "firebase/auth";


const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "voiceai-52060.firebaseapp.com",
  projectId: "voiceai-52060",
  storageBucket: "voiceai-52060.firebasestorage.app",
  messagingSenderId: "815631129682",
  appId: "1:815631129682:web:b7ac7046b1eef4b33b938b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };