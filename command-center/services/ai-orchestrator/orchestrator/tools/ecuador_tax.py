from datetime import datetime, date, timedelta
from typing import Optional, Tuple


SRI_DUE_DAY_MAP = {
    1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
    6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
}

PROVINCIA_CODES = {
    "01": "Azuay", "02": "Bolívar", "03": "Cañar", "04": "Carchi",
    "05": "Cotopaxi", "06": "Chimborazo", "07": "El Oro", "08": "Esmeraldas",
    "09": "Guayas", "10": "Imbabura", "11": "Loja", "12": "Los Ríos",
    "13": "Manabí", "14": "Morona Santiago", "15": "Napo", "16": "Pastaza",
    "17": "Pichincha", "18": "Tungurahua", "19": "Zamora Chinchipe",
    "20": "Galápagos", "21": "Sucumbíos", "22": "Orellana",
    "23": "Santo Domingo de los Tsáchilas", "24": "Santa Elena",
}

RETENTION_RATES = {
    "profesional": 0.01,
    "otros": 0.02,
    "honorarios": 0.08,
    "consumibles": 0.10,
    "publicidad": 0.30,
}


def validate_ruc_ecuador(ruc: str) -> Tuple[bool, Optional[int], Optional[str]]:
    if len(ruc) != 13:
        return False, None, None
    if not ruc.isdigit():
        return False, None, None

    provincia_code = ruc[:2]
    if provincia_code not in PROVINCIA_CODES:
        return False, None, None

    if ruc[2] not in ("0", "1", "2", "3", "4", "5", "6", "9"):
        return False, None, None

    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    total = 0
    for i in range(9):
        valor = int(ruc[i]) * coeficientes[i]
        total += valor - 9 if valor >= 10 else valor

    digito_verificador = (10 - (total % 10)) % 10
    if digito_verificador != int(ruc[9]):
        return False, None, None

    if ruc[10:13] not in ("001",):
        return False, None, None

    ninth_digit = int(ruc[8])
    provincia = PROVINCIA_CODES.get(provincia_code)

    return True, ninth_digit, provincia


def get_sri_calendar_by_digit(ninth_digit: int, year: int = 2026) -> dict:
    due_day = SRI_DUE_DAY_MAP.get(ninth_digit, 28)
    obligations = []

    for month in range(1, 13):
        due_month = month + 1 if month < 12 else 1
        due_year = year if month < 12 else year + 1

        try:
            due_date = date(due_year, due_month, min(due_day, 28))
        except ValueError:
            due_date = date(due_year, due_month, 28)

        obligations.append({
            "type": "IVA_MONTHLY",
            "period": f"{year}-{month:02d}",
            "due_date": due_date.isoformat(),
            "description": f"Declaración IVA {due_date.strftime('%B')} {due_year}",
            "sri_form": "Formulario 104",
        })
        obligations.append({
            "type": "RETENTION_AT_SOURCE",
            "period": f"{year}-{month:02d}",
            "due_date": due_date.isoformat(),
            "description": f"Retenciones en la fuente {due_date.strftime('%B')} {due_year}",
            "sri_form": "Formulario 103",
        })

    for quarter in range(1, 5):
        quarter_end_month = quarter * 3
        due_month = quarter_end_month + 1
        due_date = date(year if due_month <= 12 else year + 1,
                       due_month if due_month <= 12 else due_month - 12,
                       min(due_day, 28))
        obligations.append({
            "type": "ATS_ANNEX",
            "period": f"{year}-Q{quarter}",
            "due_date": due_date.isoformat(),
            "description": f"Anexo Transaccional Simplificado Q{quarter} {year}",
            "sri_form": "Anexo ATS",
        })

    annual_due = date(year + 1, 4, min(due_day, 28))
    obligations.append({
        "type": "INCOME_TAX_ANNUAL",
        "period": str(year),
        "due_date": annual_due.isoformat(),
        "description": f"Declaración Impuesto a la Renta {year}",
        "sri_form": "Formulario 101",
    })

    return {
        "ninth_digit": ninth_digit,
        "year": year,
        "obligations": sorted(obligations, key=lambda o: o["due_date"]),
        "total": len(obligations),
    }
