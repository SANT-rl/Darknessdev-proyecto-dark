const firebaseConfig = {
    apiKey: "tu-api-key-real-aqui",
    authDomain: "tu-project-id.firebaseapp.com", 
    databaseURL: "https://el-silencio-de-los-dioses-default-rtdb.firebaseio.com",
    projectId: "tu-project-id",
    storageBucket: "tu-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};

// Inicializar Firebase
let database;
let isFirebaseConnected = false;

try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    isFirebaseConnected = true;
    console.log('🔥 Firebase conectado exitosamente');
} catch (error) {
    console.error('🚫 Error conectando Firebase:', error);
    isFirebaseConnected = false;
}

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
    console.log('🗡️ El Silencio De Los Dioses - Inicializando aplicación...');
    
    if (isFirebaseConnected) {
        // Cargar emails desde Firebase
        loadEmailsFromFirebase();
    } else {
        // Fallback: cargar desde localStorage
        loadEmailsFromLocal();
    }
}

// ===== FUNCIONES DE FIREBASE =====
async function loadEmailsFromFirebase() {
    try {
        const emailsRef = database.ref('emails');
        
        emailsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convertir objeto Firebase a array
                registeredEmails = Object.values(data).map(item => item.email);
                console.log(`🔥 ${registeredEmails.length} emails cargados desde Firebase`);
                updateFirebaseStatus('🟢 Conectado');
            } else {
                registeredEmails = [];
                updateFirebaseStatus('🟢 Conectado (vacío)');
            }
            updateAdminStats();
        });
        
    } catch (error) {
        console.error('🚫 Error cargando emails de Firebase:', error);
        updateFirebaseStatus('🔴 Error');
        // Fallback a localStorage
        loadEmailsFromLocal();
    }
}

async function saveEmailToFirebase(email) {
    if (!isFirebaseConnected) {
        throw new Error('Firebase no está conectado');
    }
    
    try {
        const emailData = {
            email: email,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            date: new Date().toISOString()
        };
        
        // Crear referencia única
        const newEmailRef = database.ref('emails').push();
        await newEmailRef.set(emailData);
        
        console.log('📧 Email guardado en Firebase:', email);
        return true;
    } catch (error) {
        console.error('🚫 Error guardando email en Firebase:', error);
        throw error;
    }
}

function updateFirebaseStatus(status) {
    const statusElement = document.getElementById('firebaseStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// ===== FUNCIONES DE BACKUP LOCAL =====
function loadEmailsFromLocal() {
    try {
        const savedEmails = localStorage.getItem('elSilencioEmails');
        if (savedEmails) {
            registeredEmails = JSON.parse(savedEmails);
            console.log(`💾 ${registeredEmails.length} emails cargados desde localStorage`);
        }
        updateFirebaseStatus('🟡 Solo local');
    } catch (error) {
        console.error('Error cargando emails locales:', error);
        registeredEmails = [];
    }
}

function saveEmailToLocal(email) {
    try {
        registeredEmails.push(email);
        localStorage.setItem('elSilencioEmails', JSON.stringify(registeredEmails));
        console.log('💾 Email guardado localmente:', email);
    } catch (error) {
        console.error('Error guardando email localmente:', error);
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
        closeMobileMenu();
        document.addEventListener('keydown', handleModalKeyDown);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
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

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// ===== SISTEMA DE REGISTRO DE EMAILS =====
async function registerEmail(event) {
    event.preventDefault();
    const emailInput = event.target.querySelector('.email-input');
    const email = emailInput.value.trim().toLowerCase();
    
    // Validación básica
    if (!isValidEmail(email)) {
        showEmailMessage('Por favor, ingresa un email válido.', 'error');
        return;
    }
    
    // Verificar si el email ya está registrado
    if (registeredEmails.includes(email)) {
        showEmailMessage('Este email ya está registrado para el sorteo.', 'error');
        return;
    }
    
    // Mostrar loading
    showEmailMessage('Registrando email...', 'info');
    
    try {
        if (isFirebaseConnected) {
            // Guardar en Firebase
            await saveEmailToFirebase(email);
        } else {
            // Guardar solo localmente
            saveEmailToLocal(email);
        }
        
        // Mostrar mensaje de éxito
        const successMessage = isFirebaseConnected 
            ? '¡Registrado exitosamente! Participarás en todos los sorteos y recibirás noticias exclusivas.'
            : '¡Registrado localmente! Para participar en sorteos globales, intenta más tarde cuando tengamos conexión.';
            
        showEmailMessage(successMessage, 'success');
        
        // Limpiar formulario
        emailInput.value = '';
        
    } catch (error) {
        console.error('Error registrando email:', error);
        
        // Intentar guardar localmente como backup
        try {
            saveEmailToLocal(email);
            showEmailMessage('Email guardado localmente. Se sincronizará cuando haya conexión.', 'success');
            emailInput.value = '';
        } catch (localError) {
            showEmailMessage('Error al registrar email. Inténtalo de nuevo.', 'error');
        }
    }
    
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
        
        // Auto-ocultar después de 5 segundos (excepto para loading)
        if (type !== 'info') {
            setTimeout(() => {
                messageElement.className = 'email-message';
            }, 5000);
        }
    }
}

// ===== SISTEMA DE DONACIONES =====
function selectAmount(button, amount) {
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    button.classList.add('active');
    selectedDonationAmount = amount;
    console.log(`💰 Cantidad seleccionada: $${amount} USD`);
}

function processDonation() {
    const linkInput = document.getElementById('donationLink');
    const link = linkInput.value.trim();
    
    if (!selectedDonationAmount) {
        alert('⚠️ Por favor, selecciona una cantidad para donar.');
        return;
    }
    
    if (!link) {
        alert('⚠️ Por favor, agrega un link de donación válido.');
        linkInput.focus();
        return;
    }
    
    if (!isValidURL(link)) {
        alert('⚠️ Por favor, ingresa una URL válida.');
        linkInput.focus();
        return;
    }
    
    try {
        window.open(link, '_blank');
        const rewardMessage = getDonationReward(selectedDonationAmount);
        alert(`🙏 ¡Gracias por tu donación de $${selectedDonationAmount} USD!\n\n${rewardMessage}\n\nTu apoyo hace posible El Silencio De Los Dioses.`);
        
        resetDonationForm();
        setTimeout(() => closeModal('donationModal'), 1000);
        
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
    }, 30000);
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
        game: 'El Silencio De Los Dioses',
        studio: 'Esquivel Studio',
        exportDate: new Date().toISOString(),
        totalEmails: registeredEmails.length,
        firebaseConnected: isFirebaseConnected,
        emails: registeredEmails
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el_silencio_emails_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📥 ${registeredEmails.length} emails exportados exitosamente`);
}

function syncEmails() {
    if (!isFirebaseConnected) {
        alert('🚫 Firebase no está conectado. No se puede sincronizar.');
        return;
    }
    
    alert('🔄 Sincronizando con Firebase...');
    loadEmailsFromFirebase();
}

async function clearAllEmails() {
    if (registeredEmails.length === 0) {
        alert('📧 No hay emails para eliminar.');
        return;
    }
    
    const confirmation = confirm(`⚠️ ¿Estás seguro de que quieres eliminar todos los ${registeredEmails.length} emails registrados?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmation) return;
    
    try {
        if (isFirebaseConnected) {
            // Eliminar de Firebase
            await database.ref('emails').remove();
            console.log('🔥 Emails eliminados de Firebase');
        }
        
        // Eliminar localmente
        localStorage.removeItem('elSilencioEmails');
        registeredEmails = [];
        
        updateAdminStats();
        updateEmailList();
        
        alert('🗑️ Todos los emails han sido eliminados.');
        
    } catch (error) {
        console.error('Error eliminando emails:', error);
        alert('❌ Error al eliminar emails. Inténtalo de nuevo.');
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
        const hue = scrollPercent * 60;
        
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
        'Trailer próximamente disponible!',
        'El equipo está puliendo cada detalle...',
        'El trailer épico llegará pronto!',
        'Los desarrolladores están trabajando en ello...'
    ];
    
    const randomMessage = trailerMessages[Math.floor(Math.random() * trailerMessages.length)];
    
    const trailerModal = document.createElement('div');
    trailerModal.className = 'modal active';
    trailerModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div class="modal-header">
                <h2 class="modal-title">Trailer</h2>
                <button class="modal-close" onclick="closeTrailerModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="font-size: 4rem; margin: 2rem 0;">🎭</div>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">${randomMessage}</p>
                <p>Mientras tanto, únete al sorteo para ser el primero en verlo cuando esté listo.</p>
                <button class="email-submit" onclick="scrollToSection('hero'); closeTrailerModal();" style="margin-top: 1rem;">
                    Unirse al Sorteo
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(trailerModal);
    document.body.style.overflow = 'hidden';
    
    window.closeTrailerModal = function() {
        document.body.removeChild(trailerModal);
        document.body.style.overflow = 'auto';
        delete window.closeTrailerModal;
    };
}

function showPrivacyInfo() {
    alert(`POLÍTICA DE PRIVACIDAD - EL SILENCIO DE LOS DIOSES

Información que recopilamos:
• Solo tu email para comunicaciones del juego
• Fecha y hora de registro
• No recopilamos información personal adicional

Cómo protegemos tus datos:
• Almacenamiento seguro en Firebase (Google)
• No compartimos información con terceros
• Solo usamos los emails para noticias y sorteos

Comunicaciones:
• Noticias de desarrollo
• Sorteos de contenido exclusivo
• Acceso anticipado a betas

Puedes darte de baja en cualquier momento contactando al equipo a través de Discord.`);
}

// ===== ATAJOS DE TECLADO =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(event) {
    if (event.ctrlKey && event.altKey && event.code === 'KeyA') {
        event.preventDefault();
        showAdminPanel();
        return;
    }
    
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
        konamiCode = [];
    }
}

function unlockSecretContent() {
    document.body.style.filter = 'hue-rotate(180deg) saturate(1.5)';
    document.body.style.transition = 'filter 2s ease';
    
    const secretModal = document.createElement('div');
    secretModal.className = 'modal active';
    secretModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; text-align: center;">
            <div class="modal-header">
                <h2 class="modal-title">CONTENIDO SECRETO DESBLOQUEADO</h2>
                <button class="modal-close" onclick="closeSecretModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="font-size: 5rem; margin: 1rem 0;">⚔️</div>
                <h3 style="color: #ff6b6b; margin-bottom: 1rem;">¡El "Báculo de los Dioses Silenciosos" te ha sido otorgado!</h3>
                <p style="font-size: 1.1rem; margin-bottom: 1rem;">
                    Has demostrado ser un verdadero conocedor de los secretos ocultos.
                </p>
                <div style="background: rgba(139, 0, 0, 0.2); padding: 1rem; border-radius: 10px; margin: 1rem 0;">
                    <strong>Recompensa Secreta:</strong><br>
                    • Arma legendaria exclusiva<br>
                    • Título especial: "Guardián de los Códigos"<br>
                    • Skin única: "Invocador Ancestral"<br>
                    • Acceso VIP a contenido especial
                </div>
                <p style="font-style: italic; color: #888;">
                    "Solo aquellos que escuchan el silencio pueden despertar a los dioses."
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(secretModal);
    
    window.closeSecretModal = function() {
        document.body.removeChild(secretModal);
        document.body.style.filter = 'none';
        document.body.style.transition = '';
        delete window.closeSecretModal;
    };
    
    setTimeout(() => {
        if (document.body.contains(secretModal)) {
            window.closeSecretModal();
        }
    }, 10000);
    
    console.log('Contenido secreto desbloqueado! Konami Code detectado.');
}

// ===== FUNCIONES DE UTILIDAD =====
function logWelcomeMessage() {
    console.log(`
    EL SILENCIO DE LOS DIOSES - DEVELOPER CONSOLE
    
    ═══════════════════════════════════════════
    
    Comandos secretos disponibles:
    • Ctrl+Shift+A: Panel de administrador
    • Código Konami: ↑↑↓↓←→←→BA (Contenido secreto)
    • Scroll: Efectos dinámicos de fondo
    
    Sistema de emails: ${registeredEmails.length} registrados
    Firebase: ${isFirebaseConnected ? 'Conectado' : 'Desconectado'}
    
    ¿Interesado en unirte al desarrollo?
    Visita nuestro Discord (enlace en la página)
    
    "En el silencio encontramos las respuestas"
    
    ═══════════════════════════════════════════
    `);
}

// ===== MANEJO DE ERRORES =====
window.addEventListener('error', function(event) {
    console.error('Error en El Silencio De Los Dioses:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rechazada:', event.reason);
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

const optimizedScrollHandler = debounce(() => {
    initializeScrollEffects();
}, 16);

window.addEventListener('scroll', optimizedScrollHandler);

// ===== FUNCIONES AUXILIARES =====
function loadEmails() {
    // Esta función ahora se maneja en initializeApp()
    // Mantenida para compatibilidad
}

function isMobile() {
    return window.innerWidth <= 768;
}

function isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ===== INICIALIZACIÓN ADICIONAL =====
window.addEventListener('load', function() {
    addHoverEffects();
    document.body.classList.add('loaded');
});

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
