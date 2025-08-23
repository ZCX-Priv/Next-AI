// API配置文件

// 文本API配置
const TEXT_API_CONFIG = {
    // OpenAI配置
    openai: {
        name: 'OpenAI',
        enabled: false, 
        baseURL: 'https://api.openai.com/v1/chat/completions',
        apiKey: '', // 请在此处填入您的API密钥
        defaultModel: 'gpt-4-turbo-preview', // 默认模型
        models: {
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
        defaultModel: 'gemini-pro', // 默认模型
        models: {
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
        defaultModel: 'claude-3-opus-20240229', // 默认模型
        models: {
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
        defaultModel: 'deepseek-chat', // 默认模型
        models: {
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
        defaultModel: 'grok-beta', // 默认模型
        models: {
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
        enabled: false, 
        baseURL: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: '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', // 请在此处填入您的API密钥
        defaultModel: 'deepseek/deepseek-chat-v3-0324:free', // 默认模型
        models: {
            'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3',
            'deepseek/deepseek-r1-0528:free': 'DeepSeek R1',
            'qwen/qwq-32b:free': '通义千问 QwQ',
            'qwen/qwen3-235b-a22b:free': '通义千问 3.0',
            'z-ai/glm-4.5-air:free': 'GLM-4.5 Air',
            'moonshotai/kimi-k2:free': 'Kimi K2',
            'tencent/hunyuan-a13b-instruct:free': '混元 A13B',
            'openai/gpt-oss-20b:free': 'GPT-OSS'
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
        defaultModel: 'deepseek-reasoning', // 默认模型
        models: {
            'openai': 'OpenAI',
            'openai-fast': 'OpenAI Fast',
            'gpt-5-nano': 'GPT-5 Nano',
            'openai-reasoning': 'GPT o3',
            'gemini': 'Gemini flash',
            'evil': 'Evil',
            'mistral': 'Mistral AI',
            'qwen': '通义千问 mini',
            'deepseek-reasoning': 'DeepSeek R1 flash'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}',
            "stream": true,
            'X-Title': 'NextAI'
        }
    },

    // Chat Anywhere配置
    chatanywhere: {
        name: 'Chat Anywhere',
        enabled: false,
        baseURL: 'https://api.chatanywhere.tech/v1/chat/completions',
        apiKey: 'sk-tPKcHK1b3gkjJ0873tB7btBlIbbW2nnaEb54L8YNS6KmbxB0', // 请在此处填入您的API密钥
        defaultModel: 'deepseek-r1', // 默认模型
        models: {
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'gpt-4.1': 'GPT-4.1',
            'gpt-4.1-mini': 'GPT-4.1 Mini',
            'gpt-4.1-nano': 'GPT-4.1 Nano',
            'gpt-5': 'GPT-5',
            'gpt-5-mini': 'GPT-5 Mini',
            'gpt-5-nano': 'GPT-5 Nano',
            'deepseek-v3': 'DeepSeek V3 Lite',
            'deepseek-r1': 'DeepSeek R1 Lite'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    },

    // Ollama配置（本地部署）
    ollama: {
        name: 'Ollama',
        enabled: false, 
        baseURL: 'http://localhost:11434/v1/chat/completions',
        apiKey: '', // Ollama不需要API密钥
        defaultModel: 'llama3.2', // 默认模型
        models: {
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
    },

    // ModelScope配置
    modelscope: {
        name: 'ModelScope',
        enabled: false,
        baseURL: 'https://api-inference.modelscope.cn/v1/chat/completions',
        apiKey: 'ms-1fc29858-708b-43ff-90a1-26a05483c77b', // 请在此处填入您的API密钥
        defaultModel: 'deepseek-ai/DeepSeek-V3.1', // 默认模型
        models: {
            'deepseek-ai/DeepSeek-V3':'DeepSeek V3',
            'deepseek-ai/DeepSeek-V3.1':'DeepSeek-V3.1',
            'deepseek-ai/DeepSeek-R1':'DeepSeek-R1',
            'Qwen/Qwen3-30B-A3B-Thinking-2507':'通义千问 3.0 mini',
            'Qwen/Qwen3-235B-A22B-Instruct-2507':'通义千问 3.0',
            'Qwen/Qwen3-235B-A22B-Thinking-2507':'通义千问 3.0 推理版',
            'moonshotai/Kimi-K2-Instruct':'Kimi K2',
            'ZhipuAI/GLM-4.5':'GLM-4.5',
            'MiniMax/MiniMax-M1-80k': 'MiniMax M1'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    }
};

// 图片API配置
const IMAGE_API_CONFIG = {
    // OpenAI DALL-E配置
    openai_dalle: {
        name: 'OpenAI DALL-E',
        enabled: false,
        baseURL: 'https://api.openai.com/v1/images/generations',
        apiKey: '', // 请在此处填入您的API密钥
        method: 'POST', // OpenAI使用POST方法
        defaultModel: 'dall-e-3', // 默认模型
        models: {
            'dall-e-3': 'DALL-E 3',
            'dall-e-2': 'DALL-E 2'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    },

    // Pollinations图片配置
    pollinations_image: {
        name: 'Pollinations Image',
        enabled: true,
        baseURL: 'https://image.pollinations.ai/prompt',
        apiKey: '38DJtIV7dXrRdYNl', 
        method: 'GET', // Pollinations使用GET方法
        defaultModel: 'turbo', // 默认模型
        models: {
            'turbo': 'Turbo',
            'flux': 'Flux 通用版',
            'flux-3d': 'Flux 3D风格',
            'flux-pro': 'Flux 专业版',
            'flux-realism': 'Flux 写实风格',
            'flux-anime': 'Flux 动漫风格',
        },
        headers: {
            // GET请求不需要Content-Type
        }
    },

    // Stability AI配置
    stability: {
        name: 'Stability AI',
        enabled: false,
        baseURL: 'https://api.stability.ai/v1/generation',
        apiKey: '', // 请在此处填入您的API密钥
        method: 'POST', // Stability AI使用POST方法
        defaultModel: 'stable-diffusion-xl-1024-v1-0', // 默认模型
        models: {
            'stable-diffusion-xl-1024-v1-0': 'Stable Diffusion XL',
            'stable-diffusion-v1-6': 'Stable Diffusion v1.6',
            'stable-diffusion-512-v2-1': 'Stable Diffusion v2.1'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    },

    // Midjourney (通过第三方API)
    midjourney: {
        name: 'Midjourney',
        enabled: false,
        baseURL: 'https://api.midjourney.com/v1/imagine',
        apiKey: '', // 请在此处填入您的API密钥
        method: 'POST', // Midjourney使用POST方法
        defaultModel: 'midjourney-v6', // 默认模型
        models: {
            'midjourney-v6': 'Midjourney v6',
            'midjourney-v5': 'Midjourney v5',
            'niji-v6': 'Niji v6'
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {API_KEY}'
        }
    }
};

// 为了向后兼容，保留原有的API_CONFIG
const API_CONFIG = TEXT_API_CONFIG;

// 默认配置
const DEFAULT_CONFIG = {
    // 文本API配置
    currentProvider: null, // 将自动检测第一个启用的提供商
    currentModel: null, // 将自动检测第一个模型
    temperature: 0.7,
    topP: 1.0,
    contextLength: 10, // 上下文长度（0-25）
    maxTokens: 2048,
    timeout: 30000, // 30秒超时
    retryAttempts: 3,
    
    // 图片API配置
    currentImageProvider: null, // 当前图片API提供商
    currentImageModel: null, // 当前图片模型
    imageWidth: 1024, // 图片宽度
    imageHeight: 1024, // 图片高度
    imageSteps: 20, // 生成步数
    imageGuidanceScale: 7.5 // 引导比例
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
            const providerConfig = TEXT_API_CONFIG[firstProvider.key];
            const modelKeys = Object.keys(firstProvider.models || {});
            if (modelKeys.length > 0) {
                // 优先使用defaultModel，如果没有设置则使用第一个模型
                const defaultModel = providerConfig?.defaultModel;
                const selectedModel = (defaultModel && modelKeys.includes(defaultModel)) ? defaultModel : modelKeys[0];
                return {
                    provider: firstProvider.key,
                    model: selectedModel
                };
            }
        }
        // 如果没有启用的提供商，返回null
        return null;
    }

    // 获取第一个启用的图片提供商和模型
    getFirstEnabledImageProviderAndModel() {
        const enabledProviders = this.getImageProviders();
        if (enabledProviders.length > 0) {
            const firstProvider = enabledProviders[0];
            const providerConfig = IMAGE_API_CONFIG[firstProvider.key];
            const modelKeys = Object.keys(firstProvider.models || {});
            if (modelKeys.length > 0) {
                // 优先使用defaultModel，如果没有设置则使用第一个模型
                const defaultModel = providerConfig?.defaultModel;
                const selectedModel = (defaultModel && modelKeys.includes(defaultModel)) ? defaultModel : modelKeys[0];
                return {
                    provider: firstProvider.key,
                    model: selectedModel
                };
            }
        }
        // 如果没有启用的提供商，返回null
        return null;
    }

    // 获取指定文本提供商的默认模型
    getProviderDefaultModel(provider) {
        const providerConfig = TEXT_API_CONFIG[provider];
        if (providerConfig && providerConfig.models) {
            const modelKeys = Object.keys(providerConfig.models);
            if (modelKeys.length > 0) {
                // 优先使用defaultModel，如果没有设置则使用第一个模型
                const defaultModel = providerConfig.defaultModel;
                return (defaultModel && modelKeys.includes(defaultModel)) ? defaultModel : modelKeys[0];
            }
        }
        return null;
    }

    // 获取指定图像提供商的默认模型
    getImageProviderDefaultModel(provider) {
        const providerConfig = IMAGE_API_CONFIG[provider];
        if (providerConfig && providerConfig.models) {
            const modelKeys = Object.keys(providerConfig.models);
            if (modelKeys.length > 0) {
                // 优先使用defaultModel，如果没有设置则使用第一个模型
                const defaultModel = providerConfig.defaultModel;
                return (defaultModel && modelKeys.includes(defaultModel)) ? defaultModel : modelKeys[0];
            }
        }
        return null;
    }

    // 初始化配置，确保使用启用的提供商
    initializeConfig() {
        const enabledProviders = this.getProviders();
        
        // 只有在没有设置提供商或提供商确实不存在时才自动检测
        if (!this.config.currentProvider) {
            const firstEnabled = this.getFirstEnabledProviderAndModel();
            if (firstEnabled) {
                this.config.currentProvider = firstEnabled.provider;
                this.config.currentModel = firstEnabled.model;
                this.saveConfig();
            }
        } else {
            // 检查当前提供商是否存在于配置中（不检查是否启用）
            const providerExists = TEXT_API_CONFIG.hasOwnProperty(this.config.currentProvider);
            if (!providerExists) {
                // 提供商不存在，才重置
                const firstEnabled = this.getFirstEnabledProviderAndModel();
                if (firstEnabled) {
                    this.config.currentProvider = firstEnabled.provider;
                    this.config.currentModel = firstEnabled.model;
                    this.saveConfig();
                } else {
                    this.config.currentProvider = null;
                    this.config.currentModel = null;
                }
            }
        }
        
        // 只有在没有设置模型或模型确实不存在时才重置
        if (!this.config.currentModel && this.config.currentProvider) {
            const currentProvider = this.getCurrentProvider();
            if (currentProvider) {
                const defaultModel = this.getProviderDefaultModel(this.config.currentProvider);
                if (defaultModel) {
                    this.config.currentModel = defaultModel;
                    this.saveConfig();
                }
            }
        } else if (this.config.currentModel && this.config.currentProvider) {
            // 检查模型是否存在于当前提供商中
            const currentProvider = this.getCurrentProvider();
            if (currentProvider && !currentProvider.models.hasOwnProperty(this.config.currentModel)) {
                // 模型不存在，使用默认模型
                const defaultModel = this.getProviderDefaultModel(this.config.currentProvider);
                if (defaultModel) {
                    this.config.currentModel = defaultModel;
                    this.saveConfig();
                }
            }
        }

        // 初始化图片API配置 - 同样的逻辑
        const enabledImageProviders = this.getImageProviders();
        
        // 只有在没有设置图片提供商时才自动检测
        if (!this.config.currentImageProvider) {
            const firstEnabledImage = this.getFirstEnabledImageProviderAndModel();
            if (firstEnabledImage) {
                this.config.currentImageProvider = firstEnabledImage.provider;
                this.config.currentImageModel = firstEnabledImage.model;
                this.saveConfig();
            }
        } else {
            // 检查当前图片提供商是否存在于配置中
            const providerExists = IMAGE_API_CONFIG.hasOwnProperty(this.config.currentImageProvider);
            if (!providerExists) {
                const firstEnabledImage = this.getFirstEnabledImageProviderAndModel();
                if (firstEnabledImage) {
                    this.config.currentImageProvider = firstEnabledImage.provider;
                    this.config.currentImageModel = firstEnabledImage.model;
                    this.saveConfig();
                } else {
                    this.config.currentImageProvider = null;
                    this.config.currentImageModel = null;
                }
            }
        }
        
        // 只有在没有设置图片模型或模型确实不存在时才重置
        if (!this.config.currentImageModel && this.config.currentImageProvider) {
            const currentImageProvider = this.getCurrentImageProvider();
            if (currentImageProvider) {
                const defaultModel = this.getImageProviderDefaultModel(this.config.currentImageProvider);
                if (defaultModel) {
                    this.config.currentImageModel = defaultModel;
                    this.saveConfig();
                }
            }
        } else if (this.config.currentImageModel && this.config.currentImageProvider) {
            // 检查图片模型是否存在于当前提供商中
            const currentImageProvider = this.getCurrentImageProvider();
            if (currentImageProvider && !currentImageProvider.models.hasOwnProperty(this.config.currentImageModel)) {
                const defaultModel = this.getImageProviderDefaultModel(this.config.currentImageProvider);
                if (defaultModel) {
                    this.config.currentImageModel = defaultModel;
                    this.saveConfig();
                }
            }
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
            // 加载文本API密钥
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

            // 加载图片API密钥
            const savedImageApiKeys = localStorage.getItem('ai_chat_image_api_keys');
            if (savedImageApiKeys) {
                const imageApiKeys = JSON.parse(savedImageApiKeys);
                Object.keys(imageApiKeys).forEach(provider => {
                    if (IMAGE_API_CONFIG[provider] && imageApiKeys[provider]) {
                        // 只有当保存的密钥不为空时才覆盖
                        if (imageApiKeys[provider].trim() !== '') {
                            IMAGE_API_CONFIG[provider].apiKey = imageApiKeys[provider];
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
            // 保存文本API密钥
            const apiKeys = {};
            Object.keys(API_CONFIG).forEach(provider => {
                if (API_CONFIG[provider].apiKey) {
                    apiKeys[provider] = API_CONFIG[provider].apiKey;
                }
            });
            localStorage.setItem('ai_chat_api_keys', JSON.stringify(apiKeys));

            // 保存图片API密钥
            const imageApiKeys = {};
            Object.keys(IMAGE_API_CONFIG).forEach(provider => {
                if (IMAGE_API_CONFIG[provider].apiKey) {
                    imageApiKeys[provider] = IMAGE_API_CONFIG[provider].apiKey;
                }
            });
            localStorage.setItem('ai_chat_image_api_keys', JSON.stringify(imageApiKeys));
        } catch (error) {
            console.warn('保存API密钥失败:', error);
        }
    }

    // 获取当前提供商配置
    getCurrentProvider() {
        return API_CONFIG[this.config.currentProvider];
    }

    // 获取当前图片提供商配置
    getCurrentImageProvider() {
        return IMAGE_API_CONFIG[this.config.currentImageProvider];
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

    // 设置当前图片提供商
    setImageProvider(provider) {
        if (IMAGE_API_CONFIG[provider]) {
            this.config.currentImageProvider = provider;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 设置当前模型
    setModel(model) {
        const provider = this.getCurrentProvider();
        if (provider && provider.models && provider.models.hasOwnProperty(model)) {
            this.config.currentModel = model;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 设置当前图片模型
    setImageModel(model) {
        const provider = this.getCurrentImageProvider();
        if (provider && provider.models && provider.models.hasOwnProperty(model)) {
            this.config.currentImageModel = model;
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

    // 设置图片参数
    setImageWidth(width) {
        const w = parseInt(width);
        if (w > 0 && w <= 2048) {
            this.config.imageWidth = w;
            this.saveConfig();
            return true;
        }
        return false;
    }

    setImageHeight(height) {
        const h = parseInt(height);
        if (h > 0 && h <= 2048) {
            this.config.imageHeight = h;
            this.saveConfig();
            return true;
        }
        return false;
    }

    setImageSteps(steps) {
        const s = parseInt(steps);
        if (s > 0 && s <= 100) {
            this.config.imageSteps = s;
            this.saveConfig();
            return true;
        }
        return false;
    }

    setImageGuidanceScale(scale) {
        const gs = parseFloat(scale);
        if (gs >= 1 && gs <= 20) {
            this.config.imageGuidanceScale = gs;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 获取图片参数
    getImageWidth() {
        return this.config.imageWidth;
    }

    getImageHeight() {
        return this.config.imageHeight;
    }

    getImageSteps() {
        return this.config.imageSteps;
    }

    getImageGuidanceScale() {
        return this.config.imageGuidanceScale;
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

    // 设置图片API密钥
    setImageApiKey(provider, apiKey) {
        if (IMAGE_API_CONFIG[provider]) {
            IMAGE_API_CONFIG[provider].apiKey = apiKey;
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

    // 获取图片API密钥
    getImageApiKey(provider) {
        return IMAGE_API_CONFIG[provider]?.apiKey || '';
    }

    // 获取模型别名
    getModelAlias(provider, model) {
        const providerConfig = API_CONFIG[provider];
        if (!providerConfig || !providerConfig.models) {
            return model; // 如果没有模型配置，返回原始模型名
        }
        return providerConfig.models[model] || model;
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

    // 获取图片API请求头
    getImageHeaders(provider) {
        const providerConfig = IMAGE_API_CONFIG[provider];
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

    // 获取图片API的HTTP方法
    getImageMethod(provider) {
        const providerConfig = IMAGE_API_CONFIG[provider];
        return providerConfig?.method || 'POST'; // 默认使用POST方法
    }

    // 启用或禁用API提供商
    setProviderEnabled(provider, enabled) {
        if (API_CONFIG[provider]) {
            API_CONFIG[provider].enabled = enabled;
            return true;
        }
        return false;
    }

    // 设置图片提供商启用状态
    setImageProviderEnabled(provider, enabled) {
        if (IMAGE_API_CONFIG[provider]) {
            IMAGE_API_CONFIG[provider].enabled = enabled;
            this.saveConfig();
        }
    }

    // 获取所有提供商（包括禁用的）
    getAllProviders() {
        return Object.keys(API_CONFIG).map(key => ({
            key,
            name: API_CONFIG[key].name,
            enabled: API_CONFIG[key].enabled,
            models: Object.keys(API_CONFIG[key].models || {})
        }));
    }

    // 获取所有图片提供商（包括禁用的）
    getAllImageProviders() {
        return Object.keys(IMAGE_API_CONFIG).map(key => ({
            key,
            name: IMAGE_API_CONFIG[key].name,
            enabled: IMAGE_API_CONFIG[key].enabled,
            models: Object.keys(IMAGE_API_CONFIG[key].models || {})
        }));
    }

    // 获取所有可用的提供商（只返回启用的）
    getProviders() {
        return Object.keys(API_CONFIG)
            .filter(key => API_CONFIG[key].enabled) // 只返回启用的API
            .map(key => ({
                key,
                name: API_CONFIG[key].name,
                models: Object.keys(API_CONFIG[key].models || {})
            }));
    }

    // 获取所有可用的图片提供商（只返回启用的）
    getImageProviders() {
        return Object.keys(IMAGE_API_CONFIG)
            .filter(key => IMAGE_API_CONFIG[key].enabled) // 只返回启用的API
            .map(key => ({
                key,
                name: IMAGE_API_CONFIG[key].name,
                models: Object.keys(IMAGE_API_CONFIG[key].models || {})
            }));
    }

    // 检查文本提供商是否启用
    isProviderEnabled(provider) {
        return TEXT_API_CONFIG[provider]?.enabled || false;
    }

    // 检查图像提供商是否启用
    isImageProviderEnabled(provider) {
        return IMAGE_API_CONFIG[provider]?.enabled || false;
    }

    // 检查文本模型是否在指定提供商中可用
    isModelAvailable(provider, model) {
        const providerConfig = TEXT_API_CONFIG[provider];
        return providerConfig && providerConfig.models && providerConfig.models.hasOwnProperty(model);
    }

    // 检查图像模型是否在指定提供商中可用
    isImageModelAvailable(provider, model) {
        const providerConfig = IMAGE_API_CONFIG[provider];
        return providerConfig && providerConfig.models && providerConfig.models.hasOwnProperty(model);
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