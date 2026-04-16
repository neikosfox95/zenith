// ============= PHASE 7: CODE AI INTELLIGENCE ROUTES =============
// Coding-specific AI models for code generation, debugging, optimization

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to call Python AI service
async function callEnhancedAIService(method, data) {
  return new Promise((resolve, reject) => {
    const aiServicePath = join(__dirname, 'ai_service_complete.py');
    const env = { ...process.env };
    const python = spawn('/root/.venv/bin/python3', [aiServicePath], { env });
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error(`AI Service error: ${errorOutput}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          resolve({ result: output.trim() });
        }
      }
    });
    
    python.stdin.write(JSON.stringify({ method, data }));
    python.stdin.end();
  });
}

export function setupPhase7Routes(app, db, io, authenticateToken, ObjectId) {
  console.log('Setting up Phase 7 (Code AI) routes...');

  // ============= CODE GENERATION =============
  
  // Get available coding models
  app.get('/api/code/models', authenticateToken, (req, res) => {
    res.json({
      models: [
        // OpenAI Codex
        {
          id: 'codex-gpt-5.2',
          name: 'GPT-5.2 Code',
          provider: 'OpenAI',
          description: 'Flagship code model with advanced reasoning',
          languages: 'All major languages',
          best_for: 'Complex algorithms, system design'
        },
        {
          id: 'codex-gpt-4o',
          name: 'GPT-4o Code',
          provider: 'OpenAI',
          description: 'Multimodal code generation',
          languages: 'All major languages',
          best_for: 'Visual code, diagrams to code'
        },
        {
          id: 'codex-o3',
          name: 'O3 Code',
          provider: 'OpenAI',
          description: 'Advanced reasoning for code',
          languages: 'All major languages',
          best_for: 'Complex problem solving'
        },
        {
          id: 'codex-o3-mini',
          name: 'O3 Mini Code',
          provider: 'OpenAI',
          description: 'Efficient reasoning',
          languages: 'All major languages',
          best_for: 'Fast prototyping'
        },
        
        // Claude Code
        {
          id: 'claude-4.6-opus-code',
          name: 'Claude 4.6 Opus Code',
          provider: 'Anthropic',
          description: 'Most intelligent code model',
          languages: 'All major languages',
          best_for: 'Architecture, refactoring'
        },
        {
          id: 'claude-4.6-sonnet-code',
          name: 'Claude 4.6 Sonnet Code',
          provider: 'Anthropic',
          description: 'Balanced coding performance',
          languages: 'All major languages',
          best_for: 'General development'
        },
        {
          id: 'claude-code-specialist',
          name: 'Claude Code Specialist',
          provider: 'Anthropic',
          description: 'Pure coding focus',
          languages: 'All major languages',
          best_for: 'Code generation & review'
        },
        
        // DeepSeek Coder
        {
          id: 'deepseek-coder-v3',
          name: 'DeepSeek Coder V3',
          provider: 'DeepSeek',
          description: '671B parameters MoE model',
          languages: '80+ languages',
          best_for: 'Enterprise-scale projects'
        },
        {
          id: 'deepseek-coder-v2',
          name: 'DeepSeek Coder V2',
          provider: 'DeepSeek',
          description: '236B parameters',
          languages: '80+ languages',
          best_for: 'Complex codebases'
        },
        {
          id: 'deepseek-coder-v2-lite',
          name: 'DeepSeek Coder V2 Lite',
          provider: 'DeepSeek',
          description: '16B lightweight model',
          languages: '80+ languages',
          best_for: 'Fast development'
        },
        
        // StarCoder
        {
          id: 'starcoder2-15b',
          name: 'StarCoder2 15B',
          provider: 'Hugging Face',
          description: 'Latest open-source model',
          languages: '600+ languages',
          best_for: 'Open-source projects'
        },
        {
          id: 'starcoder2-7b',
          name: 'StarCoder2 7B',
          provider: 'Hugging Face',
          description: 'Efficient model',
          languages: '600+ languages',
          best_for: 'Quick tasks'
        },
        
        // Code Llama
        {
          id: 'codellama-70b',
          name: 'Code Llama 70B',
          provider: 'Meta',
          description: 'Flagship open model',
          languages: 'Python, C++, Java, PHP, C#, TS/JS',
          best_for: 'Large projects'
        },
        {
          id: 'codellama-34b',
          name: 'Code Llama 34B',
          provider: 'Meta',
          description: 'Balanced performance',
          languages: 'Python, C++, Java, PHP, C#, TS/JS',
          best_for: 'General coding'
        },
        {
          id: 'codellama-13b',
          name: 'Code Llama 13B',
          provider: 'Meta',
          description: 'Fast model',
          languages: 'Python, C++, Java, PHP, C#, TS/JS',
          best_for: 'Quick iterations'
        },
        
        // Microsoft Copilot
        {
          id: 'copilot-gpt-4o',
          name: 'GitHub Copilot GPT-4o',
          provider: 'Microsoft',
          description: 'Enterprise code assistant',
          languages: 'All major languages',
          best_for: 'GitHub integration'
        },
        {
          id: 'copilot-claude',
          name: 'GitHub Copilot Claude',
          provider: 'Microsoft',
          description: 'Claude-powered Copilot',
          languages: 'All major languages',
          best_for: 'Complex reasoning'
        },
        
        // Replit AI
        {
          id: 'replit-code-v1.5',
          name: 'Replit Code V1.5',
          provider: 'Replit',
          description: 'Fast code generation',
          languages: 'All major languages',
          best_for: 'Rapid prototyping'
        },
        {
          id: 'replit-ghostwriter',
          name: 'Replit Ghostwriter',
          provider: 'Replit',
          description: 'Classic code assistant',
          languages: 'All major languages',
          best_for: 'IDE integration'
        },
        
        // Qwen Coder
        {
          id: 'qwen-coder-3.5',
          name: 'Qwen Coder 3.5 32B',
          provider: 'Alibaba',
          description: 'Flagship Chinese coder',
          languages: 'All major languages + Chinese',
          best_for: 'Multilingual projects'
        },
        
        // Gemini Code
        {
          id: 'gemini-3-code',
          name: 'Gemini 3 Pro Code',
          provider: 'Google',
          description: 'Gemini for code',
          languages: 'All major languages',
          best_for: 'Google ecosystem'
        },
        {
          id: 'gemini-code-flash',
          name: 'Gemini Code Flash',
          provider: 'Google',
          description: 'Fast code generation',
          languages: 'All major languages',
          best_for: 'Quick tasks'
        }
      ]
    });
  });

  // Generate code
  app.post('/api/code/generate', authenticateToken, async (req, res) => {
    try {
      const { prompt, model = 'codex-gpt-5.2', language = 'python', task = 'generate' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const result = await callEnhancedAIService('generate_code', {
        prompt,
        model,
        language,
        task
      });

      res.json(result);
    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({ error: 'Failed to generate code' });
    }
  });

  // Fix code (debugging)
  app.post('/api/code/fix', authenticateToken, async (req, res) => {
    try {
      const { code, error_message, model = 'claude-4.6-opus-code', language = 'python' } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const prompt = `Fix this ${language} code:\n\n${code}\n\nError: ${error_message || 'Unknown error'}`;

      const result = await callEnhancedAIService('generate_code', {
        prompt,
        model,
        language,
        task: 'fix'
      });

      res.json(result);
    } catch (error) {
      console.error('Code fix error:', error);
      res.status(500).json({ error: 'Failed to fix code' });
    }
  });

  // Explain code
  app.post('/api/code/explain', authenticateToken, async (req, res) => {
    try {
      const { code, model = 'claude-4.6-sonnet-code', language = 'python' } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const prompt = `Explain this ${language} code in detail:\n\n${code}`;

      const result = await callEnhancedAIService('generate_code', {
        prompt,
        model,
        language,
        task: 'explain'
      });

      res.json(result);
    } catch (error) {
      console.error('Code explain error:', error);
      res.status(500).json({ error: 'Failed to explain code' });
    }
  });

  // Optimize code
  app.post('/api/code/optimize', authenticateToken, async (req, res) => {
    try {
      const { code, model = 'deepseek-coder-v3', language = 'python' } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const prompt = `Optimize this ${language} code for performance and efficiency:\n\n${code}`;

      const result = await callEnhancedAIService('generate_code', {
        prompt,
        model,
        language,
        task: 'optimize'
      });

      res.json(result);
    } catch (error) {
      console.error('Code optimize error:', error);
      res.status(500).json({ error: 'Failed to optimize code' });
    }
  });

  // Code review
  app.post('/api/code/review', authenticateToken, async (req, res) => {
    try {
      const { code, model = 'claude-4.6-opus-code', language = 'python' } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const prompt = `Perform a comprehensive code review of this ${language} code. Check for:\n- Bugs and errors\n- Security issues\n- Performance problems\n- Code style and best practices\n- Potential improvements\n\nCode:\n${code}`;

      const result = await callEnhancedAIService('generate_code', {
        prompt,
        model,
        language,
        task: 'explain'
      });

      res.json(result);
    } catch (error) {
      console.error('Code review error:', error);
      res.status(500).json({ error: 'Failed to review code' });
    }
  });

  console.log('✅ Phase 7 (Code AI Intelligence) routes loaded');
}
