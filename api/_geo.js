// Ubicación de un comercio para el mapa de la colecta, con Nominatim (OpenStreetMap): gratis y sin claves, pero con
// límite de 1 consulta por segundo y User-Agent propio (https://operations.osmfoundation.org/policies/nominatim/).
// Privacidad: la dirección exacta solo se publica si el proveedor es persona jurídica (CUIT 30, 33 o 34). Si es una
// persona humana (monotributista: 20, 23, 24 o 27), su comercio puede ser su casa: se publica solo la localidad.

const UA = "ColectasTrazables/1.0 (https://colectas-trazables.vercel.app)";

export const esPersonaJuridica = (cuit) => /^3[034]/.test(String(cuit).replace(/\D/g, ""));

async function buscar(params) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ format: "json", limit: "1", countrycodes: "ar", ...params })}`;
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es" }, signal: AbortSignal.timeout(5000) });
  if (!r.ok) return null;
  const [p] = await r.json();
  return p ? [Number(p.lat), Number(p.lon)] : null;
}

/**
 * { direccion?, localidad?, geo? } para publicar en el gasto. Si no se encuentra el lugar o Nominatim no responde,
 * el gasto se registra igual, sin punto en el mapa.
 */
export async function ubicarComercio({ cuit, direccion, localidad }) {
  const corto = (v, max) => String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
  const loc = corto(localidad, 60);
  const dir = esPersonaJuridica(cuit) ? corto(direccion, 80) : "";
  if (!loc && !dir) return {};
  let geo = null;
  try {
    // la localidad como ciudad (si no, "Corrientes" da el centro de la provincia)
    geo = (dir && (await buscar({ q: [dir, loc].filter(Boolean).join(", ") }))) || (loc && (await buscar({ city: loc })));
  } catch { /* sin mapa, el gasto vale igual */ }
  // menos decimales para una localidad: es una zona, no un punto
  const redondeo = dir ? 5 : 3;
  return {
    ...(dir && { direccion: dir }),
    ...(loc && { localidad: loc }),
    ...(geo && { geo: geo.map((n) => Number(n.toFixed(redondeo))) }),
  };
}
