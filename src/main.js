const {app, BrowserWindow, ipcMain, dialog, Tray, Menu} = require('electron')
const settings = require('./scripts/settings.js')

settings.set_setting('launch-at-start', false)
settings.apply_settings()
let main_win = null
let entry_win = null
let tray = null
let quit = false;

function sendToTray()
{
    main_win.hide()
    tray = new Tray('assets/icon.png')
    tray.on('right-click', () => {
        tray.popUpContextMenu()
        console.log("clicked")
    })
    tray.setContextMenu(Menu.buildFromTemplate([
        {
          label: 'Show App', click: () => {
            main_win.show();
            tray = null;
          }
        },
        {
          label: 'Quit', click: () => {
            quit = true;
            tray = null
            app.quit();
          }
        }
      ]));
}
function createMainWindow(){
    
    main_win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    main_win.loadFile('src/views/index.html')
    main_win.on('close', (event) => { 
        if (!quit){
            event.preventDefault()
            sendToTray()
            event.returnValue = false
        } else{
        }
    })
}

app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('before-quit', () =>{
    quit = true
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0){
        createMainWindow()
    }
})

function createEntryWindow(is_expense, entry)
{
    entry_win = new BrowserWindow({
        width: 300,
        height: 500,
        frame: false,
        parent: main_win,
        modal: true,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
    entry_win.on('close', () => {
        entry_win = null
    })
    entry_win.loadFile('src/add-entry.html')
    entry_win.once('ready-to-show', () =>{
        entry_win.show()
        entry_win.webContents.send('initialize-popup', is_expense, entry)
    })

    //entry_win.webContents.openDevTools()
}

ipcMain.on('add-entry-clicked', (event, is_expense) => {
    createEntryWindow(is_expense, null)
})
ipcMain.on('edit-entry-clicked', (event, entry) => {
    createEntryWindow(entry.amount < 0, entry)
})

ipcMain.on('entry-submitted', (event, data) =>
{
    if (data.id === -1){
        main_win.webContents.send('addEntry', data)
    }
    else{
        main_win.webContents.send('update-entries', data)
    }
})

ipcMain.on('delete-entry-requested', (event, entry_index ) =>{
    const options = {
        type: 'info',
        title: 'Confirmation',
        message: "Are you sure you want to delete the entry?",
        buttons: ['Yes', 'No']
    }
    dialog.showMessageBox(options).then(result => {
        if (result.response === 0){
            main_win.webContents.send('deleteEntry', entry_index)
            entry_win.close()
        }
    })

})


ipcMain.on('invalid-entry-input', (event, error) => {
    const options = {
        type: 'error',
        title: 'Invalid Input',
        message: error
    }

    dialog.showMessageBox(options);
})