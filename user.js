// Clase para gestionar usuarios del juego
class UserManager {
    constructor() {
        this.currentUser = null;
        this.apiUrl = 'http://localhost:3002/api';
    }

    // Cargar usuarios desde el servidor
    async loadUsers() {
        try {
            const response = await fetch(`${this.apiUrl}/users`);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    // Guardar usuario en el servidor
    async saveUser(userData) {
        try {
            const response = await fetch(`${this.apiUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error('Error al guardar usuario');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Registrar un nuevo usuario
    async registerUser(username, email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error en el registre'
                };
            }

            return {
                success: true,
                message: 'Registre completat correctament'
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                success: false,
                message: 'Error de connexió amb el servidor'
            };
        }
    }

    // Iniciar sesión
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Credencials incorrectes'
                };
            }
            this.currentUser = data.user;
            // Guardar usuario en sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                success: false,
                message: 'Error de connexió amb el servidor'
            };
        }
    }

    // Cerrar sesión
    logoutUser() {
        this.currentUser = null;
        // Limpiar toda la sesión
        sessionStorage.removeItem('currentUser');
        sessionStorage.clear();
        return {
            success: true,
            message: 'Sessió tancada correctament'
        };
    }

    // Obtener usuario actual
    getCurrentUser() {
        // Si no hay usuario en memoria, intentar recuperarlo de la sesión
        if (!this.currentUser) {
            const userJson = sessionStorage.getItem('currentUser');
            if (userJson) {
                this.currentUser = JSON.parse(userJson);
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
    async updateStats(won) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Has d\'iniciar sessió per actualitzar les estadístiques'
            };
        }

        try {
            const response = await fetch(`${this.apiUrl}/users/${this.currentUser.id}/stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ won })
            });

            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Error al actualitzar estadístiques'
                };
            }

            this.currentUser.stats = data.stats;
            return {
                success: true,
                stats: data.stats
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                success: false,
                message: 'Error de connexió amb el servidor'
            };
        }
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
