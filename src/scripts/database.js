const sqlite3 = require('sqlite3')
const fs = require('fs')

var db;
createDB()

function createDB()
{
    db = new sqlite3.Database('assets/db.sqlite', (err) => {
        err ? console.log(err) : createTable()
    })
}

function createTable()
{
    db.run(`CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, datetime INTEGER,
        amount INTEGER, category TEXT, subcategory TEXT, note TEXT)`, 
        (err) => { err ? console.log(err) : updateTables()})
}

function insertRow(date, amount, category, subcategory, note)
{
    let datetime = Date.parse(date)
    //store as cents to help reduce float imprecision
    let cents = (amount * 100).toFixed(0) 
    db.run(`INSERT INTO entries (user_id, date, datetime, amount, category, subcategory, note) VALUES(${user_id}, '${date}', ${datetime}, ${cents}, '${category}', '${subcategory}', '${note}')`, 
    (err) =>{ if (err) console.log(err) })
}

function getAllRows(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1)
{
    let index = 1;
    db.each(`SELECT id, date, amount, category, subcategory, note FROM entries WHERE (${user_id} < 0 OR user_id = ${user_id}) AND datetime >= ${start} AND datetime <= ${end} ORDER BY datetime DESC`, 
            (err, row) =>{ if (err){ console.log(err) } else{ addToHistoryTable(row, index); ++index; } })
}

function updateRow(id, date, amount, category, subcategory, note)
{
    let datetime = Date.parse(date)
    //store as cents to help reduce float imprecision
    let cents = (amount * 100).toFixed(0) 
    db.run(`UPDATE entries SET date='${date}', datetime=${datetime}, amount=${cents}, category='${category}', subcategory='${subcategory}', note='${note}' WHERE id=${id}`,
    (err) => { if (err) console.log(err); })
}

function deleteRow(id)
{
    db.run(`DELETE FROM entries WHERE id=${id}`, (err) => { if (err) console.log(err); })
}

function getCategoryTotals(start = 0, end = Number.MAX_SAFE_INTEGER)
{
    db.all(`SELECT category, SUM(amount) as total, ROUND(SUM(amount) * 100.0 / t.s, 2) AS percentage
            FROM entries 
            CROSS JOIN (SELECT SUM(amount) as s FROM entries WHERE entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}) t
            WHERE entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY category`,
            (err, rows) =>{ if (err){ console.log(err) } else { updateCategoryTotals(rows, true) } })

    db.all(`SELECT category, SUM(amount) as total, ROUND(SUM(amount) * 100.0 / t.s, 2) AS percentage
            FROM entries 
            CROSS JOIN (SELECT SUM(amount) as s FROM entries WHERE entries.amount > 0 AND entries.datetime >= ${start} AND datetime <= ${end}) t
            WHERE entries.amount > 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY category`,
            (err, rows) =>{ if (err){ console.log(err) } else { updateCategoryTotals(rows, false) } })
}

function getNetIncome(start = 0, end = Number.MAX_SAFE_INTEGER)
{
    db.get(`SELECT SUM(amount) as expenses, t.income
            FROM entries 
            CROSS JOIN (SELECT SUM(amount) as income FROM entries WHERE entries.amount > 0 AND entries.datetime >= ${start} AND datetime <= ${end}) t
            WHERE entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}`,
            (err, row) => { 
                if (row.expenses === null) row.expenses = 0;
                if (row.income === null) row.income = 0;
                updateCategoryTotalSums(row.expenses, true);
                updateCategoryTotalSums(row.income, false);

                let total = (row.expenses + row.income) / 100
                net_income = document.getElementById('net-income')
                net_income.innerHTML = total 
                net_income.style.color = total > 0 ? "green" : total < 0 ? "red" : "black"; 
            })
}

/*function saveToCsv(rows){
    var csv = []

    for (var i = 0; i < rows.length; ++i){
        var row = []

        for (var j = 0; j < Object.keys(rows[i]).length; ++j){
            row.push(rows[i][Object.keys(rows[i])[j]])
        }

        csv.push(row.join(","))
    }

    csv = csv.join("\n")
    fs.writeFileSync("assets/data.csv", csv)
}

function loadFromCsv()
{
    let data = fs.readFileSync("assets/data.csv").toString()

    let entries = data.split("\n")
    entries.forEach((value) => {
        let values = value.split(",")
        insertRow(values[1], values[3], values[4], values[5], values[6])
    })
}*/