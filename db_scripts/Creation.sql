-- Create databases if they don't exist
-- CREATE DATABASE IF NOT EXISTS project_manager;
-- CREATE DATABASE IF NOT EXISTS curriculums;
-- CREATE DATABASE IF NOT EXISTS parents;
-- CREATE DATABASE IF NOT EXISTS employees;
-- CREATE DATABASE IF NOT EXISTS users;


-- Create tables for project_manager;

USE project_manager;
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_Id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    duration INT,
    type VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    creation_date DATE,
    eventsIds_JSON TEXT, -- Assuming cal is a JSON or serialized data
    participantsIds_JSON TEXT, -- Assuming participants is a JSON or serialized data
    groupsId_JSON TEXT, -- Assuming groups is a JSON or serialized data
    curriculumId_JSON TEXT -- Assuming curriculum is a reference to another table
);
-- SHOW TABLES;
-- DESCRIBE projects;
-- SELECT * FROM projects;

INSERT INTO projects (id, title,parent_id, summary, duration, type, status, start_date, end_date, creation_date, eventsIds_JSON, participantsIds_JSON, groupsId_JSON,  curriculumId_JSON)
VALUES (
    '115',
    'Montreal Honda Training',
    4488,
    'introduction to the toolset',
    142,
    'onboarding',
    'active',
    '2023-02-15',
    '2023-12-26',
    '2023-01-10',
    'cal', -- Assuming cal is a variable or value you want to insert
    '[]', -- Assuming participants is an empty array
    '[]', -- Assuming groups is an empty array
    '[]' -- Assuming curriculum is a variable or value you want to insert
);
SELECT * FROM projects;



CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_Id INT NOT NULL,
	firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    status VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    department VARCHAR(255),
    group_name VARCHAR(255),
    creation_date DATE
);
-- SHOW TABLES;
-- DESCRIBE projects;
 SELECT * FROM participants;

INSERT INTO participants ( id, parent_Id, firstName, lastName, email, status, role, department, group_name, creation_date)
VALUES (
    1001,
    4488,
    'Marc',
    'from project',
    'john.doe@example.com',
    'Active',
    'Instructor',
    'Human Resources',
    'Montreal Honda',
    '2023-01-10'
);
SELECT * FROM projects;

-- JOIN 
CREATE TABLE IF NOT EXISTS project_participants (
    project_id INT,
    participant_id INT
);
INSERT INTO project_participants (project_id, participant_id)
VALUES (1, 1),  -- Project with ID 1 is associated with Participant with ID 1
       (1, 2),  -- Project with ID 1 is associated with Participant with ID 2
       (2, 2);  -- Project with ID 2 is associated with Participant with ID 2
SELECT participants.*
FROM participants
JOIN project_participants ON participants.id = project_participants.participant_id
WHERE project_participants.project_id = 1;



