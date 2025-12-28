// export const radiusSteps = [10000, 20000, 30000]; // meters


/**
 * Radius expansion strategy (meters)
 * Used when insufficient donors are found
 */
export const radiusSteps = [10000, 20000, 30000]; // 10km → 20km → 30km

/**
 * Get radius based on attempt count
 */
export const getSearchRadius = (attempt = 0) => {
  return radiusSteps[attempt] || radiusSteps[radiusSteps.length - 1];
};