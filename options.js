// Dictionary sites discuss "hen" as a word, so they start out disabled; keep in sync with content.js.
const DICTIONARY_HOSTS = ['ordnett.no', 'naob.no', 'ordbokene.no', 'ordbok.uib.no', 'dokpro.uio.no'];
const DEFAULTS = { enabled: true, mode: 'slash', skipLangCheck: false, skipQuoted: false, disabledHosts: DICTIONARY_HOSTS.join('\n') };
const $ = (id) => document.getElementById(id);

chrome.storage.sync.get(DEFAULTS).then((s) => {
  $('enabled').checked = s.enabled;
  $('mode').value = s.mode;
  $('skipLangCheck').checked = s.skipLangCheck;
  $('skipQuoted').checked = s.skipQuoted;
  $('disabledHosts').value = s.disabledHosts;
});

function save() {
  chrome.storage.sync.set({
    enabled: $('enabled').checked,
    mode: $('mode').value,
    skipLangCheck: $('skipLangCheck').checked,
    skipQuoted: $('skipQuoted').checked,
    disabledHosts: $('disabledHosts').value,
  }).then(() => {
    $('status').textContent = 'Lagret. Last inn åpne sider på nytt for å ta det i bruk.';
    setTimeout(() => { $('status').textContent = ''; }, 2500);
  });
}

['enabled', 'mode', 'skipLangCheck', 'skipQuoted', 'disabledHosts'].forEach((id) =>
  $(id).addEventListener('change', save));
