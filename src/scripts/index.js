const { ipcRenderer} = require('electron')

let start_time = 0
let end_time = Number.MAX_SAFE_INTEGER
let selected_user = -1

let expense_chart = initPieChart(true) 
let income_chart = initPieChart(false)
let net_income_chart = initLineChart() 

let expense_categories = getExpenseCategories()

initDB()
updateUserSelection()
initCategoryBudgetSelect()

function initCategoryBudgetSelect()
{
    let select = document.getElementById("cat-budget-select")

    while (select.options.length > 1){
        select.remove(0)
    }

    let category_names = Object.keys(expense_categories)
    for (let i = 0; i < category_names.length; ++i){
        select.options[i+1] = new Option(category_names[i], category_names[i])
    }

    select.addEventListener('change', (event) =>{
        updateBudgetTable(event.target.value)
    })

    updateTables()
}

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
    let charts = document.getElementsByClassName('chart-div')
    if (value === "budget"){
        document.getElementById('budget-table-div').style.display = "inline"
        for (let i = 0; i < charts.length; ++i){
            charts[i].style.display = "none"
        }
    } else {
        document.getElementById('budget-table-div').style.display = "none"
        for (let i = 0; i < charts.length; ++i){
            charts[i].style.display = "inline"
        }
    }
}

function getExpenseCategories()
{
    if (!fs.existsSync("assets/categories.json")){
        console.log("Unable to load categories.json");
    }

    let data = fs.readFileSync("assets/categories.json")
    return JSON.parse(data).expense
}

function updateBudgetTable(category = null)
{
    resetHTMLTable('budget-table')
    let table = document.getElementById('budget-table')

    if (!category){
        category = table.dataset.category
    }
    let categories = category === "All" ? Object.keys(expense_categories) : expense_categories[category]
    table.dataset.category = category

    for (let i = 0; i < categories.length; ++i){
        let row = table.insertRow(i+1)

        addCellToRow(row, 0, categories[i])
        addCellToRow(row, 1, "")
        addCellToRow(row, 2, "")
        addCellToRow(row, 3, "")

        if (category === "All"){
            getTotalCategoryBudget(selected_user, categories[i], (value) => {
                row.cells[1].innerHTML = parseFloat(value).toFixed(2)
            })
            getTotalByCategory(start_time, end_time, selected_user, categories[i], (rows)=>{
                row.cells[2].innerHTML = (rows.total/100).toFixed(2)
                row.cells[3].innerHTML = (rows.total/100).toFixed(2)
            })
        }
        else {
            getTotalBySubcategory(start_time, end_time, selected_user, categories[i], (rows)=>{
                row.cells[2].innerHTML = (rows.total/100).toFixed(2)
                row.cells[3].innerHTML = (rows.total/100).toFixed(2)
            })

        }
    }
}

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
    updateBudgetTable()
}

function updateUserSelection(users)
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
    getUserCount((count) => {
        if (count > 0){
            ipcRenderer.send('add-entry-clicked', true)
        } else {
            ipcRenderer.send('error-popup', 'No users found. You must add a User (File->Edit Users) before adding an entry.')
        }
    })
})

document.getElementById("income-btn").addEventListener('click', () =>{
    getUserCount((count) => {
        if (count > 0){
            ipcRenderer.send('add-entry-clicked', true)
        } else {
            ipcRenderer.send('error-popup', 'No users found. You must add a User (File->Edit Users) before adding an entry.')
        }
    })
})

ipcRenderer.on('addEntry', (event, data) => {
    insertEntry(data.user_id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
})

ipcRenderer.on('update-entries', (event, data) => {
    updateEntry(data.id, data.user_id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
})

ipcRenderer.on('deleteEntry', (event, id) => {
    deleteEntry(id)
    updateTables()
})

ipcRenderer.on('users-updated', (event) => {
    updateTables()
    getAllUsers(updateUserSelection)
})