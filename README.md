# MIT App Inventor AIA Generator

A web application that generates MIT App Inventor 2 specification-compliant AIA files from your project specifications, with Google Custom Search API integration and extension support.

## Features

- **Project Configuration**: Easy-to-use form for setting up your MIT AI2 project
- **Google Search Integration**: Built-in Google Custom Search API configuration
- **Extension Support**: Upload and include .aix extension files
- **Real-time Feature Detection**: Automatically detects features from requirements text
- **MIT AI2 Compliance**: Generates files that strictly follow MIT App Inventor 2 specifications
- **Professional Interface**: Clean, user-friendly web interface with validation

## Windows Installation Guide

### Prerequisites

1. **Node.js 20 or higher**
   - Download from: https://nodejs.org/
   - Choose "LTS" version for Windows
   - Install with default settings

2. **Google API Setup**
   - Enable Custom Search API in Google Cloud Console
   - Create a Custom Search Engine at https://cse.google.com/
   - Get your API Key and CSE ID

### Installation Steps

1. **Extract the ZIP file**
   ```
   Extract mit-aia-generator.zip to your desired folder
   ```

2. **Open Command Prompt**
   - Press `Win + R`, type `cmd`, press Enter
   - Navigate to the extracted folder:
   ```cmd
   cd path\to\mit-aia-generator
   ```

3. **Install Dependencies**
   ```cmd
   npm install
   ```

4. **Start the Application**
   ```cmd
   npm run dev
   ```

5. **Access the Application**
   - Open your web browser
   - Go to: http://localhost:5000
   - The application will be running

### Using the Application

1. **Project Configuration**
   - Enter a unique Project Name (alphanumeric only)
   - Provide your MIT App Inventor User ID

2. **API Configuration**
   - Enter your Google API Key
   - Enter your Custom Search Engine ID

3. **App Content**
   - Set a default search prompt
   - Describe app requirements (e.g., "use list view", "play sound")

4. **Extensions (Optional)**
   - Upload .aix extension files if needed

5. **Generate AIA File**
   - Click "Validate Configuration" to check settings
   - Click "Generate AIA File" to create and download your file

### Requirements Features

The application automatically detects features from your requirements text:

- **List View**: Include "list view" or "show results in list"
- **Sound Playback**: Include "play sound" or "sound"
- **Custom Components**: Upload .aix extension files

### Generated File Structure

The generated .aia file includes:
- `project.properties` - Project configuration
- `Screen1.scm` - Visual component definitions
- `Screen1.bky` - Block programming logic
- `assets/` - Sound files and resources
- `external_comps/` - Extension files

### Troubleshooting

**Application won't start:**
- Ensure Node.js is properly installed
- Check that port 5000 is available
- Run `npm install` again if needed

**Generation fails:**
- Verify Google API Key is valid
- Check Custom Search Engine ID
- Ensure project name is alphanumeric only

**Extensions not working:**
- Only .aix files are supported
- Check file permissions and corruption

### Support

For issues or questions:
- Check MIT App Inventor documentation
- Verify Google Custom Search API setup
- Ensure all required fields are filled

### Technical Notes

- Built with Node.js and React
- Uses Express.js backend
- Generates MIT AI2 compliant files
- Supports Windows, macOS, and Linux
- No database required - runs locally

---

© 2024 MIT App Inventor AIA Generator. Built for educational and development purposes.