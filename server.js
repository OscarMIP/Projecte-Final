const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos desde el directorio actual
app.use(express.static(__dirname));

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Almacenar información de las salas de juego
const gameRooms = {};

// Manejar conexiones de socket
io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    // Crear una nueva sala de juego
    socket.on('createRoom', (username) => {
        const roomId = generateRoomId();
        
        // Unir al usuario a la sala
        socket.join(roomId);
        
        // Almacenar información de la sala
        gameRooms[roomId] = {
            id: roomId,
            players: [{
                id: socket.id,
                username: username,
                isHost: true
            }],
            gameState: {
                started: false,
                playerOneCards: [],
                playerTwoCards: [],
                currentTurn: null
            }
        };
        
        // Enviar ID de la sala al creador
        socket.emit('roomCreated', {
            roomId: roomId,
            isHost: true
        });
        
        console.log(`Sala creada: ${roomId} por ${username}`);
    });
    
    // Unirse a una sala existente
    socket.on('joinRoom', (data) => {
        const { roomId, username } = data;
        
        // Verificar si la sala existe
        if (!gameRooms[roomId]) {
            socket.emit('joinError', 'La sala no existe');
            return;
        }
        
        // Verificar si la sala ya está llena
        if (gameRooms[roomId].players.length >= 2) {
            socket.emit('joinError', 'La sala está llena');
            return;
        }
        
        // Unir al usuario a la sala
        socket.join(roomId);
        
        // Añadir jugador a la sala
        gameRooms[roomId].players.push({
            id: socket.id,
            username: username,
            isHost: false
        });
        
        // Enviar confirmación al jugador
        socket.emit('roomJoined', {
            roomId: roomId,
            isHost: false
        });
        
        // Notificar al host que un jugador se ha unido
        const hostId = gameRooms[roomId].players.find(p => p.isHost).id;
        io.to(hostId).emit('playerJoined', {
            username: username
        });
        
        console.log(`${username} se unió a la sala ${roomId}`);
        
        // Si ahora hay 2 jugadores, la sala está lista para empezar
        if (gameRooms[roomId].players.length === 2) {
            io.to(roomId).emit('roomReady');
        }
    });
    
    // Iniciar el juego
    socket.on('startGame', (roomId) => {
        if (!gameRooms[roomId]) return;
        
        // Marcar el juego como en fase de selección de cartas
        gameRooms[roomId].gameState.started = true;
        gameRooms[roomId].gameState.cardsSelected = false;
        gameRooms[roomId].gameState.playerOneCardsReady = false;
        gameRooms[roomId].gameState.playerTwoCardsReady = false;
        
        // Determinar aleatoriamente quién comienza
        const firstPlayerIndex = Math.random() < 0.5 ? 0 : 1;
        gameRooms[roomId].gameState.currentTurn = gameRooms[roomId].players[firstPlayerIndex].id;
        
        // Enviar evento de inicio a todos los jugadores en la sala
        io.to(roomId).emit('gameStarted', {
            firstPlayer: gameRooms[roomId].players[firstPlayerIndex].username
        });
        
        console.log(`Juego iniciado en sala ${roomId}`);
    });
    
    // Recibir cartas seleccionadas
    socket.on('cardsSelected', (data) => {
        const { roomId, cards } = data;
        
        if (!gameRooms[roomId]) return;
        
        // Determinar si es el jugador 1 o 2
        const playerIndex = gameRooms[roomId].players.findIndex(p => p.id === socket.id);
        
        if (playerIndex === 0) {
            gameRooms[roomId].gameState.playerOneCards = cards;
            gameRooms[roomId].gameState.playerOneCardsReady = true;
            console.log(`Jugador 1 ha seleccionado sus cartas en sala ${roomId}`);
        } else {
            gameRooms[roomId].gameState.playerTwoCards = cards;
            gameRooms[roomId].gameState.playerTwoCardsReady = true;
            console.log(`Jugador 2 ha seleccionado sus cartas en sala ${roomId}`);
        }
        
        // Comprobar si ambos jugadores han seleccionado sus cartas
        if (gameRooms[roomId].gameState.playerOneCardsReady && 
            gameRooms[roomId].gameState.playerTwoCardsReady) {
            
            // Marcar que las cartas ya están seleccionadas
            gameRooms[roomId].gameState.cardsSelected = true;
            
            // Enviar todas las cartas a ambos jugadores
            io.to(roomId).emit('allCardsSelected', {
                playerOneCards: gameRooms[roomId].gameState.playerOneCards,
                playerTwoCards: gameRooms[roomId].gameState.playerTwoCards
            });
            
            console.log(`Ambos jugadores han seleccionado sus cartas en sala ${roomId}`);
        }
    });
    
    // Manejar acción de ataque
    socket.on('attackAction', (data) => {
        const { roomId, characterId, targetId } = data;
        
        if (!gameRooms[roomId]) return;
        
        // Verificar si es el turno del jugador
        if (gameRooms[roomId].gameState.currentTurn !== socket.id) {
            socket.emit('actionError', 'No es tu turno');
            return;
        }
        
        // Enviar la acción al otro jugador
        const otherPlayerId = gameRooms[roomId].players.find(p => p.id !== socket.id).id;
        io.to(otherPlayerId).emit('attackReceived', {
            characterId,
            targetId
        });
        
        // Cambiar el turno
        gameRooms[roomId].gameState.currentTurn = otherPlayerId;
        
        // Notificar cambio de turno
        io.to(roomId).emit('turnChanged', {
            currentTurn: otherPlayerId
        });
    });
    
    // Manejar acción de habilidad especial
    socket.on('specialAction', (data) => {
        const { roomId, characterId, targetId } = data;
        
        if (!gameRooms[roomId]) return;
        
        // Verificar si es el turno del jugador
        if (gameRooms[roomId].gameState.currentTurn !== socket.id) {
            socket.emit('actionError', 'No es tu turno');
            return;
        }
        
        // Enviar la acción al otro jugador
        const otherPlayerId = gameRooms[roomId].players.find(p => p.id !== socket.id).id;
        io.to(otherPlayerId).emit('specialReceived', {
            characterId,
            targetId
        });
        
        // Cambiar el turno
        gameRooms[roomId].gameState.currentTurn = otherPlayerId;
        
        // Notificar cambio de turno
        io.to(roomId).emit('turnChanged', {
            currentTurn: otherPlayerId
        });
    });
    
    // Manejar actualización del estado del juego
    socket.on('gameStateUpdate', (data) => {
        const { roomId, gameState } = data;
        
        if (!gameRooms[roomId]) return;
        
        // Actualizar estado del juego
        gameRooms[roomId].gameState = {
            ...gameRooms[roomId].gameState,
            ...gameState
        };
        
        // Enviar actualización al otro jugador
        const otherPlayerId = gameRooms[roomId].players.find(p => p.id !== socket.id).id;
        io.to(otherPlayerId).emit('gameStateUpdated', gameState);
    });
    
    // Manejar fin del juego
    socket.on('gameOver', (data) => {
        const { roomId, winner } = data;
        
        if (!gameRooms[roomId]) return;
        
        // Notificar a todos los jugadores
        io.to(roomId).emit('gameEnded', {
            winner: winner
        });
        
        console.log(`Juego terminado en sala ${roomId}. Ganador: ${winner}`);
        
        // Limpiar la sala después de un tiempo
        setTimeout(() => {
            delete gameRooms[roomId];
        }, 60000); // Eliminar después de 1 minuto
    });
    
    // Manejar desconexión
    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        
        // Buscar salas donde el usuario estaba
        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                // Notificar a los demás jugadores
                socket.to(roomId).emit('playerDisconnected', {
                    username: room.players[playerIndex].username
                });
                
                console.log(`${room.players[playerIndex].username} se desconectó de la sala ${roomId}`);
                
                // Eliminar la sala si el juego no ha comenzado
                if (!room.gameState.started) {
                    delete gameRooms[roomId];
                    console.log(`Sala ${roomId} eliminada`);
                }
            }
        }
    });
});

// Generar ID aleatorio para la sala
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
    console.log('Para jugar desde otro portátil, conéctate a la IP de este equipo en el puerto', PORT);
});
