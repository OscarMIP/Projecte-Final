// UserManagerJSON: gestiona usuarios usando un archivo JSON en vez de localStorage
class UserManagerJSON {
    constructor() {
        this.apiUrl = 'http://localhost:3002/api';
        this.currentUser = null;
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.apiUrl}/users`);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            this.users = data;
            return data;
        } catch (error) {
            console.error('Error:', error);
            // Intentar cargar desde localStorage como fallback
            const local = localStorage.getItem('warbornUsersJSON');
            if (local) {
                try {
                    this.users = JSON.parse(local);
                    return this.users;
                } catch {}
            }
            return [];
        }
    }

    async saveUsers() {
        try {
            const response = await fetch(`${this.apiUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.users)
            });
            if (!response.ok) throw new Error('Error al guardar usuarios');
            // Guardar en localStorage como backup
            localStorage.setItem('warbornUsersJSON', JSON.stringify(this.users));
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async registerUser(username, email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });
            const result = await response.json();
            if (!response.ok) {
                return { success: false, message: result.message || 'Error al registrar usuario' };
            }
            return result;
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    }

    async loginUser(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (!response.ok) {
                return { success: false, message: result.message || 'Credenciales incorrectas' };
            }
            if (result.success) {
                this.currentUser = result.user;
                sessionStorage.setItem('currentUserId', result.user.id);
            }
            return result;
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    }

    async getCurrentUser() {
        const userJson = sessionStorage.getItem('currentUser');
        if (!userJson) return null;
        try {
            this.currentUser = JSON.parse(userJson);
            return this.currentUser;
        } catch (error) {
            console.error('Error parsing user:', error);
            return null;
        }
    }

    async updateProfile({ username, email, profilePic }) {
        await this.loadUsers();
        if (!this.currentUser) return { success: false, message: 'No hay usuario logueado' };
        if (username) this.currentUser.username = username;
        if (email) this.currentUser.email = email;
        if (profilePic) this.currentUser.profilePic = profilePic;
        // Actualizar en array global
        const idx = this.users.findIndex(u => u.id === this.currentUser.id);
        if (idx !== -1) this.users[idx] = this.currentUser;
        await this.saveUsers();
        return { success: true };
    }

    async updateStats(won) {
        if (!this.currentUser) {
            return { success: false, message: 'No hay usuario logueado' };
        }

        try {
            const response = await fetch(`${this.apiUrl}/users/${this.currentUser.id}/stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ won })
            });

            if (!response.ok) throw new Error('Error al actualizar estadísticas');
            const data = await response.json();
            this.currentUser.stats = data.stats;
            return { success: true, stats: data.stats };
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    }
}

window.UserManagerJSON = UserManagerJSON;
