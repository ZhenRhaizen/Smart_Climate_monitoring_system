import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDL4nR_DCsGmQZgB8OIH6EQUO4XcXPdcn8",
  authDomain: "smartclimatemonitorsystem.firebaseapp.com",
  databaseURL: "https://smartclimatemonitorsystem-default-rtdb.firebaseio.com",
  projectId: "smartclimatemonitorsystem",
  storageBucket: "smartclimatemonitorsystem.appspot.com",
  messagingSenderId: "865844912759",
  appId: "1:865844912759:web:31a7e8f24f8379215adc72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const dbRTDB = getDatabase(app);
const dbFS = getFirestore(app);
const auth = getAuth(app);
const sensorRef = ref(dbRTDB, "/SensorData");

// Thresholds
let userThresholds = {
  tempThreshold: 35,
  humidityThreshold: 80,
  refreshRate: 3
};

// Load Firestore User Settings
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const settingsDoc = await getDoc(doc(dbFS, "user_settings", user.uid));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      userThresholds.tempThreshold = data.tempThreshold ?? 35;
      userThresholds.humidityThreshold = data.humidityThreshold ?? 80;
      userThresholds.refreshRate = data.refreshRate ?? 3;
      console.log("Loaded user thresholds:", userThresholds);
    }
  } catch (err) {
    console.error("Firestore error:", err);
  }
});

// Plugin: Center Value Text in Gauge
Chart.register({
  id: 'centerText',
  beforeDraw(chart) {
    const { width } = chart;
    const ctx = chart.ctx;
    const value = chart.config.data.datasets[0].data[0];
    ctx.save();

    const x = chart.getDatasetMeta(0).data[0].x;
    const y = chart.getDatasetMeta(0).data[0].y + 10;
    ctx.font = `bold ${width * 0.09}px Arial`;
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x, y);
    ctx.restore();
  }
});

// Create Gauge Chart
function createGauge(id, value, max = 100, color = 'green') {
  const ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, max - value],
        backgroundColor: [color, '#e5e7eb'],
        borderWidth: 0,
        cutout: '80%',
        circumference: 180,
        rotation: 270
      }]
    },
    options: {
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        centerText: true
      }
    }
  });
}

// Update Gauge Value
function updateGauge(chart, newVal) {
  const total = chart.data.datasets[0].data[0] + chart.data.datasets[0].data[1];
  chart.data.datasets[0].data[0] = newVal;
  chart.data.datasets[0].data[1] = total - newVal;
  chart.update();
}

// Init Gauges (✅ fixed light max to 100%)
const gauges = {
  temp: createGauge('tempGauge', 0, 100, 'tomato'),
  humid: createGauge('humidGauge', 0, 100, 'dodgerblue'),
  soil: createGauge('soilGauge', 0, 100, 'goldenrod'),
  light: createGauge('lightGauge', 0, 100, 'orange'),
  pressure: createGauge('pressureGauge', 0, 1200, 'crimson')
};

// Firebase Listener for Live Sensor Data
onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  // Update Center Text + Gauges
  updateGauge(gauges.temp, data.temperature ?? 0);
  updateGauge(gauges.humid, data.humidity ?? 0);
  updateGauge(gauges.soil, data.soil ?? 0);
  updateGauge(gauges.light, data.light ?? 0);
  updateGauge(gauges.pressure, data.pressure ?? 0);

  // Rain text
  document.getElementById("rainText").innerText = data.rain ? "🌧️ Yes" : "🌤️ No";

  // Optional card values (if text values exist)
  const setText = (id, val, unit = '') => {
    const el = document.getElementById(id);
    if (el) el.innerText = `${val ?? '--'} ${unit}`;
  };

  setText("temp-value", data.temperature, "°C");
  setText("humid-value", data.humidity, "%");
  setText("soil-value", data.soil, "%");
  setText("light-value", data.light, "%"); // ✅ fixed unit
  setText("pressure-value", data.pressure, "hPa");
  setText("rain-value", data.rain ? "Yes" : "No");

  // Update Notifications
  updateNotifications(data);
});

// Notifications
function updateNotifications(data) {
  const notifList = document.getElementById("sensorNotifications");
  if (!notifList) return;

  notifList.innerHTML = "";
  const addNotif = (msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    notifList.appendChild(li);
  };

  if (data.temperature > userThresholds.tempThreshold) {
    addNotif(`🌡️ High Temperature: ${data.temperature}°C`);
  }
  if (data.humidity > userThresholds.humidityThreshold) {
    addNotif(`💧 High Humidity: ${data.humidity}%`);
  }
  if (data.soil < 40) {
    addNotif(`🌱 Low Soil Moisture: ${data.soil}%`);
  }
  if (data.pressure > 1020) {
    addNotif(`📟 High Pressure: ${data.pressure} hPa`);
  }
  if (data.rain) {
    addNotif("🌧️ Rain detected!");
  }
}