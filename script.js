// ===== VARIABLES GLOBALES =====
let registeredEmails = [];
let selectedDonationAmount = 0;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadEmails();
    createParticles();
    initializeFloatingAnimations();
    initializeScrollEffects();
    setupKeyboardShortcuts();
    logWelcomeMessage();
});

function initializeApp() {
    console.log('🗡️ Shadow Realms - Inicializando aplicación...');
    
    // Verificar si hay datos guardados
    const savedEmails = localStorage.getItem('shadowRealmsEmails');
    if (savedEmails) {
        try {
            registeredEmails = JSON.parse(savedEmails);
            console.log(`📧 ${registeredEmails.length} emails cargados desde almacenamiento local`);
        } catch (error) {
            console.error('Error al cargar emails:', error);
            registeredEmails = [];
        }
    }
}

// ===== SISTEMA DE NAVEGACIÓN =====
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const elementPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// ===== MENÚ MÓVIL =====
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ===== SISTEMA DE MODALES =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Cerrar menú móvil si está abierto
        closeMobileMenu();
        
        // Agregar event listener para cerrar con Escape
        document.addEventListener('keydown', handleModalKeyDown);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Remover event listener
        document.removeEventListener('keydown', handleModalKeyDown);
    }
}

function handleModalKeyDown(event) {
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// ===== SISTEMA DE REGISTRO DE EMAILS =====
function registerEmail(event) {
    event.preventDefault();
    const emailInput = event.target.querySelector('.email-input');
    const email = emailInput.value.trim().toLowerCase();
    const messageElement = document.getElementById('emailMessage');
    
    // Validación básica
    if (!isValidEmail(email)) {
        showEmailMessage('Por favor, ingresa un email válido.', 'error');
        return;
    }
    
    // Verificar si el email ya está registrado
    if (registeredEmails.includes(email)) {
        showEmailMessage('Este email ya está registrado en la Orden Sombría.', 'error');
        return;
    }
    
    // Registrar email
    registeredEmails.push(email);
    saveEmails();
    
    // Mostrar mensaje de éxito
    showEmailMessage('¡Bienvenido a la Orden Sombría! Te contactaremos pronto con noticias exclusivas y sorteos de armas legendarias.', 'success');
    
    // Limpiar formulario
    emailInput.value = '';
    
    // Actualizar contador en panel admin si está visible
    updateAdminStats();
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showEmailMessage(message, type) {
    const messageElement = document.getElementById('emailMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `email-message ${type}`;
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            messageElement.className = 'email-message';
        }, 5000);
    }
}

function saveEmails() {
    try {
        localStorage.setItem('shadowRealmsEmails', JSON.stringify(registeredEmails));
        console.log('📧 Emails guardados exitosamente');
    } catch (error) {
        console.error('Error al guardar emails:', error);
    }
}

function loadEmails() {
    try {
        const savedEmails = localStorage.getItem('shadowRealmsEmails');
        if (savedEmails) {
            registeredEmails = JSON.parse(savedEmails);
        }
    } catch (error) {
        console.error('Error al cargar emails:', error);
        registeredEmails = [];
    }
}

// ===== SISTEMA DE DONACIONES =====
function selectAmount(button, amount) {
    // Remover clase active de todos los botones
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Agregar clase active al botón seleccionado
    button.classList.add('active');
    selectedDonationAmount = amount;
    
    console.log(`💰 Cantidad seleccionada: $${amount} USD`);
}

function processDonation() {
    const linkInput = document.getElementById('donationLink');
    const link = linkInput.value.trim();
    
    // Validaciones
    if (!selectedDonationAmount) {
        alert('⚠️ Por favor, selecciona una cantidad para donar.');
        return;
    }
    
    if (!link) {
        alert('⚠️ Por favor, agrega un link de donación válido (PayPal, Ko-fi, Patreon, etc.).');
        linkInput.focus();
        return;
    }
    
    if (!isValidURL(link)) {
        alert('⚠️ Por favor, ingresa una URL válida.');
        linkInput.focus();
        return;
    }
    
    // Procesar donación
    try {
        window.open(link, '_blank');
        
        // Mostrar mensaje de agradecimiento
        const rewardMessage = getDonationReward(selectedDonationAmount);
        alert(`🙏 ¡Gracias por tu donación de $${selectedDonationAmount} USD!\n\n${rewardMessage}\n\nLas sombras te bendicen, noble guerrero.`);
        
        // Limpiar formulario
        resetDonationForm();
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
            closeModal('donationModal');
        }, 1000);
        
    } catch (error) {
        alert('❌ Error al procesar la donación. Por favor, verifica el enlace.');
        console.error('Error en donación:', error);
    }
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

function getDonationReward(amount) {
    if (amount >= 50) {
        return '🏆 Has desbloqueado: Tu nombre en los créditos + Mascota única "Shadow Wolf"';
    } else if (amount >= 25) {
        return '⚔️ Has desbloqueado: Arma Legendaria "Nightmare Blade"';
    } else if (amount >= 10) {
        return '✨ Has desbloqueado: Skin Exclusiva "Sombra Dorada"';
    } else if (amount >= 5) {
        return '🎮 Has desbloqueado: Acceso Beta Temprano';
    }
    return '🎁 ¡Gracias por tu apoyo!';
}

function resetDonationForm() {
    selectedDonationAmount = 0;
    document.getElementById('donationLink').value = '';
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ===== PANEL DE ADMINISTRADOR =====
function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.classList.add('active');
        updateAdminStats();
        updateEmailList();
        startAdminTimeout();
    }
}

function closeAdmin() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.classList.remove('active');
        clearTimeout(adminTimeout);
    }
}

let adminTimeout;
function startAdminTimeout() {
    clearTimeout(adminTimeout);
    adminTimeout = setTimeout(() => {
        closeAdmin();
    }, 30000); // 30 segundos
}

function updateAdminStats() {
    const emailCountElement = document.getElementById('emailCount');
    if (emailCountElement) {
        emailCountElement.textContent = registeredEmails.length;
    }
}

function updateEmailList() {
    const emailListElement = document.getElementById('emailList');
    if (!emailListElement) return;
    
    if (registeredEmails.length === 0) {
        emailListElement.innerHTML = '<div class="email-item" style="text-align: center; color: #888;">No hay emails registrados</div>';
        return;
    }
    
    const emailItems = registeredEmails.map((email, index) => 
        `<div class="email-item">${index + 1}. ${email}</div>`
    ).join('');
    
    emailListElement.innerHTML = emailItems;
}

function exportEmails() {
    if (registeredEmails.length === 0) {
        alert('📧 No hay emails para exportar.');
        return;
    }
    
    const data = {
        game: 'Shadow Realms',
        exportDate: new Date().toISOString(),
        totalEmails: registeredEmails.length,
        emails: registeredEmails
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow_realms_emails_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📥 ${registeredEmails.length} emails exportados exitosamente`);
}

function clearAllEmails() {
    if (registeredEmails.length === 0) {
        alert('📧 No hay emails para eliminar.');
        return;
    }
    
    const confirmation = confirm(`⚠️ ¿Estás seguro de que quieres eliminar todos los ${registeredEmails.length} emails registrados?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmation) {
        registeredEmails = [];
        localStorage.removeItem('shadowRealmsEmails');
        updateAdminStats();
        updateEmailList();
        
        alert('🗑️ Todos los emails han sido eliminados.');
        console.log('🗑️ Base de datos de emails limpiada');
    }
}

// ===== EFECTOS VISUALES =====
function createParticles() {
    const particleContainer = document.querySelector('.particle-bg');
    if (!particleContainer) return;
    
    const particleCount = window.innerWidth < 768 ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 1;
        const color = Math.random() > 0.5 ? '#ff6b6b' : '#8b0000';
        const duration = Math.random() * 10 + 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            opacity: ${Math.random() * 0.5 + 0.1};
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            animation: float ${duration}s infinite linear;
            pointer-events: none;
            box-shadow: 0 0 ${size * 2}px ${color};
        `;
        
        particleContainer.appendChild(particle);
    }
}

function initializeFloatingAnimations() {
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach((link, index) => {
        link.style.animationDelay = `${index * 0.2}s`;
        link.classList.add('floating');
    });
}

function initializeScrollEffects() {
    window.addEventListener('scroll', function() {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const hue = scrollPercent * 60; // De rojo a púrpura
        
        document.body.style.background = `linear-gradient(135deg, 
            hsl(${hue}, 50%, 5%) 0%, 
            hsl(${hue + 20}, 30%, 10%) 25%, 
            hsl(${hue + 40}, 40%, 15%) 50%, 
            hsl(${hue + 20}, 30%, 10%) 75%, 
            hsl(${hue}, 50%, 5%) 100%)`;
    });
}

// ===== FUNCIONES DE INTERACCIÓN =====
function playTrailer() {
    const trailerMessages = [
        '🎬 Trailer próximamente disponible!',
        '🔥 Las sombras aún están renderizando...',
        '⚔️ El trailer épico llegará pronto!',
        '🎥 Los desarrolladores están puliendo cada detalle...'
    ];
    
    const randomMessage = trailerMessages[Math.floor(Math.random() * trailerMessages.length)];
    
    // Crear modal personalizado para el trailer
    const trailerModal = document.createElement('div');
    trailerModal.className = 'modal active';
    trailerModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div class="modal-header">
                <h2 class="modal-title">🎬 Trailer</h2>
                <button class="modal-close" onclick="closeTrailerModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="font-size: 4rem; margin: 2rem 0;">🎭</div>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">${randomMessage}</p>
                <p>Mientras tanto, únete a nuestra orden para ser el primero en verlo cuando esté listo.</p>
                <button class="email-submit" onclick="scrollToSection('hero'); closeTrailerModal();" style="margin-top: 1rem;">
                    Unirse a la Orden
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(trailerModal);
    document.body.style.overflow = 'hidden';
    
    // Función para cerrar el modal del trailer
    window.closeTrailerModal = function() {
        document.body.removeChild(trailerModal);
        document.body.style.overflow = 'auto';
        delete window.closeTrailerModal;
    };
}

function showPrivacyInfo() {
    alert(`🛡️ POLÍTICA DE PRIVACIDAD - SHADOW REALMS

📧 Información que recopilamos:
• Solo tu email para comunicaciones del juego
• No recopilamos información personal adicional

🔒 Cómo protegemos tus datos:
• Los emails se almacenan localmente en tu dispositivo
• No compartimos información con terceros
• Solo usamos los emails para noticias y sorteos

📮 Comunicaciones:
• Noticias de desarrollo
• Sorteos de armas exclusivas
• Acceso anticipado a betas

❌ Puedes darte de baja en cualquier momento contactando: nightmare.studios.dev@gmail.com`);
}

// ===== ATAJOS DE TECLADO =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(event) {
    // Panel de administrador: Ctrl+Shift+A
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
        event.preventDefault();
        showAdminPanel();
        return;
    }
    
    // Konami Code para contenido secreto
    handleKonamiCode(event);
}

// ===== EASTER EGGS =====
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

function handleKonamiCode(event) {
    konamiCode.push(event.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        unlockSecretContent();
        konamiCode = []; // Reset
    }
}

function unlockSecretContent() {
    // Efectos visuales especiales
    document.body.style.filter = 'hue-rotate(180deg) saturate(1.5)';
    document.body.style.transition = 'filter 2s ease';
    
    // Mensaje especial
    const secretModal = document.createElement('div');
    secretModal.className = 'modal active';
    secretModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; text-align: center;">
            <div class="modal-header">
                <h2 class="modal-title">🗡️ CONTENIDO SECRETO DESBLOQUEADO</h2>
                <button class="modal-close" onclick="closeSecretModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="font-size: 5rem; margin: 1rem 0;">⚔️</div>
                <h3 style="color: #ff6b6b; margin-bottom: 1rem;">¡La "Espada de las Mil Sombras" te ha sido otorgada!</h3>
                <p style="font-size: 1.1rem; margin-bottom: 1rem;">
                    Has demostrado ser un verdadero Shadow Walker al descubrir los secretos ocultos.
                </p>
                <div style="background: rgba(139, 0, 0, 0.2); padding: 1rem; border-radius: 10px; margin: 1rem 0;">
                    <strong>🎁 Recompensa Secreta:</strong><br>
                    • Arma legendaria exclusiva<br>
                    • Título especial: "Maestro de las Sombras"<br>
                    • Skin única: "Guerrero del Código"<br>
                    • Acceso VIP a contenido especial
                </div>
                <p style="font-style: italic; color: #888;">
                    "Solo aquellos que dominan los antiguos códigos pueden despertar el verdadero poder."
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(secretModal);
    
    // Función para cerrar el modal secreto
    window.closeSecretModal = function() {
        document.body.removeChild(secretModal);
        document.body.style.filter = 'none';
        document.body.style.transition = '';
        delete window.closeSecretModal;
    };
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        if (document.body.contains(secretModal)) {
            window.closeSecretModal();
        }
    }, 10000);
    
    console.log('🎉 ¡Contenido secreto desbloqueado! Konami Code detectado.');
}

// ===== FUNCIONES DE UTILIDAD =====
function logWelcomeMessage() {
    console.log(`
    🗡️ SHADOW REALMS - DEVELOPER CONSOLE 🗡️
    
    ═══════════════════════════════════════════
    
    🎮 Comandos secretos disponibles:
    • Ctrl+Shift+A: Panel de administrador
    • Código Konami: ↑↑↓↓←→←→BA (Contenido secreto)
    • Scroll: Efectos dinámicos de fondo
    
    📧 Sistema de emails: ${registeredEmails.length} registrados
    
    🔧 ¿Interesado en unirte al desarrollo?
    📮 nightmare.studios.dev@gmail.com
    
    💀 "En las sombras encontramos la verdadera luz"
    
    ═══════════════════════════════════════════
    `);
}

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', function(event) {
    console.error('🚫 Error en Shadow Realms:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚫 Promise rechazada:', event.reason);
});

// ===== FUNCIONES DE RENDIMIENTO =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimizar el scroll
const optimizedScrollHandler = debounce(() => {
    initializeScrollEffects();
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

// ===== DETECCIÓN DE DISPOSITIVO =====
function isMobile() {
    return window.innerWidth <= 768;
}

function isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ===== ANIMACIONES ADICIONALES =====
function addHoverEffects() {
    const interactiveElements = document.querySelectorAll('.nav-item, .social-link, .amount-btn, .email-submit');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            if (!isTouch()) {
                this.style.transform = 'translateY(-2px) scale(1.05)';
            }
        });
        
        element.addEventListener('mouseleave', function() {
            if (!isTouch()) {
                this.style.transform = '';
            }
        });
    });
}

// ===== INICIALIZACIÓN DE EVENTOS ADICIONALES =====
window.addEventListener('load', function() {
    addHoverEffects();
    
    // Agregar loading animation
    document.body.classList.add('loaded');
    
    // Precargar imágenes importantes
    preloadImages();
});

function preloadImages() {
    const imagesToPreload = [
        // Agregar URLs de imágenes importantes aquí cuando las tengas
    ];
    
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// ===== FUNCIONES DE ANALYTICS (PREPARADO PARA FUTURO) =====
function trackEvent(eventName, data = {}) {
    // Preparado para integrar Google Analytics o similar
    console.log(`📊 Event tracked: ${eventName}`, data);
}

// ===== SISTEMA DE NOTIFICACIONES =====
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ff6b6b'};
        border-radius: 5px;
        color: white;
        z-index: 10001;
        max-width: 300px;
        backdrop-filter: blur(10px);
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// ===== SISTEMA DE CACHE SIMPLE =====
const cache = new Map();

function setCache(key, value, ttl = 300000) { // 5 minutos por defecto
    const expiry = Date.now() + ttl;
    cache.set(key, { value, expiry });
}

function getCache(key) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
    }
    
    return item.value;
}

// ===== EXPORT PARA TESTING (SI ES NECESARIO) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerEmail,
        isValidEmail,
        selectAmount,
        processDonation,
        showAdminPanel,
        exportEmails
    };
}