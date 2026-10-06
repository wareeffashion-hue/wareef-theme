"""Builds the landing page: inlines images and fonts as data URIs.
site/artifact.html: page body only (for claude.ai artifacts); site/index.html: full document for any static host."""
import base64, mimetypes, re, pathlib
root = pathlib.Path(__file__).parent
src = (root / 'src/index.html').read_text()
MIME = {'.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'}
def data(path):
    p = root / path
    return f"data:{MIME[p.suffix]};base64,{base64.b64encode(p.read_bytes()).decode()}"
out = re.sub(r'\{\{IMG:([^}]+)\}\}', lambda m: data('img/' + m.group(1)), src)
out = re.sub(r'\{\{FONT:([^}]+)\}\}', lambda m: data('fonts/' + m.group(1)), out)
assert '{{' not in out, 'unresolved token'
# Gamila's diacritics sit detached at display sizes; strip harakat (keep shadda) from visible text.
out = re.sub(r'(>[^<]*)', lambda m: re.sub('[\u064B-\u0650\u0652]', '', m.group(1)), out)
(root / 'artifact.html').write_text(out)
fav = data('img/favicon.png')
(root / 'index.html').write_text(f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="وريف: ثيم أزياء فاخر لمنصة سلة، 45 عنصراً للصفحة الرئيسية، وضع داكن وحركة سينمائية.">
<link rel="icon" href="{fav}">
</head>
<body>
{out}
</body>
</html>
''')
print('artifact.html', round(len(out) / 1024), 'KB')
