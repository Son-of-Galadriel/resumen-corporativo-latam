#!/usr/bin/env node
/**
 * render.js — Genera el Resumen Corporativo en .docx y .md desde un único JSON.
 *
 * Uso:
 *   node scripts/render.js datos.json --out ./salida [--solo-docx] [--solo-md]
 *
 * Requiere: Node 18+ y el paquete npm "docx"  (npm install docx)
 * Los gráficos (opcionales) se generan con scripts/graficos.py (Python + matplotlib).
 *
 * Diseño: réplica del informe de referencia (portada oscura, tablas resumen,
 * encabezados con filete dorado, recuadros de color). Los títulos usan los estilos
 * nativos "Título 1" y "Título 2" de Word para que funcione el Panel de Navegación.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, HeadingLevel, LevelFormat, Footer, PageNumber, ImageRun,
  ExternalHyperlink, VerticalAlign, HeightRule,
} = D;

// ───────────────────────── Paleta (idéntica al informe de referencia) ─────────────────────────
const C = {
  navy: '0A2342', blue: '1040A0', gold: 'B8860B', coverBg: '222A35', coverSub: 'AABBCC',
  coverDate: '8899AA', rowAlt: 'F0F5FA', white: 'FFFFFF', label: '525252', valueBg: 'EDF2FA',
  border: 'CCCCCC', text: '111111', grayText: '4A5568', green: '1A6B35', red: '9B1C1C',
  amber: '8B4500', orange: 'A04000',
};
const CALLOUT = {
  dorado: { fill: 'FDF6E3', title: C.gold },
  verde: { fill: 'EFF7F2', title: C.green },
  rojo: { fill: 'FDECEA', title: C.red },
  azul: { fill: 'EDF2FA', title: C.blue },
};
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ───────────────────────── Utilidades ─────────────────────────
function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function quitarTildes(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

/** "Banco de Chile" -> "BancodeChile"; "Grupo Éxito S.A." -> "GrupoExito" */
function slugEmpresa(nombre) {
  const conectores = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'do', 'dos', 'das']);
  const sufijos = /\b(s\.?a\.?b?\.?( de c\.?v\.?)?|s\.?a\.?a\.?|ltda\.?|inc\.?|corp\.?|plc|s\.?a\.?s\.?|s\. de r\.l\.?)\s*$/i;
  const n = quitarTildes(nombre).replace(sufijos, '').trim();
  const partes = n.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return partes.map((p, i) => (i > 0 && conectores.has(p.toLowerCase())) ? p.toLowerCase() : cap(p.toLowerCase())).join('');
}

/** Convierte **negrita** en TextRuns. */
function runs(texto, base = {}) {
  const partes = String(texto).split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  return partes.map((p) => {
    const b = /^\*\*[^*]+\*\*$/.test(p);
    return new TextRun({ ...base, text: b ? p.slice(2, -2) : p, bold: b ? true : base.bold });
  });
}
function colorFlecha(t) {
  const s = String(t).trim();
  if (/^(▲▼|↑↓|▲↓|↑▼)/.test(s)) return C.amber;
  if (/^(▲|↑)/.test(s)) return C.green;
  if (/^(▼|↓)/.test(s)) return C.red;
  return null;
}
function nivelEstilo(t) {
  const s = quitarTildes(String(t)).toLowerCase().trim();
  if (s.startsWith('alto')) return { fill: 'FDECEA', color: C.red };
  if (s.startsWith('medio-alto')) return { fill: 'FDEBD8', color: C.orange };
  if (s.startsWith('medio')) return { fill: 'FDF6E3', color: C.amber };
  if (s.startsWith('bajo-medio')) return { fill: 'F3F7E6', color: '5B6B12' };
  if (s.startsWith('bajo')) return { fill: 'EFF7F2', color: C.green };
  return null;
}
function reparto(pcts, total) {
  const suma = pcts.reduce((a, b) => a + b, 0);
  const w = pcts.map((p) => Math.floor((p / suma) * total));
  w[w.length - 1] += total - w.reduce((a, b) => a + b, 0);
  return w;
}
const bordeCelda = (color = C.border, size = 1) => {
  const b = { style: BorderStyle.SINGLE, size, color };
  return { top: b, left: b, bottom: b, right: b };
};
const sinBorde = () => {
  const b = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: b, left: b, bottom: b, right: b };
};
const shade = (fill) => ({ type: ShadingType.CLEAR, color: 'auto', fill });
const espaciador = (after = 120) => new Paragraph({ spacing: { after }, children: [new TextRun({ text: '', size: 8 })] });

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// ───────────────────────── Validación de datos ─────────────────────────
function validar(d) {
  const req = ['empresa', 'ticker', 'bolsa', 'pais', 'sector', 'fecha'];
  if (!d.meta) fail('Falta "meta".');
  req.forEach((k) => { if (!d.meta[k]) fail(`Falta meta.${k}`); });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.meta.fecha)) fail('meta.fecha debe ser AAAA-MM-DD');
  if (!d.portada || !Array.isArray(d.portada.resumen_izq) || !Array.isArray(d.portada.resumen_der)) fail('Falta portada.resumen_izq / resumen_der');
  if (!Array.isArray(d.secciones) || !d.secciones.length) fail('Falta "secciones".');
  if (!Array.isArray(d.glosario)) fail('Falta "glosario".');
  if (!Array.isArray(d.fuentes) || !d.fuentes.length) fail('Falta "fuentes".');
}

// ───────────────────────── Bloques DOCX ─────────────────────────
function crearBuilder(d, ctx) {
  const CW = ctx.CW;
  let instanciaNum = 0;

  function celda(children, ancho, o = {}) {
    return new TableCell({
      width: { size: ancho, type: WidthType.DXA },
      borders: o.sinBorde ? sinBorde() : bordeCelda(),
      shading: o.fill ? shade(o.fill) : undefined,
      margins: o.margins || { top: 80, bottom: 80, left: 100, right: 100 },
      verticalAlign: o.vAlign,
      children,
    });
  }
  function textoCelda(texto, o = {}) {
    const lineas = String(texto).split('\n');
    const col = o.color || colorFlecha(texto) || C.text;
    const negrita = o.bold || (!!colorFlecha(texto));
    return lineas.map((l) => new Paragraph({
      alignment: o.align, spacing: { after: 20 },
      children: runs(l, { size: o.size || 19, color: col, bold: negrita }),
    }));
  }

  function tabla(b) {
    const n = b.columnas.length;
    const anchos = reparto(b.anchos || Array(n).fill(100 / n), CW);
    const head = new TableRow({
      tableHeader: true, cantSplit: true,
      children: b.columnas.map((c, i) => celda(textoCelda(c, { color: C.white, bold: true, align: AlignmentType.CENTER }), anchos[i], { fill: C.navy })),
    });
    const filas = b.filas.map((f, r) => new TableRow({
      cantSplit: true,
      children: f.map((v, i) => {
        let fill = r % 2 === 0 ? C.rowAlt : C.white;
        let color; let bold = (i === 0 && b.primera_col_negrita !== false);
        if (b.colorear_col === i) {
          const e = nivelEstilo(v);
          if (e) { fill = e.fill; color = e.color; bold = true; }
        }
        return celda(textoCelda(v, { color, bold }), anchos[i], { fill });
      }),
    }));
    return [new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: anchos, rows: [head, ...filas] }), espaciador()];
  }

  function kv(b) {
    const anchos = reparto(b.anchos || [40, 60], CW);
    const filas = b.filas.map((f, r) => new TableRow({
      cantSplit: true,
      children: [
        celda(textoCelda(f[0], { color: C.grayText, bold: true }), anchos[0], { fill: r % 2 === 0 ? C.rowAlt : C.white }),
        celda(textoCelda(f[1], { bold: true }), anchos[1], { fill: r % 2 === 0 ? C.rowAlt : C.white }),
      ],
    }));
    return [new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: anchos, rows: filas }), espaciador()];
  }

  function callout(b, tipo) {
    const est = CALLOUT[b.color || 'dorado'] || CALLOUT.dorado;
    const sz = tipo === 'nota' ? 19 : 21;
    const hijos = [];
    if (b.titulo) hijos.push(new Paragraph({ spacing: { after: 40 }, keepNext: true, children: runs(b.titulo, { bold: true, color: est.title, size: sz }) }));
    String(b.texto).split('\n').forEach((l) => hijos.push(new Paragraph({ spacing: { after: 40, line: 264 }, children: runs(l, { size: sz, color: C.text }) })));
    return [new Table({
      width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
      rows: [new TableRow({ cantSplit: true, children: [new TableCell({
        width: { size: CW, type: WidthType.DXA }, borders: sinBorde(), shading: shade(est.fill),
        margins: { top: 120, bottom: 120, left: 200, right: 200 }, children: hijos,
      })] })],
    }), espaciador()];
  }

  function grafico(b) {
    const f = path.join(ctx.assetsDir, `${b.id}.png`);
    if (!fs.existsSync(f)) return [new Paragraph({ children: [new TextRun({ text: `[Gráfico "${b.id}" no disponible]`, italics: true, color: C.grayText, size: 19 })] })];
    const { w, h } = pngSize(f);
    const ancho = Math.min(660, Math.round(CW / 15));
    const out = [new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 60, after: 40 }, keepNext: !!b.pie,
      children: [new ImageRun({
        type: 'png', data: fs.readFileSync(f), transformation: { width: ancho, height: Math.round(ancho * h / w) },
        altText: { title: b.titulo || b.id, description: b.alt || b.titulo || b.id, name: b.id },
      })],
    })];
    if (b.pie) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: runs(b.pie, { italics: true, size: 16, color: C.grayText }) }));
    return out;
  }

  function bloque(b) {
    switch (b.tipo) {
      case 'h2': return [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(b.texto)] })];
      case 'p': return [new Paragraph({ spacing: { after: 120, line: 276 }, children: runs(b.texto, { size: 21, color: C.text }) })];
      case 'lista': return b.items.map((t) => new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 70, line: 264 }, children: runs(t, { size: 21, color: C.text }) }));
      case 'lista_numerada': { const inst = ++instanciaNum; return b.items.map((t) => new Paragraph({ numbering: { reference: 'numeros', level: 0, instance: inst }, spacing: { after: 70, line: 264 }, children: runs(t, { size: 21, color: C.text }) })); }
      case 'tabla': return tabla(b);
      case 'kv': return kv(b);
      case 'callout': return callout(b, 'callout');
      case 'nota_didactica': return callout({ color: 'azul', titulo: `Nota didáctica · ${b.referencia}`, texto: b.texto }, 'nota');
      case 'grafico': return grafico(b);
      case 'espacio': return [espaciador(200)];
      default: return fail(`Tipo de bloque desconocido: ${b.tipo}`);
    }
  }
  return { bloque, tabla, celda, textoCelda, CW };
}

// ───────────────────────── Portada (diseño idéntico al de referencia) ─────────────────────────
function portada(d, ctx) {
  const CW = ctx.CW;
  const m = d.meta; const p = d.portada;
  const [y, mo] = m.fecha.split('-').map(Number);
  const etiqueta = p.etiqueta || `RESUMEN CORPORATIVO · ${m.sector} · ${m.pais}`.toUpperCase();
  const lineaFecha = p.linea_fecha || `${cap(MESES[mo - 1])} ${y}  |  Análisis Fundamental Completo`;
  const lineaBolsas = p.linea_bolsas || `${m.bolsa}: ${m.ticker}`;

  const caja = new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, borders: sinBorde(), shading: shade(C.coverBg),
      margins: { top: 500, bottom: 500, left: 500, right: 500 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: etiqueta, bold: true, color: C.gold, size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: m.empresa.toUpperCase(), bold: true, color: C.white, size: m.empresa.length > 34 ? 36 : (m.empresa.length > 22 ? 44 : 52) })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: p.aspecto_relevante || '', italics: true, color: C.coverSub, size: 24 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 60 }, children: [new TextRun({ text: lineaBolsas, color: C.coverSub, size: 22 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: lineaFecha, italics: true, color: C.coverDate, size: 18 })] }),
      ],
    })] })],
  });

  const mini = (filas, ancho) => {
    const lw = Math.round(ancho * 0.42); const vw = ancho - lw;
    return new Table({
      width: { size: ancho, type: WidthType.DXA }, columnWidths: [lw, vw],
      rows: filas.map((f) => new TableRow({ height: { value: 567, rule: HeightRule.ATLEAST }, cantSplit: true, children: [
        new TableCell({ width: { size: lw, type: WidthType.DXA }, borders: bordeCelda(), shading: shade(C.label), verticalAlign: VerticalAlign.CENTER,
          margins: { top: 70, bottom: 70, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.k, bold: true, color: C.white, size: 20 })] })] }),
        new TableCell({ width: { size: vw, type: WidthType.DXA }, borders: bordeCelda(), shading: shade(C.valueBg), verticalAlign: VerticalAlign.CENTER,
          margins: { top: 70, bottom: 70, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(f.v), bold: true, color: C.navy, size: 20 })] })] }),
      ] })),
    });
  };
  const gap = 400; const col = Math.floor((CW - gap) / 2); const col2 = CW - col - gap;
  const dobles = new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [col, gap, col2],
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: col, type: WidthType.DXA }, borders: sinBorde(), margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [mini(p.resumen_izq, col), new Paragraph('')] }),
      new TableCell({ width: { size: gap, type: WidthType.DXA }, borders: sinBorde(), children: [new Paragraph('')] }),
      new TableCell({ width: { size: col2, type: WidthType.DXA }, borders: sinBorde(), margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [mini(p.resumen_der, col2), new Paragraph('')] }),
    ] })],
  });

  const nota = p.nota_datos || `Cifras en ${m.moneda || 'moneda local'} salvo indicación. Datos al ${m.fecha.split('-').reverse().join('-')}. Las cifras precedidas por "~" son aproximadas; ver Fuentes.`;
  return [caja, espaciador(360), dobles, new Paragraph({ spacing: { before: 200 }, children: runs(nota, { italics: true, size: 16, color: C.grayText }) })];
}

// ───────────────────────── Fuentes y glosario ─────────────────────────
function fuentesBloques(d, B) {
  const CW = B.CW;
  const anchos = reparto([6, 30, 36, 18, 10], CW);
  const mg = { top: 60, bottom: 60, left: 70, right: 70 };
  const head = new TableRow({ tableHeader: true, cantSplit: true, children: ['N°', 'Fuente', 'Enlace', 'Uso en el informe', 'Acceso'].map((c, i) => B.celda(B.textoCelda(c, { color: C.white, bold: true, size: 17, align: AlignmentType.CENTER }), anchos[i], { fill: C.navy })) });
  const filas = d.fuentes.map((f, r) => {
    const fill = r % 2 === 0 ? C.rowAlt : C.white;
    const c2 = [new Paragraph({ spacing: { after: 20 }, children: runs(f.titulo, { size: 16, bold: true, color: C.text }) })];
    if (f.complementaria) c2.push(new Paragraph({ spacing: { after: 20 }, children: runs('Fuente complementaria (ver nota)', { size: 15, italics: true, color: C.amber }) }));
    return new TableRow({ cantSplit: true, children: [
      B.celda([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(r + 1), bold: true, size: 16, color: C.navy })] })], anchos[0], { fill, margins: mg }),
      B.celda(c2, anchos[1], { fill, margins: mg }),
      B.celda([new Paragraph({ children: [new ExternalHyperlink({ link: f.url, children: [new TextRun({ text: f.url, size: 14, color: C.blue, underline: {} })] })] })], anchos[2], { fill, margins: mg }),
      B.celda(B.textoCelda(f.uso || '', { size: 15 }), anchos[3], { fill, margins: mg }),
      B.celda(B.textoCelda(f.acceso || '', { size: 15, align: AlignmentType.CENTER }), anchos[4], { fill, margins: mg }),
    ] });
  });
  const out = [new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: anchos, rows: [head, ...filas] }), espaciador()];
  const comp = d.fuentes.map((f, i) => ({ f, i })).filter((x) => x.f.complementaria);
  if (comp.length) {
    const grupos = new Map();
    comp.forEach((x) => { const k = x.f.motivo || 'Fuente complementaria'; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(x.i + 1); });
    out.push(...B.bloque({ tipo: 'callout', color: 'dorado', titulo: 'Fuentes fuera del listado preferente',
      texto: [...grupos].map(([motivo, nums]) => `N° ${nums.join(', ')} — ${motivo}`).join('\n') }));
  }
  return out;
}
function glosarioBloques(d, B) {
  const anchos = reparto([22, 78], B.CW);
  const mg = { top: 45, bottom: 45, left: 90, right: 90 };
  const head = new TableRow({ tableHeader: true, children: ['Término', 'Definición'].map((c, i) => B.celda(B.textoCelda(c, { color: C.white, bold: true, size: 17, align: AlignmentType.CENTER }), anchos[i], { fill: C.navy, margins: { top: 50, bottom: 50, left: 90, right: 90 } })) });
  const filas = d.glosario.map((g, r) => {
    const fill = r % 2 === 0 ? C.rowAlt : C.white;
    return new TableRow({ cantSplit: true, children: [
      B.celda(B.textoCelda(g.termino, { bold: true, color: C.navy, size: 17 }), anchos[0], { fill, margins: mg }),
      B.celda(B.textoCelda(g.definicion + (g.formula ? `\n**Fórmula:** ${g.formula}` : ''), { size: 17 }), anchos[1], { fill, margins: mg }),
    ] });
  });
  return [new Table({ width: { size: B.CW, type: WidthType.DXA }, columnWidths: anchos, rows: [head, ...filas] })];
}

// ───────────────────────── DOCX ─────────────────────────
async function construirDocx(d, ctx, destino) {
  const B = crearBuilder(d, ctx);
  const saltoSecciones = d.meta.salto_pagina_secciones !== false;
  const h1 = (texto, salto) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: salto, children: [new TextRun(texto)] });

  const hijos = [...portada(d, ctx)];
  d.secciones.forEach((s, i) => {
    hijos.push(h1(s.titulo, i === 0 ? true : saltoSecciones));
    s.bloques.forEach((b) => hijos.push(...B.bloque(b)));
  });
  hijos.push(h1('Glosario', true), ...glosarioBloques(d, B));
  hijos.push(h1('Fuentes', true));
  hijos.push(new Paragraph({ spacing: { after: 120 }, children: runs('Enlaces consultados para elaborar este informe, numerados en orden de aparición. La fecha de acceso figura en cada caso.', { size: 19, color: C.grayText, italics: true }) }));
  hijos.push(...fuentesBloques(d, B));

  const gris = { size: 16, color: C.coverDate };
  const pie = new Paragraph({
    style: 'PiePagina',
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({ ...gris, text: `${d.meta.empresa} · Resumen Corporativo   |   Página ` }),
      new TextRun({ ...gris, children: [PageNumber.CURRENT] }),
      new TextRun({ ...gris, text: ' de ' }),
      new TextRun({ ...gris, children: [PageNumber.TOTAL_PAGES] }),
    ],
  });

  const doc = new Document({
    creator: 'Resumen Corporativo LATAM', title: `${d.meta.empresa} — Resumen Corporativo`,
    description: `Resumen corporativo de ${d.meta.empresa} (${d.meta.ticker}), ${d.meta.fecha}`,
    styles: {
      // Se redefinen los estilos NATIVOS (heading1/heading2) para evitar IDs duplicados:
      // Word los reconoce como "Título 1"/"Título 2" y alimenta el Panel de Navegación.
      default: {
        document: { run: { font: 'Arial', size: 21, color: C.text }, paragraph: { spacing: { after: 120 } } },
        heading1: {
          run: { font: 'Arial', size: 30, bold: true, color: C.navy },
          paragraph: { spacing: { before: 300, after: 100 }, keepNext: true, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 10, space: 4, color: C.gold } } },
        },
        heading2: {
          run: { font: 'Arial', size: 24, bold: true, color: C.blue },
          paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 1 },
        },
      },
    },
    // Estilo propio (sin conflicto con estilos nativos) para que los campos de número de página hereden tamaño y color.
    paragraphStyles: [
      { id: 'PiePagina', name: 'Pie Pagina', basedOn: 'Normal', run: { font: 'Arial', size: 16, color: C.coverDate } },
    ],
    numbering: { config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] },
    ] },
    sections: [{
      properties: { titlePage: true, page: { size: { width: ctx.pageW, height: ctx.pageH }, margin: { top: 1200, bottom: 1200, left: 1100, right: 1100, header: 708, footer: 708 } } },
      footers: { default: new Footer({ children: [pie] }), first: new Footer({ children: [new Paragraph('')] }) },
      children: hijos,
    }],
  });
  fs.writeFileSync(destino, await Packer.toBuffer(doc));
}

// ───────────────────────── Markdown ─────────────────────────
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
function mdTabla(cols, filas) {
  const l = [`| ${cols.map(esc).join(' | ')} |`, `| ${cols.map(() => '---').join(' | ')} |`];
  filas.forEach((f) => l.push(`| ${f.map(esc).join(' | ')} |`));
  return l.join('\n');
}
const ALERTA = { dorado: 'NOTE', azul: 'TIP', verde: 'TIP', rojo: 'WARNING' };
function mdBloque(b) {
  switch (b.tipo) {
    case 'h2': return `### ${b.texto}`;
    case 'p': return b.texto;
    case 'lista': return b.items.map((t) => `- ${t}`).join('\n');
    case 'lista_numerada': return b.items.map((t, i) => `${i + 1}. ${t}`).join('\n');
    case 'tabla': return mdTabla(b.columnas, b.filas);
    case 'kv': return mdTabla(['Concepto', 'Detalle'], b.filas.map((f) => [`**${f[0]}**`, f[1]]));
    case 'callout': case 'nota_didactica': {
      const color = b.tipo === 'nota_didactica' ? 'azul' : (b.color || 'dorado');
      const titulo = b.tipo === 'nota_didactica' ? `Nota didáctica · ${b.referencia}` : b.titulo;
      const cuerpo = [titulo ? `**${titulo}**` : null, ...String(b.texto).split('\n')].filter(Boolean);
      return [`> [!${ALERTA[color] || 'NOTE'}]`, ...cuerpo.map((l) => `> ${l}`)].join('\n');
    }
    case 'grafico': return `![${b.titulo || b.id}](assets/${b.id}.png)` + (b.pie ? `\n\n*${b.pie}*` : '');
    default: return '';
  }
}
function construirMd(d) {
  const m = d.meta; const p = d.portada;
  const [y, mo] = m.fecha.split('-').map(Number);
  const L = [];
  L.push(`# ${m.empresa} — Resumen Corporativo`);
  L.push(`**${p.etiqueta || `Resumen corporativo · ${m.sector} · ${m.pais}`}**`);
  if (p.aspecto_relevante) L.push(`*${p.aspecto_relevante}*`);
  L.push(`${p.linea_bolsas || `${m.bolsa}: ${m.ticker}`}  \n${p.linea_fecha || `${cap(MESES[mo - 1])} ${y} | Análisis Fundamental Completo`}`);
  L.push(mdTabla(['Indicador', 'Valor'], [...p.resumen_izq, ...p.resumen_der].map((f) => [`**${f.k}**`, f.v])));
  L.push(`*${p.nota_datos || `Cifras en ${m.moneda || 'moneda local'} salvo indicación. Datos al ${m.fecha}.`}*`);
  d.secciones.forEach((s) => { L.push(`## ${s.titulo}`); s.bloques.forEach((b) => { const t = mdBloque(b); if (t) L.push(t); }); });
  L.push('## Glosario');
  L.push(mdTabla(['Término', 'Definición'], d.glosario.map((g) => [`**${g.termino}**`, g.definicion + (g.formula ? ` — *Fórmula:* ${g.formula}` : '')])));
  L.push('## Fuentes');
  L.push(d.fuentes.map((f, i) => `${i + 1}. [${f.titulo}](${f.url}) — ${f.uso || ''} (acceso: ${f.acceso || 's/f'})${f.complementaria ? ` — *Fuente complementaria: ${f.motivo || ''}*` : ''}`).join('\n'));
  return L.join('\n\n') + '\n';
}

// ───────────────────────── Principal ─────────────────────────
async function main() {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith('--')) fail('Uso: node render.js datos.json --out ./salida [--solo-docx] [--solo-md]');
  const d = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  validar(d);
  const oi = args.indexOf('--out');
  const outDir = path.resolve(oi >= 0 ? args[oi + 1] : '.');
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });

  const [y, mo] = d.meta.fecha.split('-');
  const slug = d.meta.archivo_nombre || slugEmpresa(d.meta.empresa);
  const base = `${y}_${mo}_${slug}_Resumen_Corporativo`;

  if (Array.isArray(d.graficos) && d.graficos.length) {
    const py = path.join(__dirname, 'graficos.py');
    let ok = false;
    for (const cmd of ['python3', 'python']) {
      try { execFileSync(cmd, [py, path.resolve(args[0]), path.join(outDir, 'assets')], { stdio: 'inherit' }); ok = true; break; } catch (e) { /* probar siguiente */ }
    }
    if (!ok) console.warn('AVISO: no se pudieron generar los gráficos (¿matplotlib instalado?).');
  }

  const a4 = String(d.meta.papel || 'letter').toLowerCase() === 'a4';
  const ctx = { pageW: a4 ? 11906 : 12240, pageH: a4 ? 16838 : 15840, assetsDir: path.join(outDir, 'assets') };
  ctx.CW = ctx.pageW - 2200;

  if (!args.includes('--solo-md')) { await construirDocx(d, ctx, path.join(outDir, base + '.docx')); console.log('OK  ' + base + '.docx'); }
  if (!args.includes('--solo-docx')) { fs.writeFileSync(path.join(outDir, base + '.md'), construirMd(d)); console.log('OK  ' + base + '.md'); }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { slugEmpresa };
