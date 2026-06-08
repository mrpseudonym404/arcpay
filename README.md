# ArcPay

USDC payment requests on Arc Testnet. Create invoices, share magic links, anyone can pay with one click.

Live: [arcpay-gamma.vercel.app](https://arcpay-gamma.vercel.app)

---

## What it does
<<<<<<< HEAD

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
=======

- Connect wallet (Rabby/MetaMask) to Arc Testnet
- Create a payment request with description and amount
- Share the request ID or magic link
- Payer pastes ID or clicks link and pays instantly
- Payers can see their payment history on-chain
- Export payment history to CSV
- Search and filter requests by ID or description
- Dark/light mode toggle (remember preference)
- Pagination for requests and payments (5 items per page)
- Confirmation modal before paying
- Confetti animation on successful payment
- Real-time balance update on new blocks
- Telegram bot notifications for payments (optional)

---

## Features

| Feature | Description |
|---------|-------------|
| Connect Wallet | Rabby / MetaMask on Arc Testnet |
| Create Request | Fill description & amount in USDC |
| Magic Links | One-click payment links (`/#reqId=0x...`) |
| Pay Request | Instant payment with native USDC |
| Payment History | On-chain history for payers |
| Export CSV | Download payment history as CSV |
| Search & Filter | Find by ID or description |
| Dark/Light Mode | Toggle theme, saves preference |
| Pagination | 5 items per page |
| Confirm Modal | Confirm before paying (avoid mistakes) |
| Confetti | Celebration animation on success |
| Auto Refresh | Balance updates on new blocks |
| Telegram Bot | Real-time payment notifications |

---

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Blockchain:** Arc Testnet (Chain ID: 5042002)
- **Token:** Native USDC (18 decimals)
- **Wallet Integration:** ethers.js v6
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Analytics:** Vercel Web Analytics
- **Notifications:** Telegram Bot (optional)
>>>>>>> 4b6087c8a839c2ede2acdbcf2c3dcf3d3d53ecaf

---

## Smart contract

<<<<<<< HEAD
Address: `0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630`

[View on ArcScan](https://testnet.arcscan.app/address/0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630)
=======
| Property | Value |
|----------|-------|
| **Address** | `0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630` |
| **Network** | Arc Testnet |
<<<<<<< HEAD
| **Explorer** | [View on ArcScan](https://testnet.arcscan.app/address/0xF0E8582C1Ec5A182C9CF95802499f2eDa5CC03f8) |
>>>>>>> a5e618dc105245ec6e6e168fd67ab32efe2a705a
=======
| **Explorer** | [View on ArcScan](https://testnet.arcscan.app/address/0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630) |
>>>>>>> 4b6087c8a839c2ede2acdbcf2c3dcf3d3d53ecaf

---

## Run locally

<<<<<<< HEAD
`git clone https://github.com/mrpseudonym404/arcpay.git`
`cd arcpay`
`npm install`
`npm run dev`

---

## License

MIT
=======
```bash
git clone https://github.com/mrpseudonym404/arcpay.git
cd arcpay
npm install
npm run dev
>>>>>>> 4b6087c8a839c2ede2acdbcf2c3dcf3d3d53ecaf
