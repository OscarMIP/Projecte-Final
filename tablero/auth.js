document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = new UserManager();
    
    // Referencias a los elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    
    // Cambiar entre pestañas de inicio de sesión y registro
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            authForms.forEach(form => form.classList.remove('active'));
            
            // Activar la pestaña seleccionada
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}Form`).classList.add('active');
            
            // Limpiar mensajes
            loginMessage.textContent = '';
            loginMessage.className = 'form-message';
            registerMessage.textContent = '';
            registerMessage.className = 'form-message';
        });
    });
    
    // Manejar envío del formulario de inicio de sesión
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validar campos
        if (!username || !password) {
            showMessage(loginMessage, 'Si us plau, omple tots els camps', 'error');
            return;
        }
        
        // Intentar iniciar sesión
        const result = userManager.loginUser(username, password);
        
        if (result.success) {
            showMessage(loginMessage, result.message, 'success');
            
            // Redirigir al menú principal después de un breve retraso
            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 1500);
        } else {
            showMessage(loginMessage, result.message, 'error');
        }
    });
    
    // Manejar envío del formulario de registro
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        
        // Validar campos
        if (!username || !email || !password || !passwordConfirm) {
            showMessage(registerMessage, 'Si us plau, omple tots els camps', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showMessage(registerMessage, 'Les contrasenyes no coincideixen', 'error');
            return;
        }
        
        // Validar formato de email con regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage(registerMessage, 'Si us plau, introdueix un correu electrònic vàlid', 'error');
            return;
        }
        
        // Intentar registrar usuario
        const result = userManager.registerUser(username, email, password);
        
        if (result.success) {
            showMessage(registerMessage, result.message, 'success');
            
            // Limpiar formulario
            registerForm.reset();
            
            // Cambiar a la pestaña de inicio de sesión después de un breve retraso
            setTimeout(() => {
                tabButtons[0].click();
            }, 1500);
        } else {
            showMessage(registerMessage, result.message, 'error');
        }
    });
    
    // Función para mostrar mensajes
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `form-message ${type}`;
    }
    
    // Comprobar si hay un usuario con sesión iniciada
    const currentUser = userManager.getCurrentUser();
    if (currentUser) {
        // Si ya hay sesión iniciada, redirigir al juego
        window.location.href = 'index.html';
    }
});
