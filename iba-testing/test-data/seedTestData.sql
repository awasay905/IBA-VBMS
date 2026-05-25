-- 1. DELETE all existing data (Order matters due to Foreign Keys)
-- Delete from child tables first, then parent tables
DELETE FROM bookings;


DELETE FROM blocked_slots;


DELETE FROM rooms;


DELETE FROM buildings;


DELETE FROM users;


-- 2. INSERT exactly these users
-- Password hash for 'testpass' using bcrypt (standard cost 10)
-- $2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2
INSERT INTO
    users (erp, name, email, password, role)
VALUES
    (
        'test-student',
        'Test Student',
        'student@test.com',
        '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2',
        'student'
    ),
    (
        'test-po',
        'Test PO',
        'po@test.com',
        '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2',
        'programoffice'
    ),
    (
        'test-admin',
        'Test Admin',
        'admin@test.com',
        '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2',
        'admin'
    ),
    (
        'test-student-2',
        'Concurrency Student',
        'student2@test.com',
        '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2',
        'student'
    );


-- 3. INSERT one building
INSERT INTO
    buildings (id, name, location)
VALUES
    (
        '99999999-9999-9999-9999-999999999999',
        'Test Building',
        'Main Campus'
    );


-- 4. INSERT two rooms
INSERT INTO
    rooms (id, building_id, name, capacity, type)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '99999999-9999-9999-9999-999999999999',
        'Test Room A',
        30,
        'Classroom'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '99999999-9999-9999-9999-999999999999',
        'Test Room B',
        20,
        'Meeting Room'
    );


-- 5. INSERT one existing booking for Test Room A, slot 1, a future date
-- We use current_date + interval '7 days' to ensure it's always in the future
INSERT INTO
    bookings (user_id, room_id, slot_id, date, purpose, status)
SELECT
    id,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    1,
    current_date + INTERVAL '7 days',
    'Existing Booking for Conflict Test',
    'approved'
FROM
    users
WHERE
    erp = 'test-student'
LIMIT
    1;