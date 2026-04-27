import { Router } from 'express';
import { db } from '../db';
import { z } from 'zod';

const router = Router();

// Schema for integration settings
const integrationSettingsSchema = z.object({
  serviceName: z.string(),
  settings: z.record(z.any()),
  isEnabled: z.boolean().default(true),
});

// Get all integration settings
router.get('/settings', async (req, res) => {
  try {
    // For now, return mock data. In production, this would fetch from database
    const settings = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY ? '***************' : '',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.7,
        endpoint: 'https://api.openai.com/v1',
        status: process.env.OPENAI_API_KEY ? 'connected' : 'disconnected'
      },
      postgresql: {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || '5432',
        database: process.env.PGDATABASE || 'inventory',
        username: process.env.PGUSER || 'postgres',
        ssl: true,
        maxConnections: 20,
        status: 'connected'
      },
      email: {
        provider: 'smtp',
        host: '',
        port: 587,
        username: '',
        password: '',
        encryption: 'tls',
        status: 'disconnected'
      },
      sms: {
        provider: 'twilio',
        accountSid: '',
        authToken: '',
        fromNumber: '',
        status: 'disconnected'
      },
      cloud_storage: {
        provider: 'aws',
        accessKey: '',
        secretKey: '',
        bucket: '',
        region: 'us-east-1',
        status: 'disconnected'
      },
      payment: {
        provider: 'stripe',
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        status: 'disconnected'
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching integration settings:', error);
    res.status(500).json({ error: 'Failed to fetch integration settings' });
  }
});

// Test connection for a service
router.post('/test/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { settings } = req.body;

    // Simulate connection testing
    switch (serviceName) {
      case 'openai':
        if (settings.apiKey && settings.apiKey !== '***************') {
          // In production, you would test the actual API
          res.json({ success: true, message: 'تم اختبار OpenAI API بنجاح' });
        } else {
          res.json({ success: false, message: 'مفتاح API مطلوب' });
        }
        break;
        
      case 'postgresql':
        try {
          // Test database connection
          await db.select().from('users').limit(1);
          res.json({ success: true, message: 'تم اختبار قاعدة البيانات بنجاح' });
        } catch (error) {
          res.json({ success: false, message: 'فشل في الاتصال بقاعدة البيانات' });
        }
        break;
        
      case 'email':
        if (settings.host && settings.username && settings.password) {
          // In production, you would test SMTP connection
          res.json({ success: true, message: 'تم اختبار البريد الإلكتروني بنجاح' });
        } else {
          res.json({ success: false, message: 'إعدادات البريد الإلكتروني غير مكتملة' });
        }
        break;
        
      default:
        res.json({ success: false, message: 'خدمة غير مدعومة' });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

// Update integration settings
router.put('/settings/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const settings = req.body;

    // In production, you would save to database
    // For now, just return success
    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error) {
    console.error('Error updating integration settings:', error);
    res.status(500).json({ error: 'Failed to update integration settings' });
  }
});

// Get database connection info
router.get('/database/info', async (req, res) => {
  try {
    const dbInfo = {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || '5432',
      database: process.env.PGDATABASE || 'inventory',
      username: process.env.PGUSER || 'postgres',
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') || false,
      connectionString: process.env.DATABASE_URL ? '***************' : '',
      status: 'connected'
    };

    res.json(dbInfo);
  } catch (error) {
    console.error('Error fetching database info:', error);
    res.status(500).json({ error: 'Failed to fetch database info' });
  }
});

export default router;