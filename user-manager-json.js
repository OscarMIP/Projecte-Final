// UserManagerJSON: gestiona usuarios usando un archivo JSON en vez de localStorage
class UserManagerJSON {
    constructor(jsonPath = 'JSON GOD OF WAR/users.json') {
        this.jsonPath = jsonPath;
        this.users = [];
        this.currentUser = null;
        this._loadUsersFromJSON();
    }

    async _loadUsersFromJSON() {
        try {
            const response = await fetch(this.jsonPath + '?v=' + Date.now()); // evitar cache
            if (!response.ok) throw new Error('No se pudo cargar users.json');
            this.users = await response.json();
        } catch (e) {
            this.users = [];
        }
    }

    async _saveUsersToJSON() {
        // Solo posible si tienes backend. Aquí solo se simula en frontend.
        // En un entorno real, deberías hacer un POST/PUT a un endpoint que escriba en el JSON.
        // Como workaround, guarda en localStorage también para persistencia local.
        localStorage.setItem('warbornUsersJSON', JSON.stringify(this.users));
    }

    // Para pruebas locales: cargar desde localStorage si existe
    async loadUsers() {
        await this._loadUsersFromJSON();
        const local = localStorage.getItem('warbornUsersJSON');
        if (local) {
            try {
                this.users = JSON.parse(local);
            } catch {}
        }
        return this.users;
    }

    async saveUsers() {
        await this._saveUsersToJSON();
    }

    async registerUser(username, email, password) {
        await this.loadUsers();
        if (this.users.some(u => u.username === username || u.email === email)) {
            return { success: false, message: 'El usuario o email ya existe' };
        }
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            profilePic: 'images/default-avatar.png',
            stats: { gamesPlayed: 0, gamesWon: 0 }
        };
        this.users.push(newUser);
        await this.saveUsers();
        return { success: true, userId: newUser.id };
    }

    async loginUser(usernameOrEmail, password) {
        await this.loadUsers();
        const user = this.users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);
        if (!user) return { success: false, message: 'Credenciales incorrectas' };
        this.currentUser = user;
        sessionStorage.setItem('currentUserId', user.id);
        return { success: true, user };
    }

    async getCurrentUser() {
        const userId = sessionStorage.getItem('currentUserId');
        if (!userId) return null;
        await this.loadUsers();
        this.currentUser = this.users.find(u => u.id === userId);
        return this.currentUser;
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
        await this.loadUsers();
        if (!this.currentUser) return { success: false, message: 'No hay usuario logueado' };
        this.currentUser.stats.gamesPlayed++;
        if (won) this.currentUser.stats.gamesWon++;
        const idx = this.users.findIndex(u => u.id === this.currentUser.id);
        if (idx !== -1) this.users[idx] = this.currentUser;
        await this.saveUsers();
        return { success: true, stats: this.currentUser.stats };
    }
}

window.UserManagerJSON = UserManagerJSON;
