// Clase para gestionar avatares
class AvatarManager {
    constructor() {
        this.defaultAvatars = [
            { id: 'kratos', name: 'Kratos', img: 'JSON GOD OF WAR/characters_images/kratos.webp' },
            { id: 'atreus', name: 'Atreus', img: 'JSON GOD OF WAR/characters_images/atreus.webp' },
            { id: 'baldur', name: 'Baldur', img: 'JSON GOD OF WAR/characters_images/baldur.webp' },
            { id: 'freya', name: 'Freya', img: 'JSON GOD OF WAR/characters_images/freya.webp' },
            { id: 'mimir', name: 'Mimir', img: 'JSON GOD OF WAR/characters_images/mimir.webp' },
            { id: 'thor', name: 'Thor', img: 'JSON GOD OF WAR/characters_images/thor.webp' },
            { id: 'odin', name: 'Odin', img: 'JSON GOD OF WAR/characters_images/odin.webp' },
            { id: 'tyr', name: 'Týr', img: 'JSON GOD OF WAR/characters_images/týr.webp' }
        ];
        
        // Verificar que las imágenes existen y usar alternativas si no
        this.defaultAvatars.forEach(avatar => {
            const img = new Image();
            img.onerror = () => {
                console.warn(`Imagen no encontrada: ${avatar.img}. Usando alternativa.`);
                avatar.img = 'images/default-avatar.webp';
            };
            img.src = avatar.img;
        });
    }
    
    // Obtener todos los avatares predefinidos
    getDefaultAvatars() {
        return this.defaultAvatars;
    }
    
    // Guardar avatar personalizado para un usuario
    saveCustomAvatar(userId, imageData) {
        try {
            // Eliminar cualquier avatar predefinido previo
            localStorage.removeItem(`avatar_default_${userId}`);
            
            // Guardar en localStorage
            localStorage.setItem(`avatar_${userId}`, imageData);
            
            // Forzar una actualización de los avatares en todas las páginas
            localStorage.setItem('avatar_updated', Date.now());
            
            return true;
        } catch (error) {
            console.error('Error al guardar el avatar:', error);
            return false;
        }
    }
    
    // Obtener avatar de un usuario
    getUserAvatar(userId) {
        // Primero intentar obtener avatar personalizado
        const customAvatar = localStorage.getItem(`avatar_${userId}`);
        if (customAvatar) {
            return customAvatar;
        }
        
        // Si no hay avatar personalizado, devolver null (se usará el predeterminado)
        return null;
    }
    
    // Establecer avatar predefinido para un usuario
    setDefaultAvatar(userId, avatarId) {
        try {
            // Eliminar cualquier avatar personalizado previo
            localStorage.removeItem(`avatar_${userId}`);
            
            // Guardar el ID del avatar predefinido
            localStorage.setItem(`avatar_default_${userId}`, avatarId);
            
            // Forzar una actualización de los avatares en todas las páginas
            localStorage.setItem('avatar_updated', Date.now());
            
            return true;
        } catch (error) {
            console.error('Error al establecer el avatar predefinido:', error);
            return false;
        }
    }
    
    // Obtener avatar predefinido de un usuario
    getUserDefaultAvatar(userId) {
        const avatarId = localStorage.getItem(`avatar_default_${userId}`);
        if (avatarId) {
            const avatar = this.defaultAvatars.find(a => a.id === avatarId);
            if (avatar) {
                return avatar.img;
            }
        }
        
        // Si no hay avatar predefinido, devolver el primero
        return this.defaultAvatars[0].img;
    }
    
    // Aplicar avatar a un elemento DOM
    applyAvatarToElement(userId, element) {
        if (!element) return false;
        
        const avatarUrl = this.getAvatarUrl(userId);
        if (avatarUrl) {
            // Aplicar como background-image
            element.style.backgroundImage = `url('${avatarUrl}')`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            
            // Si hay una imagen dentro del elemento, ocultarla
            const imgElement = element.querySelector('img');
            if (imgElement) {
                imgElement.style.opacity = '0';
            }
            
            console.log(`Avatar aplicado para usuario ${userId}:`, avatarUrl);
            return true;
        }
        return false;
    }
    
    // Obtener la URL del avatar del usuario (personalizado o predefinido)
    getAvatarUrl(userId) {
        // Primero intentar obtener avatar personalizado
        const customAvatar = this.getUserAvatar(userId);
        if (customAvatar) {
            return customAvatar;
        }
        
        // Si no hay avatar personalizado, obtener el predefinido
        return this.getUserDefaultAvatar(userId);
    }
}

// Exportar la clase para usarla en otros archivos
window.AvatarManager = AvatarManager;
