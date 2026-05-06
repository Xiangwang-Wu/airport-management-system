const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const db = new Database(path.join(__dirname, 'airport.db'))

// Enable foreign keys
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Airline (
      airline_code CHAR(2) PRIMARY KEY,
      airline_name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Flight (
      flight_id   CHAR(6) PRIMARY KEY,
      airline_code CHAR(2) NOT NULL,
      gate        VARCHAR(10) NOT NULL,
      destination VARCHAR(100) NOT NULL,
      status      TEXT NOT NULL DEFAULT 'waiting'
                  CHECK(status IN ('waiting','boarding','left')),
      ticket_count INT DEFAULT 0,
      FOREIGN KEY (airline_code) REFERENCES Airline(airline_code)
    );

    CREATE TABLE IF NOT EXISTS Passenger (
      ticket_number CHAR(10) PRIMARY KEY,
      first_name    VARCHAR(50) NOT NULL,
      last_name     VARCHAR(50) NOT NULL,
      id_number     CHAR(6)     NOT NULL UNIQUE,
      flight_id     CHAR(6)     NOT NULL,
      status        TEXT NOT NULL DEFAULT 'Not-checked-in'
                    CHECK(status IN ('Not-checked-in','Checked-in','Boarded')),
      FOREIGN KEY (flight_id) REFERENCES Flight(flight_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Staff (
      staff_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_type  TEXT NOT NULL
                  CHECK(staff_type IN ('Airline staff','Gate staff','Ground crew','Admin')),
      firstname   VARCHAR(50) NOT NULL,
      lastname    VARCHAR(50) NOT NULL,
      email       VARCHAR(100) NOT NULL,
      phone       CHAR(10) NOT NULL,
      airline_code CHAR(2),
      assignment  VARCHAR(50),
      FOREIGN KEY (airline_code) REFERENCES Airline(airline_code)
    );

    CREATE TABLE IF NOT EXISTS User_Account (
      username            VARCHAR(50) PRIMARY KEY,
      password_hash       VARCHAR(255) NOT NULL,
      role                TEXT NOT NULL
                          CHECK(role IN ('admin','airline','ground','gate')),
      staff_id            INTEGER,
      must_change_password INTEGER DEFAULT 0,
      FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
    );

    CREATE TABLE IF NOT EXISTS Baggage (
      bag_id           CHAR(6) PRIMARY KEY,
      ticket_number    CHAR(10) NOT NULL,
      flight_id        CHAR(6)  NOT NULL,
      status           TEXT NOT NULL DEFAULT 'Checked-in'
                       CHECK(status IN ('Checked-in','At security check','At gate','Loaded to flight','Sent back')),
      check_in_location VARCHAR(50) NOT NULL,
      FOREIGN KEY (ticket_number) REFERENCES Passenger(ticket_number),
      FOREIGN KEY (flight_id)     REFERENCES Flight(flight_id)
    );

    CREATE TABLE IF NOT EXISTS Airline_Message (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id  CHAR(6)     NOT NULL,
      sender     VARCHAR(50) NOT NULL,
      recipient  VARCHAR(50),
      message    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flight_id) REFERENCES Flight(flight_id)
    );

    CREATE TABLE IF NOT EXISTS Flight_Notification (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id  CHAR(6)     NOT NULL,
      gate       VARCHAR(10) NOT NULL,
      is_ready   INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flight_id) REFERENCES Flight(flight_id)
    );
  `)

  // Seed only if no staff exists yet
  const count = db.prepare('SELECT COUNT(*) as c FROM Staff').get()
  if (count.c > 0) return

  const hash = bcrypt.hashSync('Admin123!', 10)

  // Seed admin account only — all other data loaded via API
  db.prepare(`INSERT INTO Staff(staff_type,firstname,lastname,email,phone,airline_code,assignment)
    VALUES ('Admin','Admin','User','admin@airport.com','2145550100',NULL,'Admin')`).run()
  db.prepare(`INSERT INTO User_Account VALUES ('admin','${hash}','admin',1,0)`).run()

  console.log('Database initialized with admin account.')
}

module.exports = { db, initDB }
