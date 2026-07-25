/**
 * Shared flag: has the live app context armed the store → widget sync
 * subscription (initSystems)? The widget headless task shares the app's JS
 * context whenever the process is alive, so the flag tells the click handler
 * that the subscription will redraw both widgets on its own — it must then
 * render nothing itself. In a cold headless context initSystems never ran,
 * the flag stays false and the handler does the drawing. Either way every
 * widget is drawn exactly once per tap, which kills the visible flicker.
 */
let armed = false

export function armWidgetLiveSync(): void {
  armed = true
}

export function widgetLiveSyncArmed(): boolean {
  return armed
}
