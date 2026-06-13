const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function seed() {
  try {
    // 1. Get the user dhanushpdhanushp40@gmail.com
    const user = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get("dhanushpdhanushp40@gmail.com");
    if (!user) {
      console.error("User dhanushpdhanushp40@gmail.com not found!");
      return;
    }
    const userId = user.id;
    console.log("Found user ID:", userId);

    // 2. Insert the layout
    const slug = `emerald-tower-${Date.now()}`;
    const name = "Emerald Heights Tower";
    const layoutKind = "building";
    const status = "published";
    
    const initialBuilding = {
      floors: [],
      towers: [{ id: "A", label: "Tower A" }],
      embed3dUrl: null,
      facadeImagePath: null
    };

    const stmt = db.prepare(
      'INSERT INTO layouts (userId, name, slug, overlayConfig, plots, phaseInfo, webhookUrl, layoutKind, building, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(userId, name, slug, '{}', '[]', '{}', null, layoutKind, JSON.stringify(initialBuilding), status);
    
    const layout = db.prepare('SELECT id FROM layouts WHERE id = last_insert_rowid()').get();
    const layoutId = layout.id;
    console.log("Created layout with ID:", layoutId);

    // 3. Define paths and copy images
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const projectDir = path.join(uploadDir, String(layoutId));
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const srcFacade = path.join(__dirname, '..', '..', 'sample_facade.png');
    const srcFloor = path.join(__dirname, '..', '..', 'sample_floor_plan.png');

    const destFacade = path.join(projectDir, 'facade.png');
    const destFloor = path.join(projectDir, 'floor-f1.png');

    fs.copyFileSync(srcFacade, destFacade);
    fs.copyFileSync(srcFloor, destFloor);
    console.log("Copied sample images to uploads directory.");

    // 4. Update data with floor configurations and calibrated units
    const floorId = "f1";
    const plots = [
      {
        id: `${layoutId}-101`,
        number: "101",
        floor: floorId,
        tower: "A",
        beds: 2,
        areaCent: 1.2,
        areaSqft: 1200,
        facing: "East",
        status: "Available",
        pricePerSqft: 4500,
        estimatedPrice: 5400000
      },
      {
        id: `${layoutId}-102`,
        number: "102",
        floor: floorId,
        tower: "A",
        beds: 3,
        areaCent: 1.6,
        areaSqft: 1600,
        facing: "North",
        status: "Pending",
        pricePerSqft: 4800,
        estimatedPrice: 7680000
      }
    ];

    const building = {
      floors: [
        {
          id: floorId,
          label: "Floor 1",
          sortOrder: 0,
          imagePath: `${layoutId}/floor-f1.png`,
          configurations: [
            {
              id: "2bhk",
              label: "2 BHK Deluxe",
              imagePath: null,
              videoPath: null,
              areaSqft: 1200,
              areaSqm: 111,
              pricePerSqft: 4500,
              description: "Elegant 2 BHK with modern amenities"
            },
            {
              id: "3bhk",
              label: "3 BHK Premium",
              imagePath: null,
              videoPath: null,
              areaSqft: 1600,
              areaSqm: 148,
              pricePerSqft: 4800,
              description: "Spacious 3 BHK overlooking green landscapes"
            }
          ]
        }
      ],
      towers: [
        { id: "A", label: "Tower A" }
      ],
      embed3dUrl: null,
      facadeImagePath: `${layoutId}/facade.png`
    };

    // Overlay config (calibrated polygons/rectangles for units on the floor plan)
    const overlayConfig = {
      byFloor: {
        [floorId]: {
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
      facadeByFloor: {
        [floorId]: {
          points: [
            [10, 50],
            [90, 50],
            [90, 80],
            [10, 80]
          ]
        }
      }
    };

    const phaseInfo = {
      layoutName: "Block A - Prime Tower",
      badges: ["RERA Approved", "New Launch"],
      description: "Premium luxury residences in the heart of the city.",
      phone: "+919876543210",
      whatsapp: "+919876543210"
    };

    db.prepare(`
      UPDATE layouts 
      SET plots = ?, building = ?, overlayConfig = ?, phaseInfo = ?, imagePath = ?
      WHERE id = ?
    `).run(
      JSON.stringify(plots), 
      JSON.stringify(building), 
      JSON.stringify(overlayConfig), 
      JSON.stringify(phaseInfo),
      `${layoutId}/facade.png`,
      layoutId
    );

    console.log(`Successfully created Emerald Heights Tower! Public URL: http://localhost:5173/v/${slug}`);
  } catch (err) {
    console.error("Failed to seed:", err);
  }
}

seed();
