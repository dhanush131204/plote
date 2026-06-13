const db = require('../server/db');

const plots = [
  {
    id: "p101",
    number: "101",
    floor: "f1781112343322",
    tower: "A",
    beds: 2,
    areaCent: 1.2,
    areaSqft: 1200,
    facing: "East",
    status: "Available",
    pricePerSqft: 5000,
    estimatedPrice: 6000000
  },
  {
    id: "p102",
    number: "102",
    floor: "f1781112343322",
    tower: "A",
    beds: 3,
    areaCent: 1.6,
    areaSqft: 1600,
    facing: "West",
    status: "Available",
    pricePerSqft: 5500,
    estimatedPrice: 8800000
  }
];

const building = {
  floors: [
    {
      id: "f1781112343322",
      label: "Floor 1",
      sortOrder: 0,
      imagePath: "62/floor-f1781112343322.png",
      configurations: [
        {
          id: "2bhk",
          label: "2 BHK",
          imagePath: null,
          videoPath: null,
          areaSqft: 1200,
          areaSqm: 111,
          pricePerSqft: 5000,
          description: "Premium 2 BHK Apartment with balcony"
        },
        {
          id: "3bhk",
          label: "3 BHK",
          imagePath: null,
          videoPath: null,
          areaSqft: 1600,
          areaSqm: 148,
          pricePerSqft: 5500,
          description: "Spacious 3 BHK Apartment"
        }
      ]
    },
    {
      id: "f1781112781245",
      label: "Floor 2",
      sortOrder: 1,
      imagePath: "62/floor-f1781112781245.png",
      configurations: []
    }
  ],
  towers: [
    { id: "A", label: "Tower A" }
  ],
  embed3dUrl: null,
  facadeImagePath: "62/facade.png"
};

const overlayConfig = {
  byFloor: {
    "f1781112343322": {
      "101": {
        points: [
          [5, 5],
          [48, 5],
          [48, 95],
          [5, 95]
        ]
      },
      "102": {
        points: [
          [52, 5],
          [95, 5],
          [95, 95],
          [52, 95]
        ]
      }
    }
  },
  facadeByFloor: {}
};

db.prepare(`
  UPDATE layouts 
  SET plots = ?, building = ?, overlayConfig = ?
  WHERE id = 62
`).run(JSON.stringify(plots), JSON.stringify(building), JSON.stringify(overlayConfig));

console.log("Database updated successfully with mock units and calibration outlines!");
