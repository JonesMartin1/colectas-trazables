// node --test scripts/seguridad.test.js → controles de api/_seguridad.js y validaciones del alta, sin tocar la red.
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { contar, mensajeDeError, huellaDeAlta, altaConfigurada, esVerificada, OCULTAS } from "../api/_seguridad.js";
import { cuitValido } from "../api/colectas/index.js";
import { leerCuerpo } from "../api/_comun.js";
import { DESTACADAS } from "../api/_destacadas.js";

const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

test("límite de pedidos: deja pasar hasta el máximo y después frena hasta que vence la ventana", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(contar("prueba:1.1.1.1", 3, 60, t0), 0);
  assert.equal(contar("prueba:1.1.1.1", 3, 60, t0 + 10_000), 50);
  assert.equal(contar("prueba:2.2.2.2", 3, 60, t0), 0, "otra IP tiene su propia cuenta");
  assert.equal(contar("prueba:1.1.1.1", 3, 60, t0 + 60_000), 0, "vencida la ventana, vuelve a pasar");
});

test("errores: los internos salen genéricos, los de cliente conservan su mensaje", () => {
  const silencio = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(mensajeDeError(new Error("ECONNREFUSED 10.0.0.1 clave=abc")), [500, "No pudimos completar la operación. Probá de nuevo en unos minutos."]);
  } finally { console.error = silencio; }
  assert.deepEqual(mensajeDeError(Object.assign(new Error("Falta el monto."), { status: 400 })), [400, "Falta el monto."]);
  assert.equal(mensajeDeError(new SyntaxError("Unexpected token"))[0], 400);
});

test("código de alta: solo vale el que está habilitado por su hash", () => {
  const codigo = "codigo-de-prueba-0123456789";
  delete process.env.CODIGOS_ALTA_HASH;
  assert.equal(altaConfigurada(), false);
  assert.equal(huellaDeAlta(codigo), null, "sin hashes configurados no vale ninguno");
  process.env.CODIGOS_ALTA_HASH = `${sha("otro-codigo-cualquiera-xx")}, ${sha(codigo)}`;
  assert.equal(altaConfigurada(), true);
  assert.equal(huellaDeAlta(codigo), sha(codigo).slice(0, 16));
  assert.equal(huellaDeAlta(codigo + "x"), null);
  assert.equal(huellaDeAlta("corto"), null);
  assert.equal(huellaDeAlta(undefined), null);
  delete process.env.CODIGOS_ALTA_HASH;
});

test("verificada: el registro, la portada o la lista validada a mano; nunca un valor que no sea true", () => {
  assert.equal(esVerificada({ campaignId: "x", verificada: true }), true);
  assert.equal(esVerificada({ campaignId: "x", verificada: "true" }), false);
  assert.equal(esVerificada({ campaignId: "x" }), false);
  assert.equal(esVerificada({ campaignId: DESTACADAS[0].campaignId }), true);
  process.env.COLECTAS_VERIFICADAS = "a-1, b-2";
  assert.equal(esVerificada({ campaignId: "b-2" }), true);
  delete process.env.COLECTAS_VERIFICADAS;
  assert.equal(esVerificada({ campaignId: "b-2" }), false);
});

test("las colectas de la revisión de seguridad están ocultas", () => {
  assert.equal(OCULTAS.size, 5);
  assert.ok(OCULTAS.has("nico-y-facu-arreglen-poeee-su-app-059ffc"));
});

test("CUIT: dígito verificador", () => {
  assert.equal(cuitValido("30500010912"), true); // Banco Nación
  assert.equal(cuitValido("20123456789"), false); // el del informe
  assert.equal(cuitValido("3050001091"), false);
});

test("cuerpo del pedido: tope de tamaño y solo objetos", async () => {
  assert.deepEqual(await leerCuerpo({ body: '{"a":1}' }), { a: 1 });
  assert.deepEqual(await leerCuerpo({ body: "[1,2]" }), {});
  assert.deepEqual(await leerCuerpo({ body: "null" }), {});
  await assert.rejects(() => leerCuerpo({ body: JSON.stringify({ a: "x".repeat(20_000) }) }), { status: 413 });
  await assert.rejects(() => leerCuerpo({ body: "{no es json" }), SyntaxError);
});
