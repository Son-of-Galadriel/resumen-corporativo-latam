# Resumen Corporativo LATAM

Skill para Claude que genera un **resumen corporativo bursátil de 17 a 25 páginas** de cualquier empresa que cotice en Latinoamérica, en dos formatos:

- **Word (.docx)** con las secciones como títulos nativos (Título 1 y Título 2), de modo que el Panel de Navegación funciona sin configuración.
- **Markdown (.md)**, con los gráficos enlazados desde la carpeta `assets/`.

Nombre de los archivos: `AAAA_MM_NombreEmpresa_Resumen_Corporativo` (por ejemplo, `2026_09_BancodeChile_Resumen_Corporativo.docx`).

##### Imágenes y tablas del informe:
<img width="330" height="330" alt="image_1_skill_resumen_corporativo" src="https://github.com/user-attachments/assets/fd455bec-a9f6-4d4d-af58-79720ed10ac3" />
<img width="330" height="330" alt="image_2_skill_resumen_corporativo" src="https://github.com/user-attachments/assets/a8c3f0ca-0017-4d75-9c0a-8a391f7b2cad" />
<img width="330" height="330" alt="image_3_skill_resumen_corporativo" src="https://github.com/user-attachments/assets/02d66f0c-a6d1-4bd4-9868-d75a662b4ccf" />

## Qué hace

1. Identifica la empresa, su país, su bolsa, su regulador y su **sector**.
2. Investiga en línea con las fuentes del país (bolsa y regulador) y con fuentes internacionales (MarketScreener, TradingView, Investing.com, Yahoo Finance, Macrotrends). Avisa cuando usa otra fuente y por qué.
3. Redacta el informe en lenguaje formal, con notas didácticas que conectan cada sección con *El inversor inteligente* (Graham) y *Finanzas corporativas* (Ross).
4. Genera el `.docx` y el `.md` desde un único archivo de datos, de modo que ambos coinciden.

Contenido: portada con tabla resumen; 1. Historia y ADN; 2. Estructura de propiedad; 3. Presencia geográfica y operaciones; 4. Líneas de negocio y rentabilidad; 5. Análisis financiero; 6. La acción; 7. Dividendos; 8. Riesgos; 9. Noticias y catalizadores; 10. Conclusión; Glosario; Fuentes numeradas (última página).

## Instalación

**Claude (web, escritorio o móvil):** comprima esta carpeta en un `.zip` (o use el archivo `.skill` de la sección *Releases* si existe) y cárguela desde la sección de Skills de su cuenta.

**Claude Code:** copie la carpeta completa en `~/.claude/skills/resumen-corporativo-latam/`.

## Requisitos

- Acceso web para Claude (búsqueda y lectura de páginas).
- Node.js 18 o superior y el paquete `docx`: `npm install`
- Python 3 y `matplotlib` para los gráficos: `pip install -r requirements.txt`
- LibreOffice (opcional), solo para contar páginas al revisar el `.docx`.

## Uso

Pídale a Claude, por ejemplo:

> Hazme el resumen corporativo de Banco de Chile.
> Necesito el informe de WALMEX.
> Resumen corporativo de Ecopetrol.

## Probar el generador sin Claude

```bash
npm install
npm run ejemplo
```

Esto crea un informe con **datos ficticios** en `salida_ejemplo/`. El formato del archivo de datos está descrito en `references/esquema-datos.md`.

## Estructura del repositorio

```
SKILL.md                       instrucciones para Claude
scripts/render.js              generador de .docx y .md
scripts/graficos.py            generador de gráficos
references/                    fuentes por país, prensa y gremios locales, sectores, fórmulas, estructura, notas didácticas, esquema de datos
assets/ejemplo_datos.json      ejemplo con datos ficticios
evals/evals.json               casos de prueba
```

## Personalización

- **Agregar o corregir un país:** edite `references/paises-fuentes.md` (bolsa, regulador, ley) y `references/prensa-y-gremios.md` (prensa económica, gremios y organismos).
- **Agregar un sector:** edite `references/sectores.md`.
- **Ajustar el diseño (colores, tipografía):** edite la paleta `C` al inicio de `scripts/render.js`.


## Limitaciones

- La calidad del informe depende de las fuentes públicas disponibles en el momento; algunas páginas bloquean la lectura automática. Cuando un dato no se encuentra, el informe indica `n/d` en lugar de estimarlo.
- Las cifras calculadas (ROIC, caja libre, valor de empresa) se rotulan como tales, con su fórmula.
- La tabla de países y leyes es un punto de partida: la skill verifica la vigencia en línea, pero conviene revisarla periódicamente.
- Los números de capítulo de Graham siguen la edición revisada (Zweig, 2003); los de Ross varían según la edición, por lo que se citan por tema.

## Aviso legal

Los informes son educativos e informativos. **No constituyen recomendación de inversión ni asesoría financiera.** Invertir en acciones implica riesgos, incluida la pérdida parcial o total del capital. El autor no se hace responsable del mal uso de esta herramienta tanto por conocimiento o desconocimiento del usuario.

## Licencia

MIT. Véase `LICENSE`.
