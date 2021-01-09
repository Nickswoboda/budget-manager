const sqlite3 = require('sqlite3')
const fs = require('fs')

var db = null;

function initDB(callback)
{
    db = new sqlite3.Database('assets/db.sqlite', (err) => {
        err ? console.log(err) : createTables(callback)
    })
}

function createTables(callback)
{
    db.run(`CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, datetime INTEGER,
        amount INTEGER, category TEXT, subcategory TEXT, note TEXT)`, 
        (err) => { 
            if (err) {
                console.log(err)
            } else if (callback) {
                callback()
            }
         })

    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`, (err) => {
        if (err) { console.log(err)}
    })
    db.run(`CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, category TEXT, amount INTEGER)`, (err) => {
        if (err) {console.log(err)}
    })
}

function insertEntry(user_id, date, amount, category, subcategory, note)
{
    let datetime = Date.parse(date)
    //store as cents to help reduce float imprecision
    let cents = (amount * 100).toFixed(0) 
    db.run(`INSERT INTO entries (user_id, date, datetime, amount, category, subcategory, note) VALUES(${user_id}, '${date}', ${datetime}, ${cents}, '${category}', '${subcategory}', '${note}')`, 
    (err) =>{ if (err) console.log(err) })
}

function getAllEntries(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    db.all(`SELECT entries.id, name, date, amount, category, subcategory, note FROM entries 
            JOIN users
            ON users.id = entries.user_id
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND datetime >= ${start} AND datetime <= ${end} 
            ORDER BY datetime DESC`, 
            (err, rows) =>{ if (err){ console.log(err) } else{ callback(rows) } })
}

function updateEntry(id, user_id, date, amount, category, subcategory, note)
{
    let datetime = Date.parse(date)
    //store as cents to help reduce float imprecision
    let cents = (amount * 100).toFixed(0) 
    db.run(`UPDATE entries SET user_id=${user_id}, date='${date}', datetime=${datetime}, amount=${cents}, category='${category}', subcategory='${subcategory}', note='${note}' WHERE id=${id}`,
    (err) => { if (err) console.log(err); })
}

function deleteEntry(id)
{
    db.run(`DELETE FROM entries WHERE id=${id}`, (err) => { if (err) console.log(err); })
}

function deleteEntriesByUser(user_id)
{
    db.run(`DELETE FROM entries WHERE user_id=${user_id}`, (err) => { if (err) console.log(err); })
}

function insertUser(name)
{
    db.run(`INSERT INTO users (name) VALUES('${name}')`, (err) =>{ 
        if (err) {
            console.log(err) 
        } else {
            initUserBudgets(name)
        }
    })
}
function initUserBudgets(name)
{
    db.get(`SELECT id FROM users WHERE name = '${name}'`, (err, row) =>{
        if (err){
            console.log(err)
        } else {
            let user_id = row.id
            if (!fs.existsSync("assets/categories.json")){
                console.log("Unable to load categories.json");
            }

            let data = fs.readFileSync("assets/categories.json")
            let expenses = JSON.parse(data).expense

            for (const [key, subcategories] of Object.entries(expenses)){
                for (let i = 0; i < subcategories.length; ++i){
                    db.run(`INSERT INTO budgets (user_id, category, amount) VALUES (${user_id}, '${subcategories[i]}', 0)`, (err) =>{
                        if (err) console.log(err)
                    })
                }
            }
        }
    })
}

function getSubcategoryBudget(user_id, subcategory, callback)
{
    db.get(`SELECT amount FROM budgets WHERE user_id = ${user_id} AND category = '${subcategory}'`, (err, row) => {
        if (err){
            console.log(err)
        } else {
            callback(row.amount)
        }
    })
}

function updateSubcategoryBudget(user_id, subcategory, value)
{
    db.run(`UPDATE budgets SET amount=${value} WHERE user_id = ${user_id} AND category='${subcategory}'`)
}

function updateUser(id, name)
{
    db.run(`UPDATE users SET name=${name}`, (err) => { if (err) console.log(err); })
}

function deleteUser(id)
{
    db.run(`DELETE FROM users WHERE id=${id}`, (err) => { 
        if (err) {
            console.log(err) 
        } else {
            deleteEntriesByUser(id)
        }
    })

}

function getAllUsers(callback)
{
    db.all(`SELECT id, name FROM users`, (err, rows) =>{
        if (!err) callback(rows)
    })
}

function getUserCount(callback)
{
    db.get(`SELECT COUNT(*) as count FROM users`, (err, count) =>{
        if (!err) callback(count.count)
    })
}

function getCategoryTotals(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    db.all(`SELECT category, SUM(amount) as total, ROUND(SUM(amount) * 100.0 / t.s, 2) AS percentage
            FROM entries 
            CROSS JOIN (SELECT SUM(amount) as s FROM entries WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}) t
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY category`,
            (err, rows) =>{ if (err){ console.log(err) } else { callback(rows, true) } }) //true = expense, false = income

    db.all(`SELECT category, SUM(amount) as total, ROUND(SUM(amount) * 100.0 / t.s, 2) AS percentage
            FROM entries 
            CROSS JOIN (SELECT SUM(amount) as s FROM entries WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount > 0 AND entries.datetime >= ${start} AND datetime <= ${end}) t
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount > 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY category`,
            (err, rows) =>{ if (err){ console.log(err) } else { callback(rows, false) } })
}

function getSubcategoryTotals(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    db.all(`SELECT subcategory, category, SUM(amount) as total
            FROM entries 
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY subcategory`,
            (err, rows) =>{ if (err){ console.log(err) } else { callback(rows, true) } }) //true = expense, false = income
}

function getNetIncomeByDate(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    db.all(`SELECT date, SUM(amount) as amount
            FROM entries 
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND datetime >= ${start} AND datetime <= ${end}
            GROUP BY date`,
            (err, rows) => {  if (rows) callback(rows) })
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