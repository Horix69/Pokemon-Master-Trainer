for (const mode of ['singleplayer','multiplayer']) {
  document.getElementById(mode).addEventListener('click', () => {
    document.querySelector('.welcome').hidden = true;
    document.getElementById('gameShell').hidden = false;
    window.dispatchEvent(new CustomEvent('choose-mode',{detail:mode}));
  });
}

const themeKey = 'pmt1999.theme';
function applyTheme(value) {
  const theme = value === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#000000' : '#f3efe4';
}
try { applyTheme(localStorage.getItem(themeKey)); } catch { applyTheme('light'); }
const settingsButton = document.getElementById('settings');
settingsButton.addEventListener('click', () => {
  const field = document.createElement('label');
  field.className = 'field';
  field.textContent = 'Tema da interface';
  const select = document.createElement('select');
  select.id = 'themeSelect';
  select.add(new Option('Tema claro', 'light'));
  select.add(new Option('Tema escuro', 'dark'));
  select.value = document.documentElement.dataset.theme;
  select.addEventListener('change', () => {
    applyTheme(select.value);
    try { localStorage.setItem(themeKey, select.value); } catch {}
  });
  field.append(select);
  document.getElementById('content').prepend(field);
});
document.getElementById('menuSettings').addEventListener('click', () => {
  settingsButton.click();
  document.getElementById('themeSelect').focus();
});
