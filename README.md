<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-http-ipcamera-battery

</span>

## Description

This [homebridge](https://github.com/homebridge/homebridge) plugin exposes a web-based battery status to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin displays the battery status of [iPCamera - High-End NetworkCam (iOS App)](https://apps.apple.com/us/app/ipcamera-high-end-networkcam/id570912928).

I need some automation when the battery is at certain percentage, I want to switch on the iPhone charger. Too bad we can't do automation with BatteryService, but we can with TemperaturService. That is why I displayed the battery level in degress.

I modified the codes I found [here](https://github.com/phenotypic/homebridge-http-thermometer). Thanks phenotypic.

## Installation

1. Install [homebridge](https://github.com/homebridge/homebridge#installation)
2. Install this plugin: `npm install -g homebridge-http-ipcamera-battery`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "iPCameraBattery",
       "name": "iPCameraBattery",
       "apiroute": "http://192.168.0.229",
       "pollInterval": 300,   //default (optional)
       "timeout": 3000        //default (optional)
     }
]
```

### Config
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be accessory | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |

