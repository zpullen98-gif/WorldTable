import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('static/service/oot-service.js', 'utf8');
function device(initial: Record<string, string> = {}, light = false, blocked = false) {
  const storage = new Map(Object.entries(initial));
  const attrs: Record<string, string> = {};
  const handlers: Record<string, (e: any) => void> = {};
  const events: any[] = [];
  const writes: string[] = [];
  const media: any = { matches: light, addEventListener: (name: string, fn: any) => { handlers['media:' + name] = fn; } };
  const document: any = {
    currentScript: { getAttribute: () => 'codex' }, readyState: 'loading',
    documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; }, style: {} },
    querySelectorAll: () => [], addEventListener: () => {}
  };
  const window: any = {
    localStorage: {
      getItem: (k: string) => { if (blocked) throw Error('blocked'); return storage.get(k) ?? null; },
      setItem: (k: string, v: string) => { if (blocked) throw Error('blocked'); writes.push(k); storage.set(k, v); }
    },
    matchMedia: () => media,
    addEventListener: (name: string, fn: any) => { handlers[name] = fn; },
    dispatchEvent: (e: any) => { events.push(e); }
  };
  const context = { window, document, CustomEvent: class { constructor(public type: string, public detail: any) {} } };
  runInNewContext(source, context);
  return { window, api: window.OOT.service, storage, writes, attrs, handlers, media, events, context };
}
describe('one service choice across Outside Of Time', () => {
  it('uses the explicit shared choice before an older World Table preference', () => {
    const d = device({ 'oot.service.v1': 'day', 'wt.prefs.v1': '{"service":"night"}' });
    expect(d.api.get()).toBe('day'); expect(d.attrs['data-service']).toBe('day');
    expect(d.writes).toEqual([]);
  });
  it('carries an existing valid World Table choice into the suite', () => {
    expect(device({ 'wt.prefs.v1': '{"service":"day"}' }).api.get()).toBe('day');
  });
  it('handles corrupt preferences and follows the operating system until a choice is made', () => {
    const d = device({ 'oot.service.v1': 'dusk', 'wt.prefs.v1': '{bad' }, true);
    expect(d.api.get()).toBe('day');
    d.media.matches = false; d.handlers['media:change']({}); expect(d.api.get()).toBe('night');
    d.api.set('day'); d.handlers['media:change']({}); expect(d.api.get()).toBe('day');
  });
  it('only writes the appearance key, leaves all progress and old preferences intact', () => {
    const d = device({ progress: 'keep', 'wt.prefs.v1': '{"units":"us"}' });
    expect(d.api.set('day')).toBe(true); expect(d.writes).toEqual(['oot.service.v1']);
    expect(d.storage.get('progress')).toBe('keep'); expect(d.storage.get('wt.prefs.v1')).toBe('{"units":"us"}');
    expect(d.api.set('invalid')).toBe(false); expect(d.api.get()).toBe('day');
  });
  it('updates another open room without writing a storage loop', () => {
    const d = device(); const seen: string[] = []; const unsubscribe = d.api.subscribe((v: string) => seen.push(v));
    d.storage.set('oot.service.v1', 'day'); d.handlers.storage({ key: 'oot.service.v1' });
    expect(d.api.get()).toBe('day'); expect(seen).toEqual(['night', 'day']); expect(d.writes).toEqual([]);
    unsubscribe(); d.api.set('night'); expect(seen).toHaveLength(2);
  });
  it('still changes appearance with storage blocked and installs once', () => {
    const d = device({}, false, true); const api = d.api;
    expect(api.set('day')).toBe(true); expect(d.attrs['data-service']).toBe('day');
    runInNewContext(source, d.context); expect(d.window.OOT.service).toBe(api);
  });
});

describe('the day and night control', () => {
  it('draws one small corner button and no Explore and guide panel', () => {
    expect(source).not.toMatch(/Explore/);
    expect(source).toMatch(/position:absolute!important;top:10px!important;right:10px!important/);
    expect(source).toMatch(/width:44px!important;height:44px!important/);
    expect(source).toMatch(/Switch to ' \+ next \+ ' service/);
  });
});
