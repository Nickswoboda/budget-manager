const {ipcRenderer, remote} = require('electron')

var expense = true
var entry_index = -1

function isValidInput()
{
    let date = document.getElementById('date-input').valueAsDate
    let year = date.getFullYear()
    if (year < 1000 || year > 3000) return false
    let month = date.getMonth()
    if (month < 0 || month > 12) return false
    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let day = date.getDate()
    if (day < 1 || day > days_in_month[month]) return false

    let amount = document.getElementById('amount-input').valueAsNumber
    if (isNaN(amount) || amount === 0) return false

    return true
}
document.getElementById('date-input').valueAsDate = new Date()
var submit_btn = document.getElementById('submit-btn')

submit_btn.addEventListener('click', () =>{
    if (!isValidInput()) return

    let amount = document.getElementById('amount-input').value.toString()
    if (expense) {
        amount = "-" + amount
    }

    var data = [
        document.getElementById('date-input').value.toString(),
        amount,
        document.getElementById('category-input').value.toString()
    ]

    let win = remote.getCurrentWindow()

    if (entry_index !== -1){
        ipcRenderer.send('entry-edited', data, entry_index)
        entry_index = -1
        win.close()
        return
    }
    ipcRenderer.send('entry-added', data)
    win.close()
})

var cancel_btn = document.getElementById('cancel-btn')
cancel_btn.addEventListener('click', () =>{
    editing_entry = null
    let win = remote.getCurrentWindow()
    win.close()
})

var delete_btn = document.getElementById('delete-btn')
delete_btn.addEventListener('click', () =>{
    ipcRenderer.send('entry-deleted', entry_index)
    entry_index = -1
    let win = remote.getCurrentWindow()
    win.close()
})

ipcRenderer.on('setEntryData', (event, entry, index) =>{
    let date = new Date(entry.date)
    expense = entry.amount < 0
    document.getElementById('date-input').valueAsDate = date
    document.getElementById('amount-input').value = Math.abs(entry.amount) 
    document.getElementById('category-input').value = entry.category

    entry_index = index
})

ipcRenderer.on('set_is_expense', (event, is_expense) => {
    let delete_btn = document.getElementById('delete-btn')
    delete_btn.style.visibility = 'hidden'
    expense = is_expense;
})