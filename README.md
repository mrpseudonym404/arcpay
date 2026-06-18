# ArcPay - USDC Payment Gateway on Arc Testnet

Send and receive USDC payment requests on the Arc L1 blockchain. Create invoices, share via Request ID, Magic Link, or QR code, and get paid instantly - no middleman, no signup.

Live Demo: https://arcpay-gamma.vercel.app

## Table of Contents

- [What is ArcPay?](#what-is-arcpay)
- [Features](#features)
- [How It Works](#how-it-works)
- [Smart Contracts](#smart-contracts)
- [Tech Stack](#tech-stack)
- [Arc & Circle Integrations](#arc--circle-integrations)
- [Local Development](#local-development)
- [License](#license)

## What is ArcPay?

ArcPay is a decentralized payment gateway built on Arc Testnet - a USDC-native L1 blockchain by Circle. It allows anyone to create USDC payment requests, share them via Request ID, Magic Link, or QR code, and let payers settle instantly with native USDC transfers.

Why ArcPay?
- No registration - just connect your wallet
- No middleman - direct USDC transfer on-chain
- No hidden fees - only Arc's minimal gas fee
- Fully open source - built for the Arc ecosystem

## Features

### Core Payments
- Connect Wallet - Rabby / MetaMask on Arc Testnet
- Create Request - Fill description and amount in USDC
- Magic Links - One-click payment links (/#reqId=0x...)
- Pay Request - Instant payment with native USDC transfer, using Request ID, Magic Link, or QR code
- QR Code Payment - Generate a QR code for any request - scan and pay instantly with a mobile wallet

### Request & Payment Management
- My Requests - View all requests you've created (newest first)
- Search & Filter - Find requests by ID or description
- Pagination - 5 items per page
- Magic Link Sharing - Copy ID or share a one-click link
- My Payments - On-chain history for payers (newest first)
- Export CSV - Download payment history as a CSV with Request and Memo IDs

### Gamification
- Daily Badge - Mint 1 badge every day, streak rewards at 7 days
- Achievement Badges - First Request, First Payment, 10 Requests, 100 USDC Paid, 7 Day Streak, Legend
- Points System - Earn points for each badge minted

### Analytics & Insights
- Analytics Dashboard - View your stats: total requests, payments, volume, badge progress, pending vs paid ratio, and more
- Leaderboard - Top users by points (anonymous addresses)

### Developer & UX
- Real-time Balance - Auto-refreshes on new blocks
- Gas Estimate - Shows estimated gas before payment
- Confirm Modal - Confirmation before paying to avoid mistakes
- Dark/Light Mode - Toggle theme, remembers your preference
- Mobile Responsive - Fully functional on desktop and mobile
- Toast Notifications - Clickable notifications with ArcScan link
- Confetti Animation - Celebration on successful payment
- Transaction Memos - On-chain structured context for payment reconciliation

## How It Works

For Creator (Wallet A)
1. Connect wallet (Rabby/MetaMask) to Arc Testnet
2. Create Request - fill description and amount in USDC
3. Share - copy Request ID, click the Magic Link, or generate a QR code
4. Send the ID/link to your payer via any chat app or have them scan the QR code

For Payer (Wallet B)
1. Connect wallet to Arc Testnet
2. Open the Magic Link, paste the Request ID, or scan the QR code
3. Click Pay Request - confirm transaction in wallet
4. Done - Status changes to "Paid", balance updates automatically

Badge System
1. Complete tasks (create request, pay request, etc.)
2. A pop-up "Badge Earned" appears
3. Click "Mint Badge" (only once per badge)
4. The badge appears in your collection with +50 points

## Smart Contracts

ArcPay uses three smart contracts deployed on Arc Testnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| ArcPayFixedV2 | 0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630 | Main payment contract - create and pay requests, on-chain history |
| ArcPayBadge | 0x4ceB5d7AB432339eCe9Ed41E3B93fF2466834Cd8 | Achievement badge system |
| ArcPayDailyBadge | 0xA9323D36E49aC6aC49F38aAd431f4C2b69280475 | Daily badge system - mint one badge per day, streak rewards, tier levels |

View all contracts on ArcScan: https://testnet.arcscan.app/address/0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Blockchain | Arc Testnet (Chain ID: 5042002) |
| Token | Native USDC (18 decimals) |
| Wallet Integration | ethers.js v6 |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Analytics | Vercel Web Analytics |

## Arc & Circle Integrations

ArcPay leverages the full Arc developer stack:

| Arc/Circle Product | Implementation |
|--------------------|----------------|
| Arc Testnet | All transactions on Arc L1 (Chain ID: 5042002) |
| Native USDC | Gas token and payment currency (18 decimals) |
| Circle Contracts API | Smart contract deployment and interaction |
| Event Monitoring | Webhook + Telegram bot for real-time notifications |
| Transaction Memos | On-chain structured context for payment reconciliation |
| CCTP Ready | Future cross-chain USDC transfers |
| Agentic Commerce | Native support for AI agent-to-agent payments |

ArcPay is a reference implementation of Agentic Commerce on Arc - a use case promoted by Circle for AI agents transacting with each other.

## Local Development

```bash
# Clone the repository
git clone https://github.com/mrpseudonym404/arcpay.git
cd arcpay

# Install dependencies
npm install

# Run development server
npm run dev
