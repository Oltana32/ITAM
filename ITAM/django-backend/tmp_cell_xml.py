import io
import re
import zipfile
from datetime import date

import openpyxl
from openpyxl.styles import NamedStyle
from openpyxl.styles.numbers import FORMAT_DATE_XLSX14
from openpyxl.utils.datetime import to_excel
from openpyxl.worksheet.datavalidation import DataValidation

DATE_MIN = str(int(to_excel(date(2000, 1, 1))))
DATE_MAX = str(int(to_excel(date(2100, 12, 31))))

wb = openpyxl.Workbook()
name = "itam_import_date"
style = NamedStyle(name=name)
style.number_format = FORMAT_DATE_XLSX14
wb.add_named_style(style)
ws = wb.active
dv = DataValidation(
    type="date",
    operator="between",
    formula1=DATE_MIN,
    formula2=DATE_MAX,
    allow_blank=True,
    showErrorMessage=True,
    showInputMessage=True,
)
dv.add("A2:A10")
ws.add_data_validation(dv)
for row in range(2, 11):
    ws.cell(row=row, column=1).style = name

bio = io.BytesIO()
wb.save(bio)
bio.seek(0)
z = zipfile.ZipFile(bio)
print(z.read("xl/worksheets/sheet1.xml").decode()[:800])
