CREATE DATABASE duedash;
USE duedash;
CREATE TABLE tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    task_title VARCHAR(150) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    task_type VARCHAR(30) NOT NULL,
    deadline DATE NOT NULL,
    written BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SHOW TABLES;
USE duedash;
DESCRIBE tasks;
INSERT INTO tasks
    (task_title, subject, task_type, deadline, written, uploaded)
VALUES
    ('Java Assignment 1', 'FSJP', 'Assignment',
     '2026-10-28', FALSE, FALSE);
     SELECT*FROM tasks;
