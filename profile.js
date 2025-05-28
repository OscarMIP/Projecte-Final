document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = new UserManagerJSON();
    
    // Inicializar el gestor de avatares
    const avatarManager = new AvatarManager();
    
    // Comprobar si hay un usuario con sesión iniciada
    const currentUser = userManager.getCurrentUser();
    if (!currentUser) {
        // Si no hay sesión iniciada, redirigir a la página de autenticación
        window.location.href = 'auth.html';
        return;
    }
    
    // Referencias a los elementos del DOM
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    const gamesPlayed = document.getElementById('gamesPlayed');
    const gamesWon = document.getElementById('gamesWon');
    const winRate = document.getElementById('winRate');
    const userAvatar = document.getElementById('userAvatar');
    const avatarInput = document.getElementById('avatarInput');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const friendsList = document.getElementById('friendsList');
    const friendRequests = document.getElementById('friendRequests');
    const searchButton = document.getElementById('searchButton');
    const searchUsername = document.getElementById('searchUsername');

    // Botó "Tornar al menú"
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.onclick = function() {
            window.location.href = 'menu.html';
        };
    }
    const searchResults = document.getElementById('searchResults');
    const logoutButton = document.getElementById('logoutButton');
    
    // Mostrar información del usuario
    // Mostrar información del usuario
    // Rellenar campos editables
    usernameInput.value = currentUser.username || '';
    emailInput.value = currentUser.email || '';

    // Mostrar estadísticas desde JSON
    const stats = currentUser.stats || { gamesPlayed: 0, gamesWon: 0 };
    gamesPlayed.textContent = stats.gamesPlayed;
    gamesWon.textContent = stats.gamesWon;
    
    // Mostrar avatar del usuario
    if (currentUser.profilePic) {
        userAvatar.src = currentUser.profilePic;
    }
    
    // Guardar cambios en el perfil
    const profileForm = document.getElementById('profileForm');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        saveProfileBtn.disabled = true;
        const newUsername = usernameInput.value.trim();
        const newEmail = emailInput.value.trim();
        let newProfilePic = userAvatar.src;
        // Actualizar datos
        const res = await userManager.updateProfile({ username: newUsername, email: newEmail, profilePic: newProfilePic });
        if (res.success) {
            showNotification('Perfil actualitzat correctament', 'success');
        } else {
            showNotification('Error al actualitzar el perfil', 'error');
        }
        saveProfileBtn.disabled = false;
    });

    // Cambiar avatar
    changeAvatarBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                userAvatar.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Escuchar cambios en el avatar (desde otras páginas)
    window.addEventListener('storage', function(event) {
        if (event.key === 'avatar_updated') {
            console.log('Evento de actualización de avatar detectado');
            // Actualizar el avatar si ha cambiado
            if (userAvatarContainer) {
                const success = avatarManager.applyAvatarToElement(currentUser.id, userAvatarContainer);
                console.log('Avatar actualizado en perfil:', success);
                
                // Mostrar notificación de actualización
                showNotification('Avatar actualitzat correctament', 'success');
            }
        }
    });
    
    const winPercentage = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;
winRate.textContent = `${winPercentage}%`;
// Si tienes otros elementos para partidas jugadas/ganadas, actualízalos aquí también
// Por ejemplo:
// victoriesElement.textContent = stats.gamesWon;
// gamesPlayedElement.textContent = stats.gamesPlayed;

    
    // Cambiar entre pestañas (robusto y con depuración)
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Desactivar todas las pestañas y paneles
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Activar la pestaña seleccionada
            this.classList.add('active');
            const tabId = this.dataset.tab;
            const panel = document.getElementById(`${tabId}Panel`);
            if (panel) {
                panel.classList.add('active');
            } else {
                console.warn(`No se encontró el panel con id: ${tabId}Panel`);
            }

            // Cargar contenido específico de la pestaña
            if (tabId === 'friends') {
                loadFriends();
            } else if (tabId === 'requests') {
                loadFriendRequests();
            }
        });
    });
    
    // Cargar lista de amigos
    function loadFriends() {
        const result = userManager.getFriends();
        
        if (result.success && result.friends.length > 0) {
            // Mostrar lista de amigos
            friendsList.innerHTML = '';
            
            result.friends.forEach(friend => {
                const winPercentage = friend.stats.gamesPlayed > 0 
                    ? Math.round((friend.stats.gamesWon / friend.stats.gamesPlayed) * 100) 
                    : 0;
                
                const friendElement = document.createElement('div');
                friendElement.className = 'friend-item';
                
                // Inicializar el gestor de avatares para mostrar avatares de amigos
                const avatarUrl = avatarManager.getAvatarUrl(friend.id) || 'images/default-avatar.webp';
                
                friendElement.innerHTML = `
                    <div class="friend-info">
                        <div class="friend-avatar" style="background-image: url('${avatarUrl}'); background-size: cover; background-position: center;">
                        </div>
                        <div class="friend-name">${friend.username}</div>
                    </div>
                    <div class="friend-stats">
                        <span class="stat-item">Partides: ${friend.stats.gamesPlayed}</span>
                        <span class="stat-item">Victories: ${friend.stats.gamesWon}</span>
                        <span class="stat-item">Ratio: ${winPercentage}%</span>
                    </div>
                    <button class="invite-button" data-id="${friend.id}">Convidar a jugar</button>
                `;
                
                friendsList.appendChild(friendElement);
                
                // Añadir evento al botón de invitar
                const inviteButton = friendElement.querySelector('.invite-button');
                inviteButton.addEventListener('click', function() {
                    const friendId = this.dataset.id;
                    showNotification(`Invitació enviada a ${friend.username}!`, 'success');
                    // Aquí se podría implementar la lógica para enviar invitaciones
                });
            });
        } else {
            // Mostrar mensaje de que no hay amigos
            friendsList.innerHTML = `
                <div class="empty-state">
                    <p>Encara no tens amics.</p>
                    <p>Afegeix amics utilitzant la pestanya "Afegir amics".</p>
                </div>
            `;
        }
    }
    
    // Cargar solicitudes de amistad
    function loadFriendRequests() {
        const result = userManager.getPendingFriendRequests();
        
        if (result.success && result.requests.length > 0) {
            // Mostrar solicitudes de amistad
            friendRequests.innerHTML = '';
            
            result.requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.className = 'request-item';
                
                // Inicializar el gestor de avatares para mostrar avatares de solicitantes
                const avatarManager = new AvatarManager();
                const avatarUrl = avatarManager.getAvatarUrl(request.id) || 'images/default-avatar.webp';
                
                requestElement.innerHTML = `
                    <div class="request-info">
                        <div class="request-avatar" style="background-image: url('${avatarUrl}'); background-size: cover; background-position: center;">
                        </div>
                        <div class="request-name">${request.username}</div>
                    </div>
                    <div class="request-actions">
                        <button class="accept-button" data-id="${request.id}">Acceptar</button>
                        <button class="reject-button" data-id="${request.id}">Rebutjar</button>
                    </div>
                `;
                
                friendRequests.appendChild(requestElement);
            });
            
            // Añadir eventos a los botones de aceptar/rechazar
            document.querySelectorAll('.accept-button').forEach(button => {
                button.addEventListener('click', function() {
                    const requesterId = this.dataset.id;
                    const result = userManager.acceptFriendRequest(requesterId);
                    
                    if (result.success) {
                        // Recargar listas
                        loadFriendRequests();
                        loadFriends();
                        
                        // Mostrar mensaje de éxito
                        showNotification('Sol·licitud d\'amistat acceptada correctament', 'success');
                    } else {
                        // Mostrar mensaje de error
                        showNotification(result.message || 'Error al acceptar la sol·licitud', 'error');
                    }
                });
            });
            
            document.querySelectorAll('.reject-button').forEach(button => {
                button.addEventListener('click', function() {
                    const requesterId = this.dataset.id;
                    const result = userManager.rejectFriendRequest(requesterId);
                    
                    if (result.success) {
                        // Recargar lista
                        loadFriendRequests();
                        
                        // Mostrar mensaje de éxito
                        showNotification('Sol·licitud d\'amistat rebutjada correctament', 'success');
                    } else {
                        // Mostrar mensaje de error
                        showNotification(result.message || 'Error al rebutjar la sol·licitud', 'error');
                    }
                });
            });
        } else {
            // Mostrar mensaje de que no hay solicitudes
            friendRequests.innerHTML = `
                <div class="empty-state">
                    <p>No tens sol·licituds d'amistat pendents.</p>
                    <p>Quan algú t'enviï una sol·licitud, apareixerà aquí.</p>
                </div>
            `;
        }
    }
    
    // Buscar usuarios para añadir como amigos
    searchButton.addEventListener('click', function() {
        const username = searchUsername.value.trim();
        
        if (!username) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <p>Introdueix un nom d'usuari per buscar.</p>
                </div>
            `;
            return;
        }
        
        const user = userManager.findUserByUsername(username);
        
        if (user && user.id !== currentUser.id) {
            // Comprobar si ya es amigo o si ya hay una solicitud pendiente
            const isFriend = currentUser.friends.includes(user.id);
            const requestSent = user.friendRequests && user.friendRequests.includes(currentUser.id);
            
            // Inicializar el gestor de avatares para mostrar avatar del usuario
            const avatarManager = new AvatarManager();
            const avatarUrl = avatarManager.getAvatarUrl(user.id) || 'images/default-avatar.webp';
            
            // Mostrar resultado
            searchResults.innerHTML = `
                <div class="user-result">
                    <div class="friend-info">
                        <div class="friend-avatar" style="background-image: url('${avatarUrl}'); background-size: cover; background-position: center;">
                        </div>
                        <div class="friend-name">${user.username}</div>
                    </div>
                    ${isFriend ? 
                        '<button class="friend-button" disabled>Ja sou amics</button>' : 
                        requestSent ? 
                        '<button class="request-sent-button" disabled>Sol·licitud enviada</button>' : 
                        `<button class="add-friend-button" data-id="${user.id}">Afegir amic</button>`
                    }
                </div>
            `;
            
            // Añadir evento al botón de añadir amigo (solo si no es amigo y no hay solicitud)
            if (!isFriend && !requestSent) {
                document.querySelector('.add-friend-button').addEventListener('click', function() {
                    const targetUserId = this.dataset.id;
                    const result = userManager.sendFriendRequest(targetUserId);
                    
                    if (result.success) {
                        // Mostrar mensaje de éxito
                        showNotification(result.message, 'success');
                        
                        // Deshabilitar botón
                        this.disabled = true;
                        this.textContent = 'Sol·licitud enviada';
                        this.className = 'request-sent-button';
                    } else {
                        // Mostrar mensaje de error
                        showNotification(result.message, 'error');
                    }
                });
            }
        } else if (user && user.id === currentUser.id) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <p>No pots afegir-te a tu mateix com a amic.</p>
                </div>
            `;
        } else {
            // Mostrar mensaje de que no se encontró el usuario
            searchResults.innerHTML = `
                <div class="empty-state">
                    <p>No s'ha trobat cap usuari amb aquest nom.</p>
                </div>
            `;
        }
    });
    
    // Volver al menú principal
    backButton.addEventListener('click', function() {
        window.location.href = 'menu.html';
    });
    
    // Cerrar sesión
    logoutButton.addEventListener('click', function() {
        userManager.logoutUser();
        window.location.href = 'auth.html';
    });
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'success') {
        // Comprobar si ya existe una notificación
        let notification = document.querySelector('.notification');
        
        if (notification) {
            // Si ya existe, eliminarla
            notification.remove();
        }
        
        // Crear nueva notificación
        notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Añadir al DOM
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Añadir estilos CSS para notificaciones
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.success {
            background: #2ecc71;
            box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
        }
        
        .notification.error {
            background: #e74c3c;
            box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
        }
    `;
    document.head.appendChild(style);
    
    // Cargar amigos al inicio
    loadFriends();
    loadFriendRequests();
});
