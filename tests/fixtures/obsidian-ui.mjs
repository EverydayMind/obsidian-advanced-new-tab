// Minimal host adapter for real Svelte DOM tests; no fake Svelte implementation.
export const Platform = { isDesktop: true, isPhone: false, isMacOS: false };
export const getLanguage = () => 'en';
export class Modal { close() {} }
export class AbstractInputSuggest {}
export class Scope { register() {} }
export class Component {}
export class Notice {}
export class Setting {}
export class TFile {}
export const normalizePath = path => path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
export const getLinkpath = path => path.split('#')[0];
export const getIcon = () => undefined;
export class Menu {
    addItem() { return this; }
    addSeparator() { return this; }
    showAtMouseEvent() {}
}
export const Keymap = { isModEvent: event => event.ctrlKey || event.metaKey };
export function setIcon(el, name) {
    el.replaceChildren();
    const svg = el.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-icon', name);
    el.appendChild(svg);
}
export const getIconIds = () => ['file', 'search'];
