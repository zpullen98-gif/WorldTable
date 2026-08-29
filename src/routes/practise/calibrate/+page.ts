import { loadCalibration } from '$lib/data';

/**
 * Prerendered shell reading the session client-side, /menu/costing's pattern.
 * The ladders are the same for every venue; the log is on the device.
 */
export const prerender = true;

export async function load() {
	return { calibration: await loadCalibration() };
}
