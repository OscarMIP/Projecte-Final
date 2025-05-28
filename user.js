// Clase para gestionar usuarios del juego
class UserManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
    }

    // Cargar usuarios desde localStorage
    loadUsers() {
        const savedUsers = localStorage.getItem('warbornUsers');
        return savedUsers ? JSON.parse(savedUsers) : [];
    }

    // Guardar usuarios en localStorage
    saveUsers() {
        localStorage.setItem('warbornUsers', JSON.stringify(this.users));
    }

    // Registrar un nuevo usuario
    registerUser(username, email, password) {
        // Comprobar si el usuario ya existe
        if (this.users.some(user => user.username === username || user.email === email)) {
            return {
                success: false,
                message: 'El nom d\'usuari o correu electrònic ja existeix'
            };
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password, // En una aplicación real, la contraseña debería estar encriptada
            friends: [],
            friendRequests: [],
            stats: {
                gamesPlayed: 0,
                gamesWon: 0
            },
            createdAt: new Date().toISOString()
        };

        // Añadir a la lista de usuarios
        this.users.push(newUser);
        this.saveUsers();

        return {
            success: true,
            message: 'Usuari registrat correctament',
            userId: newUser.id
        };
    }

    // Iniciar sesión
    loginUser(usernameOrEmail, password) {
        const user = this.users.find(
            user => (user.username === usernameOrEmail || user.email === usernameOrEmail) && 
                    user.password === password
        );

        if (!user) {
            return {
                success: false,
                message: 'Nom d\'usuari o contrasenya incorrectes'
            };
        }

        // Guardar usuario actual en sesión
        this.currentUser = user;
        sessionStorage.setItem('currentUserId', user.id);

        return {
            success: true,
            message: 'Inici de sessió correcte',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                stats: user.stats,
                friends: user.friends
            }
        };
    }

    // Cerrar sesión
    logoutUser() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUserId');
        return {
            success: true,
            message: 'Sessió tancada correctament'
        };
    }

    // Obtener usuario actual
    getCurrentUser() {
        // Si no hay usuario en memoria, intentar recuperarlo de la sesión
        if (!this.currentUser) {
            const userId = sessionStorage.getItem('currentUserId');
            if (userId) {
                this.currentUser = this.users.find(user => user.id === userId);
            }
        }
        return this.currentUser;
    }

    // Buscar usuario por nombre de usuario
    findUserByUsername(username) {
        return this.users.find(user => 
            user.username.toLowerCase().includes(username.toLowerCase())
        );
    }

    // Enviar solicitud de amistad
    sendFriendRequest(targetUserId) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per enviar sol·licituds d\'amistat'
            };
        }

        // Encontrar usuario objetivo
        const targetUser = this.users.find(user => user.id === targetUserId);
        if (!targetUser) {
            return {
                success: false,
                message: 'Usuari no trobat'
            };
        }

        // Comprobar si ya son amigos
        if (this.currentUser.friends.includes(targetUserId)) {
            return {
                success: false,
                message: 'Ja sou amics'
            };
        }

        // Comprobar si ya hay una solicitud pendiente
        if (targetUser.friendRequests.includes(this.currentUser.id)) {
            return {
                success: false,
                message: 'Ja has enviat una sol·licitud d\'amistat a aquest usuari'
            };
        }

        // Añadir solicitud
        targetUser.friendRequests.push(this.currentUser.id);
        this.saveUsers();

        return {
            success: true,
            message: 'Sol·licitud d\'amistat enviada correctament'
        };
    }

    // Aceptar solicitud de amistad
    acceptFriendRequest(requesterId) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per acceptar sol·licituds d\'amistat'
            };
        }

        // Comprobar si existe la solicitud
        const requestIndex = this.currentUser.friendRequests.indexOf(requesterId);
        if (requestIndex === -1) {
            return {
                success: false,
                message: 'Sol·licitud d\'amistat no trobada'
            };
        }

        // Encontrar usuario solicitante
        const requesterUser = this.users.find(user => user.id === requesterId);
        if (!requesterUser) {
            // Eliminar solicitud si el usuario ya no existe
            this.currentUser.friendRequests.splice(requestIndex, 1);
            this.saveUsers();
            return {
                success: false,
                message: 'L\'usuari sol·licitant ja no existeix'
            };
        }

        // Añadir a ambos como amigos
        this.currentUser.friends.push(requesterId);
        requesterUser.friends.push(this.currentUser.id);

        // Eliminar la solicitud
        this.currentUser.friendRequests.splice(requestIndex, 1);
        this.saveUsers();

        return {
            success: true,
            message: 'Sol·licitud d\'amistat acceptada correctament'
        };
    }

    // Rechazar solicitud de amistad
    rejectFriendRequest(requesterId) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per rebutjar sol·licituds d\'amistat'
            };
        }

        // Comprobar si existe la solicitud
        const requestIndex = this.currentUser.friendRequests.indexOf(requesterId);
        if (requestIndex === -1) {
            return {
                success: false,
                message: 'Sol·licitud d\'amistat no trobada'
            };
        }

        // Eliminar la solicitud
        this.currentUser.friendRequests.splice(requestIndex, 1);
        this.saveUsers();

        return {
            success: true,
            message: 'Sol·licitud d\'amistat rebutjada correctament'
        };
    }

    // Obtener lista de amigos
    getFriends() {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per veure els teus amics'
            };
        }

        // Obtener detalles de los amigos
        const friendsList = this.currentUser.friends.map(friendId => {
            const friend = this.users.find(user => user.id === friendId);
            if (friend) {
                return {
                    id: friend.id,
                    username: friend.username,
                    stats: friend.stats
                };
            }
            return null;
        }).filter(friend => friend !== null);

        return {
            success: true,
            friends: friendsList
        };
    }

    // Obtener solicitudes de amistad pendientes
    getPendingFriendRequests() {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per veure les sol·licituds d\'amistat pendents'
            };
        }

        // Obtener detalles de las solicitudes
        const requests = this.currentUser.friendRequests.map(requesterId => {
            const requester = this.users.find(user => user.id === requesterId);
            if (requester) {
                return {
                    id: requester.id,
                    username: requester.username
                };
            }
            return null;
        }).filter(request => request !== null);

        return {
            success: true,
            requests
        };
    }

    // Actualizar estadísticas después de una partida
    updateStats(won) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per actualitzar les estadístiques'
            };
        }

        // Incrementar contador de partidas jugadas
        this.currentUser.stats.gamesPlayed++;

        // Si ganó, incrementar contador de victorias
        if (won) {
            this.currentUser.stats.gamesWon++;
        }

        // Guardar cambios
        this.saveUsers();

        return {
            success: true,
            stats: this.currentUser.stats
        };
    }

    // Obtener estadísticas del usuario actual
    getStats() {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per veure les teves estadístiques'
            };
        }

        return {
            success: true,
            stats: this.currentUser.stats
        };
    }
}

// Exportar la clase para usarla en otros archivos
window.UserManager = UserManager;
