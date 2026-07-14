from engines.documents_engine import DocumentsEngine, DocumentCreate


class TestDocumentsEngine:
    def test_create_document(self, engine, sample_doc_create):
        doc = engine.create_document(sample_doc_create)
        assert doc.id.startswith("doc-")
        assert doc.title == "Contrato de Prueba"
        assert doc.status == "active"
        assert doc.current_version == 1
        assert len(doc.versions) == 1

    def test_get_document(self, engine):
        doc = engine.get_document("doc-001")
        assert doc is not None
        assert doc.id == "doc-001"
        assert doc.title == "Contrato de Servicios Profesionales - Consultoría Tributaria"

    def test_get_document_not_found(self, engine):
        doc = engine.get_document("doc-nonexistent")
        assert doc is None

    def test_update_document(self, engine):
        updated = engine.update_document("doc-001", {"title": "Título Actualizado", "description": "Nueva descripción"})
        assert updated is not None
        assert updated.title == "Título Actualizado"
        assert updated.description == "Nueva descripción"

    def test_delete_document_soft_delete(self, engine):
        result = engine.delete_document("doc-001")
        assert result is True
        doc = engine.get_document("doc-001")
        assert doc is None
        assert engine._documents["doc-001"].status == "deleted"

    def test_list_documents_default(self, engine):
        docs, total = engine.list_documents(limit=20)
        assert len(docs) >= 14
        assert total >= 14

    def test_list_documents_type_filter(self, engine):
        docs, total = engine.list_documents(doc_type="factura")
        assert all(d.doc_type == "factura" for d in docs)
        assert total == 3

    def test_list_documents_search(self, engine):
        docs, total = engine.list_documents(search="due diligence")
        assert total >= 1
        assert any("Due Diligence" in d.title for d in docs)

    def test_list_documents_pagination(self, engine):
        docs_page1, total = engine.list_documents(page=1, limit=5)
        assert len(docs_page1) == 5
        docs_page2, _ = engine.list_documents(page=2, limit=5)
        assert len(docs_page2) == 5
        assert docs_page1[0].id != docs_page2[0].id

    def test_add_version_increments(self, engine):
        version = engine.add_version("doc-001", created_by="tester", notes="Nueva versión de prueba")
        assert version is not None
        assert version.version_number == 3
        assert version.doc_id == "doc-001"
        doc = engine.get_document("doc-001")
        assert doc.current_version == 3
        assert len(doc.versions) == 3

    def test_get_versions(self, engine):
        versions = engine.get_versions("doc-004")
        assert len(versions) == 3
        assert all(v.doc_id == "doc-004" for v in versions)

    def test_get_version(self, engine):
        version = engine.get_version("doc-004", "ver-004-1")
        assert version is not None
        assert version.version_number == 1

    def test_classify_document(self, engine):
        category = engine.classify_document("doc-005")
        assert category is not None
        assert category == "informes financieros"
        doc = engine.get_document("doc-005")
        assert doc.classified_category == "informes financieros"

    def test_ocr_document(self, engine):
        text = engine.ocr_document("doc-006")
        assert text is not None
        assert "FACTURA" in text
        doc = engine.get_document("doc-006")
        assert doc.ocr_text is not None

    def test_download_url(self, engine):
        url = engine.get_download_url("doc-001")
        assert url is not None
        assert "doc-001" in url
        assert "download" in url

    def test_get_audit_trail(self, engine):
        engine.get_document("doc-001")
        trail = engine.get_audit_trail("doc-001")
        assert len(trail) >= 1
        assert all(e.doc_id == "doc-001" for e in trail)

    def test_create_template(self, engine):
        tpl = engine.create_template({
            "name": "Template Test",
            "description": "Test template",
            "category": "formularios",
            "content": "Hola {{nombre}}",
            "variables": [{"name": "nombre", "type": "string", "required": True}],
        })
        assert tpl.id.startswith("tpl-")
        assert tpl.name == "Template Test"
        assert tpl.is_builtin is False

    def test_get_template(self, engine):
        tpl = engine.get_template("tpl-001")
        assert tpl is not None
        assert tpl.name == "Contrato de Servicios Profesionales"

    def test_list_templates_by_category(self, engine):
        templates = engine.list_templates(category="contratos")
        assert len(templates) == 2
        assert all(t.category == "contratos" for t in templates)

    def test_render_template(self, engine):
        rendered = engine.render_template("tpl-001", {"cliente": "TEST S.A."})
        assert rendered is not None
        assert "TEST S.A." in rendered
        assert "{{cliente}}" not in rendered

    def test_render_template_with_data_replaces_variables(self, engine):
        data = {
            "cliente": "Empresa XYZ",
            "ruc": "1799999999001",
            "servicio": "Consultoría tributaria",
            "valor": "5000",
            "fecha_inicio": "01/06/2026",
            "plazo": "12",
        }
        rendered = engine.render_template("tpl-001", data)
        assert rendered is not None
        assert "Empresa XYZ" in rendered
        assert "1799999999001" in rendered
        assert "Consultoría tributaria" in rendered
        assert "5000" in rendered
        assert "01/06/2026" in rendered
        assert "12" in rendered
        assert "{{" not in rendered

    def test_document_has_initial_version_on_create(self, engine, sample_doc_create):
        doc = engine.create_document(sample_doc_create)
        assert len(doc.versions) == 1
        v = doc.versions[0]
        assert v.version_number == 1
        assert v.doc_id == doc.id
        assert v.change_notes == "Versión inicial."
