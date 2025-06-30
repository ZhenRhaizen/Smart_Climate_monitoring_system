// ===== IMPORTS =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDL4nR_DCsGmQZgB8OIH6EQUO4XcXPdcn8",
  authDomain: "smartclimatemonitorsystem.firebaseapp.com",
  projectId: "smartclimatemonitorsystem",
  storageBucket: "smartclimatemonitorsystem.appspot.com",
  messagingSenderId: "865844912759",
  appId: "1:865844912759:web:31a7e8f24f8379215adc72"
};

// ===== INIT FIREBASE =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== ELEMENTS =====
const inAppCheckbox = document.getElementById("inAppAlerts");
const saveBtn = document.getElementById("saveBtn");
const suggestionInput = document.getElementById("suggestionText");
const submitBtn = document.getElementById("submitSuggestion");
const alertsList = document.getElementById("sensorNotifications");

// ===== AUTH STATE =====
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // === Load Notification Preference ===
  try {
    const docRef = doc(db, "user_notifications", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      inAppCheckbox.checked = data.inAppAlerts ?? false;
    } else {
      inAppCheckbox.checked = false;
    }
  } catch (err) {
    console.error("Error loading preferences:", err);
    alert("❌ Failed to load preferences. Try refreshing.");
  }

  // === Save Notification Preference ===
  saveBtn.addEventListener("click", async () => {
    try {
      await setDoc(doc(db, "user_notifications", user.uid), {
        inAppAlerts: inAppCheckbox.checked
      });
      alert("✅ Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("❌ Failed to save preferences.");
    }
  });

  // === Submit Suggestion ===
  submitBtn.addEventListener("click", async () => {
    const suggestion = suggestionInput.value.trim();

    if (suggestion === "") {
      alert("❗ Please write a suggestion before submitting.");
      return;
    }

    try {
      await addDoc(collection(db, "suggestions"), {
        uid: user.uid,
        email: user.email ?? "Anonymous",
        message: suggestion,
        timestamp: serverTimestamp()
      });

      alert("✅ Suggestion submitted successfully!");
      suggestionInput.value = "";
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      alert("❌ Failed to submit suggestion.");
    }
  });

  // === Load Real-Time Alerts ===
  if (alertsList) {
    const alertsRef = collection(db, "alerts", user.uid, "items");
    const q = query(
      alertsRef,
      where("severity", "==", "HIGH"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    onSnapshot(q, (snapshot) => {
      alertsList.innerHTML = "";
      if (snapshot.empty) {
        alertsList.innerHTML = "<li class='text-gray-500 text-center text-sm'>No high alerts found.</li>";
        return;
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.className = "p-2 border-b text-sm text-gray-800";
        const time = data.timestamp?.toDate().toLocaleString() ?? "Unknown Time";
        li.textContent = `${data.message} — ${time}`;
        alertsList.appendChild(li);
      });
    });
  }
});