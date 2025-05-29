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
    
    // Referencias a los elementos del DOM
    const playOption = document.getElementById('playOption');
    const profileOption = document.getElementById('profileOption');
    const friendsOption = document.getElementById('friendsOption');
    const cardsOption = document.getElementById('cardsOption');
    const localGameOption = document.getElementById('localGameOption');
    const onlineGameOption = document.getElementById('onlineGameOption');
    const playSubmenu = document.getElementById('playSubmenu');
    const closeSubmenuButton = document.querySelector('.close-submenu-button');
    const logoutButton = document.getElementById('logoutButton');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const gamesWonDisplay = document.getElementById('gamesWonDisplay');
    const gamesPlayedDisplay = document.getElementById('gamesPlayedDisplay');
    
    // Mostrar información del usuario
    usernameDisplay.textContent = currentUser.username;
    gamesWonDisplay.textContent = currentUser.stats.gamesWon;
    gamesPlayedDisplay.textContent = currentUser.stats.gamesPlayed;
    
    // Evento para la opción de jugar
    playOption.addEventListener('click', function() {
        playSubmenu.classList.add('active');
    });
    
    // Evento para cerrar el submenú
    closeSubmenuButton.addEventListener('click', function() {
        playSubmenu.classList.remove('active');
    });
    
    // Evento para la opción de perfil
    profileOption.addEventListener('click', function() {
        window.location.href = 'profile.html';
    });
    
    // Evento para la opción de amigos (redirige a la sección de amigos del perfil)
    friendsOption.addEventListener('click', function() {
        // Guardar la pestaña a mostrar en sessionStorage
        sessionStorage.setItem('profileTab', 'friends');
        window.location.href = 'profile.html';
    });
    
    // Evento para la opción de cartas
    cardsOption.addEventListener('click', function() {
        window.location.href = 'cards-gallery.html';
    });
    
    // Evento para la opción de juego local
    localGameOption.addEventListener('click', function() {
        window.location.href = 'game-board.html';
    });
    
    // Evento para la opción de juego online
    onlineGameOption.addEventListener('click', function() {
        window.location.href = 'lobby.html';
    });
    
    // Evento para cerrar sesión
    logoutButton.addEventListener('click', function() {
        // Primero limpiar la sesión
        userManager.logoutUser();
        // Redirigir sin posibilidad de volver atrás
        window.location.replace('auth.html');
    });
    
    // Cerrar submenú al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === playSubmenu) {
            playSubmenu.classList.remove('active');
        }
    });
    
    // Crear imágenes de iconos si no existen
    createDefaultImages();
    
    // Función para crear imágenes por defecto si no existen
    function createDefaultImages() {
        const defaultImages = [
            { name: 'play-icon.webp', color: '#e63946' },
            { name: 'profile-icon.webp', color: '#457b9d' },
            { name: 'friends-icon.webp', color: '#2a9d8f' },
            { name: 'cards-icon.webp', color: '#f4a261' },
            { name: 'local-icon.webp', color: '#e63946' },
            { name: 'online-icon.webp', color: '#457b9d' },
            { name: 'default-avatar.webp', color: '#1d3557' },
            { name: 'logo.webp', color: '#e63946' }
        ];
        
        // Comprobar si existe la carpeta de imágenes
        const img = new Image();
        img.src = 'images/play-icon.webp';
        img.onerror = function() {
            console.log('Usando iconos por defecto');
            
            // Usar iconos de texto como alternativa
            document.querySelectorAll('.option-icon img').forEach(icon => {
                const name = icon.alt;
                const parent = icon.parentElement;
                
                // Crear elemento de texto
                parent.innerHTML = '';
                const textIcon = document.createElement('div');
                textIcon.className = 'text-icon';
                textIcon.textContent = name.charAt(0);
                
                // Encontrar el color correspondiente
                const imgName = icon.src.split('/').pop();
                const defaultImage = defaultImages.find(img => img.name === imgName);
                if (defaultImage) {
                    textIcon.style.backgroundColor = defaultImage.color;
                }
                
                parent.appendChild(textIcon);
            });
            
            // Estilo para iconos de texto
            const style = document.createElement('style');
            style.textContent = `
                .text-icon {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    color: white;
                    border-radius: 50%;
                }
            `;
            document.head.appendChild(style);
        };
    }
});
