CREATE DATABASE IF NOT EXISTS handoff_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'handoff_app'@'localhost' IDENTIFIED BY 'CHANGE_ME_dev_password';
GRANT ALL PRIVILEGES ON handoff_db.* TO 'handoff_app'@'localhost';
FLUSH PRIVILEGES;
