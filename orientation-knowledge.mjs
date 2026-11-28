/** Conocimiento curado de la guía local. No consulta stock ni interpreta síntomas. */
const topics = [
  [
    /^(?!.*(?:replicacion|semiconservativ)).*(?:\badn\b|doble helice|nucleotid|genetica|bases nitrogenadas)/,
    "El ADN almacena información genética en una secuencia de bases: adenina, timina, citosina y guanina. A se empareja con T y C con G. Dos cadenas, con un esqueleto de azúcar y fosfato, forman la doble hélice. En Inicio puedes explorar adenina, timina, citosina, guanina, desoxirribosa y fosfato en las mallas nombradas del modelo. Las fichas relacionan estructura, información genética y lectura responsable de medicamentos; no identifican dianas farmacológicas ni interpretan tu ADN.",
    "inicio",
  ],
  [
    /(replicacion|semiconservativ)/,
    "Al replicarse el ADN, cada cadena sirve como molde para una nueva cadena complementaria. Cada molécula resultante conserva una cadena previa y una nueva: por eso se llama replicación semiconservativa. El botón Desdoblar del visor es una ayuda visual, no una simulación exacta de enzimas, enlaces o tiempos celulares.",
    "inicio",
  ],
  [
    /(sismed|sobrestock|normostock|substock|desabastec|sin rotacion|leer.*(tablero|estadistic)|indicador)/,
    "El tablero SISMED mostrado es regional: La Libertad, con corte al 31/10/2026. Sobrestock significa más de tres meses de consumo; normostock, de uno a tres; substock, menos de uno; desabastecido, stock cero al corte. La disponibilidad agregada no garantiza existencias en una sede. Puedes abrir cada indicador, ordenar las redes y recorrer los meses del gráfico. Se conserva la fuente y la fecha; no son cifras nacionales ni stock en vivo.",
    "tablero",
  ],
  [
    /(\bsis\b|seguro integral|afiliacion|aseguramiento)/,
    "El SIS es el Seguro Integral de Salud del Perú. Puedes consultar tu afiliación en el enlace oficial de la sección Canales. La Línea 113, opción 4, brinda orientación sobre SIS. VITARA no tramita afiliaciones, no comprueba tu identidad y no necesita que escribas tu DNI en el chat. Los requisitos y la cobertura de un trámite deben confirmarse en el canal oficial.",
    "canales",
  ],
  [
    /(\b113\b|linea.*minsa|opciones.*salud)/,
    "La Línea 113 del MINSA brinda orientación gratuita las 24 horas. El menú de referencia incluye: 1 dengue, 2 Hospital Digital, 3 orientación clínica, 4 SIS, 5 salud mental, 6 campañas y 7 SUSALUD. En Canales puedes explorar esas opciones; confirma el menú que anuncie la llamada, porque puede cambiar. VITARA no realiza llamadas ni envía una ambulancia.",
    "canales",
  ],
  [
    /(\b106\b|samu|orientacion de salud|telefono|contacto.*salud)/,
    "Para orientación sanitaria en Perú puedes llamar a la Línea 113 del MINSA. Ante una emergencia, busca atención urgente y llama al 106 del SAMU donde tenga cobertura. En Canales encontrarás las opciones y enlaces oficiales; no puedo determinar tu ubicación, evaluar gravedad ni contactar servicios por ti.",
    "canales",
  ],
  [
    /(susalud|reclamo|derechos.*salud|queja)/,
    "SUSALUD orienta sobre derechos en salud y canales de consulta o denuncia. La referencia en Línea 113 es la opción 7; confirma el menú vigente al llamar. En Canales tienes enlaces oficiales. No publiques datos clínicos ni documentos personales en este chat; presenta un trámite únicamente por el canal autorizado.",
    "canales",
  ],
  [
    /(salud mental|ansiedad|estres|tristeza)/,
    "Si buscas orientación sobre salud mental, puedes recurrir a la Línea 113, opción 5, y a los servicios de salud de tu zona. Como apoyo general, intenta hablar con alguien de confianza y buscar atención profesional si el malestar persiste o afecta tu vida diaria. No puedo evaluar ni diagnosticar por chat. Si hay peligro inmediato, no esperes una respuesta de VITARA: busca ayuda urgente.",
    "canales",
  ],
  [
    /(\bdengue\b|zancudo|mosquito)/,
    "Para reducir criaderos del mosquito transmisor del dengue, evita agua acumulada y mantén tapados los recipientes de almacenamiento. La Línea 113, opción 1, puede orientarte. Si sospechas dengue, solicita evaluación profesional; no te automediques ni uses el chat para decidir dosis. Ante dolor abdominal intenso, sangrado, vómitos persistentes o deterioro, busca atención urgente. No puedo confirmar una infección por aquí.",
    "canales",
  ],
  [
    /(generico|genericos|marca.*medic|dci|opp|digemid)/,
    "La DCI identifica el principio activo de un medicamento. Para comparar referencias, revisa además concentración, forma farmacéutica, presentación, registro y fecha del precio. No sustituyas por tu cuenta un tratamiento: consulta a un profesional o químico farmacéutico. Los precios de VITARA son referencias del catálogo, no cotizaciones ni existencias confirmadas. Puedes revisar fuentes y buscar el recurso.",
    "buscar",
  ],
  [
    /(ipress|renipress|microrred|microred)/,
    "Una IPRESS es una institución prestadora de servicios de salud. RENIPRESS es el registro administrado por SUSALUD. Una red o microrred sanitaria no equivale necesariamente a una provincia. VITARA conserva información nacional y una base regional de La Libertad; si un territorio no tiene registros, no significa que no existan establecimientos. Confirma horarios y atención con la sede.",
    "mapas",
  ],
  [
    /(respaldo|backup|restaurar|recuperar.*solicitud)/,
    "El panel administrativo permite descargar un respaldo JSON de solicitudes. No incluye perfiles ni credenciales. Restaurarlo reemplaza la bandeja, por eso hay que descargar una copia antes y revisar el archivo. Los respaldos son privados: no los subas a GitHub. Recuperar toda la base PostgreSQL requiere un respaldo adicional gestionado por el operador; el chat no hace restauraciones.",
    "fuentes",
  ],
  [
    /(neon|render|sin internet|offline|laptop|computadora apagada)/,
    "La versión pública ejecuta Node en Render y guarda los datos en PostgreSQL cuando está configurado. No depende de mantener encendida la laptop del equipo, pero sí de Internet y de la disponibilidad de esos servicios. Los planes gratuitos pueden suspenderse y tardar en despertar. La instalación local funciona por la red del equipo anfitrión y usa datos separados: no se sincroniza automáticamente con la nube.",
    "fuentes",
  ],
  [
    /(\bia\b|inteligencia artificial|preguntas abiertas|como respondes)/,
    "Por defecto soy una guía local con temas preparados, no un modelo de IA general. Puedo explicar ADN, SISMED, SIS, canales de orientación, privacidad, solicitudes, mapas y dispositivos. Si el operador configura un proveedor externo, puedes autorizar su uso con la casilla del chat: tu pregunta se enviará a ese proveedor. Nunca incluyas datos identificables o clínicos sensibles. VITARA no guarda un historial persistente del chat.",
    "fuentes",
  ],
  [
    /(fuentes|procedencia|fecha de corte|confiable|veracidad)/,
    "En Fuentes puedes revisar el origen, contexto y límites de cada tipo de información. La fecha de corte indica cuándo corresponde el reporte, no que se haya verificado hoy. Un modelo 3D o una ilustración no prueban disponibilidad de un recurso. El tablero regional, los mapas y los registros de participación tienen alcances distintos. Si falta información, VITARA debe decirlo en lugar de inventarla.",
    "fuentes",
  ],
];
export function localKnowledge(normalizedQuestion) {
  const match = topics.find(([pattern]) => pattern.test(normalizedQuestion));
  return match ? { answer: match[1], action: match[2] } : null;
}
