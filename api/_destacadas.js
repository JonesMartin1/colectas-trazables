// Colectas que se muestran en la portada: casos reales del NEA del último año, dados de alta en testnet con
// scripts/sembrar-colectas-completas.js (con donaciones y gastos con factura de demostración; las primeras
// versiones, de scripts/sembrar-casos-reales.js, quedaron en el registro pero ya no se listan). El registro de Hedera no se puede borrar, así que las colectas de prueba siguen
// ahí (y se abren por su link), pero GET /api/colectas solo lista estas, en este orden. ?todas=1 lista todo el registro.
// Los hechos y las cifras salen de la fuente; la organización es de demo. Fotos de Wikimedia Commons (créditos en terminos.html).
export const DESTACADAS = [
  {
    campaignId: "crecida-en-el-gran-resistencia-familias--8fe7f1",
    foto: "/img/puerto-vilelas.jpg", lugar: "Puerto Vilelas, Chaco", fecha: "Octubre 2026", categoria: "Inundaciones",
    fuente: { medio: "El Litoral", url: "https://www.ellitoral.com.ar/sociedad/2026-10-21-17-34-0-crecida-de-los-rios-en-chaco-hay-913-evacuados-y-281-autoevacuados" },
  },
  {
    campaignId: "corrientes-capital-90-familias-autoevacu-b6df76",
    foto: "/img/corrientes-capital.jpg", lugar: "Corrientes capital", fecha: "Octubre 2026", categoria: "Inundaciones",
    fuente: { medio: "Primera Edición", url: "https://www.primeraedicion.com.ar/nota/101152475/corrientes-bajo-agua-localidades-en-alerta-y-mas-de-750-evacuados/" },
  },
  {
    campaignId: "isla-apipe-18-familias-evacuadas-por-la--0864c9",
    foto: "/img/isla-apipe.jpg", lugar: "Isla Apipé, Corrientes", fecha: "Octubre 2026", categoria: "Inundaciones",
    fuente: { medio: "Primera Edición", url: "https://www.primeraedicion.com.ar/nota/101152475/corrientes-bajo-agua-localidades-en-alerta-y-mas-de-750-evacuados/" },
  },
  {
    campaignId: "evacuados-de-itati-por-la-crecida-del-pa-a0f323",
    foto: "/img/itati.jpg", lugar: "Itatí, Corrientes", fecha: "Octubre 2026", categoria: "Inundaciones",
    fuente: { medio: "Infobae", url: "https://www.infobae.com/sociedad/2026/10/16/el-nino-las-aguas-del-parana-ingresaron-a-la-ciudad-de-corrientes-y-la-provincia-suma-mas-de-200-evacuados/" },
  },
  {
    campaignId: "isla-del-cerrito-aislada-por-la-crecida-18cde1",
    foto: "/img/isla-cerrito.jpg", lugar: "Isla del Cerrito, Chaco", fecha: "Octubre 2026", categoria: "Inundaciones",
    fuente: { medio: "MDZ", url: "https://www.mdzol.com/sociedad/2026/10/16/la-creciente-del-rio-parana-golpea-fuerte-en-chaco-y-corrientes-hay-zonas-donde-no-se-podria-circula-1988793.html" },
  },
  {
    campaignId: "familias-evacuadas-por-el-rio-uruguay-en-1da4e2",
    foto: "/img/paso-libres.jpg", lugar: "Paso de los Libres, Corrientes", fecha: "Octubre 2026", categoria: "Inundaciones",
    fuente: { medio: "Infobae", url: "https://www.infobae.com/sociedad/2026/10/16/el-nino-las-aguas-del-parana-ingresaron-a-la-ciudad-de-corrientes-y-la-provincia-suma-mas-de-200-evacuados/" },
  },
  {
    campaignId: "temporal-en-obera-familias-evacuadas-por-b89f8a",
    foto: "/img/obera.jpg", lugar: "Oberá, Misiones", fecha: "Junio 2026", categoria: "Temporal",
    fuente: { medio: "Primera Edición", url: "https://www.primeraedicion.com.ar/nota/101118372/el-temporal-golpeo-a-misiones-con-inundaciones-rescates-y-cortes-de-energia-en-varias-localidades/" },
  },
  {
    campaignId: "lluvias-en-castelli-300-personas-en-cent-399d79",
    foto: "/img/castelli.jpg", lugar: "Juan José Castelli, Chaco", fecha: "Abril 2026", categoria: "Inundaciones",
    fuente: { medio: "Gendarmería Nacional (argentina.gob.ar)", url: "https://www.argentina.gob.ar/noticias/chaco-formosa-y-santiago-del-estero-gendarmes-asistieron-y-evacuaron-familias-afectadas-por" },
  },
];

/** Las colectas del registro que se muestran, en el orden de DESTACADAS y con su foto y su fuente. */
export function destacar(colectas) {
  const porId = new Map(colectas.map((c) => [c.campaignId, c]));
  return DESTACADAS.filter((d) => porId.has(d.campaignId)).map((d) => ({ ...porId.get(d.campaignId), ...d }));
}
