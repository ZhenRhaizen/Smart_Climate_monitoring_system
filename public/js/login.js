import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDL4nR_DCsGmQZgB8OIH6EQUO4XcXPdcn8",
    authDomain: "smartclimatemonitorsystem.firebaseapp.com",
    projectId: "smartclimatemonitorsystem",
    storageBucket: "smartclimatemonitorsystem.firebasestorage.app",
    messagingSenderId: "865844912759",
    appId: "1:865844912759:web:31a7e8f24f8379215adc72"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    alert(`Welcome back, ${userCredential.user.email}!`);
    window.location.href = "dashboard.html";
    } catch (error) {
    alert(`Login failed: ${error.message}`);
    }
});