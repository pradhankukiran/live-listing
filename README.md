# Live Listing

A Next.js application for generating AI-powered on-model images without photoshoots.

## Project Overview

Live Listing is a modern web application that leverages AI to create professional on-model product images without the need for expensive photoshoots. The platform allows users to generate diverse model representations of clothing and accessories with customizable styles, poses, and settings.

## Features

- **AI Model Generation** - Create realistic virtual models for your products
- **Pose & Angle Control** - Adjust model poses and camera angles to showcase products effectively
- **Style & Fit Customization** - Tailor the appearance and fit of clothing on models
- **Model Diversity** - Select from a variety of model types to represent your product inclusively
- **Matching & Lighting** - Ensure consistent dress style and lighting across product images
- **Export-Ready Format** - Generate images in formats ready for e-commerce platforms

## Technology Stack

- **Framework**: Next.js 13.5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animation**: Framer Motion
- **AI Integration**: Replicate API
- **Form Handling**: React Hook Form
- **Data Visualization**: Recharts

## Project Structure

```
live-listing/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── studio/           # Studio page
│   └── page.tsx          # Main landing page
├── components/           # React components
│   ├── shared/           # Shared components
│   ├── studio/           # Studio-specific components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and helpers
├── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/live-listing.git
   cd live-listing
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Build and Deployment

To build the application for production:

```bash
npm run build
# or
yarn build
```

Start the production server:

```bash
npm run start
# or
yarn start
```

## Studio Interface

The studio interface provides a comprehensive environment for creating and customizing on-model images:

- **Image Canvas**: Preview and edit your generated images
- **Text Prompt Input**: Describe the desired output using natural language
- **Region Toolbar**: Tools for selecting and manipulating specific regions
- **Studio Sidebar**: Access controls for model attributes, poses, and settings

## Development Guidelines

- Follow TypeScript type definitions for all components and functions
- Use the existing UI component library for consistent styling
- Maintain responsive design principles throughout the application
- Write clean, modular code with appropriate comments

## License

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents is strictly prohibited. 