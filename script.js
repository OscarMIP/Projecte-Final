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
            window.location.href = 'auth.html';
            return;
        }
    } else {
        console.warn('UserManager no está disponible. Continuando en modo anónimo.');
    }
    // Inicializar el gestor de cartas
    const cardManager = new CardManager();
    
    // Cargar avatar del usuario si está disponible
    const playerOneAvatar = document.querySelector('.left-player .player-avatar');
    if (avatarManager && currentUser) {
        avatarManager.applyAvatarToElement(currentUser.id, playerOneAvatar);
        
        // Escuchar cambios en el avatar (desde otras páginas)
        window.addEventListener('storage', function(event) {
            if (event.key === 'avatar_updated') {
                // Actualizar el avatar si ha cambiado
                avatarManager.applyAvatarToElement(currentUser.id, playerOneAvatar);
            }
        });
    } else if (playerOneAvatar) {
        // Establecer un avatar por defecto si no hay gestor de avatares
        playerOneAvatar.style.backgroundImage = "url('JSON GOD OF WAR/characters_images/kratos.webp')";
        playerOneAvatar.style.backgroundSize = 'cover';
        playerOneAvatar.style.backgroundPosition = 'center';
    }
    
    // Actualizar nombres de los jugadores
    updatePlayerNames(currentUser);
    
    // Función para actualizar los nombres de los jugadores
    function updatePlayerNames(user) {
        const playerOneName = document.querySelector('.left-player .player-name');
        const playerTwoName = document.querySelector('.right-player .player-name');
        
        // Actualizar nombre del jugador 1
        if (playerOneName) {
            if (user && user.username) {
                playerOneName.textContent = user.username;
            } else {
                playerOneName.textContent = 'Jugador 1';
            }
        }
        
        // Actualizar nombre del jugador 2
        if (playerTwoName) {
            // Aquí podríamos obtener el nombre del oponente en modo multijugador
            // Por ahora, simplemente usamos 'Jugador 2' o un nombre aleatorio
            const opponentNames = [
                'Jugador 2', 'Oponente', 'Rival', 'Adversario', 
                'Kratos', 'Atreus', 'Thor', 'Odin', 'Freya'
            ];
            const randomName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
            playerTwoName.textContent = randomName;
        }
    }
    
    // Referencias a los botones
    const attackButtonLeft = document.getElementById('attackButtonLeft');
    const specialButtonLeft = document.getElementById('specialButtonLeft');
    const attackButtonRight = document.getElementById('attackButtonRight');
    const specialButtonRight = document.getElementById('specialButtonRight');
    
    // Verificar que todos los botones existen
    if (!attackButtonLeft || !specialButtonLeft || !attackButtonRight || !specialButtonRight) {
        console.error('No se encontraron todos los botones necesarios');
    }
    
    // Inicializar el juego
    initGame();
    
    // Función para inicializar el juego
    async function initGame() {
        try {
            // Cargar los personajes
            await cardManager.loadCharacters();
            
            // Verificar si se cargaron los personajes correctamente
            if (cardManager.characters.length === 0) {
                console.error('No se pudieron cargar los personajes');
                showMessage('Error al cargar los personajes. Intenta recargar la página.', 5000);
                return;
            }
            
            console.log(`Cargados ${cardManager.characters.length} personajes correctamente`);
            
            // Seleccionar cartas aleatorias para cada jugador
            const selectedCards = cardManager.selectRandomCards(5);
            console.log('Cartas seleccionadas:', selectedCards);
            
            // Renderizar las cartas en el tablero
            cardManager.renderCards();
            
            // Añadir controles de scroll para las áreas de cartas
            addScrollControls();
            
            // Determinar aleatoriamente quién comienza
            const firstPlayer = Math.random() < 0.5 ? 
                (currentUser ? currentUser.username : 'Jugador 1') : 'Jugador 2';
            console.log(`${firstPlayer} comienza la partida`);
            
            // Mostrar mensaje en el tablero
            showMessage(`${firstPlayer} comienza la partida`, 3000);
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            showMessage('Error al inicializar el juego. Intenta recargar la página.', 5000);
        }
    }
    
    // Función para añadir controles de scroll a las áreas de cartas
    function addScrollControls() {
        const leftCardsArea = document.querySelector('.left-player .cards-area');
        const rightCardsArea = document.querySelector('.right-player .cards-area');
        
        if (leftCardsArea) {
            // Añadir indicadores de scroll para el jugador izquierdo
            const leftScrollLeft = document.createElement('div');
            leftScrollLeft.className = 'scroll-indicator scroll-left';
            leftScrollLeft.innerHTML = '&lt;';
            leftScrollLeft.addEventListener('click', () => scrollCards(leftCardsArea, -200));
            
            const leftScrollRight = document.createElement('div');
            leftScrollRight.className = 'scroll-indicator scroll-right';
            leftScrollRight.innerHTML = '&gt;';
            leftScrollRight.addEventListener('click', () => scrollCards(leftCardsArea, 200));
            
            // Añadir los controles al contenedor
            const leftPlayerContainer = document.querySelector('.left-player');
            if (leftPlayerContainer) {
                leftPlayerContainer.appendChild(leftScrollLeft);
                leftPlayerContainer.appendChild(leftScrollRight);
            }
        }
        
        if (rightCardsArea) {
            // Añadir indicadores de scroll para el jugador derecho
            const rightScrollLeft = document.createElement('div');
            rightScrollLeft.className = 'scroll-indicator scroll-left';
            rightScrollLeft.innerHTML = '&lt;';
            rightScrollLeft.addEventListener('click', () => scrollCards(rightCardsArea, -200));
            
            const rightScrollRight = document.createElement('div');
            rightScrollRight.className = 'scroll-indicator scroll-right';
            rightScrollRight.innerHTML = '&gt;';
            rightScrollRight.addEventListener('click', () => scrollCards(rightCardsArea, 200));
            
            // Añadir los controles al contenedor
            const rightPlayerContainer = document.querySelector('.right-player');
            if (rightPlayerContainer) {
                rightPlayerContainer.appendChild(rightScrollLeft);
                rightPlayerContainer.appendChild(rightScrollRight);
            }
        }
        
        // Añadir eventos de rueda de ratón para scroll horizontal
        [leftCardsArea, rightCardsArea].forEach(area => {
            if (area) {
                area.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        area.scrollLeft += e.deltaY;
                    }
                });
            }
        });
    }
    
    // Función para desplazar las cartas horizontalmente
    function scrollCards(container, amount) {
        if (container) {
            container.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        }
    }
    
    // Añadir eventos a los botones con verificación
    if (attackButtonLeft) {
        attackButtonLeft.addEventListener('click', () => {
            if (cardManager.attack('player-one')) {
                showAttackEffect('left');
            }
        });
    }
    
    if (specialButtonLeft) {
        specialButtonLeft.addEventListener('click', () => {
            if (cardManager.useSpecialAbility('player-one')) {
                showSpecialEffect('left');
            }
        });
    }
    
    if (attackButtonRight) {
        attackButtonRight.addEventListener('click', () => {
            if (cardManager.attack('player-two')) {
                showAttackEffect('right');
            }
        });
    }
    
    if (specialButtonRight) {
        specialButtonRight.addEventListener('click', () => {
            if (cardManager.useSpecialAbility('player-two')) {
                showSpecialEffect('right');
            }
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
    
    // Añadir estilos CSS adicionales
    const style = document.createElement('style');
    style.textContent = `
        .game-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-family: 'God of War', sans-serif;
            font-size: 2rem;
            text-align: center;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .game-message.show {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        
        .game-button.active {
            z-index: 100;
        }
    `;
    document.head.appendChild(style);
    
    // Función para actualizar estadísticas al finalizar la partida
    function updateGameStats(playerWon) {
        // Actualizar estadísticas solo si hay un usuario con sesión iniciada
        if (userManager.getCurrentUser()) {
            userManager.updateStats(playerWon);
        }
    }
    
    // Hacer disponible la función showMessage globalmente
    window.showMessage = showMessage;
    
    // Hacer disponible la función updateGameStats globalmente
    window.updateGameStats = updateGameStats;
    
    // No sobrescribimos la función checkWinCondition del CardManager
    // ya que ahora está mejorada en la clase CardManager
});
