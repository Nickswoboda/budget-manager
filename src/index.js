const { ipcRenderer, remote } = require('electron')
const fs = require('fs')
const { maxHeaderSize } = require('http')

class Entry{
    constructor(date, amount, category){
        this.date = date 
        this.amount = amount 
        this.category = category
        this.is_expense = amount < 0 ? true : false
        this.index = -1  
    }

    getTime()
    {
        let new_date = new Date(this.date)
        return new_date.getTime()
    }
}

var expense_total = 0
var income_total = 0
var history_data = []
var visible_entries = []
var visible_start_time = 0
var visible_end_time = Infinity

loadTableFromCSV()

function addCellToRow(row, cell_idx, text)
{
    let cell = row.insertCell(cell_idx)
    cell.innerHTML = text
    return cell
}
function updateTotalPercentages(is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    for (i = 1; i < table.rows.length; ++i){
        let amount = parseFloat(table.rows[i].cells[1].innerHTML)
        let total = is_expense ? expense_total : income_total
        table.rows[i].cells[2].innerHTML = amount / total * 100
    }

    let net_income = expense_total + income_total
    let net_income_text = document.getElementById("net-income")
    net_income_text.innerHTML = net_income 
    net_income_text.style.color = net_income < 0 ? "red" : "green" 
}

function updateCategoryTotal(entry)
{
    let table = entry.is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    if (entry.is_expense){
        expense_total += entry.amount
    }else{
        income_total += entry.amount
    }

    for (i = 0; i < table.rows.length; ++i){
        //if category exists in table, just update and return
        row_category = table.rows[i].cells[0].innerHTML
        if (row_category === entry.category){
            let amount_cell = table.rows[i].cells[1]
            amount_cell.innerHTML = parseFloat(amount_cell.innerHTML) + entry.amount 
            updateTotalPercentages(entry.is_expense)
            return
        }
    }

    var new_row = table.insertRow(1)
    addCellToRow(new_row, 0, entry.category)
    addCellToRow(new_row, 1, entry.amount)
    new_row.insertCell(2)

    updateTotalPercentages(entry.is_expense)
}

function AddEntryToHistoryTable(entry, index)
{
    let table = document.getElementById("history-table")
    
    let row = table.insertRow(index + 1)
    row.style.backgroundColor = entry.is_expense ? "red" : "green"

    let edit = addCellToRow(row, 0, "Edit") 
    edit.addEventListener("click", () =>{
        entry.index = history_data.findIndex(element => element === entry)
        ipcRenderer.send('edit-entry-clicked', entry)
    })

    addCellToRow(row, 1, entry.date)
    addCellToRow(row, 2, entry.amount)
    addCellToRow(row, 3, entry.category)

    visible_entries.splice(index, 0, entry)
    updateCategoryTotal(entry)
}

function resetTable(table_name){
    let table = document.getElementById(table_name)
    let num_rows = table.rows.length
    for ( i = 1; i < num_rows; ++i){
        table.deleteRow(1)
    }
}
function showEntriesInTable(entries)
{
    expense_total = 0
    income_total = 0
    document.getElementById("net-income").innerHTML = 0;


    resetTable("history-table");
    resetTable("income-table");
    resetTable("expense-table");

    for (let i = 0; i < entries.length; ++i){
        AddEntryToHistoryTable(entries[i], i)
    }
}

function getVisibleEntries()
{
    visible_entries = []
    if (history_data.length === 0) return []
    if (history_data[0].getTime() < visible_start_time) return []
    if (history_data[history_data.length-1] > visible_end_time) return []

    let index = getDataInsertionIndex(visible_end_time, false)

    let valid_entries = []
    while (index < history_data.length){
        let entry = history_data[index]
        if (entry.getTime() >= visible_start_time){
            valid_entries.push(entry)
            ++index;
        }
        else{
            break;
        }
    }

    return valid_entries;
}

function getDataInsertionIndex(time, visible_only)
{
    if (visible_only){
        if (time < visible_start_time || time > visible_end_time){
            return -1;
        }
    }

    let data = visible_only ? visible_entries : history_data
    
    let left = 0
    let right = data.length
    while (left < right){
        mid = (left + right) >>> 1
        if (data[mid].getTime() > time){
            left = mid + 1
        }else{
            right = mid
        }
    }
    return left
}

function addEntry(entry)
{
    let index = getDataInsertionIndex(entry.getTime(), false);
    history_data.splice(index, 0, entry)

    let visible_index = getDataInsertionIndex(entry.getTime(), true)
    if (visible_index !== -1){
        AddEntryToHistoryTable(entry, visible_index)
    }
}

function loadTableFromCSV()
{
    if (!fs.existsSync("assets/data.csv")){
        return
    }

    let data = fs.readFileSync("assets/data.csv").toString()
    var header = "Date,Amount,Category\n"
    var index = data.indexOf(header)
    if (index != 0){
        console.log("CSV file not formatted correctly")
        return
    }
    data = data.substr(header.length)

    let entries = data.split("\n")

    entries.forEach((value) => {
        let values = value.split(",")
        let entry = new Entry(values[0], parseFloat(values[1]), values[2])
        addEntry(entry)
    })
}


function saveHistoryAsCSV()
{
    var csv = []
    csv.push("Date,Amount,Category")

    for (var i = 0; i < history_data.length; ++i){
        var row = []

        let entry = history_data[i]
        row.push(entry.date)
        row.push(entry.amount)
        row.push(entry.category)
        csv.push(row.join(","))
    }

    csv = csv.join("\n")
    fs.writeFileSync("assets/data.csv", csv)
}

function populateTestEntries()
{
    addEntry(new Entry("2020-11-02", 2, "Housing"))
    addEntry(new Entry("2020-11-04", 2, "Housing"))
    addEntry(new Entry("2020-11-05", 2, "Housing"))
    addEntry(new Entry("2020-11-02", 2, "Housing"))
    addEntry(new Entry("2020-11-08", 2, "Housing"))
    addEntry(new Entry("2020-11-08", 2, "Housing"))
    addEntry(new Entry("2020-11-08", 2, "Housing"))
    addEntry(new Entry("2020-11-03", 2, "Housing"))
    addEntry(new Entry("2020-11-01", 2, "Housing"))
    addEntry(new Entry("2020-11-09", 2, "Housing"))
    addEntry(new Entry("2020-11-07", 2, "Housing"))
}

document.getElementById("expense-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

document.getElementById("income-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

document.getElementById("submit-btn").addEventListener('click', () =>{

    visible_start_time = document.getElementById("start-date").valueAsDate.getTime()
    visible_end_time = document.getElementById("end-date").valueAsDate.getTime()

    let entries = getVisibleEntries()
    showEntriesInTable(entries)
})

ipcRenderer.on('addEntry', (event, data) => {
    let entry = new Entry(data.date, data.amount, data.category) 
    addEntry(entry)

    saveHistoryAsCSV()
})

ipcRenderer.on('update-entries', (event, data) => {
    history_data[data.index] = new Entry(data.date, data.amount, data.category) 
    saveHistoryAsCSV()
    let entries = getVisibleEntries()
    showEntriesInTable(entries)
})

ipcRenderer.on('deleteEntry', (event, index) => {
    history_data.splice(index, 1)
    
    saveHistoryAsCSV()
    let entries = getVisibleEntries()
    showEntriesInTable(entries)
})
