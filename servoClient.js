var tessel = require('tessel');
var bleLib = require('ble-ble113a');
var servoLib = require('servo-pca9685');

var ble = bleLib.use(tessel.port['A']);
var servo = servoLib.use(tessel.port['D']);

var servo_ind = 1;

var accel_uuid = '883f1e6b76f64da187eb6bdbdb617888';
var accel_handle = 21;

ble.on('ready', function(){

  // When a BLE device is discovered
  ble.on('discover', function (peripheral) {
    console.log('Found peripheral', peripheral.address._str);
    peripheral.advertisingData.forEach(function (data) {
      // We are looking for a device called 'tesselerometer'
      if (data.typeFlag == 9 && data.data == 'tesselerometer') {
        console.log('Tesselerometer found', peripheral);
        onTesselerometerFound(peripheral);
      }
    });

  });

  ble.on('notification', function(chr, value){
    // value is the data being read from the remote device
    // Make sure this data is associated with the correct handle
    if (chr.handle == accel_handle){
      var y = value.readFloatLE(4);
      var z = value.readFloatLE(8);
      console.log([x, y, z]);
      // Use Y and Z values to determine position to turn Servo to
      var position = .5*(1+((-y/(Math.abs(y))) *(0.97-z)));
      position > 1 ? position = 1 : position < 0 ? position = 0 : null;
      servo.move(servo_ind, position);
    }
  });

  // Tell us when we have started scanning for devices
  ble.on('scanStart', function(){
    console.log('Scanning started');
  });

  // Tell us when we have stopped scanning for devices
  ble.on('scanStop', function(){
    console.log('Scanning stopped');
  });

  // Show us the address of the device we have just connected to
  ble.on('connect', function(peripheral){
    console.log('Device connected', peripheral.address._str);
  });

  // Let us know when a connection has been lost
  ble.on('disconnect', function(peripheral, reason){
    console.log('Device disconnected', peripheral.address._str);
    console.log(reason);
    ble.startScanning(); // Start scanning for other devices
  });

  // In case something goes wrong, we want to know
  ble.on('error', function(err){
    console.log('Error', err);
  });

  // Start looking for BLE devices
  ble.startScanning();

});

// Search the stored characteristic objects for one with a matching handle
function findCharacteristicByHandle(characteristics, handle) {
  var ret = null;
  characteristics.forEach(function(ch){
    if (ch.handle = handle) {
      ret = ch;
    }
  });
  return ret;
}

// To be called once we have found a 'tesselerometer' device
function onTesselerometerFound(peripheral) {
  ble.stopScanning(function(err) {
    peripheral.connect(function(err){
      console.log('Checking for accelerometer data attribute...');
      // Ask the remote device for characteristics with the appropriate UUID
      peripheral.discoverCharacteristics([accel_uuid], function(err, characteristics){
        // Make sure the characteristic we found uses the correct handle
        var trans0 = findCharacteristicByHandle(characteristics, accel_handle);
        if (trans0) {
          console.log('Attribute found');
          // Tell the remote device we want to know when new data is available
          ble.startNotifications(trans0);
        }        
      });
    });
  });
}