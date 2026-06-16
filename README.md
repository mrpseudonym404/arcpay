# ⚡ ArcPay — USDC Payment Gateway on Arc Testnet

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://arcpay-gamma.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Arc Testnet](https://img.shields.io/badge/Network-Arc%20Testnet-cyan)](https://arc.network)
[![Circle](https://img.shields.io/badge/Powered%20by-Circle-1E4D7A)](https://circle.com)

> **Send and receive USDC payment requests on Arc L1 blockchain. Create invoices, share one-click magic links, and get paid instantly — no middleman, no signup.**

**Live Demo:** [arcpay-gamma.vercel.app](https://arcpay-gamma.vercel.app)

---

## 📋 Table of Contents

- [What is ArcPay?](#what-is-arcpay)
- [Features](#features)
- [How It Works](#how-it-works)
- [Smart Contracts](#smart-contracts)
- [Tech Stack](#tech-stack)
- [Arc & Circle Integrations](#arc--circle-integrations)
- [Local Development](#local-development)
- [License](#license)

---

## 🎯 What is ArcPay?

ArcPay is a **decentralized payment gateway** built on **Arc Testnet** — a USDC-native L1 blockchain by Circle. It allows anyone to create USDC payment requests, share them via magic links, and let payers settle instantly with native USDC transfers.

**Why ArcPay?**
- ✅ No registration — just connect your wallet
- ✅ No middleman — direct USDC transfer on-chain
- ✅ No hidden fees — only Arc's minimal gas fee
- ✅ Fully open source — built for the Arc ecosystem

---

## ✨ Features

| Category | Feature | Description |
|----------|---------|-------------|
| **Core Payment** | Connect Wallet | Rabby / MetaMask on Arc Testnet |
| | Create Request | Fill description & amount in USDC |
| | Magic Links | One-click payment links (`/#reqId=0x...`) |
| | Pay Request | Instant payment with native USDC transfer |
| **User Experience** | Dark/Light Mode | Toggle theme, remembers your preference |
| | Mobile Responsive | Fully functional on desktop & mobile |
| | Toast Notifications | Clickable notifications with ArcScan link |
| | Confetti Animation | Celebration on successful payment |
| **Request Management** | My Requests | View all requests you've created (newest first) |
| | Search & Filter | Find by ID or description |
| | Pagination | 5 items per page |
| | Magic Link Sharing | Copy ID or share one-click link |

### QR Code Payment
Generate QR code for any request — scan and pay instantly with mobile wallet.
| **Payment History** | My Payments | On-chain history for payers (newest first) |
| | Export CSV | Download payment history as CSV |
| **Gamification** | Daily Badge | Mint 1 badge every day, streak rewards at 7 days |
| | Achievement Badges | First Request, First Payment, 10 Requests, 100 USDC Paid, 7 Day Streak, Legend |
| | Points System | Earn 50 points per badge |

### Analytics Dashboard
View your stats:
- Total requests, payments, volume
- Badge progress (X/6)
- Pending vs Paid ratio
- Current streak & tier
- Next badge suggestion
| | Tier Levels | 10 tiers from Rookie Builder to Transcendent |
| | Leaderboard | Top users by points (anonymous addresses) |
| **Developer** | Real-time Balance | Auto-refresh on new blocks |
| | Gas Estimate | Shows estimated gas before payment |
| | Confirm Modal | Confirmation before paying (avoid mistakes) |
| | Telegram Bot | Optional real-time payment notifications |

---

## 🚀 How It Works

### For Creator (Wallet A)
1. **Connect wallet** (Rabby/MetaMask) to Arc Testnet
2. **Create Request** — fill description & amount in USDC
3. **Share ID** — copy Request ID or click 🔗 Magic Link
4. Send the ID/link to your payer via any chat app

### For Payer (Wallet B)
1. **Connect wallet** to Arc Testnet
2. **Paste Request ID** (or click magic link from creator)
3. **Click Pay Request** → confirm transaction in wallet
4. **Done!** — Status changes to "Paid", balance updates automatically

### Badge System
1. Complete tasks (create request, pay request, etc.)
2. Popup "Badge Earned!" appears
3. Click **"Mint Badge"** (only once per badge)
4. Badge appears in your collection with +50 points

---

## 📜 Smart Contracts

ArcPay uses **three smart contracts** deployed on Arc Testnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| **ArcPayFixedV2** | `0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630` | Main payment contract — create & pay requests, on-chain history |
| **ArcPayBadge** | `0x4ceB5d7AB432339eCe9Ed41E3B93fF2466834Cd8` | Achievement badge system — First Request, First Payment, 10 Requests, 100 USDC Paid, Legend |
| **ArcPayDailyBadge** | `0xA9323D36E49aC6aC49F38aAd431f4C2b69280475` | Daily badge system — mint one badge per day, streak rewards, tier levels |

**[View all contracts on ArcScan](https://testnet.arcscan.app/address/0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630)**

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Blockchain** | Arc Testnet (Chain ID: 5042002) |
| **Token** | Native USDC (18 decimals) |
| **Wallet Integration** | ethers.js v6 |
| **Styling** | Tailwind CSS |
| **Deployment** | Vercel |
| **Analytics** | Vercel Web Analytics |
| **Notifications** | Telegram Bot (optional) |

---

## 🔗 Arc & Circle Integrations

ArcPay leverages the full Arc developer stack:

| Arc/Circle Product | Implementation |
|--------------------|----------------|
| **Arc Testnet** | All transactions on Arc L1 (Chain ID: 5042002) |
| **Native USDC** | Gas token & payment currency (18 decimals) |
| **Circle Contracts API** | Smart contract deployment & interaction |
| **Event Monitoring** | Webhook + Telegram bot for real-time notifications |
| **CCTP Ready** | Future cross-chain USDC transfers |
| **Agentic Commerce** | Native support for AI agent-to-agent payments |

> ArcPay is a reference implementation of **Agentic Commerce** on Arc — a use case promoted by Circle for AI agents transacting with each other.

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/mrpseudonym404/arcpay.git
cd arcpay

# Install dependencies
npm install

# Run development server
npm run dev
