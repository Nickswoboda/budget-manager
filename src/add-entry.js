const {ipcRenderer, remote} = require('electron')

var expense = true
var entry_edited = null
var win = remote.getCurrentWindow()

//set date as todays date by default
document.getElementById('date-input').valueAsDate = new Date()

function isValidInput()
{
    let date = document.getElementById('date-input').valueAsDate
    if (date.getFullYear() < 1000 || date.getFullYear() > 3000) return false
    if (date.getMonth() < 0 || date.getMonth() > 12) return false

    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (date.getDate() < 1 || date.getDate() > days_in_month[date.getMonth()]) return false

    let amount = document.getElementById('amount-input').valueAsNumber
    if (isNaN(amount) || amount === 0) return false

    return true
}
document.getElementById('submit-btn').addEventListener('click', () =>{
    if (!isValidInput()) return

    let value = parseFloat(document.getElementById('amount-input').value.toString())

    var data = {
        date : document.getElementById('date-input').value.toString(),
        amount : expense ? -value : value,
        category : document.getElementById('category-input').value.toString(),
        index : entry_edited === null ? -1 : entry_edited.index
    }

    ipcRenderer.send('entry-submitted', data)
    win.close()
})

document.getElementById('cancel-btn').addEventListener('click', () =>{
    win.close()
})

delete_btn = document.getElementById('delete-btn').addEventListener('click', () =>{
    ipcRenderer.send('entry-deleted', entry_edited.index)
    win.close()
})

ipcRenderer.on('initialize-popup', (event, is_expense, entry) =>{
    entry_edited = entry
    expense = is_expense

    if (entry === null){
        let delete_btn = document.getElementById('delete-btn')
        delete_btn.style.visibility = 'hidden'
    } else {
        let date = new Date(entry.date)
        document.getElementById('date-input').valueAsDate = date
        document.getElementById('amount-input').value = Math.abs(entry.amount) 
        document.getElementById('category-input').value = entry.category
    }
})