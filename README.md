# NexTeacher - Web3 Advisor Review Platform

<div align="center">
  <img src="public/nt_logo.png" alt="NexTeacher Logo" width="120" height="120">
  
  **Anonymous and Transparent Advisor Information Wiki & Review System**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6-green)](https://www.mongodb.com/)
  [![Solana](https://img.shields.io/badge/Solana-Web3-purple)](https://solana.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
</div>

## Project Overview

NexTeacher is a Web3-based advisor information aggregation and review platform designed to provide students with authentic and transparent advisor reviews, helping graduate students and PhD candidates choose suitable research advisors. The platform uses Solana signatures as an authentication mechanism to ensure high anonymity and transparency for all interactions.

### Core Features

- **🔐 Authentication** - Uses Solana wallet signatures as unique identity verification
- **🛡️ Anti-Malicious Attack** - Community voting system automatically identifies and filters malicious content
- **📊 Transparent Reviews** - All reviews and advisor information are community-verified
- **🌐 Fully Open Source** - Free to use with completely open-source code
- **⚡ High Performance** - Built on Next.js 15 and Vercel serverless architecture

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Wallet Integration**: Solana Wallet Adapter

### Backend Stack
- **Runtime**: Node.js (Vercel Serverless)
- **Database**: MongoDB Atlas
- **Authentication**: Solana wallet signature verification
- **Encryption**: TweetNaCl signature verification

### Web3 Integration
- **Network**: Solana Mainnet
- **Signature Algorithm**: Ed25519
- **Wallet Support**: Mainstream Solana wallets including Phantom, Solflare, Backpack

## Core Functionality

### 1. Advisor Information Management
- Create and edit advisor profiles
- Support for educational background, work experience, research fields, etc.
- Auto-generate random email (if not provided)
- Support for personal homepage links

### 2. Review System
- Anonymous reviews and comments
- 1-5 star rating system
- Review like/dislike mechanism
- Community voting to verify review quality

### 3. Crowdsourcing Enhancement
- Sort advisors by information completeness
- Contribution leaderboard
- Real-time statistics
- Community collaboration to improve advisor information

### 4. Search and Filtering
- Filter by university, department, and research field
- Full-text search functionality
- Paginated browsing
- Quick navigation

## Security Mechanisms

### Signature Verification Process
1. Generate a signature message with timestamp when user performs an action
2. Use Solana wallet to sign the message
3. Server validates signature and timestamp validity
4. Allow operations within signature validity period (5 minutes)

### Anti-Malicious Attack
- All content requires wallet signature verification
- Community voting system identifies low-quality content
- Timestamp verification prevents replay attacks
- Uniqueness constraints prevent duplicate operations

## Quick Start

### Requirements
- Node.js 18+
- MongoDB database
- Solana wallet (Phantom recommended)

### Installation Steps

1. **Clone the project**
```bash
git clone https://github.com/your-username/next-teacher.git
cd next-teacher
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env.local` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexteacher?retryWrites=true&w=majority
```

4. **Initialize database**
```bash
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using.

## Deployment Guide

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure `MONGODB_URI` environment variable
4. Automatic deployment complete

### Other Platform Deployment

Ensure the platform supports:
- Node.js 18+
- MongoDB connection
- Environment variable configuration

## Development Guide

### Project Structure
```
next-teacher/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── teachers/          # Teacher pages
│   ├── crowdsource/       # Crowdsource pages
│   └── search/           # Search pages
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── mongodb.ts         # Database connection
│   └── walletAuth.ts      # Wallet authentication
├── models/                # Mongoose models
├── types/                 # TypeScript types
└── public/                # Static assets
```

### Code Standards
- Use TypeScript strict mode
- Follow ESLint rules
- Use Tailwind CSS utility classes
- Components use functional style
- API routes have unified error handling

### Adding New Features
1. Define types in `types/`
2. Create Mongoose models in `models/`
3. Create API routes in `app/api/`
4. Create UI components in `components/`
5. Create pages in `app/`

## Roadmap

### Completed Features
- ✅ Solana wallet integration
- ✅ Advisor information management
- ✅ Review and comment system
- ✅ Community voting mechanism
- ✅ Crowdsourced information enhancement
- ✅ Search and filtering functionality
- ✅ Wallet behavior browser

### Planned Features
- 📋 Advanced data analytics
- 📋 Mobile application
- 📋 Multi-language support

## Contributing

We welcome community contributions! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Project URL: [https://nexteacher.wiki](https://nexteacher.wiki)
- Issue Tracker: [GitHub Issues](https://github.com/nexteacher/next-teacher/issues)
- Discussions: [GitHub Discussions](https://github.com/nexteacher/next-teacher/discussions)

---

<div align="center">
  <p>This project was generated by Generative AI</p>
</div>
