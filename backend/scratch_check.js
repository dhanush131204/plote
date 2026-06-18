const prisma = require('./server/prisma');

async function run() {
  console.log("Fetching layouts...");
  const layouts = await prisma.layout.findMany();
  for (const layout of layouts) {
    console.log(`\nLayout ID: ${layout.id}, Name: ${layout.name}, Kind: ${layout.layoutKind}`);
    let plots = [];
    try {
      plots = JSON.parse(layout.plots || '[]');
    } catch (e) {
      console.error("Error parsing plots:", e.message);
    }
    console.log(`Number of plots/units: ${plots.length}`);
    
    let building = null;
    try {
      building = typeof layout.building === 'string' ? JSON.parse(layout.building || '{}') : layout.building;
    } catch (e) {
      console.error("Error parsing building:", e.message);
    }
    console.log(`Building structure floors:`, JSON.stringify(building?.floors?.map(f => ({ id: f.id, label: f.label, sortOrder: f.sortOrder, configs: f.configurations?.map(c => ({ id: c.id, label: c.label, status: c.status })) })), null, 2));
    
    // Check if there are plots/units in the layout
    const uniqueFloorsInPlots = [...new Set(plots.map(p => p.floor))];
    console.log("Unique floors in plots:", uniqueFloorsInPlots);
    console.log("Plot statuses:", plots.map(p => ({ id: p.id, floor: p.floor, status: p.status })));
  }
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
