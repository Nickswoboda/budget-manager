const storage = require('electron-json-storage')
const AutoLaunch = require('auto-launch')

function setAutolaunch(autolaunch)
{
    var auto_launcher = new AutoLaunch({
        name: 'Budget Manager',
        isHidden: true
    })

    auto_launcher.isEnabled().then((isEnabled) => {
        if (!isEnabled && autolaunch){
            auto_launcher.enable()
        }
        else if (isEnabled && !autolaunch){
            auto_launcher.disable()
        }
    })
}
function getSetting(setting, callback)
{
    storage.get(setting, (error, data) =>{
        if (error){
            console.log(error)
        }
       callback(data) 
    })
}

function setSetting(setting, value, callback){
    storage.set(setting, value, (error)=>{
        if (error){
            console.log(error)
        }
        if (callback){
            callback()
        }
    })
}

function applySettings(){
    getSetting('launch-at-start', (value) =>{
        setAutolaunch(value)
    })
}

function init()
{
    storage.has('launch-at-start', (error, hasKey) => {
        if (!hasKey){
            setSetting('launch-at-start', false)
        }
    })
    storage.has('enable-reminder', (error, hasKey) => {
        if (!hasKey){
            setSetting('enable-reminder', false)
        }
    })
    storage.has('reminder-days', (error, hasKey) => {
        if (!hasKey){
            setSetting('reminder-days', 3)
        }
    })
    applySettings()
}

exports.setSetting = setSetting;
exports.getSetting = getSetting;
exports.applySettings = applySettings;
exports.init = init