let API, Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')

module.exports = function (homebridge) {
  API = homebridge;
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-http-esp8266-battery', 'esp8266Battery', esp8266Battery)
}

function esp8266Battery (log, config) {
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

esp8266Battery.prototype = {

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
        this.log.warn('Device response: %s', responseBody)
        try {
          const json = JSON.parse(responseBody)
          var batteryString = ""
          var currentTemp = ""
          var humidity = ""
          var sketchVer = ""
   
          batteryString = (parseInt(json.RemainingBytes) / parseInt(json.TotalBytes) ) * 100
          currentTemp = parseInt(json.temperature)
          humidity = parseInt(json.humidity)
          sketchVer = json.SketchVersion

          this.BatteryLevel = batteryString
          this.log.warn('currentTemp : %s', currentTemp)
          this.CurrentTemperature = (currentTemp - 32) * 5/9 
          this.Humidity = humidity
          this.SketchVer = sketchVer

          this.BatteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.BatteryLevel)
          this.TemperatureSensor.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.CurrentTemperature);
          this.HumiditySensor.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(this.Humidity);
          this.informationService.getCharacteristic(Characteristic.SerialNumber).updateValue(this.SketchVer);
          this.informationService.getCharacteristic(Characteristic.SoftwareRevision).updateValue(this.SketchVer);

          if(this.BatteryLevel <= 50) {
            this.BatteryService.setCharacteristic(Characteristic.StatusLowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
          }
          else {
            this.BatteryService.setCharacteristic(Characteristic.StatusLowBattery, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
          }

          this.log.warn('Updated BatteryLevel to: %s', this.BatteryLevel)
          this.log.warn('Updated Temperature to: %s', this.CurrentTemperature)
          this.log.warn('Updated HumidityLevel to: %s', this.Humidity)
          this.log.warn('Updated SoftwareRevision to: %s', this.SketchVer)

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

    // Humidity Sensor service
    this.HumiditySensor = new Service.HumiditySensor(this.name);

    // Battery service
    this.BatteryService = new Service.BatteryService(this.name);
    
    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.BatteryService, this.TemperatureSensor, this.HumiditySensor]
  }
}
