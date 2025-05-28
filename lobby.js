document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = new UserManager();
    
    // Inicializar el gestor de avatares
    const avatarManager = new AvatarManager();
    
    // Comprobar si hay un usuario con sesión iniciada
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
        // Si no hay sesión iniciada, redirigir a la página de autenticación
        window.location.href = 'auth.html';
        return;
    }
    
    // Conectar al servidor Socket.io
    const socket = io();
    
    // Variables para almacenar información de la sala
    let currentRoomId = null;
    let isHost = false;
    
    // Referencias a los elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const createRoomButton = document.getElementById('createRoomButton');
    const joinRoomButton = document.getElementById('joinRoomButton');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const copyCodeButton = document.getElementById('copyCodeButton');
    const startGameButton = document.getElementById('startGameButton');
    const roomCreatedInfo = document.getElementById('roomCreatedInfo');
    const roomJoinedInfo = document.getElementById('roomJoinedInfo');
    const hostPlayerName = document.getElementById('hostPlayerName');
    const guestPlayerName = document.getElementById('guestPlayerName');
    const guestPlayerItem = document.getElementById('guestPlayerItem');
    const hostPlayerItem = document.getElementById('hostPlayerItem');
    
    // Cambiar entre pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Activar la pestaña seleccionada
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}Panel`).classList.add('active');
        });
    });
    
    // Crear una sala
    createRoomButton.addEventListener('click', function() {
        socket.emit('createRoom', currentUser.username);
        hostPlayerName.textContent = currentUser.username;
        
        // Mostrar avatar del usuario en el host
        const hostAvatar = hostPlayerItem.querySelector('.player-avatar');
        const success = avatarManager.applyAvatarToElement(currentUser.id, hostAvatar);
        console.log('Avatar aplicado al host:', success);
        
        // Asegurarse de que el avatar se muestre correctamente
        hostAvatar.style.backgroundSize = 'cover';
        hostAvatar.style.backgroundPosition = 'center';
        hostAvatar.style.borderRadius = '50%';
    });
    
    // Unirse a una sala
    joinRoomButton.addEventListener('click', function() {
        const roomId = roomCodeInput.value.trim();
        
        if (!roomId) {
            showNotification('Si us plau, introdueix un codi de sala vàlid', 'error');
            return;
        }
        
        socket.emit('joinRoom', {
            roomId: roomId,
            username: currentUser.username
        });
        
        guestPlayerName.textContent = currentUser.username;
        
        // Mostrar avatar del usuario en el guest
        const guestAvatar = guestPlayerItem.querySelector('.player-avatar');
        const success = avatarManager.applyAvatarToElement(currentUser.id, guestAvatar);
        console.log('Avatar aplicado al guest:', success);
        
        // Asegurarse de que el avatar se muestre correctamente
        guestAvatar.style.backgroundSize = 'cover';
        guestAvatar.style.backgroundPosition = 'center';
        guestAvatar.style.borderRadius = '50%';
    });
    
    // Copiar código de sala
    copyCodeButton.addEventListener('click', function() {
        navigator.clipboard.writeText(roomCodeDisplay.textContent)
            .then(() => {
                showNotification('Codi copiat al portapapers!', 'success');
            })
            .catch(err => {
                console.error('Error al copiar: ', err);
                showNotification('Error al copiar el codi', 'error');
            });
    });
    
    // Iniciar juego
    startGameButton.addEventListener('click', function() {
        if (currentRoomId) {
            socket.emit('startGame', currentRoomId);
        }
    });
    
    // Eventos del socket
    
    // Sala creada
    socket.on('roomCreated', (data) => {
        currentRoomId = data.roomId;
        isHost = data.isHost;
        
        roomCodeDisplay.textContent = currentRoomId;
        roomCreatedInfo.style.display = 'block';
        createRoomButton.style.display = 'none';
        
        showNotification('Sala creada correctament!', 'success');
    });
    
    // Error al unirse a una sala
    socket.on('joinError', (message) => {
        showNotification(message, 'error');
    });
    
    // Unido a una sala
    socket.on('roomJoined', (data) => {
        currentRoomId = data.roomId;
        isHost = data.isHost;
        
        roomJoinedInfo.style.display = 'block';
        joinRoomButton.style.display = 'none';
        roomCodeInput.disabled = true;
        
        showNotification('T\'has unit a la sala correctament!', 'success');
    });
    
    // Jugador se unió a la sala
    socket.on('playerJoined', (data) => {
        guestPlayerItem.classList.remove('waiting');
        guestPlayerItem.querySelector('.player-name').textContent = data.username;
        
        startGameButton.disabled = false;
        
        showNotification(`${data.username} s'ha unit a la partida!`, 'info');
    });
    
    // Sala lista para empezar
    socket.on('roomReady', () => {
        if (isHost) {
            showNotification('La sala està llesta per començar!', 'info');
        }
    });
    
    // Juego iniciado
    socket.on('gameStarted', (data) => {
        showNotification(`Partida iniciada! Comença ${data.firstPlayer}`, 'success');
        
        // Guardar información de la sala en sessionStorage para la página del juego
        sessionStorage.setItem('gameRoomId', currentRoomId);
        sessionStorage.setItem('isHost', isHost);
        
        // Redirigir a la página del juego después de un breve retraso
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1500);
    });
    
    // Jugador desconectado
    socket.on('playerDisconnected', (data) => {
        showNotification(`${data.username} s'ha desconnectat`, 'error');
        
        if (isHost) {
            guestPlayerItem.classList.add('waiting');
            guestPlayerItem.querySelector('.player-name').textContent = 'Esperant jugador...';
            startGameButton.disabled = true;
        } else {
            hostPlayerItem.querySelector('.player-name').textContent = 'Amfitrió desconnectat';
        }
    });
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Mostrar con animación
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});
