/* -------- Courses -------- */

const courses = [

    {
        faculty: "faculty1",
        subject: "Data Structures",
        subjectCode: "CS301",
        department: "CSE",
        program: "CSE",
        sem: "3",
        section: "A",
        time: "08:30 - 09:30"
    },

    {
        faculty: "faculty1",
        subject: "Software Engineering",
        subjectCode: "CS302",
        department: "CSE",
        program: "CSD",
        sem: "3",
        section: "A",
        time: "10:30 - 11:30"
    },

    {
        faculty: "faculty1",
        subject: "DBMS",
        subjectCode: "CS303",
        department: "CSE",
        program: "CSD",
        sem: "3",
        section: "B",
        time: "09:30 - 10:30"
    },

    {
        faculty: "faculty2",
        subject: "Operating Systems",
        subjectCode: "CS501",
        department: "CSE",
        program: "AIML",
        sem: "5",
        section: "A",
        time: "08:30 - 09:30"
    },

    {
        faculty: "faculty2",
        subject: "Computer Networks",
        subjectCode: "CS502",
        department: "CSE",
        program: "CSE",
        sem: "5",
        section: "B",
        time: "09:30 - 10:30"
    }

]

/* -------- Students -------- */

const students = {

    "CSE_CSE_3_A": [
        { usn: "1AT24CG001", name: "Aiman", password: "1AT24CG001" },
        { usn: "1AT24CG002", name: "Rahman", password: "1AT24CG002" },
        { usn: "1AT24CG003", name: "Faizan", password: "1AT24CG003" }
    ],

    "CSE_CSD_3_A": [
        { usn: "1AT24CG011", name: "Ravi", password: "1AT24CG011" },
        { usn: "1AT24CG012", name: "Sneha", password: "1AT24CG012" }
    ],

    "CSE_CSD_3_B": [
        { usn: "1AT24CG013", name: "Ram", password: "1AT24CG013" },
        { usn: "1AT24CG014", name: "Neha", password: "1AT24CG014" }
    ],

    "CSE_AIML_5_A": [
        { usn: "1AT24CG021", name: "Imran", password: "1AT24CG021" },
        { usn: "1AT24CG022", name: "Sajid", password: "1AT24CG022" }
    ],

    "CSE_CSE_5_B": [
        { usn: "1AT24CG026", name: "Sakhir", password: "1AT24CG026" },
        { usn: "1AT24CG024", name: "Siraj", password: "1AT24CG024" }
    ]

}

/* -------- Programs under Departments -------- */

const programs = {

    CSE: ["CSE", "CSD", "AIML"],
    ISE: ["ISE"],
    ECE: ["ECE"],
    ME: ["ME"],
    CIVIL: ["CIVIL"]

}

/* -------- Timetable -------- */

const timetable = [

    {
        faculty: "faculty1",
        day: "Monday",
        time: "08:30",
        subject: "Data Structures",
        department: "CSE",
        program: "CSE",
        sem: "3",
        section: "A",
        room: "313"
    },

    {
        faculty: "faculty1",
        day: "Monday",
        time: "09:30",
        subject: "DBMS",
        department: "CSE",
        program: "CSD",
        sem: "3",
        section: "B",
        room: "205"
    },

    {
        faculty: "faculty1",
        day: "Tuesday",
        time: "08:30",
        subject: "Data Structures",
        department: "CSE",
        program: "CSE",
        sem: "3",
        section: "A",
        room: "313"
    },

    {
        faculty: "faculty1",
        day: "Wednesday",
        time: "09:30",
        subject: "DBMS",
        department: "CSE",
        program: "CSD",
        sem: "3",
        section: "B",
        room: "205"
    },

    {
        faculty: "faculty1",
        day: "Thursday",
        time: "08:30",
        subject: "Data Structures",
        department: "CSE",
        program: "CSE",
        sem: "3",
        section: "A",
        room: "313"
    },

    {
        faculty: "faculty1",
        day: "Friday",
        time: "09:30",
        subject: "DBMS",
        department: "CSE",
        program: "CSD",
        sem: "3",
        section: "B",
        room: "205"
    },

    {
        faculty: "faculty1",
        day: "Saturday",
        time: "08:30",
        subject: "Data Structures",
        department: "CSE",
        program: "CSE",
        sem: "3",
        section: "A",
        room: "313"
    },

    {
        faculty: "faculty1",
        day: "Saturday",
        time: "09:30",
        subject: "DBMS",
        department: "CSE",
        program: "CSD",
        sem: "3",
        section: "B",
        room: "413"
    },

    {
        faculty: "faculty2",
        day: "Monday",
        time: "08:30",
        subject: "Operating Systems",
        department: "CSE",
        program: "AIML",
        sem: "5",
        section: "A",
        room: "402"
    },

    {
        faculty: "faculty2",
        day: "Tuesday",
        time: "09:30",
        subject: "Computer Networks",
        department: "CSE",
        program: "CSE",
        sem: "5",
        section: "B",
        room: "402"
    },

    {
        faculty: "faculty2",
        day: "Thursday",
        time: "08:30",
        subject: "Operating Systems",
        department: "CSE",
        program: "AIML",
        sem: "5",
        section: "A",
        room: "402"
    }

]
