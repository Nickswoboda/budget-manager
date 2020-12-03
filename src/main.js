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

function createEntryWindow(is_expense, entry)
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
    popup.once('ready-to-show', () =>{
        popup.show()
        popup.webContents.send('initialize-popup', is_expense, entry)
    })

    popup.webContents.openDevTools()

    return popup
}
ipcMain.on('add-entry-clicked', (event, is_expense) => {
    createEntryWindow(is_expense, null)
})
ipcMain.on('edit-entry-clicked', (event, entry) => {
    createEntryWindow(entry.amount < 0, entry)
})

ipcMain.on('entry-submitted', (event, data) =>
{
    if (data.index === -1){
        win.webContents.send('addEntry', data)
    }
    else{
        win.webContents.send('update-entries', data)
    }
})

ipcMain.on('entry-deleted', (event, index ) =>{
    win.webContents.send('deleteEntry', index)
})