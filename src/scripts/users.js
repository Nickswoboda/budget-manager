const {ipcRenderer, remote} = require('electron')
const prompt = require('electron-prompt')

initDB(updateUsers)

document.getElementById('close-btn').addEventListener('click', () => {
    remote.getCurrentWindow().close()
})

document.getElementById('add-btn').addEventListener('click', () => {
    prompt({
        title: 'Add User',
        label: 'Enter a user name: <br><font size="-2">(Alphabetical letters only)</font>',
        inputAttrs : {
            type: 'text',
            required: true,
            pattern: '[a-zA-Z]{1,}',
        },
        buttonLabels: { ok: 'Submit'},
        type: 'input',
        height: 200,
        width: 400,
        useHtmlLabel: true
    }).then((result)=>{
        if (result){
            checkIfUserExists(result, (exists) => {
                if (exists){
                    ipcRenderer.send('error-popup', `User '${result}' already exists.`)
                } else {
                    insertUser(result)
                    updateUsers()
                }
            })
        }
    })
})

function updateUsers()
{
    var user_table = document.getElementById('user-table')
    while (user_table.rows.length > 0){
        user_table.deleteRow(0)
    }

    getAllUsers((users) => {
        for (let i = 0; i < users.length; ++i){
            let row = user_table.insertRow(i)

            row.insertCell(0).innerHTML = users[i].name
            let del = row.insertCell(1) 
            del.innerHTML = "X"
            del.style.color = "#f44336"
            del.addEventListener('click', ()=>{
                getUserCount((count) =>{
                    if (count > 1){
                        ipcRenderer.send('delete-user-requested', users[i])
                    } else {
                        ipcRenderer.send('error-popup', 'Unable to delete user. You must have at least one user.')
                    }

                })
            })
        }
    })
    ipcRenderer.send('users-updated')
}

ipcRenderer.on('delete-user', (event, user_id) =>{
    deleteUser(user_id)
    updateUsers()
})