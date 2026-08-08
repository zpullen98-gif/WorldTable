/**
 * Screen wake lock for cook mode.
 *
 * A recipe app's worst failure mode is the screen going dark at minute three of
 * a five-minute sear, with both hands covered in flour. The lock is acquired on
 * cook-mode entry, re-acquired when the tab becomes visible again (the browser
 * silently releases it on tab switch), and released on exit.
 *
 * Returns a release function, or null where the API is unavailable — the
 * caller shows its "screen staying awake" indicator only on success, so the
 * user is never promised something the browser didn't grant.
 */
export async function acquireWakeLock(): Promise<(() => void) | null> {
	if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return null;

	let sentinel: WakeLockSentinel | null = null;
	let released = false;

	const request = async () => {
		try {
			sentinel = await navigator.wakeLock.request('screen');
		} catch {
			// Low battery, permissions policy, or an OS that says no — all fine.
			sentinel = null;
		}
	};

	await request();
	if (!sentinel) return null;

	const onVisibility = () => {
		if (document.visibilityState === 'visible' && !released) void request();
	};
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		released = true;
		document.removeEventListener('visibilitychange', onVisibility);
		void sentinel?.release();
	};
}
