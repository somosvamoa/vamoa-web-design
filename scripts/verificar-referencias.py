"""Check the static site's references, screen inventory and image exports."""

import hashlib
import json
import re
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
ERRORS = []


def reference(value, owner):
    if not value or value.startswith(('http:', 'https:', 'data:', 'mailto:', 'tel:', '#', 'blob:', 'javascript:')):
        return
    path = unquote(urlsplit(value).path)
    if not path:
        return
    target = ROOT / path.lstrip('/') if path.startswith('/') else owner.parent / path
    if not target.exists():
        ERRORS.append(f'{owner.relative_to(ROOT)}: referencia ausente {value}')


class References(HTMLParser):
    def __init__(self, owner):
        super().__init__()
        self.owner = owner

    def handle_starttag(self, tag, attributes):
        values = dict(attributes)
        for key in ('src', 'href', 'poster', 'data-src'):
            reference(values.get(key), self.owner)
        if 'style' in values:
            ERRORS.append(f'{self.owner.relative_to(ROOT)}: estilo estático incrustado')


def main():
    pages = [*ROOT.glob('*.html'), *(ROOT / 'guia').glob('*.html')]
    for page in pages:
        text = page.read_text()
        References(page).feed(text)
        if any(token in text for token in ('__bundler', 'data:image', 'data:font', '<style')):
            ERRORS.append(f'{page.relative_to(ROOT)}: recurso incrustado')
        for _, body in re.findall(r'<script\b([^>]*)>(.*?)</script>', text, re.S):
            if body.strip():
                ERRORS.append(f'{page.relative_to(ROOT)}: script o datos incrustados')

    for css in [*(ROOT / 'styles').glob('*.css'), *(ROOT / 'guia').glob('*.css')]:
        for _, value in re.findall(r'url\(\s*([\"\']?)([^\)\"\']+)\1\s*\)', css.read_text()):
            reference(value, css)

    views = json.loads((ROOT / 'assets/app/vistas.json').read_text())
    integration = json.loads((ROOT / 'assets/app/lienzo-integracion.json').read_text())
    assert len(views) == integration['views']
    assert len({view['id'] for view in views}) == len(views)
    assert {item['id'] for item in integration['boards']} <= {view['id'] for view in views}
    captures = []
    for view in views:
        for markup in [view['phone'], *view.get('phoneByRole', {}).values()]:
            References(ROOT / 'guia/pantalla.html').feed(markup)
            if 'data:image' in markup:
                ERRORS.append(f'{view["id"]}: imagen incrustada')
        for capture in view['captures']:
            name = capture['file'] + '.png'
            captures.append(name)
            reference('../assets/app/capturas/' + name, ROOT / 'guia/pantalla.html')
    assert len(captures) == len(set(captures)) == integration['captures']

    catalog = json.loads((ROOT / 'assets/recursos.json').read_text())
    for item in catalog:
        path = ROOT / item['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256'], item['file']
    for item in json.loads((ROOT / 'assets/origenes.json').read_text()):
        assert hashlib.sha256((ROOT / item['archivo']).read_bytes()).hexdigest() == item['sha256'], item['archivo']

    web = json.loads((ROOT / 'assets/web/vistas.json').read_text())
    assert len({view['id'] for view in web['vistas']}) == len(web['vistas'])
    assert {view['seccion'] for view in web['vistas']} <= {section['id'] for section in web['secciones']}
    web_files = set()
    for view in web['vistas']:
        for kind in ('movil', 'escritorio'):
            path = ROOT / view[kind]['archivo']
            web_files.add(path.name)
            if not path.exists():
                ERRORS.append(f'{view["id"]}: falta la captura {view[kind]["archivo"]}')
            elif hashlib.sha256(path.read_bytes()).hexdigest() != view[kind]['sha256']:
                ERRORS.append(f'{view["id"]}: la captura {view[kind]["archivo"]} no coincide con su hash')
        if view['diseno'].get('enlace'):
            reference(view['diseno']['enlace'], ROOT / 'guia/web-lienzo.html')
    sobrantes = {path.name for path in (ROOT / 'assets/web/capturas').iterdir()} - web_files
    if sobrantes:
        ERRORS.append(f'assets/web/capturas: capturas sin pantalla {sorted(sobrantes)}')

    mails = json.loads((ROOT / 'assets/correos/correos.json').read_text())
    assert len({mail['id'] for mail in mails['correos']}) == len(mails['correos'])
    mail_files = {'correos.json'}
    for item in [*mails['correos'], *mails['recursos']]:
        path = ROOT / item['archivo']
        mail_files.add(path.name)
        if not path.exists():
            ERRORS.append(f'assets/correos: falta {item["archivo"]}')
        elif hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
            ERRORS.append(f'assets/correos: {item["archivo"]} no coincide con su hash')
    sobrantes = {path.name for path in (ROOT / 'assets/correos').iterdir()} - mail_files
    if sobrantes:
        ERRORS.append(f'assets/correos: archivos sin correo {sorted(sobrantes)}')

    with zipfile.ZipFile(ROOT / 'guia/pantallas-vamoa.zip') as archive:
        for name in captures:
            assert archive.read('pantallas/' + name) == (ROOT / 'assets/app/capturas' / name).read_bytes(), name
        inventory = json.loads(archive.read('pantallas/inventario.json'))
        assert inventory == [{key: value for key, value in view.items() if key not in {'phone', 'phoneByRole'}} for view in views]

    if ERRORS:
        raise SystemExit('\n'.join(ERRORS))
    print(json.dumps({'pages': len(pages), 'views': len(views), 'captures': len(captures), 'web_views': len(web['vistas']), 'emails': len(mails['correos']), 'catalog_images': len(catalog), 'errors': 0}))


if __name__ == '__main__':
    main()
