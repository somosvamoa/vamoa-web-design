"""Refresh the asset ledger and the standalone screen export without rendering."""

import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    views = json.loads((ROOT / 'assets/app/vistas.json').read_text())
    inventory = [{key: value for key, value in view.items() if key not in {'phone', 'phoneByRole'}} for view in views]
    origins_path = ROOT / 'assets/origenes.json'
    previous = {item['archivo']: item for item in json.loads(origins_path.read_text())}
    imported = json.loads((ROOT / 'assets/importacion.json').read_text())['assets']
    provenance = {}
    for record in imported:
        provenance.setdefault(record['file'], []).append(record['source'])

    records = []
    for path in sorted((ROOT / 'assets').rglob('*')):
        if not path.is_file() or path.suffix not in {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff2', '.ttf', '.js'}:
            continue
        relative = path.relative_to(ROOT).as_posix()
        item = previous.get(relative, {'archivo': relative, 'vamoa': []}).copy()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if item.get('sha256') and item['sha256'] != digest:
            item.setdefault('sha256_original', item['sha256'])
        item['sha256'] = digest
        if relative in provenance:
            item['entrega'] = sorted(set(provenance[relative]))
        records.append(item)
    origins_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')

    archive = ROOT / 'guia/pantallas-vamoa.zip'
    temporary = archive.with_suffix('.tmp.zip')
    with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as output:
        count = 0
        for view in views:
            for capture in view['captures']:
                name = capture['file'] + '.png'
                output.write(ROOT / 'assets/app/capturas' / name, 'pantallas/' + name)
                count += 1
        output.writestr('pantallas/inventario.json', json.dumps(inventory, ensure_ascii=False, indent=2) + '\n')
        output.writestr('pantallas/LEEME.txt', (ROOT / 'assets/LEEME.txt').read_text())
    temporary.replace(archive)
    print(json.dumps({'origin_records': len(records), 'zip_captures': count}))


if __name__ == '__main__':
    main()
