import db from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// MIGRATION RUNNER
// ============================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../migrations');

/**
 * Executa uma migration
 */
async function runMigration(migrationFile, direction = 'up') {
  try {
    const migration = await import(`../migrations/${migrationFile}`);
    const pool = db.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      if (direction === 'up') {
        await migration.up(client);
      } else {
        await migration.down(client);
      }
      
      await client.query('COMMIT');
      console.log(`✓ ${migrationFile} (${direction}) - sucesso`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`✗ ${migrationFile} (${direction}) - erro:`, error.message);
    throw error;
  }
}

/**
 * Executa todas as migrations
 */
export async function runAllMigrations() {
  try {
    console.log('Iniciando migrations...');
    
    // Ler todos os arquivos de migration
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .sort(); // Ordem alfabética garante ordem de versão

    for (const file of files) {
      await runMigration(file, 'up');
    }

    console.log('\n✓ Todas as migrations foram executadas com sucesso!');
  } catch (error) {
    console.error('\n✗ Erro durante migrations:', error);
    process.exit(1);
  }
}

/**
 * Rollback da última migration
 */
export async function rollbackLastMigration() {
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .sort()
      .reverse(); // Ordem reversa

    if (files.length === 0) {
      console.log('Nenhuma migration para fazer rollback');
      return;
    }

    const lastFile = files[0];
    console.log(`Fazendo rollback de ${lastFile}...`);
    
    await runMigration(lastFile, 'down');
    
    console.log('✓ Rollback executado com sucesso');
  } catch (error) {
    console.error('✗ Erro durante rollback:', error);
    process.exit(1);
  }
}

/**
 * Status das migrations
 */
export async function getMigrationStatus() {
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .sort();

    console.log('Migration Status:');
    console.log('================');
    
    for (const file of files) {
      console.log(`${file}`);
    }
  } catch (error) {
    console.error('Erro ao obter status:', error);
  }
}
