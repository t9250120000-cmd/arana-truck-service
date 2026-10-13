const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../dist/script.js'), 'utf8');

function element(textContent = '', attributes = {}) {
  const listeners = new Map();
  const classes = new Set();
  return {
    textContent,
    href: '',
    dataset: {},
    addEventListener: (name, callback) => listeners.set(name, callback),
    click: () => listeners.get('click')?.(),
    getAttribute: (name) => attributes[name] ?? null,
    setAttribute: (name, value) => { attributes[name] = value; },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, active) => active ? classes.add(name) : classes.delete(name),
    },
  };
}

function setup() {
  const menu = element('', { 'aria-expanded': 'false' });
  const menuLabel = element('Открыть меню');
  const navigation = element();
  const navLink = element();
  menu.querySelector = () => menuLabel;
  navigation.querySelectorAll = () => [navLink];
  const output = element();
  const diagnosticLink = element();
  const mobileLink = element();
  const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
  const buttons = [...html.matchAll(/data-symptom="([^"]+)"/g)].map((match) => {
    const button = element();
    button.dataset.symptom = match[1];
    return button;
  });
  const single = {
    '.menu-toggle': menu, '.site-nav': navigation,
    '#selected-symptom': output, '#diagnostic-whatsapp': diagnosticLink,
  };
  const multiple = { '[data-symptom]': buttons, '[data-symptom-link]': [mobileLink] };
  vm.runInNewContext(source, {
    document: {
      querySelector: (selector) => single[selector] ?? null,
      querySelectorAll: (selector) => multiple[selector] ?? [],
    },
    window: { matchMedia: () => ({ matches: true }) },
  });
  return { menu, menuLabel, navLink, output, diagnosticLink, mobileLink, buttons };
}

test('Every symptom reaches both WhatsApp buttons, including a second selection', () => {
  const ui = setup();
  assert.equal(ui.buttons.length, 6);
  for (const button of [...ui.buttons, ui.buttons[0]]) {
    button.click();
    const expected = `Здравствуйте! Обращаюсь с сайта АРАНА. ${button.dataset.symptom}. Подскажите, пожалуйста, как лучше поступить.`;
    for (const link of [ui.diagnosticLink, ui.mobileLink]) {
      const target = new URL(link.href);
      assert.equal(target.origin, 'https://wa.me');
      assert.equal(target.pathname, '/79154276111');
      assert.equal(target.searchParams.get('text'), expected);
    }
    assert.equal(ui.output.textContent, button.dataset.symptom);
    assert.deepEqual(ui.buttons.filter((item) => item.getAttribute('aria-pressed') === 'true'), [button]);
  }
});

test('Mobile menu label and expanded state reset after choosing a section', () => {
  const ui = setup();
  ui.menu.click();
  assert.equal(ui.menu.getAttribute('aria-expanded'), 'true');
  assert.equal(ui.menuLabel.textContent, 'Закрыть меню');
  ui.navLink.click();
  assert.equal(ui.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(ui.menuLabel.textContent, 'Открыть меню');
});
