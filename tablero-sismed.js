/**
 * tablero-sismed.js — Réplica Interactiva del Tablero Regional SISMED La Libertad
 * Basado en InfoSismedLL (Dirección Regional de Salud La Libertad)
 * Ecosistema Digital de Acceso a la Salud · Grupo 3 · ODS 3, 9 y 10
 */

(function () {
  'use strict';

  function montarTablero() {
    const contenedor = document.getElementById('tablero-regional-sismed');
    if (!contenedor) return;

    const dataSismed = window.DatosSaludPeru?.infoSismed;
    const ipressList = window.DatosSaludPeru?.ipress || [];
    const medicamentos = window.DatosSaludPeru?.medicamentos || [];
    const equipos = window.DatosSaludPeru?.equiposBiomedicos || [];
    const alertas = window.DatosSaludPeru?.alertasSanitarias || [];
    const kitsDengue = window.DatosSaludPeru?.kitsDengue || [];

    if (!dataSismed) return;

    contenedor.innerHTML = `
      <div class="tablero-sismed">
        <!-- 1. HEADER OFICIAL INFOSISMEDLL -->
        <header class="tablero__header">
          <div class="tablero__titulo-wrap">
            <div class="tablero__logo-sismed">SIS<br>MED</div>
            <div class="tablero__titulo">
              <h3>Tablero Regional Disponibilidad de Medicamentos Esenciales</h3>
              <div class="tablero__subtitulo">
                <span>Gerencia Regional de Salud La Libertad</span>
                <span>·</span>
                <span>Periodo: <strong>Octubre 2026</strong></span>
                <span>·</span>
                <span>Corte: <strong>31/10/2026</strong></span>
              </div>
            </div>
          </div>

          <div class="tablero__filtros-top">
            <div class="filtro-chip-select">
              <label for="filtro-ue">U.E.:</label>
              <select id="filtro-ue">
                <option value="todas">Todas</option>
                <option value="scarrion">Salud Sánchez Carrión</option>
                <option value="trujillo">Salud Trujillo</option>
                <option value="ascope">Salud Ascope</option>
                <option value="chepen">Salud Chepén</option>
                <option value="otuzco">Salud Otuzco</option>
                <option value="viru">Salud Virú</option>
              </select>
            </div>

            <div class="filtro-chip-select">
              <label for="filtro-red">Red:</label>
              <select id="filtro-red">
                <option value="todas">Todas (12 Redes)</option>
                <option value="RED SANCHEZ CARRION">Red Sánchez Carrión</option>
                <option value="RED ASCOPE">Red Ascope</option>
                <option value="RED TRUJILLO">Red Trujillo</option>
                <option value="RED BOLIVAR">Red Bolívar</option>
                <option value="RED OTUZCO">Red Otuzco</option>
                <option value="RED VIRU">Red Virú</option>
                <option value="RED PATAZ">Red Pataz</option>
                <option value="RED CHEPEN">Red Chepén</option>
                <option value="RED SANTIAGO DE CHUCO">Red Santiago de Chuco</option>
                <option value="RED JULCAN">Red Julcán</option>
                <option value="RED PACASMAYO">Red Pacasmayo</option>
                <option value="RED GRAN CHIMU">Red Gran Chimú</option>
              </select>
            </div>

            <span class="badge-ipress-count">IPRESS: <strong id="lbl-ipress-total">339</strong></span>
          </div>
        </header>

        <!-- 2. CARDS DE KPIS EXACTOS DE LA FOTO -->
        <div class="tablero__kpis">
          <div class="kpi-card kpi-card--sobre">
            <div class="kpi-card__valor">${dataSismed.kpis.sobrestock.valor}%</div>
            <div class="kpi-card__etiqueta">${dataSismed.kpis.sobrestock.etiqueta}</div>
          </div>
          <div class="kpi-card kpi-card--normo">
            <div class="kpi-card__valor">${dataSismed.kpis.normostock.valor}%</div>
            <div class="kpi-card__etiqueta">${dataSismed.kpis.normostock.etiqueta}</div>
          </div>
          <div class="kpi-card kpi-card--sub">
            <div class="kpi-card__valor">${dataSismed.kpis.substock.valor}%</div>
            <div class="kpi-card__etiqueta">${dataSismed.kpis.substock.etiqueta}</div>
          </div>
          <div class="kpi-card kpi-card--desab">
            <div class="kpi-card__valor">${dataSismed.kpis.desabastecido.valor}%</div>
            <div class="kpi-card__etiqueta">${dataSismed.kpis.desabastecido.etiqueta}</div>
          </div>
          <div class="kpi-card kpi-card--sinrot">
            <div class="kpi-card__valor">${dataSismed.kpis.sinRotacion.valor}%</div>
            <div class="kpi-card__etiqueta">${dataSismed.kpis.sinRotacion.etiqueta}</div>
          </div>
          <div class="kpi-card kpi-card--critico">
            <div class="kpi-card__valor">${dataSismed.kpis.critico.valor}%</div>
            <div class="kpi-card__etiqueta">${dataSismed.kpis.critico.etiqueta}</div>
          </div>
          <div class="kpi-card kpi-card--optimo">
            <div class="kpi-card__valor">${dataSismed.kpis.disponibilidadGlobal.valor}% ✓</div>
            <div class="kpi-card__etiqueta">
              ${dataSismed.kpis.disponibilidadGlobal.etiqueta}
              <small style="display:block; font-size:9px; opacity:0.85;">Meta: 91% (+1.85%)</small>
            </div>
          </div>
          <div class="kpi-card kpi-card--optimo" style="background:#044e3b; border-color:#059669;">
            <div class="kpi-card__valor" style="font-size:1.1rem; color:#6ee7b7;">ÓPTIMO</div>
            <div class="kpi-card__etiqueta" style="color:#a7f3d0;">NIVEL DISPO</div>
          </div>
        </div>

        <!-- 3. CUERPO: SIDEBAR Y CONTENIDO CENTRAL -->
        <div class="tablero__cuerpo">
          <!-- Sidebar con las opciones oficiales de InfoSismedLL -->
          <nav class="tablero__sidebar" aria-label="Módulos de InfoSismed">
            <button class="tablero-nav-btn activo" data-seccion="general">
              <span class="tablero-nav-btn__ico">📊</span>
              <span>Disponib. General</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="consumos">
              <span class="tablero-nav-btn__ico">📦</span>
              <span>Consumos 2018-2026</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="vacunas">
              <span class="tablero-nav-btn__ico">💉</span>
              <span>Alerta Expiración Vacunas</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="reacciones">
              <span class="tablero-nav-btn__ico">⚠️</span>
              <span>Farmacovigilancia</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="catalogo">
              <span class="tablero-nav-btn__ico">📋</span>
              <span>Catálogo SIGA / SISMED</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="detalle">
              <span class="tablero-nav-btn__ico">🏥</span>
              <span>IPRESS & Detalle</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="mapas">
              <span class="tablero-nav-btn__ico">🗺️</span>
              <span>Mapas Relieve & Redes</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="dengue">
              <span class="tablero-nav-btn__ico">🦟</span>
              <span>Kits Dengue & Brotes</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="genericos">
              <span class="tablero-nav-btn__ico">💊</span>
              <span>Precios vs Genéricos</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="biomedicos">
              <span class="tablero-nav-btn__ico">⚙️</span>
              <span>Equipos Biomédicos IETSI</span>
            </button>
            <button class="tablero-nav-btn" data-seccion="alertas">
              <span class="tablero-nav-btn__ico">🛑</span>
              <span>Lotes Falsificados</span>
            </button>
          </nav>

          <!-- Contenedor dinámico de paneles -->
          <main class="tablero__main" id="tablero-contenido-dinamico">
            <!-- Por defecto: Disponib. General (El tablero completo) -->
          </main>
        </div>
      </div>
    `;

    // Conectar eventos del Sidebar
    const botonesSidebar = contenedor.querySelectorAll('.tablero-nav-btn');
    botonesSidebar.forEach(btn => {
      btn.addEventListener('click', () => {
        botonesSidebar.forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        renderizarVista(btn.dataset.seccion);
      });
    });

    // Filtros de Red
    const filtroRed = document.getElementById('filtro-red');
    if (filtroRed) {
      filtroRed.addEventListener('change', () => {
        renderizarVista(document.querySelector('.tablero-nav-btn.activo')?.dataset.seccion || 'general');
      });
    }

    // Render inicial
    renderizarVista('general');
  }

  /**
   * Renderiza el contenido según la pestaña seleccionada
   */
  function renderizarVista(vistaId) {
    const contenedor = document.getElementById('tablero-contenido-dinamico');
    if (!contenedor) return;

    const dataSismed = window.DatosSaludPeru?.infoSismed;
    const ipressList = window.DatosSaludPeru?.ipress || [];
    const medicamentos = window.DatosSaludPeru?.medicamentos || [];
    const equipos = window.DatosSaludPeru?.equiposBiomedicos || [];
    const alertas = window.DatosSaludPeru?.alertasSanitarias || [];
    const kitsDengue = window.DatosSaludPeru?.kitsDengue || [];
    const filtroRedVal = document.getElementById('filtro-red')?.value || 'todas';

    // Filtrar IPRESS si se seleccionó una red específica
    const ipressFiltradas = filtroRedVal === 'todas' 
      ? ipressList 
      : ipressList.filter(ip => ip.red === filtroRedVal);

    if (vistaId === 'general') {
      contenedor.innerHTML = `
        <!-- VISTA DISPONIBILIDAD GENERAL (FOTO EXACTA) -->
        <div class="tablero__grid-visual">
          <!-- 1. Gráfico de Cascada: Variación mensual por Red -->
          <div class="tablero__panel-box">
            <div class="tablero__panel-cab">
              <h4>% Variación respecto al mes anterior</h4>
              <span style="font-size:10px; color:#94a3b8;"><span style="color:#10b981;">● Aumento</span> · <span style="color:#ef4444;">● Disminución</span></span>
            </div>
            ${generarGraficoWaterfall(dataSismed.variacionMensualPorRed)}
          </div>

          <!-- 2. Mapa Rápido de La Libertad de la foto -->
          <div class="tablero__panel-box">
            <div class="tablero__panel-cab">
              <h4>Mapa de Cobertura IPRESS La Libertad</h4>
              <button class="btn-toggle-3d" id="btn-ir-mapa-completo" type="button" style="font-size:10px;">Ver Mapa Grande</button>
            </div>
            <div id="mini-mapa-lalibertad" style="height:190px;"></div>
          </div>
        </div>

        <div class="tablero__grid-visual">
          <!-- 3. Barras Horizontales Apiladas: % Disponibilidad por Red -->
          <div class="tablero__panel-box">
            <div class="tablero__panel-cab">
              <h4>% Disponibilidad al 31/10/2026 por Red</h4>
              <span style="font-size:10px; color:#94a3b8;"><span style="color:#10b981;">■ Normo</span> · <span style="color:#0284c7;">■ Sobre</span></span>
            </div>
            ${generarGraficoBarrasRedes(dataSismed.redesSalud)}
          </div>

          <!-- 4. Línea de Tendencia 12 Meses -->
          <div class="tablero__panel-box">
            <div class="tablero__panel-cab">
              <h4>Comportamiento % Disponibilidad Últimos 12 Meses</h4>
              <span style="font-size:10px; color:#38bdf8;">Promedio: <strong>92.9%</strong></span>
            </div>
            ${generarGraficoTendencia(dataSismed.historico12Meses)}
          </div>
        </div>

        <!-- 5. Tabla Canónica de IPRESS (Cochabamba, Chugay, Uchubamba...) -->
        <div class="tablero__panel-box" style="margin-top:var(--e4);">
          <div class="tablero__panel-cab">
            <h4>Directorio de Establecimientos Monitoreados (${ipressFiltradas.length} sedes)</h4>
            <div style="display:flex; gap:8px;">
              <input type="search" id="busq-ipress-tabla" placeholder="Buscar IPRESS o código..." 
                     style="background:#091322; border:1px solid #334155; border-radius:6px; color:#fff; padding:4px 10px; font-size:11px;">
            </div>
          </div>
          ${generarTablaIpressHTML(ipressFiltradas)}
        </div>
      `;

      // Inicializar el mini-mapa vectorial
      if (window.MapasInteractivos) {
        window.MapasInteractivos.renderizarMapaLaLibertad('mini-mapa-lalibertad');
      }

      document.getElementById('btn-ir-mapa-completo')?.addEventListener('click', () => {
        document.querySelector('.tablero-nav-btn[data-seccion="mapas"]')?.click();
      });

      configurarBuscadorTablaIpress();

    } else if (vistaId === 'consumos') {
      const consumos = window.DatosSaludPeru?.consumosSismed;
      const p = consumos?.productoActual;
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>CONSUMOS 2018 - 2026 · InfoSismedLL (Dirección Regional de Salud La Libertad)</h4>
            <span class="badge-ipress-count" style="background:#0284c7;">Periodo: ${p?.periodo || '202610'}</span>
          </div>

          <div style="background:#06101e; border:1px solid #1e3a5f; border-radius:10px; padding:12px; margin-bottom:16px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px;">
            <div>
              <span style="font-size:10px; color:#38bdf8; text-transform:uppercase; font-weight:700;">Producto Seleccionado (Código: ${p?.codigo}):</span>
              <div style="font-size:1.1rem; font-weight:800; color:#fff;">${p?.nombre}</div>
              <small style="color:#94a3b8;">Estrategia: ${p?.estrategia} · Tipo de Consumo: ${p?.tipoConsumo}</small>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <div style="background:#091b29; border:1px solid #0284c7; padding:6px 12px; border-radius:8px; text-align:center;">
                <div style="font-size:10px; color:#94a3b8;">Consumo 2026</div>
                <div style="font-size:1.1rem; font-weight:800; color:#38bdf8; font-family:var(--fuente-mono);">${p?.totalConsumo2026.toLocaleString()}</div>
              </div>
              <div style="background:#091b29; border:1px solid #059669; padding:6px 12px; border-radius:8px; text-align:center;">
                <div style="font-size:10px; color:#94a3b8;">Stock Almacén</div>
                <div style="font-size:1.1rem; font-weight:800; color:#6ee7b7; font-family:var(--fuente-mono);">${p?.stockAlmacen.toLocaleString()}</div>
              </div>
              <div style="background:#091b29; border:1px solid #10b981; padding:6px 12px; border-radius:8px; text-align:center;">
                <div style="font-size:10px; color:#94a3b8;">Stock EESS (Postas)</div>
                <div style="font-size:1.1rem; font-weight:800; color:#10b981; font-family:var(--fuente-mono);">${p?.stockEESS.toLocaleString()}</div>
              </div>
              <div style="background:#091b29; border:1px solid #8b5cf6; padding:6px 12px; border-radius:8px; text-align:center;">
                <div style="font-size:10px; color:#94a3b8;">Total Disponible</div>
                <div style="font-size:1.1rem; font-weight:800; color:#c084fc; font-family:var(--fuente-mono);">${p?.stockTotalDisponible.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="tablero__grid-visual">
            <!-- Gráfico 1: Tendencia y Previsión de Consumo -->
            <div class="tablero__panel-box">
              <div class="tablero__panel-cab">
                <h4>Tendencia y Previsión de Consumo Próximo Año</h4>
                <span style="font-size:10px; color:#38bdf8;">Histórico 2018 - 2026</span>
              </div>
              ${generarGraficoTendenciaConsumo(consumos?.tendenciaAnual)}
            </div>

            <!-- Gráfico 2: Consumo Mismo Mes (Octubre) Años Anteriores -->
            <div class="tablero__panel-box">
              <div class="tablero__panel-cab">
                <h4>Consumo Mismo Mes (Octubre) en Años Anteriores</h4>
                <span style="font-size:10px; color:#94a3b8;">Comparativo Octubre 2018 - 2026</span>
              </div>
              ${generarGraficoMesOctubre(consumos?.consumoMismoMesOctubre)}
            </div>
          </div>

          <!-- Tabla de Consumo por Redes 2019 - 2026 -->
          <div class="tablero__panel-box" style="margin-top:var(--e3);">
            <div class="tablero__panel-cab">
              <h4>Detalle de Consumo por Red de Salud (2019 a 2026)</h4>
              <span style="font-size:11px; color:#94a3b8;">Corte SISMED La Libertad</span>
            </div>
            <div class="tablero__tabla-wrap">
              <table class="tabla-sismed">
                <thead>
                  <tr>
                    <th>Red de Salud</th>
                    <th>2019</th>
                    <th>2020</th>
                    <th>2021</th>
                    <th>2022</th>
                    <th>2023</th>
                    <th>2024</th>
                    <th>2025</th>
                    <th>2026 (Oct)</th>
                  </tr>
                </thead>
                <tbody>
                  ${(consumos?.consumoPorRedes || []).map(r => `
                    <tr>
                      <td><strong style="color:#fff;">${r.red}</strong></td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2019.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2020.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2021.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2022.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2023.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2024.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono); font-size:11px;">${r.c2025.toLocaleString()}</td>
                      <td><strong style="color:#38bdf8; font-family:var(--fuente-mono); font-size:11px;">${r.c2026.toLocaleString()}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

    } else if (vistaId === 'vacunas') {
      const v = window.DatosSaludPeru?.alertasExpiracion;
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>ALERTA EXPIRACIÓN Y CONTROL DE VACUNAS · GERESA LA LIBERTAD</h4>
            <span class="badge-ipress-count">Actualización: ${v?.fechaCorte}</span>
          </div>

          <!-- Cards de KPIs de Vacunas de la imagen oficial -->
          <div class="tablero__kpis" style="margin-bottom:var(--e4);">
            <div class="kpi-card" style="background:#7c2d12; border-color:#ea580c;">
              <div class="kpi-card__valor" style="color:#fed7aa;">142</div>
              <div class="kpi-card__etiqueta" style="color:#ffedd5;">Total Fechas Vto AEM Vacunas</div>
            </div>
            <div class="kpi-card" style="background:#091b29; border-color:#0284c7;">
              <div class="kpi-card__valor" style="color:#7dd3fc;">83</div>
              <div class="kpi-card__etiqueta" style="color:#bae6fd;">Fechas Vto Erradas EESS</div>
            </div>
            <div class="kpi-card kpi-card--desab">
              <div class="kpi-card__valor">312</div>
              <div class="kpi-card__etiqueta">IPRESS con Fecha Vto Erradas</div>
            </div>
            <div class="kpi-card kpi-card--optimo">
              <div class="kpi-card__valor">${v?.stockActualTotalDosis.toLocaleString()}</div>
              <div class="kpi-card__etiqueta">Dosis Stock Actual La Libertad</div>
            </div>
          </div>

          <div class="tablero__grid-visual">
            <!-- Tabla de Lotes y Registros Sanitarios -->
            <div class="tablero__panel-box">
              <div class="tablero__panel-cab">
                <h4>Fechas de Vencimiento Distribuidas por el Almacén (AEM)</h4>
                <span style="font-size:10px; color:#94a3b8;">Control de Trazabilidad</span>
              </div>
              <div class="tablero__tabla-wrap">
                <table class="tabla-sismed">
                  <thead>
                    <tr>
                      <th>Cód MFD</th>
                      <th>Fecha Vto Válida</th>
                      <th>Lote</th>
                      <th>Registro Sanitario</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(v?.lotesDistribuidos || []).map(l => `
                      <tr>
                        <td><code>${l.codMfd}</code></td>
                        <td>${l.fechaVencimientoValida}</td>
                        <td><strong style="color:#fff;">${l.lote}</strong></td>
                        <td><code style="color:${l.registroSan === 'SIN_REG_SAN' ? '#ef4444' : '#38bdf8'};">${l.registroSan}</code></td>
                        <td>
                          ${l.estado === 'VENCIDO' ? '<span class="badge-nivel badge-nivel--critico">Vencido</span>' :
                            l.estado === 'ALERTA_CRITICA' ? '<span class="badge-nivel badge-nivel--critico" style="background:#b91c1c;">¡Sin Reg. Sanitario!</span>' :
                            '<span class="badge-nivel badge-nivel--optimo">Conforme</span>'}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Gráfico de % Fechas Erradas por Red -->
            <div class="tablero__panel-box">
              <div class="tablero__panel-cab">
                <h4>% Fecha Vto Erradas por Red de Salud</h4>
                <span style="font-size:10px; color:#ef4444;">Incumplimiento de Registro</span>
              </div>
              ${generarGraficoBarrasVtoErradas(v?.rankingVtoErradasPorRed)}
            </div>
          </div>
        </div>
      `;

    } else if (vistaId === 'reacciones') {
      const f = window.DatosSaludPeru?.farmacovigilancia;
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>REACCIONES ADVERSAS (Farmacovigilancia e Incidentes Clínicos)</h4>
            <span class="badge-ipress-count" style="background:#0284c7;">${f?.totalReportes.toLocaleString()} Reportes Oficiales</span>
          </div>

          <div class="tablero__grid-visual">
            <!-- Embudo por Categoría -->
            <div class="tablero__panel-box">
              <div class="tablero__panel-cab">
                <h4>N° Reportes por Categoría de Establecimiento</h4>
                <span style="font-size:10px; color:#94a3b8;">54.5% en Nivel I</span>
              </div>
              <div style="padding:10px 0;">
                ${(f?.reportesPorCategoria || []).map(c => `
                  <div style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
                      <span style="color:#cbd5e1;">${c.categoria}</span>
                      <strong style="color:#38bdf8; font-family:var(--fuente-mono);">${c.total.toLocaleString()} (${c.pct}%)</strong>
                    </div>
                    <div style="height:8px; background:#1e293b; border-radius:4px; overflow:hidden;">
                      <div style="height:100%; background:#0284c7; width:${c.pct}%;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Variación Mensual de Reportes Waterfall -->
            <div class="tablero__panel-box">
              <div class="tablero__panel-cab">
                <h4>Variación Mensual de Reportes (Farmacovigilancia)</h4>
                <span style="font-size:10px; color:#94a3b8;"><span style="color:#ef4444;">● Aumento</span> · <span style="color:#f59e0b;">● Disminución</span></span>
              </div>
              ${generarGraficoWaterfallFarmaco(f?.variacionMensualWaterfall)}
            </div>
          </div>

          <!-- Tabla de Reportes por Redes y Categoría -->
          <div class="tablero__panel-box" style="margin-top:var(--e3);">
            <div class="tablero__panel-cab">
              <h4>Distribución de Notificaciones por Red de Salud</h4>
              <span style="font-size:11px; color:#38bdf8;">Top: Red Trujillo con 2,296 notificaciones</span>
            </div>
            <div class="tablero__tabla-wrap">
              <table class="tabla-sismed">
                <thead>
                  <tr>
                    <th>Red de Salud</th>
                    <th>Categoría I (Postas)</th>
                    <th>Categoría II (Hospitales)</th>
                    <th>Total Notificaciones</th>
                    <th>Nivel de Vigilancia</th>
                  </tr>
                </thead>
                <tbody>
                  ${(f?.reportesPorRed || []).map(r => `
                    <tr>
                      <td><strong style="color:#fff;">${r.red}</strong></td>
                      <td style="font-family:var(--fuente-mono);">${r.cat1.toLocaleString()}</td>
                      <td style="font-family:var(--fuente-mono);">${r.cat2.toLocaleString()}</td>
                      <td><strong style="color:#38bdf8; font-family:var(--fuente-mono);">${r.total.toLocaleString()}</strong></td>
                      <td>
                        <span class="badge-nivel ${r.total > 200 ? 'badge-nivel--optimo' : 'badge-nivel--critico'}">
                          ${r.total > 200 ? 'Alta Notificación' : 'Baja Notificación (Subregistro)'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

    } else if (vistaId === 'catalogo') {
      const cat = window.DatosSaludPeru?.catalogoSiga || [];
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>CATÁLOGO OFICIAL SIGA / SISMED DE PRODUCTOS FARMACÉUTICOS</h4>
            <span style="font-size:11px; color:#94a3b8;">UTF DIRESA La Libertad · sismed@diresalalibertad.gob.pe</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:var(--e3);">
            Nomenclatura oficial con código SIGA nacional, código SISMED regional, concentración, presentación y estado normativo.
          </p>

          <div style="margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <input type="search" id="busq-catalogo-siga" placeholder="Filtrar por código SIGA, SISMED o nombre..." style="flex:1; min-width:240px; background:#040810; border:1px solid #334155; border-radius:8px; color:#fff; padding:8px 12px; font-size:12px;">
            <select id="filtro-estado-siga" style="background:#040810; border:1px solid #334155; border-radius:8px; color:#fff; padding:8px 12px; font-size:12px;">
              <option value="todos">Todos los Estados</option>
              <option value="CONFORME">Solo CONFORME (Vigentes)</option>
              <option value="INACTIVO">Solo INACTIVO (Retirados)</option>
            </select>
          </div>

          <div class="tablero__tabla-wrap">
            <table class="tabla-sismed" id="tabla-siga-sismed">
              <thead>
                <tr>
                  <th>Cod SIGA</th>
                  <th>SISMED</th>
                  <th>Producto</th>
                  <th>Forma Farmacéutica</th>
                  <th>Presentación</th>
                  <th>Concentración</th>
                  <th>Estado</th>
                  <th>F. Creación</th>
                </tr>
              </thead>
              <tbody id="tbody-catalogo-siga">
                ${cat.map(c => `
                  <tr>
                    <td><code style="color:#7dd3fc; font-size:10px;">${c.codSiga}</code></td>
                    <td><strong style="color:#38bdf8; font-family:var(--fuente-mono);">${c.sismed}</strong></td>
                    <td><strong style="color:#fff;">${c.producto}</strong></td>
                    <td>${c.ff}</td>
                    <td style="color:#94a3b8;">${c.present}</td>
                    <td>${c.concent}</td>
                    <td>
                      ${c.estado === 'CONFORME'
                        ? '<span class="badge-nivel badge-nivel--optimo">✓ CONFORME</span>'
                        : '<span class="badge-nivel badge-nivel--critico">✕ INACTIVO</span>'}
                    </td>
                    <td style="font-size:10px; color:#64748b;">${c.creacion}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Buscador interactivo de catálogo SIGA
      const inputBusq = document.getElementById('busq-catalogo-siga');
      const selectEstado = document.getElementById('filtro-estado-siga');
      const tbody = document.getElementById('tbody-catalogo-siga');

      const filtrarCatalogo = () => {
        const q = inputBusq.value.trim().toLowerCase();
        const est = selectEstado.value;
        const filtrados = cat.filter(c => {
          const coincideTexto = !q || c.producto.toLowerCase().includes(q) || c.sismed.includes(q) || c.codSiga.includes(q);
          const coincideEstado = est === 'todos' || c.estado === est;
          return coincideTexto && coincideEstado;
        });

        tbody.innerHTML = filtrados.map(c => `
          <tr>
            <td><code style="color:#7dd3fc; font-size:10px;">${c.codSiga}</code></td>
            <td><strong style="color:#38bdf8; font-family:var(--fuente-mono);">${c.sismed}</strong></td>
            <td><strong style="color:#fff;">${c.producto}</strong></td>
            <td>${c.ff}</td>
            <td style="color:#94a3b8;">${c.present}</td>
            <td>${c.concent}</td>
            <td>
              ${c.estado === 'CONFORME'
                ? '<span class="badge-nivel badge-nivel--optimo">✓ CONFORME</span>'
                : '<span class="badge-nivel badge-nivel--critico">✕ INACTIVO</span>'}
            </td>
            <td style="font-size:10px; color:#64748b;">${c.creacion}</td>
          </tr>
        `).join('');
      };

      inputBusq?.addEventListener('input', filtrarCatalogo);
      selectEstado?.addEventListener('change', filtrarCatalogo);

    } else if (vistaId === 'detalle') {
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>Catálogo Detallado de IPRESS en La Libertad</h4>
            <span style="font-size:11px; color:#94a3b8;">Fuente: RENIPRESS · SUSALUD CSV Mensual</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:var(--e3);">
            Consulta el nivel registral, categoría (I-1 a III-1), coordenadas geográficas, teléfono publicado
            y disponibilidad de medicamentos esenciales confirmada por la sede.
          </p>
          ${generarTablaIpressHTML(ipressFiltradas, true)}
        </div>
      `;
      configurarBuscadorTablaIpress();

    } else if (vistaId === 'mapas') {
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>Mapas Geográficos de Inteligencia Sanitaria</h4>
            <div class="mapa-view-switch">
              <button class="btn-map-switch activo" id="btn-ver-lalibertad">Región La Libertad (12 Redes)</button>
              <button class="btn-map-switch" id="btn-ver-peru">Nacional Perú (25 Departamentos)</button>
            </div>
          </div>

          <div id="contenedor-mapa-activo" style="margin-top:var(--e3);"></div>
        </div>
      `;

      const renderLaLibertad = () => {
        document.getElementById('btn-ver-lalibertad').classList.add('activo');
        document.getElementById('btn-ver-peru').classList.remove('activo');
        if (window.MapasInteractivos) {
          window.MapasInteractivos.renderizarMapaLaLibertad('contenedor-mapa-activo');
        }
      };

      const renderPeru = () => {
        document.getElementById('btn-ver-peru').classList.add('activo');
        document.getElementById('btn-ver-lalibertad').classList.remove('activo');
        if (window.MapasInteractivos) {
          window.MapasInteractivos.renderizarMapaPeru('contenedor-mapa-activo');
        }
      };

      document.getElementById('btn-ver-lalibertad')?.addEventListener('click', renderLaLibertad);
      document.getElementById('btn-ver-peru')?.addEventListener('click', renderPeru);

      renderLaLibertad();

    } else if (vistaId === 'dengue') {
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>Monitoreo Especial: Kits de Emergencia y Dengue (InfoSismedLL)</h4>
            <span class="badge-ipress-count" style="background:#dc2626;">Alerta Epidemiológica</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:var(--e3);">
            Seguimiento de insumos críticos para la contención de brotes en la costa norte (Chepén, Ascope, Trujillo y Virú).
            Fuente: InfoSismedLL - Dispodengue.php.
          </p>

          <div class="tablero__tabla-wrap">
            <table class="tabla-sismed">
              <thead>
                <tr>
                  <th>Insumo / Medicamento</th>
                  <th>Tipo</th>
                  <th>Indicación Clínica</th>
                  <th>Stock en Almacén Regional</th>
                  <th>Estado en Red</th>
                </tr>
              </thead>
              <tbody>
                ${kitsDengue.map(k => `
                  <tr>
                    <td><strong>${k.item}</strong></td>
                    <td><span class="badge-nivel badge-nivel--optimo">${k.tipo}</span></td>
                    <td style="color:#94a3b8;">${k.indicacion}</td>
                    <td><strong style="color:#38bdf8; font-family:var(--fuente-mono);">${k.stockTotalLaLibertad}</strong></td>
                    <td><span style="color:#34d399; font-weight:700;">${k.disponibilidadRed}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    } else if (vistaId === 'genericos') {
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>Observatorio DIGEMID: Comparador de Genéricos vs Marca (Ley 29459 & 32033)</h4>
            <span style="font-size:11px; color:#38bdf8;">Ahorro de hasta 96.1%</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:var(--e3);">
            Por ley, el medicamento genérico DCI tiene exactamente el mismo principio activo, eficacia y calidad certificada.
            Compara aquí los precios oficiales reportados por farmacias autorizadas.
          </p>

          <div class="tablero__tabla-wrap">
            <table class="tabla-sismed">
              <thead>
                <tr>
                  <th>Medicamento (DCI)</th>
                  <th>Concentración</th>
                  <th>Precio Genérico DCI</th>
                  <th>Marca Comercial Referente</th>
                  <th>Precio Marca</th>
                  <th>Ahorro (%)</th>
                  <th>Acción Terapéutica</th>
                  <th>Disponibilidad Pública</th>
                </tr>
              </thead>
              <tbody>
                ${medicamentos.map(m => `
                  <tr>
                    <td><strong style="color:#f1f5f9;">${m.dci}</strong></td>
                    <td>${m.concentracion} (${m.forma})</td>
                    <td><strong style="color:#34d399; font-family:var(--fuente-mono);">S/ ${m.precioGenericoMin.toFixed(2)}</strong></td>
                    <td style="color:#94a3b8;">${m.marcaComercial}</td>
                    <td><strong style="color:#f87171; font-family:var(--fuente-mono);">S/ ${m.precioMarcaPromedio.toFixed(2)}</strong></td>
                    <td><span class="badge-nivel badge-nivel--optimo" style="font-size:11px;">-${m.ahorroPorcentaje}%</span></td>
                    <td style="font-size:10px; color:#94a3b8;">${m.accionTerapeutica}</td>
                    <td><span style="color:#38bdf8; font-weight:700;">${m.disponibilidadRed}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    } else if (vistaId === 'biomedicos') {
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>Equipos Biomédicos Críticos (Norma IETSI-EsSalud & Contraloría 2026)</h4>
            <span class="badge-ipress-count">10 Equipos Evaluados</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:var(--e3);">
            Fallas reales documentadas por la Contraloría General de la República en hospitales de La Libertad y Lima.
            La plataforma permite reportar incidencias con trazabilidad inmutable.
          </p>

          <div class="tablero__tabla-wrap">
            <table class="tabla-sismed">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Código IETSI</th>
                  <th>Servicio Afectado</th>
                  <th>Criticidad</th>
                  <th>Evidencia Oficial de Falla (Contraloría)</th>
                  <th>Mantenimiento Requerido</th>
                </tr>
              </thead>
              <tbody>
                ${equipos.map(eq => `
                  <tr>
                    <td><strong style="color:#fff;">${eq.nombre}</strong></td>
                    <td><code style="color:#38bdf8; font-size:10px;">${eq.codigoIETSI}</code></td>
                    <td style="color:#cbd5e1;">${eq.servicio}</td>
                    <td><span class="badge-nivel ${eq.criticidad === 'EXTREMA' || eq.criticidad === 'MUY ALTA' || eq.criticidad === 'ALTA' ? 'badge-nivel--critico' : 'badge-nivel--optimo'}">${eq.criticidad}</span></td>
                    <td style="color:#fca5a5; font-size:10.5px;">${eq.fallaAcreditada}</td>
                    <td style="color:#94a3b8; font-size:10px;">${eq.protocoloMantenimiento}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    } else if (vistaId === 'alertas') {
      contenedor.innerHTML = `
        <div class="tablero__panel-box">
          <div class="tablero__panel-cab">
            <h4>Alertas Sanitarias DIGEMID: Lotes Falsificados y Pesquisas</h4>
            <span class="badge-ipress-count" style="background:#b91c1c;">Vigilancia Activa</span>
          </div>
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:var(--e3);">
            Alertas oficiales emitidas por la Dirección General de Medicamentos, Insumos y Drogas (DIGEMID).
            Ningún producto pesquisado o falsificado puede ser dispensado en el ecosistema.
          </p>

          <div class="tablero__tabla-wrap">
            <table class="tabla-sismed">
              <thead>
                <tr>
                  <th>N° Alerta</th>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Lote Afectado</th>
                  <th>Motivo de Alerta</th>
                  <th>Medida Sanitaria</th>
                </tr>
              </thead>
              <tbody>
                ${alertas.map(al => `
                  <tr>
                    <td><strong style="color:#ef4444;">${al.num}</strong></td>
                    <td>${al.fecha}</td>
                    <td><strong style="color:#fff;">${al.producto}</strong></td>
                    <td><code style="color:#facc15;">${al.lote}</code></td>
                    <td style="color:#cbd5e1; font-size:10.5px;">${al.motivo}</td>
                    <td><span class="badge-nivel badge-nivel--critico">${al.accion}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  // --- GENERADORES DE GRÁFICOS SVG NATIVOS ---

  function generarGraficoWaterfall(datos) {
    if (!datos || !datos.length) return '';
    const ancho = 440;
    const alto = 180;
    const paddingX = 40;
    const paddingY = 20;

    let bars = '';
    const barWidth = 32;
    const pasoX = (ancho - paddingX * 2) / datos.length;

    datos.forEach((d, idx) => {
      const x = paddingX + idx * pasoX;
      const esPos = d.delta >= 0;
      const altura = Math.abs(d.delta) * 25;
      const y = esPos ? (alto / 2 - altura) : (alto / 2);
      const color = esPos ? '#10b981' : '#ef4444';
      const label = (esPos ? '+' : '') + d.delta + '%';
      const nombreCorto = d.red.replace('RED ', '').substring(0, 7);

      bars += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(4, altura)}" fill="${color}" rx="3"></rect>
        <text x="${x + barWidth / 2}" y="${esPos ? y - 5 : y + altura + 12}" font-size="9" font-weight="700" fill="${color}" text-anchor="middle">${label}</text>
        <text x="${x + barWidth / 2}" y="${alto - 4}" font-size="8" fill="#94a3b8" text-anchor="middle">${nombreCorto}</text>
      `;
    });

    return `
      <svg class="svg-chart" viewBox="0 0 ${ancho} ${alto}">
        <line x1="${paddingX - 10}" y1="${alto / 2}" x2="${ancho - 10}" y2="${alto / 2}" stroke="#334155" stroke-dasharray="3,3" />
        ${bars}
      </svg>
    `;
  }

  function generarGraficoBarrasRedes(redes) {
    if (!redes || !redes.length) return '';
    const ancho = 440;
    const alto = 220;
    const pasoY = alto / redes.length;
    const barHeight = 11;

    let rows = '';
    redes.forEach((r, idx) => {
      const y = idx * pasoY + 4;
      const wNormo = (r.normo / 100) * 220;
      const wSobre = (r.sobre / 100) * 220;
      const nombre = r.nombre.replace('RED ', '');

      rows += `
        <text x="5" y="${y + 9}" font-size="8.5" font-weight="700" fill="#cbd5e1">${nombre}</text>
        <rect x="140" y="${y}" width="${wNormo}" height="${barHeight}" fill="#10b981" rx="2"></rect>
        <rect x="${140 + wNormo}" y="${y}" width="${wSobre}" height="${barHeight}" fill="#0284c7" rx="2"></rect>
        <text x="${140 + wNormo + wSobre + 6}" y="${y + 9}" font-size="9" font-weight="800" fill="#38bdf8">${r.dispo}%</text>
      `;
    });

    return `
      <svg class="svg-chart" style="height:220px;" viewBox="0 0 ${ancho} ${alto}">
        ${rows}
      </svg>
    `;
  }

  function generarGraficoTendencia(meses) {
    if (!meses || !meses.length) return '';
    const ancho = 440;
    const alto = 180;
    const paddingX = 35;
    const paddingY = 25;

    const min = 90.0;
    const max = 95.0;

    let puntos = [];
    const pasoX = (ancho - paddingX * 2) / (meses.length - 1);

    meses.forEach((m, idx) => {
      const x = paddingX + idx * pasoX;
      const y = alto - paddingY - ((m.dispo - min) / (max - min)) * (alto - paddingY * 2);
      puntos.push({ x, y, valor: m.dispo, mes: m.mes.split(' ')[0] });
    });

    const dPath = puntos.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    let dotsAndLabels = '';
    puntos.forEach(p => {
      dotsAndLabels += `
        <circle class="chart-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5"></circle>
        <text x="${p.x.toFixed(1)}" y="${p.y - 7}" font-size="8" font-weight="700" fill="#38bdf8" text-anchor="middle">${p.valor}%</text>
        <text x="${p.x.toFixed(1)}" y="${alto - 8}" font-size="7.5" fill="#94a3b8" text-anchor="middle">${p.mes}</text>
      `;
    });

    return `
      <svg class="svg-chart" viewBox="0 0 ${ancho} ${alto}">
        <!-- Línea meta 91% -->
        <line x1="${paddingX}" y1="${alto - paddingY - ((91.0 - min) / (max - min)) * (alto - paddingY * 2)}" 
              x2="${ancho - paddingX}" y2="${alto - paddingY - ((91.0 - min) / (max - min)) * (alto - paddingY * 2)}" 
              stroke="#eab308" stroke-dasharray="4,3" opacity="0.6" />
        <path class="chart-line" d="${dPath}" />
        ${dotsAndLabels}
      </svg>
    `;
  }

  function generarGraficoTendenciaConsumo(datos) {
    if (!datos || !datos.length) return '';
    const ancho = 440;
    const alto = 180;
    const paddingX = 40;
    const paddingY = 25;
    const pasoX = (ancho - paddingX * 2) / (datos.length - 1);
    const max = 15000;
    const min = 0;

    const puntos = datos.map((d, idx) => ({
      x: paddingX + idx * pasoX,
      y: alto - paddingY - (d.consumo / max) * (alto - paddingY * 2),
      val: d.consumo,
      anio: d.anio
    }));

    const dPath = puntos.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    let dots = '';
    puntos.forEach(p => {
      dots += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5"></circle>
        <rect x="${p.x - 14}" y="${p.y - 18}" width="28" height="12" rx="3" fill="#0f172a" stroke="#334155"></rect>
        <text x="${p.x}" y="${p.y - 9}" font-size="7.5" font-weight="700" fill="#38bdf8" text-anchor="middle">${p.val.toLocaleString()}</text>
        <text x="${p.x}" y="${alto - 8}" font-size="8" fill="#94a3b8" text-anchor="middle">${p.anio}</text>
      `;
    });

    // Zona de previsión sombreada para 2027
    const lastP = puntos[puntos.length - 1];
    const prevX = ancho - 15;
    const prevY = alto - paddingY - (8500 / max) * (alto - paddingY * 2);

    return `
      <svg class="svg-chart" viewBox="0 0 ${ancho} ${alto}">
        <polygon points="${lastP.x},${lastP.y} ${prevX},${prevY - 20} ${prevX},${prevY + 20} ${lastP.x},${lastP.y}" fill="rgba(56, 189, 248, 0.15)"></polygon>
        <line x1="${lastP.x}" y1="${lastP.y}" x2="${prevX}" y2="${prevY}" stroke="#38bdf8" stroke-dasharray="4,4"></line>
        <path d="${dPath}" fill="none" stroke="#0284c7" stroke-width="2.5"></path>
        ${dots}
        <text x="${prevX}" y="${alto - 8}" font-size="7.5" fill="#38bdf8" text-anchor="middle">2027 (Prev)</text>
      </svg>
    `;
  }

  function generarGraficoMesOctubre(datos) {
    if (!datos || !datos.length) return '';
    const ancho = 440;
    const alto = 180;
    const paddingX = 35;
    const paddingY = 25;
    const max = 2200;
    const barWidth = 24;
    const pasoX = (ancho - paddingX * 2) / datos.length;

    let bars = '';
    datos.forEach((d, idx) => {
      const x = paddingX + idx * pasoX;
      const h = (d.cantidad / max) * (alto - paddingY * 2);
      const y = alto - paddingY - h;

      bars += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(2, h)}" fill="#0284c7" rx="3"></rect>
        <text x="${x + barWidth / 2}" y="${y - 4}" font-size="8" font-weight="700" fill="#38bdf8" text-anchor="middle">${d.cantidad.toLocaleString()}</text>
        <text x="${x + barWidth / 2}" y="${alto - 10}" font-size="8" fill="#cbd5e1" text-anchor="middle">${d.anio}</text>
        <text x="${x + barWidth / 2}" y="${alto - 2}" font-size="6.5" fill="#64748b" text-anchor="middle">oct</text>
      `;
    });

    return `
      <svg class="svg-chart" viewBox="0 0 ${ancho} ${alto}">
        ${bars}
      </svg>
    `;
  }

  function generarGraficoBarrasVtoErradas(redes) {
    if (!redes || !redes.length) return '';
    const ancho = 440;
    const alto = 240;
    const pasoY = alto / redes.length;
    const barHeight = 11;

    let rows = '';
    redes.forEach((r, idx) => {
      const y = idx * pasoY + 4;
      const w = (r.porcentaje / 50) * 230; // escala hasta 50%
      const nombre = r.red.replace('RED ', '').substring(0, 14);

      rows += `
        <text x="5" y="${y + 9}" font-size="8" font-weight="700" fill="#cbd5e1">${nombre}</text>
        <rect x="130" y="${y}" width="${w}" height="${barHeight}" fill="#0284c7" rx="2"></rect>
        <text x="${130 + w + 6}" y="${y + 9}" font-size="8.5" font-weight="800" fill="#ef4444">${r.porcentaje}%</text>
      `;
    });

    return `
      <svg class="svg-chart" style="height:240px;" viewBox="0 0 ${ancho} ${alto}">
        ${rows}
      </svg>
    `;
  }

  function generarGraficoWaterfallFarmaco(datos) {
    if (!datos || !datos.length) return '';
    const ancho = 440;
    const alto = 180;
    const paddingX = 35;
    const paddingY = 20;
    const barWidth = 22;
    const pasoX = (ancho - paddingX * 2) / datos.length;

    let bars = '';
    datos.forEach((d, idx) => {
      const x = paddingX + idx * pasoX;
      const esPos = d.var >= 0;
      const h = Math.abs(d.var) * 0.22;
      const y = esPos ? (alto / 2 - h) : (alto / 2);
      const color = esPos ? '#ef4444' : '#f59e0b'; // aumento de reacciones adversas es de color rojo
      const label = (esPos ? '+' : '') + d.var;
      const mes = d.mes.substring(4);

      bars += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(3, h)}" fill="${color}" rx="2"></rect>
        <text x="${x + barWidth / 2}" y="${esPos ? y - 4 : y + h + 10}" font-size="7.5" font-weight="700" fill="${color}" text-anchor="middle">${label}</text>
        <text x="${x + barWidth / 2}" y="${alto - 4}" font-size="7.5" fill="#94a3b8" text-anchor="middle">${mes}</text>
      `;
    });

    return `
      <svg class="svg-chart" viewBox="0 0 ${ancho} ${alto}">
        <line x1="${paddingX - 10}" y1="${alto / 2}" x2="${ancho - 10}" y2="${alto / 2}" stroke="#334155" stroke-dasharray="3,3" />
        ${bars}
      </svg>
    `;
  }

  function generarTablaIpressHTML(lista, extendida = false) {
    return `
      <div class="tablero__tabla-wrap">
        <table class="tabla-sismed" id="tabla-ipress-sismed">
          <thead>
            <tr>
              <th>Ejecutora</th>
              <th>Red</th>
              <th>Microred</th>
              <th>Cód. RENIPRESS</th>
              <th>Establecimiento</th>
              <th>%Sobrestk</th>
              <th>%Normostk</th>
              <th>%Substk</th>
              <th>%Desab.</th>
              <th>%DISPO</th>
              <th>Fecha Info</th>
              <th>Nivel</th>
              ${extendida ? '<th>Teléfono</th><th>Horario</th><th>Telesalud</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${lista.map(ip => `
              <tr class="fila-ipress" data-nombre="${ip.nombre.toLowerCase()}" data-cod="${ip.cod}">
                <td style="color:#94a3b8; font-size:10px;">${ip.ejecutora}</td>
                <td><strong style="color:#cbd5e1;">${ip.red}</strong></td>
                <td style="color:#94a3b8;">${ip.microred}</td>
                <td><code style="color:#38bdf8; font-weight:700;">${ip.cod}</code></td>
                <td><strong style="color:#fff;">${ip.nombre}</strong> <span style="font-size:9px; color:#38bdf8;">(${ip.categoria})</span></td>
                <td style="color:#7dd3fc; font-family:var(--fuente-mono);">${ip.sobre.toFixed(1)}%</td>
                <td style="color:#86efac; font-family:var(--fuente-mono);">${ip.normo.toFixed(1)}%</td>
                <td style="color:#fde047; font-family:var(--fuente-mono);">${ip.sub.toFixed(1)}%</td>
                <td style="color:#fca5a5; font-family:var(--fuente-mono);">${ip.desab.toFixed(1)}%</td>
                <td><strong style="color:#34d399; font-size:12px; font-family:var(--fuente-mono);">${ip.dispo.toFixed(1)}%</strong></td>
                <td style="color:#94a3b8; font-size:10px;">${ip.fechaInfo}</td>
                <td><span class="badge-nivel ${ip.nivel === 'OPTIMO' ? 'badge-nivel--optimo' : 'badge-nivel--critico'}">${ip.nivel}</span></td>
                ${extendida ? `
                  <td style="color:#cbd5e1;">${ip.telefono}</td>
                  <td style="font-size:10px;">${ip.horario}</td>
                  <td>${ip.telesalud ? '<span style="color:#34d399;">✓ Conectada</span>' : '<span style="color:#94a3b8;">—</span>'}</td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function configurarBuscadorTablaIpress() {
    const input = document.getElementById('busq-ipress-tabla');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filas = document.querySelectorAll('.fila-ipress');
      filas.forEach(f => {
        const txt = f.dataset.nombre + ' ' + f.dataset.cod;
        f.style.display = txt.includes(q) ? '' : 'none';
      });
    });
  }

  // Inicialización
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarTablero);
  } else {
    montarTablero();
  }

  window.TableroRegionalSismed = { montarTablero };
})();
