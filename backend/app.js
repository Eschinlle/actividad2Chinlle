const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'fintech_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones para la base de datos
let pool;

async function initializeDbConnection() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('Conexión a la base de datos establecida');
    
    // Verificar la conexión
    const [rows] = await pool.query('SELECT 1');
    console.log('Conexión verificada:', rows);
    
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    // Reintento de conexión después de un tiempo
    console.log('Reintentando conexión en 5 segundos...');
    setTimeout(initializeDbConnection, 5000);
  }
}

// Rutas de la API

// Endpoint de salud para verificar que el servicio está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Obtener todas las transacciones
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions ORDER BY transaction_date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una transacción específica
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener la transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear una nueva transacción
app.post('/api/transactions', async (req, res) => {
  const { description, amount, category, transaction_type } = req.body;
  
  // Validaciones básicas
  if (!description || !amount || !category || !transaction_type) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  if (transaction_type !== 'income' && transaction_type !== 'expense') {
    return res.status(400).json({ error: 'El tipo de transacción debe ser "income" o "expense"' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO transactions (description, amount, category, transaction_type) VALUES (?, ?, ?, ?)', 
      [description, amount, category, transaction_type]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      description, 
      amount, 
      category, 
      transaction_type 
    });
  } catch (error) {
    console.error('Error al crear la transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar una transacción existente
app.put('/api/transactions/:id', async (req, res) => {
  const { description, amount, category, transaction_type } = req.body;
  const id = req.params.id;
  
  // Validaciones básicas
  if (!description || !amount || !category || !transaction_type) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  try {
    const [result] = await pool.query(
      'UPDATE transactions SET description = ?, amount = ?, category = ?, transaction_type = ? WHERE id = ?',
      [description, amount, category, transaction_type, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json({ 
      id: parseInt(id), 
      description, 
      amount, 
      category, 
      transaction_type 
    });
  } catch (error) {
    console.error('Error al actualizar la transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar una transacción
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener resumen por categoría
app.get('/api/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        category, 
        transaction_type, 
        SUM(amount) as total 
      FROM transactions 
      GROUP BY category, transaction_type
      ORDER BY category, transaction_type
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener el resumen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener balance actual
app.get('/api/balance', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) as balance
      FROM transactions
    `);
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener el balance:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicializa la conexión a la base de datos y luego inicia el servidor
initializeDbConnection().then(() => {
  app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
  });
}).catch(err => {
  console.error('No se pudo iniciar el servidor:', err);
});

module.exports = app; // Para pruebas