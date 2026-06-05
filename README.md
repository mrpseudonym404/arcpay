# ⚡ ArcPay — USDC Payment Requests on Arc Testnet

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://arcpay-gamma.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Arc Testnet](https://img.shields.io/badge/Network-Arc%20Testnet-cyan)](https://arc.network)

> Send and receive USDC payment requests on Arc L1 blockchain. Create invoices, share magic links, let anyone pay you instantly.

**Live Demo:** [arcpay-gamma.vercel.app](https://arcpay-gamma.vercel.app)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **Connect Wallet** | Rabby / MetaMask on Arc Testnet |
| 📝 **Create Requests** | Set description & amount in USDC |
| 🔗 **Magic Links** | One-click payment links (`/#reqId=0x...`) |
| 💸 **Pay Requests** | Payer pays with native USDC transfer |
| 🌓 **Dark/Light Mode** | Toggle theme, remembers preference |
| 🔍 **Search & Filter** | Find by ID or description |
| 🎉 **Confetti** | Celebratory animation on successful payment |
| ⛽ **Gas Estimate** | Shows estimated gas before payment |

---

## 🚀 How It Works

### For Creator (Wallet A)
1. Connect wallet
2. Fill description & amount → **Create Request**
3. Copy Request ID or click **🔗** to share magic link

### For Payer (Wallet B)
1. Connect wallet
2. Paste Request ID (or click magic link from creator)
3. Click **Pay Request** → confirm transaction

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Blockchain:** Arc Testnet (Chain ID: 5042002)
- **Token:** Native USDC (18 decimals)
- **Wallet Integration:** ethers.js v6
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 📦 Smart Contract

| Property | Value |
|----------|-------|
| **Address** | `0xF0E8582C1Ec5A182C9CF95802499f2eDa5CC03f8` |
| **Network** | Arc Testnet |
| **Explorer** | [View on ArcScan](https://testnet.arcscan.app/address/0xF0E8582C1Ec5A182C9CF95802499f2eDa5CC03f8) |

---

## 🧪 Local Development

```bash
# Clone the repository
git clone https://github.com/mrpseudonym404/arcpay.git

# Install dependencies
npm install

# Run development server
npm run dev
