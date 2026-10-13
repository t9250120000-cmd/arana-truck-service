const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '../dist', file), 'utf8');
const html = read('index.html');
const css = read('styles.css');

test('Owner-confirmed locality is consistent in visible copy and search metadata', () => {
  assert.doesNotMatch(html, /Мещерино/iu);
  assert.match(html, /<title>[^<]*Калиновке/);
  assert.match(html, /Грузовой автосервис · Калиновка/);
  assert.match(html, /Ленинский городской округ, деревня Калиновка/);
  const business = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(business.address.addressLocality, 'деревня Калиновка');
  assert.equal(business.address.addressRegion, 'Московская область');
  assert.equal(business.telephone, '+7-915-427-61-11');
  assert.equal(business.aggregateRating, undefined);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
  assert.equal(business.url, canonical);
  assert.ok(read('sitemap.xml').includes(`<loc>${canonical}</loc>`));
});

test('Core content and direct contact links do not depend on reveal JavaScript', () => {
  const rules = [...css.matchAll(/\.reveal\s*\{([^}]+)\}/g)];
  assert.ok(rules.length > 0);
  for (const [, rule] of rules) {
    assert.match(rule, /opacity:\s*1\s*;/);
    assert.match(rule, /transform:\s*none\s*;/);
  }
  assert.doesNotMatch(read('script.js'), /IntersectionObserver/);
  assert.match(html, /href="styles\.css\?v=20261013-2"/);
  assert.match(html, /src="script\.js\?v=20261013-2"/);
  const fallback = html.match(/<div id="diagnostic-fallback"[^>]*>([\s\S]*?)<\/div>/)[1];
  assert.match(fallback, /href="tel:\+79154276111"/);
  assert.match(fallback, /href="https:\/\/wa\.me\/79154276111\?text=/);
  assert.match(html, /class="diagnostic-panel reveal" hidden/);
  assert.match(html, /class="menu-toggle"[^>]+hidden/);
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1);
});
