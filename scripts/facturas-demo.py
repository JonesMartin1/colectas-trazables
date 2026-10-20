# Genera las facturas de DEMOSTRACIÓN de las colectas de la portada (scripts/casos-reales.json) en
# web/ejemplo/facturas/, y su índice hash SHA-256 → PDF. La web lo usa para que cualquiera baje la factura y
# compruebe con el verificador que coincide con la huella registrada en Hedera.
# Uso: python scripts/facturas-demo.py   (necesita PyMuPDF: pip install pymupdf)
# El contenido es fijo (sin fecha de hoy), así que volver a correrlo da los mismos PDF y los mismos hashes.
import hashlib, json, pathlib
import fitz

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DATOS = json.loads((RAIZ / "scripts" / "casos-reales.json").read_text(encoding="utf8"))
SALIDA = RAIZ / "web" / "ejemplo" / "facturas"
SALIDA.mkdir(parents=True, exist_ok=True)

pesos = lambda v: "$ " + f"{v:,.0f}".replace(",", ".")
indice = {}
for c in DATOS["casos"]:
    for n, g in enumerate(c["gastos"], 1):
        doc = fitz.open()
        p = doc.new_page(width=595, height=842)  # A4
        y = 60
        def linea(txt, x=50, tam=10, negrita=False, color=(0.12, 0.16, 0.2)):
            p.insert_text((x, y), txt, fontsize=tam, fontname="hebo" if negrita else "helv", color=color)
        p.draw_rect(fitz.Rect(40, 40, 555, 120), color=(0.05, 0.24, 0.23), width=1.2)
        linea(g["proveedor"], tam=15, negrita=True); y += 22
        linea(f"CUIT {g['cuit']} · Responsable inscripto"); y += 16
        linea("FACTURA B · N.º 0003-" + f"{int(g['cae'][-4:]):08d}", negrita=True); y += 16
        linea("Fecha de emisión: octubre de 2026"); y += 40
        linea("DEMOSTRACIÓN · SIN VALIDEZ FISCAL", tam=13, negrita=True, color=(0.75, 0.1, 0.1)); y += 16
        linea("Factura ficticia para la demo de Colectas Trazables (NEA Tech 2026). Empresa y CUIT inventados.", tam=8.5, color=(0.45, 0.1, 0.1)); y += 34
        linea("Cliente", tam=9, color=(0.4, 0.45, 0.45)); y += 14
        linea(c["organizador"]["nombre"], negrita=True); y += 14
        linea(f"CUIT {c['organizador']['cuit']} · Colecta: {c['titulo']}", tam=9); y += 34
        linea("Detalle", negrita=True); p.insert_text((330, y), "Cant.", fontsize=10, fontname="hebo"); p.insert_text((390, y), "Unitario", fontsize=10, fontname="hebo"); p.insert_text((480, y), "Importe", fontsize=10, fontname="hebo"); y += 8
        p.draw_line((50, y), (545, y), color=(0.7, 0.75, 0.74)); y += 18
        total = 0
        for desc, cant, unit in g["items"]:
            imp = cant * unit; total += imp
            linea(desc[:52], tam=9.5); p.insert_text((335, y), str(cant), fontsize=9.5, fontname="helv"); p.insert_text((390, y), pesos(unit), fontsize=9.5, fontname="helv"); p.insert_text((480, y), pesos(imp), fontsize=9.5, fontname="helv"); y += 18
        p.draw_line((50, y), (545, y), color=(0.7, 0.75, 0.74)); y += 22
        p.insert_text((390, y), "TOTAL", fontsize=12, fontname="hebo"); p.insert_text((480, y), pesos(total), fontsize=12, fontname="hebo"); y += 50
        linea(f"CAE N.º {g['cae']}", negrita=True); y += 14
        linea("Vencimiento del CAE: noviembre de 2026", tam=9); y += 14
        linea("En una factura real, el CAE se verifica en el sitio de ARCA.", tam=8.5, color=(0.4, 0.45, 0.45))
        doc.set_metadata({"title": f"Factura demo · {g['detalle']}", "author": "Colectas Trazables (demo)", "creationDate": "D:20261020000000", "modDate": "D:20261020000000", "producer": "facturas-demo.py", "creator": "facturas-demo.py"})
        nombre = f"{c['clave']}-{n}.pdf"
        datos = doc.tobytes(garbage=4, deflate=True, no_new_id=True)
        (SALIDA / nombre).write_bytes(datos)
        h = hashlib.sha256(datos).hexdigest()
        indice[h] = f"/ejemplo/facturas/{nombre}"
        assert total == sum(q * u for _, q, u in g["items"])
        print(nombre, pesos(total), h[:12])
(SALIDA / "index.json").write_text(json.dumps(indice, indent=2), encoding="utf8")
print(len(indice), "facturas →", SALIDA)
