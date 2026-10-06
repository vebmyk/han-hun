const DEFAULTS = { enabled: true, mode: 'slash', skipLangCheck: false, disabledHosts: '' };
const $ = (id) => document.getElementById(id);

chrome.storage.sync.get(DEFAULTS).then((s) => {
  $('enabled').checked = s.enabled;
  $('mode').value = s.mode;
  $('skipLangCheck').checked = s.skipLangCheck;
  $('disabledHosts').value = s.disabledHosts;
});

function save() {
  chrome.storage.sync.set({
    enabled: $('enabled').checked,
    mode: $('mode').value,
    skipLangCheck: $('skipLangCheck').checked,
    disabledHosts: $('disabledHosts').value,
  }).then(() => {
    $('status').textContent = 'Lagret. Last inn åpne sider på nytt for å ta det i bruk.';
    setTimeout(() => { $('status').textContent = ''; }, 2500);
  });
}

['enabled', 'mode', 'skipLangCheck', 'disabledHosts'].forEach((id) =>
  $(id).addEventListener('change', save));
