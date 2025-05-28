document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = window.UserManager ? new UserManager() : null;
    
    // Inicializar el gestor de avatares
    const avatarManager = window.AvatarManager ? new AvatarManager() : null;
    
    // Comprobar si hay un usuario con sesión iniciada
    let currentUser = null;
    if (userManager) {
        currentUser = userManager.getCurrentUser();
        if (!currentUser) {
            // Si no hay sesión iniciada, redirigir a la página de autenticación
            window.location.href = 'landing.html';
            return;
        }
    } else {
        console.warn('UserManager no está disponible. Continuando en modo anónimo.');
    }
    
    // Variables para el juego local
    let secondPlayer = null;
    let currentTurn = null;
    let gameStarted = false;
    let selectedCard = null;
    let selectedCardPlayer = null;
    let specialUsed = {
        'player-one': {},
        'player-two': {}
    };
    let waitingForTarget = false; // Variable para controlar si estamos esperando selección de objetivo
    let currentAction = null; // 'attack' o 'special'
    
    // Inicializar el gestor de cartas
    const cardManager = new CardManager();
    
    // Elementos del DOM
    const waitingOverlay = document.getElementById('waitingOverlay');
    const waitingMessage = document.getElementById('waitingMessage');
    const joinButton = document.getElementById('joinButton');
    const loginOptions = document.getElementById('loginOptions');
    const guestButton = document.getElementById('guestButton');
    const loginButton = document.getElementById('loginButton');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const submitLoginButton = document.getElementById('submitLoginButton');
    const spinner = document.getElementById('spinner');
    const turnIndicator = document.getElementById('turnIndicator');
    const exitButton = document.getElementById('exitButton');
    
    // Botones de juego
    const attackButtonLeft = document.getElementById('attackButtonLeft');
    const specialButtonLeft = document.getElementById('specialButtonLeft');
    const attackButtonRight = document.getElementById('attackButtonRight');
    const specialButtonRight = document.getElementById('specialButtonRight');
    
    // Verificar que todos los elementos existen
    if (!waitingOverlay || !waitingMessage || !joinButton || !loginOptions || 
        !guestButton || !loginButton || !loginForm || !usernameInput || 
        !passwordInput || !submitLoginButton || !spinner || !turnIndicator || 
        !exitButton || !attackButtonLeft || !specialButtonLeft || 
        !attackButtonRight || !specialButtonRight) {
        console.error('No se encontraron todos los elementos necesarios');
    }
    
    // Cargar avatar del usuario anfitrión
    const playerOneAvatar = document.querySelector('.left-player .player-avatar');
    if (avatarManager && currentUser) {
        avatarManager.applyAvatarToElement(currentUser.id, playerOneAvatar);
    } else if (playerOneAvatar) {
        // Establecer un avatar por defecto si no hay gestor de avatares
        playerOneAvatar.style.backgroundImage = "url('JSON GOD OF WAR/characters_images/kratos.webp')";
        playerOneAvatar.style.backgroundSize = 'cover';
        playerOneAvatar.style.backgroundPosition = 'center';
    }
    
    // Actualizar nombre del jugador anfitrión
    const playerOneName = document.querySelector('.left-player .player-name');
    if (playerOneName && currentUser && currentUser.username) {
        playerOneName.textContent = currentUser.username;
    }
    
    // Eventos para los botones de unirse
    joinButton.addEventListener('click', function() {
        document.querySelector('.player-join-area').style.display = 'none';
        loginOptions.style.display = 'flex';
    });
    
    // Botón para jugar como invitado
    guestButton.addEventListener('click', function() {
        // Iniciar como invitado
        secondPlayer = {
            username: 'Invitado',
            id: 'guest-' + Date.now(),
            isGuest: true
        };
        
        // Ocultar opciones de login
        loginOptions.style.display = 'none';
        // Mostrar mensaje de espera
        waitingMessage.textContent = 'Preparando partida...';
        spinner.style.display = 'block';
        
        // Pequeño retraso para mostrar el spinner
        setTimeout(() => {
            startGame();
        }, 1000);
    });
    
    // Botón para iniciar sesión
    loginButton.addEventListener('click', function() {
        loginOptions.style.display = 'none';
        loginForm.style.display = 'flex';
    });
    
    // Botón para cancelar login
    document.getElementById('cancelLoginButton').addEventListener('click', function() {
        loginOptions.style.display = 'none';
        document.querySelector('.player-join-area').style.display = 'block';
    });
    
    // Botón para volver a las opciones desde el formulario
    document.getElementById('backToOptionsButton').addEventListener('click', function() {
        loginForm.style.display = 'none';
        loginOptions.style.display = 'flex';
    });
    
    // Botón para enviar formulario de login
    submitLoginButton.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            showNotification('Por favor, introduce usuario y contraseña', 'error');
            return;
        }
        
        // Verificar que no sea el mismo usuario que el anfitrión
        if (currentUser && username === currentUser.username) {
            showNotification('No puedes iniciar sesión con el mismo usuario', 'error');
            return;
        }
        
        loginForm.style.display = 'none';
        spinner.style.display = 'block';
        waitingMessage.style.display = 'block';
        waitingMessage.textContent = 'Iniciando sesión...';
        
        // Intentar iniciar sesión
        if (userManager) {
            userManager.login(username, password, function(success, user) {
                if (success) {
                    secondPlayer = user;
                    waitingMessage.textContent = 'Preparando partida...';
                    setTimeout(() => {
                        startGame();
                    }, 1000);
                } else {
                    showNotification('Usuario o contraseña incorrectos', 'error');
                    loginForm.style.display = 'flex';
                    spinner.style.display = 'none';
                    waitingMessage.textContent = 'Esperant al segon jugador...';
                }
            });
        } else {
            // Modo de prueba si no hay userManager
            secondPlayer = {
                username: username,
                id: 'user-' + Date.now()
            };
            waitingMessage.textContent = 'Preparando partida...';
            setTimeout(() => {
                startGame();
            }, 1000);
        }
    });
    
    // Iniciar el juego cuando el segundo jugador se une
    function startGame() {
        // Actualizar nombre del segundo jugador
        const playerTwoName = document.querySelector('.right-player .player-name');
        if (playerTwoName && secondPlayer) {
            playerTwoName.textContent = secondPlayer.username;
        }
        
        // Cargar avatar del segundo jugador
        const playerTwoAvatar = document.querySelector('.right-player .player-avatar-right');
        if (avatarManager && secondPlayer && !secondPlayer.isGuest) {
            avatarManager.applyAvatarToElement(secondPlayer.id, playerTwoAvatar);
        } else if (playerTwoAvatar) {
            // Avatar por defecto para el segundo jugador
            playerTwoAvatar.style.backgroundImage = "url('JSON GOD OF WAR/characters_images/atreus.webp')";
            playerTwoAvatar.style.backgroundSize = 'cover';
            playerTwoAvatar.style.backgroundPosition = 'center';
        }
        
        // Ocultar elementos de login
        document.getElementById('waitingMessage').style.display = 'none';
        document.getElementById('joinButton').style.display = 'none';
        document.getElementById('loginOptions').style.display = 'none';
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('spinner').style.display = 'none';
        
        // Determinar aleatoriamente quién empieza
        currentTurn = Math.random() < 0.5 ? 'player-one' : 'player-two';
        
        // Mostrar anuncio de turno inicial
        const turnAnnouncement = document.getElementById('turnAnnouncement');
        const firstPlayerTurn = document.getElementById('firstPlayerTurn');
        
        if (turnAnnouncement && firstPlayerTurn) {
            // Mostrar quién empieza
            if (currentTurn === 'player-one') {
                firstPlayerTurn.textContent = 'Empieza el Jugador 1';
            } else {
                firstPlayerTurn.textContent = 'Empieza el Jugador 2';
            }
            
            // Mostrar el anuncio
            turnAnnouncement.style.display = 'flex';
            
            // Añadir evento al botón de comenzar
            document.getElementById('startGameButton').addEventListener('click', function() {
                // Ocultar overlay completamente
                waitingOverlay.style.display = 'none';
                
                // Inicializar el juego
                initGame();
            });
        } else {
            // Si no existe el anuncio, iniciar directamente
            waitingOverlay.style.display = 'none';
            initGame();
        }
    }
    
    // Función para inicializar el juego
    async function initGame() {
        try {
            // Cargar los personajes
            await cardManager.loadCharacters();
            
            // Verificar si se cargaron los personajes correctamente
            if (cardManager.characters.length === 0) {
                console.error('No se pudieron cargar los personajes');
                return;
            }
            
            // Guardar los valores originales de las cartas para poder restablecerlos después
            cardManager.characters.forEach(character => {
                character.originalHealth = character.health;
                character.originalAttackPower = character.attackPower;
                character.originalSpecialAbility = { ...character.specialAbility };
            });
            
            // Seleccionar cartas aleatorias para cada jugador
            cardManager.selectRandomCards();
            
            // Renderizar las cartas en el tablero
            cardManager.renderCards();
            
            // Añadir controles de scroll a las áreas de cartas
            addScrollControls();
            
            // Actualizar indicador de turno
            updateTurnIndicator();
            
            // Añadir eventos a las cartas
            addCardEvents();
            
            // Añadir eventos a los botones de ataque y especial
            addButtonEvents();
            
            // Marcar el juego como iniciado
            gameStarted = true;
            
            // Mostrar instrucciones claras
            const playerName = currentTurn === 'player-one' ? 'Jugador 1' : 'Jugador 2';
            showMessage(`\u00a1La partida ha comenzado! Turno del ${playerName}`, 3000);
            
            setTimeout(() => {
                showMessage(`${playerName}: Selecciona una de tus cartas para jugar`, 3000);
            }, 3500);
            
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            showNotification('Error al inicializar el juego', 'error');
        }
    }
    
    // Función para añadir eventos a las cartas
    function addCardEvents() {
        // Eventos para todas las cartas
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', function() {
                // Si el juego no ha comenzado, no hacer nada
                if (!gameStarted) return;
                
                // Obtener el ID de la carta y determinar a qué jugador pertenece
                const cardId = parseInt(this.getAttribute('data-id'));
                const isLeftSide = this.closest('.player-area').classList.contains('left-player');
                const cardPlayer = isLeftSide ? 'player-one' : 'player-two';
                
                // Obtener la carta del array correspondiente
                const character = isLeftSide 
                    ? cardManager.playerOneCards.find(c => c.id === cardId)
                    : cardManager.playerTwoCards.find(c => c.id === cardId);
                
                if (!character) return;
                
                // Si estamos esperando un objetivo para atacar
                if (waitingForTarget) {
                    // Solo permitir seleccionar cartas del oponente
                    if (cardPlayer === currentTurn) {
                        showMessage('No puedes atacar a tus propias cartas', 2000);
                        return;
                    }
                    
                    // Ejecutar la acción correspondiente
                    if (currentAction === 'attack') {
                        // Realizar ataque
                        performAttack(selectedCard, character);
                        showAttackEffect(currentTurn === 'player-one' ? 'left' : 'right');
                    } else if (currentAction === 'special') {
                        // Usar habilidad especial
                        useSpecialAbilityOffensive(selectedCard, character);
                        showSpecialEffect(currentTurn === 'player-one' ? 'left' : 'right');
                    }
                    
                    // Limpiar selección
                    document.querySelectorAll('.card').forEach(c => {
                        c.classList.remove('selectable');
                        c.classList.remove('selected');
                    });
                    
                    // Resetear estado
                    waitingForTarget = false;
                    currentAction = null;
                    
                    // Cambiar turno después de un breve retraso
                    setTimeout(() => {
                        changeTurn();
                    }, 1500);
                    
                    return;
                }
                
                // Si no es el turno del jugador de la carta, mostrar mensaje y no hacer nada
                if (cardPlayer !== currentTurn) {
                    const playerName = currentTurn === 'player-one' ? 'Jugador 1' : 'Jugador 2';
                    showMessage(`Es el turno del ${playerName}`, 2000);
                    return;
                }
                
                // Deseleccionar otras cartas
                document.querySelectorAll('.card').forEach(c => {
                    c.classList.remove('selected');
                });
                
                // Seleccionar esta carta
                this.classList.add('selected');
                cardManager.selectCard(character, cardPlayer);
                selectedCard = character;
                selectedCardPlayer = cardPlayer;
                
                // Mostrar mensaje de instrucción
                showMessage(`${character.character} seleccionado. ¿Qué acción deseas realizar?`, 2000);
            });
        });
    }
    
    // Función para añadir eventos a los botones
    function addButtonEvents() {
        // Actualizar referencias a los botones
        attackButtonLeft = document.getElementById('attackButtonLeft');
        specialButtonLeft = document.getElementById('specialButtonLeft');
        attackButtonRight = document.getElementById('attackButtonRight');
        specialButtonRight = document.getElementById('specialButtonRight');
        
        // Deshabilitar todos los botones inicialmente
        if (attackButtonLeft) attackButtonLeft.disabled = true;
        if (specialButtonLeft) specialButtonLeft.disabled = true;
        if (attackButtonRight) attackButtonRight.disabled = true;
        if (specialButtonRight) specialButtonRight.disabled = true;
        
        // Botón de ataque del jugador 1
        if (attackButtonLeft) {
            attackButtonLeft.addEventListener('click', function() {
                if (currentTurn !== 'player-one' || !selectedCard || selectedCardPlayer !== 'player-one') {
                    showMessage('Selecciona una de tus cartas primero', 2000);
                    return;
                }
                
                // Marcar que estamos esperando un objetivo
                waitingForTarget = true;
                currentAction = 'attack';
                
                // Hacer que las cartas del oponente sean seleccionables
                const opponentCards = document.querySelectorAll('.right-player .card');
                opponentCards.forEach(card => {
                    card.classList.add('selectable');
                });
                
                // Resaltar visualmente las cartas seleccionables
                document.querySelector('.right-player').classList.add('target-area');
                
                // Mensaje claro con instrucciones
                showMessage('Selecciona una carta del oponente para atacar', 3000);
            });
        }
        
        // Botón de habilidad especial del jugador 1
        if (specialButtonLeft) {
            specialButtonLeft.addEventListener('click', function() {
                if (currentTurn !== 'player-one' || !selectedCard || selectedCardPlayer !== 'player-one') {
                    showMessage('Selecciona una de tus cartas primero', 2000);
                    return;
                }
                
                // Verificar si la carta tiene habilidad especial
                if (!selectedCard.specialAbility || !selectedCard.specialAbility.name) {
                    showMessage('Esta carta no tiene habilidad especial', 2000);
                    return;
                }
                
                // Verificar el tipo de habilidad especial
                if (selectedCard.specialAbility.type === 'offensive') {
                    // Habilidad ofensiva, necesita un objetivo
                    waitingForTarget = true;
                    currentAction = 'special';
                    
                    // Hacer que las cartas del oponente sean seleccionables
                    const opponentCards = document.querySelectorAll('.right-player .card');
                    opponentCards.forEach(card => {
                        card.classList.add('selectable');
                    });
                    
                    // Resaltar visualmente las cartas seleccionables
                    document.querySelector('.right-player').classList.add('target-area');
                    
                    // Mensaje claro con instrucciones
                    showMessage(`Selecciona una carta del oponente para usar ${selectedCard.specialAbility.name}`, 3000);
                } else {
                    // Habilidad defensiva o de soporte, se aplica a sí mismo o a aliados
                    useSpecialAbilityDefensive(selectedCard);
                    showSpecialEffect('left');
                    
                    // Cambiar turno después de un breve retraso
                    setTimeout(() => {
                        changeTurn();
                    }, 1500);
                }
            });
        }
        
        // Botón de ataque del jugador 2
        if (attackButtonRight) {
            attackButtonRight.addEventListener('click', function() {
                if (currentTurn !== 'player-two' || !selectedCard || selectedCardPlayer !== 'player-two') {
                    showMessage('Selecciona una de tus cartas primero', 2000);
                    return;
                }
                
                // Marcar que estamos esperando un objetivo
                waitingForTarget = true;
                currentAction = 'attack';
                
                // Hacer que las cartas del oponente sean seleccionables
                const opponentCards = document.querySelectorAll('.left-player .card');
                opponentCards.forEach(card => {
                    card.classList.add('selectable');
                });
                
                // Resaltar visualmente las cartas seleccionables
                document.querySelector('.left-player').classList.add('target-area');
                
                // Mensaje claro con instrucciones
                showMessage('Selecciona una carta del oponente para atacar', 3000);
            });
        }
        
        // Botón de habilidad especial del jugador 2
        if (specialButtonRight) {
            specialButtonRight.addEventListener('click', function() {
                if (currentTurn !== 'player-two' || !selectedCard || selectedCardPlayer !== 'player-two') {
                    showMessage('Selecciona una de tus cartas primero', 2000);
                    return;
                }
                
                // Verificar si la carta tiene habilidad especial
                if (!selectedCard.specialAbility || !selectedCard.specialAbility.name) {
                    showMessage('Esta carta no tiene habilidad especial', 2000);
                    return;
                }
                
                // Verificar el tipo de habilidad especial
                if (selectedCard.specialAbility.type === 'offensive') {
                    // Habilidad ofensiva, necesita un objetivo
                    waitingForTarget = true;
                    currentAction = 'special';
                    
                    // Hacer que las cartas del oponente sean seleccionables
                    const opponentCards = document.querySelectorAll('.left-player .card');
                    opponentCards.forEach(card => {
                        card.classList.add('selectable');
                    });
                    
                    // Resaltar visualmente las cartas seleccionables
                    document.querySelector('.left-player').classList.add('target-area');
                    
                    // Mensaje claro con instrucciones
                    showMessage(`Selecciona una carta del oponente para usar ${selectedCard.specialAbility.name}`, 3000);
                } else {
                    // Habilidad defensiva o de soporte, se aplica a sí mismo o a aliados
                    useSpecialAbilityDefensive(selectedCard);
                    showSpecialEffect('right');
                    
                    // Cambiar turno después de un breve retraso
                    setTimeout(() => {
                        changeTurn();
                    }, 1500);
                }
            });
        }
    }
    
    // Función para configurar el botón de salir
    function setupExitButton() {
        const exitButton = document.getElementById('exitButton');
        if (exitButton) {
            // Elimina qualsevol event handler anterior
            exitButton.replaceWith(exitButton.cloneNode(true));
            const newExitButton = document.getElementById('exitButton');
            newExitButton.addEventListener('click', function() {
                document.getElementById('exitModal').style.display = 'flex';
            });
        }
    }
    // Fi de la funció setupExitButton

    // Función para realizar un ataque
    function performAttack(attacker, defender) {
        // Restar el valor de ataque a la salud del defensor
        defender.health -= attacker.attackPower;
        
        // Mostrar mensaje de ataque
        const attackMessage = `${attacker.character} ataca a ${defender.character} con ${attacker.attackPower} de daño!`;
        showMessage(attackMessage, 2000);
        
        // Comprobar si la carta ha sido derrotada
        if (defender.health <= 0) {
            const defeatMessage = `${defender.character} ha sido derrotado!`;
            showMessage(defeatMessage, 2500);
            
            // Eliminar la carta derrotada
            const defenderPlayer = cardManager.playerOneCards.includes(defender) ? 'player-one' : 'player-two';
            cardManager.removeCard(defenderPlayer, defender);
        }
        
        // Actualizar la visualización
        cardManager.renderCards();
        
        // Volver a añadir eventos a las cartas
        addCardEvents();
    }
    
    // Funció genèrica per aplicar l'acció d'una carta
    function applyCardAction(attacker, defender, useSpecial = false) {
        // Determinar jugador de l'atacant
        const attackerPlayer = cardManager.playerOneCards.includes(attacker) ? 'player-one' : 'player-two';
        // Control d'ús d'especial per registre global (no a l'objecte carta)
        if (!specialUsed[attackerPlayer]) specialUsed[attackerPlayer] = {};
        if (typeof attacker.id === 'undefined') {
            console.warn('La carta atacant no té id!');
            return;
        }
        let message = '';
        if (useSpecial) {
            if (specialUsed[attackerPlayer][attacker.id]) {
                // Ja s'ha utilitzat l'especial
                message = `${attacker.character} ja ha utilitzat la seva habilitat especial!`;
                showMessage(message, 2500);
                return;
            }
        }
        if (attacker.cornerColor === 'vermell') {
            // Tipus atac
            if (useSpecial && !specialUsed[attackerPlayer][attacker.id]) {
                defender.health -= attacker.specialAbility.value;
                attacker.health -= attacker.specialAbility.value;
                specialUsed[attackerPlayer][attacker.id] = true;
                message = `${attacker.character} usa l'ESPECIAL (${attacker.specialAbility.name}) contra ${defender.character}: -${attacker.specialAbility.value} salut a tots dos!`;
            } else {
                defender.health -= attacker.attack;
                attacker.health -= attacker.attack;
                message = `${attacker.character} ataca a ${defender.character}: -${attacker.attack} salut a tots dos!`;
            }
        } else if (attacker.cornerColor === 'blau') {
            // Tipus defensa
            if (useSpecial && !specialUsed[attackerPlayer][attacker.id]) {
                attacker.health += attacker.specialAbility.value;
                specialUsed[attackerPlayer][attacker.id] = true;
                message = `${attacker.character} usa l'ESPECIAL (${attacker.specialAbility.name}): +${attacker.specialAbility.value} salut!`;
            } else {
                message = `${attacker.character} es defensa. No hi ha canvi de salut.`;
            }
        } else {
            message = `${attacker.character} té un tipus desconegut.`;
        }
        showMessage(message, 2500);

        // Comprovar si la carta defensora ha estat derrotada
        if (defender.health <= 0) {
            const defeatMessage = `${defender.character} ha estat derrotat!`;
            showMessage(defeatMessage, 2500);
            const defenderPlayer = cardManager.playerOneCards.includes(defender) ? 'player-one' : 'player-two';
            cardManager.removeCard(defenderPlayer, defender);
        }
        // Comprovar si l'atacant ha estat derrotat (per atac especial o normal)
        if (attacker.health <= 0) {
            const defeatMessage = `${attacker.character} ha estat derrotat!`;
            showMessage(defeatMessage, 2500);
            const attackerPlayer = cardManager.playerOneCards.includes(attacker) ? 'player-one' : 'player-two';
            cardManager.removeCard(attackerPlayer, attacker);
        }
        cardManager.renderCards();
        addCardEvents();
    }

    // Función para usar habilidad especial ofensiva (obsoleta, ara crida la nova)
    function useSpecialAbilityOffensive(attacker, defender) {
        applyCardAction(attacker, defender, true);
        
        // Comprobar si la carta ha sido derrotada
        if (defender.health <= 0) {
            const defeatMessage = `${defender.character} ha sido derrotado!`;
            showMessage(defeatMessage, 2500);
            
            // Eliminar la carta derrotada
            const defenderPlayer = cardManager.playerOneCards.includes(defender) ? 'player-one' : 'player-two';
            cardManager.removeCard(defenderPlayer, defender);
        }
        
        // Actualizar la visualización
        cardManager.renderCards();
        
        // Volver a añadir eventos a las cartas
        addCardEvents();
    }
    
    // Función para usar habilidad especial defensiva
    function useSpecialAbilityDefensive(character) {
        // Obtener valores originales
        const originalHealth = character.originalHealth || character.health;
        
        // Calcular curación
        const healAmount = character.specialAbility.value;
        const oldHealth = character.health;
        
        // Aumentar la salud con la habilidad defensiva
        character.health += healAmount;
        
        // Limitar la salud al máximo original
        if (character.health > originalHealth) {
            character.health = originalHealth;
        }
        
        // Calcular curación real aplicada
        const actualHeal = character.health - oldHealth;
        
        // Mensaje de curación
        const healMessage = `${character.character} usa ${character.specialAbility.name} y recupera ${actualHeal} puntos de salud!`;
        showMessage(healMessage, 2500);
        
        // Actualizar la visualización
        cardManager.renderCards();
        
        // Volver a añadir eventos a las cartas
        addCardEvents();
    }
    
    // Función para cambiar el turno
    function changeTurn() {
        // Limpiar selección actual
        selectedCard = null;
        selectedCardPlayer = null;
        waitingForTarget = false;
        currentAction = null;
        
        // Limpiar clases de cartas seleccionables
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selectable');
            card.classList.remove('selected');
        });
        
        // Cambiar al otro jugador
        currentTurn = currentTurn === 'player-one' ? 'player-two' : 'player-one';
        
        // Actualizar indicador de turno
        updateTurnIndicator();
        
        // Mostrar mensaje de cambio de turno con instrucciones claras
        const playerName = currentTurn === 'player-one' ? 'Jugador 1' : 'Jugador 2';
        showMessage(`Turno del ${playerName}`, 2000);
        
        // Mostrar instrucciones después de un breve retraso
        setTimeout(() => {
            showMessage(`${playerName}: Selecciona una de tus cartas para jugar`, 2500);
        }, 2500);
    }
    
    // Función para actualizar el indicador de turno
    function updateTurnIndicator() {
        if (!turnIndicator) return;
        
        // Limpiar clases anteriores
        turnIndicator.classList.remove('your-turn');
        
        // Obtener referencias a los elementos del jugador
        const leftPlayer = document.querySelector('.left-player');
        const rightPlayer = document.querySelector('.right-player');
        
        // Limpiar clases de turno activo
        if (leftPlayer) leftPlayer.classList.remove('active-turn');
        if (rightPlayer) rightPlayer.classList.remove('active-turn');
        
        // Aplicar estilos según el turno actual
        if (currentTurn === 'player-one') {
            // Actualizar indicador de turno
            turnIndicator.textContent = 'TURNO DEL JUGADOR 1';
            turnIndicator.classList.add('your-turn');
            turnIndicator.style.backgroundColor = 'rgba(230, 57, 70, 0.8)';
            
            // Habilitar botones del jugador 1
            if (attackButtonLeft) {
                attackButtonLeft.disabled = false;
                attackButtonLeft.style.opacity = '1';
            }
            if (specialButtonLeft) {
                specialButtonLeft.disabled = false;
                specialButtonLeft.style.opacity = '1';
            }
            
            // Deshabilitar botones del jugador 2
            if (attackButtonRight) {
                attackButtonRight.disabled = true;
                attackButtonRight.style.opacity = '0.5';
            }
            if (specialButtonRight) {
                specialButtonRight.disabled = true;
                specialButtonRight.style.opacity = '0.5';
            }
            
            // Resaltar área del jugador 1
            if (leftPlayer) {
                leftPlayer.classList.add('active-turn');
                leftPlayer.style.boxShadow = '0 0 20px rgba(230, 57, 70, 0.5)';
            }
        } else {
            // Actualizar indicador de turno
            turnIndicator.textContent = 'TURNO DEL JUGADOR 2';
            turnIndicator.classList.add('your-turn');
            turnIndicator.style.backgroundColor = 'rgba(52, 152, 219, 0.8)';
            
            // Habilitar botones del jugador 2
            if (attackButtonRight) {
                attackButtonRight.disabled = false;
                attackButtonRight.style.opacity = '1';
            }
            if (specialButtonRight) {
                specialButtonRight.disabled = false;
                specialButtonRight.style.opacity = '1';
            }
            
            // Deshabilitar botones del jugador 1
            if (attackButtonLeft) {
                attackButtonLeft.disabled = true;
                attackButtonLeft.style.opacity = '0.5';
            }
            if (specialButtonLeft) {
                specialButtonLeft.disabled = true;
                specialButtonLeft.style.opacity = '0.5';
            }
            
            // Resaltar área del jugador 2
            if (rightPlayer) {
                rightPlayer.classList.add('active-turn');
                rightPlayer.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.5)';
            }
        }
    }
    
    // Función para añadir controles de scroll a las áreas de cartas
    function addScrollControls() {
        const cardsAreas = document.querySelectorAll('.cards-area');
        
        cardsAreas.forEach(area => {
            // Crear botones de scroll
            const leftButton = document.createElement('button');
            leftButton.className = 'scroll-button scroll-left';
            leftButton.innerHTML = '&lt;';
            
            const rightButton = document.createElement('button');
            rightButton.className = 'scroll-button scroll-right';
            rightButton.innerHTML = '&gt;';
            
            // Añadir botones al área
            area.appendChild(leftButton);
            area.appendChild(rightButton);
            
            // Añadir eventos
            leftButton.addEventListener('click', () => {
                scrollCards(area, -200);
            });
            
            rightButton.addEventListener('click', () => {
                scrollCards(area, 200);
            });
        });
    }
    
    // Función para desplazar las cartas horizontalmente
    function scrollCards(container, amount) {
        container.scrollBy({
            left: amount,
            behavior: 'smooth'
        });
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
    
    // Función para mostrar mensajes en el tablero
    function showMessage(message, duration = 2000) {
        // Verificar si el elemento game-board existe
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) {
            console.error('No se encontró el elemento .game-board');
            return;
        }
        
        // Eliminar mensajes anteriores si existen
        const existingMessages = document.querySelectorAll('.game-message');
        if (existingMessages.length > 2) {
            existingMessages[0].remove();
        }
        
        // Crear elemento de mensaje
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Añadir al tablero
        gameBoard.appendChild(messageElement);
        
        // Mostrar con animación
        setTimeout(() => messageElement.classList.add('show'), 10);
        
        // Eliminar después de la duración
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 500);
        }, duration);
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        // Eliminar clases anteriores
        notification.className = 'notification';
        
        // Añadir clase según el tipo
        notification.classList.add(type);
        
        // Establecer mensaje
        notification.textContent = message;
        
        // Mostrar notificación
        notification.classList.add('show');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Función para actualizar estadísticas al finalizar la partida
    function updateGameStats(playerWon) {
        // Actualizar estadísticas solo si hay un usuario con sesión iniciada
        // y el segundo jugador no es invitado
        if (userManager && currentUser) {
            if (playerWon && !secondPlayer.isGuest) {
                userManager.updateStats(true, currentUser.id);
                userManager.updateStats(false, secondPlayer.id);
            } else if (!playerWon && !secondPlayer.isGuest) {
                userManager.updateStats(false, currentUser.id);
                userManager.updateStats(true, secondPlayer.id);
            } else if (playerWon) {
                // Si el segundo jugador es invitado, solo actualizar estadísticas del primer jugador
                userManager.updateStats(true, currentUser.id);
            } else {
                userManager.updateStats(false, currentUser.id);
            }
        }
    }
    
    // Sobrescribir la función checkWinCondition del CardManager
    const originalCheckWinCondition = cardManager.checkWinCondition;
    // --- ESTADÍSTICAS LOCALSTORAGE ---
    function updateStats(won) {
    let stats = JSON.parse(localStorage.getItem('warbornStats')) || {
        gamesPlayed: 0,
        gamesWon: 0
    };
    stats.gamesPlayed++;
    if (won) stats.gamesWon++;
    localStorage.setItem('warbornStats', JSON.stringify(stats));
}

    cardManager.checkWinCondition = function() {
        if (this.playerOneCards.length === 0) {
            const winMessage = '¡El Jugador 2 ha ganado!';
            showMessage(winMessage, 5000);
            setTimeout(() => {
                // alert(winMessage);
                updateGameStats(false);
                showEndgameMenu();
            }, 1000);
            return 'player-two';
        } else if (this.playerTwoCards.length === 0) {
            const winMessage = '¡El Jugador 1 ha ganado!';
            showMessage(winMessage, 5000);
            setTimeout(() => {
                // alert(winMessage);
                updateGameStats(true);
                showEndgameMenu();
            }, 1000);
            return 'player-one';
        }
        return null;
    };

    
    // Función para reiniciar el juego
    function resetGame() {
        // Restablecer valores iniciales de las cartas
        cardManager.characters.forEach(character => {
            const originalCharacter = cardManager.getDefaultCharacters().find(c => c.id === character.id);
            if (originalCharacter) {
                character.health = originalCharacter.health;
                character.attackPower = originalCharacter.attackPower;
                character.specialAbility = { ...originalCharacter.specialAbility };
            }
        });
        
        // Limpiar selección
        selectedCard = null;
        selectedCardPlayer = null;
        
        // Reiniciar uso de habilidades especiales
        specialUsed = {
            'player-one': {},
            'player-two': {}
        };
        
        // Determinar aleatoriamente quién empieza
        currentTurn = Math.random() < 0.5 ? 'player-one' : 'player-two';
        
        // Seleccionar nuevas cartas aleatorias
        cardManager.selectRandomCards();
        
        // Renderizar las cartas
        cardManager.renderCards();
        
        // Actualizar indicador de turno
        updateTurnIndicator();
        
        // Añadir eventos a las cartas
        addCardEvents();
        
        // Mostrar mensaje de reinicio
        showMessage('¡Nueva partida iniciada!', 2000);
    }
    
    // Hacer disponible la función showMessage globalmente
    window.showMessage = showMessage;

    // Assegura que el botó de sortir mostra el popup
    setupExitButton();
});
