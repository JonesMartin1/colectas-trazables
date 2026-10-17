// GENERADO desde ../Colecta.sol para probar los plazos en testnet (segundos en vez de días). No se despliega en producción.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../HTS.sol";

interface IPlataforma {
    function admin() external view returns (address);
    function cuentaComision() external view returns (address);
    function esEntidad(address e) external view returns (bool);
    function esArgentina(address e) external view returns (bool);
    function inhabilitado(address organizador) external view returns (bool);
    function esColecta(address colecta) external view returns (bool);
    function inhabilitar(address organizador) external;
    function registrarLiquidacion(uint256 totalAportado, uint256 restante) external;
}

/// Una colecta. Recibe las donaciones (1 % de comisión al entrar, una sola vez) y le libera la plata al
/// organizador por tramos: nunca puede tener "sin rendir" más que el tope (30 % de la meta), y cada tramo
/// lo aprueba una entidad validadora. Las barras de los ítems se llenan con comprobantes aprobados.
/// La receptora legal es la entidad titular (argentina); las demás validadoras son avales.
/// Si se congela (30 días sin actividad del organizador), vence o se confirma un fraude, lo que queda
/// pasa al fondo de créditos de la Plataforma. No tiene dueño ni forma de actualizarse.
contract ColectaPlazos {
    uint256 public constant COMISION_BPS = 100; // 1 %
    uint256 public constant TOPE_SIN_RENDIR_BPS = 3000; // 30 % de la meta
    uint256 public constant TOPE_SIN_FACTURA_BPS = 1000; // 10 % de lo liberado
    uint256 public constant AVISO_REASIGNACION_BPS = 3000; // mover más del 30 % de un ítem avisa a los donantes
    uint256 public constant INACTIVIDAD = 90 seconds; // PRUEBA: en producción 30 days
    uint256 public constant PRORROGA_MAX = 90 days;
    uint256 public constant ESPERA_CAMBIO = 60 seconds; // PRUEBA: en producción 72 hours
    bytes32 public constant ANONIMO = bytes32(0);

    IPlataforma public immutable plataforma;
    address public immutable token;
    address public immutable titular;
    string public colectaId;
    address public organizador;

    // ítems (las barras)
    string[] public nombres;
    uint256[] public metas;
    uint256[] public metasOriginales;
    uint256[] public gastado;

    // estado
    bool public publicada;
    bool public pausada;
    bool public fraudeConfirmado;
    bool public liquidada;
    uint256 public cierre;
    uint256 public ultimaActividad;

    // contabilidad
    uint256 public contable; // lo que el contrato sabe que tiene; la diferencia con el saldo real son donaciones anónimas
    uint256 public totalAportado;
    uint256 public liberado;
    uint256 public justificado;
    uint256 public sinFactura;
    mapping(bytes32 => uint256) public aportes;
    mapping(address => bool) public esDonante;

    // validadoras
    mapping(address => bool) public esValidadora;
    address[] public validadoras;
    mapping(address => bool) public votoPausa;
    uint256 public votosPausa;

    struct Tramo { uint256 monto; bool aprobado; }
    struct Comprobante { uint256 item; uint256 monto; bytes32 huella; bool conCAE; uint8 estado; uint256 denuncias; } // 0 pendiente, 1 aprobado, 2 rechazado
    struct Reasignacion { uint256 de; uint256 a; uint256 monto; bytes32 motivo; bool aprobada; }

    Tramo[] public tramos;
    Comprobante[] public comprobantes;
    Reasignacion[] public reasignaciones;
    mapping(bytes32 => bool) public huellaUsada;
    mapping(uint256 => mapping(address => bool)) public denuncio;

    uint256 public prorrogaPedida;
    address public organizadorNuevo;
    uint256 public cambioEfectivoEn;

    event Validada(address indexed entidad, bool esTitular);
    event Publicada(uint256 cierre);
    event Donado(bytes32 indexed codigo, address indexed donante, uint256 monto, uint256 comision);
    event AnonimasReconocidas(uint256 monto, uint256 comision);
    event Atribuido(bytes32 indexed codigo, uint256 monto);
    event CreditosRecibidos(bytes32 indexed codigo, uint256 monto);
    event TramoPedido(uint256 indexed id, uint256 monto);
    event TramoLiberado(uint256 indexed id, uint256 monto, address indexed aprobadoPor);
    event ComprobanteCargado(uint256 indexed id, uint256 item, uint256 monto, bytes32 huella, bool conCAE);
    event ComprobanteAprobado(uint256 indexed id, address indexed por);
    event ComprobanteRechazado(uint256 indexed id, address indexed por);
    event ReasignacionPedida(uint256 indexed id, uint256 de, uint256 a, uint256 monto, bytes32 motivo);
    event ReasignacionAprobada(uint256 indexed id, address indexed por, bool avisarDonantes);
    event Denuncia(uint256 indexed comprobante, address indexed por, bytes32 motivo);
    event Pausada(address indexed por);
    event Reanudada(address indexed por);
    event FraudeConfirmado(address indexed por);
    event ProrrogaPedida(uint256 nuevoCierre);
    event ProrrogaAprobada(uint256 nuevoCierre);
    event CambioOrganizadorPedido(address indexed nuevo, uint256 efectivoEn);
    event CambioOrganizadorHecho(address indexed nuevo);
    event Liquidada(uint256 restante, string motivo);

    modifier soloOrganizador() {
        require(msg.sender == organizador, "Solo el organizador");
        _;
    }

    modifier soloValidadora() {
        require(esValidadora[msg.sender] && plataforma.esEntidad(msg.sender), "Solo una entidad validadora de esta colecta");
        _;
    }

    modifier soloTitular() {
        require(msg.sender == titular, "Solo la entidad titular");
        _;
    }

    constructor(
        address _plataforma,
        address _token,
        address _organizador,
        address _titular,
        string memory _colectaId,
        string[] memory _nombres,
        uint256[] memory _metas,
        uint256 _cierre
    ) {
        plataforma = IPlataforma(_plataforma);
        require(plataforma.esArgentina(_titular), "La titular tiene que ser una entidad argentina aprobada");
        require(!plataforma.inhabilitado(_organizador), "Organizador inhabilitado por un fraude anterior");
        require(_organizador != _titular, "El organizador no puede ser la titular");
        require(_nombres.length > 0 && _nombres.length == _metas.length, "Items invalidos");
        require(_cierre > block.timestamp && _cierre <= block.timestamp + PRORROGA_MAX, "El cierre tiene que ser dentro de los proximos 90 dias");
        token = _token;
        titular = _titular;
        organizador = _organizador;
        colectaId = _colectaId;
        cierre = _cierre;
        for (uint256 i = 0; i < _nombres.length; i++) {
            require(_metas[i] > 0, "Cada item necesita un monto");
            nombres.push(_nombres[i]);
            metas.push(_metas[i]);
            metasOriginales.push(_metas[i]);
            gastado.push(0);
        }
        HTS.asociar(_token);
    }

    // ---------- validación y publicación ----------
    /// Una entidad aprobada avala la colecta. Se publica cuando valida la titular.
    function validar() external {
        require(plataforma.esEntidad(msg.sender), "Solo entidades aprobadas por la plataforma");
        require(msg.sender != organizador && !esValidadora[msg.sender], "Ya valido o es el organizador");
        // Toda colecta publicada tiene que estar registrada: si no, no se podría liquidar a créditos.
        if (msg.sender == titular) require(plataforma.esColecta(address(this)), "La titular primero tiene que registrar la colecta en la Plataforma");
        esValidadora[msg.sender] = true;
        validadoras.push(msg.sender);
        emit Validada(msg.sender, msg.sender == titular);
        if (msg.sender == titular && !publicada) {
            publicada = true;
            ultimaActividad = block.timestamp;
            emit Publicada(cierre);
        }
    }

    function abierta() public view returns (bool) {
        return publicada && !pausada && !liquidada && block.timestamp <= cierre;
    }

    // ---------- donaciones ----------
    /// El donante le da permiso al contrato por `monto` y llama a donar con su código (huella de su cuenta).
    function donar(bytes32 codigo, uint256 monto) external {
        require(abierta(), "La colecta no esta abierta a donaciones");
        require(codigo != ANONIMO && monto > 0, "Falta el codigo de donante o el monto");
        HTS.traer(token, msg.sender, monto);
        uint256 comision = (monto * COMISION_BPS) / 10000;
        HTS.transferir(token, plataforma.cuentaComision(), comision);
        uint256 neto = monto - comision;
        aportes[codigo] += neto;
        totalAportado += neto;
        contable += neto;
        esDonante[msg.sender] = true;
        emit Donado(codigo, msg.sender, monto, comision);
    }

    /// Lo que llegó por fuera de donar (transferencia directa) entra como donación anónima: sin créditos ni denuncias.
    function reconocerAnonimas() public {
        uint256 real = HTS.saldo(token);
        if (real <= contable) return;
        uint256 diferencia = real - contable;
        uint256 comision = (diferencia * COMISION_BPS) / 10000;
        HTS.transferir(token, plataforma.cuentaComision(), comision);
        uint256 neto = diferencia - comision;
        aportes[ANONIMO] += neto;
        totalAportado += neto;
        contable += neto;
        emit AnonimasReconocidas(neto, comision);
    }

    /// Una donación desde un exchange llega anónima; si traía el código de donante como memo, la plataforma la atribuye.
    function atribuir(bytes32 codigo, uint256 monto) external {
        require(msg.sender == plataforma.admin(), "Solo la plataforma");
        require(codigo != ANONIMO && aportes[ANONIMO] >= monto, "Nada anonimo para atribuir");
        aportes[ANONIMO] -= monto;
        aportes[codigo] += monto;
        emit Atribuido(codigo, monto);
    }

    /// Créditos que un donante usa desde el fondo: ya pagaron comisión, no se cobra de nuevo.
    function acreditarDesdeFondo(bytes32 codigo, uint256 monto) external {
        require(msg.sender == address(plataforma), "Solo el fondo de creditos");
        require(abierta(), "La colecta no esta abierta");
        aportes[codigo] += monto;
        totalAportado += monto;
        contable += monto;
        emit CreditosRecibidos(codigo, monto);
    }

    // ---------- tramos ----------
    function metaTotal() public view returns (uint256 t) {
        for (uint256 i = 0; i < metas.length; i++) t += metas[i];
    }

    function sinRendir() public view returns (uint256) {
        return liberado - justificado;
    }

    function pedirTramo(uint256 monto) external soloOrganizador returns (uint256 id) {
        require(publicada && !pausada && !liquidada, "La colecta no admite tramos ahora");
        require(monto > 0 && monto <= contable, "No hay saldo para ese tramo");
        require(sinRendir() + monto <= (metaTotal() * TOPE_SIN_RENDIR_BPS) / 10000, "Supera el tope sin rendir: primero carga comprobantes");
        id = tramos.length;
        tramos.push(Tramo(monto, false));
        ultimaActividad = block.timestamp;
        emit TramoPedido(id, monto);
    }

    function aprobarTramo(uint256 id) external soloValidadora {
        require(!pausada && !liquidada, "Colecta pausada o liquidada");
        Tramo storage t = tramos[id];
        require(!t.aprobado, "Ya aprobado");
        require(t.monto <= contable, "No hay saldo");
        require(sinRendir() + t.monto <= (metaTotal() * TOPE_SIN_RENDIR_BPS) / 10000, "Supera el tope sin rendir");
        t.aprobado = true;
        liberado += t.monto;
        contable -= t.monto;
        HTS.transferir(token, organizador, t.monto);
        emit TramoLiberado(id, t.monto, msg.sender);
    }

    // ---------- comprobantes (llenan las barras) ----------
    /// La imagen queda fuera de la red; acá va su huella. Con CAE, la app ya lo verificó contra ARCA.
    function cargarComprobante(uint256 item, uint256 monto, bytes32 huella, bool conCAE) external soloOrganizador returns (uint256 id) {
        require(item < nombres.length && monto > 0 && huella != bytes32(0), "Comprobante invalido");
        require(!huellaUsada[huella], "Ese comprobante ya se cargo");
        huellaUsada[huella] = true;
        id = comprobantes.length;
        comprobantes.push(Comprobante(item, monto, huella, conCAE, 0, 0));
        ultimaActividad = block.timestamp;
        emit ComprobanteCargado(id, item, monto, huella, conCAE);
    }

    function aprobarComprobante(uint256 id) external soloValidadora {
        Comprobante storage c = comprobantes[id];
        require(c.estado == 0, "Ya revisado");
        require(justificado + c.monto <= liberado, "Justifica mas de lo liberado");
        if (!c.conCAE) {
            require(sinFactura + c.monto <= (liberado * TOPE_SIN_FACTURA_BPS) / 10000, "Supera el tope de tickets sin factura (10%)");
            sinFactura += c.monto;
        }
        c.estado = 1;
        gastado[c.item] += c.monto;
        justificado += c.monto;
        emit ComprobanteAprobado(id, msg.sender);
    }

    function rechazarComprobante(uint256 id) external soloValidadora {
        Comprobante storage c = comprobantes[id];
        require(c.estado == 0, "Ya revisado");
        c.estado = 2;
        huellaUsada[c.huella] = false;
        emit ComprobanteRechazado(id, msg.sender);
    }

    // ---------- reasignación entre ítems ----------
    function pedirReasignacion(uint256 de, uint256 a, uint256 monto, bytes32 motivo) external soloOrganizador returns (uint256 id) {
        require(de < metas.length && a < metas.length && de != a && monto > 0, "Reasignacion invalida");
        require(motivo != bytes32(0), "Falta el motivo");
        id = reasignaciones.length;
        reasignaciones.push(Reasignacion(de, a, monto, motivo, false));
        emit ReasignacionPedida(id, de, a, monto, motivo);
    }

    function aprobarReasignacion(uint256 id) external soloValidadora {
        Reasignacion storage r = reasignaciones[id];
        require(!r.aprobada, "Ya aprobada");
        require(metas[r.de] - gastado[r.de] >= r.monto, "Ese item no tiene tanto sin gastar");
        r.aprobada = true;
        metas[r.de] -= r.monto;
        metas[r.a] += r.monto;
        emit ReasignacionAprobada(id, msg.sender, r.monto * 10000 > metasOriginales[r.de] * AVISO_REASIGNACION_BPS);
    }

    // ---------- denuncias y pausa ----------
    function denunciar(uint256 comprobante, bytes32 motivo) external {
        require(esDonante[msg.sender] || plataforma.esEntidad(msg.sender), "Solo donantes de esta colecta o entidades");
        require(comprobante < comprobantes.length && motivo != bytes32(0), "Denuncia invalida");
        require(!denuncio[comprobante][msg.sender], "Ya denunciaste ese comprobante");
        denuncio[comprobante][msg.sender] = true;
        comprobantes[comprobante].denuncias++;
        emit Denuncia(comprobante, msg.sender, motivo);
    }

    /// La titular pausa sola; si no, alcanza con dos validadoras.
    function pausar() external soloValidadora {
        if (msg.sender != titular) {
            require(!votoPausa[msg.sender], "Ya votaste la pausa");
            votoPausa[msg.sender] = true;
            votosPausa++;
            if (votosPausa < 2) return;
        }
        pausada = true;
        emit Pausada(msg.sender);
    }

    function reanudar() external soloTitular {
        require(!fraudeConfirmado && organizadorNuevo == address(0), "No se puede reanudar");
        pausada = false;
        votosPausa = 0;
        for (uint256 i = 0; i < validadoras.length; i++) votoPausa[validadoras[i]] = false;
        emit Reanudada(msg.sender);
    }

    /// Con la colecta pausada, la titular confirma el fraude: el organizador queda inhabilitado y la colecta se liquida.
    function confirmarFraude() external soloTitular {
        require(pausada, "Primero hay que pausar");
        fraudeConfirmado = true;
        plataforma.inhabilitar(organizador);
        emit FraudeConfirmado(msg.sender);
    }

    // ---------- prórroga y cambio de organizador ----------
    function pedirProrroga(uint256 nuevoCierre) external soloOrganizador {
        require(nuevoCierre > cierre && nuevoCierre <= cierre + PRORROGA_MAX, "Prorroga de hasta 90 dias");
        prorrogaPedida = nuevoCierre;
        emit ProrrogaPedida(nuevoCierre);
    }

    function aprobarProrroga() external soloTitular {
        require(prorrogaPedida > cierre, "No hay prorroga pedida");
        cierre = prorrogaPedida;
        prorrogaPedida = 0;
        emit ProrrogaAprobada(cierre);
    }

    /// Tras repetir la verificación facial (fuera de la red), la titular pide el cambio; rige a las 72 h, con la colecta pausada.
    function pedirCambioOrganizador(address nuevo) external soloTitular {
        require(nuevo != address(0) && !plataforma.inhabilitado(nuevo), "Organizador invalido");
        organizadorNuevo = nuevo;
        cambioEfectivoEn = block.timestamp + ESPERA_CAMBIO;
        pausada = true;
        emit CambioOrganizadorPedido(nuevo, cambioEfectivoEn);
    }

    function ejecutarCambioOrganizador() external {
        require(organizadorNuevo != address(0) && block.timestamp >= cambioEfectivoEn, "Todavia no");
        organizador = organizadorNuevo;
        organizadorNuevo = address(0);
        pausada = fraudeConfirmado;
        emit CambioOrganizadorHecho(organizador);
    }

    // ---------- liquidación ----------
    function motivoLiquidacion() public view returns (string memory) {
        if (liquidada) return "";
        if (fraudeConfirmado) return "fraude";
        if (block.timestamp > cierre) return "cierre";
        if (publicada && block.timestamp > ultimaActividad + INACTIVIDAD) return "inactividad";
        return "";
    }

    /// Cualquiera puede llamarla cuando corresponde: lo que queda va al fondo de créditos de los donantes.
    function liquidar() external {
        string memory motivo = motivoLiquidacion();
        require(bytes(motivo).length > 0, "Todavia no corresponde liquidar");
        reconocerAnonimas();
        liquidada = true;
        pausada = true;
        uint256 restante = contable;
        contable = 0;
        if (plataforma.esColecta(address(this))) {
            HTS.transferir(token, address(plataforma), restante);
            plataforma.registrarLiquidacion(totalAportado, restante);
            emit Liquidada(restante, motivo);
        } else {
            // Red de seguridad: plata que llegó a una colecta nunca registrada (ej. transferencia directa) va a la titular, no queda trabada.
            HTS.transferir(token, titular, restante);
            emit Liquidada(restante, "sin registrar: va a la titular");
        }
    }

    // ---------- lectura ----------
    function cantidadItems() external view returns (uint256) { return nombres.length; }
    function cantidadComprobantes() external view returns (uint256) { return comprobantes.length; }
    function cantidadTramos() external view returns (uint256) { return tramos.length; }
    function cantidadValidadoras() external view returns (uint256) { return validadoras.length; }
}
