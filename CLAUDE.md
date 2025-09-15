# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an advanced CSS color palette builder application built with Vite and vanilla JavaScript. The application focuses on leveraging modern CSS features including:

- CSS `color-mix()` function for color blending
- Multiple color spaces (sRGB, Oklch, Lab, etc.)
- Custom palette size configuration
- Color export functionality
- Modern CSS color manipulation tools

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally

## Architecture

### File Structure
- `src/main.js` - Application entry point
- `styles/style.css` - Main stylesheet (note: uses `styles/` not `src/` directory)
- `index.html` - HTML template with Vite integration
- `public/` - Static assets

### Key Technical Requirements

**CSS Color Features to Implement:**
- Use `color-mix()` function for palette generation and color blending
- Support multiple color spaces: `srgb`, `oklch`, `lab`, `hsl`, `hwb`
- Implement CSS custom properties for dynamic theming
- Utilize modern color functions: `oklch()`, `lab()`, `lch()`, `hwb()`
- Support CSS relative color syntax when available

**Application Features:**
- Dynamic palette size configuration
- Real-time color preview with CSS `color-mix()`
- Export functionality for generated palettes
- Color space conversion and comparison
- Interactive color picker with modern CSS integration

### Browser Support Considerations
- Target modern browsers with CSS Color Level 4 support
- Use feature detection for `color-mix()` and `oklch()` functions
- Implement graceful fallbacks for unsupported color spaces

### Development Notes
- The project uses ES modules (`"type": "module"` in package.json)
- Stylesheet is located in `styles/style.css`, not within `src/`
- No testing framework is currently configured
- No linting configuration present