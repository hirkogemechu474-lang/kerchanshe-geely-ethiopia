/**
 * EV Range Calculator
 * Estimates driving range based on battery capacity and driving conditions
 */

export interface RangeParams {
  batteryCapacity: number; // kWh
  efficiency: number; // kWh per 100km
  temperature?: number; // °C
  terrain?: 'flat' | 'hilly' | 'mountain';
  speed?: number; // km/h
}

export interface RangeEstimate {
  optimal: number; // km
  realistic: number; // km
  worst: number; // km
}

export function calculateRange(params: RangeParams): RangeEstimate {
  const { batteryCapacity, efficiency, temperature = 20, terrain = 'flat', speed = 80 } = params;

  // Base range calculation
  const baseRange = (batteryCapacity / efficiency) * 100;

  // Temperature impact (-20% below 0°C, -10% below 10°C)
  let tempFactor = 1;
  if (temperature < 0) tempFactor = 0.8;
  else if (temperature < 10) tempFactor = 0.9;

  // Terrain impact
  const terrainFactors = { flat: 1, hilly: 0.85, mountain: 0.7 };
  const terrainFactor = terrainFactors[terrain];

  // Speed impact (optimal at 50-80 km/h)
  let speedFactor = 1;
  if (speed > 100) speedFactor = 0.8;
  else if (speed > 120) speedFactor = 0.7;

  const optimal = Math.round(baseRange);
  const realistic = Math.round(baseRange * tempFactor * terrainFactor * speedFactor);
  const worst = Math.round(realistic * 0.7);

  return { optimal, realistic, worst };
}
