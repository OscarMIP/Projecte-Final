// Constantes para los valores máximos de las estadísticas
const STATS_MAX = {
    health: 1500,
    attackPower: 100,
    specialAbility: 200
};

// Clase para gestionar las cartas del juego
class CardManager {
    constructor() {
        this.characters = [];
        this.playerOneCards = [];
        this.playerTwoCards = [];
    }

    // Cargar los personajes desde el archivo JSON
    async loadCharacters() {
        try {
            console.log('Intentando cargar personajes desde:', 'JSON GOD OF WAR/characters.json');
            
            // Verificar si el archivo existe primero
            const checkResponse = await fetch('JSON GOD OF WAR/characters.json', { method: 'HEAD' })
                .catch(err => {
                    console.error('Error al verificar el archivo characters.json:', err);
                    return { ok: false, status: 404 };
                });
            
            if (!checkResponse.ok) {
                console.error(`El archivo characters.json no se encuentra. Estado: ${checkResponse.status}`);
                
                // Cargar datos de ejemplo si no se encuentra el archivo
                console.log('Cargando datos de ejemplo...');
                this.characters = this.getDefaultCharacters();
                console.log(`Cargados ${this.characters.length} personajes de ejemplo`);
                return this.characters;
            }
            
            const response = await fetch('JSON GOD OF WAR/characters.json');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('El formato de datos no es válido o está vacío');
            }
            
            this.characters = data;
            console.log(`Cargados ${this.characters.length} personajes correctamente`);
            return this.characters;
        } catch (error) {
            console.error('Error al cargar los personajes:', error);
            
            // Cargar datos de ejemplo en caso de error
            console.log('Cargando datos de ejemplo debido al error...');
            this.characters = this.getDefaultCharacters();
            console.log(`Cargados ${this.characters.length} personajes de ejemplo`);
            return this.characters;
        }
    }
    
    // Obtener personajes por defecto en caso de error
    getDefaultCharacters() {
        return [
            {
                "id": 1,
                "img": "characters_images/kratos.webp",
                "character": "Kratos",
                "type": "offensive",
                "health": 1000,
                "attackPower": 95,
                "specialAbility": {
                    "name": "Spartan Rage",
                    "type": "attack",
                    "value": 150
                },
                "info": "Former Spartan warrior with immense strength and the power of Spartan Rage."
            },
            {
                "id": 2,
                "img": "characters_images/atreus.webp",
                "character": "Atreus",
                "type": "offensive",
                "health": 600,
                "attackPower": 75,
                "specialAbility": {
                    "name": "Runic Arrows",
                    "type": "attack",
                    "value": 85
                },
                "info": "Skilled young archer with divine blood."
            },
            {
                "id": 3,
                "img": "characters_images/baldur.webp",
                "character": "Baldur",
                "type": "offensive",
                "health": 950,
                "attackPower": 90,
                "specialAbility": {
                    "name": "Invulnerability",
                    "type": "defense",
                    "value": 200
                },
                "info": "Norse god blessed with invulnerability."
            },
            {
                "id": 4,
                "img": "characters_images/freya.webp",
                "character": "Freya",
                "type": "defensive",
                "health": 800,
                "attackPower": 70,
                "specialAbility": {
                    "name": "Vanir Magic",
                    "type": "defense",
                    "value": 180
                },
                "info": "Powerful witch and former Queen of the Valkyries."
            },
            {
                "id": 5,
                "img": "characters_images/mimir.webp",
                "character": "Mimir",
                "type": "defensive",
                "health": 500,
                "attackPower": 40,
                "specialAbility": {
                    "name": "Wisdom",
                    "type": "defense",
                    "value": 120
                },
                "info": "The smartest man alive, advisor to Odin."
            },
            {
                "id": 6,
                "img": "characters_images/thor.webp",
                "character": "Thor",
                "type": "offensive",
                "health": 1200,
                "attackPower": 100,
                "specialAbility": {
                    "name": "Lightning Strike",
                    "type": "attack",
                    "value": 180
                },
                "info": "God of Thunder, wielder of Mjolnir."
            },
            {
                "id": 7,
                "img": "characters_images/odin.webp",
                "character": "Odin",
                "type": "offensive",
                "health": 1100,
                "attackPower": 85,
                "specialAbility": {
                    "name": "All-Father's Wrath",
                    "type": "attack",
                    "value": 160
                },
                "info": "King of Asgard and All-Father of the Norse gods."
            },
            {
                "id": 8,
                "img": "characters_images/týr.webp",
                "character": "Týr",
                "type": "defensive",
                "health": 900,
                "attackPower": 65,
                "specialAbility": {
                    "name": "Diplomatic Shield",
                    "type": "defense",
                    "value": 150
                },
                "info": "Norse god of war and justice, known for his fairness."
            },
            {
                "id": 9,
                "img": "characters_images/brok.webp",
                "character": "Brok",
                "type": "defensive",
                "health": 700,
                "attackPower": 60,
                "specialAbility": {
                    "name": "Dwarven Craft",
                    "type": "defense",
                    "value": 130
                },
                "info": "Blue-skinned dwarf blacksmith, creator of legendary weapons."
            },
            {
                "id": 10,
                "img": "characters_images/sindri.webp",
                "character": "Sindri",
                "type": "defensive",
                "health": 650,
                "attackPower": 55,
                "specialAbility": {
                    "name": "Mystic Forge",
                    "type": "defense",
                    "value": 125
                },
                "info": "Skilled dwarf craftsman with a fear of germs."
            }
        ];
    }

    // Seleccionar cartas aleatorias para cada jugador
    selectRandomCards(count = 5) {
        if (this.characters.length === 0) {
            console.error('No hay personajes cargados');
            return;
        }

        // Barajar el array de personajes
        const shuffled = [...this.characters].sort(() => 0.5 - Math.random());
        
        // Seleccionar cartas para cada jugador
        this.playerOneCards = shuffled.slice(0, count);
        this.playerTwoCards = shuffled.slice(count, count * 2);
        
        // Actualizar contadores de cartas
        this.updateCardCount();
        
        return {
            playerOne: this.playerOneCards,
            playerTwo: this.playerTwoCards
        };
    }

    // Crear elemento de carta en el DOM
    createCardElement(character, playerId) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.characterId = character.id;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="info-icon">i</div>
                <div class="info-content">${character.info || 'No hay información disponible'}</div>
                <div class="character-image">
                    <div class="type-indicator ${character.type}"></div>
                    <img src="JSON GOD OF WAR/${character.img}" alt="${character.character}" onerror="this.onerror=null; this.src='images/default-card.webp'; console.error('Error al cargar imagen: JSON GOD OF WAR/${character.img}');">
                    <h2 class="character-name">${character.character}</h2>
                    <div class="stats-overlay">
                        <div class="stat-bar">
                            <div class="bar-container">
                                <div class="bar health-bar" style="width: ${(character.health / STATS_MAX.health) * 100}%">
                                    <span class="stat-value">${character.health}</span>
                                </div>
                            </div>
                        </div>
                        <div class="stat-bar">
                            <div class="bar-container">
                                <div class="bar attack-bar" style="width: ${(character.attackPower / STATS_MAX.attackPower) * 100}%">
                                    <span class="stat-value">${character.attackPower}</span>
                                </div>
                            </div>
                        </div>
                        <div class="stat-bar">
                            <div class="bar-container">
                                <div class="bar special-bar" style="width: ${(character.specialAbility.value / STATS_MAX.specialAbility) * 100}%">
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
            this.selectCard(character, playerId);
        });
        
        // Añadir evento de clic al icono de información
        const infoIcon = card.querySelector('.info-icon');
        const infoContent = card.querySelector('.info-content');
        
        if (infoIcon && infoContent) {
            infoIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que se active el evento de selección de carta
                infoContent.classList.toggle('show');
            });
        }
        
        return card;
    }

    // Renderizar las cartas en el tablero
    renderCards() {
        const leftCardsArea = document.querySelector('.left-player .cards-area');
        const rightCardsArea = document.querySelector('.right-player .cards-area');
        
        // Limpiar áreas de cartas
        leftCardsArea.innerHTML = '';
        rightCardsArea.innerHTML = '';
        
        // Renderizar cartas del jugador 1
        this.playerOneCards.forEach(character => {
            const card = this.createCardElement(character, 'player-one');
            leftCardsArea.appendChild(card);
        });
        
        // Renderizar cartas del jugador 2
        this.playerTwoCards.forEach(character => {
            const card = this.createCardElement(character, 'player-two');
            rightCardsArea.appendChild(card);
        });
    }

    // Seleccionar una carta
    selectCard(character, playerId) {
        // Deseleccionar todas las cartas en el área del jugador
        const playerArea = playerId === 'player-one' ? '.left-player' : '.right-player';
        document.querySelectorAll(`${playerArea} .card`).forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar la carta actual
        const selectedCard = document.querySelector(`${playerArea} .card[data-character-id="${character.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            
            // Guardar la carta seleccionada en el estado del juego
            if (playerId === 'player-one') {
                this.selectedCardPlayerOne = character;
                console.log('Jugador 1 seleccionó:', character.character);
            } else {
                this.selectedCardPlayerTwo = character;
                console.log('Jugador 2 seleccionó:', character.character);
            }
            
            // Mostrar mensaje visual de selección
            const message = `${character.character} seleccionado`;
            if (typeof window.showMessage === 'function') {
                window.showMessage(message, 1500);
            } else {
                console.log(message);
            }
        } else {
            console.warn(`No se encontró la carta con ID ${character.id} en el área ${playerArea}`);
        }
    }

    // Actualizar el contador de cartas
    updateCardCount() {
        const playerOneCount = document.querySelector('.left-player .cards-count');
        const playerTwoCount = document.querySelector('.right-player .cards-count');
        
        if (playerOneCount) {
            playerOneCount.innerHTML = `<i class="card-icon"></i> ${this.playerOneCards.length}`;
        }
        
        if (playerTwoCount) {
            playerTwoCount.innerHTML = `<i class="card-icon"></i> ${this.playerTwoCards.length}`;
        }
    }

    // Realizar un ataque
    attack(playerId) {
        const attacker = playerId === 'player-one' ? this.selectedCardPlayerOne : this.selectedCardPlayerTwo;
        const defender = playerId === 'player-one' ? this.selectedCardPlayerTwo : this.selectedCardPlayerOne;
        
        if (!attacker || !defender) {
            const message = 'Selecciona una carta para atacar y un objetivo';
            if (typeof window.showMessage === 'function') {
                window.showMessage(message, 2000);
            } else {
                console.log(message);
                alert(message);
            }
            return false;
        }
        
        // Calcular daño
        const damage = attacker.attackPower;
        
        // Aplicar daño
        defender.health -= damage;
        
        // Mensaje de ataque
        const attackMessage = `${attacker.character} ataca a ${defender.character} causando ${damage} de daño!`;
        if (typeof window.showMessage === 'function') {
            window.showMessage(attackMessage, 2000);
        } else {
            console.log(attackMessage);
        }
        
        // Comprobar si la carta ha sido derrotada
        if (defender.health <= 0) {
            const defeatMessage = `${defender.character} ha sido derrotado!`;
            if (typeof window.showMessage === 'function') {
                window.showMessage(defeatMessage, 2500);
            } else {
                console.log(defeatMessage);
            }
            this.removeCard(playerId === 'player-one' ? 'player-two' : 'player-one', defender);
        }
        
        // Actualizar la visualización
        this.renderCards();
        return true;
    }

    // Usar habilidad especial
    useSpecialAbility(playerId) {
        const character = playerId === 'player-one' ? this.selectedCardPlayerOne : this.selectedCardPlayerTwo;
        
        if (!character) {
            const message = 'Selecciona una carta para usar su habilidad especial';
            if (typeof window.showMessage === 'function') {
                window.showMessage(message, 2000);
            } else {
                console.log(message);
                alert(message);
            }
            return false;
        }
        
        // Mensaje de activación de habilidad
        const abilityMessage = `${character.character} usa ${character.specialAbility.name}!`;
        if (typeof window.showMessage === 'function') {
            window.showMessage(abilityMessage, 2000);
        } else {
            console.log(abilityMessage);
        }
        
        // Aplicar efecto según el tipo de habilidad
        if (character.specialAbility.type === 'attack') {
            // Atacar con la habilidad especial
            const defender = playerId === 'player-one' ? this.selectedCardPlayerTwo : this.selectedCardPlayerOne;
            
            if (!defender) {
                const message = 'Selecciona un objetivo para la habilidad especial';
                if (typeof window.showMessage === 'function') {
                    window.showMessage(message, 2000);
                } else {
                    console.log(message);
                    alert(message);
                }
                return false;
            }
            
            // Calcular daño
            const damage = character.specialAbility.value;
            
            // Aplicar daño
            defender.health -= damage;
            
            // Mensaje de daño
            const damageMessage = `${character.specialAbility.name} causa ${damage} de daño a ${defender.character}!`;
            if (typeof window.showMessage === 'function') {
                window.showMessage(damageMessage, 2000);
            } else {
                console.log(damageMessage);
            }
            
            // Comprobar si la carta ha sido derrotada
            if (defender.health <= 0) {
                const defeatMessage = `${defender.character} ha sido derrotado!`;
                if (typeof window.showMessage === 'function') {
                    window.showMessage(defeatMessage, 2500);
                } else {
                    console.log(defeatMessage);
                }
                this.removeCard(playerId === 'player-one' ? 'player-two' : 'player-one', defender);
            }
        } else if (character.specialAbility.type === 'defense') {
            // Obtener la salud original
            const originalCharacter = this.characters.find(c => c.id === character.id);
            const originalHealth = originalCharacter ? originalCharacter.health : character.health;
            
            // Calcular curación
            const healAmount = Math.floor(character.specialAbility.value / 2);
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
            const healMessage = `${character.character} recupera ${actualHeal} puntos de salud!`;
            if (typeof window.showMessage === 'function') {
                window.showMessage(healMessage, 2000);
            } else {
                console.log(healMessage);
            }
        }
        
        // Actualizar la visualización
        this.renderCards();
        return true;
    }

    // Eliminar una carta derrotada
    removeCard(playerId, card) {
        if (playerId === 'player-one') {
            this.playerOneCards = this.playerOneCards.filter(c => c.id !== card.id);
        } else {
            this.playerTwoCards = this.playerTwoCards.filter(c => c.id !== card.id);
        }
        
        // Actualizar contador de cartas
        this.updateCardCount();
        
        // Comprobar condición de victoria
        this.checkWinCondition();
    }

    // Comprobar si hay un ganador
    checkWinCondition() {
        if (this.playerOneCards.length === 0) {
            const winMessage = '¡El Jugador 2 ha ganado!';
            if (typeof window.showMessage === 'function') {
                window.showMessage(winMessage, 5000);
                setTimeout(() => {
                    alert(winMessage);
                    // Actualizar estadísticas si existe la función
                    if (typeof window.updateGameStats === 'function') {
                        window.updateGameStats(false);
                    }
                }, 1000);
            } else {
                alert(winMessage);
            }
            return 'player-two';
        } else if (this.playerTwoCards.length === 0) {
            const winMessage = '¡El Jugador 1 ha ganado!';
            if (typeof window.showMessage === 'function') {
                window.showMessage(winMessage, 5000);
                setTimeout(() => {
                    alert(winMessage);
                    // Actualizar estadísticas si existe la función
                    if (typeof window.updateGameStats === 'function') {
                        window.updateGameStats(true);
                    }
                }, 1000);
            } else {
                alert(winMessage);
            }
            return 'player-one';
        }
        return null;
    }
}

// Exportar la clase para usarla en otros archivos
window.CardManager = CardManager;
