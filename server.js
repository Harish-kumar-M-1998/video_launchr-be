const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const { exec } = require('child_process');

const app = express();
const port = 8080;

// Path to the default video
const defaultVideoPath = 'D:\\vid.mp4'; // Update this path to your default video file

// Serve the React app (Client) from the build directory
app.use(express.static(path.join(__dirname, 'client/front/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/front/build', 'index.html'));
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('New client connected');

    let vlcProcess = null; // Keep track of the VLC process

    ws.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'launch') {
            // Launch VLC Media Player with default video
            vlcProcess = exec(`start "" "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe" "${defaultVideoPath}"`);
            console.log('Launched VLC with default video');
            ws.send(JSON.stringify({ type: 'status', message: 'VLC launched with default video' }));
        } else if (data.type === 'control') {
            if (vlcProcess) {
                let command = '';
                switch (data.command) {
                    case 'play':
                        command = 'play';
                        break;
                    case 'pause':
                        command = 'pause';
                        break;
                    case 'stop':
                        command = 'stop';
                        break;
                    default:
                        console.log('Unknown command');
                        ws.send(JSON.stringify({ type: 'status', message: 'Unknown command' }));
                        return;
                }
                exec(`start "" "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe" --${command}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Error: ${stderr}`);
                        return;
                    }
                    console.log(`VLC command ${command} executed`);
                });
                ws.send(JSON.stringify({ type: 'status', message: `Command ${command} received` }));
            } else {
                ws.send(JSON.stringify({ type: 'status', message: 'VLC not launched' }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
