import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL4nR_DCsGmQZgB8OIH6EQUO4XcXPdcn8",
  authDomain: "smartclimatemonitorsystem.firebaseapp.com",
  databaseURL: "https://smartclimatemonitorsystem-default-rtdb.firebaseio.com",
  projectId: "smartclimatemonitorsystem",
  storageBucket: "smartclimatemonitorsystem.appspot.com",
  messagingSenderId: "865844912759",
  appId: "1:865844912759:web:31a7e8f24f8379215adc72"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbFS = getFirestore();
const auth = getAuth();

let userThresholds = {
  tempThreshold: 35,
  humidityThreshold: 40,
  soilMoistureThreshold: 400,
  pressureThreshold: 1000,
  lightThreshold: 100,
  bmptempThreshold: 35
};

const sensorRef = ref(db, "/SensorData");
const logRef = ref(db, "/SensorAlerts");

// Load user thresholds from Firestore
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";
  try {
    const settingsDoc = await getDoc(doc(dbFS, "user_settings", user.uid));
    if (settingsDoc.exists()) {
      userThresholds = { ...userThresholds, ...settingsDoc.data() };
    }
  } catch (e) {
    console.warn("Failed to fetch user thresholds", e);
  }
});

// Generate Alerts + Firebase Logging
onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const alerts = [];
  let severity = "good";

  if (data.temperature > userThresholds.tempThreshold) {
    alerts.push(`High Temperature: ${data.temperature}°C`);
    severity = "danger";
  }
  if (data.humidity < userThresholds.humidityThreshold) {
    alerts.push(`Low Humidity: ${data.humidity}%`);
    if (severity !== "danger") severity = "warning";
  }
  if (data.soil < userThresholds.soilMoistureThreshold) {
    alerts.push(`Low Soil Moisture: ${data.soil}%`);
    if (severity !== "danger") severity = "warning";
  }

  if (data.pressure < userThresholds.pressureThreshold) {
    alerts.push(`Low Pressure: ${data.pressure} hPa`);
    if (severity !== "danger") severity = "warning";
  }
  if (data.bmptemp > userThresholds.bmptempThreshold) {
    alerts.push(`High BMP Temp: ${data.bmptemp}°C`);
    if (severity !== "danger") severity = "warning";
  }

  // Log to Firebase
  push(logRef, {
    timestamp: new Date().toLocaleString(),
    alerts: alerts.length ? alerts.join(", ") : "Normal",
    severity: severity
  });
});

// Display Last 3 Logs in History Table
onValue(logRef, (snapshot) => {
  const table = document.getElementById("historyTable");
  table.innerHTML = "";

  const logs = snapshot.val();
  if (!logs) return;

  const sorted = Object.values(logs)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  sorted.forEach(log => {
    const row = document.createElement("tr");
    row.className = log.severity === "danger"
      ? "bg-red-100"
      : log.severity === "warning"
      ? "bg-yellow-100"
      : "bg-green-100";

    row.innerHTML = `
      <td class="px-4 py-2">${log.timestamp}</td>
      <td class="px-4 py-2">${log.alerts}</td>
      <td class="px-4 py-2 capitalize">${log.severity}</td>
    `;
    table.appendChild(row);
  });
});

// Chart Setup with Live Sensor Data
const ctx = document.getElementById("climateChart").getContext("2d");
const chartData = {
  labels: [],
  datasets: [
    {
      label: 'Temperature (°C)',
      data: [],
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.4,
      fill: true,
    },
    {
      label: 'Humidity (%)',
      data: [],
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.4,
      fill: true,
    },
    {
      label: 'Soil Moisture (%)',
      data: [],
      borderColor: 'rgba(255, 206, 86, 1)',
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      tension: 0.4,
      fill: true,
    },
    {
      label: 'BMP Temp (°C)',
      data: [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true,
    },
    {
      label: 'Pressure (hPa)',
      data: [],
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      tension: 0.4,
      fill: true,
    }
  ]
};

const climateChart = new Chart(ctx, {
  type: 'line',
  data: chartData,
  options: {
    responsive: true,
    animation: false,
    scales: {
      x: { title: { display: true, text: 'Time' }},
      y: { title: { display: true, text: 'Sensor Value' }, beginAtZero: false }
    }
  }
});

// Live update chart
onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const timeNow = new Date().toLocaleTimeString();
  const maxPoints = 10;

  chartData.labels.push(timeNow);
  if (chartData.labels.length > maxPoints) chartData.labels.shift();

  chartData.datasets[0].data.push(data.temperature || 0);
  chartData.datasets[1].data.push(data.humidity || 0);
  chartData.datasets[2].data.push(data.soil || 0);
  chartData.datasets[3].data.push(data.bmptemp || 0);
  chartData.datasets[4].data.push(data.pressure || 0);

  chartData.datasets.forEach(ds => {
    if (ds.data.length > maxPoints) ds.data.shift();
  });

  climateChart.update();
});