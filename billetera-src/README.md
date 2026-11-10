# Conexión con HashPack (WalletConnect)

La web no tiene paso de build, pero las librerías de billetera se instalan por npm. Acá vive el fuente (`hashpack.js`)
y se empaqueta a un solo archivo, `web/hashpack.js`, que **se commitea** y que `web/billetera.js` carga recién cuando
alguien toca "Conectar HashPack y donar".

```bash
cd billetera-src
npm install
npm run build      # regenera ../web/hashpack.js
```

- Usa `DAppConnector` de `@hashgraph/hedera-wallet-connect` (el camino que HashPack documenta) y el Project ID de Reown
  del sitio, que no es un secreto.
- La persona firma en su billetera una transferencia del token USDC a la billetera de la colecta con el memo
  `colecta:<id>`. El ID de esa transacción va a `POST /api/colectas/:id/donaciones`, que la verifica en el Mirror Node
  igual que cuando se pega a mano.
- Esta carpeta no se publica (`.vercelignore`).
