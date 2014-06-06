var tessel = require('tessel');
var bleLib = require('ble-ble113a');
var accelLib = require('accel-mma84');

var ble;
var accel;

// Connect to the modules
ble = bleLib.use(tessel.port['A'], function (err){
  accel = accelLib.use(tessel.port['B'], function (err) {
    // This data tells scanning devices that this device
    // is generally discoverable and does not support BR/EDR
    // 0x01 : [ 0x06 ]
    // as well as its full name 'tesselerometer'
    // 0x09 : [ 0x74, 0x65, 0x73, 0x73, 0x65, 0x6c, 0x65, 0x72, 0x6f, 0x6d, 0x65, 0x74, 0x65, 0x72 ]
    var adv_data = [0x02,0x01,0x06, 0x0F, 0x09, 0x74, 0x65, 0x73, 0x73, 0x65, 0x6c, 0x65, 0x72, 0x6f, 0x6d, 0x65, 0x74, 0x65, 0x72];
    ble.setAdvertisingData(adv_data, function(){
      ble.startAdvertising();
    });
  });
});

// When a master device connects
ble.on('connect', function (master) {
  console.log('Connected');
  // Start logging accelerometer data
  accel.on('data', writeAccelData);
});

// When the master disconnects, start advertising again
ble.on('disconnect', function(connection, reason){
  console.log('Disconnected', reason);
  accel.removeListener('data', writeAccelData);
  ble.startAdvertising();
});

// When advertising starts
ble.on('startAdvertising', function(){
  console.log('Advertising started');
  // Log the address being advertised
  ble.getBluetoothAddress(function(err, addr) {
    if (!err){
      console.log('BLE address', addr);
    }
  });
});

function writeAccelData(accelData) {
  // Put our accelerometer data into a buffer
  var dataBuf = new Buffer(12);
  dataBuf.writeFloatLE(accelData[0], 0);
  dataBuf.writeFloatLE(accelData[1], 4);
  dataBuf.writeFloatLE(accelData[2], 8);
  // Write that buffer into the attribute database
  // For remote access
  ble.writeLocalValue(0, dataBuf, function(err){
    err && console.log(err);
  });
};
