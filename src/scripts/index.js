const { ipcRenderer} = require('electron')

let start_time = 0
let end_time = Number.MAX_SAFE_INTEGER
let selected_user = -1

document.getElementById('start-date').valueAsDate = new Date()
document.getElementById('end-date').valueAsDate = new Date()


document.getElementById("user-select").addEventListener('change', (event) =>{
    selected_user = event.target.value
    updateTables(start_time, end_time, selected_user)
})

let custom_date_div = document.getElementById("custom-date-search");
document.getElementById("date-search-select").addEventListener('change', (event) =>{
    if (event.target.value === "custom"){
        custom_date_div.style.visibility = "visible";
    }
    else{
        custom_date_div.style.visibility = "hidden";

        let today = new Date()
        end_time = today.getTime()

        switch(event.target.value){
            case "all-time": start_time = 0; break;
            case "past-year": start_time = today.setFullYear(today.getFullYear() - 1); break;
            case "past-month": start_time = today.setMonth(today.getMonth() - 1); break;
            case "past-week": start_time = today.setDate(today.getDate() - 7); break;
        }
        updateTables(start_time, end_time, selected_user)
    }
})

document.getElementById("submit-btn").addEventListener('click', () =>{
    start_time = document.getElementById("start-date").valueAsDate.getTime()
    end_time = document.getElementById("end-date").valueAsDate.getTime()

    updateTables(start_time, end_time, selected_user)
})

function addCellToRow(row, cell_idx, text)
{
    let cell = row.insertCell(cell_idx)
    cell.innerHTML = text
    return cell
}

function updateCategoryTotalSums(total_sum, is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    var total_row = table.insertRow(table.rows.length)
    addCellToRow(total_row, 0, "Total")
    addCellToRow(total_row, 1, (total_sum / 100).toFixed(2))
}
function updateCategoryTotals(entries, is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    for (let i = 0; i < entries.length; ++i){
        var new_row = table.insertRow(i+1)
        addCellToRow(new_row, 0, entries[i].category)
        addCellToRow(new_row, 1, (entries[i].total / 100).toFixed(2))
        addCellToRow(new_row, 2, entries[i].percentage.toFixed(2))
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
    addCellToRow(row, 2, (entry.amount / 100).toFixed(2))
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

function updateTables()
{
    resetHTMLTables();
    getAllRows(start_time, end_time, selected_user)
    getCategoryTotals(start_time, end_time, selected_user)
    getNetIncome(start_time, end_time, selected_user)
}

document.getElementById("expense-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

document.getElementById("income-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

ipcRenderer.on('addEntry', (event, data) => {
    insertRow(data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
})

ipcRenderer.on('update-entries', (event, data) => {
    updateRow(data.id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
})

ipcRenderer.on('deleteEntry', (event, id) => {
    deleteRow(id)
    updateTables()
})
