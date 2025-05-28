document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el gestor de usuarios
    const userManager = new UserManager();
    
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
    const defaultAvatarsContainer = document.getElementById('defaultAvatars');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarUpload = document.getElementById('avatarUpload');
    const uploadButton = document.getElementById('uploadButton');
    const saveAvatarButton = document.getElementById('saveAvatarButton');
    const backButton = document.querySelector('.back-button');
    
    // Variable para almacenar la imagen seleccionada
    let selectedImageData = null;
    let selectedDefaultAvatar = null;
    
    // Cargar avatares predefinidos
    function loadDefaultAvatars() {
        const avatars = avatarManager.getDefaultAvatars();
        
        // Limpiar contenedor
        defaultAvatarsContainer.innerHTML = '';
        
        // Añadir cada avatar
        avatars.forEach(avatar => {
            const avatarElement = document.createElement('div');
            avatarElement.className = 'avatar-option';
            avatarElement.dataset.id = avatar.id;
            
            // Comprobar si este avatar es el seleccionado actualmente
            const currentAvatarUrl = avatarManager.getUserDefaultAvatar(currentUser.id);
            if (currentAvatarUrl === avatar.img) {
                avatarElement.classList.add('selected');
                selectedDefaultAvatar = avatar.id;
            }
            
            avatarElement.innerHTML = `
                <div class="avatar-image">
                    <img src="${avatar.img}" alt="${avatar.name}">
                </div>
                <div class="avatar-name">${avatar.name}</div>
            `;
            
            // Añadir evento de clic
            avatarElement.addEventListener('click', function() {
                // Deseleccionar todos los avatares
                document.querySelectorAll('.avatar-option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Seleccionar este avatar
                this.classList.add('selected');
                selectedDefaultAvatar = this.dataset.id;
                
                // Actualizar vista previa
                avatarPreview.src = avatar.img;
                selectedImageData = null;
                
                // Habilitar botón de guardar para avatares predefinidos también
                saveAvatarButton.disabled = false;
            });
            
            defaultAvatarsContainer.appendChild(avatarElement);
        });
    }
    
    // Evento para el botón de subir imagen
    uploadButton.addEventListener('click', function() {
        avatarUpload.click();
    });
    
    // Evento para cuando se selecciona un archivo
    avatarUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        
        if (file) {
            // Comprobar si es una imagen
            if (!file.type.startsWith('image/')) {
                showNotification('Si us plau, selecciona un arxiu d\'imatge vàlid', 'error');
                return;
            }
            
            // Comprobar tamaño (máximo 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showNotification('La imatge és massa gran. Mida màxima: 2MB', 'error');
                return;
            }
            
            // Leer el archivo como URL de datos
            const reader = new FileReader();
            reader.onload = function(e) {
                // Guardar los datos de la imagen
                selectedImageData = e.target.result;
                
                // Mostrar vista previa
                avatarPreview.src = selectedImageData;
                
                // Habilitar botón de guardar
                saveAvatarButton.disabled = false;
                
                // Deseleccionar avatares predefinidos
                document.querySelectorAll('.avatar-option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                selectedDefaultAvatar = null;
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Evento para guardar avatar (personalizado o predefinido)
    saveAvatarButton.addEventListener('click', function() {
        if (selectedImageData) {
            // Guardar avatar personalizado
            if (avatarManager.saveCustomAvatar(currentUser.id, selectedImageData)) {
                showNotification('Avatar personalitzat guardat correctament', 'success');
                // Deshabilitar botón después de guardar
                saveAvatarButton.disabled = true;
                
                // Forzar la actualización en otras páginas abiertas
                window.localStorage.setItem('avatar_updated', Date.now());
                console.log('Avatar personalizado guardado para usuario:', currentUser.id);
                
                // Aplicar el avatar al elemento de vista previa para confirmar que se ha guardado
                avatarManager.applyAvatarToElement(currentUser.id, document.querySelector('.avatar-preview-container'));
                
                // Redirigir al perfil después de un breve retraso
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else {
                showNotification('Error al guardar l\'avatar', 'error');
            }
        } else if (selectedDefaultAvatar) {
            // Guardar avatar predefinido
            if (avatarManager.setDefaultAvatar(currentUser.id, selectedDefaultAvatar)) {
                showNotification('Avatar predefinit guardat correctament', 'success');
                // Deshabilitar botón después de guardar
                saveAvatarButton.disabled = true;
                
                // Actualizar la vista previa con el avatar predefinido
                const selectedAvatar = avatarManager.getDefaultAvatars().find(a => a.id === selectedDefaultAvatar);
                if (selectedAvatar) {
                    avatarPreview.src = selectedAvatar.img;
                }
                
                // Forzar la actualización en otras páginas abiertas
                window.localStorage.setItem('avatar_updated', Date.now());
                console.log('Avatar predefinido guardado para usuario:', currentUser.id, 'Avatar ID:', selectedDefaultAvatar);
                
                // Aplicar el avatar al elemento de vista previa para confirmar que se ha guardado
                avatarManager.applyAvatarToElement(currentUser.id, document.querySelector('.avatar-preview-container'));
                
                // Redirigir al perfil después de un breve retraso
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else {
                showNotification('Error al guardar l\'avatar', 'error');
            }
        }
    });
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Mostrar con animación
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Cargar avatar actual
    const currentAvatar = avatarManager.getAvatarUrl(currentUser.id);
    if (currentAvatar) {
        avatarPreview.src = currentAvatar;
        
        // Desactivar el botón de guardar inicialmente
        saveAvatarButton.disabled = true;
    }
    
    // Añadir evento al botón de volver
    backButton.addEventListener('click', function(e) {
        // Si hay cambios sin guardar, preguntar al usuario
        if (!saveAvatarButton.disabled) {
            if (confirm('Tens canvis sense guardar. Vols sortir sense guardar?')) {
                return true; // Continuar con la navegación normal
            } else {
                e.preventDefault(); // Prevenir la navegación
                return false;
            }
        }
    });
    
    // Inicializar
    loadDefaultAvatars();
});
