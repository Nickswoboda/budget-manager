const { assert } = require('console')
const {app, BrowserWindow, ipcMain } = require('electron')

let win = null

function createWindow(){
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    win.loadFile('src/index.html')
    win.on('close', () => { app.quit()})
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0){
        createWindow()
    }
})

function createEntryWindow()
{
    let popup = new BrowserWindow({
        width: 500,
        height: 500,
        frame: false,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
    popup.on('close', () => {
        popup = null
    })
    popup.loadFile('src/add-entry.html')
    popup.webContents.openDevTools()

    return popup
}
ipcMain.on('add-entry-clicked', (event, is_expense) => {
    let popup = createEntryWindow()
    popup.once('ready-to-show', () =>{
        popup.show()
        popup.webContents.send('set_is_expense', is_expense)
    })

})
ipcMain.on('edit-entry-clicked', (event, entry, index) => {
    let popup = createEntryWindow()
    popup.once('ready-to-show', () =>{
        popup.show()
        popup.webContents.send('setEntryData', entry, index)
    })

})

ipcMain.on('entry-added', (event, entry) =>{
    win.webContents.send('addEntry', entry)
})

ipcMain.on('entry-edited', (event, entry, index ) =>{
    win.webContents.send('update-entries', entry, index)
})

ipcMain.on('entry-deleted', (event, index ) =>{
    win.webContents.send('deleteEntry', index)
})