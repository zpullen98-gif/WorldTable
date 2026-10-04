/**
 * The service worker's one piece of news the page shows in normal flow: the
 * whole guide is on this device now. UpdatePrompt registers the worker and
 * sets this; the layout draws the line directly under the modebar, so it is
 * never docked over a study row or a running timer (docs/study-menus-design.md,
 * 2.2.4). The Reload prompt asks for an act and stays docked.
 */
export const swStatus = $state({ offlineReady: false });
