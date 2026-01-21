# Onchain Alert

UI untuk memantau whale alert dari data transfer Arkham + top token dari CMC.

## Fitur
- Ambil top token dari CoinMarketCap
- Hitung inflow/outflow per address dari Arkham
- Label address (CEX/DEX/Wallet/dll) dari Arkham
- Ringkasan signal bullish/bearish berbasis aliran CEX
- Auto refresh bisa dihentikan dengan tombol Stop

## Setup
1) Install dependency
```bash
npm install
```

2) Siapkan environment variable
```bash
cp .env.example .env
```
Isi:
- `CMC_API_KEY`
- `ARKHAM_API_KEY`
- `MAX_TOKEN_LIMIT` (opsional, default 100 agar tidak timeout di Netlify)

3) Jalankan server
```bash
npm start
```

Buka `http://localhost:5173`.

## Catatan
- `.env` tidak boleh di-commit.
- `node_modules/` tidak perlu di-commit.
