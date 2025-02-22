const {app, BrowserWindow, ipcMain, dialog, Menu, Notification} = require('electron')
const settings = require('./scripts/settings.js')

let main_win = null
let entry_win = null
let settings_win = null
let user_win = null
let budget_win = null

settings.init()

function createBrowser(title, width, height, is_modal)
{
    return new BrowserWindow({
        title: title,
        width: width,
        height: height,
        modal: is_modal,
        parent: is_modal ? main_win : null,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        },
        //only show X button to close if popup
        minimizable: !is_modal,
        maximizable: !is_modal,
        fullscreenable: !is_modal,
        resizable: !is_modal
    })
}

function createMainWindow(){
    
    main_win = createBrowser('Budget Manager', 1600, 900, false)
    main_win.loadFile('src/views/index.html')
    main_win.on('close', (event) => { 
        main_win = null
        app.quit()
    })

    main_win.setMenu(Menu.buildFromTemplate([
       {
           label: "File",
           submenu: [
               {
                   label: 'Edit Users', click() {
                        createEditUserWindow()
                   }
               },
               {
                   label: 'Edit Budgets', click() {
                       createBudgetWindow()
                   }
               },
               {type: 'separator'},
               {
                   label: 'Settings', click() {
                       createSettingsWindow()
                   }
               },
               {type: 'separator'},
               {
                   label: 'Quit', click(){
                       app.quit()
                   }
               }
           ]
       } 
    ]))

    //main_win.webContents.openDevTools()
}

app.whenReady().then(() => {
    //hidden arg will be present if started automatically at launch
    if (process.argv[1] === '--hidden'){
        settings.getSetting('last-entry-time', (time) => {
            if (time){
                let elapsed = Date.now() - time;
                settings.getSetting('reminder-days', (days) => {
                    let days_in_ms = days * 1000 * 60 * 60 * 24
                    if (elapsed >= days_in_ms){
                        console.log("time to notify")
                        let opts =  {
                            title: 'It\'s been a while',
                            body: `It\'s been over ${days} days since you have last updated your budget. Click to open up Budget Manager`
                        }
                        var notification = new Notification(opts)
                        notification.show()
                        notification.on('click', createMainWindow)
                        notification.on('close', () => {app.quit()})
                    } else {
                        app.quit()
                    }
                })
            } else {
                app.quit()
            }
        })
    }
    else{
        createMainWindow()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0){
        createMainWindow()
    }
})

function createEntryWindow(is_expense, entry)
{
    entry_win = createBrowser('Entry', 300, 300, true)
    entry_win.removeMenu()
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
    settings_win = createBrowser('Settings', 220, 180, true)
    settings_win.removeMenu()
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
function createEditUserWindow()
{
    user_win = createBrowser('Users', 300, 250, true)
    user_win.removeMenu()
    user_win.on('close', () => {
        user_win = null
    })
    user_win.loadFile('src/views/users.html')
    user_win.once('ready-to-show', () =>{
        user_win.show()
    })
    //user_win.webContents.openDevTools()
}

function createBudgetWindow()
{
    budget_win = createBrowser('Budgets', 300, 500, true)
    budget_win.removeMenu()
    budget_win.on('close', () => {
        budget_win = null
    })
    budget_win.loadFile('src/views/budgets.html')
    budget_win.once('ready-to-show', () =>{
        budget_win.show()
    })
    //budget_win.webContents.openDevTools()
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
    settings.setSetting('last-entry-time', Date.now())
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

ipcMain.on('error-popup', (event, error) => {
    const options = {
        type: 'error',
        title: 'Error',
        message: error
    }

    dialog.showMessageBox(options);
})

ipcMain.on('delete-user-requested', (event, user ) =>{
    const options = {
        type: 'info',
        title: 'Confirmation',
        message: `Are you sure you want to delete ${user.name}? All entries associated with the user will be deleted.`,
        buttons: ['Yes', 'No']
    }
    dialog.showMessageBox(options).then(result => {
        if (result.response === 0){
            user_win.webContents.send('delete-user', user.id)
        }
    })
})

ipcMain.on('users-updated', (event) =>{
    main_win.webContents.send('users-updated')
})