#!/usr/bin/env python3
"""Build the single-file web preview published as a Claude artifact.

Usage: npx expo export --platform web --output-dir <dir> && python3 scripts/build-web-preview.py <dir>
Writes <dir>/page.html: the whole app inlined in one page (no extra files to load), the Ionicons font
embedded as data, an on-screen error box for debugging from a phone screenshot, and a reset of the
address to "/" because Expo Router reads it to pick the screen.
"""
import base64, glob, re, sys

out = sys.argv[1]
js = open(glob.glob(f'{out}/_expo/static/js/web/entry-*.js')[0]).read()
for font in glob.glob(f'{out}/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.*.ttf'):
    rel = font[len(out):]
    js = js.replace(f'"{rel}"', '"data:font/ttf;base64,' + base64.b64encode(open(font, 'rb').read()).decode() + '"')
js = js.replace('</script', '<\\/script')
reset = re.search(r'<style id="expo-reset">.*?</style>', open(f'{out}/index.html').read(), re.S).group(0)
page = f'''<title>Heal App Preview</title>
<meta name="claude:viewport-fit-sides" content="cover">
{reset}
<style>body{{background:#F1F2F7;margin:0}} #heal-error{{font:14px -apple-system,sans-serif;color:#C2413B;padding:16px;white-space:pre-wrap}}</style>
<div id="root"></div>
<script>
(function(){{
  function show(m){{ var el=document.getElementById('heal-error'); if(!el){{ el=document.createElement('div'); el.id='heal-error'; document.body.prepend(el); }} el.textContent += 'Heal preview error: ' + m + '\\n'; }}
  window.addEventListener('error', function(e){{ show((e.message||'unknown') + (e.filename ? ' @ ' + e.filename + ':' + e.lineno : '')); }});
  window.addEventListener('unhandledrejection', function(e){{ show(String(e.reason && (e.reason.stack || e.reason.message) || e.reason)); }});
  if (location.pathname !== '/') {{ try {{ history.replaceState(null, '', '/' + location.hash); }} catch (e) {{ show('path: ' + e.message); }} }}
}})();
</script>
<script>
{js}
</script>
'''
open(f'{out}/page.html', 'w').write(page)
print(f'{out}/page.html', round(len(page) / 1e6, 2), 'MB')
