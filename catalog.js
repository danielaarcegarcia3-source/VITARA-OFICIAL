/*
 * Catálogo de Datos de Prueba - Ecosistema Digital ODS 3 y 9
 * Datos ficticios identificados como tales para la demostración 27N
 * Estructura real que podría usar datos reales en el futuro
 *
 * NOTA: Estos datos NO provienen de APIs externas en tiempo real.
 * Son datos de prueba para demostrar la funcionalidad del sistema.
*/

export const establishmentsData = [
  // Formato: id, nombre, distrito, tipo, recursos, estado, última actualización
  {
    id: "est-001",
    name: "Posta Médica - Trujillo Alto",
    district: "Trujillo",
    type: "posta",
    resources: ["medicamento-antialergicos", "equipo-respirador", "consulta-general"],
    status: "operativo",
    lastUpdate: "2026-11-19",
    description: "Posta de zona rural atendiendo a comunidades vecinales"
  },
  {
    id: "est-002",
    name: "Centro de Salud - Moche",
    district: "Moche",
    type: "centro-salud",
    resources: ["medicamento-antiinflamatorio", "equipo-oxigeno", "vacunas"],
    status: "no-disponible",
    lastUpdate: "2026-11-18",
    description: "Centro urbano con alta demanda de consultas"
  },
  {
    id: "est-003",
    name: "Posta de Salud - Virú",
    district: "Virú",
    type: "posta",
    resources: ["medicamento-antibioticico", "curaciones", "consulta-general"],
    status: "sin-confirmar",
    lastUpdate: "2026-11-19",
    description: "Posta alejada, acceso difícil por condiciones climáticas"
  }
];

export const resourcesData = [
  // Formato: id, nombre, categoría, descripción, unidad
  {
    id: "res-001",
    name: "Paracetamol 500mg",
    category: "medicamento",
    description: "Analgésico y antitérmico para síntomas leves",
    unit: "tableta"
  },
  {
    id: "res-002",
    name: "Amoxicilina 250mg",
    category: "medicamento",
    description: "Antibiótico para infecciones bacterianas",
    unit: "capsula"
  },
  {
    id: "res-003",
    name: "Equipo Respirador",
    category: "equipment",
    description: "Ventilador mecánico para soporte respiratorio",
    unit: "unidad"
  },
  {
    id: "res-004",
    name: "Suero Fisiológico",
    category: "medicamento",
    description: "Rehidratación y soporte médico básico",
    unit: "frasco"
  }
];

export const testRequestsData = [
  // Simulación de solicitudes en el sistema
  {
    id: "req-001",
    establishmentId: "est-001",
    resourceId: "res-001",
    userCode: "USR-DEMO-001",
    status: "pendiente",
    createdAt: "2026-11-20T10:00:00Z",
    message: "Solicitud de paracetamol para comunidad vecinal",
    source: "visitante"
  },
  {
    id: "req-002",
    establishmentId: "est-002",
    resourceId: "res-003",
    userCode: "USR-DEMO-002",
    status: "respondido",
    respondedAt: "2026-11-20T14:30:00Z",
    response: "Equipo disponible - en funcionamiento",
    source: "posta"
  }
];

export const testResponsesData = [
  // Respuestas del personal de posta
  {
    id: "resp-001",
    requestId: "req-001",
    postaId: "est-001",
    response: "disponible",
    message: "Stock disponible - 200 tabletas",
    sentAt: "2026-11-20T11:00:00Z",
    author: "personal-posta-001"
  }
];