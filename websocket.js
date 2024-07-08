const WebSocket = require('ws');
const { checkOrderRequest, checkRestaurantRequest } = require("./webSockets/sockets");
let wss;

function initializeWebSocketServer(server) {
    wss = new WebSocket.Server({ server })
    wss.on('connection', (ws) => {
        console.log('A user connected');
        ws.send('Successfully connected to server');
    })
    //WEBSOCKET FUNCTIONS -> STARTS
    checkOrderRequest(wss);
    checkRestaurantRequest(wss);
    //WEBSOCKET FUNCTIONS -> ENDS
    return wss;
}

function getWebSocketServer() {
    if (!wss) {
        throw new Error('WebSocker server not initialized')
    }
    return wss
}

module.exports = {
    initializeWebSocketServer,
    getWebSocketServer,
};