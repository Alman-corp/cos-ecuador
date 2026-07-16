import pytest
from orchestrator.tools.ecuador_tax import (
    validate_ruc_ecuador,
    get_sri_calendar_by_digit,
    RETENTION_RATES,
)


class TestRUCValidation:
    def test_valid_pichincha_ruc(self):
        is_valid, ninth_digit, provincia = validate_ruc_ecuador("1790000002001")
        assert is_valid is True
        assert ninth_digit == 0
        assert provincia == "Pichincha"

    def test_valid_azuay_ruc(self):
        is_valid, ninth_digit, provincia = validate_ruc_ecuador("0190000002001")
        assert is_valid is True
        assert provincia == "Azuay"

    def test_invalid_province_code(self):
        is_valid, _, _ = validate_ruc_ecuador("2590000002001")
        assert is_valid is False

    def test_invalid_check_digit(self):
        is_valid, _, _ = validate_ruc_ecuador("1790000002000")
        assert is_valid is False

    def test_wrong_length(self):
        is_valid, _, _ = validate_ruc_ecuador("179000000200")
        assert is_valid is False

    def test_non_numeric(self):
        is_valid, _, _ = validate_ruc_ecuador("1790000002a01")
        assert is_valid is False


class TestSRICalendar:
    def test_returns_correct_number_of_obligations(self):
        calendar = get_sri_calendar_by_digit(1, 2026)
        assert calendar["ninth_digit"] == 1
        assert calendar["year"] == 2026
        # 24 monthly (IVA + Retenciones) + 4 ATS + 1 Renta = 29
        assert len(calendar["obligations"]) == 29

    def test_ninth_digit_1_due_on_day_10(self):
        calendar = get_sri_calendar_by_digit(1, 2026)
        first = calendar["obligations"][0]
        assert first["due_date"].endswith("-01-10")

    def test_ninth_digit_9_due_on_day_26(self):
        calendar = get_sri_calendar_by_digit(9, 2026)
        first = calendar["obligations"][0]
        assert first["due_date"].endswith("-01-26")

    def test_obligations_sorted_by_date(self):
        calendar = get_sri_calendar_by_digit(5, 2026)
        dates = [o["due_date"] for o in calendar["obligations"]]
        assert dates == sorted(dates)

    def test_includes_annual_income_tax(self):
        calendar = get_sri_calendar_by_digit(5, 2026)
        types = {o["type"] for o in calendar["obligations"]}
        assert "INCOME_TAX_ANNUAL" in types


class TestRetentionRates:
    def test_all_rates_are_positive(self):
        for rate in RETENTION_RATES.values():
            assert rate > 0

    def test_profesional_rate(self):
        assert RETENTION_RATES["profesional"] == 0.01

    def test_publicidad_highest_rate(self):
        assert RETENTION_RATES["publicidad"] == 0.30
