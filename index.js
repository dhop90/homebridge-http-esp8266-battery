let API, Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')

module.exports = function (homebridge) {
  API = homebridge;
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-http-esp8266-battery', 'iPesp8266Battery', iPesp8266Battery)
}

function iPesp8266Battery (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300

  this.manufacturer = config.manufacturer || packageJson.author
  this.serial = config.serial || packageJson.version
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.timeout = config.timeout || 3000

  this.CurrentTemperature = null;
  this.BatteryLevel = null;
}

iPesp8266Battery.prototype = {

  identify: function (callback) {
    this.log('Identify.')
    callback()
  },

  _httpRequest: function (url, callback) {
    request({
      url: url,
      body: null,
      method: 'GET',
      timeout: this.timeout
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    const url = this.apiroute + '/device'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.TemperatureSensor.getCharacteristic(Characteristic.CurrentTemperature).updateValue(new Error('Polling failed'))
        this.BatteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        try {
          const json = JSON.parse(responseBody)
          var batteryString = ""
          batteryString = json.battery
          this.BatteryLevel = batteryString.replace(" %", "")
          this.CurrentTemperature = this.BatteryLevel 

          this.BatteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.BatteryLevel)
          this.TemperatureSensor.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.CurrentTemperature);
          if(this.BatteryLevel <= 10) {
            this.BatteryService.setCharacteristic(Characteristic.StatusLowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
          }
          else {
            this.BatteryService.setCharacteristic(Characteristic.StatusLowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
          }

          this.log.debug('Updated BatteryLevel to: %s', this.BatteryLevel)
          callback()
        } catch (e) {
          this.log.warn('Error parsing status: %s', e.message)
        }
      }
    }.bind(this))
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    // Temperature Sensor service
    this.TemperatureSensor = new Service.TemperatureSensor(this.name);

    // Battery service
    this.BatteryService = new Service.BatteryService(this.name);
    
    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.BatteryService, this.TemperatureSensor]
  }
}
