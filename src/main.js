const { assert } = require('console')
const {app, BrowserWindow, ipcMain, dialog } = require('electron')

let win = null
let popup = null

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
    popup = new BrowserWindow({
        width: 300,
        height: 500,
        frame: false,
        parent: win,
        modal: true,
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

    //popup.webContents.openDevTools()
}
ipcMain.on('add-entry-clicked', (event, is_expense) => {
    createEntryWindow(is_expense, null)
})
ipcMain.on('edit-entry-clicked', (event, entry) => {
    createEntryWindow(entry.is_expense, entry)
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

ipcMain.on('delete-entry-requested', (event, entry_index ) =>{
    const options = {
        type: 'info',
        title: 'Confirmation',
        message: "Are you sure you want to delete the entry?",
        buttons: ['Yes', 'No']
    }
    dialog.showMessageBox(options).then(result => {
        if (result.response === 0){
            win.webContents.send('deleteEntry', entry_index)
            popup.close()
        }
    })

})