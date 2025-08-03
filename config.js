// API配置文件
const API_CONFIG = {
    // OpenAI配置
    openai: {
        name: 'OpenAI',
        enabled: false, 
        baseURL: 'https://api.openai.com/v1/chat/completions',
        apiKey: '', // 请在此处填入您的API密钥
        models: [
            'gpt-4-turbo-preview',
            'gpt-4',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k'
        ],
        modelAliases: {
            'gpt-4-turbo-preview': 'GPT-4 Turbo',
            'gpt-4': 'GPT-4',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    },

    // Google AI Studio配置
    googleai: {
        name: 'Google AI Studio',
        enabled: false, 
        baseURL: 'https://generativelanguage.googleapis.com/v1beta3',
        apiKey: '', // 请在此处填入您的API密钥
        models: [
            'gemini-pro',
            'gemini-pro-vision',
            'gemini-1.5-pro',
            'gemini-1.5-flash'
        ],
        modelAliases: {
            'gemini-pro': 'Gemini Pro',
            'gemini-pro-vision': 'Gemini Pro Vision',
            'gemini-1.5-pro': 'Gemini 1.5 Pro',
            'gemini-1.5-flash': 'Gemini 1.5 Flash'
        },
        headers: {
            'Content-Type': 'application/json'
        }
    },

    // Anthropic配置
    anthropic: {
        name: 'Anthropic',
        enabled: false, 
        baseURL: 'https://api.anthropic.com/v1/messages',
        apiKey: '', // 请在此处填入您的API密钥
        models: [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1',
            'claude-2.0'
        ],
        modelAliases: {
            'claude-3-opus-20240229': 'Claude 3 Opus',
            'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
            'claude-3-haiku-20240307': 'Claude 3 Haiku',
            'claude-2.1': 'Claude 2.1',
            'claude-2.0': 'Claude 2.0'
        },
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': '{API_KEY}',
            'anthropic-version': '2023-06-01'
        }
    },

    // DeepSeek配置
    deepseek: {
        name: 'DeepSeek',
        enabled: false, 
        baseURL: 'https://api.deepseek.com/v1/chat/completions',
        apiKey: '', // 请在此处填入您的API密钥
        models: [
            'deepseek-chat',
            'deepseek-coder',
            'deepseek-math'
        ],
        modelAliases: {
            'deepseek-chat': 'DeepSeek Chat',
            'deepseek-coder': 'DeepSeek Coder',
            'deepseek-math': 'DeepSeek Math'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    },

    // xAI Grok配置
    xai: {
        name: 'xAI Grok',
        enabled: false, 
        baseURL: 'https://api.x.ai/v1/chat/completions',
        apiKey: '', // 请在此处填入您的API密钥
        models: [
            'grok-beta',
            'grok-vision-beta'
        ],
        modelAliases: {
            'grok-beta': 'Grok Beta',
            'grok-vision-beta': 'Grok Vision Beta'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    },

    // OpenRouter配置
    openrouter: {
        name: 'OpenRouter',
        enabled: true, 
        baseURL: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: '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', // 请在此处填入您的API密钥
        models: [
            'deepseek/deepseek-chat-v3-0324:free',
            'deepseek/deepseek-r1-0528:free',
            'qwen/qwq-32b:free',
            'qwen/qwen3-235b-a22b:free',
            'z-ai/glm-4.5-air:free',
            'moonshotai/kimi-k2:free',
            'tencent/hunyuan-a13b-instruct:free'
        ],
        modelAliases: {
            'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3',
            'deepseek/deepseek-r1-0528:free': 'DeepSeek R1',
            'qwen/qwq-32b:free': '通义千问 QwQ',
            'qwen/qwen3-235b-a22b:free': '通义千问 3.0',
            'z-ai/glm-4.5-air:free': 'GLM-4.5 Air',
            'moonshotai/kimi-k2:free': 'Kimi K2',
            'tencent/hunyuan-a13b-instruct:free': '混元 A13B'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NextAI'
        }
    },

    // Pollinations配置
    pollinations: {
        name: 'Pollinations',
        enabled: true, 
        baseURL: 'https://text.pollinations.ai/openai',
        apiKey: '38DJtIV7dXrRdYNl', // Pollinations通常不需要API密钥
        models: [
            'openai',
            'openai-fast',
            'grok',
            'glm',
            'evil',
            'mistral',
            'qwen',
            'deepseek-reasoning'
        ],
        modelAliases: {
            'openai': 'OpenAI',
            'openai-fast': 'OpenAI Fast',
            'grok': 'Grok-3',
            'glm': 'GLM-4',
            'evil': 'Evil',
            'mistral': 'Mistral AI',
            'qwen': '通义千问 mini',
            'deepseek-reasoning': 'DeepSeek R1'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}',
            "stream": true,
            'X-Title': 'NextAI'
        }
    },

    // Ollama配置（本地部署）
    ollama: {
        name: 'Ollama',
        enabled: false, 
        baseURL: 'http://localhost:11434/v1/chat/completions',
        apiKey: '', // Ollama不需要API密钥
        models: [
            'llama3.2',
            'llama3.1',
            'qwen2.5',
            'deepseek-coder-v2',
            'codellama',
            'mistral'
        ],
        modelAliases: {
            'llama3.2': 'Llama 3.2',
            'llama3.1': 'Llama 3.1',
            'qwen2.5': 'Qwen 2.5',
            'deepseek-coder-v2': 'DeepSeek Coder V2',
            'codellama': 'Code Llama',
            'mistral': 'Mistral'
        },
        headers: {
            'Content-Type': 'application/json'
        }
    }
};

// 默认配置
const DEFAULT_CONFIG = {
    currentProvider: null, // 将自动检测第一个启用的提供商
    currentModel: null, // 将自动检测第一个模型
    temperature: 0.7,
    topP: 1.0,
    contextLength: 10, // 上下文长度（0-25）
    maxTokens: 2048,
    timeout: 30000, // 30秒超时
    retryAttempts: 3
};

// 配置管理类
class ConfigManager {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.loadConfig();
        this.initializeConfig(); // 确保配置有效
    }

    // 获取第一个启用的提供商和模型
    getFirstEnabledProviderAndModel() {
        const enabledProviders = this.getProviders();
        if (enabledProviders.length > 0) {
            const firstProvider = enabledProviders[0];
            const firstModel = firstProvider.models[0];
            return {
                provider: firstProvider.key,
                model: firstModel
            };
        }
        // 如果没有启用的提供商，返回null
        return null;
    }

    // 初始化配置，确保使用启用的提供商
    initializeConfig() {
        const enabledProviders = this.getProviders();
        
        // 如果当前提供商为null或未启用，自动检测第一个启用的提供商
        if (!this.config.currentProvider || !enabledProviders.find(p => p.key === this.config.currentProvider)) {
            const firstEnabled = this.getFirstEnabledProviderAndModel();
            if (firstEnabled) {
                this.config.currentProvider = firstEnabled.provider;
                this.config.currentModel = firstEnabled.model;
                this.saveConfig();
            } else {
                // 没有启用的提供商，重置为null
                this.config.currentProvider = null;
                this.config.currentModel = null;
            }
        }
        
        // 如果当前模型为null或在当前提供商中不存在，使用该提供商的第一个模型
        const currentProvider = this.getCurrentProvider();
        if (currentProvider && (!this.config.currentModel || !currentProvider.models.includes(this.config.currentModel))) {
            this.config.currentModel = currentProvider.models[0];
            this.saveConfig();
        }
    }

    // 从localStorage加载配置
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('ai_chat_config');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
            
            // 加载API密钥
            this.loadApiKeys();
        } catch (error) {
            console.warn('加载配置失败:', error);
        }
    }

    // 保存配置到localStorage
    saveConfig() {
        try {
            localStorage.setItem('ai_chat_config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('保存配置失败:', error);
        }
    }

    // 加载API密钥
    loadApiKeys() {
        try {
            const savedApiKeys = localStorage.getItem('ai_chat_api_keys');
            if (savedApiKeys) {
                const apiKeys = JSON.parse(savedApiKeys);
                Object.keys(apiKeys).forEach(provider => {
                    if (API_CONFIG[provider] && apiKeys[provider]) {
                        // 只有当保存的密钥不为空时才覆盖
                        if (apiKeys[provider].trim() !== '') {
                            API_CONFIG[provider].apiKey = apiKeys[provider];
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('加载API密钥失败:', error);
        }
    }

    // 保存API密钥
    saveApiKeys() {
        try {
            const apiKeys = {};
            Object.keys(API_CONFIG).forEach(provider => {
                if (API_CONFIG[provider].apiKey) {
                    apiKeys[provider] = API_CONFIG[provider].apiKey;
                }
            });
            localStorage.setItem('ai_chat_api_keys', JSON.stringify(apiKeys));
        } catch (error) {
            console.warn('保存API密钥失败:', error);
        }
    }

    // 获取当前提供商配置
    getCurrentProvider() {
        return API_CONFIG[this.config.currentProvider];
    }

    // 设置当前提供商
    setProvider(provider) {
        if (API_CONFIG[provider]) {
            this.config.currentProvider = provider;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 设置当前模型
    setModel(model) {
        const provider = this.getCurrentProvider();
        if (provider && provider.models.includes(model)) {
            this.config.currentModel = model;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 设置温度
    setTemperature(temperature) {
        const temp = parseFloat(temperature);
        if (temp >= 0 && temp <= 2) {
            this.config.temperature = temp;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 设置Top_P
    setTopP(topP) {
        const tp = parseFloat(topP);
        if (tp >= 0 && tp <= 1) {
            this.config.topP = tp;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 设置上下文长度
    setContextLength(length) {
        const len = parseInt(length);
        if (len >= 0 && len <= 25) {
            this.config.contextLength = len;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 获取温度
    getTemperature() {
        return this.config.temperature;
    }

    // 获取Top_P
    getTopP() {
        return this.config.topP;
    }

    // 获取上下文长度
    getContextLength() {
        return this.config.contextLength;
    }

    // 设置API密钥
    setApiKey(provider, apiKey) {
        if (API_CONFIG[provider]) {
            API_CONFIG[provider].apiKey = apiKey;
            // 保存API密钥到localStorage
            this.saveApiKeys();
            return true;
        }
        return false;
    }

    // 获取API密钥
    getApiKey(provider) {
        return API_CONFIG[provider]?.apiKey || '';
    }

    // 获取模型别名
    getModelAlias(provider, model) {
        const providerConfig = API_CONFIG[provider];
        if (!providerConfig || !providerConfig.modelAliases) {
            return model; // 如果没有别名配置，返回原始模型名
        }
        return providerConfig.modelAliases[model] || model;
    }

    // 获取当前模型的别名
    getCurrentModelAlias() {
        if (!this.config.currentProvider || !this.config.currentModel) {
            return '';
        }
        return this.getModelAlias(this.config.currentProvider, this.config.currentModel);
    }

    // 获取请求头
    getHeaders(provider) {
        const providerConfig = API_CONFIG[provider];
        if (!providerConfig) return {};

        const headers = { ...providerConfig.headers };
        const apiKey = providerConfig.apiKey;

        // 替换API密钥占位符
        Object.keys(headers).forEach(key => {
            if (typeof headers[key] === 'string') {
                headers[key] = headers[key].replace('{API_KEY}', apiKey);
            }
        });

        return headers;
    }

    // 启用或禁用API提供商
    setProviderEnabled(provider, enabled) {
        if (API_CONFIG[provider]) {
            API_CONFIG[provider].enabled = enabled;
            return true;
        }
        return false;
    }

    // 获取所有提供商（包括禁用的）
    getAllProviders() {
        return Object.keys(API_CONFIG).map(key => ({
            key,
            name: API_CONFIG[key].name,
            enabled: API_CONFIG[key].enabled,
            models: API_CONFIG[key].models
        }));
    }

    // 获取所有可用的提供商（只返回启用的）
    getProviders() {
        return Object.keys(API_CONFIG)
            .filter(key => API_CONFIG[key].enabled) // 只返回启用的API
            .map(key => ({
                key,
                name: API_CONFIG[key].name,
                models: API_CONFIG[key].models
            }));
    }

    // 验证配置
    validateConfig(provider) {
        const providerConfig = API_CONFIG[provider];
        if (!providerConfig) {
            return { valid: false, error: '未知的提供商' };
        }

        // 检查是否需要API密钥
        if (['openai', 'anthropic', 'deepseek', 'xai', 'openrouter', 'googleai'].includes(provider)) {
            const apiKey = providerConfig.apiKey;
            console.log(`验证 ${provider} 的API密钥:`, apiKey ? '已设置' : '未设置');
            
            if (!apiKey || apiKey.trim() === '') {
                return { valid: false, error: '请设置API密钥' };
            }
        }

        return { valid: true };
    }

    // 获取完整配置
    getConfig() {
        return {
            ...this.config,
            provider: this.getCurrentProvider()
        };
    }
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, DEFAULT_CONFIG, ConfigManager };
} else {
    window.API_CONFIG = API_CONFIG;
    window.DEFAULT_CONFIG = DEFAULT_CONFIG;
    window.ConfigManager = ConfigManager;
}