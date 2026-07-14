import type {
  ClauseAnalysis,
  ClauseCategory,
  ClauseCompliance,
  ContractDocument,
} from './contract-types';

interface ClauseEntry {
  id: string;
  text: string;
  category: ClauseCategory;
  risk: 'low' | 'medium' | 'high';
  regulations: string[];
  recommendations: string[];
  riskKeywords: string[];
  complianceChecks: ClauseCompliance[];
}

const CLAUSE_LIBRARY: ClauseEntry[] = [
  {
    id: 'cl-terminacion-unilateral',
    text: 'Cualquiera de las partes podrá dar por terminado el presente contrato de forma unilateral sin expresión de causa, mediante notificación escrita con 15 días de anticipación.',
    category: 'termination',
    risk: 'high',
    regulations: ['Código Civil (Arts. 1561-1570)', 'Código de Comercio'],
    recommendations: ['Extender el plazo de preaviso a 30 o 60 días', 'Especificar causas objetivas de terminación', 'Incluir compensación por terminación anticipada'],
    riskKeywords: ['unilateral', 'sin expresión de causa', '15 días', 'terminado'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1561', compliant: true, description: 'Los contratos se extinguen por mutuo acuerdo o causas legales', recommendation: 'Especificar si aplica indemnización' },
      { regulation: 'COGEP - Arts. 258-268', compliant: true, description: 'No contraviene normas procesales' },
    ],
  },
  {
    id: 'cl-terminacion-con-causa',
    text: 'Cualquiera de las partes podrá dar por terminado el contrato en caso de incumplimiento grave de las obligaciones contractuales, previo requerimiento por escrito con 30 días de plazo para subsanar.',
    category: 'termination',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1561-1570)', 'Código de Comercio (Art. 198)'],
    recommendations: ['Definir qué constituye incumplimiento grave', 'Incluir lista ejemplificativa de causales'],
    riskKeywords: ['incumplimiento grave', 'subsanar', '30 días'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1561', compliant: true, description: 'Cumple con las causales de extinción contractual' },
      { regulation: 'Código de Comercio - Art. 198', compliant: true, description: 'Conforme a las normas mercantiles de terminación' },
    ],
  },
  {
    id: 'cl-confidencialidad-amplia',
    text: 'La Parte Receptora se obliga a mantener absoluta confidencialidad sobre toda la información divulgada, por un período de 5 años desde la terminación del contrato.',
    category: 'confidentiality',
    risk: 'medium',
    regulations: ['Ley de Propiedad Intelectual (Arts. 280-287)', 'Código Civil (Art. 1561)', 'Ley Orgánica de Protección de Datos Personales'],
    recommendations: ['Definir alcance de "información confidencial"', 'Incluir excepciones estándar', 'Ajustar plazo máximo a 3 años para ser razonable'],
    riskKeywords: ['confidencialidad', 'absoluta', 'información divulgada', '5 años', 'secreto'],
    complianceChecks: [
      { regulation: 'Ley Orgánica de Protección de Datos Personales', compliant: true, description: 'La confidencialidad es compatible con la LOPDP', recommendation: 'Incluir referencia al tratamiento de datos personales' },
      { regulation: 'Ley de Propiedad Intelectual - Art. 280', compliant: true, description: 'Protección de secretos empresariales' },
    ],
  },
  {
    id: 'cl-confidencialidad-mutua',
    text: 'Ambas partes se obligan recíprocamente a mantener la confidencialidad de la información intercambiada, por un período de 2 años, excepto aquella que sea de dominio público.',
    category: 'confidentiality',
    risk: 'low',
    regulations: ['Ley de Propiedad Intelectual', 'Ley Orgánica de Protección de Datos Personales'],
    recommendations: ['Definir claramente qué información es confidencial', 'Incluir procedimiento para divulgación requerida por ley'],
    riskKeywords: ['confidencialidad', 'recíprocamente', 'intercambiada', '2 años'],
    complianceChecks: [
      { regulation: 'Ley de Propiedad Intelectual - Arts. 280-287', compliant: true, description: 'Protección equilibrada de información' },
      { regulation: 'Ley Orgánica de Protección de Datos Personales', compliant: true, description: 'Cobertura adecuada de datos personales' },
    ],
  },
  {
    id: 'cl-responsabilidad-limitada',
    text: 'La responsabilidad total de una parte frente a la otra, por cualquier concepto derivado del presente contrato, se limita al valor total de los honorarios pagados.',
    category: 'liability',
    risk: 'high',
    regulations: ['Código Civil (Arts. 1572-1577)', 'Ley de Defensa del Consumidor', 'Código de Comercio'],
    recommendations: ['Excluir dolo y culpa grave del límite de responsabilidad', 'Incluir daños a terceros en la exclusión', 'Verificar que no sea contraria al orden público'],
    riskKeywords: ['responsabilidad', 'limitada', 'se limita', 'valor total', 'honorarios'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1572', compliant: false, description: 'Puede ser anulable si excluye dolo', recommendation: 'Agregar excepción para dolo y culpa grave' },
      { regulation: 'Código de Comercio - Art. 134', compliant: true, description: 'Permite limitación de responsabilidad mercantil' },
    ],
  },
  {
    id: 'cl-responsabilidad-solidaria',
    text: 'Las partes serán solidariamente responsables por los daños y perjuicios causados a terceros durante la ejecución del contrato.',
    category: 'liability',
    risk: 'medium',
    regulations: ['Código Civil (Arts. 1572-1577)', 'Código de Comercio'],
    recommendations: ['Especificar proporción de responsabilidad entre partes', 'Incluir mecanismo de reembolso entre coobligados'],
    riskKeywords: ['solidariamente', 'daños y perjuicios', 'terceros'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1577', compliant: true, description: 'La solidaridad debe ser expresa' },
    ],
  },
  {
    id: 'cl-pago-anticipado',
    text: 'EL CONTRATANTE pagará el 100% del valor del contrato por adelantado, antes del inicio de los servicios.',
    category: 'payment',
    risk: 'high',
    regulations: ['Código Civil (Arts. 1602-1610)', 'Ley de Defensa del Consumidor'],
    recommendations: ['Negociar pagos parciales contra hitos o entregables', 'Incluir garantía de cumplimiento', 'Establecer derecho a reembolso por incumplimiento'],
    riskKeywords: ['100%', 'adelantado', 'por adelantado', 'todo el valor'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1602', compliant: true, description: 'Forma de pago válida pero riesgosa para el contratante' },
      { regulation: 'Ley de Defensa del Consumidor - Art. 6', compliant: true, description: 'Aplica solo si el contratante es consumidor final' },
    ],
  },
  {
    id: 'cl-pago-contra-entrega',
    text: 'El pago se realizará contra entrega de los productos o servicios, previa aceptación por escrito del contratante.',
    category: 'payment',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1602-1610)', 'Código de Comercio'],
    recommendations: ['Establecer plazo máximo para la aceptación', 'Definir procedimiento de rechazo y corrección'],
    riskKeywords: ['contra entrega', 'aceptación', 'por escrito'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1602', compliant: true, description: 'Modalidad de pago segura para el contratante' },
    ],
  },
  {
    id: 'cl-penalidad-mora',
    text: 'En caso de mora en el pago, se aplicará un interés del 5% mensual sobre el valor adeudado.',
    category: 'penalty',
    risk: 'high',
    regulations: ['Código Civil (Art. 1584)', 'Código de Comercio (Art. 209)', 'Ley de Defensa del Consumidor', 'Banco Central del Ecuador - Tasas de interés'],
    recommendations: ['Reducir a tasa máxima activa referencial del BCE', 'Interés moratorio no puede exceder 1.5 veces la tasa convencional', 'Verificar límites legales (usura)'],
    riskKeywords: ['5% mensual', 'interés', 'mora', 'penalidad', 'moratorio'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1584', compliant: false, description: 'Tasa excesiva podría ser reducida por el juez', recommendation: 'Reducir a tasa de mercado (máximo 1.5x tasa activa referencial)' },
      { regulation: 'Código de Comercio - Art. 209', compliant: false, description: 'Excede las tasas mercantiles usuales', recommendation: 'Ajustar a máximo 1.5% mensual' },
      { regulation: 'Ley de Defensa del Consumidor', compliant: false, description: 'Podría considerarse cláusula abusiva', recommendation: 'Revisar límites del BCE' },
    ],
  },
  {
    id: 'cl-penalidad-por-incumplimiento',
    text: 'La parte que incumpla sus obligaciones pagará a la otra una penalidad equivalente al 20% del valor del contrato, sin perjuicio de reclamar daños y perjuicios adicionales.',
    category: 'penalty',
    risk: 'medium',
    regulations: ['Código Civil (Art. 1587)', 'Código de Comercio (Art. 201)'],
    recommendations: ['Verificar que la penalidad no sea excesiva', 'La penalidad puede ser reducida por el juez si es manifiestamente excesiva', 'Considerar tope del 10-15%'],
    riskKeywords: ['20%', 'penalidad', 'daños y perjuicios', 'adicionales', 'incumpla'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1587', compliant: true, description: 'La cláusula penal es válida, pero reducible por excesiva' },
    ],
  },
  {
    id: 'cl-jurisdiccion-ecuador',
    text: 'Las partes se someten a la jurisdicción y competencia de los jueces y tribunales de la ciudad de Quito, Ecuador, renunciando a cualquier otro fuero.',
    category: 'jurisdiction',
    risk: 'low',
    regulations: ['COGEP (Arts. 13-33)', 'Código Civil (Arts. 1625-1634)', 'Constitución de la República del Ecuador'],
    recommendations: ['Verificar que la ciudad designada corresponda al domicilio de alguna parte', 'Si hay extranjero, considerar arbitraje internacional'],
    riskKeywords: ['jurisdicción', 'competencia', 'Quito', 'tribunales', 'renunciando'],
    complianceChecks: [
      { regulation: 'COGEP - Arts. 13-33', compliant: true, description: 'Prórroga de competencia válida' },
      { regulation: 'Constitución - Art. 76', compliant: true, description: 'Garantiza tutela judicial efectiva' },
    ],
  },
  {
    id: 'cl-arbitraje-nacional',
    text: 'Cualquier controversia derivada del presente contrato será resuelta mediante arbitraje en derecho administrado por el Centro de Arbitraje y Conciliación de la Cámara de Comercio de Quito.',
    category: 'jurisdiction',
    risk: 'low',
    regulations: ['Ley de Arbitraje y Mediación (Arts. 1-57)', 'COGEP'],
    recommendations: ['Especificar número de árbitros', 'Establecer lugar del arbitraje', 'Definir idioma del procedimiento'],
    riskKeywords: ['arbitraje', 'conciliación', 'Cámara de Comercio', 'árbitros'],
    complianceChecks: [
      { regulation: 'Ley de Arbitraje y Mediación - Art. 1', compliant: true, description: 'El arbitraje en derecho es válido' },
      { regulation: 'COGEP - Art. 302', compliant: true, description: 'El convenio arbitral excluye la jurisdicción ordinaria' },
    ],
  },
  {
    id: 'cl-fuerza-mayor-amplia',
    text: 'Ninguna de las partes será responsable por incumplimiento causado por caso fortuito o fuerza mayor, incluyendo desastres naturales, guerras, pandemias, huelgas, y cualquier otro evento fuera del control razonable de la parte.',
    category: 'force_majeure',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1566-1567)', 'Código de Comercio (Art. 198)'],
    recommendations: ['Especificar obligación de notificar oportunamente', 'Incluir mecanismo de renegociación si el evento persiste', 'Definir plazo de suspensión máximo'],
    riskKeywords: ['fuerza mayor', 'caso fortuito', 'pandemias', 'huelgas', 'control razonable'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1566', compliant: true, description: 'Definición amplia compatible con la ley' },
    ],
  },
  {
    id: 'cl-no-competencia-estricta',
    text: 'EL PROFESIONAL no podrá prestar servicios directa o indirectamente a competidores de EL CONTRATANTE durante la vigencia del contrato y por 3 años posteriores, en todo el territorio nacional.',
    category: 'non_compete',
    risk: 'high',
    regulations: ['Código de Trabajo (Arts. 182-188)', 'Ley de Propiedad Intelectual', 'Ley de Defensa del Consumidor'],
    recommendations: ['Limitar el alcance geográfico', 'Reducir el plazo post-contractual a máximo 1 año', 'Incluir compensación por no competencia post-contractual'],
    riskKeywords: ['no competencia', 'competidores', 'territorio nacional', '3 años', 'no podrá'],
    complianceChecks: [
      { regulation: 'Código de Trabajo - Art. 182', compliant: false, description: 'Si hay relación laboral, podría ser nulo', recommendation: 'Aplicable solo a contratos mercantiles, no laborales' },
      { regulation: 'Ley de Propiedad Intelectual - Art. 280', compliant: true, description: 'Protección de secretos empresariales' },
    ],
  },
  {
    id: 'cl-no-competencia-laboral',
    text: 'EL TRABAJADOR se obliga a no revelar secretos empresariales y a no competir con EL EMPLEADOR durante 6 meses posteriores a la terminación del contrato, recibiendo una compensación equivalente al 50% de su última remuneración mensual.',
    category: 'non_compete',
    risk: 'medium',
    regulations: ['Código de Trabajo (Art. 182)', 'Ley de Propiedad Intelectual'],
    recommendations: ['Asegurar que la compensación sea adecuada', 'Definir los secretos empresariales protegidos'],
    riskKeywords: ['no competir', 'seis meses', 'compensación', 'secretos empresariales'],
    complianceChecks: [
      { regulation: 'Código de Trabajo - Art. 182', compliant: true, description: 'Es válido si hay compensación y plazo razonable' },
    ],
  },
  {
    id: 'cl-propiedad-intelectual-total',
    text: 'Todos los derechos de propiedad intelectual sobre los trabajos realizados serán transferidos en su totalidad a EL CONTRATANTE, incluyendo derechos morales y patrimoniales.',
    category: 'intellectual_property',
    risk: 'medium',
    regulations: ['Ley de Propiedad Intelectual (Arts. 8-145)', 'Código Civil (Arts. 619-642)'],
    recommendations: ['Los derechos morales son irrenunciables en Ecuador', 'Especificar cesión de derechos patrimoniales solamente', 'Incluir detalle de entregables'],
    riskKeywords: ['propiedad intelectual', 'derechos morales', 'transferidos', 'totalidad', 'patrimoniales'],
    complianceChecks: [
      { regulation: 'Ley de Propiedad Intelectual - Art. 21', compliant: false, description: 'Los derechos morales son irrenunciables', recommendation: 'Modificar a cesión de derechos patrimoniales, reconocer derechos morales' },
      { regulation: 'Ley de Propiedad Intelectual - Art. 148', compliant: true, description: 'Cesión de derechos patrimoniales válida' },
    ],
  },
  {
    id: 'cl-licencia-uso-software',
    text: 'EL LICENCIANTE concede a EL LICENCIATARIO una licencia no exclusiva, intransferible y por plazo limitado para usar el software, sin derecho a modificarlo, sublicenciarlo o realizar ingeniería inversa.',
    category: 'intellectual_property',
    risk: 'low',
    regulations: ['Ley de Propiedad Intelectual (Arts. 269-274)', 'Código de Comercio', 'Código Civil'],
    recommendations: ['Definir ámbito territorial de la licencia', 'Especificar número de usuarios o dispositivos', 'Incluir limitación de responsabilidad por daños por uso del software'],
    riskKeywords: ['licencia', 'no exclusiva', 'intransferible', 'ingeniería inversa'],
    complianceChecks: [
      { regulation: 'Ley de Propiedad Intelectual - Art. 269', compliant: true, description: 'Licencias de software válidas según la LPI' },
    ],
  },
  {
    id: 'cl-garantia-oculta',
    text: 'EL VENDEDOR garantiza que el bien vendido no tiene vicios ocultos y responde por todos los defectos no aparentes que hagan el bien impropio para su uso.',
    category: 'warranty',
    risk: 'high',
    regulations: ['Código Civil (Arts. 1756-1770)', 'Código de Comercio (Arts. 135-141)'],
    recommendations: ['Limitar el plazo de responsabilidad por vicios ocultos', 'Incluir procedimiento de notificación de vicios', 'Establecer límite de responsabilidad'],
    riskKeywords: ['vicios ocultos', 'garantiza', 'defectos', 'improprio', 'responsabilidad'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1756', compliant: true, description: 'Responsabilidad por vicios ocultos es de orden público' },
    ],
  },
  {
    id: 'cl-indemnidad-danos',
    text: 'La parte que incumpla sus obligaciones indemnizará a la otra por todos los daños y perjuicios directos e indirectos, incluyendo lucro cesante y daño emergente.',
    category: 'indemnity',
    risk: 'medium',
    regulations: ['Código Civil (Arts. 1572-1575)', 'Código de Comercio (Art. 200)'],
    recommendations: ['Considerar limitar a daños directos previsibles', 'Excluir daños indirectos y lucro cesante', 'Establecer tope máximo de indemnización'],
    riskKeywords: ['indemnizará', 'daños y perjuicios', 'directos e indirectos', 'lucro cesante'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1572', compliant: true, description: 'Obligación de indemnizar conforme a la ley' },
      { regulation: 'Código Civil - Art. 1574', compliant: true, description: 'Comprende daño emergente y lucro cesante' },
    ],
  },
  {
    id: 'cl-indemnidad-ambiental',
    text: 'EL CONTRATISTA asume toda la responsabilidad por daños ambientales causados durante la ejecución del contrato, obligándose a remediar y a indemnizar por cualquier afectación.',
    category: 'indemnity',
    risk: 'high',
    regulations: ['Constitución de la República (Arts. 71-74)', 'Código Orgánico del Ambiente (Arts. 300-340)', 'Ley de Gestión Ambiental'],
    recommendations: ['Exigir póliza de seguro ambiental', 'Incluir plan de manejo ambiental', 'Establecer protocolo de respuesta a emergencias'],
    riskKeywords: ['ambiental', 'remediar', 'daños ambientales', 'indemnizar', 'recuperación'],
    complianceChecks: [
      { regulation: 'Constitución - Art. 71', compliant: true, description: 'Principio de responsabilidad ambiental' },
      { regulation: 'Código Orgánico del Ambiente - Art. 300', compliant: true, description: 'Responsabilidad objetiva por daño ambiental' },
    ],
  },
  {
    id: 'cl-pago-diferido',
    text: 'El saldo del precio será pagado en 12 cuotas mensuales iguales y consecutivas, con un interés del 1% mensual sobre saldos deudores.',
    category: 'payment',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1602-1610)', 'Banco Central - Tasas de interés activas'],
    recommendations: ['Incluir tabla de amortización', 'Establecer derecho a prepago sin penalidad'],
    riskKeywords: ['cuotas mensuales', 'interés', 'saldos deudores', 'amortización'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1602', compliant: true, description: 'Pago diferido válido' },
      { regulation: 'Banco Central del Ecuador', compliant: true, description: 'Tasa de interés dentro de parámetros legales' },
    ],
  },
  {
    id: 'cl-terminacion-automatica',
    text: 'El presente contrato se extinguirá automáticamente sin necesidad de declaración judicial si alguna de las partes es declarada en quiebra, insolvencia o concurso de acreedores.',
    category: 'termination',
    risk: 'medium',
    regulations: ['Código Civil (Art. 1561)', 'Ley de Compañías (Arts. 393-400)', 'Código de Comercio'],
    recommendations: ['Incluir notificación previa a la terminación', 'Establecer plazo para corregir la situación'],
    riskKeywords: ['automáticamente', 'quiebra', 'insolvencia', 'concurso de acreedores'],
    complianceChecks: [
      { regulation: 'Ley de Compañías - Art. 393', compliant: true, description: 'Causal de disolución de compañías' },
    ],
  },
  {
    id: 'cl-cesion-derechos-prohibida',
    text: 'Ninguna de las partes podrá ceder sus derechos u obligaciones derivados del presente contrato sin el consentimiento previo y por escrito de la otra parte.',
    category: 'other',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1857-1872)', 'Código de Comercio (Art. 199)'],
    recommendations: ['Incluir excepción para fusiones y adquisiciones', 'Establecer que el consentimiento no será irrazonablemente denegado'],
    riskKeywords: ['ceder', 'derechos', 'obligaciones', 'consentimiento previo'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1857', compliant: true, description: 'Cesión de derechos válida con consentimiento' },
    ],
  },
  {
    id: 'cl-acuerdo-integral',
    text: 'Este contrato constituye el acuerdo integral entre las partes y reemplaza cualquier entendimiento previo, oral o escrito, relacionado con su objeto.',
    category: 'other',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1561-1580)'],
    recommendations: ['Incluir anexos como parte del contrato'],
    riskKeywords: ['acuerdo integral', 'reemplaza', 'entendimiento previo'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1561', compliant: true, description: 'Principio de libertad contractual' },
    ],
  },
  {
    id: 'cl-renovacion-automatica',
    text: 'El contrato se renovará automáticamente por períodos iguales si ninguna de las partes notifica su voluntad de no renovarlo con 15 días de anticipación al vencimiento.',
    category: 'other',
    risk: 'medium',
    regulations: ['Código Civil (Arts. 1561-1565)', 'Ley de Defensa del Consumidor'],
    recommendations: ['Extender el plazo de preaviso a 30 días', 'Incluir notificación por escrito con acuse de recibo'],
    riskKeywords: ['renovación automática', 'períodos iguales', '15 días', 'renewal'],
    complianceChecks: [
      { regulation: 'Código Civil', compliant: true, description: 'Renovación automática válida si hay consentimiento' },
    ],
  },
  {
    id: 'cl-jurisdiccion-extranjera',
    text: 'Las partes se someten a la jurisdicción de los tribunales del Estado de Delaware, Estados Unidos, renunciando a sus propios domicilios y fueros.',
    category: 'jurisdiction',
    risk: 'high',
    regulations: ['COGEP (Arts. 13-33)', 'Código Civil (Arts. 16-17)', 'Constitución (Art. 422)'],
    recommendations: ['Someter a arbitraje internacional en lugar de tribunales extranjeros', 'Verificar tratados aplicables', 'Considerar la Convención de Nueva York'],
    riskKeywords: ['delaware', 'estados unidos', 'tribunales extranjeros', 'jurisdicción extranjera'],
    complianceChecks: [
      { regulation: 'COGEP - Art. 13', compliant: false, description: 'Podría ser declarada nula si afecta derechos de consumidores', recommendation: 'Utilizar arbitraje internacional' },
      { regulation: 'Constitución - Art. 422', compliant: true, description: 'Ecuador permite arbitraje internacional' },
    ],
  },
  {
    id: 'cl-honorarios-exito',
    text: 'EL PROFESIONAL recibirá un honorario de éxito equivalente al 15% del valor total del proyecto, pagadero únicamente si se alcanza el resultado esperado.',
    category: 'payment',
    risk: 'medium',
    regulations: ['Código Civil (Arts. 1602-1610)', 'Código de Comercio'],
    recommendations: ['Definir objetivamente el "resultado esperado"', 'Establecer mecanismo de verificación', 'Considerar si aplica regulación de cuota litis'],
    riskKeywords: ['honorario de éxito', 'resultado esperado', 'porcentaje', 'condición suspensiva'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1606', compliant: true, description: 'Pago sujeto a condición suspensiva válido' },
    ],
  },
  {
    id: 'cl-reserva-dominio',
    text: 'EL VENDEDOR se reserva el dominio del bien vendido hasta que el precio sea pagado en su totalidad, conforme a la Ley de Ventas por Reserva de Dominio.',
    category: 'warranty',
    risk: 'low',
    regulations: ['Ley de Ventas por Reserva de Dominio (Arts. 1-26)', 'Código Civil'],
    recommendations: ['Inscribir la reserva de dominio en el Registro Mercantil', 'El comprador no puede enajenar el bien mientras no haya pagado'],
    riskKeywords: ['reserva de dominio', 'dominio', 'precio pagado', 'registro'],
    complianceChecks: [
      { regulation: 'Ley de Ventas por Reserva de Dominio - Art. 1', compliant: true, description: 'Mecanismo legal válido' },
      { regulation: 'Registro Mercantil', compliant: true, description: 'Debe inscribirse para oponibilidad a terceros' },
    ],
  },
  {
    id: 'cl-confidencialidad-indefinida',
    text: 'Las obligaciones de confidencialidad subsistirán por tiempo indefinido después de la terminación del contrato.',
    category: 'confidentiality',
    risk: 'high',
    regulations: ['Ley de Propiedad Intelectual (Arts. 280-287)', 'Ley Orgánica de Protección de Datos Personales'],
    recommendations: ['Establecer un plazo definido y razonable (2-5 años)', 'Solo mantener indefinido para secretos comerciales registrados'],
    riskKeywords: ['indefinido', 'subsistirán', 'perpetuo', 'sin límite'],
    complianceChecks: [
      { regulation: 'Ley Orgánica de Protección de Datos Personales - Art. 15', compliant: false, description: 'Los datos personales no pueden conservarse indefinidamente', recommendation: 'Limitar a un plazo máximo de 5 años' },
      { regulation: 'Ley de Propiedad Intelectual - Art. 280', compliant: true, description: 'Los secretos empresariales pueden protegerse mientras mantengan su condición' },
    ],
  },
  {
    id: 'cl-reequilibrio-economico',
    text: 'Si ocurren cambios legislativos o económicos que alteren significativamente la economía del contrato, las partes se obligan a renegociar de buena fe las condiciones para restablecer el equilibrio económico.',
    category: 'other',
    risk: 'low',
    regulations: ['Código Civil (Arts. 1561-1580)', 'Código de Comercio (Art. 198)', 'Teoría de la imprevisión'],
    recommendations: ['Establecer mecanismo de renegociación', 'Definir qué constituye "alteración significativa"', 'Incluir arbitraje en caso de desacuerdo'],
    riskKeywords: ['reequilibrio', 'cambios legislativos', 'renegociar', 'equilibrio económico', 'imprevisión'],
    complianceChecks: [
      { regulation: 'Código Civil - Art. 1563', compliant: true, description: 'Teoría de la imprevisión aplicable en Ecuador' },
    ],
  },
  {
    id: 'cl-facturacion-electronica',
    text: 'El proveedor emitirá facturas electrónicas conforme a la normativa del SRI y las retenciones aplicables serán realizadas según la tabla de retenciones en la fuente vigente.',
    category: 'payment',
    risk: 'low',
    regulations: ['Ley de Régimen Tributario Interno (Arts. 45-50)', 'Reglamento de Comprobantes de Venta del SRI', 'Resolución NAC-DGERCGC16-179'],
    recommendations: ['Verificar que el proveedor esté autorizado para emitir facturas electrónicas', 'Incluir plazos de entrega de facturas'],
    riskKeywords: ['facturas electrónicas', 'SRI', 'retenciones', 'comprobantes de venta'],
    complianceChecks: [
      { regulation: 'Ley de Régimen Tributario Interno - Art. 45', compliant: true, description: 'Obligación de emitir comprobantes de venta' },
      { regulation: 'Resolución SRI - Facturación Electrónica', compliant: true, description: 'Conforme a la normativa tributaria ecuatoriana' },
    ],
  },
];

export function analyzeClause(text: string): ClauseAnalysis {
  const lowerText = text.toLowerCase();
  const matchedClauses: { entry: ClauseEntry; score: number }[] = [];

  for (const entry of CLAUSE_LIBRARY) {
    let score = 0;
    const matchCount = entry.riskKeywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      score = matchCount / entry.riskKeywords.length;
      matchedClauses.push({ entry, score });
    }
  }

  matchedClauses.sort((a, b) => b.score - a.score);

  if (matchedClauses.length > 0) {
    const best = matchedClauses[0];
    const compliance: ClauseCompliance[] = best.entry.complianceChecks.map(c => ({
      ...c,
    }));
    const recommendations = [...best.entry.recommendations];

    const allRiskKeywords = matchedClauses.filter(m => m.score > 0.3).flatMap(m => m.entry.riskKeywords);
    const highRiskCount = matchedClauses.filter(m => m.entry.risk === 'high' && m.score > 0.3).length;

    let risk: 'low' | 'medium' | 'high' = best.entry.risk;
    if (highRiskCount >= 2) risk = 'high';
    else if (highRiskCount >= 1) risk = risk === 'low' ? 'medium' : 'high';

    const riskPatterns = [
      { pattern: /\b(indefinido|perpetuo|absoluto|irrevocable)\b/i, risk: 'high' },
      { pattern: /\b(100%|todo|totalidad|íntegro)\b/i, risk: 'medium' },
      { pattern: /\b(renuncia|irrenunciable|unilateral)\b/i, risk: 'medium' },
    ];

    for (const rp of riskPatterns) {
      if (rp.pattern.test(text)) {
        compliance.push({
          regulation: 'Análisis de riesgo automático',
          compliant: false,
          description: `Se detectó patrón de riesgo: "${rp.pattern.source}"`,
          recommendation: 'Revisar la redacción de esta cláusula',
        });
      }
    }

    return {
      clauseId: best.entry.id,
      clauseText: text,
      category: best.entry.category,
      risk,
      recommendations,
      compliance,
    };
  }

  return {
    clauseId: 'unknown',
    clauseText: text,
    category: 'other',
    risk: 'medium',
    recommendations: ['Cláusula no encontrada en la biblioteca. Se recomienda revisión legal manual.'],
    compliance: [
      {
        regulation: 'Revisión general',
        compliant: false,
        description: 'Cláusula no identificada automáticamente',
        recommendation: 'Se requiere revisión legal manual para verificar cumplimiento normativo ecuatoriano',
      },
    ],
  };
}

export function analyzeDocument(contract: ContractDocument): ClauseAnalysis[] {
  const lines = contract.content.split('\n');
  const analyses: ClauseAnalysis[] = [];
  let currentClause = '';
  let clauseStart = false;

  const clausePatterns = [
    /(?:CLÁUSULA|CLAUSULA|ARTÍCULO|ARTICULO|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|SEPTIMA|OCTAVA|NOVENA|DÉCIMA|DECIMA|UNDÉCIMA|UNDECIMA)(?:\.|\s|:)+/i,
  ];

  for (const line of lines) {
    const isHeader = clausePatterns.some(p => p.test(line));
    if (isHeader && currentClause.trim()) {
      analyses.push(analyzeClause(currentClause.trim()));
      currentClause = line + '\n';
    } else if (isHeader) {
      currentClause = line + '\n';
    } else {
      currentClause += line + '\n';
    }
  }

  if (currentClause.trim()) {
    const analysis = analyzeClause(currentClause.trim());
    if (!analyses.some(a => a.clauseText === analysis.clauseText)) {
      analyses.push(analysis);
    }
  }

  if (analyses.length === 0) {
    analyses.push(analyzeClause(contract.content));
  }

  return analyses;
}

export function getClausesByCategory(category: ClauseCategory): ClauseEntry[] {
  return CLAUSE_LIBRARY.filter(c => c.category === category);
}

export function getRecommendations(analyses: ClauseAnalysis[]): string[] {
  const allRecs = new Set<string>();
  for (const analysis of analyses) {
    for (const rec of analysis.recommendations) {
      allRecs.add(rec);
    }
  }
  return Array.from(allRecs);
}

export function getHighRiskClauses(analyses: ClauseAnalysis[]): ClauseAnalysis[] {
  return analyses.filter(a => a.risk === 'high');
}

export function getComplianceSummary(analyses: ClauseAnalysis[]): {
  total: number;
  compliant: number;
  nonCompliant: number;
  details: ClauseCompliance[];
} {
  const details: ClauseCompliance[] = [];
  for (const a of analyses) {
    details.push(...a.compliance);
  }
  const compliant = details.filter(d => d.compliant).length;
  const nonCompliant = details.filter(d => !d.compliant).length;
  return {
    total: details.length,
    compliant,
    nonCompliant,
    details,
  };
}

export type { ClauseEntry, ClauseCategory };
