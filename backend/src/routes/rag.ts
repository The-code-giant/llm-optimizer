import { Router, Request } from 'express';
import { ragService } from '../utils/ragService';
import { knowledgeBaseManager } from '../utils/knowledgeBaseManager';
import { authenticateJWT } from '../middleware/auth';

// Extend Request type to match auth middleware
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

// Test route without authentication for development
router.get('/test', (req, res) => {
  res.json({ status: 'RAG routes are working!', timestamp: new Date() });
});

// Test Pinecone connection without authentication for development
router.get('/test-pinecone', async (req, res) => {
  try {
    const { vectorStoreService } = await import('../utils/vectorStore');
    const testResult = await vectorStoreService.isIndexReady();
    res.json({ 
      status: 'Pinecone connection test', 
      pinecone: 'connected',
      result: testResult,
      timestamp: new Date() 
    });
  } catch (error) {
    res.json({ 
      status: 'Pinecone connection test', 
      pinecone: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date() 
    });
  }
});

// Test OpenAI embeddings without authentication for development
router.get('/test-embeddings', async (req, res) => {
  try {
    const { embeddingService } = await import('../utils/embeddingService');
    const testEmbedding = await embeddingService.generateEmbedding('Hello world test');
    res.json({ 
      status: 'OpenAI embeddings test', 
      openai: 'connected',
      embeddingLength: testEmbedding.length,
      embeddingPreview: testEmbedding.slice(0, 5),
      timestamp: new Date() 
    });
  } catch (error) {
    res.json({ 
      status: 'OpenAI embeddings test', 
      openai: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date() 
    });
  }
});

// Apply authentication middleware to all routes (except test)
router.use(authenticateJWT);

/**
 * Initialize knowledge base for a site
 * POST /api/rag/initialize/:siteId
 */
router.post('/initialize/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Initializing RAG for site ${siteId} by user ${userId}`);

    const status = await knowledgeBaseManager.initializeKnowledgeBase(siteId);

    res.json({
      success: true,
      message: 'Knowledge base initialization started',
      status,
    });
  } catch (error) {
    console.error('Error initializing knowledge base:', error);
    res.status(500).json({
      error: 'Failed to initialize knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get knowledge base status
 * GET /api/rag/status/:siteId
 */
router.get('/status/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = await knowledgeBaseManager.getKnowledgeBaseStatus(siteId);

    if (!status) {
      // Return a not_found status instead of 404 error
      res.json({
        status: 'not_found',
        totalDocuments: 0,
        lastRefresh: null,
      });
      return;
    }

    // Map backend status to frontend expected status
    const mappedStatus = {
      ...status,
      status: status.status === 'processing' ? 'initializing' : status.status,
    };
    res.json(mappedStatus);
  } catch (error) {
    console.error('Error getting knowledge base status:', error);
    res.status(500).json({
      error: 'Failed to get knowledge base status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get knowledge base documents
 * GET /api/rag/documents/:siteId
 */
router.get('/documents/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const documents = await knowledgeBaseManager.getDocuments(siteId);

    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      error: 'Failed to get documents',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get knowledge base statistics
 * GET /api/rag/statistics/:siteId
 */
router.get('/statistics/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const statistics = await knowledgeBaseManager.getStatistics(siteId);

    res.json(statistics);
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Refresh knowledge base
 * POST /api/rag/refresh/:siteId
 */
router.post('/refresh/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Refreshing knowledge base for site ${siteId} by user ${userId}`);

    await knowledgeBaseManager.refreshKnowledgeBase(siteId);

    res.json({
      success: true,
      message: 'Knowledge base refresh started',
    });
  } catch (error) {
    console.error('Error refreshing knowledge base:', error);
    res.status(500).json({
      error: 'Failed to refresh knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete knowledge base
 * DELETE /api/rag/delete/:siteId
 */
router.delete('/delete/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Deleting knowledge base for site ${siteId} by user ${userId}`);

    await knowledgeBaseManager.deleteKnowledgeBase(siteId);

    res.json({
      success: true,
      message: 'Knowledge base deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    res.status(500).json({
      error: 'Failed to delete knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Generate content using RAG
 * POST /api/rag/generate
 */
router.post('/generate', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId, contentType, topic, additionalContext } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!siteId || !contentType || !topic) {
      return res.status(400).json({
        error: 'Missing required fields: siteId, contentType, topic',
      });
    }

    console.log(`Generating ${contentType} for site ${siteId} by user ${userId}`);

    const response = await ragService.generateContent(
      siteId,
      contentType,
      topic,
      additionalContext
    );

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Process RAG query
 * POST /api/rag/query
 */
router.post('/query', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId, query, contextType, maxResults, similarityThreshold } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!siteId || !query) {
      return res.status(400).json({
        error: 'Missing required fields: siteId, query',
      });
    }

    console.log(`Processing RAG query for site ${siteId} by user ${userId}`);

    const response = await ragService.processQuery({
      siteId,
      query,
      contextType,
      maxResults,
      similarityThreshold,
    });

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Error processing RAG query:', error);
    res.status(500).json({
      error: 'Failed to process RAG query',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Analyze content quality
 * POST /api/rag/analyze
 */
router.post('/analyze', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId, content, targetQuery } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!siteId || !content || !targetQuery) {
      return res.status(400).json({
        error: 'Missing required fields: siteId, content, targetQuery',
      });
    }

    console.log(`Analyzing content quality for site ${siteId} by user ${userId}`);

    const analysis = await ragService.analyzeContentQuality(siteId, content, targetQuery);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing content quality:', error);
    res.status(500).json({
      error: 'Failed to analyze content quality',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get RAG analytics
 * GET /api/rag/analytics/:siteId
 */
router.get('/analytics/:siteId', async (req: AuthenticatedRequest, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analytics = await ragService.getAnalytics(siteId);

    res.json(analytics);
  } catch (error) {
    console.error('Error getting RAG analytics:', error);
    res.status(500).json({
      error: 'Failed to get RAG analytics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 