export const USERS = {
    student: { erp: "test-student", password: "testpass" },
    student2: { erp: "test-student-2", password: "testpass" },
    po: { erp: "test-po", password: "testpass" },
    admin: { erp: "test-admin", password: "testpass" },
};

export const BUILDINGS = {
    testBuilding: { name: "Test Building", id: "99999999-9999-4999-8999-999999999999", location: "Main Campus" },
};

export const ROOMS = {
    testRoomA: {
        name: "Test Room A",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        buildingId: BUILDINGS.testBuilding.id,
        capacity: 30,
    },
    testRoomB: {
        name: "Test Room B",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        buildingId: BUILDINGS.testBuilding.id,
        capacity: 20,
    },
};
