const { ipcRenderer, remote } = require('electron')
const fs = require('fs')
const { maxHeaderSize } = require('http')

class Entry{
    constructor(date, amount, category){
        this.date = date 
        this.amount = amount 
        this.category = category
        this.is_expense = amount < 0 ? true : false
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

function updateTotalPercentages(is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    for (i = 1; i < table.rows.length; ++i){
        let amount = parseFloat(table.rows[i].cells[1].innerHTML)
        let total = is_expense ? expense_total : income_total
        let percentage = amount / total * 100
        table.rows[i].cells[2].innerHTML = percentage
    }

    let net_income = income_total + expense_total
    
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
        row_category = table.rows[i].cells[0].innerHTML
        if (row_category === entry.category){
            let amount_cell = table.rows[i].cells[1]
            let new_amount = parseFloat(amount_cell.innerHTML) + entry.amount 
            amount_cell.innerHTML = new_amount
            updateTotalPercentages(entry.is_expense)
            return
        }
    }

    var new_row = table.insertRow(1)
    let category_cell = new_row.insertCell(0)
    let amount_cell = new_row.insertCell(1)

    category_cell.innerHTML = entry.category 
    amount_cell.innerHTML = entry.amount 

    new_row.insertCell(2)
    updateTotalPercentages(entry.is_expense)
}

function AddEntryToHistoryTable(entry, index)
{
    let table = document.getElementById("history-table")
    
    let row = table.insertRow(index + 1)
    row.style.backgroundColor = entry.is_expense ? "red" : "green"

    let date = row.insertCell(0)
    let amount = row.insertCell(1)
    let category = row.insertCell(2)

    date.innerHTML = entry.date 
    amount.innerHTML = entry.amount 
    category.innerHTML = entry.category 

    visible_entries.splice(index, 0, entry)
    updateCategoryTotal(entry)
}

function showEntriesInTable(entries)
{
    expense_total = 0
    income_total = 0
    let table = document.getElementById("history-table")
    let num_rows = table.rows.length
    for ( i = 1; i < num_rows; ++i){
        table.deleteRow(1)
    }

    let income_table = document.getElementById("income-table")
    num_rows = income_table.rows.length
    for ( i = 1; i < num_rows; ++i){
        income_table.deleteRow(1)
    }

    let expense_table = document.getElementById("expense-table")
    num_rows = expense_table.rows.length
    for ( let i = 1; i < num_rows; ++i){
        expense_table.deleteRow(1)
    }

    for (let i = 0; i < entries.length; ++i){
        AddEntryToHistoryTable(entries[i], i)
    }
}

function getVisibleEntries()
{
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
    if (index === history_data.length) history_data.push(entry)
    else history_data.splice(index, 0, entry)

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

var expense_button = document.getElementById("expense-btn")
expense_button.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

var income_button = document.getElementById("income-btn")
income_button.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

var income_button = document.getElementById("submit-btn")
income_button.addEventListener('click', () =>{
    let start_string = document.getElementById("start-date").value.toString()
    let start_date = new Date(start_string)
    visible_start_time = start_date.getTime()

    let end_string = document.getElementById("end-date").value.toString()
    let end_date = new Date(end_string)
    visible_end_time = end_date.getTime()

    let entries = getVisibleEntries()
    showEntriesInTable(entries)
})

ipcRenderer.on('addEntry', (event, args) => {
    let entry = new Entry(args[0], parseFloat(args[1]), args[2])
    addEntry(entry)

    saveHistoryAsCSV()
})

