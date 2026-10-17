// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HTS.sol";

interface IColectaFondo {
    function titular() external view returns (address);
    function abierta() external view returns (bool);
    function aportes(bytes32 codigo) external view returns (uint256);
    function acreditarDesdeFondo(bytes32 codigo, uint256 monto) external;
}

/// Lo común a todas las colectas: entidades aprobadas, colectas registradas, organizadores inhabilitados
/// y el fondo de créditos. La plataforma (admin) aprueba entidades y pasa las órdenes de los donantes,
/// pero la plata del fondo solo puede ir a una colecta registrada por su entidad titular.
contract Plataforma {
    struct Entidad {
        bool activa;
        bytes32 pais; // "AR" = inscripta en Argentina (puede ser titular)
        bytes32 fuente; // huella del registro oficial que la respalda (IGPJ, CENOC, ECOSOC...)
        string nombre;
    }

    address public immutable token;
    address public immutable admin;
    address public immutable cuentaComision;

    mapping(address => Entidad) public entidades;
    mapping(address => bool) public esColecta;
    mapping(address => bool) public inhabilitado;

    // Fondo de créditos: lo que queda de una colecta liquidada se reparte en proporción a lo que donó cada código.
    mapping(bytes32 => uint256) public creditos;
    mapping(address => uint256) public restanteLiquidado;
    mapping(address => uint256) public totalAportadoLiquidado;
    mapping(address => mapping(bytes32 => bool)) public reclamado;

    event EntidadAprobada(address indexed entidad, string nombre, bytes32 pais, bytes32 fuente);
    event EntidadSuspendida(address indexed entidad);
    event ColectaRegistrada(address indexed colecta, address indexed titular);
    event OrganizadorInhabilitado(address indexed organizador, address indexed colecta);
    event Liquidacion(address indexed colecta, uint256 restante, uint256 totalAportado);
    event CreditoReclamado(address indexed colecta, bytes32 indexed codigo, uint256 monto);
    event CreditoUsado(bytes32 indexed codigo, address indexed colecta, uint256 monto);

    modifier soloAdmin() {
        require(msg.sender == admin, "Solo la plataforma");
        _;
    }

    modifier soloColecta() {
        require(esColecta[msg.sender], "Solo una colecta registrada");
        _;
    }

    constructor(address _token, address _admin, address _cuentaComision) {
        token = _token;
        admin = _admin;
        cuentaComision = _cuentaComision;
        HTS.asociar(_token);
    }

    // ---- entidades
    function aprobarEntidad(address entidad, string calldata nombre, bytes32 pais, bytes32 fuente) external soloAdmin {
        require(entidad != address(0) && fuente != bytes32(0), "Falta la entidad o la fuente");
        entidades[entidad] = Entidad(true, pais, fuente, nombre);
        emit EntidadAprobada(entidad, nombre, pais, fuente);
    }

    function suspenderEntidad(address entidad) external soloAdmin {
        entidades[entidad].activa = false;
        emit EntidadSuspendida(entidad);
    }

    function esEntidad(address e) external view returns (bool) {
        return entidades[e].activa;
    }

    function esArgentina(address e) public view returns (bool) {
        return entidades[e].activa && entidades[e].pais == bytes32("AR");
    }

    // ---- colectas
    /// La registra su titular (con su firma): sin entidad argentina detrás, una colecta no recibe créditos.
    function registrarColecta(address colecta) external {
        require(msg.sender == IColectaFondo(colecta).titular(), "Solo la titular registra su colecta");
        require(esArgentina(msg.sender), "La titular tiene que ser una entidad argentina aprobada");
        esColecta[colecta] = true;
        emit ColectaRegistrada(colecta, msg.sender);
    }

    function inhabilitar(address organizador) external soloColecta {
        inhabilitado[organizador] = true;
        emit OrganizadorInhabilitado(organizador, msg.sender);
    }

    // ---- fondo de créditos
    function registrarLiquidacion(uint256 totalAportado, uint256 restante) external soloColecta {
        restanteLiquidado[msg.sender] += restante;
        totalAportadoLiquidado[msg.sender] = totalAportado;
        emit Liquidacion(msg.sender, restante, totalAportado);
    }

    /// Cualquiera puede pedirlo: solo le suma el crédito al código que donó.
    function reclamar(address colecta, bytes32 codigo) external returns (uint256 monto) {
        require(codigo != bytes32(0), "Las donaciones anonimas no generan creditos");
        require(!reclamado[colecta][codigo], "Ya reclamado");
        uint256 total = totalAportadoLiquidado[colecta];
        require(total > 0, "La colecta no se liquido");
        reclamado[colecta][codigo] = true;
        monto = (IColectaFondo(colecta).aportes(codigo) * restanteLiquidado[colecta]) / total;
        creditos[codigo] += monto;
        emit CreditoReclamado(colecta, codigo, monto);
    }

    /// La plataforma pasa la orden del donante; la plata solo puede ir a una colecta registrada y abierta.
    function usar(bytes32 codigo, address colecta, uint256 monto) external soloAdmin {
        require(esColecta[colecta] && IColectaFondo(colecta).abierta(), "La colecta destino no esta abierta");
        require(creditos[codigo] >= monto && monto > 0, "Creditos insuficientes");
        creditos[codigo] -= monto;
        HTS.transferir(token, colecta, monto);
        IColectaFondo(colecta).acreditarDesdeFondo(codigo, monto); // ya pagó comisión: no se cobra de nuevo
        emit CreditoUsado(codigo, colecta, monto);
    }
}
