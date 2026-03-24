# QR Code Scanner Web Application

A modern, responsive QR code scanner web application built with React, Vite, and Tailwind CSS. Automatically detects and displays QR code content in a formatted table based on the content type.

## Features

✨ **Supported QR Code Types:**
- **JSON Data** - Parse and display structured JSON objects
- **vCard/Contact** - Extract name, phone, email, company, website, address
- **URLs** - Extract full URL, domain, and protocol
- **WiFi Credentials** - Parse SSID, password, and security type
- **Email Addresses** - Extract email, subject, and body
- **Phone Numbers** - Extract phone numbers
- **Plain Text** - Display any unformatted text

🎯 **Key Features:**
- Real-time QR code scanning from device camera
- Automatic content type detection
- Copy table data to clipboard with one click
- Responsive design (works great on mobile)
- Error handling with user-friendly messages
- Clean, modern UI with black and white color scheme
- Loading states and visual feedback

## Prerequisites

- Node.js 16+ and npm/yarn/pnpm installed
- A modern browser with camera support
- Camera permission granted to the browser

## Installation

1. **Clone or navigate to the project directory:**
```bash
cd qrscanner
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173` (or the URL shown in terminal)

## Usage

1. **Click "Start Camera"** to activate your device's camera
2. **Position the QR code** within the scanning frame
3. **Wait for detection** - the app automatically detects and parses the QR code
4. **View Results** - the parsed data displays in a formatted table
5. **Copy Data** - click the "Copy" button to copy all data to clipboard
6. **Scan Again** - click "Scan Another QR Code" to return to scanner

## Project Structure

```
qrscanner/
├── src/
│   ├── components/
│   │   ├── QRScanner.jsx       # Main camera scanner component
│   │   ├── ResultTable.jsx     # Results display table
│   │   └── ErrorMessage.jsx    # Error notification component
│   ├── utils/
│   │   ├── qrParser.js         # QR content detection and parsing
│   │   └── formatters.js       # Data formatting utilities
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind CSS imports
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
└── package.json                # Dependencies and scripts
```

## Technology Stack

- **React 18** - UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **@zxing/library** - QR code decoding library
- **lucide-react** - Beautiful icon library
- **PostCSS & Autoprefixer** - CSS processing

## Browser Support

- Chrome/Chromium 88+
- Firefox 87+
- Safari 14.1+
- Edge 88+

**Note:** Mobile browsers require HTTPS for camera access (except localhost)

## Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build & Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Output will be in the `dist/` folder**

3. **Deploy to hosting:**
   - Copy the `dist/` folder contents to your web server
   - For static hosting (Vercel, Netlify, GitHub Pages):
     - Upload the `dist/` folder
     - Set the build output directory to `dist`

## Troubleshooting

**Camera not working?**
- Ensure you've granted camera permissions
- Check browser console for error messages
- Try a different browser if issues persist
- On mobile, ensure you're using HTTPS (except localhost)

**QR code not detecting?**
- Ensure good lighting
- Hold camera steady and closer to QR code
- Clean your camera lens
- Make sure QR code is fully visible in frame

**"Camera permission denied" error?**
- Check browser settings and allow camera access
- Clear browser cache and cookies
- Try incognito/private mode

## Performance Tips

- For best results, use in well-lit environments
- Position QR codes at least 20cm away from camera
- Keep the camera still while scanning
- The app runs entirely in the browser - no server required

## License

This project is open source. Feel free to modify and use as needed.

## Contributing

Suggestions and improvements are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

---

**Happy scanning! 📱**
