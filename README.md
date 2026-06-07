# ArcPay

USDC payment requests on Arc Testnet. Create invoices, share magic links, anyone can pay with one click.

Live: [arcpay-gamma.vercel.app](https://arcpay-gamma.vercel.app)

---

## What it does

- Connect wallet (Rabby/MetaMask) to Arc Testnet
- Create a payment request with description and amount
- Share the request ID or magic link
- Payer pastes ID or clicks link and pays instantly

Payers can also see their payment history on-chain.

---

## Features

- Dark/light mode
- Search and filter requests
- Export payment history to CSV
- Pagination (5 items per page)
- Confirmation modal before paying
- Confetti on successful payment

---

## Tech stack

- Next.js 15 (App Router)
- ethers.js
- Tailwind CSS
- Vercel
- Arc Testnet (Chain ID: 5042002)

---

## Smart contract

<<<<<<< HEAD
Address: `0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630`

[View on ArcScan](https://testnet.arcscan.app/address/0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630)
=======
| Property | Value |
|----------|-------|
| **Address** | `0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630`
` |
| **Network** | Arc Testnet |
| **Explorer** | [View on ArcScan](https://testnet.arcscan.app/address/0xF0E8582C1Ec5A182C9CF95802499f2eDa5CC03f8) |
>>>>>>> a5e618dc105245ec6e6e168fd67ab32efe2a705a

---

## Run locally

`git clone https://github.com/mrpseudonym404/arcpay.git`
`cd arcpay`
`npm install`
`npm run dev`

---

## License

MIT
