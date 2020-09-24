/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
  TouchableOpacity,
} from 'react-native';
import {BleManager, State} from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const bleManager = new BleManager();
const App = () => {
  const [scanning, setScanning] = useState(false);
  const [bluetoohState, setBluetoothState] = useState(undefined);
  const [scannedDevice, setScannedDevice] = useState([]);
  const [rssi, setRssi] = useState([]);
  useEffect(() => {
    bleManager.state().then((v) => {
      if (v === State.PoweredOff) {
        bleManager.enable();
      }

      if (v === State.PoweredOn) {
        setBluetoothState(v);
      }
    });
  }, []);

  useEffect(() => {
    if (rssi.length > 9) {
      console.log(rssi);
      setRssi([]);
    }
  }, [rssi]);

  const handleStartScan = useCallback(() => {
    bleManager.startDeviceScan(null, null, (e, d) => {
      setScanning(true);
      if (e) {
        console.log(e);
        bleManager.stopDeviceScan();
        setScanning(false);
        return;
      }

      if (!d) {
        return;
      }

      setScannedDevice((s) => [
        ...s,
        ...(s.find((v) => v.id === d.id) ? [] : [d]),
      ]);

      if (d.id === 'AC:23:3F:58:A8:CB') {
        setRssi((r) => [...r, d.rssi]);
      }
    });
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                Adapter state: {bluetoohState || 'unknown'}
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Scanned devices:</Text>
              {scannedDevice.map((v) => {
                return (
                  <View>
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.sectionDescription, styles.button]}
                      onPress={() => {
                        bleManager.stopDeviceScan();

                        v.isConnected().then((c) => {
                          if (!c) {
                            console.log('connecting', c);
                            v.connect()
                              .then((device) => {
                                return device.discoverAllServicesAndCharacteristics();
                              })
                              .then((device) => {
                                bleManager
                                  .servicesForDevice(device.id)
                                  .then((s) => {
                                    s.forEach((_s) => {
                                      console.log(
                                        'Service characteristic: ',
                                        _s.uuid,
                                      );

                                      _s.characteristics().then((c) => {
                                        c.forEach((_c) => {
                                          console.log(
                                            '_c.serviceUUID',
                                            _c.serviceUUID,
                                          );
                                          bleManager
                                            .readCharacteristicForDevice(
                                              _c.deviceID,
                                              _c.serviceUUID,
                                              _c.uuid,
                                            )
                                            .then((__c) => {
                                              // console.log(
                                              //   'characteristic',
                                              //   base64.decode(__c.value),
                                              // );

                                              __c.descriptors().then((d) => {
                                                d.forEach((_d) => {
                                                  console.log(_d.value);
                                                });
                                              });
                                            });
                                        });
                                      });
                                      // console.log('Services data', device.serviceData);
                                    });
                                  });
                                // Do work on device with services and characteristics
                              })
                              .catch((error) => {
                                // Handle errors
                              });
                          } else {
                            bleManager.stopDeviceScan();
                          }
                        });
                      }}>
                      <Text>{v.id}</Text>
                    </TouchableOpacity>
                    <View>
                      <Text>{`Name: ${v.name ? v.name : 'unknown'}`}</Text>
                      <Text>
                        {`Connectable: ${
                          v.isConnectable ? v.isConnectable : 'unknown'
                        }`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.sectionContainer}>
              <Button
                onPress={handleStartScan}
                title="Start Scan"
                disabled={scanning}
              />
              <Button
                onPress={() => {
                  bleManager.stopDeviceScan();
                  setScanning(false);
                  setScannedDevice([]);
                }}
                title="Stop Scan"
                disabled={!scanning}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  button: {
    margin: 10,
    padding: 10,
    backgroundColor: Colors.light,
  },
});

export default App;
