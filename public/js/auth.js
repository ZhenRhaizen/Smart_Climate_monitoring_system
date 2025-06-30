// js/account.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDL4nR_DCsGmQZgB8OIH6EQUO4XcXPdcn8",
  authDomain: "smartclimatemonitorsystem.firebaseapp.com",
  projectId: "smartclimatemonitorsystem",
  storageBucket: "smartclimatemonitorsystem.appspot.com",
  messagingSenderId: "865844912759",
  appId: "1:865844912759:web:31a7e8f24f8379215adc72"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const form = document.getElementById('passwordForm');
const alertBox = document.getElementById('alertBox');
const userEmail = document.getElementById('userEmail');
const emailVerified = document.getElementById('emailVerified');

// Auth state check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    userEmail.textContent = user.email || "Unavailable";
  }
});

// Handle password update
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.textContent = '';
  alertBox.style.color = '';

  const user = auth.currentUser;
  const oldPassword = document.getElementById('oldPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();

  if (!user) {
    alertBox.textContent = "❌ You must be logged in.";
    alertBox.style.color = "red";
    return;
  }

  if (newPassword.length < 6) {
    alertBox.textContent = "⚠️ New password must be at least 6 characters.";
    alertBox.style.color = "red";
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    alertBox.textContent = "✅ Password updated successfully.";
    alertBox.style.color = "green";
    form.reset();
    document.getElementById('showPasswords').checked = false;
    toggleAllPasswords({ checked: false }); // this must be declared globally

  } catch (error) {
    alertBox.style.color = "red";
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        alertBox.textContent = "❌ Old password is incorrect.";
        break;
      case 'auth/weak-password':
        alertBox.textContent = "❌ New password is too weak.";
        break;
      case 'auth/user-token-expired':
      case 'auth/user-mismatch':
        alertBox.textContent = "❌ Session expired. Redirecting...";
        setTimeout(() => window.location.href = "index.html", 3000);
        break;
      default:
        alertBox.textContent = `❌ Error: ${error.message}`;
    }
  }
});