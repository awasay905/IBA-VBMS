-- ====================================================================
--  IBA FACILITY BOOKING SYSTEM — HIGH-VOLUME SEED DATA SCRIPT
--  Run via: ts-node scripts/seedDb.ts --seed
-- ====================================================================

-- 1. DELETE existing data (Order matters due to Foreign Keys)
DELETE FROM bookings;
DELETE FROM blocked_slots;
DELETE FROM rooms;
DELETE FROM buildings;
DELETE FROM users;

-- 2. INSERT STANDARD TEST USERS (Maintains compatibility with integration/concurrency tests)
-- Password hash for 'testpass' using bcrypt
-- $2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2
INSERT INTO users (id, erp, name, email, password, role) VALUES
('44444444-4444-4444-4444-444444444444', 'test-student', 'Test Student', 'student@test.com', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'student'),
('55555555-5555-5555-5555-555555555555', 'test-po', 'Test PO', 'po@test.com', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'programoffice'),
('66666666-6666-6666-6666-666666666666', 'test-admin', 'Test Admin', 'admin@test.com', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'admin'),
('77777777-7777-7777-7777-777777777777', 'test-student-2', 'Concurrency Student', 'student2@test.com', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'student');


-- 3. INSERT ADDITIONAL STAFF & ADMINS FOR COMPLEX SCENARIOS
INSERT INTO users (erp, name, email, password, role) VALUES
('po-main', 'Hammad Siddiqui (Main Campus PO)', 'hammad@iba.edu.pk', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'programoffice'),
('po-city', 'Sania Shah (City Campus PO)', 'sania@iba.edu.pk', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'programoffice'),
('admin-root', 'Root Administrator', 'root@iba.edu.pk', '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'admin');


-- 4. DYNAMICALLY GENERATE 150 STUDENTS WITH LOCAL PAKISTANI NAMES
DO $$
DECLARE
    first_names text[] := ARRAY['Ali', 'Muhammad', 'Aisha', 'Fatima', 'Zainab', 'Hamza', 'Osama', 'Bilal', 'Sana', 'Amna', 'Hassan', 'Hussein', 'Ayesha', 'Zoya', 'Ahmed', 'Mustafa', 'Omar', 'Sara', 'Kamil', 'Mariam', 'Yousuf', 'Zayd', 'Saad', 'Tayyab', 'Hania', 'Eshal', 'Daniyal', 'Zain', 'Rehman', 'Waqas', 'Anas', 'Laiba', 'Mahnoor', 'Kashif', 'Arsalan', 'Nida', 'Sobia', 'Farhan'];
    last_names text[] := ARRAY['Khan', 'Ahmed', 'Ali', 'Siddiqui', 'Sheikh', 'Butt', 'Raza', 'Farooq', 'Iqbal', 'Malik', 'Hassan', 'Zaidi', 'Abbasi', 'Shah', 'Naqvi', 'Lakhani', 'Qureshi', 'Ansari', 'Ghafoor', 'Awan', 'Javed', 'Dar', 'Gill', 'Mir', 'Lodhi'];
    f_idx int;
    l_idx int;
    f_name text;
    l_name text;
    full_name text;
    erp_id text;
    email_addr text;
    i int;
BEGIN
    FOR i IN 1..150 LOOP
        f_idx := floor(random() * array_length(first_names, 1)) + 1;
        l_idx := floor(random() * array_length(last_names, 1)) + 1;
        f_name := first_names[f_idx];
        l_name := last_names[l_idx];
        full_name := f_name || ' ' || l_name;
        erp_id := (24000 + i)::text;
        email_addr := lower(f_name) || '.' || lower(l_name) || '_' || erp_id || '@iba.edu.pk';
        
        BEGIN
            INSERT INTO users (erp, name, email, password, role)
            VALUES (erp_id, full_name, email_addr, '$2a$10$4r8D5gJGiqNuaPTR6qrxHeYlkUKl2nba97oZH.55EMivPEW8HoLe2', 'student');
        EXCEPTION
            WHEN unique_violation THEN
                -- Gracefully ignore if random generator produces an absolute duplicate email
                NULL;
        END;
    END LOOP;
END $$;


-- 5. INSERT REALISTIC IBA KARACHI BUILDINGS (MAIN & CITY CAMPUSES)
-- Explicitly insert the designated "Test Building" first to protect existing tests
INSERT INTO buildings (id, name, location) VALUES
('99999999-9999-4999-8999-999999999999', 'Test Building', 'Main Campus');

-- Insert other authentic campus blocks
INSERT INTO buildings (name, location) VALUES
('Adamjee Academic Center', 'Main Campus'),
('Abdul Razzak Tabba Building', 'Main Campus'),
('Aman Center for Entrepreneurial Development', 'Main Campus'),
('Fauji Foundation Building', 'Main Campus'),
('Alumni Students Center', 'Main Campus'),
('Mian Abdullah Library', 'Main Campus'),
('Gani & Tayub Academic Block', 'Main Campus'),
('FCS Technology Block', 'Main Campus'),
('NBP Multipurpose Building', 'Main Campus'),
('Aman Tower', 'City Campus'),
('Faysal Academic Block', 'City Campus'),
('Towfiq Chinoy Building', 'City Campus'),
('HBL Academic Center', 'City Campus'),
('Vaneza Administrative Block', 'City Campus'),
('JS Auditorium & Block', 'City Campus');


-- 6. INSERT ROOMS
-- Explicitly insert the test rooms first to preserve compatibility with existing tests
INSERT INTO rooms (id, building_id, name, capacity, type) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-9999-4999-8999-999999999999', 'Test Room A', 30, 'Classroom'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-9999-4999-8999-999999999999', 'Test Room B', 20, 'Meeting Room');

-- Automatically generate 4 rooms for every newly added building
DO $$
DECLARE
    b_record RECORD;
    room_types room_type[] := ARRAY['Classroom'::room_type, 'Seminar Hall'::room_type, 'Computer Lab'::room_type, 'Meeting Room'::room_type];
    r_type room_type;
    cap int;
    i int;
BEGIN
    FOR b_record IN SELECT id, name FROM buildings WHERE id != '99999999-9999-4999-8999-999999999999' LOOP
        FOR i IN 1..4 LOOP
            r_type := room_types[i];
            
            IF r_type = 'Seminar Hall' THEN cap := 100;
            ELSIF r_type = 'Classroom' THEN cap := 50;
            ELSIF r_type = 'Computer Lab' THEN cap := 35;
            ELSE cap := 15; -- Meeting Room
            END IF;

            BEGIN
                INSERT INTO rooms (building_id, name, capacity, type)
                VALUES (
                    b_record.id,
                    b_record.name || ' - Room ' || (100 + i)::text,
                    cap,
                    r_type
                );
            EXCEPTION
                WHEN unique_violation THEN
                    NULL;
            END;
        END LOOP;
    END LOOP;
END $$;


-- 7. GENERATE MASSIVE RANDOMIZED BOOKINGS (PAST, CURRENT, FUTURE)
-- We attempt to insert 800 random bookings. Postgres exception handling automatically
-- skips records that violate slot overlaps or duplicate user constraints.
DO $$
DECLARE
    user_ids UUID[];
    room_ids UUID[];
    total_users int;
    total_rooms int;
    
    u_id UUID;
    r_id UUID;
    s_id int;
    b_date date;
    b_status booking_status;
    b_purpose text;
    b_reviewer UUID;
    
    d_offset int;
    i int;
    total_iterations int := 800; -- Scale this higher to stress-test your DB further
    
    purposes text[] := ARRAY[
        'FYP Group Discussion Session', 
        'Database Systems Practical Prep', 
        'Accounting Midterm Study Session', 
        'Computer Science Seminar Series', 
        'Entrepreneurship Society Core Committee Meet', 
        'Fintech Guest Lecture Setup', 
        'Calculus Remedial Helpdesk', 
        'Management Case Study Rehearsals', 
        'Campus Placement Drive Warmup', 
        'Web Dev Project Hackathon Prep'
    ];
    statuses booking_status[] := ARRAY[
        'approved'::booking_status, 
        'pending'::booking_status, 
        'rejected'::booking_status, 
        'cancelled'::booking_status
    ];
    po_user_id UUID;
BEGIN
    SELECT array_agg(id) INTO user_ids FROM users WHERE role = 'student';
    SELECT array_agg(id) INTO room_ids FROM rooms;
    SELECT id INTO po_user_id FROM users WHERE role = 'programoffice' LIMIT 1;
    
    total_users := array_length(user_ids, 1);
    total_rooms := array_length(room_ids, 1);

    FOR i IN 1..total_iterations LOOP
        -- Select random variables
        u_id := user_ids[floor(random() * total_users) + 1];
        r_id := room_ids[floor(random() * total_rooms) + 1];
        s_id := floor(random() * 7) + 1;
        
        -- Distribute dates: some past (-30 to -1 days), some current (0), some future (+1 to +30 days)
        d_offset := floor(random() * 61) - 30;
        b_date := current_date + (d_offset * INTERVAL '1 day');
        
        -- Past bookings are mostly historically 'approved', 'rejected' or 'cancelled'
        IF d_offset < 0 THEN
            b_status := (ARRAY['approved'::booking_status, 'rejected'::booking_status, 'cancelled'::booking_status])[floor(random() * 3) + 1];
        ELSE
            -- Current/Future bookings can be any status (including pending)
            b_status := statuses[floor(random() * 4) + 1];
        END IF;

        b_purpose := purposes[floor(random() * array_length(purposes, 1)) + 1];
        
        -- Set reviewer ID for resolved items
        IF b_status IN ('approved'::booking_status, 'rejected'::booking_status) THEN
            b_reviewer := po_user_id;
        ELSE
            b_reviewer := NULL;
        END IF;

        -- Attempt to book: if constraints block this specific slot/user, move on
        BEGIN
            INSERT INTO bookings (user_id, room_id, slot_id, date, purpose, status, reviewed_by)
            VALUES (u_id, r_id, s_id, b_date, b_purpose, b_status, b_reviewer);
        EXCEPTION
            WHEN unique_violation THEN
                -- Skip overlapping booking requests and keep inserting
                NULL;
        END;
    END LOOP;
END $$;


-- 8. GENERATE BLOCKED SLOTS FOR MAINTENANCE & SYSTEM RESTRICTIONS
-- Inserts ~35 randomly blocked rooms for maintenance or academic exams
DO $$
DECLARE
    room_ids UUID[];
    total_rooms int;
    r_id UUID;
    s_id int;
    b_date date;
    admin_id UUID;
    d_offset int;
    i int;
    reasons text[] := ARRAY[
        'Central AC Compressor Maintenance',
        'Annual Academic Evaluation Exams',
        'Board of Governors Roundtable',
        'IBA Admission Test Preparation',
        'Scheduled Network Maintenance',
        'Facility Repair and Painting Works'
    ];
BEGIN
    SELECT array_agg(id) INTO room_ids FROM rooms;
    SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
    total_rooms := array_length(room_ids, 1);

    FOR i IN 1..35 LOOP
        r_id := room_ids[floor(random() * total_rooms) + 1];
        s_id := floor(random() * 7) + 1;
        
        -- Block slots primarily in the future (next 30 days)
        d_offset := floor(random() * 30) + 1;
        b_date := current_date + (d_offset * INTERVAL '1 day');

        BEGIN
            INSERT INTO blocked_slots (room_id, slot_id, date, reason, blocked_by)
            VALUES (r_id, s_id, b_date, reasons[floor(random() * array_length(reasons, 1)) + 1], admin_id);
        EXCEPTION
            WHEN unique_violation THEN
                -- Skip block if slot is already occupied/blocked
                NULL;
        END;
    END LOOP;
END $$;


-- 9. RE-INJECT TEST-SPECIFIC FUTURE BOOKING (Maintains exact test compliance for your setup)
INSERT INTO bookings (user_id, room_id, slot_id, date, purpose, status)
SELECT 
    id, 
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 
    1, 
    current_date + INTERVAL '7 days', 
    'Existing Booking for Conflict Test', 
    'approved'
FROM users 
WHERE erp = 'test-student'
LIMIT 1
ON CONFLICT DO NOTHING;