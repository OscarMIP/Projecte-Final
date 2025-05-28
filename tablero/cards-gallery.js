document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = new UserManager();
    
    // Comprobar si hay un usuario con sesión iniciada
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
        // Si no hay sesión iniciada, redirigir a la página de autenticación
        window.location.href = 'auth.html';
        return;
    }
    
    // Inicializar el gestor de cartas
    const cardManager = new CardManager();
    
    // Referencias a los elementos del DOM
    const carouselContainer = document.getElementById('carouselContainer');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const typeFilter = document.getElementById('typeFilter');
    const cardName = document.getElementById('cardName');
    const cardType = document.getElementById('cardType');
    const cardHealth = document.getElementById('cardHealth');
    const cardAttack = document.getElementById('cardAttack');
    const cardSpecial = document.getElementById('cardSpecial');
    const cardDescription = document.getElementById('cardDescription');
    const abilityName = document.getElementById('abilityName');
    const abilityType = document.getElementById('abilityType');
    const abilityDescription = document.getElementById('abilityDescription');
    
    // Variables para el carrusel
    let characters = [];
    let filteredCharacters = [];
    let currentIndex = 0;
    let cardWidth = 250; // Ancho aproximado de una carta
    
    // Cargar las cartas
    async function loadCards() {
        try {
            // Cargar los personajes
            characters = await cardManager.loadCharacters();
            
            if (!characters || characters.length === 0) {
                console.error('No se pudieron cargar los personajes');
                // Mostrar mensaje de error en la interfaz
                carouselContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error al cargar las cartas</h3>
                        <p>No s'han pogut carregar les cartes. Si us plau, torna-ho a provar més tard.</p>
                    </div>
                `;
                return;
            }
            
            filteredCharacters = [...characters];
            
            // Renderizar el carrusel
            renderCarousel();
            
            // Mostrar detalles de la primera carta
            if (filteredCharacters.length > 0) {
                showCardDetails(filteredCharacters[0]);
            }
        } catch (error) {
            console.error('Error al cargar las cartas:', error);
            // Mostrar mensaje de error en la interfaz
            carouselContainer.innerHTML = `
                <div class="error-message">
                    <h3>Error al cargar las cartas</h3>
                    <p>S'ha produït un error: ${error.message}</p>
                </div>
            `;
        }
    }
    
    // Renderizar el carrusel de cartas
    function renderCarousel() {
        // Limpiar el contenedor
        carouselContainer.innerHTML = '';
        
        if (filteredCharacters.length === 0) {
            carouselContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No hi ha cartes disponibles</h3>
                    <p>No s'han trobat cartes amb els filtres seleccionats.</p>
                </div>
            `;
            return;
        }
        
        // Añadir cada carta al carrusel
        filteredCharacters.forEach((character, index) => {
            const card = document.createElement('div');
            card.className = `carousel-card ${index === currentIndex ? 'active' : ''}`;
            card.dataset.index = index;
            
            // Verificar que la imagen existe
            const imgPath = `JSON GOD OF WAR/${character.img}`;
            
            card.innerHTML = `
                <div class="card">
                    <div class="card-inner">
                        <div class="character-image">
                            <div class="type-indicator ${character.type}"></div>
                            <img src="${imgPath}" alt="${character.character}" onerror="this.src='images/default-card.webp'; this.onerror=null;">
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
                </div>
            `;
            
            // Añadir evento de clic para mostrar detalles
            card.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                currentIndex = index;
                updateCarousel();
                showCardDetails(filteredCharacters[index]);
            });
            
            carouselContainer.appendChild(card);
        });
        
        // Actualizar posición del carrusel
        updateCarouselPosition();
    }
    
    // Actualizar posición del carrusel
    function updateCarouselPosition() {
        const containerWidth = carouselContainer.parentElement.offsetWidth;
        const offset = (containerWidth / 2) - (cardWidth / 2) - (currentIndex * (cardWidth + 40));
        carouselContainer.style.left = `${offset}px`;
    }
    
    // Actualizar carrusel (activar carta actual)
    function updateCarousel() {
        // Desactivar todas las cartas
        document.querySelectorAll('.carousel-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Activar la carta actual
        const currentCard = document.querySelector(`.carousel-card[data-index="${currentIndex}"]`);
        if (currentCard) {
            currentCard.classList.add('active');
        }
        
        // Actualizar posición
        updateCarouselPosition();
        
        // Mostrar detalles de la carta actual
        showCardDetails(filteredCharacters[currentIndex]);
    }
    
    // Mostrar detalles de una carta
    function showCardDetails(character) {
        cardName.textContent = character.character;
        cardType.textContent = character.type === 'offensive' ? 'Ofensiva' : 'Defensiva';
        cardType.className = `type-value ${character.type === 'defensive' ? 'defensive' : ''}`;
        cardHealth.textContent = character.health;
        cardAttack.textContent = character.attackPower;
        cardSpecial.textContent = character.specialAbility.value;
        cardDescription.textContent = character.info;
        abilityName.textContent = character.specialAbility.name;
        abilityType.textContent = character.specialAbility.type === 'attack' ? 'Atac' : 'Defensa';
        abilityType.className = `ability-type ${character.specialAbility.type === 'defense' ? 'defense' : ''}`;
        
        // Descripción de la habilidad basada en el tipo
        if (character.specialAbility.type === 'attack') {
            abilityDescription.textContent = `Infligeix ${character.specialAbility.value} punts de dany a l'objectiu.`;
        } else {
            abilityDescription.textContent = `Restaura ${Math.floor(character.specialAbility.value / 2)} punts de salut.`;
        }
    }
    
    // Eventos de los botones de navegación
    prevButton.addEventListener('click', function() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    nextButton.addEventListener('click', function() {
        if (currentIndex < filteredCharacters.length - 1) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    // Evento para el filtro de tipo
    typeFilter.addEventListener('change', function() {
        const filterValue = this.value;
        
        if (filterValue === 'all') {
            filteredCharacters = [...characters];
        } else {
            filteredCharacters = characters.filter(character => character.type === filterValue);
        }
        
        currentIndex = 0;
        renderCarousel();
        
        if (filteredCharacters.length > 0) {
            showCardDetails(filteredCharacters[0]);
        }
    });
    
    // Ajustar carrusel al cambiar el tamaño de la ventana
    window.addEventListener('resize', updateCarouselPosition);
    
    // Inicializar
    loadCards();
});
