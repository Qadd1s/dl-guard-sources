#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <NfcAdapter.h>
  
PN532_I2C pn532i2c(Wire);
PN532 nfc(pn532i2c);
  
void setup(void) {
  Serial.begin(115200);

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  nfc.setPassiveActivationRetries(0xFF);
  
  nfc.SAMConfig();
}

void loop(void) {
  boolean success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, &uid[0], &uidLength);
  
  if (success) {
    String hex_value = "";
    for (uint8_t i=0; i < uidLength; i++) 
    {
      //Serial.print(" 0x");Serial.print(uid[i], HEX);       
      Serial.print(" ");Serial.print(uid[i], HEX);       
      hex_value += (String)uid[i];
    }

    //Serial.println(", value="+hex_value);
    Serial.println("");
    // Wait 1 second before continuing
    delay(1000);
  }
}
