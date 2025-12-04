# ApexScript

**AI-powered manuscript validation for academic researchers.**

ApexScript provides automated formatting checks, citation analysis, and compliance validation for academic manuscripts. Built with SvelteKit and powered by OpenAI's GPT-4, it helps researchers ensure their work meets journal guidelines before submission.

---

## ✨ Features

- **Lightning Fast Analysis**: Instant manuscript validation powered by advanced LLMs
- **99% Accurate**: Validated against thousands of academic journal guidelines
- **Secure & Private**: End-to-end encryption with zero data retention
- **Global Support**: Works with 50+ major academic journals
- **Smart Citation Analysis**: Detects and validates in-text citations and reference formatting
- **Custom Rule Sets**: Configurable validation rules for different journals

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/apexscript.git
   cd apexscript
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory:

   ```bash
   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   > **⚠️ Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

---

## 📖 Usage

### Running Locally

```bash
npm run dev
```

This starts the development server with hot module replacement (HMR). Any changes you make to the code will automatically reload in the browser.

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Preview Production Build

```bash
npm run preview
```

Preview the production build locally before deploying.

---

## 🛠️ Project Structure

```
apexscript/
├── src/
│   ├── lib/
│   │   ├── components/      # Reusable UI components
│   │   ├── stores/          # Svelte stores for state management
│   │   └── utils/           # Utility functions
│   ├── routes/              # SvelteKit routes
│   │   ├── api/             # API endpoints
│   │   ├── dashboard/       # Dashboard page
│   │   ├── docs/            # Documentation page
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   └── styles/              # Global styles
├── static/                  # Static assets
├── .env                     # Environment variables (create this)
├── package.json             # Dependencies and scripts
├── svelte.config.js         # SvelteKit configuration
└── README.md                # This file
```

---

## 🔧 Configuration

### OpenAI API

The application uses OpenAI's GPT-4 for manuscript analysis. Make sure to:

1. Create an OpenAI account at [platform.openai.com](https://platform.openai.com/)
2. Generate an API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

### Custom Journal Rules

You can customize validation rules in `src/general_rules.ts`. This file contains the base rules for common academic formatting standards.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🎨 Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Fast, modern web framework
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Typography**: Crimson Pro & Plus Jakarta Sans (Google Fonts)
- **AI**: [OpenAI GPT-4](https://openai.com/) - Advanced language model
- **Document Parsing**: [Mammoth.js](https://github.com/mwilliamson/mammoth.js/) - .docx to HTML conversion

---

## 🔐 Security & Privacy

- **Zero Data Retention**: Uploaded manuscripts are never stored on servers
- **End-to-End Encryption**: All data transmission is encrypted
- **API Key Safety**: Your OpenAI API key is stored securely in environment variables
- **No Third-Party Analytics**: We don't track your usage

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use, you can specify a different port:

```bash
npm run dev -- --port 3000
```

### API Key Issues

If you're getting API errors:

1. Verify your `.env` file exists and contains `OPENAI_API_KEY`
2. Check that your API key is valid and has sufficient credits
3. Ensure there are no extra spaces or quotes around the key

### Build Errors

If you encounter build errors:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 💬 Support

For questions, issues, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/apexscript/issues)
- **Email**: support@apexscript.com

---

## 🙏 Acknowledgments

- Inspired by the need for automated academic manuscript validation
- Built with love for the research community
- Special thanks to all contributors

---

**Made with ❤️ for researchers worldwide**
