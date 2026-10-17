// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Servicio de tokens de Hedera (HTS), expuesto a los contratos en la dirección 0x167.
interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int64 responseCode);
    function transferToken(address token, address sender, address recipient, int64 amount) external returns (int64 responseCode);
}

/// Los tokens de HTS también responden como ERC-20 en su propia dirección (HIP-218).
interface ISaldoToken {
    function balanceOf(address account) external view returns (uint256);
}

/// Fideicomiso de una colecta. Guarda el USDC que llega de la rampa y solo lo deja salir hacia
/// proveedores aprobados, con la huella de la factura, cuando lo aprueban `umbral` firmantes
/// (la organización y las entidades que la avalan). No tiene dueño ni forma de actualizarse:
/// la plataforma no puede mover la plata, y tampoco ninguna entidad sola.
contract FideicomisoColecta {
    address private constant HTS = address(0x167);
    int64 private constant EXITO = 22; // ResponseCode SUCCESS de Hedera

    enum Tipo { AltaProveedor, Pago }

    struct Propuesta {
        Tipo tipo;
        address destino; // el proveedor
        int64 monto; // en unidades del token (USDC: 6 decimales)
        bytes32 factura; // SHA-256 del PDF de la factura; el PDF nunca va a la red
        uint8 aprobaciones;
        bool ejecutada;
    }

    address public immutable token;
    uint8 public immutable umbral;
    string public colecta;
    address[] public firmantes;
    mapping(address => bool) public esFirmante;
    mapping(address => bool) public esProveedor;
    Propuesta[] public propuestas;
    mapping(uint256 => mapping(address => bool)) public aprobo;

    event Propuesto(uint256 indexed id, Tipo tipo, address indexed destino, int64 monto, bytes32 factura, address indexed por);
    event Aprobado(uint256 indexed id, address indexed por, uint8 aprobaciones);
    event ProveedorAprobado(uint256 indexed id, address indexed proveedor);
    event Pagado(uint256 indexed id, address indexed proveedor, int64 monto, bytes32 factura);

    modifier soloFirmante() {
        require(esFirmante[msg.sender], "No sos firmante de esta colecta");
        _;
    }

    constructor(address _token, string memory _colecta, address[] memory _firmantes, uint8 _umbral) {
        require(_umbral >= 2 && _umbral <= _firmantes.length, "El umbral tiene que ser de al menos 2 firmas");
        token = _token;
        colecta = _colecta;
        umbral = _umbral;
        for (uint256 i = 0; i < _firmantes.length; i++) {
            address f = _firmantes[i];
            require(f != address(0) && !esFirmante[f], "Firmante repetido o vacio");
            esFirmante[f] = true;
            firmantes.push(f);
        }
        // Sin asociación, Hedera rechaza cualquier transferencia del token hacia el contrato.
        (bool ok, bytes memory r) = HTS.call(abi.encodeWithSelector(IHederaTokenService.associateToken.selector, address(this), _token));
        require(ok && abi.decode(r, (int64)) == EXITO, "No se pudo asociar el token");
    }

    /// Un firmante propone sumar un proveedor; queda aprobado cuando firman `umbral`.
    function proponerProveedor(address proveedor) external soloFirmante returns (uint256) {
        require(proveedor != address(0) && !esProveedor[proveedor], "Proveedor vacio o ya aprobado");
        return _proponer(Tipo.AltaProveedor, proveedor, 0, bytes32(0));
    }

    /// Un firmante propone pagarle a un proveedor aprobado, con la huella de la factura.
    function proponerPago(address proveedor, int64 monto, bytes32 factura) external soloFirmante returns (uint256) {
        require(esProveedor[proveedor], "El proveedor no esta aprobado");
        require(monto > 0, "El monto tiene que ser mayor que cero");
        require(factura != bytes32(0), "Falta la huella de la factura");
        return _proponer(Tipo.Pago, proveedor, monto, factura);
    }

    function aprobar(uint256 id) external soloFirmante {
        _aprobar(id);
    }

    function saldo() external view returns (uint256) {
        return ISaldoToken(token).balanceOf(address(this));
    }

    function cantidadPropuestas() external view returns (uint256) {
        return propuestas.length;
    }

    function cantidadFirmantes() external view returns (uint256) {
        return firmantes.length;
    }

    /// Quien propone ya cuenta como primera aprobación.
    function _proponer(Tipo tipo, address destino, int64 monto, bytes32 factura) private returns (uint256 id) {
        id = propuestas.length;
        propuestas.push(Propuesta(tipo, destino, monto, factura, 0, false));
        emit Propuesto(id, tipo, destino, monto, factura, msg.sender);
        _aprobar(id);
    }

    function _aprobar(uint256 id) private {
        require(id < propuestas.length, "No existe esa propuesta");
        Propuesta storage p = propuestas[id];
        require(!p.ejecutada, "La propuesta ya se ejecuto");
        require(!aprobo[id][msg.sender], "Ya aprobaste esta propuesta");
        aprobo[id][msg.sender] = true;
        p.aprobaciones++;
        emit Aprobado(id, msg.sender, p.aprobaciones);
        if (p.aprobaciones < umbral) return;

        p.ejecutada = true;
        if (p.tipo == Tipo.AltaProveedor) {
            esProveedor[p.destino] = true;
            emit ProveedorAprobado(id, p.destino);
        } else {
            (bool ok, bytes memory r) = HTS.call(
                abi.encodeWithSelector(IHederaTokenService.transferToken.selector, token, address(this), p.destino, p.monto)
            );
            require(ok && abi.decode(r, (int64)) == EXITO, "Hedera rechazo el pago (saldo o asociacion del proveedor)");
            emit Pagado(id, p.destino, p.monto, p.factura);
        }
    }
}
