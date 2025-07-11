const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Needed for local file access
        },
        icon: path.join(__dirname, 'images/favicon.ico'), // Convert your SVG to ICO
        show: false,
        backgroundColor: '#000000'
    });

    mainWindow.loadFile('index.html');
    
    // Remove menu bar (optional)
    Menu.setApplicationMenu(null);
    
    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // mainWindow.maximize(); // Start maximized
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});