# Sky Vault 🚀

A modern, AI-powered cloud storage platform for managing, organizing, and sharing your files with intelligent features. Built with Next.js 15, TypeScript, and cutting-edge AI technologies.

## ✨ Features

- **🤖 AI-Powered Intelligence**
  - Automatic content tagging and categorization
  - OCR for text extraction from images and documents
  - Smart file summarization
  - Intelligent search and recommendations

- **📁 Advanced File Management**
  - Drag & drop file uploads
  - Folder organization and navigation
  - File favorites and recents tracking
  - Trash management with restore capabilities

- **🔐 Security & Authentication**
  - Secure authentication with Clerk
  - User profile management
  - Password reset functionality
  - Protected routes and API endpoints

- **🎨 Modern UI/UX**
  - Responsive dashboard with light/dark theme support
  - Hero UI components for a polished interface
  - Real-time file previews
  - Keyboard shortcuts for power users

- **☁️ Cloud Storage Integration**
  - ImageKit.io integration for optimized media delivery
  - Efficient file streaming and CDN support
  - Multiple file format support (images, PDFs, documents)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router & Turbopack
- **Language:** TypeScript
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Authentication:** Clerk
- **UI Library:** Hero UI, Radix UI, Framer Motion
- **Styling:** Tailwind CSS 4
- **Cloud Storage:** ImageKit.io
- **AI/ML:** OpenAI APIs, OCR.space
- **State Management:** Zustand
- **Form Handling:** React Hook Form with Zod validation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- PostgreSQL database (or Neon account)
- ImageKit.io account
- Clerk account
- OCR.space API key (optional)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/satya1844/sky-vault.git
cd sky-vault
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Copy the sample environment file and fill in your credentials:

```bash
cp env.sample .env.local
```

Configure the following variables in `.env.local`:

```env
# Database
DATABASE_URL=your_neon_database_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# OCR (Optional)
OCR_SPACE_API_KEY=your_ocr_space_api_key
```

### 4. Set up the database

Run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

Or push the schema directly (for development):

```bash
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📖 Usage

### Basic Operations

**Uploading Files:**
1. Navigate to the Dashboard
2. Click the upload button or drag & drop files into the upload zone
3. Files are automatically processed and stored

**Organizing Files:**
1. Create folders from the sidebar
2. Drag files into folders for organization
3. Use the folder navigation to browse your structure

**AI Features:**
1. **Auto-tagging:** Upload images to automatically generate descriptive tags
2. **OCR:** Upload documents to extract text content
3. **Smart Search:** Use natural language to find files
4. **Summarization:** Get AI-generated summaries of documents

**File Management:**
- Star files to add them to favorites
- View recent files in the Recents tab
- Move files to trash (with restore capability)
- Share files with secure links

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Building
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors automatically

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio for database management
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
```

### Keyboard Shortcuts

- `Ctrl/Cmd + U` - Upload files
- `Delete` - Move selected file to trash
- `Ctrl/Cmd + F` - Focus search
- Arrow keys - Navigate files

## 🗺️ Roadmap

### Phase 1: Core AI Features (Completed ✓)
- [x] AI-powered auto-tagging
- [x] OCR text extraction
- [x] File summarization
- [x] Basic search functionality

### Phase 2: Collaboration & Sharing (In Progress)
- [ ] Real-time collaborative folders
- [ ] File annotations and comments
- [ ] Secure time-bound link sharing
- [ ] Download limits and permissions
- [ ] Team workspaces

### Phase 3: Advanced Features (Planned)
- [ ] Smart folder recommendations
- [ ] Advanced multi-filter search
- [ ] Image comparison tool
- [ ] Version history and snapshots
- [ ] Browser extension for quick uploads

### Phase 4: Developer Experience (Planned)
- [ ] REST & GraphQL APIs
- [ ] SDK for JavaScript and Python
- [ ] Webhook support
- [ ] CLI tool
- [ ] Progressive Web App (PWA)

### Phase 5: Enhanced UX (Planned)
- [ ] Customizable themes and color schemes
- [ ] Masonry layout for image gallery
- [ ] Advanced image editing tools
- [ ] Bulk operations
- [ ] Analytics dashboard

See [Enhancements.md](Enhancements.md) for detailed enhancement plans.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

**Satya** – [@satya1844](https://github.com/satya1844)

Project Link: [https://github.com/satya1844/sky-vault](https://github.com/satya1844/sky-vault)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Vercel](https://vercel.com/) - Deployment and hosting platform
- [Clerk](https://clerk.com/) - Authentication and user management
- [ImageKit.io](https://imagekit.io/) - Media optimization and delivery
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Hero UI](https://heroui.com/) - Beautiful React component library
- [OpenAI](https://openai.com/) - AI-powered features
- [OCR.space](https://ocr.space/) - OCR API service
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

Built with ❤️ by [Satya](https://github.com/satya1844)
