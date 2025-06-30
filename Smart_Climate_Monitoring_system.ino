#include <ESP8266WiFi.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_BMP085.h>
#include <FirebaseESP8266.h>  // Legacy Firebase library

// === Firebase Config ===
#define FIREBASE_HOST "smartclimatemonitorsystem-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "0VTxhzdQ5Qy6QEHRh8ct8ZawIKlA6Q9R1Tp7jgrz"
#define FIREBASE_PATH "/SensorData"

// === WiFi Credentials ===
const char* ssid = "nubia V70 Design";
const char* password = "zhen12345";

IPAddress local_IP(192, 168, 224, 200);      // Choose a free IP in your subnet
IPAddress gateway(192, 168, 224, 94);        // Match your actual gateway
IPAddress subnet(255, 255, 255, 0);          // Correct subnet
IPAddress primaryDNS(8, 8, 8, 8);
IPAddress secondaryDNS(8, 8, 4, 4);


// === Sensor Pins ===
#define DHTPIN D2
#define DHTTYPE DHT22
#define SOIL_PIN A0
#define RAIN_PIN D1
#define I2C_SDA D3
#define I2C_SCL D4
#define LDR_PIN D7

// === Sensor and Firebase Objects ===
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP085 bmp;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool bmpOK = false;
unsigned long lastSend = 0;
const unsigned long sendInterval = 2000;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // === Init Sensors ===
  dht.begin();
  Wire.begin(I2C_SDA, I2C_SCL);
  bmpOK = bmp.begin();

  pinMode(SOIL_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);

  // === WiFi Static Config ===
  WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS);
  WiFi.begin(ssid, password);
  Serial.print("🔌 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected");
  Serial.print("🌐 IP Address: ");
  Serial.println(WiFi.localIP());

  // === Firebase Setup ===
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("🔥 Firebase initialized");
}

void loop() {
  if (millis() - lastSend >= sendInterval) {
    lastSend = millis();
    sendSensorDataToFirebase();
  }
}

void sendSensorDataToFirebase() {
  // === Sensor Readings ===
  float temp = dht.readTemperature();
  float humid = dht.readHumidity();

  if (isnan(temp) || isnan(humid)) {
    Serial.println("⚠️ DHT22 reading failed! Skipping this cycle.");
    return;
  }

  int soilRaw = analogRead(SOIL_PIN);
  int rain = digitalRead(RAIN_PIN);
  int ldr = digitalRead(LDR_PIN);

  int soil = map(soilRaw, 1023, 0, 0, 100);  // 0 = dry, 100 = wet
  bool isRaining = rain == LOW;             // LOW means rain detected
  int light = (ldr == HIGH) ? 100 : 0;      // HIGH = bright, LOW = dark

  float bmpTemp = 0;
  int pressure = 1013;
  if (bmpOK) {
    bmpTemp = bmp.readTemperature();
    pressure = bmp.readPressure() / 100;
    if (isnan(bmpTemp)) {
      bmpTemp = 0;  // fallback value
      Serial.println("⚠️ BMP180 temperature read failed!");
    }
  } else {
    Serial.println("⚠️ BMP180 not detected.");
  }

  // === Firebase Upload with Logging ===
  bool ok = true;

  ok &= Firebase.setFloat(fbdo, FIREBASE_PATH "/temperature", temp);
  logResult("🌡️ Temp", temp, fbdo);

  ok &= Firebase.setFloat(fbdo, FIREBASE_PATH "/humidity", humid);
  logResult("💧 Humidity", humid, fbdo);

  ok &= Firebase.setInt(fbdo, FIREBASE_PATH "/soil", soil);
  logResult("🌱 Soil", soil, fbdo);

  ok &= Firebase.setBool(fbdo, FIREBASE_PATH "/rain", isRaining);
  logResult("🌧️ Rain", isRaining, fbdo);

  ok &= Firebase.setInt(fbdo, FIREBASE_PATH "/light", light);
  logResult("💡 Light", light, fbdo);

  ok &= Firebase.setFloat(fbdo, FIREBASE_PATH "/bmptemp", bmpTemp);
  logResult("🌡️ BMP Temp", bmpTemp, fbdo);

  ok &= Firebase.setInt(fbdo, FIREBASE_PATH "/pressure", pressure);
  logResult("🧭 Pressure", pressure, fbdo);

  if (ok) {
    Serial.println("✅ All data sent successfully!\n");
  } else {
    Serial.println("⚠️ Some data failed to send.\n");
  }
}

void logResult(const char* label, float value, FirebaseData& fb) {
  if (fb.httpCode() == 200) {
    Serial.printf("✅ %s: %.2f\n", label, value);
  } else {
    Serial.printf("❌ %s Error: %s\n", label, fb.errorReason().c_str());
  }
}

void logResult(const char* label, int value, FirebaseData& fb) {
  if (fb.httpCode() == 200) {
    Serial.printf("✅ %s: %d\n", label, value);
  } else {
    Serial.printf("❌ %s Error: %s\n", label, fb.errorReason().c_str());
  }
}

void logResult(const char* label, bool value, FirebaseData& fb) {
  if (fb.httpCode() == 200) {
    Serial.printf("✅ %s: %s\n", label, value ? "true" : "false");
  } else {
    Serial.printf("❌ %s Error: %s\n", label, fb.errorReason().c_str());
  }
}