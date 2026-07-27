# Doque

> **Open. Read. Download. Instantly.**

Doque is a lightweight web application that lets users preview documents directly from a URL without downloading them first.

Simply paste a document link, and ViewDock fetches, renders, and displays the content in your browser with a smooth reading experience.

The project is designed to solve a common problem where many desktop applications require downloading a PDF before it can be viewed, while mobile apps often provide instant previews.

---

## Features

### Current (MVP)

- Paste any public PDF URL
- Instant document preview
- Page navigation
- Zoom in / Zoom out
- Fullscreen mode
- Download original document
- Responsive interface

---

## Planned Features

### Document Experience

- Search inside PDF
- Dark Mode
- Thumbnail sidebar
- Rotate pages
- Print document
- Bookmark pages
- Reading progress
- Recent documents

### File Support

- PDF
- DOCX
- PPTX
- XLSX
- TXT
- Markdown
- Images
- EPUB

### Performance

- Lazy page rendering
- Streaming support
- Smart caching
- Fast loading
- Large document optimization

### Security

- URL validation
- File type verification
- Size limits
- Safe document fetching
- Temporary cache cleanup

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Rendering

- Mozilla PDF.js

---

## Project Structure

```
ViewDock/

│── client/
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── index.html
│
│── server/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   └── app.js
│
│── cache/
│
│── package.json
│── README.md
```

---

## How It Works

```
Paste URL
      │
      ▼
Validate URL
      │
      ▼
Fetch Document
      │
      ▼
Verify File Type
      │
      ▼
Render using PDF.js
      │
      ▼
Interactive Viewer
```

---

## Future Roadmap

- User accounts
- Reading history
- Shared document links
- OCR support
- Document annotations
- Multi-file support
- Universal document viewer
- Browser extension
- Mobile application

---

## Goals

- Eliminate unnecessary downloads
- Provide a fast reading experience
- Support multiple document formats
- Build a clean and accessible interface
- Expand into a universal document viewer

---
 
