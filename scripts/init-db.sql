-- Script de inicialización de BD (opcional, EF Core crea las tablas automáticamente)
-- Este archivo se ejecuta automáticamente si la BD está vacía
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ShiftManagerDB')
    CREATE DATABASE ShiftManagerDB;

USE ShiftManagerDB;

-- Las tablas se crean via Entity Framework migrations
-- Este script es solo para setup inicial si es necesario
