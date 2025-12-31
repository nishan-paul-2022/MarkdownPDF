# Markify

A professional web application built with Next.js, Shadcn UI, and Playwright to convert Markdown (with Mermaid diagram support) into high-quality PDF reports.

## Features

- **Live Preview**: Real-time rendering of Markdown content.
- **Mermaid Support**: Seamlessly render diagrams within your markdown.
- **PDF Generation**: High-fidelity PDF output using Playwright.
- **Modern UI**: Built with Shadcn UI and Tailwind CSS v4.
- **Dockerized**: Easy deployment with Docker.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (optional)

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Using Docker (with Makefile)

Built-in commands for easy management:

- **Build image**: `make build`
- **Run container**: `make run`
- **Stop container**: `make stop`

## Industry Best Practices

- **Next.js App Router**: Utilizing the latest React features and Server Components.
- **TypeScript**: Typed codebase for better maintainability and error checking.
- **Modular Components**: Reusable UI components powered by Shadcn.
- **Standalone Docker Build**: Optimized multi-stage Docker build producing a small production image.
- **Tailwind CSS v4**: Leveraging the latest styling engine for performance and flexibility.

## License

MIT
