
/* ==========================================
   MIRROR MAZE - LEVEL CONFIGURATIONS

   All levels are stored here.

   Coordinates begin at zero:
   Row 0 = first row
   Column 0 = first column
========================================== */

const LEVELS = {

    /* ======================================
       LEVEL 1 - GREEN LASER
    ====================================== */

    1: {
        size: 5,

        rowClues: [1, 0, 0, 0, 0],
        columnClues: [0, 0, 0, 0, 1],

        lasers: [
            {
                name: "green",
                color: "#32ff65",

                source: { row: 0, col: 0 },
                target: { row: 4, col: 4 },

                // Laser starts moving right
                direction: { dr: 0, dc: 1 }
            }
        ],

        // Correct mirrors
        solution: [
            { row: 0, col: 4, angle: "\\" },
        ]
    },

/* ======================================
    LEVEL 2 - GREEN LASER
====================================== */

    2: {
        size: 5,

        rowClues: [2, 0, 0, 0, 0],
        columnClues: [1, 0, 0, 1, 0],

        lasers: [
            {
                name: "green",
                color: "#32ff65",

                source: { row: 3, col: 3 },
                target: { row: 1, col: 0 },

                // Laser starts moving right
                direction: { dr: -1, dc: 0 }
            }
        ],

        // Correct mirrors
        solution: [
            { row: 0, col: 0, angle: "/" },
            { row: 0, col: 3, angle: "\\" }
        ]
    },

    
    
/* ======================================
   LEVEL 3 - GREEN AND BLUE LASERS
====================================== */

3: {
    size: 5,

    // Correct number of mirrors in each row
    rowClues: [2, 0, 0, 0, 1],

    // Correct number of mirrors in each column
    columnClues: [1, 1, 0, 0, 1],

    lasers: [
        {
            name: "green",
            color: "#32ff65",

            source: { row: 1, col: 1 },
            target: { row: 4, col: 3 },

            // Green laser travels downward
            direction: { dr: 1, dc: 0 }
        },

        {
            name: "blue",
            color: "#38bdf8",

            source: { row: 3, col: 4 },
            target: { row: 1, col: 0 },

            // Blue laser travels upward
            direction: { dr: -1, dc: 0 }
        }
    ],

    // Correct mirror positions and directions
    solution: [
        { row: 0, col: 4, angle: "\\" },
        { row: 0, col: 0, angle: "/" },
        { row: 4, col: 1, angle: "\\" }
    ]
},

    /* ======================================
       ADD LEVEL 4
    ====================================== */

4: {
    size: 5,

    // Correct number of mirrors in each row
    rowClues: [0, 1, 0, 2, 0],

    // Correct number of mirrors in each column
    columnClues: [1, 0, 1, 1, 0],

    lasers: [
        {
            name: "green",
            color: "#32ff65",

            source: { row: 4, col: 2 },
            target: { row: 1, col: 4 },

            // Green laser travels downward
            direction: { dr: -1, dc: 0 }
        },

        {
            name: "blue",
            color: "#38bdf8",

            source: { row: 0, col: 0 },
            target: { row: 4, col: 3 },

            // Blue laser travels upward
            direction: { dr: 1, dc: 0 }
        }
    ],

    // Correct mirror positions and directions
    solution: [
        { row: 3, col: 0, angle: "\\" },
        { row: 1, col: 2, angle: "/" },
        { row: 3, col: 3, angle: "\\" }
    ]
},

 /* ======================================
       ADD LEVEL 5
    ====================================== */

5: {
    size: 5,

    // Number of mirrors in each row
    rowClues: [2, 0, 0, 2, 1],

    // Number of mirrors in each column
    columnClues: [1, 2, 0, 0, 2],

    // Blocked squares
    blocked: [
        { row: 2, col: 0 },
        { row: 2, col: 3 },
        { row: 1, col: 2 },
    ],

    lasers: [
        {
            name: "green",
            color: "#32ff65",

            source: { row: 4, col: 1 },
            target: { row: 0, col: 3 },

            // Travels upward
            direction: { dr: 0, dc: 1 }
        },

        {
            name: "blue",
            color: "#38bdf8",

            source: { row: 0, col: 0 },
            target: { row: 4, col: 0 },

            // Travels right
            direction: { dr: 0, dc: 1 }
        }
    ],

    // Correct solution
    solution: [
        { row: 0, col: 1, angle: "\\" },
        { row: 0, col: 4, angle: "\\" },
        { row: 3, col: 0, angle: "/" },
        { row: 3, col: 1, angle: "/" },
        { row: 4, col: 4, angle: "/" }
    ]
}

};

