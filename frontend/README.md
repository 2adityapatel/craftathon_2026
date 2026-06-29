# Frontend - POCSO Blockchain Reporting System

This is the frontend application for the POCSO Blockchain Reporting System, built with **React** and **Vite**, and styled using **Tailwind CSS**.

## Design Philosophy: The Sovereign Sentinel
This application strictly adheres to the "Sovereign Sentinel" design system. It is engineered to convey absolute authority, surgical precision, and ironclad security. 
- **No SaaS Tropes**: We avoid playful, rounded UI elements.
- **Color Palette**: Deep, obsidian-like foundations (`#0a0e14`) with high-contrast functional accents (e.g., `#21b375` for verified states).
- **Typography**: Space Grotesk for display/headlines and Inter for UI/data grids.

**Please review the root `DESIGN.md` file before making any UI contributions.**

## Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Utilities**: `exifr` (for secure image metadata handling)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables by creating a `.env` file based on your backend configuration.

### Running the Development Server
```bash
npm run dev
```
The app will be accessible at `http://localhost:5173`.

### Building for Production
```bash
npm run build
```
