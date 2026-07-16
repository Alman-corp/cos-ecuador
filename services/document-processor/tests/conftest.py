import pytest


@pytest.fixture
def sample_pdf_bytes():
    return b"%PDF-1.4 fake pdf content for testing"


@pytest.fixture
def sample_tax_text():
    return """
    CAPÍTULO I: DISPOSICIONES GENERALES

    Art. 1.- La presente Ley de Régimen Tributario Interno establece el marco legal
    para la determinación y liquidación de los tributos en Ecuador.

    Art. 2.- Son sujetos pasivos de los impuestos las personas naturales y jurídicas
    que realicen actividades económicas gravadas según esta Ley.

    Art. 3.- La administración tributaria corresponde al Servicio de Rentas Internas (SRI),
    organismo técnico autónomo con facultades determinadas en este cuerpo legal.

    Las resoluciones del SRI son de cumplimiento obligatorio para todos los contribuyentes
    según lo dispuesto en el Art. 5 de la Ley de Régimen Tributario Interno.

    Sección II: IMPUESTO AL VALOR AGREGADO

    Art. 52.- El IVA grava la transferencia de bienes muebles, la prestación de servicios,
    la importación de bienes y la transferencia de derechos de autor.

    Art. 53.- La tarifa general del IVA es del 12% sobre la base imponible.
    """


@pytest.fixture
def sample_metadata():
    return {
        "law_type": "LRTI",
        "article": "1",
        "category": "legislation",
    }
