// /api/colectas/:id/:accion → una sola función para todas las acciones de una colecta.
// El plan Hobby de Vercel admite hasta 12 funciones por deploy; los handlers viven en api/_colecta/
// (el guion bajo hace que Vercel no los publique como funciones sueltas).
import donaciones from "../../_colecta/donaciones.js";
import gastos from "../../_colecta/gastos.js";
import entregas from "../../_colecta/entregas.js";
import verificar from "../../_colecta/verificar.js";
import mercadopago from "../../_colecta/mercadopago.js";
import conversiones from "../../_colecta/conversiones.js";
import { error } from "../../_comun.js";

const ACCIONES = { donaciones, gastos, entregas, verificar, mercadopago, conversiones };

export default async function handler(req, res) {
  const accion = ACCIONES[req.query.accion];
  if (!accion) return error(res, 404, "Acción desconocida.");
  return accion(req, res);
}
