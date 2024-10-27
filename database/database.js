const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('C:/Users/sxaca/OneDrive/Desktop/alternativo/database/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});


module.exports = db;
