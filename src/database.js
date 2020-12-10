const sqlite3 = require('sqlite3')

createDB()
var db;
function createDB()
{
    db = new sqlite3.Database('assets/db.sqlite', (err) => {
        err ? console.log(err) : createTable()
    })
}
function createTable()
{
    db.run(`CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT,
        amount REAL, category TEXT, subcategory TEXT, note TEXT)`, 
        (err) => err ? console.log(err) : getRows())
}

function insertRow(date, amount, category, subcategory, note)
{
    db.run(`INSERT INTO test (date, amount, category, subcategory, note) VALUES('${date}', ${amount}, '${category}', '${subcategory}', '${note}')`, 
    (err) =>{ if (err) console.log(err) })
}

function getRows()
{
    resetHTMLTables()
    let index = 1;
    db.each("SELECT * FROM test", (err, row) =>{
        addToHistoryTable(row, index)
        ++index;
    })

    getCategoryTotals()
    getNetIncome()
}

function updateRow(id, date, amount, category, subcategory, note)
{
    db.run(`UPDATE test SET date='${date}', amount=${amount}, category='${category}', subcategory='${subcategory}', note='${note}' WHERE id=${id}`)
    getRows()
}

function deleteRow(id)
{
    db.run(`DELETE FROM test WHERE id=${id}`)
    getRows()
}

function getCategoryTotals()
{
    db.all(`SELECT category, SUM(amount) as total, SUM(amount) * 100 / t.s AS percentage
            FROM test 
            CROSS JOIN (SELECT SUM(amount) as s FROM test WHERE test.amount < 0) t 
            WHERE test.amount < 0 
            GROUP BY category`,
    (err, rows) =>{
        if (err){
            console.log(err)
        } else {
            updateCategoryTotals(rows, true)
        }
    })

    db.all(`SELECT category, SUM(amount) as total, SUM(amount) * 100 / t.s AS percentage
            FROM test 
            CROSS JOIN (SELECT SUM(amount) as s FROM test WHERE test.amount > 0) t 
            WHERE test.amount > 0 
            GROUP BY category`,
    (err, rows) =>{
        if (err){
            console.log(err)
        } else {
            updateCategoryTotals(rows, false)
        }
    })
}

function getNetIncome()
{
    db.all(`SELECT SUM(amount) + t.s as total 
            FROM test 
            CROSS JOIN(SELECT SUM(amount) as s FROM test WHERE amount > 0) t
            WHERE amount < 0`, 
    (err, row) => {
            document.getElementById('net-income').innerHTML = row[0].total 
    })
}