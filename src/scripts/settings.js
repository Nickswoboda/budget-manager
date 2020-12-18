const storage = require('electron-json-storage')
const AutoLaunch = require('auto-launch')

function set_autolaunch(autolaunch)
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

function set_setting(setting, value){
    storage.set(setting, value, (error)=>{
        if (error){
            console.log(error)
        }
    })
}

function apply_settings(){
    storage.get('launch-at-start', (error, value) =>{
        if (error){
            console.log(error);
        } else {
            set_autolaunch(value)
            console.log(value)
        }
    })
}

exports.set_setting = set_setting;
exports.apply_settings = apply_settings;