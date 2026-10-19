"""Update the shared image catalog from the files and views in this repository."""

import hashlib
import json
import mimetypes
import os
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.avif'}
VIEW_NAMES = {
    'index.html': 'Landing', 'parati.html': 'Para ti',
    'restaurantes.html': 'Restaurantes', 'contacto.html': 'Contacto',
    'portales.html': 'Portales', 'portales-prototipo.html': 'Portales · prototipo anterior', 'guia/index.html': 'Marca y producto',
    'guia/app.html': 'App · guía', 'guia/app-lienzo.html': 'App · lienzo',
    'guia/pantalla.html': 'App · pantalla individual',
}


def screen_data():
    return json.loads((ROOT / 'assets/app/vistas.json').read_text())


class Dependencies(HTMLParser):
    def __init__(self):
        super().__init__()
        self.files = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == 'link' and attributes.get('rel') == 'stylesheet':
            self.files.append(attributes.get('href', ''))
        elif tag == 'script':
            self.files.append(attributes.get('src') or attributes.get('data-src', ''))


def view_sources(name):
    path = ROOT / name
    text = path.read_text()
    parser = Dependencies()
    parser.feed(text)
    sources = [(path, text)]
    for reference in parser.files:
        dependency = path.parent / reference
        if reference and dependency.is_file():
            sources.append((dependency, dependency.read_text()))
    return sources


def main():
    views = {name: view_sources(name) for name in VIEW_NAMES}
    screens = screen_data()
    captures = screens
    capture_views = {}
    for screen in captures:
        for variant in screen['captures']:
            path = 'assets/app/capturas/' + variant['file'] + '.png'
            query = '?id=' + quote(screen['id'])
            if variant['role']:
                query += '&rol=' + quote(variant['role'])
            capture_views[path] = [{
                'label': screen['id'] + ' · ' + screen['title'],
                'href': 'guia/pantalla.html' + query,
            }]

    items = []
    directories = [ROOT / 'assets']
    for path in sorted(p for directory in directories for p in directory.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        relative = path.relative_to(ROOT).as_posix()
        appearance = capture_views.get(relative, [])[:]
        is_capture = relative.startswith('assets/app/capturas/')
        if not is_capture:
            for name, sources in views.items():
                if any(
                    (reference := os.path.relpath(path, owner.parent).replace(os.sep, '/')) in text
                    or quote(reference, safe='/') in text
                    for owner, text in sources
                ):
                    appearance.append({'label': VIEW_NAMES[name], 'href': name})
            app_reference = os.path.relpath(path, ROOT / 'guia').replace(os.sep, '/')
            for screen in screens:
                content = screen.get('phone', '') + json.dumps(screen.get('phoneByRole', {}), ensure_ascii=False)
                if app_reference in content or quote(app_reference, safe='/') in content:
                    appearance.append({
                        'label': 'App · ' + screen['id'] + ' · ' + screen['title'],
                        'href': 'guia/pantalla.html?id=' + quote(screen['id']),
                    })
        items.append({
            'file': relative, 'name': path.name,
            'kind': 'capturas' if is_capture else 'originales',
            'mime': mimetypes.guess_type(path.name)[0],
            'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'views': appearance,
        })
    output = ROOT / 'assets/recursos.json'
    output.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({
        'originales': sum(item['kind'] == 'originales' for item in items),
        'capturas': sum(item['kind'] == 'capturas' for item in items),
        'catalogo': output.relative_to(ROOT).as_posix(),
    }))


if __name__ == '__main__':
    main()
