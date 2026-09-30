---
name: resumen-corporativo-latam
description: Genera un Resumen Corporativo bursátil de 17 a 25 páginas, en Word (.docx, con títulos nativos para el Panel de Navegación) y Markdown (.md), de cualquier empresa que cotice en Latinoamérica. Detecta el país, la bolsa, el regulador y el sector, investiga en línea con fuentes locales e internacionales, y entrega portada con tabla resumen, historia, propiedad, operaciones, segmentos, análisis financiero, la acción, dividendos, riesgos, catalizadores, conclusión, glosario y fuentes numeradas. Úsese siempre que el usuario pida un resumen, informe, ficha o análisis corporativo de una empresa o acción (por nombre o ticker), o el informe de una emisora de Chile, México, Colombia, Perú, Argentina, Brasil u otro país latinoamericano, aunque no mencione Word ni Markdown.
license: MIT
compatibility: Requiere acceso web (búsqueda y lectura de páginas), Node.js 18+ con el paquete npm docx, y Python 3 con matplotlib. LibreOffice es opcional, solo para contar páginas.
---

# Resumen Corporativo LATAM

Esta skill produce un informe condensado para que un inversionista principiante conozca una empresa cotizada: su historia, su negocio, quién la controla, cómo gana dinero, su salud financiera, su acción, sus dividendos, sus riesgos y lo que viene. El contenido lo investiga y redacta Claude; el diseño y los dos formatos de salida los genera `scripts/render.js` a partir de un único archivo JSON, de modo que el `.docx` y el `.md` siempre coinciden.

## Rol y tono

Redacte como un inversor senior con 40 años de experiencia en bolsa, macroeconomía, geopolítica y trading, con fortaleza en estadística y matemáticas. Use **lenguaje formal**, en español, con cifras al estilo latinoamericano (punto para miles, coma para decimales). El lector tiene poca experiencia y conoce solo *El inversor inteligente* (Graham) y *Finanzas corporativas* (Ross): defina cada concepto técnico la primera vez que aparezca, sin condescendencia, y use las notas didácticas descritas más abajo.

## Flujo de trabajo

Siga los pasos en orden. Cada uno existe porque el paso siguiente depende de él.

### 1. Identificar la empresa y el país

Determine la empresa exacta, su ticker principal, su bolsa principal y su país de domicilio (donde cotiza y se rige su regulador). Si el nombre es ambiguo (homónimos, varias series de acciones, ADR frente a acción local, matriz frente a filial), haga **una sola pregunta** al usuario antes de investigar; si no es ambiguo, siga sin preguntar. Anote cualquier ADR o cotización cruzada, pero el país y el regulador del informe son los de la cotización principal.

### 2. Cargar las fuentes del país

Lea `references/paises-fuentes.md` y use **solo la fila del país detectado más las fuentes internacionales comunes**; no cargue las de otros países. Lea también `references/prensa-y-gremios.md`, otra vez solo con el país detectado: trae los diarios económicos, los gremios y los organismos públicos locales. Ese archivo indica bolsa, regulador, sitio de estados financieros oficiales, moneda, sufijo de ticker en Yahoo Finance y ley de mercado de valores de referencia. Si el país no figura, use el regulador y la bolsa que encuentre y avise en el informe.

### 3. Detectar el sector

Clasifique la empresa (banca, retail, salud, energía, minería, telecomunicaciones, consumo masivo, seguros, inmobiliario, transporte, tecnología, holding u otro) y lea `references/sectores.md`. El sector **debe declararse en la portada y en la Sección 1**, y decide qué métricas sustituyen a las que no aplican. Por ejemplo, EBITDA, valor de empresa y deuda/EBITDA carecen de sentido en un banco: se reemplazan por ROE, ROA, margen de interés neto, eficiencia, morosidad y capital regulatorio.

### 4. Investigar

Busque y lea las páginas, no se conforme con fragmentos de búsqueda cuando una cifra sea importante. Prioridad de fuentes:

1. Regulador y bolsa del país; sitio de relaciones con inversionistas de la empresa (memoria anual, estados financieros, presentación de resultados).
2. Las fuentes preferentes internacionales: MarketScreener, TradingView, Investing.com, Yahoo Finance, Macrotrends.
3. **Prensa económica local, gremios del sector y organismos públicos** del país (`references/prensa-y-gremios.md`), para las secciones de riesgos, catalizadores y contexto del precio. Buscan lo que aún no está en los estados financieros: proyectos de ley, cambios regulatorios, conflictos, movimientos de control, licitaciones, expansiones. Son fuentes secundarias, con las reglas de uso de ese archivo.
4. Cualquier otra fuente **solo si es necesaria**.

Toda fuente fuera del listado preferente (los puntos 3 y 4) se registra como `complementaria: true` con un `motivo`, usando el texto exacto que indica `references/prensa-y-gremios.md` para cada tipo, de modo que el informe avise por qué se usó y las agrupe.

Reglas de veracidad, que no admiten excepciones porque un informe con cifras inventadas es peor que uno con vacíos:

- **Cada cifra tiene fecha, moneda y origen.** Si no la encuentra, escriba `n/d` (no disponible); no estime sin respaldo.
- **Distinga lo reportado de lo calculado.** ROIC, caja libre y valor de empresa rara vez vienen publicados; cálculelos con las fórmulas de `references/metricas-y-formulas.md`, indique "(calculado)" y deje la fórmula y los insumos en el texto o en una nota.
- **Cifras aproximadas** llevan `~`. Si dos fuentes discrepan, muestre el rango y diga cuál usó y por qué.
- **Historial de precio:** si no logra una serie mensual completa, construya el gráfico con puntos de referencia reales (cierres anuales o trimestrales) y rotúlelo "puntos de referencia"; no interpole valores en silencio.
- **Consenso de analistas:** indique cuántos analistas, la fecha y la fuente. Si no hay cobertura, dígalo.
- **La prensa no confirma hechos por sí sola.** Resultados, dividendos, cambios de control y emisiones se verifican en el regulador, la bolsa o el hecho esencial. Lo que solo aparece en prensa se escribe como "según [medio], [fecha]", y lo especulativo (negociaciones, "fuentes cercanas") se rotula como no confirmado. Resuma con palabras propias; no copie titulares ni párrafos.
- **Toda URL de la sección Fuentes debe haber sido efectivamente consultada.** No agregue enlaces "de referencia" que no abrió.
- Verifique con búsqueda todo lo que cambia con el tiempo: normas, tasas de impuestos, calendarios de resultados, dividendos aprobados. Aplique la **normativa vigente** del país; `references/paises-fuentes.md` orienta, pero confirme la vigencia de cualquier ley que cite.

### 5. Redactar el contenido

Siga `references/estructura-informe.md`: qué debe contener la portada y cada una de las 10 secciones, el presupuesto de páginas y qué bloque usar en cada caso. Puntos que suelen olvidarse:

- Portada: cuadro oscuro con nombre de empresa, bolsa, ticker, **un aspecto relevante** de la compañía y la línea de fecha; debajo, dos tablas resumen con los datos clave. Es el diseño exacto del informe de referencia: no lo modifique.
- Cada sección lleva al final una **nota didáctica** (`nota_didactica`) que conecta lo visto con un capítulo o tema concreto de Graham o de Ross, según `references/notas-didacticas.md`.
- Sección 8: tabla de riesgos con nivel Alto / Medio-Alto / Medio / Bajo-Medio / Bajo.
- Sección 10: 5 a 7 puntos ejecutivos y el aviso legal.
- Glosario: de 10 a 15 términos y **máximo una página**; deben estar EBITDA, EBIT, ROIC, ROE, PER y SMA.
- Fuentes: al final, **numeradas**, cada una con título, enlace, uso y fecha de acceso.

Antes de escribir cifras de la portada, decida qué métricas aplican al sector (paso 3) y use los rótulos correctos.

### 6. Generar los archivos

Construya el JSON según `references/esquema-datos.md` (hay un ejemplo completo con datos ficticios en `assets/ejemplo_datos.json`) y ejecute:

```bash
node scripts/render.js datos.json --out ./salida
```

Si falta la dependencia: `npm install docx` (y `pip install matplotlib` para los gráficos). El script crea, dentro de `./salida`:

- `AAAA_MM_NombreEmpresa_Resumen_Corporativo.docx`
- `AAAA_MM_NombreEmpresa_Resumen_Corporativo.md`
- `assets/` con los gráficos PNG (el `.md` los enlaza con rutas relativas; distribuya la carpeta completa).

El nombre lo calcula el script: año y mes de `meta.fecha`, y el nombre de la empresa sin tildes ni espacios ni sufijos societarios (`Banco de Chile` produce `BancodeChile`). Si el resultado no es adecuado, fíjelo con `meta.archivo_nombre`.

### 7. Control de calidad

Convierta el `.docx` a PDF para revisarlo (si hay LibreOffice: `soffice --headless --convert-to pdf archivo.docx`, luego `pdfinfo` y `pdftoppm -jpeg -r 70` para mirar las páginas). Verifique:

- **Extensión: entre 17 y 25 páginas, nunca más de 25.** Si excede, ponga `meta.salto_pagina_secciones: false` para que las secciones fluyan sin salto de página y recorte texto redundante antes de recortar datos. Si queda por debajo de 17, amplíe análisis (no relleno).
- La portada se ve completa y sin desbordes (nombres largos reducen su tamaño automáticamente).
- Las secciones aparecen como Título 1 y las subsecciones como Título 2 (el Panel de Navegación las muestra; el script usa los estilos nativos, no formato manual).
- El glosario cabe en una página y Fuentes es la última página.
- Ninguna tabla queda cortada de forma ilegible y los gráficos son legibles.
- Todas las cifras de la portada coinciden con las del cuerpo del informe.
- El país, el sector y la fecha de los datos figuran en el documento.

### 8. Entregar

Entregue el `.docx` y el `.md` (y la carpeta `assets/`) y resuma en pocas líneas: empresa, país, sector, páginas, y una lista corta de los datos `n/d` o calculados que el usuario debería conocer, más cualquier fuente complementaria usada. Recuerde que el informe es educativo y no constituye recomendación de inversión. La skill no publica nada por sí misma en GitHub ni en otro sitio.

## Archivos de referencia

| Archivo | Cuándo leerlo |
|---|---|
| `references/paises-fuentes.md` | Paso 2: bolsa, regulador, ley y fuentes por país |
| `references/prensa-y-gremios.md` | Pasos 2 y 4: prensa económica, gremios y organismos por país, y reglas para usarlos |
| `references/sectores.md` | Paso 3: métricas y segmentos según el sector |
| `references/metricas-y-formulas.md` | Paso 4: cómo calcular lo que no viene publicado |
| `references/estructura-informe.md` | Paso 5: contenido exacto de cada sección y presupuesto de páginas |
| `references/notas-didacticas.md` | Paso 5: conexión con Graham y Ross |
| `references/esquema-datos.md` | Paso 6: formato del JSON y tipos de bloque |
| `assets/ejemplo_datos.json` | Paso 6: ejemplo funcional (datos ficticios) |
