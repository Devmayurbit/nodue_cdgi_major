import mongoose from 'mongoose';
import { config } from './index';

const cleanupLegacyIndexes = async (): Promise<void> => {
  try {
    const collection = mongoose.connection.collection('certificates');
    const indexes = await collection.indexes();
    const legacyIndexNames = ['noDuesId_1', 'noDuesRequestId_1'];

    for (const indexName of legacyIndexNames) {
      if (indexes.some((idx) => idx.name === indexName)) {
        await collection.dropIndex(indexName);
        console.log(`Dropped legacy certificates index: ${indexName}`);
      }
    }
  } catch (error: any) {
    // Ignore when collection/index does not exist yet; this is best-effort cleanup.
    if (error?.codeName !== 'NamespaceNotFound' && error?.codeName !== 'IndexNotFound') {
      console.warn('Legacy index cleanup warning:', error?.message || error);
    }
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Production safety: do not drop indexes automatically unless explicitly enabled.
    const shouldRunIndexMaintenance =
      config.nodeEnv !== 'production' || process.env.RUN_INDEX_MAINTENANCE === 'true';
    if (shouldRunIndexMaintenance) {
      await cleanupLegacyIndexes();
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
    console.warn('Continuing without database connection in development mode.');
  }
};
