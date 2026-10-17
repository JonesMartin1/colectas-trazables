// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISaldoToken {
    function balanceOf(address account) external view returns (uint256);
}

/// Servicio de tokens de Hedera (precompilado 0x167). Los códigos de respuesta son los de Hedera: 22 = SUCCESS.
library HTS {
    address private constant PRECOMPILADO = address(0x167);
    int64 private constant EXITO = 22;

    function _ok(bool ok, bytes memory r) private pure returns (bool) {
        return ok && r.length >= 32 && abi.decode(r, (int64)) == EXITO;
    }

    /// Sin asociación, Hedera rechaza cualquier transferencia del token hacia el contrato.
    function asociar(address token) internal {
        (bool ok, bytes memory r) = PRECOMPILADO.call(abi.encodeWithSignature("associateToken(address,address)", address(this), token));
        require(_ok(ok, r), "No se pudo asociar el token");
    }

    /// Manda tokens del contrato a una cuenta. Las cuentas con alias EVM se pasan por esa dirección.
    function transferir(address token, address destino, uint256 monto) internal {
        if (monto == 0) return;
        require(monto <= uint256(uint64(type(int64).max)), "Monto fuera de rango");
        (bool ok, bytes memory r) = PRECOMPILADO.call(
            abi.encodeWithSignature("transferToken(address,address,address,int64)", token, address(this), destino, int64(uint64(monto)))
        );
        require(_ok(ok, r), "Hedera rechazo la transferencia");
    }

    /// Cobra tokens de quien llama: antes tiene que haberle dado permiso (allowance) al contrato.
    function traer(address token, address origen, uint256 monto) internal {
        (bool ok, bytes memory r) = PRECOMPILADO.call(
            abi.encodeWithSignature("transferFrom(address,address,address,uint256)", token, origen, address(this), monto)
        );
        require(_ok(ok, r), "Hedera rechazo el cobro (falta el permiso del donante?)");
    }

    function saldo(address token) internal view returns (uint256) {
        return ISaldoToken(token).balanceOf(address(this));
    }
}
