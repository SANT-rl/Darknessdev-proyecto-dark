const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 requests por ventana
    message: 'Muchas solicitudes desde esta IP, intenta de nuevo más tarde.'
});

const subscribeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // máximo 5 suscripciones por hora por IP
    message: 'Muchas suscripciones desde esta IP, intenta de nuevo en una hora.'
});

app.use(limiter);

// Configurar base de datos SQLite
const dbPath = path.join(__dirname, 'database', 'game_subscribers.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('✅ Conectado a la base de datos SQLite');
        initDatabase();
    }
});

// Inicializar tablas de la base de datos
function initDatabase() {
    // Tabla principal de suscriptores
    db.run(`CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT DEFAULT 'website',
        status TEXT DEFAULT 'active',
        ip_address TEXT,
        user_agent TEXT,
        country TEXT,
        referrer TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating subscribers table:', err.message);
        } else {
            console.log('✅ Tabla subscribers lista');
        }
    });

    // Tabla de estadísticas
    db.run(`CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        total_subscribers INTEGER DEFAULT 0,
        new_subscribers INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0
    )`, (err) => {
        if (err) {
            console.error('Error creating stats table:', err.message);
        } else {
            console.log('✅ Tabla stats lista');
        }
    });

    // Tabla de logs de actividad
    db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        email TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        details TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating activity_log table:', err.message);
        } else {
            console.log('✅ Tabla activity_log lista');
        }
    });
}

// Función para obtener información del cliente
function getClientInfo(req) {
    return {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown',
        referrer: req.get('Referer') || 'Direct'
    };
}

// Función para log de actividad
function logActivity(action, email = null, ip = null, details = null) {
    const sql = `INSERT INTO activity_log (action, email, ip_address, details) 
                 VALUES (?, ?, ?, ?)`;
    db.run(sql, [action, email, ip, details], (err) => {
        if (err) {
            console.error('Error logging activity:', err.message);
        }
    });
}

// Función para actualizar estadísticas diarias
function updateDailyStats(newSubscriber = false) {
    const today = new Date().toISOString().split('T')[0];
    
    db.get(`SELECT * FROM stats WHERE date = ?`, [today], (err, row) => {
        if (err) {
            console.error('Error getting stats:', err.message);
            return;
        }
        
        if (row) {
            // Actualizar estadísticas existentes
            const sql = `UPDATE stats SET 
                        page_views = page_views + 1,
                        new_subscribers = new_subscribers + ?,
                        total_subscribers = (SELECT COUNT(*) FROM subscribers WHERE status = 'active')
                        WHERE date = ?`;
            db.run(sql, [newSubscriber ? 1 : 0, today]);
        } else {
            // Crear nuevas estadísticas para hoy
            const sql = `INSERT INTO stats (date, page_views, new_subscribers, total_subscribers) 
                        VALUES (?, 1, ?, (SELECT COUNT(*) FROM subscribers WHERE status = 'active'))`;
            db.run(sql, [today, newSubscriber ? 1 : 0]);
        }
    });
}

// RUTAS DE LA API

// Ruta principal - servir el HTML
app.get('/', (req, res) => {
    const clientInfo = getClientInfo(req);
    logActivity('PAGE_VISIT', null, clientInfo.ip, clientInfo.userAgent);
    updateDailyStats();
    
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Suscribirse al newsletter
app.post('/api/subscribe', subscribeLimiter, (req, res) => {
    const { email } = req.body;
    const clientInfo = getClientInfo(req);
    
    // Validación básica
    if (!email || !isValidEmail(email)) {
        logActivity('INVALID_EMAIL', email, clientInfo.ip);
        return res.status(400).json({
            success: false,
            error: 'EMAIL_INVALID',
            message: 'Email inválido'
        });
    }

    // Insertar en la base de datos
    const sql = `INSERT INTO subscribers (email, source, ip_address, user_agent, referrer) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [
        email.toLowerCase(),
        'website',
        clientInfo.ip,
        clientInfo.userAgent,
        clientInfo.referrer
    ], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                logActivity('DUPLICATE_EMAIL', email, clientInfo.ip);
                return res.status(400).json({
                    success: false,
                    error: 'EMAIL_EXISTS',
                    message: 'Este email ya está registrado'
                });
            }
            
            console.error('Database error:', err.message);
            logActivity('DB_ERROR', email, clientInfo.ip, err.message);
            return res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Error interno del servidor'
            });
        }

        // Éxito
        logActivity('SUBSCRIBE_SUCCESS', email, clientInfo.ip);
        updateDailyStats(true);
        
        console.log(`✅ Nuevo suscriptor: ${email} (ID: ${this.lastID})`);
        
        res.json({
            success: true,
            message: 'Suscripción exitosa',
            subscriberId: this.lastID
        });
    });
});

// API: Obtener estadísticas (solo para admin)
app.get('/api/admin/stats', (req, res) => {
    // En producción, agregar autenticación aquí
    const { password } = req.query;
    
    if (password !== 'admin123') { // Cambiar por una contraseña segura
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    db.all(`SELECT 
                COUNT(*) as total_subscribers,
                COUNT(CASE WHEN date(subscribed_at) = date('now') THEN 1 END) as today_subscribers,
                COUNT(CASE WHEN date(subscribed_at) >= date('now', '-7 days') THEN 1 END) as week_subscribers
            FROM subscribers 
            WHERE status = 'active'`, (err, rows) => {
        
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            stats: rows[0]
        });
    });
});

// API: Obtener lista de suscriptores (solo para admin)
app.get('/api/admin/subscribers', (req, res) => {
    const { password, page = 1, limit = 50 } = req.query;
    
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    const offset = (page - 1) * limit;
    
    db.all(`SELECT id, email, subscribed_at, source, ip_address 
            FROM subscribers 
            WHERE status = 'active'
            ORDER BY subscribed_at DESC 
            LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            subscribers: rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    });
});

// API: Exportar suscriptores a CSV (solo para admin)
app.get('/api/admin/export', (req, res) => {
    const { password } = req.query;
    
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    db.all(`SELECT email, subscribed_at, source, ip_address 
            FROM subscribers 
            WHERE status = 'active'
            ORDER BY subscribed_at DESC`, (err, rows) => {
        
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Generar CSV
        let csv = 'Email,Fecha de Suscripción,Fuente,IP\n';
        rows.forEach(row => {
            csv += `"${row.email}","${row.subscribed_at}","${row.source}","${row.ip_address}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
        res.send(csv);
    });
});

// API: Desuscribirse
app.post('/api/unsubscribe', (req, res) => {
    const { email } = req.body;
    const clientInfo = getClientInfo(req);
    
    if (!email || !isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email inválido'
        });
    }
    
    const sql = `UPDATE subscribers SET status = 'unsubscribed' WHERE email = ?`;
    
    db.run(sql, [email.toLowerCase()], function(err) {
        if (err) {
            console.error('Unsubscribe error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Email no encontrado'
            });
        }
        
        logActivity('UNSUBSCRIBE', email, clientInfo.ip);
        
        res.json({
            success: true,
            message: 'Desuscripción exitosa'
        });
    });
});

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// Cerrar base de datos al terminar la aplicación
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Panel admin: http://localhost:${PORT}/api/admin/stats?password=admin123`);
    console.log(`📧 Exportar emails: http://localhost:${PORT}/api/admin/export?password=admin123`);
});