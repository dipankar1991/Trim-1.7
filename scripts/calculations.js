// Roll property calculations
function calculateRollProperties(gsm, caliper, coreOD, rollOD, width) {
    console.log('Calculating properties:', { gsm, caliper, coreOD, rollOD, width });

    // Convert mm to meters for calculations
    const coreRadius = coreOD / 2000; // meters
    const rollRadius = rollOD / 2000;  // meters
    const widthM = width / 1000;       // meters

    // Calculate roll length (meters)
    const paperThickness = caliper / 1000000; // Convert mm to meters
    const length = (Math.PI * (Math.pow(rollRadius, 2) - Math.pow(coreRadius, 2))) / paperThickness;

    // Calculate nominal weight (kg)
    const weight = (gsm * length * widthM) / 1000;

    // Calculate roll density (kg/m³)
    const rollVolume = Math.PI * (Math.pow(rollRadius, 2) - Math.pow(coreRadius, 2)) * widthM;
    const density = weight / rollVolume;

    // Calculate pack count (simplified)
    const packCount = Math.max(1, Math.floor(weight / 50));

    const result = {
        rollDensity: Math.round(density * 100) / 100,
        length: Math.round(length),
        nominalWeight: Math.round(weight * 100) / 100,
        packCount: packCount
    };

    console.log('Calculated properties:', result);
    return result;
}
// 