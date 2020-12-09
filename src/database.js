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
        (err) =>{ if (err) console.log(err) })
}

function insertRow(date, amount, category, subcategory, note)
{
    db.run("INSERT INTO test (date, amount, category, subcategory, note) VALUES('" + date + "', " + amount.toString() + ", '" + category + "', '" + subcategory + "', '" + note + "')", 
    (err) =>{ if (err) console.log(err) })
}

function getRows()
{
    db.each("SELECT * FROM test", (err, row) =>{
        console.log(row.amount)
    })
}