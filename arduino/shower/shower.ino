/* Water Token System — UNO R3, 10k linear potentiometer.
 * Outer terminals -> 5V and GND; centre (wiper) -> A0.
 * USB protocol, 115200 baud: STATE,<raw 0..1023>,<open 0|1>\n
 * Browser owns shower timing and WT accounting.
 */
const byte POT_PIN = A0;
const int START_THRESHOLD = 800;  // >800 starts (about 78% of travel)
const int STOP_THRESHOLD = 760;   // <760 stops; hysteresis prevents chatter
const unsigned long SAMPLE_MS = 10;
const unsigned long REPORT_MS = 250;
const unsigned long STABLE_MS = 80;

bool valveOpen = false;
bool candidate = false;
unsigned long candidateSince = 0;
unsigned long lastSample = 0;
unsigned long lastReport = 0;
int reading = 0;

void sendState() {
  Serial.print(F("STATE,"));
  Serial.print(reading);
  Serial.print(',');
  Serial.println(valveOpen ? 1 : 0);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(POT_PIN, INPUT);
  reading = analogRead(POT_PIN);
  // Starts closed. A high reading must remain stable before opening.
  sendState();
}

void loop() {
  const unsigned long now = millis();
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;
    // Average four samples to reduce ADC noise.
    long total = 0;
    for (byte i = 0; i < 4; i++) total += analogRead(POT_PIN);
    reading = total / 4;
    bool desired = valveOpen;
    if (!valveOpen && reading > START_THRESHOLD) desired = true;
    if (valveOpen && reading < STOP_THRESHOLD) desired = false;
    if (desired != candidate) {
      candidate = desired;
      candidateSince = now;
    }
    if (candidate != valveOpen && now - candidateSince >= STABLE_MS) {
      valveOpen = candidate;
      digitalWrite(LED_BUILTIN, valveOpen ? HIGH : LOW);
      sendState(); // Send transitions immediately.
      lastReport = now;
    }
  }
  if (now - lastReport >= REPORT_MS) {
    lastReport = now;
    sendState(); // Heartbeat also synchronizes a newly connected page.
  }
}
