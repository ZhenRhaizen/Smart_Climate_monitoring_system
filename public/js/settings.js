    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
    import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
    const db = getFirestore(app);

    const form = document.getElementById("settings-form");

    function setFormValues(data) {
      form["refreshRate"].value = data.refreshRate ?? 3;
      form["tempThreshold"].value = data.tempThreshold ?? 35;
      form["humidityThreshold"].value = data.humidityThreshold ?? 50;
      form["soilMoistureThreshold"].value = data.soilMoistureThreshold ?? 500;
      form["lightThreshold"].value = data.lightThreshold ?? 300;
      form["pressureThreshold"].value = data.pressureThreshold ?? 1000;
    }

    setFormValues({});

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "index.html";
        return;
      }
      try {
        const settingsRef = doc(db, "user_settings", user.uid);
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          setFormValues(docSnap.data());
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;

      const payload = {
        refreshRate: parseInt(form["refreshRate"].value),
        tempThreshold: parseFloat(form["tempThreshold"].value),
        humidityThreshold: parseFloat(form["humidityThreshold"].value),
        soilMoistureThreshold: parseInt(form["soilMoistureThreshold"].value),
        lightThreshold: parseInt(form["lightThreshold"].value),
        pressureThreshold: parseInt(form["pressureThreshold"].value),
      };

      try {
        await setDoc(doc(db, "user_settings", user.uid), payload);
        alert("✅ Settings saved successfully.");
      } catch (err) {
        console.error("❌ Error saving settings:", err);
        alert("❌ Failed to save settings.");
      }
    })