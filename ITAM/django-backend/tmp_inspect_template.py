import io
import re
import zipfile
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.assets.import_template import build_import_workbook

wb = build_import_workbook()
bio = io.BytesIO()
wb.save(bio)
bio.seek(0)
z = zipfile.ZipFile(bio)
sheet = z.read("xl/worksheets/sheet1.xml").decode()
styles = z.read("xl/styles.xml").decode()

print("G2 cell:")
m = re.search(r'<c r="G2"[^>]*/>', sheet)
print(m.group(0) if m else "missing")

print("\nDate dataValidations:")
for m in re.finditer(r"<dataValidation[^>]*type=\"date\"[^>]*>", sheet):
    print(m.group(0))

print("\nCustom numFmts:")
for m in re.finditer(r'<numFmt numFmtId="(\d+)" formatCode="([^"]+)"', styles):
    print(m.group(1), m.group(2))

print("\ncellXfs:")
for i, xf in enumerate(re.findall(r"<xf[^>]+/>", styles)[:8]):
    print(i, xf)

if m:
    style_idx = int(re.search(r's="(\d+)"', m.group(0)).group(1))
    xfs = re.findall(r"<xf[^>]+/>", styles)
    print("\nG2 style index", style_idx, "->", xfs[style_idx])
