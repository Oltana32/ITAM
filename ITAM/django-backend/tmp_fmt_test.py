import io
import re
import zipfile

import openpyxl
from openpyxl.styles import NamedStyle
from openpyxl.styles.numbers import FORMAT_DATE_YYYYMMDD2, FORMAT_DATE_XLSX14, builtin_format_id

for fmt, label in [(FORMAT_DATE_YYYYMMDD2, "custom"), (FORMAT_DATE_XLSX14, "builtin")]:
    wb = openpyxl.Workbook()
    name = "d"
    style = NamedStyle(name=name)
    style.number_format = fmt
    wb.add_named_style(style)
    ws = wb.active
    ws.cell(2, 1).style = name
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    z = zipfile.ZipFile(bio)
    styles = z.read("xl/styles.xml").decode()
    cell = z.read("xl/worksheets/sheet1.xml").decode()
    match = re.search(r'<c r="A2"[^>]*/>', cell)
    idx = int(re.search(r's="(\d+)"', match.group(0)).group(1))
    xf = re.findall(r"<xf[^>]+/>", styles)[idx]
    print(label, "format=", fmt, "builtin_id=", builtin_format_id(fmt), "xf=", xf)
