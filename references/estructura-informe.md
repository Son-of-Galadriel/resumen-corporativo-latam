# Estructura del informe y presupuesto de páginas

Meta: **entre 17 y 25 páginas; el máximo es 25**. El presupuesto siguiente suma 22 páginas y deja margen. Ajuste según la riqueza de datos de cada empresa: una sección con poco contenido verificable debe ser corta, no rellenarse.

| Bloque | Páginas |
|---|---|
| Portada | 1 |
| 1. Historia y ADN | 2 a 3 |
| 2. Estructura de propiedad | 1,5 a 2 |
| 3. Presencia geográfica y operaciones | 1,5 a 2 |
| 4. Líneas de negocio y rentabilidad | 2 a 3 |
| 5. Análisis financiero | 3 a 4 |
| 6. La acción | 3 a 4 |
| 7. Dividendos | 1,5 a 2 |
| 8. Riesgos | 1 a 1,5 |
| 9. Noticias y catalizadores | 1,5 a 2 |
| 10. Conclusión | 1,5 a 2 |
| Glosario | 1 (máximo) |
| Fuentes | 1 a 2 (última página del informe) |

Cada sección abre en página nueva por defecto. Si el total excede 25, use `meta.salto_pagina_secciones: false`.

## Portada

Cuadro oscuro (lo genera el script con el diseño de referencia):
- Etiqueta superior (por defecto "RESUMEN CORPORATIVO · SECTOR · PAÍS").
- **Nombre de la empresa.**
- `aspecto_relevante`: una frase con el rasgo más distintivo (por ejemplo, antigüedad, liderazgo, modelo de negocio o récord reciente).
- `linea_bolsas`: bolsa principal, ticker, bolsas secundarias, índice bursátil y grupo controlador si aplica.
- Fecha del informe (mes y año) y "Análisis Fundamental Completo".

Debajo, dos tablas resumen de 5 filas (`resumen_izq`, `resumen_der`) con: acciones totales, capitalización bursátil, bolsas donde cotiza, caja libre, valor de empresa, EBITDA, patrimonio contable, ROIC, PER y un décimo indicador. Ajuste por sector según `sectores.md`. Una nota breve indica moneda, fecha de los datos y el significado de "~".

## Sección 1 — Historia y ADN de la Empresa
1.1 Origen: año de fundación y fundador(es); contexto. 1.2 Hitos históricos clave (tabla Año / Hito / Relevancia: expansiones, adquisiciones, crisis, cambios de control, transformaciones). 1.3 Modelo de negocio actual, y declaración explícita del **sector**. Cierre con nota didáctica.

## Sección 2 — Estructura de Propiedad
2.1 Dueños o familia controladora, con explicación del control (pactos, series de acciones, holdings). 2.2 **Top 5 accionistas con % de participación** (tabla con fecha del dato). 2.3 Fecha de inicio de cotización, bolsas y tickers (`kv`). Directorio y gerencia si aportan valor. Un recuadro (`callout`) sobre lo que significa la estructura para el accionista minoritario.

## Sección 3 — Presencia Geográfica y Operaciones
Países donde opera; **número de tiendas o locales por país y formato** (o su equivalente sectorial: sucursales, plantas, sitios, oficinas); **total de empleados** (con fecha). Tabla por país y formato; mapa mental en texto, no imagen.

## Sección 4 — Líneas de Negocio y Rentabilidad
Desglose de ingresos por segmento (gráfico de dona o barras); **línea o producto de mayor margen** destacado en un recuadro; **tabla comparativa de segmentos** (ingresos, % del total, margen, tendencia con ▲ ▼).

## Sección 5 — Análisis Financiero
Ingresos, EBITDA y utilidad neta de los **últimos 3 años** (tabla y gráfico de barras agrupadas); deuda y estructura de financiamiento (bancos, bonos, moneda, vencimientos, tasa fija o variable); ratios clave: P/E, EV/EBITDA, Deuda/EBITDA (o sus sustitutos sectoriales). Nota sobre calidad de utilidades y sobre lo calculado.

## Sección 6 — La Acción
6.1 Historial de precio de **5 a 10 años** (gráfico de línea con SMA 200 si hay datos, más tabla de períodos y eventos). 6.2 Datos bursátiles actuales (precio, rango de 52 semanas, capitalización, beta, PER, P/VL). 6.3 **Por qué está al precio actual:** factores específicos y fechados (resultados recientes, prensa económica local, cambios regulatorios, movimientos de los grandes accionistas). 6.4 **Precio objetivo de analistas y consenso** (número de analistas, fecha, fuente). 6.5 **Factores que mueven el precio** (tabla: factor, dirección ▲▼, impacto, explicación), tanto al alza como a la baja.

## Sección 7 — Política y Historial de Dividendos
Política formal (mínimo legal del país verificado, política de la empresa, calendario de pago); **historial de los últimos 5 años** (tabla y gráfico: dividendo por acción, razón de pago, yield); **dividend yield actual** con su fecha y si es bruto.

## Sección 8 — Análisis de Riesgos
Tabla con `colorear_col` en la columna de nivel: **Alto / Medio-Alto / Medio / Bajo-Medio / Bajo**, con una descripción concreta de cada riesgo (regulatorio, macro, competitivo, financiero, operativo, político, ciberseguridad, gobierno corporativo). Ordene de mayor a menor. Mencione el regulador del país. Nutra la tabla con la prensa económica local, los gremios del sector y los organismos públicos (`prensa-y-gremios.md`): cada riesgo importante debe apoyarse en un hecho fechado y con fuente, no en una opinión genérica.

## Sección 9 — Noticias y Catalizadores Futuros
9.1 Cronología de noticias recientes (fecha, noticia, impacto). 9.2 **Eventos próximos conocidos** (resultados con fecha, expansiones, regulaciones, juntas de accionistas, emisiones de deuda). Solo hechos verificables; separe los supuestos y rotule como no confirmado lo que la prensa informe como negociación o rumor. Combine el regulador (hechos esenciales, calendario de resultados) con la prensa económica local y los gremios (proyectos de ley, licitaciones, cambios normativos del sector); indique medio y fecha de cada noticia.

## Sección 10 — Conclusión del Informe
10.1 **Resumen ejecutivo en 5 a 7 puntos** (`lista_numerada`, cada punto con un titular en negrita). 10.2 Tabla resumen final (calidad, situación financiera, rentabilidad, precio, dividendos, riesgo principal, próximo catalizador, perfil de inversor). Cierre con el **aviso legal** en un recuadro rojo: informativo y educativo, no es recomendación de inversión, riesgos, fecha de los datos.

## Glosario
10 a 15 términos, máximo una página. Obligatorios: EBITDA, EBIT, ROIC, ROE, PER, SMA. Sugeridos: Valor de empresa (EV), Deuda/EBITDA, Dividend yield, Capitalización bursátil, Razón de pago (payout), P/VL, Flujo de caja libre, y los específicos del sector (por ejemplo CET1 o NIM en banca). Cada término: definición en una o dos líneas y fórmula si aplica. El script lo produce con `glosario` en el JSON.

## Fuentes
Última página. Lista numerada (el script la produce): título, enlace, uso y fecha de acceso. Las fuentes fuera del listado preferente se marcan `complementaria: true` con `motivo`; el script las destaca y explica.

## Estilo de redacción

- Frases claras, formales, sin jerga innecesaria. Defina cada sigla la primera vez.
- Dé el "por qué importa" de cada dato, no solo el dato.
- Use negrita para conceptos clave (con `**...**`); evite el exceso.
- Fechas y cifras siempre con su período y moneda.
- Evite recomendar comprar o vender; puede describir qué perfil de inversor podría interesarle la empresa y qué condiciones deberían cumplirse.
