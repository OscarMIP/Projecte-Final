document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = new UserManagerJSON();
    
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
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validar campos
        if (!email || !password) {
            showMessage(loginMessage, 'Si us plau, omple tots els camps', 'error');
            return;
        }
        
        // Intentar iniciar sesión
        const result = await userManager.loginUser(email, password);
        
        if (result.success) {
            showMessage(loginMessage, 'Inici de sessió correcte', 'success');
            
            // Guardar usuario en sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // Redirigir al menú principal inmediatamente
            window.location.replace('menu.html');
        } else {
            showMessage(loginMessage, result.message, 'error');
        }
    });
    
    // Manejar envío del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
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
        const result = await userManager.registerUser(username, email, password);
        
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
    const userJson = sessionStorage.getItem('currentUser');
    if (userJson) {
        // Si ya hay sesión iniciada, redirigir al menú
        window.location.replace('menu.html');
    }
});
