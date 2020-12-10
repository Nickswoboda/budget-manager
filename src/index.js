const { ipcRenderer} = require('electron')

function addCellToRow(row, cell_idx, text)
{
    let cell = row.insertCell(cell_idx)
    cell.innerHTML = text
    return cell
}

function updateCategoryTotals(entries, is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    for (let i = 0; i < entries.length; ++i){
        var new_row = table.insertRow(i+1)
        addCellToRow(new_row, 0, entries[i].category)
        addCellToRow(new_row, 1, entries[i].total)
        addCellToRow(new_row, 2, entries[i].percentage)
    }
}

function addToHistoryTable(entry, index)
{
    let table = document.getElementById("history-table")
    
    let row = table.insertRow(index)
    row.style.backgroundColor = entry.amount < 0 ? "red" : "green"

    let edit = addCellToRow(row, 0, "Edit") 
    edit.addEventListener("click", () =>{
        ipcRenderer.send('edit-entry-clicked', entry)
    })

    addCellToRow(row, 1, entry.date)
    addCellToRow(row, 2, entry.amount)
    addCellToRow(row, 3, entry.subcategory === "" ? entry.category : entry.subcategory)
    addCellToRow(row, 4, entry.note)
}

function resetHTMLTable(table_name){
    let table = document.getElementById(table_name)
    let num_rows = table.rows.length
    for ( i = 1; i < num_rows; ++i){
        table.deleteRow(1)
    }
}
function resetHTMLTables()
{
    resetHTMLTable("history-table");
    resetHTMLTable("income-table");
    resetHTMLTable("expense-table");
}

document.getElementById("expense-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

document.getElementById("income-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

ipcRenderer.on('addEntry', (event, data) => {
    insertRow(data.date, data.amount, data.category, data.subcategory, data.note) 
    getRows()
})

ipcRenderer.on('update-entries', (event, data) => {
    updateRow(data.id, data.date, data.amount, data.category, data.subcategory, data.note) 
})

ipcRenderer.on('deleteEntry', (event, id) => {
    deleteRow(id)
})
