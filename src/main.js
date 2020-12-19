const {app, BrowserWindow, ipcMain, dialog, Tray, Menu} = require('electron')
const settings = require('./scripts/settings.js')

settings.init()

let main_win = null
let entry_win = null
let settings_win = null
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

function createBrowser(width, height, has_frame, is_modal)
{
    return new BrowserWindow({
        width: width,
        height: height,
        frame: has_frame,
        modal: is_modal,
        parent: is_modal ? main_win : null,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
}
function createMainWindow(){
    
    main_win = createBrowser(800, 600, true, false)
    main_win.loadFile('src/views/index.html')
    main_win.on('close', (event) => { 
        if (!quit){
            event.preventDefault()
            sendToTray()
            event.returnValue = false
        } else{
        }
    })

    main_win.setMenu(Menu.buildFromTemplate([
       {
           label: "File",
           submenu: [
               {
                   label: 'Settings', click() {
                       createSettingsWindow()
                   }
               },
               {
                   label: 'Quit', click(){
                       app.quit()
                   }
               }
           ]
       } 
    ]))
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
    entry_win = createBrowser(300, 500, false, true)
    entry_win.on('close', () => {
        entry_win = null
    })
    entry_win.loadFile('src/views/add-entry.html')
    entry_win.once('ready-to-show', () =>{
        entry_win.show()
        entry_win.webContents.send('initialize-popup', is_expense, entry)
    })

    //entry_win.webContents.openDevTools()
}

function createSettingsWindow()
{
    settings_win = createBrowser(300, 500, false, true)
    settings_win.on('close', () => {
        settings_win = null
    })
    settings_win.loadFile('src/views/settings.html')
    settings_win.once('ready-to-show', () =>{
        settings_win.show()
        settings_win.webContents.send('initialize-settings')
    })
    //settings_win.webContents.openDevTools()
}

ipcMain.on('add-entry-clicked', (event, is_expense) => {
    createEntryWindow(is_expense, null)
})
ipcMain.on('edit-entry-clicked', (event, entry) => {
    createEntryWindow(entry.amount < 0, entry)
})

ipcMain.on('entry-submitted', (event, data) =>
{
    main_win.webContents.send(data.id === -1 ? 'addEntry' : 'update-entries', data)
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