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
    
    // Comprobar si hay información de sala
    const roomId = sessionStorage.getItem('gameRoomId');
    const isHost = sessionStorage.getItem('isHost') === 'true';
    
    if (!roomId) {
        // Si no hay información de sala, redirigir al lobby
        window.location.href = 'lobby.html';
        return;
    }
    
    // Conectar al servidor Socket.io
    const socket = io();
    
    // Referencias a los elementos del DOM
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const turnIndicator = document.getElementById('turnIndicator');
    const exitButton = document.getElementById('exitButton');
    const waitingOverlay = document.getElementById('waitingOverlay');
    const waitingMessage = document.getElementById('waitingMessage');
    const playerOneName = document.getElementById('playerOneName');
    const playerTwoName = document.getElementById('playerTwoName');
    const playerOneCardCount = document.getElementById('playerOneCardCount');
    const playerTwoCardCount = document.getElementById('playerTwoCardCount');
    const attackButtonLeft = document.getElementById('attackButtonLeft');
    const specialButtonLeft = document.getElementById('specialButtonLeft');
    const attackButtonRight = document.getElementById('attackButtonRight');
    const specialButtonRight = document.getElementById('specialButtonRight');
    
    // Variables de estado del juego
    let isMyTurn = false;
    let selectedCardId = null;
    let targetCardId = null;
    let playerOneCards = [];
    let playerTwoCards = [];
    
    // Inicializar el gestor de cartas
    const cardManager = new CardManager();
    
    // Mostrar código de sala
    roomCodeDisplay.textContent = roomId;
    
    // Configurar nombres de jugadores
    playerOneName.textContent = currentUser.username;
    
    // Cargar avatar del usuario
    const playerOneAvatar = document.querySelector('.left-player .player-avatar');
    avatarManager.applyAvatarToElement(currentUser.id, playerOneAvatar);
    
    // Escuchar cambios en el avatar (desde otras páginas)
    window.addEventListener('storage', function(event) {
        if (event.key === 'avatar_updated') {
            // Actualizar el avatar si ha cambiado
            avatarManager.applyAvatarToElement(currentUser.id, playerOneAvatar);
        }
    });
    
    // Configurar botones de acción
    attackButtonRight.style.display = 'none';
    specialButtonRight.style.display = 'none';
    
    // Desactivar botones hasta que sea nuestro turno
    attackButtonLeft.disabled = true;
    specialButtonLeft.disabled = true;
    
    // Inicializar el juego
    async function initGame() {
        try {
            // Cargar los personajes
            await cardManager.loadCharacters();
            
            // Si es el host, seleccionar cartas aleatorias y enviarlas
            if (isHost) {
                const cards = cardManager.selectRandomCards(5);
                
                // Enviar cartas seleccionadas al servidor
                socket.emit('cardsSelected', {
                    roomId: roomId,
                    cards: cards.playerOne
                });
                
                playerOneCards = cards.playerOne;
                playerOneCardCount.textContent = playerOneCards.length;
            }
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            showNotification('Error al cargar los personajes', 'error');
        }
    }
    
    // Renderizar las cartas en el tablero
    function renderCards() {
        const leftCardsArea = document.querySelector('.left-player .cards-area');
        const rightCardsArea = document.querySelector('.right-player .cards-area');
        
        // Limpiar áreas de cartas
        leftCardsArea.innerHTML = '';
        rightCardsArea.innerHTML = '';
        
        // Renderizar cartas del jugador 1 (tú)
        playerOneCards.forEach(character => {
            const card = createCardElement(character, 'player-one');
            leftCardsArea.appendChild(card);
        });
        
        // Renderizar cartas del jugador 2 (oponente)
        playerTwoCards.forEach(character => {
            const card = createCardElement(character, 'player-two');
            rightCardsArea.appendChild(card);
        });
        
        // Actualizar contadores
        playerOneCardCount.textContent = playerOneCards.length;
        playerTwoCardCount.textContent = playerTwoCards.length;
    }
    
    // Crear elemento de carta en el DOM
    function createCardElement(character, playerId) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.characterId = character.id;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="info-icon">i</div>
                <div class="info-content">${character.info || 'No hay información disponible'}</div>
                <div class="character-image">
                    <div class="type-indicator ${character.type}"></div>
                    <img src="JSON GOD OF WAR/${character.img}" alt="${character.character}">
                    <h2 class="character-name">${character.character}</h2>
                    <div class="stats-overlay">
                        <div class="stat-bar">
                            <div class="bar-container">
                                <div class="bar health-bar" style="width: ${(character.health / 1500) * 100}%">
                                    <span class="stat-value">${character.health}</span>
                                </div>
                            </div>
                        </div>
                        <div class="stat-bar">
                            <div class="bar-container">
                                <div class="bar attack-bar" style="width: ${(character.attackPower / 100) * 100}%">
                                    <span class="stat-value">${character.attackPower}</span>
                                </div>
                            </div>
                        </div>
                        <div class="stat-bar">
                            <div class="bar-container">
                                <div class="bar special-bar" style="width: ${(character.specialAbility.value / 200) * 100}%">
                                    <span class="stat-value">${character.specialAbility.value}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-frame"></div>
        `;
        
        // Añadir evento de clic para seleccionar la carta
        card.addEventListener('click', () => {
            if (playerId === 'player-one' && isMyTurn) {
                // Seleccionar carta propia para atacar
                selectCard(character, playerId);
                selectedCardId = character.id;
                targetCardId = null;
            } else if (playerId === 'player-two' && isMyTurn && selectedCardId) {
                // Seleccionar carta del oponente como objetivo
                selectTarget(character, playerId);
                targetCardId = character.id;
            }
        });
        
        return card;
    }
    
    // Seleccionar una carta propia
    function selectCard(character, playerId) {
        // Deseleccionar todas las cartas
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
            card.classList.remove('target');
        });
        
        // Seleccionar la carta actual
        const selectedCard = document.querySelector(`.${playerId} .card[data-character-id="${character.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            
            // Habilitar botones de acción
            attackButtonLeft.disabled = false;
            specialButtonLeft.disabled = false;
            
            showNotification('Selecciona una carta del oponente como objetivo', 'info');
        }
    }
    
    // Seleccionar una carta del oponente como objetivo
    function selectTarget(character, playerId) {
        // Deseleccionar objetivos anteriores
        document.querySelectorAll('.target').forEach(card => {
            card.classList.remove('target');
        });
        
        // Seleccionar el objetivo actual
        const targetCard = document.querySelector(`.${playerId} .card[data-character-id="${character.id}"]`);
        if (targetCard) {
            targetCard.classList.add('target');
            
            showNotification('Objetivo seleccionado. Usa ataque o habilidad especial', 'info');
        }
    }
    
    // Realizar un ataque
    function attack() {
        if (!isMyTurn || !selectedCardId || !targetCardId) {
            showNotification('Selecciona una carta para atacar y un objetivo', 'error');
            return;
        }
        
        // Enviar acción de ataque al servidor
        socket.emit('attackAction', {
            roomId: roomId,
            characterId: selectedCardId,
            targetId: targetCardId
        });
        
        // Mostrar efecto de ataque
        showAttackEffect('left');
        
        // Aplicar ataque localmente
        const attacker = playerOneCards.find(card => card.id === selectedCardId);
        const defender = playerTwoCards.find(card => card.id === targetCardId);
        
        if (attacker && defender) {
            // Calcular daño
            const damage = attacker.attackPower;
            
            // Aplicar daño
            defender.health -= damage;
            
            // Comprobar si la carta ha sido derrotada
            if (defender.health <= 0) {
                playerTwoCards = playerTwoCards.filter(card => card.id !== defender.id);
                
                // Comprobar condición de victoria
                checkWinCondition();
            }
            
            // Actualizar estado del juego
            socket.emit('gameStateUpdate', {
                roomId: roomId,
                gameState: {
                    playerTwoCards: playerTwoCards
                }
            });
            
            // Actualizar visualización
            renderCards();
            
            // Desactivar botones y selecciones
            resetSelections();
        }
    }
    
    // Usar habilidad especial
    function useSpecialAbility() {
        if (!isMyTurn || !selectedCardId || !targetCardId) {
            showNotification('Selecciona una carta para usar habilidad y un objetivo', 'error');
            return;
        }
        
        // Enviar acción de habilidad especial al servidor
        socket.emit('specialAction', {
            roomId: roomId,
            characterId: selectedCardId,
            targetId: targetCardId
        });
        
        // Mostrar efecto de habilidad especial
        showSpecialEffect('left');
        
        // Aplicar habilidad localmente
        const character = playerOneCards.find(card => card.id === selectedCardId);
        
        if (character) {
            // Aplicar efecto según el tipo de habilidad
            if (character.specialAbility.type === 'attack') {
                // Atacar con la habilidad especial
                const defender = playerTwoCards.find(card => card.id === targetCardId);
                
                if (defender) {
                    // Calcular daño
                    const damage = character.specialAbility.value;
                    
                    // Aplicar daño
                    defender.health -= damage;
                    
                    // Comprobar si la carta ha sido derrotada
                    if (defender.health <= 0) {
                        playerTwoCards = playerTwoCards.filter(card => card.id !== defender.id);
                        
                        // Comprobar condición de victoria
                        checkWinCondition();
                    }
                    
                    // Actualizar estado del juego
                    socket.emit('gameStateUpdate', {
                        roomId: roomId,
                        gameState: {
                            playerTwoCards: playerTwoCards
                        }
                    });
                }
            } else if (character.specialAbility.type === 'defense') {
                // Aumentar la salud con la habilidad defensiva
                character.health += Math.floor(character.specialAbility.value / 2);
                
                // Limitar la salud al máximo original
                const originalCharacter = cardManager.characters.find(c => c.id === character.id);
                if (originalCharacter && character.health > originalCharacter.health) {
                    character.health = originalCharacter.health;
                }
                
                // Actualizar estado del juego
                socket.emit('gameStateUpdate', {
                    roomId: roomId,
                    gameState: {
                        playerOneCards: playerOneCards
                    }
                });
            }
            
            // Actualizar visualización
            renderCards();
            
            // Desactivar botones y selecciones
            resetSelections();
        }
    }
    
    // Resetear selecciones después de una acción
    function resetSelections() {
        selectedCardId = null;
        targetCardId = null;
        
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
            card.classList.remove('target');
        });
        
        attackButtonLeft.disabled = true;
        specialButtonLeft.disabled = true;
        
        isMyTurn = false;
        updateTurnIndicator();
    }
    
    // Comprobar si hay un ganador
    function checkWinCondition() {
        if (playerTwoCards.length === 0) {
            // Has ganado
            socket.emit('gameOver', {
                roomId: roomId,
                winner: currentUser.username
            });
            
            showNotification('¡Has ganado la partida!', 'success');
            
            // Actualizar estadísticas
            userManager.updateStats(true);
            
            // Mostrar mensaje de victoria
            setTimeout(() => {
                alert('¡Has ganado la partida!');
                window.location.href = 'lobby.html';
            }, 1000);
        }
    }
    
    // Actualizar indicador de turno
    function updateTurnIndicator() {
        if (isMyTurn) {
            turnIndicator.textContent = 'El teu torn';
            turnIndicator.classList.add('your-turn');
        } else {
            turnIndicator.textContent = 'Torn del rival';
            turnIndicator.classList.remove('your-turn');
        }
    }
    
    // Función para mostrar efecto de ataque
    function showAttackEffect(side) {
        const button = side === 'left' ? attackButtonLeft : attackButtonRight;
        button.classList.add('active');
        
        // Efecto visual en el botón
        button.style.transform = 'scale(1.2)';
        button.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
        
        // Restaurar después de la animación
        setTimeout(() => {
            button.classList.remove('active');
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 500);
    }
    
    // Función para mostrar efecto de habilidad especial
    function showSpecialEffect(side) {
        const button = side === 'left' ? specialButtonLeft : specialButtonRight;
        button.classList.add('active');
        
        // Efecto visual en el botón
        button.style.transform = 'scale(1.2)';
        button.style.boxShadow = '0 0 20px rgba(128, 0, 128, 0.8)';
        
        // Restaurar después de la animación
        setTimeout(() => {
            button.classList.remove('active');
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 800);
    }
    
    // Función para mostrar mensajes
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
    
    // Eventos de los botones
    attackButtonLeft.addEventListener('click', attack);
    specialButtonLeft.addEventListener('click', useSpecialAbility);
    
    // Salir del juego
    exitButton.addEventListener('click', function() {
        if (confirm('Segur que vols sortir de la partida? Es comptarà com a derrota.')) {
            // Enviar evento de desconexión
            socket.emit('leaveGame', roomId);
            
            // Actualizar estadísticas como derrota
            userManager.updateStats(false);
            
            // Redirigir al menú principal
            window.location.href = 'menu.html';
        }
    });
    
    // Eventos del socket
    
    // Juego iniciado
    socket.on('gameStarted', (data) => {
        waitingMessage.textContent = `Seleccionant cartes aleatòries...`;
        
        // Mantener el overlay visible hasta que ambos jugadores hayan seleccionado sus cartas
        // El overlay se ocultará cuando se reciba el evento 'allCardsSelected'
        
        // Determinar si es nuestro turno
        isMyTurn = data.firstPlayer === currentUser.username;
        updateTurnIndicator();
    });
    
    // Todas las cartas seleccionadas
    socket.on('allCardsSelected', (data) => {
        // Guardar cartas
        if (isHost) {
            playerOneCards = data.playerOneCards;
            playerTwoCards = data.playerTwoCards;
        } else {
            playerOneCards = data.playerTwoCards;
            playerTwoCards = data.playerOneCards;
        }
        
        // Actualizar nombre del jugador 2
        if (isHost) {
            playerTwoName.textContent = 'Oponent';
        } else {
            playerTwoName.textContent = 'Oponent';
        }
        
        // Renderizar cartas
        renderCards();
        
        // Mostrar mensaje de quién comienza
        const firstPlayerName = isMyTurn ? 'Tu' : 'L\'oponent';
        showNotification(`Partida iniciada! Comença ${firstPlayerName}`, 'success');
        
        // Ocultar overlay después de un breve retraso
        setTimeout(() => {
            waitingOverlay.style.display = 'none';
        }, 1500);
    });
    
    // Recibir ataque
    socket.on('attackReceived', (data) => {
        // Mostrar efecto de ataque en el lado del oponente
        showAttackEffect('right');
        
        // Aplicar ataque localmente
        const attacker = playerTwoCards.find(card => card.id === data.characterId);
        const defender = playerOneCards.find(card => card.id === data.targetId);
        
        if (attacker && defender) {
            // Calcular daño
            const damage = attacker.attackPower;
            
            // Aplicar daño
            defender.health -= damage;
            
            // Comprobar si la carta ha sido derrotada
            if (defender.health <= 0) {
                playerOneCards = playerOneCards.filter(card => card.id !== defender.id);
                
                // Comprobar condición de derrota
                if (playerOneCards.length === 0) {
                    // Has perdido
                    showNotification('Has perdut la partida', 'error');
                    
                    // Actualizar estadísticas
                    userManager.updateStats(false);
                    
                    // Mostrar mensaje de derrota
                    setTimeout(() => {
                        alert('Has perdut la partida');
                        window.location.href = 'lobby.html';
                    }, 1000);
                }
            }
            
            // Actualizar visualización
            renderCards();
        }
        
        // Ahora es tu turno
        isMyTurn = true;
        updateTurnIndicator();
    });
    
    // Recibir habilidad especial
    socket.on('specialReceived', (data) => {
        // Mostrar efecto de habilidad especial en el lado del oponente
        showSpecialEffect('right');
        
        // Aplicar habilidad localmente
        const character = playerTwoCards.find(card => card.id === data.characterId);
        
        if (character) {
            // Aplicar efecto según el tipo de habilidad
            if (character.specialAbility.type === 'attack') {
                // Atacar con la habilidad especial
                const defender = playerOneCards.find(card => card.id === data.targetId);
                
                if (defender) {
                    // Calcular daño
                    const damage = character.specialAbility.value;
                    
                    // Aplicar daño
                    defender.health -= damage;
                    
                    // Comprobar si la carta ha sido derrotada
                    if (defender.health <= 0) {
                        playerOneCards = playerOneCards.filter(card => card.id !== defender.id);
                        
                        // Comprobar condición de derrota
                        if (playerOneCards.length === 0) {
                            // Has perdido
                            showNotification('Has perdut la partida', 'error');
                            
                            // Actualizar estadísticas
                            userManager.updateStats(false);
                            
                            // Mostrar mensaje de derrota
                            setTimeout(() => {
                                alert('Has perdut la partida');
                                window.location.href = 'lobby.html';
                            }, 1000);
                        }
                    }
                }
            } else if (character.specialAbility.type === 'defense') {
                // Aumentar la salud con la habilidad defensiva
                character.health += Math.floor(character.specialAbility.value / 2);
                
                // Limitar la salud al máximo original
                const originalCharacter = cardManager.characters.find(c => c.id === character.id);
                if (originalCharacter && character.health > originalCharacter.health) {
                    character.health = originalCharacter.health;
                }
            }
            
            // Actualizar visualización
            renderCards();
        }
        
        // Ahora es tu turno
        isMyTurn = true;
        updateTurnIndicator();
    });
    
    // Actualización del estado del juego
    socket.on('gameStateUpdated', (gameState) => {
        // Actualizar estado del juego
        if (gameState.playerOneCards) {
            playerTwoCards = gameState.playerOneCards;
        }
        
        if (gameState.playerTwoCards) {
            playerOneCards = gameState.playerTwoCards;
        }
        
        // Actualizar visualización
        renderCards();
    });
    
    // Cambio de turno
    socket.on('turnChanged', (data) => {
        // Comprobar si es nuestro turno
        const otherPlayerId = data.currentTurn;
        isMyTurn = socket.id === otherPlayerId;
        
        updateTurnIndicator();
    });
    
    // Fin del juego
    socket.on('gameEnded', (data) => {
        const isWinner = data.winner === currentUser.username;
        
        if (isWinner) {
            showNotification('¡Has ganado la partida!', 'success');
            userManager.updateStats(true);
        } else {
            showNotification('Has perdido la partida', 'error');
            userManager.updateStats(false);
        }
        
        // Redirigir al lobby después de un breve retraso
        setTimeout(() => {
            window.location.href = 'lobby.html';
        }, 3000);
    });
    
    // Jugador desconectado
    socket.on('playerDisconnected', (data) => {
        showNotification(`${data.username} s'ha desconnectat. Has guanyat la partida!`, 'info');
        
        // Actualizar estadísticas como victoria
        userManager.updateStats(true);
        
        // Redirigir al lobby después de un breve retraso
        setTimeout(() => {
            window.location.href = 'lobby.html';
        }, 3000);
    });
    
    // Error en acción
    socket.on('actionError', (message) => {
        showNotification(message, 'error');
    });
    
    // Iniciar el juego
    initGame();
});
