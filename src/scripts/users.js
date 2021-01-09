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
    if (isValidUserName()){
        insertUser(user_input.value)
        showUserNameInput(false)
        updateUsers()
    } else {
        ipcRenderer.send('error-popup', 'User names may only have alphabet characters.')
    }
})

document.getElementById('cancel-btn').addEventListener('click', () => {
    showUserNameInput(false)
})

function isValidUserName()
{
    let name = user_input.value
    let regex =/^([a-zA-Z]{1,})$/

    return regex.test(name)
}
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
            row.insertCell(1).innerHTML = "      "
            let del = row.insertCell(2) 
            del.innerHTML = "X"
            del.addEventListener('click', ()=>{
                ipcRenderer.send('delete-user-requested', users[i])
            })
        }
    })
    ipcRenderer.send('users-updated')
}

updateUsers()
ipcRenderer.on('delete-user', (event, user_id) =>{
    deleteUser(user_id)
    updateUsers()
})