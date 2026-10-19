/**
 * Simulación aproximada de cómo la app de Gmail en iPhone muestra un correo en modo oscuro.
 *
 * Gmail iOS no aplica `prefers-color-scheme`: invierte cada color del correo por su cuenta.
 * Los fondos claros pasan a oscuros, los oscuros a claros y el texto igual, conservando el
 * tono. No toca las imágenes ni los `background-image` (por eso un `linear-gradient` de un
 * solo color fija una superficie). Google no documenta el algoritmo: las curvas de abajo
 * están ajustadas a una captura real de Gmail iOS (octubre de 2026) del correo de la lista,
 * con un error de unas pocas unidades de L*. Sirve para encontrar problemas antes de enviar,
 * no para certificar el render: eso sigue pidiendo un teléfono.
 *
 * Archivo sin dependencias para inyectarlo tal cual en una página: lo usan
 * `verificar-correos.ts` en Chrome y el visor de correos de VamoaDesign, que lo copia.
 */
(function (global) {
  const lineal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fInversa = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const BLANCO = [0.95047, 1, 1.08883];

  function aLab([r, g, b]) {
    const [R, G, B] = [r, g, b].map((v) => lineal(v / 255));
    const xyz = [
      0.4124 * R + 0.3576 * G + 0.1805 * B,
      0.2126 * R + 0.7152 * G + 0.0722 * B,
      0.0193 * R + 0.1192 * G + 0.9505 * B,
    ].map((v, i) => f(v / BLANCO[i]));
    return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
  }

  function deLab([L, a, b]) {
    const fy = (L + 16) / 116;
    const [X, Y, Z] = [fy + a / 500, fy, fy - b / 200].map((v, i) => fInversa(v) * BLANCO[i]);
    const rgb = [
      3.2406 * X - 1.5372 * Y - 0.4986 * Z,
      -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
      0.0557 * X - 0.204 * Y + 1.057 * Z,
    ];
    return rgb.map((v) => Math.round(Math.min(1, Math.max(0, gamma(v))) * 255));
  }

  /** `tipo` es 'texto' o 'fondo': Gmail no los lleva al mismo punto. */
  function invertir(rgb, tipo) {
    const [L, a, b] = aLab(rgb);
    const nuevo = tipo === 'texto' ? 110 - 0.87 * L : 101 - 0.88 * L;
    return deLab([Math.min(100, Math.max(0, nuevo)), a * 0.85, b * 0.85]);
  }

  function leer(color) {
    const v = color.match(/[\d.]+/g)?.map(Number);
    return v && v.length >= 3 ? { rgb: v.slice(0, 3), alfa: v[3] ?? 1 } : null;
  }

  const escribir = ({ rgb, alfa }) => (alfa === 1 ? `rgb(${rgb.join(', ')})` : `rgba(${rgb.join(', ')}, ${alfa})`);

  /**
   * Gmail cambia el doctype por un `<u>` y envuelve el cuerpo en un `div.body` con las
   * clases del `<body>`: de ahí sale el selector `u + .body`, que sólo calza en Gmail.
   * Tampoco lee el media query de modo oscuro, en ningún tema.
   */
  function prepararGmail(html) {
    return forzarClaro(html)
      .replace(/<body([^>]*)>/i, (_, atributos) => `<body style="margin:0;padding:0;"><u></u><div${atributos}>`)
      .replace(/<\/body>/i, '</div></body>');
  }

  /** Para ver el tema oscuro de los clientes que sí respetan el media query. */
  function forzarOscuro(html) {
    return html.replaceAll('@media (prefers-color-scheme: dark)', '@media all');
  }

  /** El claro aunque el sistema de quien mira esté en oscuro. */
  function forzarClaro(html) {
    return html.replaceAll('@media (prefers-color-scheme: dark)', '@media not all');
  }

  /** Aplica la inversión sobre un documento ya renderizado con `prepararGmail`. */
  function simularGmailOscuro(doc) {
    const ventana = doc.defaultView;
    // El fondo de la app de Gmail oscura, medido en la misma captura.
    doc.documentElement.style.background = '#131314';
    const elementos = [doc.body, ...doc.body.querySelectorAll('*')].filter((e) => e.tagName !== 'IMG');
    const cambios = elementos.map((elemento) => {
      const estilo = ventana.getComputedStyle(elemento);
      return {
        elemento,
        color: leer(estilo.color),
        fondo: leer(estilo.backgroundColor),
        bordes: ['Top', 'Right', 'Bottom', 'Left'].map((lado) => leer(estilo[`border${lado}Color`])),
      };
    });
    for (const { elemento, color, fondo, bordes } of cambios) {
      if (color) elemento.style.setProperty('color', escribir({ ...color, rgb: invertir(color.rgb, 'texto') }), 'important');
      if (fondo && fondo.alfa > 0) elemento.style.setProperty('background-color', escribir({ ...fondo, rgb: invertir(fondo.rgb, 'fondo') }), 'important');
      ['top', 'right', 'bottom', 'left'].forEach((lado, i) => {
        const borde = bordes[i];
        if (borde && borde.alfa > 0) elemento.style.setProperty(`border-${lado}-color`, escribir({ ...borde, rgb: invertir(borde.rgb, 'fondo') }), 'important');
      });
    }
  }

  global.VamoaCorreo = { invertir, prepararGmail, forzarOscuro, forzarClaro, simularGmailOscuro };
})(typeof window === 'undefined' ? globalThis : window);
