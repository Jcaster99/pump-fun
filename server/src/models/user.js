const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');

// Inicjalizacja tabeli użytkowników
const initUserTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Inicjalizacja tabeli
initUserTable();

// Funkcje do obsługi użytkowników
const UserModel = {
  // Sprawdza czy adres portfela już istnieje
  async checkWalletExists(address) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE address = ?', [address], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row);
      });
    });
  },

  // Sprawdza czy nazwa użytkownika jest już zajęta
  async checkUsernameExists(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row);
      });
    });
  },

  // Dodaje nowego użytkownika
  async createUser(address, username, signature) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (address, username, signature) VALUES (?, ?, ?)',
        [address, username, signature],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  },

  // Pobiera dane użytkownika po adresie portfela
  async getUserByAddress(address) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE address = ?', [address], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },

  // Aktualizuje czas ostatniego logowania
  async updateLastLogin(address) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE address = ?',
        [address],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes);
        }
      );
    });
  }
};

module.exports = UserModel; 