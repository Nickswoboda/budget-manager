const { ipcRenderer, remote} = require('electron')
const prompt = require('electron-prompt')

let start_time = 0
let end_time = Number.MAX_SAFE_INTEGER
let selected_user = -1

let expense_chart = initPieChart(true) 
let income_chart = initPieChart(false)
let net_income_chart = initLineChart() 

initDB(() => {getUserCount((count) => {
    if (!count || count < 1){
        prompt({
            title: 'No users found',
            label: 'Enter a user name: <br><font size="-2">(Alphabetical letters only)</font>',
            inputAttrs : {
                type: 'text',
                required: true,
                pattern: '[a-zA-Z]{1,}',
            },
            buttonLabels: { ok: 'Submit', cancel: 'Close Application' },
            type: 'input',
            height: 200,
            width: 400,
            useHtmlLabel: true
        }).then((result)=>{
            if (result){
                insertUser(result)
                updateUserSelection()
            } else {
                remote.getCurrentWindow().close()
            }
        })
    }
})})

updateUserSelection()
updateTables()

document.getElementById('start-date').valueAsDate = new Date()
document.getElementById('end-date').valueAsDate = new Date()



document.getElementById("user-select").addEventListener('change', (event) =>{
    selected_user = event.target.value
    updateTables()
})

document.getElementById("view-select").addEventListener('change', (event) =>{
    changeView(event.target.value)
})

function changeView(value)
{
    let charts = document.getElementsByClassName("chart-div")
    document.getElementById('budget-table-div').style.display = (value === "budget") ? "block" : "none"
    for (let i = 0; i < charts.length; ++i){
        charts[i].style.display = (value === "budget") ? "none" : "block"
    }
}

document.getElementById("date-search-select").addEventListener('change', (event) =>{
    if (event.target.value !== "custom"){
        let today = new Date()
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
        today.setHours(0,0,0,0)
        end_time = today.getTime()

        switch(event.target.value){
            case "all-time": start_time = 0; break;
            case "last-7-days": start_time = today.getTime() - (7 * 24 * 60 * 60 * 1000); break;
            case "last-30-days": start_time = today.getTime() - (30 * 24 * 60 * 60 * 1000); break;
            case "last-90-days": start_time = today.getTime() - (90 * 24 * 60 * 60 * 1000); break;
            case "last-180-days": start_time = today.getTime() - (180 * 24 * 60 * 60 * 1000); break;
            case "last-365-days": start_time = today.getTime() - (365 * 24 * 60 * 60 * 1000); break;
        }

        updateTables(start_time, end_time, selected_user)
    }

    document.getElementById("custom-date-search").style.visibility = (event.target.value === "custom") ? "visible" : "hidden"
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

function updateNetIncome()
{
    getNetIncomeByDate(start_time, end_time, selected_user, (entries) =>
    {
        let labels = []
        let values = []
        let sum = 0
        for (let i = 0; i < entries.length; ++i){
            labels.push(entries[i].date)
            sum += parseFloat((entries[i].amount / 100).toFixed(2))
            values.push(sum.toFixed(2))
        }
        updateLineChart(net_income_chart, labels, values)

        net_income = document.getElementById('net-income')
        net_income.innerHTML = sum.toFixed(2)
        net_income.style.color = sum > 0 ? "green" : sum < 0 ? "red" : "black"; 
    })
}
function updateCategoryTotals(is_expense)
{
    let category_labels =[]
    let values =[]

    if (is_expense){
        getExpenseCategoryTotals(start_time, end_time, selected_user, (entries) =>{
            for (let i = 0; i < entries.length; ++i){
                category_labels.push(entries[i].category)
                values.push((entries[i].total / 100).toFixed(2))
            }
            updatePieChart(expense_chart, 'Expenses', category_labels, values)
        })
    } else {
        getIncomeCategoryTotals(start_time, end_time, selected_user, (entries) =>{
            for (let i = 0; i < entries.length; ++i){
                category_labels.push(entries[i].category)
                values.push((entries[i].total / 100).toFixed(2))
            }
            updatePieChart(income_chart, 'Income', category_labels, values)
        })
    }
}

function addEntriesToTable()
{
    let table = document.getElementById("history-table")
    
    getAllEntries(start_time, end_time, selected_user, (entries) => {
        for (let i = 0; i < entries.length; ++i){
            let row = table.insertRow(i+1)
            row.style.backgroundColor = entries[i].amount < 0 ? "red" : "green"

            let edit = addCellToRow(row, 0, "Edit") 
            edit.addEventListener("click", () =>{
                ipcRenderer.send('edit-entry-clicked', entries[i])
            })
            addCellToRow(row, 1, entries[i].name)
            addCellToRow(row, 2, entries[i].date)
            addCellToRow(row, 3, (entries[i].amount / 100).toFixed(2))
            addCellToRow(row, 4, entries[i].subcategory === "" ? entries[i].category : entries[i].subcategory)
            addCellToRow(row, 5, entries[i].note)
        }
    })
}

function resetHTMLTable(name){
    let table = document.getElementById(name)
    let num_rows = table.rows.length
    for ( i = 1; i < num_rows; ++i){
        table.deleteRow(1)
    }
}

function updateTables()
{
    resetHTMLTable('history-table');
    addEntriesToTable()
    updateCategoryTotals(true)
    updateCategoryTotals(false)
    updateNetIncome()
}

function updateUserSelection()
{
    let user_select = document.getElementById('user-select')
    while (user_select.length > 1){
        user_select.remove(1)
    }

    getAllUsers((users)=>{
        for (let i = 0; i < users.length; ++i){
            user_select.options[i+1] = new Option(users[i].name, users[i].id)
        }
        user_select.value = parseInt(selected_user)
    })

}

document.getElementById("expense-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

document.getElementById("income-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

ipcRenderer.on('addEntry', (event, data) => {
    insertEntry(data.user_id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
    updateBudgetMonthSelect()
})

ipcRenderer.on('update-entries', (event, data) => {
    updateEntry(data.id, data.user_id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
    updateBudgetMonthSelect()
})

ipcRenderer.on('deleteEntry', (event, id) => {
    deleteEntry(id)
    updateTables()
})

ipcRenderer.on('users-updated', (event) => {
    updateTables()
    updateUserSelection()
})