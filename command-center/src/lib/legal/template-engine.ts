import type {
  ContractTemplate,
  ContractDocument,
  ContractVersion,
  TemplateVariable,
  TemplateSection,
  DocumentTemplate,
} from './contract-types';

const TEMPLATES: Record<DocumentTemplate, ContractTemplate> = {
  'contrato-servicios-profesionales': {
    id: 'contrato-servicios-profesionales',
    name: 'Contrato de Prestación de Servicios Profesionales',
    description: 'Contrato para la prestación de servicios profesionales independientes bajo relación de dependencia no laboral',
    category: 'services',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['servicios', 'profesionales', 'honorarios', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'contratante_nombre', name: 'contratante_nombre', label: 'Nombre del contratante', type: 'string', required: true },
      { id: 'contratante_cedula', name: 'contratante_cedula', label: 'Cédula/RUC del contratante', type: 'string', required: true },
      { id: 'contratante_direccion', name: 'contratante_direccion', label: 'Dirección del contratante', type: 'string', required: true },
      { id: 'profesional_nombre', name: 'profesional_nombre', label: 'Nombre del profesional', type: 'string', required: true },
      { id: 'profesional_cedula', name: 'profesional_cedula', label: 'Cédula/RUC del profesional', type: 'string', required: true },
      { id: 'profesional_direccion', name: 'profesional_direccion', label: 'Dirección del profesional', type: 'string', required: true },
      { id: 'profesion', name: 'profesion', label: 'Profesión', type: 'string', required: true, placeholder: 'Abogado' },
      { id: 'numero_licencia', name: 'numero_licencia', label: 'Número de licencia profesional', type: 'string', required: false },
      { id: 'objeto_contrato', name: 'objeto_contrato', label: 'Objeto del contrato', type: 'string', required: true },
      { id: 'plazo_meses', name: 'plazo_meses', label: 'Plazo (meses)', type: 'number', required: true, defaultValue: '3' },
      { id: 'honorarios', name: 'honorarios', label: 'Honorarios mensuales', type: 'money', required: true },
      { id: 'forma_pago', name: 'forma_pago', label: 'Forma de pago', type: 'string', required: true, placeholder: 'Transferencia bancaria' },
      { id: 'incluir_arbitraje', name: 'incluir_arbitraje', label: 'Incluir cláusula de arbitraje', type: 'boolean', required: false, defaultValue: 'true' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Prestación de Servicios Profesionales, por una parte {{contratante_nombre}}, ecuatoriano(a), portador(a) de la cédula de identidad No. {{contratante_cedula}}, con domicilio en {{contratante_direccion}}, a quien en adelante se denominará "EL CONTRATANTE"; y, por otra parte {{profesional_nombre}}, ecuatoriano(a), portador(a) de la cédula de identidad No. {{profesional_cedula}}, {{profesion}} de profesión{{#if numero_licencia}}, con licencia profesional No. {{numero_licencia}}{{/if}}, con domicilio en {{profesional_direccion}}, a quien en adelante se denominará "EL PROFESIONAL". Los comparecientes son mayores de edad, capaces para contratar y obligarse, y libre y voluntariamente convienen en celebrar el presente contrato, al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- ANTECEDENTES',
        content: `EL CONTRATANTE requiere los servicios profesionales de {{profesion}} para {{objeto_contrato}}. EL PROFESIONAL declara tener la capacidad técnica, profesional y legal necesaria para la ejecución de dichos servicios.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- OBJETO DEL CONTRATO',
        content: `EL PROFESIONAL se obliga a prestar sus servicios profesionales a EL CONTRATANTE para {{objeto_contrato}} conforme a los términos y condiciones establecidos en el presente instrumento. EL PROFESIONAL desarrollará sus actividades con total independencia técnica y profesional, sin que exista relación de dependencia laboral con EL CONTRATANTE.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- PLAZO',
        content: `El plazo de duración del presente contrato será de {{plazo_meses}} meses, contados a partir de la fecha de suscripción del mismo. El contrato podrá ser renovado por acuerdo mutuo de las partes mediante la suscripción de un addéndum.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- HONORARIOS Y FORMA DE PAGO',
        content: `EL CONTRATANTE pagará a EL PROFESIONAL la cantidad de ${'$'}{{honorarios}} ({{honorarios}} dólares de los Estados Unidos de América) mensuales, por concepto de honorarios profesionales. El pago se realizará mediante {{forma_pago}} dentro de los primeros cinco días hábiles de cada mes. Se emitirá la correspondiente factura con la retención en la fuente aplicable conforme a la normativa tributaria ecuatoriana.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- OBLIGACIONES DEL PROFESIONAL',
        content: `Son obligaciones de EL PROFESIONAL: a) Ejecutar los servicios contratados con diligencia, eficiencia y conforme a la lex artis de su profesión; b) Mantener la confidencialidad de toda la información a la que tenga acceso; c) Informar periódicamente a EL CONTRATANTE sobre el avance de los trabajos; d) Cumplir con los plazos y estándares acordados; e) Facturar oportunamente sus honorarios.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- OBLIGACIONES DEL CONTRATANTE',
        content: `Son obligaciones de EL CONTRATANTE: a) Proporcionar la información y documentación necesaria para la ejecución de los servicios; b) Pagar los honorarios en la forma y plazos convenidos; c) Proporcionar un ambiente de trabajo adecuado cuando los servicios se realicen en sus instalaciones; d) Entregar las retenciones y certificados tributarios correspondientes.`,
        optional: false,
        order: 7,
      },
      {
        id: 'septima',
        title: 'SÉPTIMA.- INDEPENDENCIA DEL PROFESIONAL',
        content: `EL PROFESIONAL actúa como contratista independiente y no como empleado de EL CONTRATANTE. En tal virtud, EL PROFESIONAL asume todos los riesgos inherentes a su actividad profesional y no tendrá derecho a las prestaciones laborales, seguro social, fondos de reserva, utilidades, vacaciones, décimo tercero, décimo cuarto ni ningún otro beneficio establecido en el Código de Trabajo ecuatoriano, por no existir relación de dependencia.`,
        optional: false,
        order: 8,
      },
      {
        id: 'octava',
        title: 'OCTAVA.- CONFIDENCIALIDAD',
        content: `EL PROFESIONAL se obliga a mantener estricta confidencialidad sobre toda la información técnica, financiera, comercial o de cualquier naturaleza perteneciente a EL CONTRATANTE, a la que tenga acceso con ocasión del presente contrato. Esta obligación subsistirá aún después de terminado el contrato por un período de dos años.`,
        optional: false,
        order: 9,
      },
      {
        id: 'novena',
        title: 'NOVENA.- PROPIEDAD INTELECTUAL',
        content: `Los productos, informes, dictámenes, estudios y cualquier otro resultado del trabajo realizado por EL PROFESIONAL serán de propiedad exclusiva de EL CONTRATANTE, una vez que hayan sido pagados en su totalidad. EL PROFESIONAL se reserva el derecho de usar dichos trabajos como referencia profesional, siempre que no revele información confidencial.`,
        optional: false,
        order: 10,
      },
      {
        id: 'decima',
        title: 'DÉCIMA.- TERMINACIÓN ANTICIPADA',
        content: `Cualquiera de las partes podrá dar por terminado el presente contrato de forma anticipada, mediante notificación escrita con al menos 30 días de anticipación. En caso de incumplimiento de cualquiera de las obligaciones contractuales, la parte afectada podrá dar por terminado el contrato de forma inmediata, sin perjuicio de reclamar las indemnizaciones a que hubiere lugar.`,
        optional: false,
        order: 11,
      },
      {
        id: 'undecima',
        title: 'UNDÉCIMA.- ARBITRAJE',
        content: `Las partes convienen en someter cualquier controversia que se derive del presente contrato a arbitraje en derecho administrado por el Centro de Arbitraje y Conciliación de las Cámaras de la Producción del Ecuador, conforme a su reglamento. El laudo arbitral será definitivo e inapelable.`,
        optional: true,
        order: 12,
      },
      {
        id: 'duodecima',
        title: 'DUODÉCIMA.- NOTIFICACIONES',
        content: `Las partes señalan como domicilio para las notificaciones las direcciones indicadas en el preámbulo de este contrato. Cualquier cambio de domicilio deberá ser notificado por escrito a la otra parte.`,
        optional: false,
        order: 13,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en dos ejemplares de igual contenido y valor, en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{contratante_nombre}}
C.C. {{contratante_cedula}}
EL CONTRATANTE

___________________________
{{profesional_nombre}}
C.C. {{profesional_cedula}}
EL PROFESIONAL`,
        optional: false,
        order: 14,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-confidencialidad-nda': {
    id: 'contrato-confidencialidad-nda',
    name: 'Acuerdo de Confidencialidad (NDA)',
    description: 'Acuerdo de confidencialidad mutua para protección de información sensible',
    category: 'confidentiality',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['confidencialidad', 'nda', 'información', 'secreto empresarial'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del acuerdo', type: 'date', required: true },
      { id: 'parte_reveladora', name: 'parte_reveladora', label: 'Nombre de la Parte Reveladora', type: 'string', required: true },
      { id: 'parte_reveladora_ruc', name: 'parte_reveladora_ruc', label: 'RUC de la Parte Reveladora', type: 'string', required: true },
      { id: 'parte_receptora', name: 'parte_receptora', label: 'Nombre de la Parte Receptora', type: 'string', required: true },
      { id: 'parte_receptora_ruc', name: 'parte_receptora_ruc', label: 'RUC de la Parte Receptora', type: 'string', required: true },
      { id: 'propósito', name: 'propósito', label: 'Propósito de la divulgación', type: 'string', required: true },
      { id: 'plazo_confidencialidad', name: 'plazo_confidencialidad', label: 'Plazo de confidencialidad (años)', type: 'number', required: true, defaultValue: '3' },
      { id: 'es_mutuo', name: 'es_mutuo', label: 'Acuerdo mutuo (ambas partes revelan)', type: 'boolean', required: false, defaultValue: 'true' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Acuerdo de Confidencialidad, por una parte {{parte_reveladora}}, con RUC No. {{parte_reveladora_ruc}}, a quien en adelante se denominará "LA PARTE REVELADORA"; y, por otra parte {{parte_receptora}}, con RUC No. {{parte_receptora_ruc}}, a quien en adelante se denominará "LA PARTE RECEPTORA". Las partes celebran el presente acuerdo con el propósito de {{propósito}}, y convienen en las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- DEFINICIONES',
        content: `Por "Información Confidencial" se entenderá toda aquella información divulgada por LA PARTE REVELADORA a LA PARTE RECEPTORA, ya sea verbal, escrita, gráfica, electrónica o de cualquier otra forma, incluyendo pero no limitado a: secretos comerciales, datos financieros, planes de negocio, listas de clientes, metodologías, software, know-how, invenciones, procesos, fórmulas, diseños y cualquier otra información que al momento de la divulgación sea identificada como confidencial o que razonablemente deba entenderse como confidencial por su naturaleza.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- OBLIGACIONES DE CONFIDENCIALIDAD',
        content: `LA PARTE RECEPTORA se obliga a: a) Mantener la Información Confidencial en estricta reserva y secreto; b) No divulgar, publicar, copiar, reproducir o distribuir la Información Confidencial a terceros sin autorización previa y por escrito de LA PARTE REVELADORA; c) Utilizar la Información Confidencial únicamente para el Propósito establecido en el preámbulo; d) Restringir el acceso a la Información Confidencial solo a aquellos empleados o asesores que necesiten conocerla para el Propósito.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- EXCEPCIONES',
        content: `No se considerará Información Confidencial aquella que: a) Sea o llegue a ser de dominio público sin violación del presente acuerdo; b) Sea conocida previamente por LA PARTE RECEPTORA sin obligación de confidencialidad; c) Sea desarrollada independientemente por LA PARTE RECEPTORA sin uso de la Información Confidencial; d) Sea requerida por ley, orden judicial o autoridad competente, caso en el cual LA PARTE RECEPTORA deberá notificar inmediatamente a LA PARTE REVELADORA.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- PLAZO DE VIGENCIA',
        content: `Las obligaciones de confidencialidad establecidas en el presente acuerdo se mantendrán vigentes durante un plazo de {{plazo_confidencialidad}} años, contados a partir de la fecha de suscripción del presente instrumento.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- PROPIEDAD DE LA INFORMACIÓN',
        content: `La Información Confidencial divulgada en virtud del presente acuerdo seguirá siendo propiedad exclusiva de LA PARTE REVELADORA. Ninguna disposición de este acuerdo otorga a LA PARTE RECEPTORA derecho o licencia alguna sobre patentes, derechos de autor, secretos comerciales o cualquier otra propiedad intelectual de LA PARTE REVELADORA.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- INDEMNIZACIÓN',
        content: `LA PARTE RECEPTORA indemnizará y mantendrá indemne a LA PARTE REVELADORA por cualquier daño, pérdida, costo o gasto (incluyendo honorarios razonables de abogados) que surja como consecuencia del incumplimiento de las obligaciones de confidencialidad establecidas en el presente acuerdo.`,
        optional: false,
        order: 7,
      },
      {
        id: 'septima',
        title: 'SÉPTIMA.- DEVOLUCIÓN DE LA INFORMACIÓN',
        content: `A solicitud de LA PARTE REVELADORA, o al término del presente acuerdo, LA PARTE RECEPTORA deberá devolver o destruir toda la Información Confidencial recibida, incluyendo copias, extractos, notas y cualquier material que la contenga, certificando por escrito dicha destrucción o devolución.`,
        optional: false,
        order: 8,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente Acuerdo de Confidencialidad en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{parte_reveladora}}
RUC: {{parte_reveladora_ruc}}
LA PARTE REVELADORA

___________________________
{{parte_receptora}}
RUC: {{parte_receptora_ruc}}
LA PARTE RECEPTORA`,
        optional: false,
        order: 9,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-arrendamiento': {
    id: 'contrato-arrendamiento',
    name: 'Contrato de Arrendamiento',
    description: 'Contrato de arrendamiento de bien inmueble para uso comercial o residencial',
    category: 'rental',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['arrendamiento', 'inmueble', 'renta', 'alquiler', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'arrendador', name: 'arrendador', label: 'Nombre del arrendador', type: 'string', required: true },
      { id: 'arrendador_cedula', name: 'arrendador_cedula', label: 'Cédula/RUC del arrendador', type: 'string', required: true },
      { id: 'arrendatario', name: 'arrendatario', label: 'Nombre del arrendatario', type: 'string', required: true },
      { id: 'arrendatario_cedula', name: 'arrendatario_cedula', label: 'Cédula/RUC del arrendatario', type: 'string', required: true },
      { id: 'direccion_inmueble', name: 'direccion_inmueble', label: 'Dirección del inmueble', type: 'string', required: true },
      { id: 'descripcion_inmueble', name: 'descripcion_inmueble', label: 'Descripción del inmueble', type: 'string', required: true },
      { id: 'canon_arrendamiento', name: 'canon_arrendamiento', label: 'Canon mensual', type: 'money', required: true },
      { id: 'plazo_meses', name: 'plazo_meses', label: 'Plazo (meses)', type: 'number', required: true, defaultValue: '12' },
      { id: 'garantia', name: 'garantia', label: 'Garantía (valor)', type: 'money', required: true },
      { id: 'uso', name: 'uso', label: 'Uso del inmueble', type: 'string', required: true, placeholder: 'Comercial' },
      { id: 'incluir_clausula_penal', name: 'incluir_clausula_penal', label: 'Incluir cláusula penal', type: 'boolean', required: false, defaultValue: 'true' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Arrendamiento, por una parte {{arrendador}}, ecuatoriano(a), portador(a) de la cédula de identidad No. {{arrendador_cedula}}, a quien en adelante se denominará "EL ARRENDADOR"; y, por otra parte {{arrendatario}}, ecuatoriano(a), portador(a) de la cédula de identidad No. {{arrendatario_cedula}}, a quien en adelante se denominará "EL ARRENDATARIO". Las partes convienen en celebrar el presente contrato de arrendamiento, al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- ANTECEDENTES',
        content: `EL ARRENDADOR es legítimo propietario del inmueble ubicado en {{direccion_inmueble}}, que consiste en {{descripcion_inmueble}}. EL ARRENDADOR transfiere la tenencia del inmueble a EL ARRENDATARIO para su uso como {{uso}}.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- OBJETO',
        content: `EL ARRENDADOR da en arrendamiento a EL ARRENDATARIO, quien recibe, el inmueble ubicado en {{direccion_inmueble}}, descrito como {{descripcion_inmueble}}, para ser destinado exclusivamente a {{uso}}. EL ARRENDATARIO no podrá dar al inmueble un uso distinto al convenido sin autorización expresa y por escrito de EL ARRENDADOR.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- PLAZO',
        content: `El plazo del presente arrendamiento es de {{plazo_meses}} meses, contados desde la fecha de suscripción del contrato. El contrato se renovará automáticamente por períodos iguales si ninguna de las partes notifica su voluntad de terminarlo con al menos 30 días de anticipación al vencimiento del plazo.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- CANON DE ARRENDAMIENTO',
        content: `EL ARRENDATARIO pagará a EL ARRENDADOR la suma de ${'$'}{{canon_arrendamiento}} mensuales por concepto de canon de arrendamiento. El pago deberá realizarse dentro de los primeros cinco días de cada mes, mediante depósito o transferencia bancaria a la cuenta que indique EL ARRENDADOR. El canon podrá ser revisado anualmente conforme al Índice de Precios al Consumidor (IPC) publicado por el INEC.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- GARANTÍA',
        content: `EL ARRENDATARIO entrega a EL ARRENDADOR la suma de ${'$'}{{garantia}} en concepto de garantía del fiel cumplimiento de sus obligaciones. Dicha suma será devuelta al término del contrato, una vez comprobado que el inmueble se encuentra en buen estado y previa deducción de los valores que se adeuden por concepto de cánones impagos, servicios básicos o daños causados al inmueble.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- OBLIGACIONES DEL ARRENDATARIO',
        content: `EL ARRENDATARIO se obliga a: a) Pagar puntualmente el canon de arrendamiento; b) Pagar los servicios básicos y contribuciones; c) Usar el inmueble con diligencia y cuidado; d) No realizar modificaciones estructurales sin autorización; e) Permitir inspecciones previa notificación; f) Restituir el inmueble al término del contrato en el mismo estado que lo recibió, excepto el deterioro normal por uso.`,
        optional: false,
        order: 7,
      },
      {
        id: 'septima',
        title: 'SÉPTIMA.- OBLIGACIONES DEL ARRENDADOR',
        content: `EL ARRENDADOR se obliga a: a) Entregar el inmueble en buen estado, limpio y funcional; b) Mantener al arrendatario en el goce pacífico del inmueble; c) Realizar las reparaciones estructurales necesarias; d) Pagar los impuestos prediales y tasas municipales.`,
        optional: false,
        order: 8,
      },
      {
        id: 'octava',
        title: 'OCTAVA.- CLAUSULA PENAL',
        content: `En caso de mora en el pago del canon de arrendamiento, EL ARRENDATARIO pagará un interés de mora del 1% mensual sobre el valor adeudado. Si la mora se extiende por más de 60 días, EL ARRENDADOR podrá dar por terminado el contrato y exigir la desocupación inmediata del inmueble, sin perjuicio de cobrar los valores adeudados.`,
        optional: true,
        order: 9,
      },
      {
        id: 'novena',
        title: 'NOVENA.- TERMINACIÓN',
        content: `El presente contrato terminará por: a) Vencimiento del plazo; b) Mutuo acuerdo; c) Incumplimiento de cualquiera de las partes; d) Destrucción total o parcial del inmueble; e) Declaratoria de inhabitable del inmueble por autoridad competente.`,
        optional: false,
        order: 10,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{arrendador}}
C.C. {{arrendador_cedula}}
EL ARRENDADOR

___________________________
{{arrendatario}}
C.C. {{arrendatario_cedula}}
EL ARRENDATARIO`,
        optional: false,
        order: 11,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-compraventa': {
    id: 'contrato-compraventa',
    name: 'Contrato de Compraventa',
    description: 'Contrato de compraventa de bienes muebles o inmuebles',
    category: 'sale',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['compraventa', 'bien', 'inmueble', 'mueble', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'vendedor', name: 'vendedor', label: 'Nombre del vendedor', type: 'string', required: true },
      { id: 'vendedor_cedula', name: 'vendedor_cedula', label: 'Cédula/RUC del vendedor', type: 'string', required: true },
      { id: 'comprador', name: 'comprador', label: 'Nombre del comprador', type: 'string', required: true },
      { id: 'comprador_cedula', name: 'comprador_cedula', label: 'Cédula/RUC del comprador', type: 'string', required: true },
      { id: 'descripcion_bien', name: 'descripcion_bien', label: 'Descripción del bien', type: 'string', required: true },
      { id: 'precio_compraventa', name: 'precio_compraventa', label: 'Precio de compraventa', type: 'money', required: true },
      { id: 'forma_pago', name: 'forma_pago', label: 'Forma de pago', type: 'string', required: true, placeholder: 'Contado/Cheque certificado' },
      { id: 'tipo_bien', name: 'tipo_bien', label: 'Tipo de bien', type: 'select', required: true, options: ['inmueble', 'mueble', 'vehículo', 'maquinaria', 'mercadería', 'otro'] },
      { id: 'incluir_arraigo', name: 'incluir_arraigo', label: 'Incluir cláusula de arraigo', type: 'boolean', required: false, defaultValue: 'false' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Compraventa, por una parte {{vendedor}}, ecuatoriano(a), portador(a) de la cédula de identidad No. {{vendedor_cedula}}, a quien en adelante se denominará "EL VENDEDOR"; y, por otra parte {{comprador}}, ecuatoriano(a), portador(a) de la cédula de identidad No. {{comprador_cedula}}, a quien en adelante se denominará "EL COMPRADOR". Las partes libre y voluntariamente convienen en celebrar el presente contrato de compraventa, al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- OBJETO',
        content: `EL VENDEDOR vende y transfiere a EL COMPRADOR, quien compra y adquiere, el bien descrito como: {{descripcion_bien}}. EL VENDEDOR declara que el bien es de su exclusiva propiedad y que no existe limitación alguna al dominio, gravamen, prohibición de enajenar, embargo, hipoteca o cualquier otra restricción que afecte su transferencia.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- PRECIO Y FORMA DE PAGO',
        content: `EL COMPRADOR pagará a EL VENDEDOR la suma de ${'$'}{{precio_compraventa}} ({{precio_compraventa}} dólares de los Estados Unidos de América), como precio de la compraventa. El pago se realizará de la siguiente forma: {{forma_pago}}.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- ENTREGA',
        content: `EL VENDEDOR se obliga a entregar el bien a EL COMPRADOR en la fecha de suscripción del presente contrato, o en la fecha que las partes acuerden. La entrega se realizará en el lugar donde se encuentre el bien, y EL COMPRADOR declarará recibirlo a su entera satisfacción.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- TÍTULO Y GARANTÍA',
        content: `EL VENDEDOR garantiza que: a) Es el legítimo propietario del bien; b) El bien está libre de gravámenes, hipotecas, embargos o cualquier otra afectación; c) Tiene plena capacidad para transferir el dominio. En caso de evicción o vicios ocultos, EL VENDEDOR responderá conforme a lo dispuesto en el Código Civil ecuatoriano.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- ARRAIGO (INMUEBLES)',
        content: `EL COMPRADOR declara conocer que, para la transferencia de dominio de bienes inmuebles, deberá procederse a la inscripción en el Registro de la Propiedad correspondiente, siendo de su cargo los gastos notariales y registrales. EL VENDEDOR se obliga a suscribir las escrituras públicas necesarias.`,
        optional: true,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- CESIÓN DE DERECHOS',
        content: `EL COMPRADOR no podrá ceder los derechos derivados del presente contrato sin el consentimiento previo y por escrito de EL VENDEDOR.`,
        optional: false,
        order: 7,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{vendedor}}
C.C. {{vendedor_cedula}}
EL VENDEDOR

___________________________
{{comprador}}
C.C. {{comprador_cedula}}
EL COMPRADOR`,
        optional: false,
        order: 8,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-laboral': {
    id: 'contrato-laboral',
    name: 'Contrato de Trabajo (Indefinido)',
    description: 'Contrato de trabajo por tiempo indefinido según el Código de Trabajo ecuatoriano',
    category: 'labor',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['laboral', 'trabajo', 'indefinido', 'empleado', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'empleador', name: 'empleador', label: 'Nombre del empleador', type: 'string', required: true },
      { id: 'empleador_ruc', name: 'empleador_ruc', label: 'RUC del empleador', type: 'string', required: true },
      { id: 'trabajador', name: 'trabajador', label: 'Nombre del trabajador', type: 'string', required: true },
      { id: 'trabajador_cedula', name: 'trabajador_cedula', label: 'Cédula del trabajador', type: 'string', required: true },
      { id: 'cargo', name: 'cargo', label: 'Cargo del trabajador', type: 'string', required: true },
      { id: 'remuneracion', name: 'remuneracion', label: 'Remuneración mensual', type: 'money', required: true },
      { id: 'jornada', name: 'jornada', label: 'Jornada de trabajo', type: 'select', required: true, options: ['completa (8 horas diarias)', 'parcial', 'rotativa', 'nocturna'], defaultValue: 'completa (8 horas diarias)' },
      { id: 'horario', name: 'horario', label: 'Horario de trabajo', type: 'string', required: true, placeholder: '08:00 a 17:00' },
      { id: 'lugar_trabajo', name: 'lugar_trabajo', label: 'Lugar de trabajo', type: 'string', required: true },
      { id: 'fecha_inicio', name: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
      { id: 'periodo_prueba', name: 'periodo_prueba', label: 'Período de prueba (días)', type: 'number', required: false, defaultValue: '90' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Trabajo por Tiempo Indefinido, por una parte {{empleador}}, con RUC No. {{empleador_ruc}}, debidamente representado, a quien en adelante se denominará "EL EMPLEADOR"; y, por otra parte {{trabajador}}, ecuatoriano(a), portador(a) de la cédula de ciudadanía No. {{trabajador_cedula}}, a quien en adelante se denominará "EL TRABAJADOR". Las partes se someten al Código del Trabajo ecuatoriano y convienen en las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- ANTECEDENTES',
        content: `EL EMPLEADOR requiere los servicios de EL TRABAJADOR para desempeñar el cargo de {{cargo}}. EL TRABAJADOR declara tener la capacidad, experiencia y condiciones necesarias para el desempeño del citado cargo.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- OBJETO',
        content: `EL EMPLEADOR contrata los servicios de EL TRABAJADOR, y éste se obliga a prestar sus servicios lícitos y personales bajo relación de dependencia, desempeñando el cargo de {{cargo}}, con las funciones y responsabilidades propias del mismo, en el lugar de trabajo ubicado en {{lugar_trabajo}}.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- MODALIDAD Y PLAZO',
        content: `El presente contrato se celebra a plazo indefinido, conforme al Art. 14 del Código de Trabajo. Las relaciones laborales entre las partes se inician a partir del {{fecha_inicio}}. Se establece un período de prueba de {{periodo_prueba}} días, conforme al Art. 15 del Código de Trabajo.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- REMUNERACIÓN',
        content: `EL EMPLEADOR pagará a EL TRABAJADOR una remuneración mensual de ${'$'}{{remuneracion}}. Este valor incluye la remuneración básica y todos los complementos salariales. EL EMPLEADOR cumplirá con el pago de las obligaciones patronales, incluyendo aportes al IESS, décimo tercero, décimo cuarto, fondos de reserva y participación de utilidades conforme a la ley.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- JORNADA Y HORARIO',
        content: `EL TRABAJADOR cumplirá una jornada de {{jornada}}, en el horario de {{horario}}, de lunes a viernes. Se sujetará a lo dispuesto en el Art. 47 y siguientes del Código de Trabajo respecto a jornada máxima, horas extraordinarias y suplementarias.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- OBLIGACIONES DEL TRABAJADOR',
        content: `EL TRABAJADOR se obliga a: a) Desempeñar sus funciones con diligencia, eficiencia y lealtad; b) Cumplir la jornada y horario establecidos; c) Acatar las órdenes e instrucciones de sus superiores; d) Guardar reserva de la información confidencial; e) Cuidar los bienes del empleador; f) Someterse a los reglamentos internos; g) Mantener buenas relaciones con sus compañeros.`,
        optional: false,
        order: 7,
      },
      {
        id: 'septima',
        title: 'SÉPTIMA.- OBLIGACIONES DEL EMPLEADOR',
        content: `EL EMPLEADOR se obliga a: a) Pagar la remuneración puntualmente; b) Afiliar a EL TRABAJADOR al IESS desde el primer día; c) Proporcionar un ambiente de trabajo seguro y saludable; d) Proporcionar los implementos necesarios para el trabajo; e) Respetar los derechos laborales establecidos en el Código de Trabajo.`,
        optional: false,
        order: 8,
      },
      {
        id: 'octava',
        title: 'OCTAVA.- TERMINACIÓN',
        content: `El presente contrato podrá terminar por las causas establecidas en el Art. 169 del Código de Trabajo, incluyendo: visto bueno, desahucio, renuncia voluntaria, terminación por mutuo acuerdo, o por las causales de la Ley de Seguridad Social. En caso de despido intempestivo, EL EMPLEADOR pagará las indemnizaciones previstas en el Art. 188 del Código de Trabajo.`,
        optional: false,
        order: 9,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en dos ejemplares de igual contenido y valor, en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{empleador}}
RUC: {{empleador_ruc}}
EL EMPLEADOR

___________________________
{{trabajador}}
C.C. {{trabajador_cedula}}
EL TRABAJADOR`,
        optional: false,
        order: 10,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-plazo-fijo': {
    id: 'contrato-plazo-fijo',
    name: 'Contrato de Trabajo (Plazo Fijo)',
    description: 'Contrato de trabajo a plazo fijo según el Código de Trabajo ecuatoriano',
    category: 'labor',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['laboral', 'trabajo', 'plazo fijo', 'temporal', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'empleador', name: 'empleador', label: 'Nombre del empleador', type: 'string', required: true },
      { id: 'empleador_ruc', name: 'empleador_ruc', label: 'RUC del empleador', type: 'string', required: true },
      { id: 'trabajador', name: 'trabajador', label: 'Nombre del trabajador', type: 'string', required: true },
      { id: 'trabajador_cedula', name: 'trabajador_cedula', label: 'Cédula del trabajador', type: 'string', required: true },
      { id: 'cargo', name: 'cargo', label: 'Cargo', type: 'string', required: true },
      { id: 'remuneracion', name: 'remuneracion', label: 'Remuneración mensual', type: 'money', required: true },
      { id: 'jornada', name: 'jornada', label: 'Jornada', type: 'select', required: true, options: ['completa (8 horas diarias)', 'parcial', 'rotativa'], defaultValue: 'completa (8 horas diarias)' },
      { id: 'horario', name: 'horario', label: 'Horario', type: 'string', required: true, placeholder: '08:00 a 17:00' },
      { id: 'lugar_trabajo', name: 'lugar_trabajo', label: 'Lugar de trabajo', type: 'string', required: true },
      { id: 'fecha_inicio', name: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
      { id: 'fecha_fin', name: 'fecha_fin', label: 'Fecha de finalización', type: 'date', required: true },
      { id: 'causa_temporal', name: 'causa_temporal', label: 'Causa de la temporalidad', type: 'string', required: true, placeholder: 'Proyecto específico / temporada / reemplazo' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Trabajo a Plazo Fijo, por una parte {{empleador}}, con RUC No. {{empleador_ruc}}, a quien en adelante se denominará "EL EMPLEADOR"; y, por otra parte {{trabajador}}, portador(a) de la cédula de ciudadanía No. {{trabajador_cedula}}, a quien en adelante se denominará "EL TRABAJADOR". Al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- ANTECEDENTES',
        content: `EL EMPLEADOR requiere los servicios de EL TRABAJADOR para el cargo de {{cargo}}, para atender necesidades temporales consistentes en: {{causa_temporal}}, conforme al Art. 17 del Código de Trabajo.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- OBJETO Y PLAZO',
        content: `EL EMPLEADOR contrata los servicios de EL TRABAJADOR por el plazo fijo comprendido entre el {{fecha_inicio}} y el {{fecha_fin}}, para desempeñar el cargo de {{cargo}}. El presente contrato se celebra al amparo del Art. 17 del Código de Trabajo ecuatoriano.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- REMUNERACIÓN',
        content: `EL EMPLEADOR pagará a EL TRABAJADOR la remuneración mensual de ${'$'}{{remuneracion}}. EL EMPLEADOR cumplirá con el pago de aportes al IESS y demás beneficios de ley durante la vigencia del contrato.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- JORNADA Y HORARIO',
        content: `EL TRABAJADOR cumplirá una jornada de {{jornada}}, en el horario de {{horario}}, en las instalaciones de {{lugar_trabajo}}.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- OBLIGACIONES Y DERECHOS',
        content: `Son aplicables las mismas obligaciones y derechos establecidos en el Código de Trabajo para los contratos a plazo fijo. Al término del plazo, si EL TRABAJADOR continuare prestando servicios con conocimiento de EL EMPLEADOR, el contrato se convertirá en uno de tiempo indefinido conforme al Art. 17 del Código de Trabajo.`,
        optional: false,
        order: 6,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{empleador}}
RUC: {{empleador_ruc}}
EL EMPLEADOR

___________________________
{{trabajador}}
C.C. {{trabajador_cedula}}
EL TRABAJADOR`,
        optional: false,
        order: 7,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'acta-constitucion': {
    id: 'acta-constitucion',
    name: 'Acta de Constitución (Compañía Limitada)',
    description: 'Acta constitutiva para compañía de responsabilidad limitada según la Ley de Compañías ecuatoriana',
    category: 'corporate',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['constitución', 'compañía', 'limitada', 'sociedad', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha de la asamblea', type: 'date', required: true },
      { id: 'nombre_compania', name: 'nombre_compania', label: 'Nombre de la compañía', type: 'string', required: true },
      { id: 'objeto_social', name: 'objeto_social', label: 'Objeto social', type: 'string', required: true },
      { id: 'capital_social', name: 'capital_social', label: 'Capital social', type: 'money', required: true },
      { id: 'domicilio', name: 'domicilio', label: 'Domicilio de la compañía', type: 'string', required: true },
      { id: 'plazo_social', name: 'plazo_social', label: 'Plazo social (años)', type: 'number', required: true, defaultValue: '50' },
      { id: 'numero_socios', name: 'numero_socios', label: 'Número de socios', type: 'number', required: true },
      { id: 'socios_detalle', name: 'socios_detalle', label: 'Detalle de socios (nombre, cédula, aporte)', type: 'string', required: true },
      { id: 'administrador_nombre', name: 'administrador_nombre', label: 'Nombre del administrador/gerente', type: 'string', required: true },
      { id: 'administrador_cedula', name: 'administrador_cedula', label: 'Cédula del administrador/gerente', type: 'string', required: true },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'COMPARECIENTES',
        content: `En la ciudad de {{ciudad}}, a los {{fecha}}, ante el Notario comparecen los señores: {{socios_detalle}}, quienes son ecuatorianos, mayores de edad, capaces para contratar y obligarse. Los comparecientes declaran su voluntad de constituir una compañía de responsabilidad limitada, conforme a la Ley de Compañías ecuatoriana, al tenor de los siguientes estatutos:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'TÍTULO I.- NOMBRE, DOMICILIO, OBJETO Y PLAZO',
        content: `Artículo 1.- La compañía se denominará {{nombre_compania}} y se regirá por la Ley de Compañías y sus propios estatutos.
Artículo 2.- El domicilio principal de la compañía será en {{domicilio}}, pudiendo establecer sucursales, agencias o establecimientos en cualquier lugar del país o del extranjero.
Artículo 3.- El objeto social de la compañía será: {{objeto_social}}.
Artículo 4.- El plazo de duración de la compañía será de {{plazo_social}} años, contados desde la fecha de inscripción del contrato social en el Registro Mercantil.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'TÍTULO II.- CAPITAL Y PARTICIPACIONES',
        content: `Artículo 5.- El capital social de la compañía es de ${'$'}{{capital_social}}, dividido en participaciones sociales. Cada socio suscribe y paga los aportes detallados en la lista de suscripción.
Artículo 6.- El capital social se encuentra íntegramente suscrito y pagado en su totalidad, conforme lo exige la Ley de Compañías.
Artículo 7.- Las participaciones sociales son iguales, acumulables e indivisibles. La compañía llevará un libro de socios debidamente registrado.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TÍTULO III.- ADMINISTRACIÓN',
        content: `Artículo 8.- La administración de la compañía estará a cargo de la Junta General de Socios y del Gerente.
Artículo 9.- La Junta General de Socios es el órgano supremo de la compañía y estará conformada por todos los socios.
Artículo 10.- El Gerente será designado por la Junta General y durará en sus funciones el período que ésta determine. Se designa como Gerente al señor(a) {{administrador_nombre}}, portador(a) de la cédula No. {{administrador_cedula}}.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'TÍTULO IV.- JUNTA GENERAL',
        content: `Artículo 11.- La Junta General se reunirá ordinariamente al menos una vez al año, dentro de los tres meses siguientes a la finalización del ejercicio económico, y extraordinariamente cuando sea convocada por el Gerente o por socios que representen al menos el 10% del capital social.
Artículo 12.- Las resoluciones se tomarán por mayoría de votos, correspondiendo a cada participación un voto.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'TÍTULO V.- BALANCE Y DISTRIBUCIÓN DE UTILIDADES',
        content: `Artículo 13.- El ejercicio económico termina el 31 de diciembre de cada año. Al cierre, se elaborará el balance general y estado de pérdidas y ganancias.
Artículo 14.- Las utilidades líquidas se distribuirán a los socios en proporción a sus aportes, después de deducir el 5% para reserva legal y lo que determine la Junta para reservas facultativas.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'TÍTULO VI.- DISOLUCIÓN Y LIQUIDACIÓN',
        content: `Artículo 15.- La compañía se disolverá por las causales establecidas en la Ley de Compañías, incluyendo: a) Vencimiento del plazo social; b) Acuerdo de la Junta General; c) Imposibilidad de cumplir el objeto social; d) Pérdidas que reduzcan el patrimonio por debajo del 50% del capital social.
Artículo 16.- En caso de liquidación, se nombrará uno o más liquidadores quienes procederán conforme a la ley.`,
        optional: false,
        order: 7,
      },
      {
        id: 'firmas',
        title: 'CERTIFICACIÓN Y FIRMAS',
        content: `Certifico que el presente acta constitutivo contiene los estatutos de {{nombre_compania}}, aprobados por unanimidad por los socios fundadores.

___________________________
{{administrador_nombre}}
C.C. {{administrador_cedula}}
GERENTE`,
        optional: false,
        order: 8,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'poder-general': {
    id: 'poder-general',
    name: 'Poder General',
    description: 'Poder general para representación legal en actos civiles, mercantiles y administrativos',
    category: 'civil',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['poder', 'representación', 'mandato', 'apoderado', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'mandante', name: 'mandante', label: 'Nombre del mandante', type: 'string', required: true },
      { id: 'mandante_cedula', name: 'mandante_cedula', label: 'Cédula/RUC del mandante', type: 'string', required: true },
      { id: 'mandante_nacionalidad', name: 'mandante_nacionalidad', label: 'Nacionalidad del mandante', type: 'string', required: false, defaultValue: 'Ecuatoriana' },
      { id: 'mandante_estado_civil', name: 'mandante_estado_civil', label: 'Estado civil del mandante', type: 'string', required: false, defaultValue: 'Soltero/a' },
      { id: 'apoderado', name: 'apoderado', label: 'Nombre del apoderado', type: 'string', required: true },
      { id: 'apoderado_cedula', name: 'apoderado_cedula', label: 'Cédula/RUC del apoderado', type: 'string', required: true },
      { id: 'alcance_poder', name: 'alcance_poder', label: 'Alcance del poder', type: 'string', required: true, placeholder: 'Administrar bienes, representar en juicios, suscribir contratos' },
      { id: 'incluir_facultad_enajenar', name: 'incluir_facultad_enajenar', label: 'Incluir facultad de enajenar', type: 'boolean', required: false, defaultValue: 'false' },
      { id: 'plazo_poder', name: 'plazo_poder', label: 'Plazo del poder (años)', type: 'number', required: false, defaultValue: '5' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Yo, {{mandante}}, de nacionalidad {{mandante_nacionalidad}}, estado civil {{mandante_estado_civil}}, portador(a) de la cédula de identidad No. {{mandante_cedula}}, por el presente instrumento confiero PODER GENERAL a {{apoderado}}, portador(a) de la cédula de identidad No. {{apoderado_cedula}}, para que en mi nombre y representación pueda ejercer las siguientes facultades:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- FACULTADES GENERALES',
        content: `El apoderado queda facultado para realizar los siguientes actos: {{alcance_poder}}. En especial, podrá: a) Representarme en toda clase de juicios y procedimientos administrativos; b) Comparecer ante autoridades judiciales, administrativas, municipales y tributarias; c) Presentar y retirar documentos; d) Interponer recursos y acciones legales; e) Realizar cobros y pagos; f) Suscribir contratos de toda naturaleza.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- FACULTADES ESPECIALES PARA ENAJENAR',
        content: `Adicionalmente, y de forma expresa, confiero al apoderado facultad para: enajenar, hipotecar, permutar, dar en garantía, arrendar y administrar bienes muebles e inmuebles de mi propiedad, pudiendo suscribir las correspondientes escrituras públicas, contratos y documentos necesarios. Esta facultad incluye la posibilidad de fijar precios, condiciones y plazos, así como recibir el precio y otorgar las correspondientes cartas de pago.`,
        optional: true,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- FACULTADES ESPECIALES ADICIONALES',
        content: `El apoderado queda también facultado para: a) Constituir compañías, sociedades y asociaciones; b) Representarme en juntas de accionistas y socios; c) Abrir y cerrar cuentas bancarias; d) Girar, aceptar, endosar, avalar y protestar títulos valores; e) Suscribir pagarés, letras de cambio y cheques; f) Contratar seguros; g) Celebrar transacciones y someter a arbitraje.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- PLAZO',
        content: `El presente poder tendrá una vigencia de {{plazo_poder}} años, contados desde la fecha de otorgamiento, pudiendo ser revocado en cualquier momento por el mandante mediante notificación escrita al apoderado.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- RATIFICACIÓN',
        content: `El mandante ratifica desde ya todo cuanto el apoderado hubiere actuado al amparo de este poder, obligándose a cumplir y respetar todos los actos y contratos que el apoderado celebre en ejercicio de las facultades conferidas.`,
        optional: false,
        order: 6,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, otorgo el presente poder general en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{mandante}}
C.C. {{mandante_cedula}}
EL MANDANTE

___________________________
{{apoderado}}
C.C. {{apoderado_cedula}}
EL APODERADO`,
        optional: false,
        order: 7,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-prestamo': {
    id: 'contrato-prestamo',
    name: 'Contrato de Préstamo Mercantil',
    description: 'Contrato de préstamo mercantil con interés regulado por el Código de Comercio ecuatoriano',
    category: 'commercial',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['préstamo', 'mercantil', 'interés', 'mutuo', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'prestamista', name: 'prestamista', label: 'Nombre del prestamista', type: 'string', required: true },
      { id: 'prestamista_cedula', name: 'prestamista_cedula', label: 'Cédula/RUC del prestamista', type: 'string', required: true },
      { id: 'prestatario', name: 'prestatario', label: 'Nombre del prestatario', type: 'string', required: true },
      { id: 'prestatario_cedula', name: 'prestatario_cedula', label: 'Cédula/RUC del prestatario', type: 'string', required: true },
      { id: 'monto_prestamo', name: 'monto_prestamo', label: 'Monto del préstamo', type: 'money', required: true },
      { id: 'interes_anual', name: 'interes_anual', label: 'Interés anual (%)', type: 'number', required: true, defaultValue: '10' },
      { id: 'plazo_meses', name: 'plazo_meses', label: 'Plazo (meses)', type: 'number', required: true, defaultValue: '12' },
      { id: 'forma_pago', name: 'forma_pago', label: 'Forma de pago', type: 'select', required: true, options: ['cuotas mensuales', 'cuota única al vencimiento', 'cuotas trimestrales', 'cuotas semestrales'], defaultValue: 'cuotas mensuales' },
      { id: 'garantia', name: 'garantia', label: 'Garantía ofrecida', type: 'string', required: false, placeholder: 'Prenda / Hipoteca / Fianza solidaria' },
      { id: 'incluir_garante', name: 'incluir_garante', label: 'Incluir garante solidario', type: 'boolean', required: false, defaultValue: 'false' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Préstamo Mercantil, por una parte {{prestamista}}, portador(a) de la cédula de identidad No. {{prestamista_cedula}}, a quien en adelante se denominará "EL PRESTAMISTA"; y, por otra parte {{prestatario}}, portador(a) de la cédula de identidad No. {{prestatario_cedula}}, a quien en adelante se denominará "EL PRESTATARIO". Las partes celebran el presente contrato al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- OBJETO',
        content: `EL PRESTAMISTA da en préstamo mercantil a EL PRESTATARIO la suma de ${'$'}{{monto_prestamo}} ({{monto_prestamo}} dólares de los Estados Unidos de América), cantidad que EL PRESTATARIO declara recibir a su entera satisfacción en este acto, renunciando a la excepción de non numerata pecunia.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- INTERÉS',
        content: `El préstamo devengará un interés anual del {{interes_anual}}%, calculado sobre saldos deudores. El interés se pagará conjuntamente con cada cuota. Las partes declaran que la tasa de interés pactada no excede los límites establecidos por el Banco Central del Ecuador para operaciones mercantiles.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- PLAZO Y FORMA DE PAGO',
        content: `EL PRESTATARIO se obliga a devolver el capital e intereses en el plazo de {{plazo_meses}} meses, mediante {{forma_pago}}. El cronograma de pagos forma parte integrante del presente contrato.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- MORA',
        content: `En caso de mora en el pago de cualquier cuota, EL PRESTATARIO pagará un interés de mora del 1.5 veces la tasa de interés pactada, sin perjuicio de que EL PRESTAMISTA pueda exigir el pago total de la deuda (aceleración de plazos).`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- GARANTÍA',
        content: `Para garantizar el cumplimiento de sus obligaciones, EL PRESTATARIO constituye a favor de EL PRESTAMISTA la siguiente garantía: {{garantia}}. La garantía se formalizará en instrumento separado.`,
        optional: true,
        order: 6,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{prestamista}}
C.C. {{prestamista_cedula}}
EL PRESTAMISTA

___________________________
{{prestatario}}
C.C. {{prestatario_cedula}}
EL PRESTATARIO`,
        optional: false,
        order: 7,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-sociedad': {
    id: 'contrato-sociedad',
    name: 'Contrato de Sociedad (Asociación)',
    description: 'Contrato de sociedad civil o mercantil para desarrollo conjunto de actividades',
    category: 'partnership',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['sociedad', 'asociación', 'joint venture', 'cooperación', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'socio1', name: 'socio1', label: 'Nombre del Socio 1', type: 'string', required: true },
      { id: 'socio1_cedula', name: 'socio1_cedula', label: 'Cédula/RUC del Socio 1', type: 'string', required: true },
      { id: 'socio2', name: 'socio2', label: 'Nombre del Socio 2', type: 'string', required: true },
      { id: 'socio2_cedula', name: 'socio2_cedula', label: 'Cédula/RUC del Socio 2', type: 'string', required: true },
      { id: 'objeto_sociedad', name: 'objeto_sociedad', label: 'Objeto de la sociedad', type: 'string', required: true },
      { id: 'aporte_socio1', name: 'aporte_socio1', label: 'Aporte del Socio 1', type: 'string', required: true, placeholder: '$50,000 en efectivo' },
      { id: 'aporte_socio2', name: 'aporte_socio2', label: 'Aporte del Socio 2', type: 'string', required: true, placeholder: '$50,000 en especie' },
      { id: 'participacion_socio1', name: 'participacion_socio1', label: 'Porcentaje Socio 1 (%)', type: 'number', required: true, defaultValue: '50' },
      { id: 'participacion_socio2', name: 'participacion_socio2', label: 'Porcentaje Socio 2 (%)', type: 'number', required: true, defaultValue: '50' },
      { id: 'plazo_sociedad', name: 'plazo_sociedad', label: 'Plazo de la sociedad (años)', type: 'number', required: true, defaultValue: '10' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Sociedad, por una parte {{socio1}}, portador(a) de la cédula de identidad No. {{socio1_cedula}}, a quien en adelante se denominará "EL SOCIO 1"; y, por otra parte {{socio2}}, portador(a) de la cédula de identidad No. {{socio2_cedula}}, a quien en adelante se denominará "EL SOCIO 2". Las partes convienen en asociarse para {{objeto_sociedad}}, al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- OBJETO',
        content: `Las partes se asocian para desarrollar conjuntamente la siguiente actividad: {{objeto_sociedad}}. La sociedad tendrá carácter de sociedad civil o mercantil según se determine en el desarrollo de sus operaciones.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- APORTES',
        content: `EL SOCIO 1 aporta a la sociedad: {{aporte_socio1}}. EL SOCIO 2 aporta a la sociedad: {{aporte_socio2}}. Los aportes pasan a ser de propiedad de la sociedad y los socios no podrán retirarlos durante la vigencia del contrato.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- PARTICIPACIÓN EN PÉRDIDAS Y GANANCIAS',
        content: `Las utilidades y pérdidas de la sociedad se distribuirán entre los socios en la siguiente proporción: EL SOCIO 1: {{participacion_socio1}}%; EL SOCIO 2: {{participacion_socio2}}%. La distribución se realizará anualmente después del cierre del ejercicio económico.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- ADMINISTRACIÓN',
        content: `La administración de la sociedad corresponderá a ambos socios de forma conjunta, salvo que se designe a uno de ellos como administrador mediante acuerdo escrito. Para actos de disposición que excedan la administración ordinaria, se requerirá el consentimiento unánime de los socios.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- PLAZO Y DISOLUCIÓN',
        content: `La sociedad tendrá un plazo de duración de {{plazo_sociedad}} años, prorrogable por acuerdo unánime de los socios. La sociedad se disolverá por: a) Vencimiento del plazo; b) Mutuo acuerdo; c) Muerte o incapacidad de un socio; d) Imposibilidad de cumplir el objeto social; e) Decisión unilateral con preaviso de 90 días.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- LIQUIDACIÓN',
        content: `En caso de disolución, se procederá a la liquidación de la sociedad. El activo líquido resultante se distribuirá entre los socios en proporción a sus aportes, previo pago de las deudas sociales.`,
        optional: false,
        order: 7,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, los socios suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{socio1}}
C.C. {{socio1_cedula}}
EL SOCIO 1

___________________________
{{socio2}}
C.C. {{socio2_cedula}}
EL SOCIO 2`,
        optional: false,
        order: 8,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-consultoria': {
    id: 'contrato-consultoria',
    name: 'Contrato de Consultoría',
    description: 'Contrato de consultoría especializada para asesoramiento técnico o empresarial',
    category: 'consulting',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['consultoría', 'asesoría', 'consultor', 'proyecto', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'cliente', name: 'cliente', label: 'Nombre del cliente', type: 'string', required: true },
      { id: 'cliente_ruc', name: 'cliente_ruc', label: 'RUC del cliente', type: 'string', required: true },
      { id: 'consultor', name: 'consultor', label: 'Nombre del consultor', type: 'string', required: true },
      { id: 'consultor_ruc', name: 'consultor_ruc', label: 'RUC del consultor', type: 'string', required: true },
      { id: 'alcance_consultoria', name: 'alcance_consultoria', label: 'Alcance de la consultoría', type: 'string', required: true },
      { id: 'honorarios_totales', name: 'honorarios_totales', label: 'Honorarios totales', type: 'money', required: true },
      { id: 'plazo_ejecucion', name: 'plazo_ejecucion', label: 'Plazo de ejecución (meses)', type: 'number', required: true, defaultValue: '6' },
      { id: 'entregables', name: 'entregables', label: 'Entregables del proyecto', type: 'string', required: true },
      { id: 'cronograma_pagos', name: 'cronograma_pagos', label: 'Cronograma de pagos', type: 'string', required: true, placeholder: '30% al inicio, 40% intermedio, 30% final' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Consultoría, por una parte {{cliente}}, con RUC No. {{cliente_ruc}}, a quien en adelante se denominará "EL CLIENTE"; y, por otra parte {{consultor}}, con RUC No. {{consultor_ruc}}, a quien en adelante se denominará "EL CONSULTOR". Las partes celebran el presente contrato al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- OBJETO Y ALCANCE',
        content: `EL CONSULTOR se obliga a prestar los servicios de consultoría descritos a continuación: {{alcance_consultoria}}. El alcance detallado de los servicios consta en el Anexo A que forma parte integrante del presente contrato.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- ENTREGABLES',
        content: `EL CONSULTOR entregará a EL CLIENTE los siguientes productos: {{entregables}}. Cada entregable será presentado en formato digital y se considerará aceptado si EL CLIENTE no formula observaciones dentro de los 15 días hábiles siguientes a su recepción.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- PLAZO',
        content: `La consultoría se ejecutará en un plazo de {{plazo_ejecucion}} meses, contados desde la fecha de suscripción del contrato. El cronograma detallado consta en el Anexo B del presente contrato.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- HONORARIOS Y FORMA DE PAGO',
        content: `EL CLIENTE pagará a EL CONSULTOR la suma de ${'$'}{{honorarios_totales}} por concepto de honorarios. El pago se realizará conforme al siguiente cronograma: {{cronograma_pagos}}. Los pagos estarán sujetos a las retenciones de impuestos aplicables conforme a la Ley de Régimen Tributario Interno ecuatoriana.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- CONFIDENCIALIDAD',
        content: `EL CONSULTOR se obliga a mantener la más estricta confidencialidad sobre toda la información comercial, técnica, financiera y estratégica de EL CLIENTE a la que tenga acceso durante la ejecución de la consultoría. Esta obligación subsiste por 3 años después de terminado el contrato.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- PROPIEDAD INTELECTUAL',
        content: `Todos los derechos de propiedad intelectual sobre los entregables y resultados de la consultoría serán transferidos a EL CLIENTE una vez que se haya efectuado el pago total de los honorarios. EL CONSULTOR se reserva el derecho de usar su know-how y metodologías preexistentes.`,
        optional: false,
        order: 7,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{cliente}}
RUC: {{cliente_ruc}}
EL CLIENTE

___________________________
{{consultor}}
RUC: {{consultor_ruc}}
EL CONSULTOR`,
        optional: false,
        order: 8,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-proveedor': {
    id: 'contrato-proveedor',
    name: 'Contrato de Proveedor de Servicios',
    description: 'Contrato para relaciones comerciales continuas con proveedores de servicios o insumos',
    category: 'supplier',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['proveedor', 'servicios', 'suministro', 'contratista', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del contrato', type: 'date', required: true },
      { id: 'contratante', name: 'contratante', label: 'Nombre del contratante', type: 'string', required: true },
      { id: 'contratante_ruc', name: 'contratante_ruc', label: 'RUC del contratante', type: 'string', required: true },
      { id: 'proveedor', name: 'proveedor', label: 'Nombre del proveedor', type: 'string', required: true },
      { id: 'proveedor_ruc', name: 'proveedor_ruc', label: 'RUC del proveedor', type: 'string', required: true },
      { id: 'servicios_contratados', name: 'servicios_contratados', label: 'Servicios contratados', type: 'string', required: true },
      { id: 'precio_unitario', name: 'precio_unitario', label: 'Precio unitario de referencia', type: 'money', required: true },
      { id: 'plazo_vigencia', name: 'plazo_vigencia', label: 'Plazo de vigencia (meses)', type: 'number', required: true, defaultValue: '12' },
      { id: 'condiciones_pago', name: 'condiciones_pago', label: 'Condiciones de pago', type: 'select', required: true, options: ['contado', 'crédito 30 días', 'crédito 60 días', 'crédito 90 días'], defaultValue: 'crédito 30 días' },
      { id: 'nivel_servicio', name: 'nivel_servicio', label: 'Nivel de servicio (SLA)', type: 'string', required: false, placeholder: '99.5% disponibilidad' },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Proveedor de Servicios, por una parte {{contratante}}, con RUC No. {{contratante_ruc}}, a quien en adelante se denominará "EL CONTRATANTE"; y, por otra parte {{proveedor}}, con RUC No. {{proveedor_ruc}}, a quien en adelante se denominará "EL PROVEEDOR". Las partes convienen en celebrar el presente contrato al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- OBJETO',
        content: `EL PROVEEDOR se obliga a proveer los siguientes servicios a EL CONTRATANTE: {{servicios_contratados}}. El detalle de especificaciones técnicas y estándares de calidad consta en el Anexo técnico del presente contrato.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- PRECIO Y CONDICIONES DE PAGO',
        content: `El precio unitario de referencia por los servicios contratados es de ${'$'}{{precio_unitario}}. Las condiciones de pago son: {{condiciones_pago}}. Los precios podrán ser revisados anualmente conforme al IPC.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- NIVELES DE SERVICIO',
        content: `EL PROVEEDOR se obliga a cumplir los siguientes niveles de servicio: {{nivel_servicio}}. En caso de incumplimiento de los SLA, se aplicarán las penalidades establecidas en el Anexo de penalidades.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- PLAZO',
        content: `El presente contrato tendrá una vigencia de {{plazo_vigencia}} meses, contados desde su suscripción. Se renovará automáticamente por períodos iguales si ninguna de las partes notifica su terminación con 30 días de anticipación.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- OBLIGACIONES DEL PROVEEDOR',
        content: `EL PROVEEDOR se obliga a: a) Prestar los servicios con la calidad y estándares acordados; b) Cumplir los plazos de entrega; c) Mantener stock suficiente; d) Facturar oportunamente; e) Responder por vicios ocultos; f) Mantener confidencialidad de la información de EL CONTRATANTE.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- TERMINACIÓN',
        content: `Cualquiera de las partes podrá terminar el contrato sin responsabilidad si la otra parte incumple sus obligaciones esenciales y no las subsana dentro de 15 días de recibido el requerimiento por escrito.`,
        optional: false,
        order: 7,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{contratante}}
RUC: {{contratante_ruc}}
EL CONTRATANTE

___________________________
{{proveedor}}
RUC: {{proveedor_ruc}}
EL PROVEEDOR`,
        optional: false,
        order: 8,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'carta-compromiso': {
    id: 'carta-compromiso',
    name: 'Carta Compromiso',
    description: 'Carta compromiso de intención para formalizar acuerdos preliminares vinculantes',
    category: 'commercial',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['carta', 'compromiso', 'intención', 'preliminar', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'remitente', name: 'remitente', label: 'Nombre del remitente', type: 'string', required: true },
      { id: 'remitente_cargo', name: 'remitente_cargo', label: 'Cargo del remitente', type: 'string', required: true },
      { id: 'destinatario', name: 'destinatario', label: 'Nombre del destinatario', type: 'string', required: true },
      { id: 'destinatario_cargo', name: 'destinatario_cargo', label: 'Cargo del destinatario', type: 'string', required: true },
      { id: 'empresa_remitente', name: 'empresa_remitente', label: 'Empresa remitente', type: 'string', required: true },
      { id: 'empresa_destinatario', name: 'empresa_destinatario', label: 'Empresa destinatario', type: 'string', required: true },
      { id: 'objeto_compromiso', name: 'objeto_compromiso', label: 'Objeto del compromiso', type: 'string', required: true },
      { id: 'monto_referencial', name: 'monto_referencial', label: 'Monto referencial', type: 'money', required: false },
      { id: 'plazo_estimado', name: 'plazo_estimado', label: 'Plazo estimado', type: 'string', required: true, placeholder: '90 días' },
    ],
    sections: [
      {
        id: 'encabezado',
        title: 'ENCABEZADO',
        content: `CARTA COMPROMISO

Ciudad: {{ciudad}}
Fecha: {{fecha}}

Señor(es):
{{destinatario}}
{{destinatario_cargo}}
{{empresa_destinatario}}
Presente.`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'REFERENCIA',
        content: `De mi consideración:

Por medio de la presente, yo, {{remitente}}, en mi calidad de {{remitente_cargo}} de {{empresa_remitente}}, expreso el compromiso formal de iniciar las gestiones necesarias para {{objeto_compromiso}}.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'TÉRMINOS DEL COMPROMISO',
        content: `Las partes acuerdan los siguientes términos preliminares: 1) Objeto: {{objeto_compromiso}}; 2) Monto referencial: ${'$'}{{monto_referencial}}; 3) Plazo estimado: {{plazo_estimado}}. Los términos definitivos serán formalizados en el contrato correspondiente.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'PLAZO Y VIGENCIA DEL COMPROMISO',
        content: `El presente compromiso tiene una vigencia de {{plazo_estimado}} a partir de la fecha de su emisión. Durante este período, las partes negociarán de buena fe los términos del contrato definitivo.`,
        optional: false,
        order: 4,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `Atentamente,

___________________________
{{remitente}}
{{remitente_cargo}}
{{empresa_remitente}}

___________________________
{{destinatario}}
{{destinatario_cargo}}
{{empresa_destinatario}}`,
        optional: false,
        order: 5,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'finiquito': {
    id: 'finiquito',
    name: 'Finiquito',
    description: 'Acta de finiquito y liquidación de obligaciones laborales al término de la relación de trabajo',
    category: 'labor',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['finiquito', 'liquidación', 'laboral', 'terminación', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha del finiquito', type: 'date', required: true },
      { id: 'empleador', name: 'empleador', label: 'Nombre del empleador', type: 'string', required: true },
      { id: 'empleador_ruc', name: 'empleador_ruc', label: 'RUC del empleador', type: 'string', required: true },
      { id: 'trabajador', name: 'trabajador', label: 'Nombre del trabajador', type: 'string', required: true },
      { id: 'trabajador_cedula', name: 'trabajador_cedula', label: 'Cédula del trabajador', type: 'string', required: true },
      { id: 'cargo', name: 'cargo', label: 'Cargo', type: 'string', required: true },
      { id: 'fecha_ingreso', name: 'fecha_ingreso', label: 'Fecha de ingreso', type: 'date', required: true },
      { id: 'fecha_salida', name: 'fecha_salida', label: 'Fecha de salida', type: 'date', required: true },
      { id: 'ultima_remuneracion', name: 'ultima_remuneracion', label: 'Última remuneración', type: 'money', required: true },
      { id: 'causa_terminacion', name: 'causa_terminacion', label: 'Causa de terminación', type: 'select', required: true, options: ['renuncia voluntaria', 'despido intempestivo', 'visto bueno', 'mutuo acuerdo', 'jubilación', 'terminación de plazo fijo', 'otras'] },
      { id: 'dias_vacaciones', name: 'dias_vacaciones', label: 'Días de vacaciones no gozadas', type: 'number', required: false, defaultValue: '0' },
      { id: 'decimo_tercero', name: 'decimo_tercero', label: 'Décimo tercero proporcional', type: 'money', required: false, defaultValue: '0' },
      { id: 'decimo_cuarto', name: 'decimo_cuarto', label: 'Décimo cuarto proporcional', type: 'money', required: false, defaultValue: '0' },
      { id: 'fondos_reserva', name: 'fondos_reserva', label: 'Fondos de reserva', type: 'money', required: false, defaultValue: '0' },
      { id: 'indemnizacion', name: 'indemnizacion', label: 'Indemnización (si aplica)', type: 'money', required: false, defaultValue: '0' },
      { id: 'otros_valores', name: 'otros_valores', label: 'Otros valores a pagar', type: 'money', required: false, defaultValue: '0' },
    ],
    sections: [
      {
        id: 'encabezado',
        title: 'ACTA DE FINIQUITO',
        content: `ACTA DE FINIQUITO Y LIQUIDACIÓN DE OBLIGACIONES LABORALES`,
        optional: false,
        order: 1,
      },
      {
        id: 'comparecientes',
        title: 'COMPARECIENTES',
        content: `En la ciudad de {{ciudad}}, a los {{fecha}}, comparecen: por una parte, {{empleador}}, con RUC No. {{empleador_ruc}}, a quien en adelante se denominará "EL EMPLEADOR"; y, por otra parte, {{trabajador}}, portador(a) de la cédula de identidad No. {{trabajador_cedula}}, a quien en adelante se denominará "EL TRABAJADOR". Las partes celebran la presente Acta de Finiquito por terminación de la relación laboral.`,
        optional: false,
        order: 2,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- ANTECEDENTES LABORALES',
        content: `EL TRABAJADOR ha prestado sus servicios para EL EMPLEADOR desde el {{fecha_ingreso}} hasta el {{fecha_salida}}, desempeñando el cargo de {{cargo}}, con una última remuneración mensual de ${'$'}{{ultima_remuneracion}}. La relación laboral terminó por: {{causa_terminacion}}.`,
        optional: false,
        order: 3,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- LIQUIDACIÓN DE VALORES',
        content: `Las partes acuerdan la siguiente liquidación final:

1. Remuneraciones pendientes: $0.00
2. Décimo tercer sueldo proporcional: ${'$'}{{decimo_tercero}}
3. Décimo cuarto sueldo proporcional: ${'$'}{{decimo_cuarto}}
4. Fondos de reserva: ${'$'}{{fondos_reserva}}
5. Vacaciones no gozadas ({{dias_vacaciones}} días): $0.00
6. Indemnización: ${'$'}{{indemnizacion}}
7. Otros valores: ${'$'}{{otros_valores}}

TOTAL A RECIBIR: ${'$'}{{decimo_tercero_decimo_cuarto_sum}} + fondos + indemnización + otros.`,
        optional: false,
        order: 4,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- DECLARACIONES',
        content: `EL TRABAJADOR declara: a) Que recibe los valores detallados como liquidación total de sus obligaciones laborales; b) Que no tiene nada que reclamar a EL EMPLEADOR por concepto de remuneraciones, beneficios, indemnizaciones o cualquier otro derivado de la relación laboral; c) Que otorga el más amplio y total finiquito a EL EMPLEADOR.`,
        optional: false,
        order: 5,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `Para constancia de lo actuado, las partes firman la presente Acta de Finiquito en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{empleador}}
RUC: {{empleador_ruc}}
EL EMPLEADOR

___________________________
{{trabajador}}
C.C. {{trabajador_cedula}}
EL TRABAJADOR`,
        optional: false,
        order: 6,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'cesion-derechos': {
    id: 'cesion-derechos',
    name: 'Contrato de Cesión de Derechos',
    description: 'Contrato de cesión de derechos crediticios o contractuales',
    category: 'civil',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['cesión', 'derechos', 'crédito', 'contrato', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'cedente', name: 'cedente', label: 'Nombre del cedente', type: 'string', required: true },
      { id: 'cedente_cedula', name: 'cedente_cedula', label: 'Cédula/RUC del cedente', type: 'string', required: true },
      { id: 'cesionario', name: 'cesionario', label: 'Nombre del cesionario', type: 'string', required: true },
      { id: 'cesionario_cedula', name: 'cesionario_cedula', label: 'Cédula/RUC del cesionario', type: 'string', required: true },
      { id: 'deudor_cedido', name: 'deudor_cedido', label: 'Nombre del deudor cedido (tercero)', type: 'string', required: true },
      { id: 'deudor_cedido_cedula', name: 'deudor_cedido_cedula', label: 'Cédula/RUC del deudor cedido', type: 'string', required: true },
      { id: 'descripcion_derecho', name: 'descripcion_derecho', label: 'Descripción del derecho cedido', type: 'string', required: true },
      { id: 'valor_cesion', name: 'valor_cesion', label: 'Valor de la cesión', type: 'money', required: true },
      { id: 'precio_cesion', name: 'precio_cesion', label: 'Precio de la cesión', type: 'money', required: true },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Cesión de Derechos, por una parte {{cedente}}, portador(a) de la cédula de identidad No. {{cedente_cedula}}, a quien en adelante se denominará "EL CEDENTE"; y, por otra parte {{cesionario}}, portador(a) de la cédula de identidad No. {{cesionario_cedula}}, a quien en adelante se denominará "EL CESIONARIO". Comparece también {{deudor_cedido}}, portador(a) de la cédula de identidad No. {{deudor_cedido_cedula}}, en calidad de deudor cedido. Las partes convienen en las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- ANTECEDENTES',
        content: `EL CEDENTE es titular del siguiente derecho crediticio frente a {{deudor_cedido}}: {{descripcion_derecho}}, por un valor total de ${'$'}{{valor_cesion}}. Dicho derecho consta en el documento adjunto y forma parte del presente contrato.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- OBJETO DE LA CESION',
        content: `EL CEDENTE cede y transfiere a EL CESIONARIO, quien acepta y adquiere, la totalidad de los derechos crediticios descritos en la cláusula anterior, incluyendo capital, intereses, garantías y accesorios.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- PRECIO DE LA CESION',
        content: `EL CESIONARIO pagará a EL CEDENTE la suma de ${'$'}{{precio_cesion}} como precio por la cesión de derechos. El pago se realizará en este acto, declarando EL CEDENTE recibir dicha suma a su entera satisfacción.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- RESPONSABILIDAD DEL CEDENTE',
        content: `EL CEDENTE garantiza la existencia y legitimidad del derecho cedido, pero no responde por la solvencia del deudor cedido, salvo pacto expreso en contrario. EL CEDENTE se obliga a entregar a EL CESIONARIO todos los documentos originales relativos al derecho cedido.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- CONSENTIMIENTO DEL DEUDOR',
        content: `El deudor cedido, {{deudor_cedido}}, declara haber sido notificado de la presente cesión y reconoce a EL CESIONARIO como su nuevo acreedor, obligándose a pagar las sumas adeudadas en los términos originalmente pactados.`,
        optional: false,
        order: 6,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{cedente}}
C.C. {{cedente_cedula}}
EL CEDENTE

___________________________
{{cesionario}}
C.C. {{cesionario_cedula}}
EL CESIONARIO

___________________________
{{deudor_cedido}}
C.C. {{deudor_cedido_cedula}}
EL DEUDOR CEDIDO`,
        optional: false,
        order: 7,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  'contrato-franquicia': {
    id: 'contrato-franquicia',
    name: 'Contrato de Franquicia',
    description: 'Contrato de franquicia comercial para operación bajo marca y sistema de negocio',
    category: 'commercial',
    jurisdiction: 'EC',
    language: 'es',
    version: '1.0.0',
    tags: ['franquicia', 'franquiciamiento', 'marca', 'negocio', 'ecuador'],
    variables: [
      { id: 'ciudad', name: 'ciudad', label: 'Ciudad', type: 'string', required: true, placeholder: 'Quito' },
      { id: 'fecha', name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'franquiciante', name: 'franquiciante', label: 'Nombre del franquiciante', type: 'string', required: true },
      { id: 'franquiciante_ruc', name: 'franquiciante_ruc', label: 'RUC del franquiciante', type: 'string', required: true },
      { id: 'franquiciatario', name: 'franquiciatario', label: 'Nombre del franquiciatario', type: 'string', required: true },
      { id: 'franquiciatario_cedula', name: 'franquiciatario_cedula', label: 'Cédula/RUC del franquiciatario', type: 'string', required: true },
      { id: 'marca_franquicia', name: 'marca_franquicia', label: 'Marca o nombre comercial', type: 'string', required: true },
      { id: 'territorio', name: 'territorio', label: 'Territorio de la franquicia', type: 'string', required: true, placeholder: 'Provincia de Pichincha' },
      { id: 'canon_inicial', name: 'canon_inicial', label: 'Canon de entrada', type: 'money', required: true },
      { id: 'regalias', name: 'regalias', label: 'Regalías mensuales (%)', type: 'number', required: true, defaultValue: '5' },
      { id: 'plazo_franquicia', name: 'plazo_franquicia', label: 'Plazo de la franquicia (años)', type: 'number', required: true, defaultValue: '10' },
      { id: 'descripcion_negocio', name: 'descripcion_negocio', label: 'Descripción del negocio', type: 'string', required: true },
    ],
    sections: [
      {
        id: 'preambulo',
        title: 'PREÁMBULO',
        content: `Comparecen a la celebración del presente Contrato de Franquicia, por una parte {{franquiciante}}, con RUC No. {{franquiciante_ruc}}, a quien en adelante se denominará "EL FRANQUICIANTE"; y, por otra parte {{franquiciatario}}, portador(a) de la cédula de identidad No. {{franquiciatario_cedula}}, a quien en adelante se denominará "EL FRANQUICIATARIO". Las partes celebran el presente contrato al tenor de las siguientes cláusulas:`,
        optional: false,
        order: 1,
      },
      {
        id: 'primera',
        title: 'PRIMERA.- OBJETO',
        content: `EL FRANQUICIANTE concede a EL FRANQUICIATARIO el derecho de operar un negocio bajo la marca {{marca_franquicia}}, dedicado a {{descripcion_negocio}}, en el territorio de {{territorio}}, conforme al sistema de negocio, know-how, métodos y procedimientos desarrollados por EL FRANQUICIANTE.`,
        optional: false,
        order: 2,
      },
      {
        id: 'segunda',
        title: 'SEGUNDA.- DERECHOS CONCEDIDOS',
        content: `EL FRANQUICIANTE otorga a EL FRANQUICIATARIO los siguientes derechos: a) Uso de la marca {{marca_franquicia}}; b) Uso del know-how, métodos y sistemas de operación; c) Asistencia técnica inicial y continua; d) Acceso a proveedores y redes de suministro; e) Capacitación inicial y actualizaciones periódicas; f) Uso de manuales de operación.`,
        optional: false,
        order: 3,
      },
      {
        id: 'tercera',
        title: 'TERCERA.- CANON Y REGALÍAS',
        content: `EL FRANQUICIATARIO pagará a EL FRANQUICIANTE: a) Un canon de entrada no reembolsable de ${'$'}{{canon_inicial}}; b) Regalías mensuales del {{regalias}}% sobre las ventas netas; c) Contribución al fondo de publicidad y marketing del 1% sobre las ventas netas.`,
        optional: false,
        order: 4,
      },
      {
        id: 'cuarta',
        title: 'CUARTA.- PLAZO',
        content: `El presente contrato tendrá un plazo de {{plazo_franquicia}} años, renovable por acuerdo de las partes. EL FRANQUICIATARIO tendrá derecho preferente a renovar si ha cumplido todas sus obligaciones.`,
        optional: false,
        order: 5,
      },
      {
        id: 'quinta',
        title: 'QUINTA.- OBLIGACIONES DEL FRANQUICIATARIO',
        content: `EL FRANQUICIATARIO se obliga a: a) Operar el negocio conforme al manual de operaciones; b) Mantener los estándares de calidad; c) Pagar puntualmente los cánones y regalías; d) No competir con el sistema de franquicia; e) Mantener la confidencialidad del know-how; f) Reportar ventas mensualmente; g) Participar en capacitaciones.`,
        optional: false,
        order: 6,
      },
      {
        id: 'sexta',
        title: 'SEXTA.- PROPIEDAD INTELECTUAL',
        content: `EL FRANQUICIATARIO reconoce la titularidad exclusiva de EL FRANQUICIANTE sobre la marca {{marca_franquicia}} y todos los elementos de propiedad intelectual del sistema de franquicia. Al término del contrato, EL FRANQUICIATARIO cesará inmediatamente el uso de la marca y todos los elementos distintivos.`,
        optional: false,
        order: 7,
      },
      {
        id: 'firmas',
        title: 'FIRMAS',
        content: `En fe de lo cual, las partes suscriben el presente contrato en la ciudad de {{ciudad}}, a los {{fecha}}.

___________________________
{{franquiciante}}
RUC: {{franquiciante_ruc}}
EL FRANQUICIANTE

___________________________
{{franquiciatario}}
C.C. {{franquiciatario_cedula}}
EL FRANQUICIATARIO`,
        optional: false,
        order: 8,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

export function getTemplate(id: DocumentTemplate): ContractTemplate {
  const template = TEMPLATES[id];
  if (!template) {
    throw new Error(`Template "${id}" not found. Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
  }
  return JSON.parse(JSON.stringify(template));
}

export function getAllTemplates(): ContractTemplate[] {
  return Object.values(TEMPLATES).map(t => JSON.parse(JSON.stringify(t)));
}

export function getTemplatesByCategory(category: string): ContractTemplate[] {
  return Object.values(TEMPLATES).filter(t => t.category === category);
}

export function getTemplatesByTag(tag: string): ContractTemplate[] {
  return Object.values(TEMPLATES).filter(t => t.tags.includes(tag));
}

export function renderTemplate(
  templateId: DocumentTemplate,
  variables: Record<string, string>,
  includeSections?: string[],
  excludeSections?: string[],
): { content: string; title: string; sections: Record<string, string> } {
  const template = getTemplate(templateId);
  const renderedSections: Record<string, string> = {};
  let fullContent = '';

  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    if (excludeSections && excludeSections.includes(section.id)) continue;
    if (includeSections && !includeSections.includes(section.id)) continue;

    let renderedContent = section.content;

    renderedContent = substituteVariables(renderedContent, variables);

    renderedContent = processConditionals(renderedContent, variables);

    if (section.optional && renderedContent.trim() === '') continue;

    if (section.id === 'firmas' || section.id === 'encabezado') {
      renderedSections[section.id] = renderedContent;
      fullContent += renderedContent + '\n\n';
    } else {
      const sectionHeader = `${section.title}\n${'='.repeat(section.title.length)}\n\n`;
      renderedSections[section.id] = renderedContent;
      fullContent += sectionHeader + renderedContent + '\n\n';
    }
  }

  const title = template.name;

  return { content: fullContent.trim(), title, sections: renderedSections };
}

function substituteVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (variables[key] !== undefined && variables[key] !== null && variables[key] !== '') {
      return variables[key];
    }
    const templateVar = findTemplateVariableForKey(key);
    if (templateVar?.defaultValue) {
      return templateVar.defaultValue;
    }
    if (templateVar?.required) {
      console.warn(`Required variable "${key}" is missing`);
    }
    return match;
  });
}

function processConditionals(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const val = variables[condition]?.toLowerCase();
    if (val === 'true' || val === '1' || val === 'yes' || val === 'sí' || val === 'si') {
      return content;
    }
    return '';
  });
}

function findTemplateVariableForKey(key: string) {
  for (const template of Object.values(TEMPLATES)) {
    for (const v of template.variables) {
      if (v.name === key) return v;
    }
  }
  return undefined;
}

export function computeFiniquitoTotal(variables: Record<string, string>): number {
  const values = [
    parseFloat(variables.decimo_tercero || '0'),
    parseFloat(variables.decimo_cuarto || '0'),
    parseFloat(variables.fondos_reserva || '0'),
    parseFloat(variables.indemnizacion || '0'),
    parseFloat(variables.otros_valores || '0'),
  ];
  return values.reduce((a, b) => a + b, 0);
}

export { TEMPLATES };
export type { DocumentTemplate };


