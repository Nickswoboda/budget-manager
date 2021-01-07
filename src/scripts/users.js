const {ipcRenderer, remote} = require('electron')

initDB()
document.getElementById('close-btn').addEventListener('click', () => {
    remote.getCurrentWindow().close()
})

let add_btn = document.getElementById('add-btn')
let add_user_div = document.getElementById('add-user-div')
let user_input = document.getElementById('user-name-input')

add_btn.addEventListener('click', () => {
    showUserNameInput(true)
})

document.getElementById('submit-btn').addEventListener('click', () => {
    if (user_input.value !== ""){
        insertUser(user_input.value)
        showUserNameInput(false)
        getAllUsers(updateUsers)
    }
})

document.getElementById('cancel-btn').addEventListener('click', () => {
    showUserNameInput(false)
})

function showUserNameInput(show)
{
    if (show){
        add_user_div.style.display = 'inline'
        add_btn.style.display = 'none'
    } else {
        add_user_div.style.display = 'none'
        add_btn.style.display = 'inline'
    }
    user_input.value = ''
}


function updateUsers(users)
{
    var user_table = document.getElementById('user-table')
    while (user_table.rows.length > 0){
        user_table.deleteRow(0)
    }

    for (let i = 0; i < users.length; ++i){
        let row = user_table.insertRow(i)

        row.insertCell(0).innerHTML = users[i].name
        row.insertCell(1).innerHTML = "      "
        let del = row.insertCell(2) 
        del.innerHTML = "X"
        del.addEventListener('click', ()=>{
            ipcRenderer.send('delete-user-requested', users[i])
        })
    }

    ipcRenderer.send('users-updated')
}

getAllUsers(updateUsers)
ipcRenderer.on('delete-user', (event, user_id) =>{
    deleteUser(user_id)
    getAllUsers(updateUsers)
})