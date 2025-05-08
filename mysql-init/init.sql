-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS fintech_db;
USE fintech_db;

-- Crear la tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  transaction_type ENUM('income', 'expense') NOT NULL
);

-- Insertar algunos datos de ejemplo
INSERT INTO transactions (description, amount, category, transaction_type) VALUES
('Salario de febrero', 1500.00, 'Salario', 'income'),
('Compra supermercado', 120.50, 'Alimentación', 'expense'),
('Factura electricidad', 85.30, 'Servicios', 'expense'),
('Trabajo freelance', 350.00, 'Ingreso extra', 'income'),
('Restaurante', 45.60, 'Ocio', 'expense'),
('Transporte público', 30.00, 'Transporte', 'expense');