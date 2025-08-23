class ChatApp {
    constructor() {
        this.configManager = new ConfigManager();
        this.roleManager = new RoleManager();
        this.messageRenderer = new MessageRenderer();
        this.chatHistoryManager = new ChatHistoryManager();
        this.currentModel = this.configManager.config.currentModel;
        this.currentModelAlias = this.configManager.getCurrentModelAlias() || this.currentModel;
        this.messages = [];
        this.currentStreamInterval = null; // 当前流式传输间隔
        this.currentAiMessageDiv = null; // 当前AI消息容器引用
        this.isResponseActive = false; // 是否有响应正在进行
        this.hasReceivedResponse = false; // 是否已收到响应内容
        this.isDarkMode = this.getStoredTheme() === 'dark';
        this.selectedRoleId = null; // 角色选择模态框中选中的角色ID
        
        // 使用场景相关
        this.currentScenario = this.getStoredScenario() || 'chat'; // 当前使用场景：'chat' 或 'image'
        this.isImageMode = false; // 标记当前是否为图像生成模式
        this.savedTextModel = null; // 保存的文本模型
        this.savedTextProvider = null; // 保存的文本提供商
        
        // 性能优化相关属性
        this.lastThinkingContent = {}; // 缓存思考过程内容，避免重复渲染
        this.scrollThrottleTimer = null; // 滚动节流定时器
        this.renderQueue = new Map(); // 渲染队列，批量处理DOM更新
        
        // 用户滚动状态跟踪
        this.userScrolling = false; // 用户是否正在手动滚动
        this.scrollTimeout = null; // 滚动超时定时器
        this.lastScrollTop = 0; // 上次滚动位置
        
        // 回到底部按钮
        this.scrollToBottomBtn = null; // 回到底部按钮引用
        this.showScrollButtonThreshold = 200; // 显示按钮的滚动阈值
        
        // @角色选择功能相关属性
        this.roleMentionState = {
            isVisible: false,
            selectedIndex: -1,
            mentionStart: -1,
            mentionEnd: -1,
            searchQuery: '',
            filteredRoles: []
        };
        
        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeScenario();
        this.initializeSidebarState();
        
        // 使用用户保存的配置初始化当前模型和提供商
        this.currentProvider = this.configManager.getCurrentProvider()?.key || this.configManager.config.currentProvider;
        this.currentModel = this.configManager.config.currentModel;
        
        // 如果没有有效的配置，才使用默认配置
        if (!this.currentProvider || !this.currentModel || 
            !this.configManager.isProviderEnabled(this.currentProvider) ||
            !this.configManager.isModelAvailable(this.currentProvider, this.currentModel)) {
            const result = this.configManager.getFirstEnabledProviderAndModel();
            if (result) {
                this.currentProvider = result.provider;
                this.currentModel = result.model;
            }
        }
        
        this.initializeModelOptions();
        this.updateModelDisplay();
        this.initializeScrollToBottomButton();
        this.bindEvents();
        this.loadChatHistory();
        
        // 检查是否需要显示欢迎界面（当没有其他消息时）
        if (this.messages.length === 0) {
            this.showWelcomeScreen();
        }
        
        // 确保初始状态滚动到底部（使用智能滚动）
        setTimeout(() => {
            this.smartScrollToBottom();
        }, 100);
    }

    // 初始化主题
    initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return; // 如果找不到元素，直接返回
        
        // 使用updateThemeDisplay来统一处理主题显示
        this.updateThemeDisplay();

        // 监听系统主题变化
        this.setupSystemThemeListener();
    }

    // 设置系统主题变化监听器
    setupSystemThemeListener() {
        try {
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                
                // 监听系统主题变化
                const handleThemeChange = (e) => {
                    const storedTheme = localStorage.getItem('theme');
                    
                    // 只有在没有手动设置主题或设置为自动时才响应系统主题变化
                    if (!storedTheme || storedTheme === 'auto') {
                        const newTheme = e.matches ? 'dark' : 'light';
                        this.isDarkMode = newTheme === 'dark';
                        this.updateThemeDisplay();
                        this.addSystemMessage(`检测到系统主题变化，已自动切换到${this.isDarkMode ? '夜间' : '白昼'}模式`);
                    }
                };

                // 添加监听器
                if (mediaQuery.addListener) {
                    mediaQuery.addListener(handleThemeChange);
                } else if (mediaQuery.addEventListener) {
                    mediaQuery.addEventListener('change', handleThemeChange);
                }
            }
        } catch (error) {
            console.warn('无法设置系统主题监听器:', error);
        }
    }

    // 更新主题显示
    updateThemeDisplay() {
        const themeToggle = document.getElementById('themeToggle');
        const themeText = document.getElementById('themeText');
        if (!themeToggle) return;

        const theme = this.isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);

        if (this.isDarkMode) {
            themeToggle.querySelector('i').className = 'fas fa-moon';
            themeToggle.classList.add('dark-mode');
            if (themeText) {
                themeText.textContent = '夜间模式';
            }
        } else {
            themeToggle.querySelector('i').className = 'fas fa-sun';
            themeToggle.classList.remove('dark-mode');
            if (themeText) {
                themeText.textContent = '白昼模式';
            }
        }
    }

    // 获取存储的主题，支持自动检测系统主题
    getStoredTheme() {
        const storedTheme = localStorage.getItem('theme');
        
        // 如果没有存储的主题设置，尝试检测系统主题
        if (!storedTheme) {
            return this.detectSystemTheme();
        }
        
        // 如果存储的是 'auto'，也检测系统主题
        if (storedTheme === 'auto') {
            return this.detectSystemTheme();
        }
        
        return storedTheme;
    }

    // 检测系统主题
    detectSystemTheme() {
        try {
            // 检查浏览器是否支持 prefers-color-scheme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        } catch (error) {
            console.warn('无法检测系统主题，使用默认白昼模式:', error);
            return 'light';
        }
    }

    // 保存主题设置
    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // 初始化模型选项
    initializeModelOptions() {
        const modelOptions = document.getElementById('modelOptions');
        if (!modelOptions) return; // 如果找不到元素，直接返回
        
        const providers = this.configManager.getProviders();
        
        // 清空现有选项
        modelOptions.innerHTML = '';
        
        // 按提供商分组显示模型
        providers.forEach(provider => {
            if (!provider.models || provider.models.length === 0) return;
            
            // 创建提供商分组标题
            const providerGroup = document.createElement('div');
            providerGroup.className = 'provider-group';
            
            const providerHeader = document.createElement('div');
            providerHeader.className = 'provider-header';
            providerHeader.textContent = provider.name;
            providerGroup.appendChild(providerHeader);
            
            // 添加该提供商的所有模型
            provider.models.forEach(model => {
                const option = document.createElement('div');
                option.className = 'model-option';
                option.dataset.model = model;
                option.dataset.provider = provider.key;
                
                // 获取模型别名
                const modelAlias = this.configManager.getModelAlias(provider.key, model);
                option.textContent = modelAlias;
                
                // 检查是否为当前选中的文本模型
                if (model === this.configManager.config.currentModel && provider.key === this.configManager.config.currentProvider) {
                    option.classList.add('active');
                }
                
                providerGroup.appendChild(option);
            });
            
            modelOptions.appendChild(providerGroup);
        });
        
        // 重新绑定模型选择事件
        this.rebindModelEvents();
    }

    // 初始化回到底部按钮
    initializeScrollToBottomButton() {
        this.scrollToBottomBtn = document.getElementById('scrollToBottom');
        if (!this.scrollToBottomBtn) return;
        
        // 初始状态隐藏按钮
        this.scrollToBottomBtn.classList.remove('show');
    }

    bindEvents() {
        // 模型选择器事件
        const modelBtn = document.getElementById('modelBtn');
        const modelOptions = document.getElementById('modelOptions');
        
        if (modelBtn && modelOptions) {
            modelBtn.addEventListener('click', () => {
                modelOptions.classList.toggle('show');
            });

            // 点击外部关闭下拉菜单
            document.addEventListener('click', (e) => {
                if (!modelBtn.contains(e.target) && !modelOptions.contains(e.target)) {
                    modelOptions.classList.remove('show');
                }
            });
        }

        // 点击模型选项
        document.querySelectorAll('.model-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const model = e.target.dataset.model;
                const provider = e.target.dataset.provider;
                this.selectModel(model, provider);
                if (modelOptions) {
                    modelOptions.classList.remove('show');
                }
            });
        });

        // 发送消息事件
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                if (sendBtn.classList.contains('stop-mode')) {
                    this.stopGeneration();
                } else {
                    this.sendMessage();
                }
            });
        }

        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                // 处理@角色选择下拉菜单的键盘导航
                if (this.isRoleMentionDropdownVisible()) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.navigateRoleMention('down');
                        return;
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.navigateRoleMention('up');
                        return;
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        this.selectCurrentRoleMention();
                        return;
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        this.hideRoleMentionDropdown();
                        return;
                    }
                }
                
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // 自动调整输入框高度和处理@角色选择
            messageInput.addEventListener('input', (e) => {
                this.adjustTextareaHeight(messageInput);
                this.handleRoleMentionInput(e);
            });

            // 处理光标位置变化
            messageInput.addEventListener('selectionchange', () => {
                this.handleSelectionChange();
            });

            // 点击输入框时检查是否需要隐藏下拉菜单
            messageInput.addEventListener('click', () => {
                this.handleInputClick();
            });
        }

        // 新建聊天按钮
        const newChatBtn = document.querySelector('.new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', (e) => {
                if (e.target.closest('.new-chat-btn').querySelector('.fa-plus')) {
                    this.newChat();
                } 
            });
        }

        // 清空列表
        const clearAllBtn = document.querySelector('.clearall');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearChatHistory();
            });
        }

        // 主题切换按钮
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // 使用场景切换按钮
        const scenarioToggle = document.getElementById('scenarioToggle');
        if (scenarioToggle) {
            scenarioToggle.addEventListener('click', () => {
                this.toggleScenario();
            });
        }

        // 角色选择按钮
        const roleSelector = document.getElementById('roleSelector');
        if (roleSelector) {
            roleSelector.addEventListener('click', () => {
                this.showRoleModal();
            });
        }



        // 设置按钮
        const settingsToggle = document.getElementById('settingsToggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Tools按钮事件
        const toolsBtn = document.getElementById('toolsBtn');
        const toolsDropdown = document.getElementById('toolsDropdown');
        
        if (toolsBtn && toolsDropdown) {
            toolsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleToolsDropdown();
            });

            // 点击外部关闭tools下拉菜单
            document.addEventListener('click', (e) => {
                if (!toolsBtn.contains(e.target) && !toolsDropdown.contains(e.target)) {
                    this.hideToolsDropdown();
                }
            });
        }



        // 创建图片开关
        const imageGenerationSwitch = document.getElementById('imageGenerationSwitch');
        if (imageGenerationSwitch) {
            imageGenerationSwitch.addEventListener('change', (e) => {
                this.toggleImageGeneration(e.target.checked);
            });
        }

        // 侧边栏折叠功能
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarExpand = document.getElementById('sidebarExpand');
        const sidebar = document.getElementById('sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        if (sidebarExpand && sidebar) {
            sidebarExpand.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // 角色模态框事件
        this.bindRoleModalEvents();

        // 点击外部隐藏@角色选择下拉菜单
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('roleMentionDropdown');
            const messageInput = document.getElementById('messageInput');
            
            if (dropdown && messageInput && 
                !dropdown.contains(e.target) && 
                !messageInput.contains(e.target)) {
                this.hideRoleMentionDropdown();
            }
        });

        // 窗口大小变化监听器
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // 聊天容器滚动事件监听器
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.addEventListener('scroll', () => {
                this.handleUserScroll();
                this.updateScrollToBottomButton();
            });
        }

        // 回到底部按钮事件监听器
        if (this.scrollToBottomBtn) {
            this.scrollToBottomBtn.addEventListener('click', () => {
                this.scrollToBottomWithButton();
            });
        }
    }

    // 处理窗口大小变化
    handleWindowResize() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 切换到移动端：移除桌面端的collapsed类，确保使用移动端的open/close逻辑
            sidebar.classList.remove('collapsed');
            if (!sidebar.classList.contains('open')) {
                // 移动端默认关闭
                sidebar.classList.remove('open');
            }
        } else {
            // 切换到桌面端：移除移动端的open类，根据本地存储设置collapsed状态
            sidebar.classList.remove('open');
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            } else {
                sidebar.classList.remove('collapsed');
            }
        }
    }

    selectModel(model, provider, showNotification = true) {
        // 防止重复调用 - 检查是否已经是当前选中的模型
        if (this.currentModel === model && this.currentProvider === provider) {
            return;
        }
        
        // 根据当前模式设置不同的提供商和模型
        if (this.isImageMode) {
            // 图像模式：设置图像提供商和模型
            this.configManager.setImageProvider(provider);
            this.configManager.setImageModel(model);
        } else {
            // 文本模式：设置文本提供商和模型
            this.configManager.setProvider(provider);
            this.configManager.setModel(model);
        }
        
        this.currentModel = model;
        this.currentProvider = provider;
        this.currentModelAlias = this.configManager.getModelAlias(provider, model) || model;
        
        // 更新UI显示
        this.updateModelDisplay();
        
        // 更新选中状态
        document.querySelectorAll('.model-option').forEach(option => {
            option.classList.remove('active');
        });
        const selectedOption = document.querySelector(`[data-model="${model}"][data-provider="${provider}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
        
        // 只在需要显示通知时才检查API配置并显示消息
        if (showNotification) {
            // 检查API配置
            let validation;
            if (this.isImageMode) {
                // 图像模式的验证逻辑
                const imageProviders = this.configManager.getAllImageProviders();
                const currentProvider = imageProviders[provider];
                validation = {
                    valid: currentProvider && currentProvider.enabled,
                    error: currentProvider ? (currentProvider.enabled ? '' : '提供商未启用') : '提供商不存在'
                };
            } else {
                validation = this.configManager.validateConfig(provider);
            }
            
            if (!validation.valid) {
                this.addSystemMessage(`${validation.error}，请在设置中配置API密钥`);
            } else {
                const modelAlias = this.configManager.getModelAlias(provider, model);
                const modeText = this.isImageMode ? '图像生成模型' : '对话模型';
                this.addSystemMessage(`已切换到 ${modelAlias} (${modeText})`);
                
                // 如果当前聊天是"新建聊天"，更新标题为模型名称
                const currentChat = this.chatHistoryManager.getCurrentChat();
                if (currentChat && currentChat.title === '新建聊天') {
                    const newTitle = modelAlias;
                    this.chatHistoryManager.renameChat(currentChat.id, newTitle);
                    this.renderChatList();
                }
            }
        }
    }

    // 更新模型显示
    updateModelDisplay() {
        const currentProvider = this.configManager.config.currentProvider;
        const currentModel = this.configManager.config.currentModel;
        const modelBtnSpan = document.querySelector('#modelBtn span');
        
        if (!modelBtnSpan) return; // 如果找不到元素，直接返回
        
        if (currentProvider && currentModel) {
            const providerConfig = this.configManager.getCurrentProvider();
            const modelAlias = this.configManager.getCurrentModelAlias();
            modelBtnSpan.textContent = modelAlias;
        } else {
            modelBtnSpan.textContent = '选择模型';
        }
    }

    // 显示API密钥输入提示
    async showApiKeyPrompt(provider) {
        const providerConfig = API_CONFIG[provider];
        const apiKey = await this.showInputDialog(
            `请输入 ${providerConfig.name} 的API密钥:`,
            '',
            '请输入API密钥'
        );
        
        if (apiKey) {
            this.configManager.setApiKey(provider, apiKey);
            this.addSystemMessage(`✅ API密钥已设置，可以开始对话了！`);
        } else {
            this.addSystemMessage(`⚠️ 未设置API密钥，无法使用 ${providerConfig.name} 服务`);
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        console.log('发送消息:', message);

        // 检查当前聊天状态
        const currentChat = this.chatHistoryManager.getCurrentChat();
        const hasUserMessages = this.messages.some(msg => msg.type === 'user');

        // 如果没有当前聊天，或者当前聊天不是手动创建且没有用户消息，则自动创建新聊天
        if (!currentChat || (!currentChat.isManuallyCreated && !hasUserMessages)) {
            // 使用第一条消息内容作为标题创建新聊天（自动创建）
            const newTitle = this.chatHistoryManager.generateTitle([{type: 'user', content: message}]);
            const newChat = this.chatHistoryManager.createNewChat(newTitle, false);
            this.chatHistoryManager.currentChatId = newChat.id;
            this.messages = []; // 清空当前消息列表（包括欢迎消息）
            this.renderChatList();
        }

        // 添加用户消息
        this.addMessage('user', message);
        messageInput.value = '';
        this.adjustTextareaHeight(messageInput);
        
        // 用户发送消息后立即滚动到底部
        setTimeout(() => {
            this.forceScrollToBottom();
        }, 100);

        // 创建AI消息容器并显示思考指示器
        console.log('创建AI消息容器...');
        const aiMessageDiv = this.addMessage('assistant', '__THINKING__', false, false);
        console.log('AI消息容器已创建:', aiMessageDiv);
        
        const messageContent = aiMessageDiv.querySelector('.message-content');
        console.log('获取消息内容容器:', messageContent);
        console.log('调用showThinkingIndicator...');
        this.showThinkingIndicator(messageContent);
        
        // 保存AI消息容器的引用
        this.currentAiMessageDiv = aiMessageDiv;
        console.log('AI消息容器引用已保存');

        // 更新发送按钮状态
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.innerHTML = '<i class="fas fa-stop"></i>';
        sendBtn.classList.add('stop-mode');
        sendBtn.disabled = false;

        // 调用真实API
        this.callAI(message);
    }

    // 验证API密钥
    async validateApiKey(provider) {
        const providerConfig = this.configManager.getCurrentProvider();
        if (!providerConfig) return false;

        try {
            // 对于OpenRouter，使用专门的验证端点
            if (provider === 'openrouter') {
                const response = await fetch('https://openrouter.ai/api/v1/key', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${providerConfig.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API密钥验证成功:', data);
                    return true;
                } else {
                    console.error('API密钥验证失败:', response.status, response.statusText);
                    return false;
                }
            }
            
            // 对于其他提供商，可以添加相应的验证逻辑
            return true;
        } catch (error) {
            console.error('API密钥验证错误:', error);
            return false;
        }
    }

    async callAI(userMessage) {
        const startTime = Date.now();
        
        // 根据模式选择不同的处理方式
        if (this.isImageMode) {
            return await this.callImageAPI(userMessage, startTime);
        }
        
        const config = this.configManager.getConfig();
        const provider = config.provider;
        
        if (!provider) {
            // 移除思考指示器并添加特定的错误回复
            if (this.currentAiMessageDiv) {
                const messageContent = this.currentAiMessageDiv.querySelector('.message-content');
                this.hideThinkingIndicator(messageContent);
                this.messageRenderer.renderInstant(messageContent, '没有可用的API提供商，请在设置中启用至少一个API');
                
                // 保存到消息历史
                this.messages.push({ 
                    type: 'assistant', 
                    content: '没有可用的API提供商，请在设置中启用至少一个API',
                    responseTime: 0,
                    timestamp: new Date(),
                    hasThinking: false
                });
                
                // 自动保存到聊天历史
                this.chatHistoryManager.saveMessages(this.messages);
            } else {
                this.addMessage('assistant', '没有可用的API提供商，请在设置中启用至少一个API');
            }
            this.resetSendButton();
            return;
        }

        // 验证API配置
        const validation = this.configManager.validateConfig(config.currentProvider);
        if (!validation.valid) {
            // 移除思考指示器并添加统一的错误回复
            if (this.currentAiMessageDiv) {
                const messageContent = this.currentAiMessageDiv.querySelector('.message-content');
                this.hideThinkingIndicator(messageContent);
                this.messageRenderer.renderInstant(messageContent, '接口调用失败，请换个模型试试吧');
                
                // 保存到消息历史
                this.messages.push({ 
                    type: 'assistant', 
                    content: '接口调用失败，请换个模型试试吧',
                    responseTime: 0,
                    timestamp: new Date(),
                    hasThinking: false
                });
                
                // 自动保存到聊天历史
                this.chatHistoryManager.saveMessages(this.messages);
            } else {
                this.addMessage('assistant', '接口调用失败，请换个模型试试吧');
            }
            this.resetSendButton();
            return;
        }

        // 验证API密钥是否有效
        if (config.currentProvider === 'openrouter') {
            const isValidKey = await this.validateApiKey(config.currentProvider);
            if (!isValidKey) {
                // 移除思考指示器并添加特定的错误回复
                if (this.currentAiMessageDiv) {
                    const messageContent = this.currentAiMessageDiv.querySelector('.message-content');
                    this.hideThinkingIndicator(messageContent);
                    this.messageRenderer.renderInstant(messageContent, '认证失败，请在设置中检查并重新配置API密钥');
                    
                    // 保存到消息历史
                    this.messages.push({ 
                        type: 'assistant', 
                        content: '认证失败，请在设置中检查并重新配置API密钥',
                        responseTime: 0,
                        timestamp: new Date(),
                        hasThinking: false
                    });
                    
                    // 自动保存到聊天历史
                    this.chatHistoryManager.saveMessages(this.messages);
                } else {
                    this.addMessage('assistant', '认证失败，请在设置中检查并重新配置API密钥');
                }
                this.resetSendButton();
                return;
            }
        }

        // 创建AbortController用于取消请求
        this.currentAbortController = new AbortController();
        
        // 设置响应状态
        this.isResponseActive = true;
        this.hasReceivedResponse = false;

        try {
            // 准备消息历史（根据上下文长度限制）
            const contextLength = this.configManager.getContextLength();
            const recentMessages = this.getRecentMessages(contextLength);
            
            // 添加当前用户消息
            recentMessages.push({
                role: 'user',
                content: userMessage
            });

            // 准备API请求参数
            const requestBody = {
                model: config.currentModel,
                messages: recentMessages,
                temperature: this.configManager.getTemperature(),
                top_p: this.configManager.getTopP(),
                max_tokens: config.maxTokens,
                stream: true
            };

            // 获取API端点和请求头
            const apiUrl = provider.baseURL;
            const headers = this.configManager.getHeaders(config.currentProvider);
            
            // 调试信息
            console.log('API URL:', apiUrl);
            console.log('请求头:', headers);
            console.log('API密钥:', provider.apiKey ? `${provider.apiKey.substring(0, 10)}...` : '未设置');

            // 发送API请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
                signal: this.currentAbortController.signal
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            // 处理流式响应
            await this.handleStreamResponse(response, startTime);

        } catch (error) {
            if (error.name === 'AbortError') {
                // 用户主动中止的请求，stopGeneration方法已经处理了消息显示
                console.log('请求被用户中止');
            } else {
                console.error('API调用错误:', error);
                
                // 根据错误类型确定回复消息
                let errorMessage = '接口调用失败，请换个模型试试吧';
                if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
                    errorMessage = '认证失败，请在设置中检查并重新配置API密钥';
                }
                
                // 移除思考指示器并添加错误回复
                if (this.currentAiMessageDiv) {
                    const messageContent = this.currentAiMessageDiv.querySelector('.message-content');
                    this.hideThinkingIndicator(messageContent);
                    
                    this.messageRenderer.renderInstant(messageContent, errorMessage);
                    
                    // 保存到消息历史
                    this.messages.push({ 
                        type: 'assistant', 
                        content: errorMessage,
                        responseTime: 0,
                        timestamp: new Date(),
                        hasThinking: false
                    });
                    
                    // 自动保存到聊天历史
                    this.chatHistoryManager.saveMessages(this.messages);
                } else {
                    // 如果没有AI消息容器，直接添加bot消息
                    this.addMessage('assistant', errorMessage);
                }
            }
        } finally {
            this.currentAbortController = null;
            this.currentAiMessageDiv = null; // 清理AI消息容器引用
            this.isResponseActive = false; // 重置响应状态
            this.hasReceivedResponse = false; // 重置接收状态
            this.resetSendButton();
        }
    }

    // 停止生成
    stopGeneration() {
        // 检查是否有活跃的响应
        const wasResponseActive = this.isResponseActive;
        const hadReceivedResponse = this.hasReceivedResponse;
        
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        
        // 停止流式传输
        if (this.currentStreamInterval) {
            clearInterval(this.currentStreamInterval);
            this.currentStreamInterval = null;
        }
        
        // 根据响应状态决定是否添加停止消息
        if (wasResponseActive && !hadReceivedResponse) {
            // 模型未响应时停止，添加bot消息
            if (this.currentAiMessageDiv) {
                const messageContent = this.currentAiMessageDiv.querySelector('.message-content');
                this.hideThinkingIndicator(messageContent);
                this.messageRenderer.renderInstant(messageContent, '已手动停止响应');
                
                // 保存到消息历史
                this.messages.push({ 
                    type: 'assistant', 
                    content: '已手动停止响应',
                    responseTime: 0,
                    timestamp: new Date(),
                    hasThinking: false
                });
                
                // 自动保存到聊天历史
                this.chatHistoryManager.saveMessages(this.messages);
            } else {
                // 如果没有AI消息容器，直接添加bot消息
                this.addMessage('assistant', '已手动停止响应');
            }
        }
        // 如果模型正在响应时停止，则正常切断响应，不添加额外消息
        
        // 重置状态
        this.isResponseActive = false;
        this.hasReceivedResponse = false;
        this.resetSendButton();
    }

    // 获取最近的消息（根据上下文长度）
    getRecentMessages(contextLength) {
        if (contextLength === 0) {
            return [];
        }

        // 过滤出用户和助手的消息
        const chatMessages = this.messages.filter(msg => 
            msg.type === 'user' || msg.type === 'assistant'
        );

        // 获取最近的消息对（用户消息+助手回复为一对）
        const messagePairs = [];
        for (let i = 0; i < chatMessages.length; i += 2) {
            if (chatMessages[i] && chatMessages[i + 1]) {
                messagePairs.push([chatMessages[i], chatMessages[i + 1]]);
            } else if (chatMessages[i]) {
                messagePairs.push([chatMessages[i]]);
            }
        }

        // 取最近的N对消息
        const recentPairs = messagePairs.slice(-contextLength);
        const recentMessages = [];

        // 添加系统提示（角色设定）
        const currentRole = this.roleManager.getCurrentRole();
        if (currentRole.prompt) {
            recentMessages.push({
                role: 'system',
                content: currentRole.prompt
            });
        }

        // 展开消息对
        recentPairs.forEach(pair => {
            pair.forEach(msg => {
                recentMessages.push({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        });

        return recentMessages;
    }

    // 处理流式响应 - 优化版本
    async handleStreamResponse(response, startTime) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        let reasoningContent = '';
        let isDeepSeekR1 = false;
        
        // 优化：提高更新频率，使流式响应更流畅
        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 16; // 16ms更新一次（约60fps），提高流畅度
        
        // 批量更新缓冲区
        let pendingUpdate = false;

        // 使用已创建的AI消息容器
        const messageDiv = this.currentAiMessageDiv;
        const messageContent = messageDiv.querySelector('.message-content');

        try {
            let hasReceivedContent = false;
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;
                            
                            // 检查是否有思考过程内容 (DeepSeek-R1)
                            if (delta?.reasoning) {
                                isDeepSeekR1 = true;
                                reasoningContent += delta.reasoning;
                                console.log('收到思考过程内容:', delta.reasoning);
                                
                                // 首次收到内容时移除思考指示器
                                if (!hasReceivedContent) {
                                    this.hideThinkingIndicator(messageContent);
                                    hasReceivedContent = true;
                                    this.hasReceivedResponse = true; // 标记已收到响应
                                }
                            }
                            
                            // 检查是否有reasoning_content字段 (DeepSeek-R1新格式)
                            if (delta?.reasoning_content) {
                                isDeepSeekR1 = true;
                                reasoningContent += delta.reasoning_content;
                                console.log('收到reasoning_content思考过程内容:', delta.reasoning_content);
                                
                                // 首次收到内容时移除思考指示器
                                if (!hasReceivedContent) {
                                    this.hideThinkingIndicator(messageContent);
                                    hasReceivedContent = true;
                                    this.hasReceivedResponse = true; // 标记已收到响应
                                }
                            }
                            
                            // 处理常规内容
                            if (delta?.content) {
                                fullResponse += delta.content;
                                console.log('收到回答内容:', delta.content);
                                
                                // 检查是否包含<think>标签（用于pollination等API）
                                const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
                                if (thinkMatch && !isDeepSeekR1) {
                                    // 提取思考内容
                                    const thinkContent = thinkMatch[1];
                                    if (thinkContent && thinkContent !== reasoningContent) {
                                        isDeepSeekR1 = true; // 标记为有思考过程
                                        reasoningContent = thinkContent;
                                        console.log('检测到<think>标签思考过程:', thinkContent);
                                        
                                        // 从fullResponse中移除<think>标签内容
                                        fullResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>\s*/, '');
                                    }
                                }
                                
                                // 首次收到内容时移除思考指示器
                                if (!hasReceivedContent) {
                                    this.hideThinkingIndicator(messageContent);
                                    hasReceivedContent = true;
                                    this.hasReceivedResponse = true; // 标记已收到响应
                                }
                            }
                            
                            // 优化：使用更流畅的更新机制
                            const now = Date.now();
                            if (!pendingUpdate && now - lastUpdateTime > UPDATE_INTERVAL) {
                                pendingUpdate = true;
                                lastUpdateTime = now;
                                
                                // 使用 requestAnimationFrame 确保流畅更新
                                requestAnimationFrame(() => {
                                    try {
                                        // 批量更新DOM
                                        if (isDeepSeekR1 && reasoningContent) {
                                            this.updateThinkingProcess(messageDiv, reasoningContent);
                                        }
                                        
                                        if (fullResponse) {
                                            if (isDeepSeekR1) {
                                                this.updateFinalAnswer(messageDiv, fullResponse);
                                            } else {
                                                this.messageRenderer.renderInstant(messageContent, fullResponse);
                                            }
                                        }
                                        
                                        // 更流畅的滚动
                                        this.smoothScrollToBottom();
                                    } catch (error) {
                                        console.error('流式更新错误:', error);
                                    } finally {
                                        pendingUpdate = false;
                                    }
                                });
                            }
                        } catch (e) {
                            // 忽略JSON解析错误
                        }
                    }
                }
            }
            
            // 确保移除思考指示器
            this.hideThinkingIndicator(messageContent);
            
            // 最终更新：确保所有内容都被渲染
            if (isDeepSeekR1 && reasoningContent) {
                console.log('完整思考过程:', reasoningContent);
                this.updateThinkingProcess(messageDiv, reasoningContent);
                // 思考过程完成，标记为已完成并自动折叠
                this.completeThinkingProcess(messageDiv);
            }
            
            if (fullResponse) {
                console.log('完整回答内容:', fullResponse);
                if (isDeepSeekR1) {
                    this.updateFinalAnswer(messageDiv, fullResponse);
                } else {
                    this.messageRenderer.renderInstant(messageContent, fullResponse);
                }
            }

            // 计算回复时长
            const responseTime = Math.round((Date.now() - startTime) / 1000);
            
            // 更新回复时长显示
            const timeInfo = messageDiv.querySelector('.response-time');
            if (timeInfo) {
                timeInfo.textContent = `${responseTime}秒`;
            }

            // 保存完整的AI回复（包含思考过程）
            const completeContent = isDeepSeekR1 && reasoningContent ? 
                `<thinking>\n${reasoningContent}\n</thinking>\n\n${fullResponse}` : 
                fullResponse;
            
            console.log('保存的完整内容:', completeContent);
                
            this.messages.push({ 
                type: 'assistant', 
                content: completeContent, 
                responseTime: responseTime,
                timestamp: new Date(),
                hasThinking: isDeepSeekR1 && reasoningContent.length > 0
            });

            // 自动保存到聊天历史
            this.chatHistoryManager.saveMessages(this.messages);

            // 最终滚动到底部
            this.smoothScrollToBottom();

        } catch (error) {
            // 确保移除思考指示器
            this.hideThinkingIndicator(messageContent);
            
            // 区分不同类型的错误
            if (error.name === 'AbortError') {
                console.log('请求被用户中止');
                // 对于用户主动中止的请求，stopGeneration方法已经处理了消息显示
                // 这里只需要清理状态即可
            } else {
                console.error('流式响应处理错误:', error);
                
                // 根据错误类型确定回复消息
                let errorMessage = '接口调用失败，请换个模型试试吧';
                if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
                    errorMessage = '认证失败，请在设置中检查并重新配置API密钥';
                }
                
                // 显示错误回复消息
                this.messageRenderer.renderInstant(messageContent, errorMessage);
                
                // 保存到消息历史
                this.messages.push({ 
                    type: 'assistant', 
                    content: errorMessage,
                    responseTime: 0,
                    timestamp: new Date(),
                    hasThinking: false
                });
                
                // 自动保存到聊天历史
                this.chatHistoryManager.saveMessages(this.messages);
            }
        } finally {
            // 清理AI消息容器引用
            this.currentAiMessageDiv = null;
        }
    }

    // 更新思考过程显示（简洁版）- 优化版本
    updateThinkingProcess(messageDiv, reasoningContent) {
        // 防抖：避免频繁更新相同内容
        const thinkingKey = `thinking_${messageDiv.dataset.timestamp}`;
        if (this.lastThinkingContent && this.lastThinkingContent[thinkingKey] === reasoningContent) {
            return;
        }
        
        // 记录最后更新的内容
        if (!this.lastThinkingContent) {
            this.lastThinkingContent = {};
        }
        this.lastThinkingContent[thinkingKey] = reasoningContent;
        
        let thinkingSection = messageDiv.querySelector('.thinking-process');
        
        if (!thinkingSection) {
            // 创建新的思考过程区域
            thinkingSection = document.createElement('div');
            thinkingSection.className = 'thinking-process'; // 初始状态为展开，不添加collapsed类
            
            // 创建思考过程头部
            const thinkingHeader = document.createElement('div');
            thinkingHeader.className = 'thinking-header';
            
            const thinkingTitle = document.createElement('div');
            thinkingTitle.className = 'thinking-title';
            thinkingTitle.textContent = '思考过程';
            
            const thinkingStatus = document.createElement('div');
            thinkingStatus.className = 'thinking-status thinking';
            thinkingStatus.textContent = '思考中...';
            
            const thinkingToggle = document.createElement('button');
            thinkingToggle.className = 'thinking-toggle';
            thinkingToggle.setAttribute('aria-label', '展开/折叠思考过程');
            
            thinkingHeader.appendChild(thinkingTitle);
            thinkingHeader.appendChild(thinkingStatus);
            thinkingHeader.appendChild(thinkingToggle);
            
            // 创建思考过程内容
            const thinkingContent = document.createElement('div');
            thinkingContent.className = 'thinking-content';
            
            thinkingSection.appendChild(thinkingHeader);
            thinkingSection.appendChild(thinkingContent);
            
            // 添加点击事件
            thinkingHeader.addEventListener('click', () => {
                thinkingSection.classList.toggle('collapsed');
            });
            
            // 获取消息内容容器
            const messageContent = messageDiv.querySelector('.message-content');
            
            // 创建一个内容包装器，如果还没有的话
            let contentWrapper = messageContent.querySelector('.content-wrapper');
            if (!contentWrapper) {
                contentWrapper = document.createElement('div');
                contentWrapper.className = 'content-wrapper';
                
                // 将现有内容移动到包装器中
                const existingContent = messageContent.innerHTML;
                messageContent.innerHTML = '';
                contentWrapper.innerHTML = existingContent;
                
                // 将思考过程和包装器添加到消息内容中
                messageContent.appendChild(thinkingSection);
                messageContent.appendChild(contentWrapper);
            } else {
                // 如果包装器已存在，只需在其前面插入思考过程
                messageContent.insertBefore(thinkingSection, contentWrapper);
            }
        }
        
        // 更新思考内容
        const thinkingContent = thinkingSection.querySelector('.thinking-content');
        if (thinkingContent) {
            this.messageRenderer.renderInstant(thinkingContent, reasoningContent);
        }
        
        // 更新状态指示器 - 确保在思考期间保持展开状态
        const thinkingStatus = thinkingSection.querySelector('.thinking-status');
        if (thinkingStatus) {
            thinkingStatus.textContent = '思考中...';
            thinkingStatus.className = 'thinking-status thinking';
        }
        
        // 确保在思考期间保持展开状态
        thinkingSection.classList.remove('collapsed');
    }
    
    // 完成思考过程
    completeThinkingProcess(messageDiv, immediate = false) {
        const thinkingSection = messageDiv.querySelector('.thinking-process');
        if (thinkingSection) {
            const thinkingStatus = thinkingSection.querySelector('.thinking-status');
            if (thinkingStatus) {
                thinkingStatus.textContent = '已深度思考';
                thinkingStatus.className = 'thinking-status completed';
            }
            
            // 思考完成后立即折叠
            if (immediate) {
                // 立即折叠（用于历史消息）
                thinkingSection.classList.add('collapsed');
            } else {
                // 新消息也立即折叠，不再延迟
                thinkingSection.classList.add('collapsed');
            }
        }
    }

    // 更新最终答案
    updateFinalAnswer(messageDiv, content) {
        const messageContent = messageDiv.querySelector('.message-content');
        if (messageContent) {
            // 查找内容包装器
            let contentWrapper = messageContent.querySelector('.content-wrapper');
            if (contentWrapper) {
                // 如果有包装器，渲染到包装器中
                this.messageRenderer.renderInstant(contentWrapper, content);
            } else {
                // 如果没有包装器，直接渲染到消息内容中
                this.messageRenderer.renderInstant(messageContent, content);
            }
        }
    }

    // 渲染包含思考过程的消息（用于历史消息加载）
    renderMessageWithThinking(messageDiv, content) {
        // 解析思考过程和答案内容 - 支持<thinking>和<think>标签
        const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/) || content.match(/<think>([\s\S]*?)<\/think>/);
        const thinkingContent = thinkingMatch ? thinkingMatch[1].trim() : '';
        const answerContent = content.replace(/<thinking>[\s\S]*?<\/thinking>\s*/, '').replace(/<think>[\s\S]*?<\/think>\s*/, '').trim();

        if (thinkingContent) {
            // 创建思考过程显示
            this.updateThinkingProcess(messageDiv, thinkingContent);
            // 对于历史消息，直接标记为已完成并立即折叠
            this.completeThinkingProcess(messageDiv, true);
        }

        if (answerContent) {
            // 直接显示答案内容
            const messageContent = messageDiv.querySelector('.message-content');
            let contentWrapper = messageContent.querySelector('.content-wrapper');
            if (contentWrapper) {
                this.messageRenderer.renderInstant(contentWrapper, answerContent);
            } else {
                this.messageRenderer.renderInstant(messageContent, answerContent);
            }
        } else if (!thinkingContent) {
            // 如果既没有思考过程也没有答案内容，使用原始渲染
            const messageContent = messageDiv.querySelector('.message-content');
            this.messageRenderer.renderInstant(messageContent, content);
        }
    }

    // 重置发送按钮
    resetSendButton() {
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.classList.remove('stop-mode');
        sendBtn.disabled = false;
    }

    // 显示思考指示器
    showThinkingIndicator(messageContent) {
        console.log('showThinkingIndicator 被调用');
        console.log('messageContent:', messageContent);
        
        // 检查是否已经存在思考指示器
        const existingIndicator = messageContent.querySelector('.thinking-indicator');
        if (existingIndicator) {
            console.log('思考指示器已存在，跳过创建');
            return;
        }
        
        // 确保动画样式存在
        if (!document.getElementById('thinking-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'thinking-animation-styles';
            style.textContent = `
                @keyframes thinkingPulse {
                    0%, 80%, 100% {
                        transform: scale(0.6);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `
            <div class="thinking-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
            <span class="thinking-text">AI正在思考...</span>
        `;
        messageContent.appendChild(thinkingIndicator);
        console.log('思考指示器已添加到DOM');
        console.log('思考指示器元素:', thinkingIndicator);
        
        // 记录思考指示器显示时间
        thinkingIndicator.dataset.showTime = Date.now();
        
        // 滚动到底部以显示思考指示器
        this.optimizedScrollToBottom();
    }

    // 隐藏思考指示器
    hideThinkingIndicator(messageContent) {
        const thinkingIndicator = messageContent.querySelector('.thinking-indicator');
        if (thinkingIndicator) {
            // 立即移除思考指示器，不再延迟
            thinkingIndicator.remove();
        }
    }

    addMessage(type, content, isStreaming = false, saveMessage = true, responseTime = null, showActions = true) {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.dataset.timestamp = Date.now();

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // 添加消息操作按钮
        if (showActions) {
            const actionButtons = document.createElement('div');
            actionButtons.className = 'message-actions';
            
            if (type === 'assistant') {
                // AI消息的操作按钮
                actionButtons.innerHTML = `
                    <button class="action-btn copy-text" title="复制文本">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn regenerate" title="重新生成">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="action-btn delete-message" title="删除消息">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                // 添加回复时长显示
                if (responseTime !== null) {
                    const timeInfo = document.createElement('div');
                    timeInfo.className = 'response-time';
                    timeInfo.textContent = `${responseTime}秒`;
                    messageDiv.appendChild(timeInfo);
                }
            } else if (type === 'user') {
                // 用户消息的操作按钮
                actionButtons.innerHTML = `
                    <button class="action-btn copy-text" title="复制文本">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn delete-message" title="删除消息">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            }
            
            messageDiv.appendChild(actionButtons);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // 隐藏欢迎界面（当有消息时）
        this.hideWelcomeScreen();

        // 根据消息类型选择渲染方式
        if (type === 'user') {
            // 用户消息立即渲染
            this.messageRenderer.renderInstant(messageContent, content);
            if (showActions) {
                this.bindMessageActions(messageDiv);
            }
        } else if (isStreaming) {
            // AI消息流式渲染
            this.currentStreamInterval = this.messageRenderer.streamMessage(
                messageContent, 
                content,
                () => {
                    // 流式传输完成后的回调
                    this.currentStreamInterval = null;
                    if (showActions) {
                        this.bindMessageActions(messageDiv);
                    }
                }
            );
        } else {
            // AI消息立即渲染
            // 检查是否包含思考过程 - 支持<thinking>和<think>标签
            if (type === 'assistant' && (content.includes('<thinking>') || content.includes('<think>'))) {
                this.renderMessageWithThinking(messageDiv, content);
            } else {
                this.messageRenderer.renderInstant(messageContent, content);
            }
            
            if (showActions) {
                this.bindMessageActions(messageDiv);
            }
        }

        // 滚动到底部
        if (type === 'user') {
            // 用户发送消息时使用平滑滚动
            setTimeout(() => {
                this.forceScrollToBottom();
            }, 50); // 稍微延迟以确保DOM更新完成
        } else {
            // AI消息使用普通滚动
            this.optimizedScrollToBottom();
        }

        // 保存消息（可选）
        if (saveMessage) {
            this.messages.push({ 
                type, 
                content, 
                responseTime: responseTime,
                timestamp: new Date() 
            });
            
            // 自动保存到聊天历史
            this.chatHistoryManager.saveMessages(this.messages);
            
            // 更新聊天标题（如果是新建聊天且这是第一条用户消息）
            const currentChat = this.chatHistoryManager.getCurrentChat();
            if (currentChat && currentChat.title === '新建聊天' && type === 'user') {
                // 只有当这是第一条用户消息时才生成标题
                const userMessages = this.messages.filter(m => m.type === 'user');
                if (userMessages.length === 1) {
                    const newTitle = this.chatHistoryManager.generateTitle(this.messages);
                    this.chatHistoryManager.renameChat(currentChat.id, newTitle);
                    this.renderChatList();
                }
            }
        }
        
        return messageDiv;
    }

    // 绑定消息操作事件
    bindMessageActions(messageDiv) {
        const copyBtn = messageDiv.querySelector('.copy-text');
        const regenerateBtn = messageDiv.querySelector('.regenerate');
        const deleteBtn = messageDiv.querySelector('.delete-message');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const messageContent = messageDiv.querySelector('.message-content');
                const text = messageContent.textContent || messageContent.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                });
            });
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.regenerateMessage(messageDiv);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteMessage(messageDiv);
            });
        }
    }

    // 重新生成消息
    async regenerateMessage(messageDiv) {
        // 找到用户消息
        const userMessageDiv = messageDiv.previousElementSibling;
        if (!userMessageDiv || !userMessageDiv.classList.contains('user')) {
            this.addSystemMessage('无法重新生成：找不到对应的用户消息');
            return;
        }

        const userMessage = userMessageDiv.querySelector('.message-content').textContent;
        
        // 找到要删除的AI消息在messages数组中的索引
        // 需要排除系统通知消息，只计算实际的用户和AI消息
        const allMessageDivs = Array.from(messageDiv.parentNode.children);
        const actualMessages = allMessageDivs.filter(div => 
            div.classList.contains('user') || 
            (div.classList.contains('assistant') && !div.classList.contains('system-notification'))
        );
        const messageIndex = actualMessages.indexOf(messageDiv);
        
        if (messageIndex >= 0 && messageIndex < this.messages.length) {
            // 删除messages数组中对应的AI消息
            this.messages.splice(messageIndex, 1);
        }

        // 删除AI消息的DOM元素
        messageDiv.remove();

        // 创建新的AI消息容器并显示思考指示器
        const aiMessageDiv = this.addMessage('assistant', '__THINKING__', false, false);
        const messageContent = aiMessageDiv.querySelector('.message-content');
        this.showThinkingIndicator(messageContent);
        
        // 保存AI消息容器的引用
        this.currentAiMessageDiv = aiMessageDiv;

        // 更新发送按钮状态
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.innerHTML = '<i class="fas fa-stop"></i>';
        sendBtn.classList.add('stop-mode');
        sendBtn.disabled = false;

        // 重新调用AI
        this.callAI(userMessage);
    }

    // 删除消息
    deleteMessage(messageDiv) {
        // 找到要删除的消息在messages数组中的索引
        // 需要排除系统通知消息，只计算实际的用户和AI消息
        const allMessageDivs = Array.from(messageDiv.parentNode.children);
        const actualMessages = allMessageDivs.filter(div => 
            div.classList.contains('user') || 
            (div.classList.contains('assistant') && !div.classList.contains('system-notification'))
        );
        const messageIndex = actualMessages.indexOf(messageDiv);
        
        if (messageIndex >= 0 && messageIndex < this.messages.length) {
            // 删除messages数组中对应的消息
            this.messages.splice(messageIndex, 1);
            
            // 保存更新后的消息历史
            this.chatHistoryManager.saveMessages(this.messages);
        }

        // 删除DOM元素
        messageDiv.remove();
        
        // 检查是否需要显示欢迎界面（当没有其他消息时）
        if (this.messages.length === 0) {
            this.showWelcomeScreen();
        }
    }



    addSystemMessage(content) {
        // 防重复显示机制 - 检查是否在短时间内显示了相同的消息
        const now = Date.now();
        const duplicateThreshold = 2000; // 2秒内不显示重复消息
        
        if (!this.lastNotifications) {
            this.lastNotifications = new Map();
        }
        
        // 清理过期的通知记录
        for (const [msg, timestamp] of this.lastNotifications.entries()) {
            if (now - timestamp > duplicateThreshold) {
                this.lastNotifications.delete(msg);
            }
        }
        
        // 检查是否为重复消息
        if (this.lastNotifications.has(content)) {
            return; // 跳过重复消息
        }
        
        // 记录当前消息
        this.lastNotifications.set(content, now);
        
        // 创建通知容器（如果不存在）
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'toast-notification';
        
        // 根据消息内容确定类型和图标
        let notificationType = 'info';
        let icon = 'ℹ️';
        
        if (content.includes('✅') || content.includes('成功') || content.includes('已保存') || content.includes('已切换') || content.includes('切换到')) {
            notificationType = 'success';
            icon = '✅';
        } else if (content.includes('❌') || content.includes('失败') || content.includes('错误') || content.includes('无效')) {
            notificationType = 'error';
            icon = '❌';
        } else if (content.includes('⚠️') || content.includes('警告') || content.includes('注意')) {
            notificationType = 'warning';
            icon = '⚠️';
        }
        
        // 移除内容开头的emoji，因为我们会在通知中显示
        const cleanContent = content.replace(/^[🎨🎭🗑️⏹️✅❌⚠️]\s*/, '');
        
        notification.innerHTML = `
            <div class="toast-content ${notificationType}">
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${cleanContent}</div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // 添加到容器
        notificationContainer.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动消失（错误消息显示更长时间）
        const autoHideDelay = notificationType === 'error' ? 5000 : 3000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, autoHideDelay);
    }

    // 自定义确认对话框
    showConfirmDialog(message, onConfirm, onCancel = null) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <div class="modal-content confirm-dialog">
                    <div class="modal-header">
                        <div class="notification-icon">⚠️</div>
                        <h3>确认操作</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary confirm-btn">确认</button>
                        <button class="btn-secondary cancel-btn">取消</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            const cleanup = () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.remove();
                    }
                }, 300);
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                if (onConfirm) onConfirm();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                if (onCancel) onCancel();
                resolve(false);
            });

            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    if (onCancel) onCancel();
                    resolve(false);
                }
            });

            // ESC键关闭
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    if (onCancel) onCancel();
                    resolve(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // 显示动画
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
        });
    }

    // 自定义输入对话框
    showInputDialog(message, defaultValue = '', placeholder = '') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <div class="modal-content input-dialog">
                    <div class="modal-header">
                        <div class="notification-icon">✏️</div>
                        <h3>输入信息</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <input type="text" class="input-field" value="${defaultValue}" placeholder="${placeholder}" />
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary confirm-btn">确认</button>
                        <button class="btn-secondary cancel-btn">取消</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const inputField = modal.querySelector('.input-field');

            const cleanup = () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.remove();
                    }
                }, 300);
            };

            const handleConfirm = () => {
                const value = inputField.value.trim();
                cleanup();
                resolve(value || null);
            };

            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            // 回车确认
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                }
            });

            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            });

            // ESC键关闭
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // 显示动画并聚焦输入框
            setTimeout(() => {
                modal.style.opacity = '1';
                inputField.focus();
                inputField.select();
            }, 10);
        });
    }

    // 自定义警告对话框
    showAlertDialog(message, type = 'error') {
        return new Promise((resolve) => {
            const icons = {
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️',
                success: '✅'
            };

            const titles = {
                error: '错误',
                warning: '警告',
                info: '提示',
                success: '成功'
            };

            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.innerHTML = `
                <div class="modal-content alert-dialog">
                    <div class="modal-header">
                        <div class="notification-icon">${icons[type]}</div>
                        <h3>${titles[type]}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary confirm-btn">确定</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('.confirm-btn');

            const cleanup = () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.remove();
                    }
                }, 300);
            };

            const handleConfirm = () => {
                cleanup();
                resolve();
            };

            confirmBtn.addEventListener('click', handleConfirm);

            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleConfirm();
                }
            });

            // ESC键关闭
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    handleConfirm();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // 显示动画
            setTimeout(() => {
                modal.style.opacity = '1';
                confirmBtn.focus();
            }, 10);
        });
    }



    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    loadChatHistory() {
        const chatHistory = document.querySelector('.chat-history');
        chatHistory.innerHTML = '';

        const chats = this.chatHistoryManager.getChatList();
        // 不再自动创建新聊天，让用户手动创建

        this.renderChatList();
    }

    renderChatList() {
        const chatHistory = document.querySelector('.chat-history');
        const chats = this.chatHistoryManager.getChatList();
        
        chatHistory.innerHTML = '';
        
        // 如果没有聊天历史，显示提示信息
        if (chats.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-chat-history';
            emptyState.innerHTML = `
                <i class="fas fa-comments"></i>
                <span>暂无历史对话</span>
            `;
            chatHistory.appendChild(emptyState);
            return;
        }
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.chatId = chat.id;
            if (chat.id === this.chatHistoryManager.currentChatId) {
                chatItem.classList.add('active');
            }
            
            chatItem.innerHTML = `
                <i class="fas fa-comment"></i>
                <span>${chat.title}</span>
                <div class="chat-actions">
                    <button class="chat-rename" title="重命名">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="chat-delete" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // 点击聊天项切换
            chatItem.addEventListener('click', (e) => {
                if (!e.target.closest('.chat-actions')) {
                    this.selectChat(chat.id);
                }
            });
            
            // 重命名按钮
            chatItem.querySelector('.chat-rename').addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameChat(chat.id);
            });
            
            // 删除按钮
            chatItem.querySelector('.chat-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChat(chat.id);
            });
            
            chatHistory.appendChild(chatItem);
        });
    }

    newChat() {
        // 停止当前的流式传输
        if (this.currentStreamInterval) {
            clearInterval(this.currentStreamInterval);
            this.currentStreamInterval = null;
        }
        
        // 保存当前聊天
        this.saveCurrentChat();
        
        // 创建新聊天（手动创建）
        const newChat = this.chatHistoryManager.createNewChat('新建聊天', true);
        this.chatHistoryManager.currentChatId = newChat.id;
        
        this.messages = [];
        document.getElementById('messages').innerHTML = '';
        
        // 显示欢迎界面
        this.showWelcomeScreen();
        
        // 新建聊天后滚动到底部（使用智能滚动）
        setTimeout(() => {
            this.smartScrollToBottom();
        }, 100);
        
        this.renderChatList();
    }

    selectChat(chatId) {
        // 停止当前的流式传输
        if (this.currentStreamInterval) {
            clearInterval(this.currentStreamInterval);
            this.currentStreamInterval = null;
        }
        
        // 保存当前聊天
        this.saveCurrentChat();
        
        // 切换到指定聊天
        this.messages = this.chatHistoryManager.switchChat(chatId);
        
        // 清空并重新渲染消息
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        // 如果有消息，隐藏欢迎界面；如果没有消息，显示欢迎界面
        if (this.messages.length > 0) {
            this.hideWelcomeScreen();
        } else {
            this.showWelcomeScreen();
        }
        
        // 渲染所有消息
        this.messages.forEach(msg => {
            // 对于AI消息，显示操作按钮；对于用户消息，不显示
            const showActions = msg.type === 'assistant';
            this.addMessage(msg.type, msg.content, false, false, msg.responseTime, showActions);
        });
        
        // 切换聊天后滚动到底部（使用智能滚动）
        setTimeout(() => {
            this.smartScrollToBottom();
        }, 200);
        
        // 移动端自动收起侧边栏
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
        
        this.renderChatList();
    }

    saveCurrentChat() {
        if (this.chatHistoryManager.currentChatId) {
            this.chatHistoryManager.saveMessages(this.messages);
            
            // 更新聊天标题（如果是新建聊天且有用户消息）
            const currentChat = this.chatHistoryManager.getCurrentChat();
            if (currentChat && currentChat.title === '新建聊天') {
                const userMessages = this.messages.filter(m => m.type === 'user');
                if (userMessages.length > 0) {
                    const newTitle = this.chatHistoryManager.generateTitle(this.messages);
                    this.chatHistoryManager.renameChat(currentChat.id, newTitle);
                }
            }
        }
    }



    async renameChat(chatId) {
        const chat = this.chatHistoryManager.getChatList().find(c => c.id === chatId);
        if (chat) {
            const newTitle = await this.showInputDialog(
                '请输入新的聊天名称：',
                chat.title,
                '聊天名称'
            );
            if (newTitle && newTitle.trim()) {
                this.chatHistoryManager.renameChat(chatId, newTitle.trim());
                this.renderChatList();
                this.addSystemMessage(`✅ 聊天已重命名为 "${newTitle.trim()}"`);
            }
        }
    }

    async deleteChat(chatId) {
        const chat = this.chatHistoryManager.getChatList().find(c => c.id === chatId);
        if (chat) {
            const confirmed = await this.showConfirmDialog(
                `确定要删除聊天 "${chat.title}" 吗？此操作不可撤销。`
            );
            
            if (confirmed) {
                this.chatHistoryManager.deleteChat(chatId);
                
                // 获取删除后的聊天列表
                const chats = this.chatHistoryManager.getChatList();
                
                // 如果删除的是当前聊天
                if (this.chatHistoryManager.currentChatId === chatId) {
                    if (chats.length > 0) {
                        this.selectChat(chats[0].id);
                    } else {
                        // 删除最后一个聊天后，清空当前状态并显示欢迎界面
                        this.chatHistoryManager.currentChatId = null;
                        this.messages = [];
                        const messagesContainer = document.getElementById('messages');
                        if (messagesContainer) {
                            messagesContainer.innerHTML = '';
                        }
                        this.renderChatList();
                        this.showWelcomeScreen();
                    }
                } else {
                    // 如果删除的不是当前聊天，只需要重新渲染列表
                    this.renderChatList();
                    // 如果删除后当前聊天没有消息，显示欢迎界面
                    if (this.messages.length === 0) {
                        this.showWelcomeScreen();
                    }
                }
            }
        }
    }

    async clearChatHistory() {
        const confirmed = await this.showConfirmDialog(
            '确定要清空所有聊天记录吗？此操作不可撤销。'
        );
        
        if (confirmed) {
            this.chatHistoryManager.clearAllChats();
            this.chatHistoryManager.currentChatId = null;
            this.messages = [];
            
            // 清空消息容器
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            // 重新渲染聊天列表（现在应该是空的）
            this.renderChatList();
            
            // 显示欢迎界面（当没有其他消息时）
            this.showWelcomeScreen();
        }
    }

    // loadWelcomeMessage() 方法已删除

    // 显示设置模态框
    showSettingsModal() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>设置</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <div class="setting-item" id="apiSettingsItem">
                            <div class="setting-label">
                                <span>API设置</span>
                                <span class="setting-arrow">›</span>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">上下文长度</div>
                            <div class="setting-control">
                                <input type="range" id="contextLengthSlider" min="0" max="25" value="${this.configManager.getContextLength()}" class="slider">
                                <span class="setting-value" id="contextLengthValue">${this.configManager.getContextLength()}</span>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">模型温度</div>
                            <div class="setting-control">
                                <input type="range" id="temperatureSlider" min="0" max="2" step="0.1" value="${this.configManager.getTemperature()}" class="slider">
                                <span class="setting-value" id="temperatureValue">${this.configManager.getTemperature()}</span>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">Top_P</div>
                            <div class="setting-control">
                                <input type="range" id="topPSlider" min="0" max="1" step="0.1" value="${this.configManager.getTopP()}" class="slider">
                                <span class="setting-value" id="topPValue">${this.configManager.getTopP()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" id="saveBtn">保存</button>
                    <button class="btn-secondary" id="cancelBtn">取消</button>
                </div>
            </div>
        `;

        // 添加模态框样式
        const style = document.createElement('style');
        style.textContent = `
            .settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: var(--bg-primary);
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
            }
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
                color: var(--text-primary);
                flex: 1;
                text-align: center;
            }
            .back-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 8px;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                position: absolute;
                left: 20px;
            }
            .back-btn:hover {
                background-color: var(--hover-color);
                color: var(--text-primary);
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
                position: absolute;
                right: 20px;
            }
            .close-btn:hover {
                background-color: var(--hover-color);
            }
            .modal-body {
                padding: 20px;
            }
            .settings-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .setting-item {
                padding: 16px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                transition: all 0.2s;
            }
            .setting-item:hover {
                border-color: var(--accent-color);
            }
            .setting-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 500;
                color: var(--text-primary);
                margin-bottom: 8px;
            }
            .setting-arrow {
                color: var(--text-secondary);
                font-size: 18px;
            }
            .setting-control {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .slider {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: var(--bg-tertiary);
                outline: none;
                -webkit-appearance: none;
            }
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent-color);
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent-color);
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .setting-value {
                min-width: 40px;
                text-align: center;
                font-weight: 500;
                color: var(--accent-color);
                background: var(--bg-tertiary);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 14px;
            }
            .modal-footer {
                padding: 20px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .btn-secondary, .btn-primary {
                padding: 10px 20px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            .btn-secondary {
                background-color: var(--bg-tertiary);
                color: var(--text-primary);
            }
            .btn-secondary:hover {
                background-color: var(--hover-color);
            }
            .btn-primary {
                background-color: var(--accent-color);
                color: white;
            }
            .btn-primary:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            #apiSettingsItem {
                cursor: pointer;
            }
            #apiSettingsItem:hover {
                background-color: var(--hover-color);
            }
        `;
        document.head.appendChild(style);

        // 绑定滑块事件
        const contextSlider = modal.querySelector('#contextLengthSlider');
        const contextValue = modal.querySelector('#contextLengthValue');
        const tempSlider = modal.querySelector('#temperatureSlider');
        const tempValue = modal.querySelector('#temperatureValue');
        const topPSlider = modal.querySelector('#topPSlider');
        const topPValue = modal.querySelector('#topPValue');

        contextSlider.addEventListener('input', (e) => {
            contextValue.textContent = e.target.value;
        });

        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = parseFloat(e.target.value).toFixed(1);
        });

        topPSlider.addEventListener('input', (e) => {
            topPValue.textContent = parseFloat(e.target.value).toFixed(1);
        });

        // API设置点击事件
        modal.querySelector('#apiSettingsItem').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            this.showApiSettingsModal();
        });

        // 绑定关闭事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            }
        });

        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });

        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });

        modal.querySelector('#saveBtn').addEventListener('click', () => {
            // 保存设置
            const contextLength = parseInt(contextSlider.value);
            const temperature = parseFloat(tempSlider.value);
            const topP = parseFloat(topPSlider.value);

            this.configManager.setContextLength(contextLength);
            this.configManager.setTemperature(temperature);
            this.configManager.setTopP(topP);

            document.body.removeChild(modal);
            document.head.removeChild(style);

            this.addSystemMessage('设置已保存');
        });

        document.body.appendChild(modal);
    }

    // 显示API设置模态框
    showApiSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="back-btn" title="返回设置">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h3>API设置</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>选择要启用的API提供商：</p>
                    <div class="provider-list" id="providerList">
                        <!-- 提供商列表将在这里动态生成 -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" id="saveBtn">保存</button>
                    <button class="btn-secondary" id="cancelBtn">取消</button>
                </div>
            </div>
        `;

        // 添加模态框样式
        const style = document.createElement('style');
        style.textContent = `
            .settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: var(--bg-primary);
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
            }
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
                color: var(--text-primary);
                flex: 1;
                text-align: center;
            }
            .back-btn {
                position: absolute;
                left: 20px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 8px;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }
            .back-btn:hover {
                background-color: var(--hover-color);
                color: var(--text-primary);
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .close-btn:hover {
                background-color: var(--hover-color);
            }
            .modal-body {
                padding: 20px;
            }
            .modal-body p {
                margin: 0 0 16px 0;
                color: var(--text-primary);
            }
            .provider-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid var(--border-color);
            }
            .provider-item:last-child {
                border-bottom: none;
            }
            .provider-info {
                flex: 1;
            }
            .provider-name {
                font-weight: 500;
                margin-bottom: 4px;
                color: var(--text-primary);
            }
            .provider-models {
                font-size: 12px;
                color: var(--text-secondary);
            }
            .toggle-switch {
                position: relative;
                width: 50px;
                height: 24px;
                background-color: var(--bg-tertiary);
                border-radius: 12px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            .toggle-switch.active {
                background-color: var(--accent-color);
            }
            .toggle-slider {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background-color: white;
                border-radius: 50%;
                transition: transform 0.3s;
            }
            .toggle-switch.active .toggle-slider {
                transform: translateX(26px);
            }
            .modal-footer {
                padding: 20px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            .btn-secondary, .btn-primary {
                padding: 10px 20px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            .btn-secondary {
                background-color: var(--bg-tertiary);
                color: var(--text-primary);
            }
            .btn-secondary:hover {
                background-color: var(--hover-color);
            }
            .btn-primary {
                background-color: var(--accent-color);
                color: white;
            }
            .btn-primary:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);

        // 生成提供商列表
        const providerList = modal.querySelector('#providerList');
        const allProviders = this.configManager.getAllProviders();
        
        allProviders.forEach(provider => {
            const item = document.createElement('div');
            item.className = 'provider-item';
            item.innerHTML = `
                <div class="provider-info">
                    <div class="provider-name">${provider.name}</div>
                    <div class="provider-models">${(provider.models || []).join(', ')}</div>
                </div>
                <div class="toggle-switch ${provider.enabled ? 'active' : ''}" data-provider="${provider.key}">
                    <div class="toggle-slider"></div>
                </div>
            `;
            providerList.appendChild(item);
        });

        // 绑定事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            }
        });

        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });

        // 返回按钮事件 - 返回设置主菜单
        modal.querySelector('.back-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            this.showSettingsModal(); // 返回设置主菜单
        });

        // 取消按钮事件 - 返回设置主菜单
        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            this.showSettingsModal(); // 返回设置主菜单
        });

        modal.querySelector('#saveBtn').addEventListener('click', () => {
            // 保存设置
            const toggles = modal.querySelectorAll('.toggle-switch');
            toggles.forEach(toggle => {
                const provider = toggle.dataset.provider;
                const enabled = toggle.classList.contains('active');
                this.configManager.setProviderEnabled(provider, enabled);
            });

            // 重新初始化配置，确保当前选择的提供商和模型有效
            this.configManager.initializeConfig();
            
            // 更新当前模型
            this.currentModel = this.configManager.config.currentModel;
            this.currentModelAlias = this.configManager.getCurrentModelAlias() || this.currentModel;
            
            // 重新初始化模型选项
            this.initializeModelOptions();
            
            // 重新绑定事件（因为DOM元素已更新）
            this.rebindModelEvents();
            
            // 更新模型按钮显示
            const currentProvider = this.configManager.getCurrentProvider();
            const modelBtnSpan = document.querySelector('#modelBtn span');
            if (currentProvider && modelBtnSpan) {
                const currentModelAlias = this.configManager.getCurrentModelAlias() || this.currentModel;
                modelBtnSpan.textContent = currentModelAlias;
            }

            document.body.removeChild(modal);
            document.head.removeChild(style);

            this.addSystemMessage('API设置已保存，当前模型已自动调整');
            
            // 返回设置主菜单
            this.showSettingsModal();
        });

        // 切换开关事件
        modal.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
            });
        });

        document.body.appendChild(modal);
    }

    // 重新绑定模型选择事件
    rebindModelEvents() {
        const modelOptions = document.getElementById('modelOptions');
        
        // 移除旧的事件监听器，重新添加
        document.querySelectorAll('.model-option').forEach(option => {
            // 移除旧的事件监听器
            option.replaceWith(option.cloneNode(true));
        });
        
        // 重新绑定事件监听器
        document.querySelectorAll('.model-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const model = e.target.dataset.model;
                const provider = e.target.dataset.provider;
                this.selectModel(model, provider);
                if (modelOptions) {
                    modelOptions.classList.remove('show');
                }
            });
        });
    }

    // 主题切换
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const theme = this.isDarkMode ? 'dark' : 'light';
        
        // 手动切换主题时，保存具体的主题设置，这样就不会再自动跟随系统主题
        this.saveTheme(theme);
        this.updateThemeDisplay();
        
        this.addSystemMessage(`已手动切换到${this.isDarkMode ? '夜间' : '白昼'}模式`);
    }

    // 初始化使用场景
    initializeScenario() {
        this.updateScenarioDisplay();
        
        // 根据当前场景设置模式
        if (this.currentScenario === 'image') {
            this.loadImageModels();
        } else {
            this.isImageMode = false;
        }
    }

    // 切换使用场景
    toggleScenario() {
        this.currentScenario = this.currentScenario === 'chat' ? 'image' : 'chat';
        this.saveScenario(this.currentScenario);
        this.updateScenarioDisplay();
        
        // 根据场景切换模型配置
        if (this.currentScenario === 'image') {
            this.loadImageModels();
        } else {
            this.loadTextModels();
        }
        
        const scenarioName = this.currentScenario === 'chat' ? '日常对话' : '图像生成';
        this.addSystemMessage(`已切换到${scenarioName}模式`);
    }

    // 更新使用场景显示
    updateScenarioDisplay() {
        const scenarioToggle = document.getElementById('scenarioToggle');
        const scenarioText = document.getElementById('scenarioText');
        const scenarioIcon = scenarioToggle?.querySelector('i');
        
        if (scenarioToggle && scenarioText && scenarioIcon) {
            if (this.currentScenario === 'image') {
                scenarioToggle.classList.add('image-mode');
                scenarioIcon.className = 'fas fa-image';
                scenarioText.textContent = '图像生成';
            } else {
                scenarioToggle.classList.remove('image-mode');
                scenarioIcon.className = 'fas fa-comments';
                scenarioText.textContent = '日常对话';
            }
        }
    }

    // 保存使用场景设置
    saveScenario(scenario) {
        localStorage.setItem('scenario', scenario);
    }

    // 获取存储的使用场景设置
    getStoredScenario() {
        return localStorage.getItem('scenario');
    }

    // 加载图像生成模型
    loadImageModels() {
        // 临时保存当前文本模型配置
        this.savedTextModel = this.currentModel;
        this.savedTextProvider = this.currentProvider;
        
        // 优先使用用户已保存的图像模型配置
        const savedImageProvider = this.configManager.getImageProvider();
        const savedImageModel = this.configManager.getImageModel();
        
        // 检查保存的配置是否有效
        if (savedImageProvider && savedImageModel && 
            this.configManager.isImageProviderEnabled(savedImageProvider) &&
            this.configManager.isImageModelAvailable(savedImageProvider, savedImageModel)) {
            // 使用保存的配置
            this.currentModel = savedImageModel;
            this.currentProvider = savedImageProvider;
        } else {
            // 如果保存的配置无效，则获取第一个可用的图像模型
            const result = this.configManager.getFirstEnabledImageProviderAndModel();
            if (result) {
                this.currentModel = result.model;
                this.currentProvider = result.provider;
                
                // 更新ConfigManager中的图像提供商和模型
                this.configManager.setImageProvider(result.provider);
                this.configManager.setImageModel(result.model);
            }
        }
        
        this.isImageMode = true; // 标记为图像模式
        
        // 重新初始化模型选项（显示图像模型）
        this.initializeImageModelOptions();
        this.updateModelDisplay();
    }

    // 加载文本对话模型
    loadTextModels() {
        this.isImageMode = false; // 标记为文本模式
        
        // 优先恢复之前的文本模型
        if (this.savedTextModel && this.savedTextProvider) {
            // 检查保存的文本模型配置是否仍然有效
            if (this.configManager.isProviderEnabled(this.savedTextProvider) &&
                this.configManager.isModelAvailable(this.savedTextProvider, this.savedTextModel)) {
                this.currentModel = this.savedTextModel;
                this.currentProvider = this.savedTextProvider;
            } else {
                // 如果保存的配置无效，使用用户当前配置或默认配置
                const currentProvider = this.configManager.getCurrentProvider();
                const currentModel = this.configManager.getCurrentModel();
                
                if (currentProvider && currentModel &&
                    this.configManager.isProviderEnabled(currentProvider) &&
                    this.configManager.isModelAvailable(currentProvider, currentModel)) {
                    this.currentModel = currentModel;
                    this.currentProvider = currentProvider;
                } else {
                    // 最后才使用第一个可用的文本模型
                    const result = this.configManager.getFirstEnabledProviderAndModel();
                    if (result) {
                        this.currentModel = result.model;
                        this.currentProvider = result.provider;
                    }
                }
            }
        } else {
            // 如果没有保存的文本模型，优先使用用户当前配置
            const currentProvider = this.configManager.getCurrentProvider();
            const currentModel = this.configManager.getCurrentModel();
            
            if (currentProvider && currentModel &&
                this.configManager.isProviderEnabled(currentProvider) &&
                this.configManager.isModelAvailable(currentProvider, currentModel)) {
                this.currentModel = currentModel;
                this.currentProvider = currentProvider;
            } else {
                // 最后才使用第一个可用的文本模型
                const result = this.configManager.getFirstEnabledProviderAndModel();
                if (result) {
                    this.currentModel = result.model;
                    this.currentProvider = result.provider;
                }
            }
        }
        
        // 重新初始化模型选项（显示文本模型）
        this.initializeModelOptions();
        this.updateModelDisplay();
    }

    // 初始化图像模型选项
    initializeImageModelOptions() {
        const modelOptions = document.getElementById('modelOptions');
        if (!modelOptions) return;
        
        const imageProviders = this.configManager.getImageProviders();
        
        // 清空现有选项
        modelOptions.innerHTML = '';
        
        // 按提供商分组显示图像模型
        imageProviders.forEach(provider => {
            if (!provider.models || provider.models.length === 0) return;
            
            // 创建提供商分组标题
            const providerGroup = document.createElement('div');
            providerGroup.className = 'provider-group';
            
            const providerHeader = document.createElement('div');
            providerHeader.className = 'provider-header';
            providerHeader.textContent = provider.name;
            providerGroup.appendChild(providerHeader);
            
            // 添加该提供商的所有模型
            provider.models.forEach(model => {
                const option = document.createElement('div');
                option.className = 'model-option';
                option.dataset.model = model;
                option.dataset.provider = provider.key;
                
                // 获取模型别名
                const modelAlias = this.configManager.getModelAlias(provider.key, model);
                option.textContent = modelAlias;
                
                if (model === this.currentModel) {
                    option.classList.add('active');
                }
                
                providerGroup.appendChild(option);
            });
            
            modelOptions.appendChild(providerGroup);
        });
    }

    // 调用图像生成API
    async callImageAPI(userMessage, startTime) {
        try {
            const imageProviders = this.configManager.getAllImageProviders();
            const currentProvider = imageProviders[this.currentProvider];
            
            if (!currentProvider || !currentProvider.enabled) {
                this.addMessage('assistant', '当前图像生成提供商未启用，请在设置中启用');
                this.resetSendButton();
                return;
            }

            // 构建图像生成请求
            const requestData = {
                prompt: userMessage,
                model: this.currentModel,
                width: this.configManager.getImageWidth(),
                height: this.configManager.getImageHeight(),
                steps: this.configManager.getImageSteps(),
                guidance_scale: this.configManager.getImageGuidanceScale()
            };

            const headers = this.configManager.getImageHeaders(this.currentProvider);
            const method = this.configManager.getImageMethod(this.currentProvider);
            
            let url = currentProvider.baseURL;
            let fetchOptions = {
                method: method,
                headers: headers
            };

            if (method === 'GET') {
                // 对于GET请求（如Pollinations），将参数添加到URL
                const params = new URLSearchParams({
                    prompt: userMessage,
                    model: this.currentModel,
                    width: requestData.width,
                    height: requestData.height
                });
                url += `/${encodeURIComponent(userMessage)}?${params.toString()}`;
            } else {
                // 对于POST请求，将数据放在body中
                fetchOptions.body = JSON.stringify(requestData);
            }

            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let imageUrl;
            if (method === 'GET') {
                // 对于GET请求，响应本身就是图像
                imageUrl = url;
            } else {
                // 对于POST请求，解析JSON响应获取图像URL
                const result = await response.json();
                imageUrl = result.data?.[0]?.url || result.url || result.image_url;
            }

            if (imageUrl) {
                const responseTime = Date.now() - startTime;
                const imageContent = `![生成的图像](${imageUrl})`;
                this.addMessage('assistant', imageContent, false, true, responseTime);
            } else {
                this.addMessage('assistant', '图像生成失败，未能获取到图像URL');
            }

        } catch (error) {
            console.error('图像生成错误:', error);
            this.addMessage('assistant', '图像生成失败，请稍后重试');
        } finally {
            this.resetSendButton();
        }
    }

    // 侧边栏折叠切换
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // 检查是否为移动端
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 移动端逻辑：使用 open 类
            const isOpen = sidebar.classList.contains('open');
            if (isOpen) {
                sidebar.classList.remove('open');
            } else {
                sidebar.classList.add('open');
            }
        } else {
            // 桌面端逻辑：使用 collapsed 类
            const isCollapsed = sidebar.classList.contains('collapsed');
            if (isCollapsed) {
                // 展开侧边栏
                sidebar.classList.remove('collapsed');
                localStorage.setItem('sidebarCollapsed', 'false');
            } else {
                // 折叠侧边栏
                sidebar.classList.add('collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');
            }
        }
    }

    // 初始化侧边栏状态
    initializeSidebarState() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 移动端默认关闭侧边栏
            sidebar.classList.remove('open');
        } else {
            // 桌面端根据本地存储设置
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }
    }



    // 显示角色选择模态框
    showRoleModal() {
        const modal = document.getElementById('roleModal');
        if (modal) {
            this.loadRoleList();
            modal.style.display = 'flex';
        }
    }

    // 加载角色列表
    loadRoleList() {
        const roleList = document.getElementById('roleList');
        if (!roleList) return;
        
        const roles = this.roleManager.getAllRoles();
        const currentRole = this.roleManager.getCurrentRole();
        
        roleList.innerHTML = '';
        
        roles.forEach(role => {
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';
            roleItem.dataset.roleId = role.id;
            
            if (role.id === currentRole.id) {
                roleItem.classList.add('selected');
                this.selectedRoleId = role.id;
            }
            
            roleItem.innerHTML = `
                <div class="role-avatar">${role.avatar}</div>
                <div class="role-info">
                    <div class="role-name">${role.name}</div>
                    <div class="role-description">${role.description}</div>
                </div>
            `;
            
            roleList.appendChild(roleItem);
        });
        
        this.updateRoleConfirmButton();
    }

    // 绑定角色模态框事件
    bindRoleModalEvents() {
        const modal = document.getElementById('roleModal');
        const addRoleModal = document.getElementById('addRoleModal');
        const editRoleModal = document.getElementById('editRoleModal');
        const closeBtn = document.getElementById('roleCloseBtn');
        const cancelBtn = document.getElementById('roleCancelBtn');
        const confirmBtn = document.getElementById('roleConfirmBtn');
        const searchInput = document.getElementById('roleSearch');
        const roleList = document.getElementById('roleList');
        const addRoleBtn = document.getElementById('addRoleBtn');

        // 添加角色模态框相关元素
        const addRoleCloseBtn = document.getElementById('addRoleCloseBtn');
        const addRoleCancelBtn = document.getElementById('addRoleCancelBtn');
        const addRoleSaveBtn = document.getElementById('addRoleSaveBtn');

        // 编辑角色模态框相关元素
        const editRoleCloseBtn = document.getElementById('editRoleCloseBtn');
        const editRoleCancelBtn = document.getElementById('editRoleCancelBtn');
        const editRoleSaveBtn = document.getElementById('editRoleSaveBtn');

        // 关闭模态框
        const closeModal = () => {
            modal.style.display = 'none';
            this.selectedRoleId = null;
            searchInput.value = '';
        };

        const closeAddRoleModal = () => {
            addRoleModal.style.display = 'none';
            this.clearAddRoleForm();
        };

        const closeEditRoleModal = () => {
            editRoleModal.style.display = 'none';
            this.clearEditRoleForm();
        };

        // 从添加角色页面返回到角色选择器
        const backToRoleModalFromAdd = () => {
            addRoleModal.style.display = 'none';
            this.clearAddRoleForm();
            this.showRoleModal();
        };

        // 从编辑角色页面返回到角色选择器
        const backToRoleModalFromEdit = () => {
            editRoleModal.style.display = 'none';
            this.clearEditRoleForm();
            this.showRoleModal();
        };

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        addRoleModal.addEventListener('click', (e) => {
            if (e.target === addRoleModal) {
                closeAddRoleModal();
            }
        });

        editRoleModal.addEventListener('click', (e) => {
            if (e.target === editRoleModal) {
                closeEditRoleModal();
            }
        });

        // 关闭按钮
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        addRoleCloseBtn.addEventListener('click', closeAddRoleModal);
        addRoleCancelBtn.addEventListener('click', backToRoleModalFromAdd);
        editRoleCloseBtn.addEventListener('click', closeEditRoleModal);
        editRoleCancelBtn.addEventListener('click', backToRoleModalFromEdit);

        // 确认按钮
        confirmBtn.addEventListener('click', () => {
            if (this.selectedRoleId) {
                this.selectRole(this.selectedRoleId);
                closeModal();
            }
        });

        // 添加角色按钮
        addRoleBtn.addEventListener('click', () => {
            closeModal();
            this.showAddRoleModal();
        });

        // 保存新角色
        addRoleSaveBtn.addEventListener('click', () => {
            this.saveNewRole();
        });

        // 保存编辑的角色
        editRoleSaveBtn.addEventListener('click', () => {
            this.saveEditedRole();
        });

        // 搜索功能
        searchInput.addEventListener('input', (e) => {
            this.filterRoles(e.target.value);
        });

        // 角色选择
        roleList.addEventListener('click', (e) => {
            const roleItem = e.target.closest('.role-item');
            if (roleItem) {
                // 移除其他选中状态
                roleList.querySelectorAll('.role-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 添加选中状态
                roleItem.classList.add('selected');
                this.selectedRoleId = roleItem.dataset.roleId;
                this.updateRoleConfirmButton();
            }
        });

        // 绑定添加角色表单事件
        this.bindAddRoleFormEvents();
    }

    // 过滤角色
    filterRoles(query) {
        const roles = this.roleManager.searchRoles(query);
        const roleList = document.getElementById('roleList');
        const currentRole = this.roleManager.getCurrentRole();
        
        roleList.innerHTML = '';
        
        roles.forEach(role => {
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';
            if (role.id.startsWith('custom_')) {
                roleItem.classList.add('custom-role');
            }
            roleItem.dataset.roleId = role.id;
            
            if (role.id === currentRole.id) {
                roleItem.classList.add('selected');
                this.selectedRoleId = role.id;
            }
            
            let actionButtons = '';
            if (role.id.startsWith('custom_')) {
                actionButtons = `
                    <div class="action-buttons">
                        <button class="edit-role-btn" title="编辑角色" onclick="event.stopPropagation(); app.showEditRoleModal('${role.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-role-btn" title="删除角色" onclick="event.stopPropagation(); app.deleteCustomRole('${role.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }
            
            roleItem.innerHTML = `
                <div class="role-avatar">${role.avatar}</div>
                <div class="role-info">
                    <div class="role-name">${role.name}</div>
                    <div class="role-description">${role.description}</div>
                </div>
                ${actionButtons}
            `;
            
            roleList.appendChild(roleItem);
        });
        
        this.updateRoleConfirmButton();
    }

    // 更新确认按钮状态
    updateRoleConfirmButton() {
        const confirmBtn = document.getElementById('roleConfirmBtn');
        const currentRole = this.roleManager.getCurrentRole();
        
        if (this.selectedRoleId && this.selectedRoleId !== currentRole.id) {
            confirmBtn.disabled = false;
        } else {
            confirmBtn.disabled = true;
        }
    }

    // 选择角色
    selectRole(roleId) {
        if (this.roleManager.setCurrentRole(roleId)) {
            const role = this.roleManager.getCurrentRole();
            this.addSystemMessage(`已切换到角色：${role.name}`);
            
            // 可以在这里添加角色切换后的其他逻辑
            // 比如更新UI显示当前角色等
        }
    }

    // 显示添加角色模态框
    showAddRoleModal() {
        const modal = document.getElementById('addRoleModal');
        modal.style.display = 'flex';
        document.getElementById('roleName').focus();
    }

    // 绑定添加角色表单事件
    bindAddRoleFormEvents() {
        const nameInput = document.getElementById('roleName');
        const saveBtn = document.getElementById('addRoleSaveBtn');

        // 实时验证添加角色表单
        const validateAddForm = () => {
            const name = document.getElementById('roleName').value.trim();
            const description = document.getElementById('roleDescription').value.trim();
            const prompt = document.getElementById('rolePrompt').value.trim();
            
            saveBtn.disabled = !(name && description && prompt);
        };

        // 监听添加角色表单输入变化
        ['roleName', 'roleDescription', 'rolePrompt'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', validateAddForm);
            }
        });

        // 回车键保存
        document.getElementById('roleName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !saveBtn.disabled) {
                this.saveNewRole();
            }
        });

        // 绑定编辑角色表单事件
        this.bindEditRoleFormEvents();
    }

    // 绑定编辑角色表单事件
    bindEditRoleFormEvents() {
        const editSaveBtn = document.getElementById('editRoleSaveBtn');

        // 实时验证编辑角色表单
        const validateEditForm = () => {
            const name = document.getElementById('editRoleName').value.trim();
            const description = document.getElementById('editRoleDescription').value.trim();
            const prompt = document.getElementById('editRolePrompt').value.trim();
            
            editSaveBtn.disabled = !(name && description && prompt);
        };

        // 监听编辑角色表单输入变化
        ['editRoleName', 'editRoleDescription', 'editRolePrompt'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', validateEditForm);
            }
        });

        // 回车键保存
        document.getElementById('editRoleName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !editSaveBtn.disabled) {
                this.saveEditedRole();
            }
        });
    }

    // 保存新角色
    async saveNewRole() {
        const name = document.getElementById('roleName').value.trim();
        const avatar = document.getElementById('roleAvatar').value.trim() || '🤖';
        const description = document.getElementById('roleDescription').value.trim();
        const prompt = document.getElementById('rolePrompt').value.trim();

        if (!name || !description || !prompt) {
            await this.showAlertDialog('请填写所有必填字段！', 'warning');
            return;
        }

        try {
            const newRole = this.roleManager.addCustomRole({
                name,
                avatar,
                description,
                prompt
            });

            // 关闭添加角色模态框
            document.getElementById('addRoleModal').style.display = 'none';
            this.clearAddRoleForm();

            // 显示成功消息
            this.addSystemMessage(`✅ 新角色 "${newRole.name}" 添加成功！`);

            // 重新加载角色列表
            this.loadRoleList();

            // 返回到角色选择模态框
            document.getElementById('roleModal').style.display = 'flex';

        } catch (error) {
            console.error('添加角色失败:', error);
            await this.showAlertDialog('添加角色失败，请重试！', 'error');
        }
    }

    // 清空添加角色表单
    clearAddRoleForm() {
        document.getElementById('roleName').value = '';
        document.getElementById('roleAvatar').value = '';
        document.getElementById('roleDescription').value = '';
        document.getElementById('rolePrompt').value = '';
        document.getElementById('addRoleSaveBtn').disabled = true;
    }

    // 重写加载角色列表方法，支持自定义角色
    loadRoleList() {
        const roleList = document.getElementById('roleList');
        const roles = this.roleManager.getAllRoles();
        const currentRole = this.roleManager.getCurrentRole();
        
        roleList.innerHTML = '';
        
        roles.forEach(role => {
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';
            if (role.id.startsWith('custom_')) {
                roleItem.classList.add('custom-role');
            }
            roleItem.dataset.roleId = role.id;
            
            if (role.id === currentRole.id) {
                roleItem.classList.add('selected');
                this.selectedRoleId = role.id;
            }
            
            let actionButtons = '';
            if (role.id.startsWith('custom_')) {
                actionButtons = `
                    <div class="action-buttons">
                        <button class="edit-role-btn" title="编辑角色" onclick="event.stopPropagation(); app.showEditRoleModal('${role.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-role-btn" title="删除角色" onclick="event.stopPropagation(); app.deleteCustomRole('${role.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }
            
            roleItem.innerHTML = `
                <div class="role-avatar">${role.avatar}</div>
                <div class="role-info">
                    <div class="role-name">${role.name}</div>
                    <div class="role-description">${role.description}</div>
                </div>
                ${actionButtons}
            `;
            
            roleList.appendChild(roleItem);
        });
        
        this.updateRoleConfirmButton();
    }

    // 删除自定义角色
    async deleteCustomRole(roleId) {
        const role = this.roleManager.getRoleById(roleId);
        if (!role) return;

        const confirmed = await this.showConfirmDialog(
            `确定要删除自定义角色 "${role.name}" 吗？此操作不可撤销。`
        );
        
        if (confirmed) {
            try {
                this.roleManager.removeCustomRole(roleId);
                this.addSystemMessage(`✅ 角色 "${role.name}" 已删除`);
                this.loadRoleList();
            } catch (error) {
                console.error('删除角色失败:', error);
                await this.showAlertDialog('删除角色失败，请重试！', 'error');
            }
        }
    }

    // 显示编辑角色模态框
    showEditRoleModal(roleId) {
        const role = this.roleManager.getRoleById(roleId);
        if (!role || !role.id.startsWith('custom_')) {
            return;
        }

        // 填充表单数据
        document.getElementById('editRoleName').value = role.name;
        document.getElementById('editRoleAvatar').value = role.avatar;
        document.getElementById('editRoleDescription').value = role.description;
        document.getElementById('editRolePrompt').value = role.prompt;

        // 保存当前编辑的角色ID
        this.editingRoleId = roleId;

        // 显示模态框
        const modal = document.getElementById('editRoleModal');
        modal.style.display = 'flex';
        document.getElementById('editRoleName').focus();
    }

    // 保存编辑的角色
    async saveEditedRole() {
        const name = document.getElementById('editRoleName').value.trim();
        const avatar = document.getElementById('editRoleAvatar').value.trim() || '🤖';
        const description = document.getElementById('editRoleDescription').value.trim();
        const prompt = document.getElementById('editRolePrompt').value.trim();

        if (!name || !description || !prompt) {
            await this.showAlertDialog('请填写所有必填字段！', 'warning');
            return;
        }

        try {
            const updatedRole = this.roleManager.editCustomRole(this.editingRoleId, {
                name,
                avatar,
                description,
                prompt
            });

            if (updatedRole) {
                // 关闭编辑角色模态框
                document.getElementById('editRoleModal').style.display = 'none';
                this.clearEditRoleForm();

                // 显示成功消息
                this.addSystemMessage(`✅ 角色 "${updatedRole.name}" 编辑成功！`);

                // 重新加载角色列表
                this.loadRoleList();

                // 返回到角色选择模态框
                document.getElementById('roleModal').style.display = 'flex';
            } else {
                await this.showAlertDialog('编辑角色失败，请重试！', 'error');
            }

        } catch (error) {
            console.error('编辑角色失败:', error);
            await this.showAlertDialog('编辑角色失败，请重试！', 'error');
        }
    }

    // 清空编辑角色表单
    clearEditRoleForm() {
        document.getElementById('editRoleName').value = '';
        document.getElementById('editRoleAvatar').value = '';
        document.getElementById('editRoleDescription').value = '';
        document.getElementById('editRolePrompt').value = '';
        this.editingRoleId = null;
    }

    // 重写过滤角色方法，支持自定义角色
    filterRoles(query) {
        const roles = this.roleManager.searchRoles(query);
        const roleList = document.getElementById('roleList');
        const currentRole = this.roleManager.getCurrentRole();
        
        roleList.innerHTML = '';
        
        roles.forEach(role => {
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';
            if (role.id.startsWith('custom_')) {
                roleItem.classList.add('custom-role');
            }
            roleItem.dataset.roleId = role.id;
            
            if (role.id === currentRole.id) {
                roleItem.classList.add('selected');
                this.selectedRoleId = role.id;
            }
            
            let actionButtons = '';
            if (role.id.startsWith('custom_')) {
                actionButtons = `
                    <div class="action-buttons">
                        <button class="edit-role-btn" title="编辑角色" onclick="event.stopPropagation(); app.showEditRoleModal('${role.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-role-btn" title="删除角色" onclick="event.stopPropagation(); app.deleteCustomRole('${role.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }
            
            roleItem.innerHTML = `
                <div class="role-avatar">${role.avatar}</div>
                <div class="role-info">
                    <div class="role-name">${role.name}</div>
                    <div class="role-description">${role.description}</div>
                </div>
                ${actionButtons}
            `;
            
            roleList.appendChild(roleItem);
        });
        
        this.updateRoleConfirmButton();
    }

    // 处理用户滚动事件
    handleUserScroll() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;

        const currentScrollTop = chatContainer.scrollTop;
        const scrollHeight = chatContainer.scrollHeight;
        const clientHeight = chatContainer.clientHeight;
        
        // 检测用户是否向上滚动（不在底部）
        const isAtBottom = Math.abs(scrollHeight - clientHeight - currentScrollTop) < 10;
        
        // 如果用户不在底部，标记为用户正在滚动
        if (!isAtBottom) {
            this.userScrolling = true;
            
            // 清除之前的超时定时器
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            // 设置超时，如果用户停止滚动一段时间后重新启用自动滚动
            this.scrollTimeout = setTimeout(() => {
                // 再次检查是否在底部，如果在底部则恢复自动滚动
                const newScrollTop = chatContainer.scrollTop;
                const newIsAtBottom = Math.abs(scrollHeight - clientHeight - newScrollTop) < 10;
                if (newIsAtBottom) {
                    this.userScrolling = false;
                }
            }, 2000); // 2秒后检查
        } else {
            // 用户滚动到底部，恢复自动滚动
            this.userScrolling = false;
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = null;
            }
        }
        
        this.lastScrollTop = currentScrollTop;
    }

    // 优化的滚动方法 - 使用节流机制，并检查用户滚动状态
    optimizedScrollToBottom() {
        // 如果用户正在手动滚动，不执行自动滚动
        if (this.userScrolling) {
            return;
        }
        
        if (this.scrollThrottleTimer) {
            return; // 如果已有滚动请求在等待，直接返回
        }
        
        this.scrollThrottleTimer = requestAnimationFrame(() => {
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer && !this.userScrolling) {
                // 检查是否已经接近底部，如果是则使用平滑滚动
                const scrollTop = chatContainer.scrollTop;
                const scrollHeight = chatContainer.scrollHeight;
                const clientHeight = chatContainer.clientHeight;
                const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
                
                if (distanceFromBottom < 100) {
                    // 接近底部时使用平滑滚动
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                } else {
                    // 距离较远时直接跳转
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
            this.scrollThrottleTimer = null;
        });
    }

    // 更流畅的滚动方法 - 专为流式响应优化
    smoothScrollToBottom() {
        // 如果用户正在手动滚动，不执行自动滚动
        if (this.userScrolling) {
            return;
        }
        
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;
        
        // 直接滚动到底部，不使用节流，确保流式响应时的流畅性
        const scrollTop = chatContainer.scrollTop;
        const scrollHeight = chatContainer.scrollHeight;
        const clientHeight = chatContainer.clientHeight;
        const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
        
        // 如果距离底部很近，直接跳转（避免动画延迟）
        if (distanceFromBottom < 50) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else if (distanceFromBottom < 200) {
            // 中等距离使用平滑滚动
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
        // 距离太远时不自动滚动，避免打断用户查看历史消息
    }

    // 智能滚动到底部（根据用户行为决定滚动方式）
    smartScrollToBottom() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;
        
        const scrollTop = chatContainer.scrollTop;
        const scrollHeight = chatContainer.scrollHeight;
        const clientHeight = chatContainer.clientHeight;
        const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
        
        // 如果用户已经在底部附近（50px内），使用平滑滚动
        if (distanceFromBottom <= 50) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        } 
        // 如果用户距离底部较远但不是在手动滚动，使用快速滚动
        else if (!this.userScrolling && distanceFromBottom <= 200) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
        // 如果用户明显在查看历史消息，不自动滚动
        else if (this.userScrolling || distanceFromBottom > 200) {
            return;
        }
        
        // 重置用户滚动状态
        this.userScrolling = false;
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
    }

    // 强制滚动到底部（用于用户发送消息后）
    forceScrollToBottom() {
        // 重置用户滚动状态
        this.userScrolling = false;
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        
        // 使用平滑滚动到底部
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    // 更新回到底部按钮的显示状态
    updateScrollToBottomButton() {
        if (!this.scrollToBottomBtn) return;
        
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;
        
        const scrollTop = chatContainer.scrollTop;
        const scrollHeight = chatContainer.scrollHeight;
        const clientHeight = chatContainer.clientHeight;
        
        // 检查是否在底部（允许10px的误差）
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
        
        // 只要不在底部就显示按钮
        if (!isAtBottom) {
            this.scrollToBottomBtn.classList.add('show');
        } else {
            this.scrollToBottomBtn.classList.remove('show');
        }
    }

    // 通过按钮滚动到底部
    scrollToBottomWithButton() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;
        
        // 平滑滚动到底部
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
        
        // 重置用户滚动状态
        this.userScrolling = false;
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        
        // 隐藏按钮（会在滚动完成后自动隐藏）
        setTimeout(() => {
            this.updateScrollToBottomButton();
        }, 500);
    }

    // 批量DOM更新方法
    batchDOMUpdate(key, updateFunction) {
        // 将更新函数添加到队列
        this.renderQueue.set(key, updateFunction);
        
        // 使用requestAnimationFrame批量执行更新
        if (this.renderQueue.size === 1) {
            requestAnimationFrame(() => {
                // 执行所有排队的更新
                this.renderQueue.forEach((updateFn, updateKey) => {
                    try {
                        updateFn();
                    } catch (error) {
                        console.error(`批量更新失败 (${updateKey}):`, error);
                    }
                });
                
                // 清空队列
                this.renderQueue.clear();
            });
        }
    }

    // ==================== @角色选择功能 ====================

    // 处理输入框内容变化，检测@符号
    handleRoleMentionInput(e) {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value;
        const cursorPos = messageInput.selectionStart;

        console.log('handleRoleMentionInput called:', { text, cursorPos });

        // 查找光标前最近的@符号
        const beforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = beforeCursor.lastIndexOf('@');

        console.log('lastAtIndex:', lastAtIndex);

        if (lastAtIndex === -1) {
            // 没有@符号，隐藏下拉菜单
            this.hideRoleMentionDropdown();
            return;
        }

        // 检查@符号后面的内容
        const afterAt = text.substring(lastAtIndex + 1, cursorPos);
        
        // 如果@符号后面有空格或换行，隐藏下拉菜单
        if (afterAt.includes(' ') || afterAt.includes('\n')) {
            this.hideRoleMentionDropdown();
            return;
        }

        // 检查@符号前面是否是空格、换行或开头
        const beforeAt = lastAtIndex > 0 ? text.charAt(lastAtIndex - 1) : '';
        if (beforeAt !== '' && beforeAt !== ' ' && beforeAt !== '\n') {
            this.hideRoleMentionDropdown();
            return;
        }

        // 更新状态
        this.roleMentionState.mentionStart = lastAtIndex;
        this.roleMentionState.mentionEnd = cursorPos;
        this.roleMentionState.searchQuery = afterAt;

        // 过滤角色并显示下拉菜单
        this.filterAndShowRoles(afterAt);
    }

    // 过滤角色并显示下拉菜单
    filterAndShowRoles(query) {
        const allRoles = this.roleManager.getAllRoles();
        console.log('filterAndShowRoles called with query:', query, 'allRoles:', allRoles);
        
        // 过滤角色
        this.roleMentionState.filteredRoles = allRoles.filter(role => {
            const lowerQuery = query.toLowerCase();
            return role.name.toLowerCase().includes(lowerQuery) ||
                   role.description.toLowerCase().includes(lowerQuery);
        });

        console.log('filtered roles:', this.roleMentionState.filteredRoles);

        // 重置选中索引
        this.roleMentionState.selectedIndex = -1;

        // 渲染下拉菜单
        this.renderRoleMentionDropdown();

        // 显示下拉菜单
        this.showRoleMentionDropdown();
    }

    // 渲染角色选择下拉菜单
    renderRoleMentionDropdown() {
        const dropdown = document.getElementById('roleMentionDropdown');
        const list = document.getElementById('roleMentionList');
        
        if (!dropdown || !list) return;

        list.innerHTML = '';

        if (this.roleMentionState.filteredRoles.length === 0) {
            const noResult = document.createElement('div');
            noResult.className = 'role-mention-item';
            noResult.innerHTML = `
                <div class="role-mention-info">
                    <div class="role-mention-name">未找到匹配的角色</div>
                </div>
            `;
            list.appendChild(noResult);
            return;
        }

        this.roleMentionState.filteredRoles.forEach((role, index) => {
            const item = document.createElement('button');
            item.className = 'role-mention-item';
            item.dataset.roleId = role.id;
            item.dataset.index = index;

            if (index === this.roleMentionState.selectedIndex) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <div class="role-mention-avatar">${role.avatar}</div>
                <div class="role-mention-info">
                    <div class="role-mention-name">${role.name}</div>
                    <div class="role-mention-description">${role.description}</div>
                </div>
            `;

            // 点击选择角色
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectRoleMention(role);
            });

            list.appendChild(item);
        });
    }

    // 显示角色选择下拉菜单
    showRoleMentionDropdown() {
        const dropdown = document.getElementById('roleMentionDropdown');
        if (!dropdown) return;

        dropdown.classList.add('show');
        this.roleMentionState.isVisible = true;
    }

    // 隐藏角色选择下拉菜单
    hideRoleMentionDropdown() {
        const dropdown = document.getElementById('roleMentionDropdown');
        if (!dropdown) return;

        dropdown.classList.remove('show');
        this.roleMentionState.isVisible = false;
        this.roleMentionState.selectedIndex = -1;
    }

    // 检查角色选择下拉菜单是否可见
    isRoleMentionDropdownVisible() {
        return this.roleMentionState.isVisible;
    }

    // 键盘导航角色选择
    navigateRoleMention(direction) {
        if (this.roleMentionState.filteredRoles.length === 0) return;

        const maxIndex = this.roleMentionState.filteredRoles.length - 1;
        
        if (direction === 'down') {
            this.roleMentionState.selectedIndex = 
                this.roleMentionState.selectedIndex < maxIndex ? 
                this.roleMentionState.selectedIndex + 1 : 0;
        } else if (direction === 'up') {
            this.roleMentionState.selectedIndex = 
                this.roleMentionState.selectedIndex > 0 ? 
                this.roleMentionState.selectedIndex - 1 : maxIndex;
        }

        // 更新UI
        this.updateRoleMentionSelection();
    }

    // 更新角色选择的UI状态
    updateRoleMentionSelection() {
        const items = document.querySelectorAll('.role-mention-item');
        items.forEach((item, index) => {
            if (index === this.roleMentionState.selectedIndex) {
                item.classList.add('selected');
                // 滚动到可见区域
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // 选择当前高亮的角色
    selectCurrentRoleMention() {
        if (this.roleMentionState.selectedIndex >= 0 && 
            this.roleMentionState.selectedIndex < this.roleMentionState.filteredRoles.length) {
            const selectedRole = this.roleMentionState.filteredRoles[this.roleMentionState.selectedIndex];
            this.selectRoleMention(selectedRole);
        }
    }

    // 选择角色并插入到输入框
    selectRoleMention(role) {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value;
        
        // 构建新的文本
        const beforeMention = text.substring(0, this.roleMentionState.mentionStart);
        const afterMention = text.substring(this.roleMentionState.mentionEnd);
        const roleTag = `@${role.name} `;
        
        const newText = beforeMention + roleTag + afterMention;
        const newCursorPos = beforeMention.length + roleTag.length;

        // 更新输入框内容
        messageInput.value = newText;
        messageInput.setSelectionRange(newCursorPos, newCursorPos);

        // 调整输入框高度
        this.adjustTextareaHeight(messageInput);

        // 隐藏下拉菜单
        this.hideRoleMentionDropdown();

        // 聚焦输入框
        messageInput.focus();

        // 切换到选中的角色
        this.roleManager.setCurrentRole(role.id);
        this.addSystemMessage(`已切换到角色：${role.name}`);
    }

    // 处理光标位置变化
    handleSelectionChange() {
        // 如果下拉菜单可见，检查光标是否还在@提及范围内
        if (this.roleMentionState.isVisible) {
            const messageInput = document.getElementById('messageInput');
            const cursorPos = messageInput.selectionStart;
            
            // 如果光标移出了@提及范围，隐藏下拉菜单
            if (cursorPos < this.roleMentionState.mentionStart || 
                cursorPos > this.roleMentionState.mentionEnd) {
                this.hideRoleMentionDropdown();
            }
        }
    }

    // 处理输入框点击
    handleInputClick() {
        // 重新检查是否需要显示@角色选择
        this.handleRoleMentionInput({ target: document.getElementById('messageInput') });
    }

    // Tools功能相关方法
    
    // 切换tools下拉菜单显示状态
    toggleToolsDropdown() {
        const toolsBtn = document.getElementById('toolsBtn');
        const toolsDropdown = document.getElementById('toolsDropdown');
        
        if (!toolsBtn || !toolsDropdown) return;

        const isVisible = toolsDropdown.classList.contains('show');
        
        if (isVisible) {
            this.hideToolsDropdown();
        } else {
            this.showToolsDropdown();
        }
    }

    // 显示tools下拉菜单
    showToolsDropdown() {
        const toolsBtn = document.getElementById('toolsBtn');
        const toolsDropdown = document.getElementById('toolsDropdown');
        
        if (!toolsBtn || !toolsDropdown) return;

        toolsDropdown.classList.add('show');
        toolsBtn.classList.add('active');
        
        // 加载当前设置状态
        this.loadToolsSettings();
    }

    // 隐藏tools下拉菜单
    hideToolsDropdown() {
        const toolsBtn = document.getElementById('toolsBtn');
        const toolsDropdown = document.getElementById('toolsDropdown');
        
        if (!toolsBtn || !toolsDropdown) return;

        toolsDropdown.classList.remove('show');
        toolsBtn.classList.remove('active');
    }

    // 加载tools设置状态
    loadToolsSettings() {
        const imageGenerationSwitch = document.getElementById('imageGenerationSwitch');
        
        if (imageGenerationSwitch) {
            // 从localStorage读取创建图片设置，默认为false
            const imageGenerationEnabled = localStorage.getItem('imageGenerationEnabled') === 'true';
            imageGenerationSwitch.checked = imageGenerationEnabled;
        }
    }

    // 切换创建图片功能
    toggleImageGeneration(enabled) {
        localStorage.setItem('imageGenerationEnabled', enabled.toString());
        
        if (enabled) {
            this.addSystemMessage('已开启创建图片功能');
        } else {
            this.addSystemMessage('已关闭创建图片功能');
        }
        
        console.log('创建图片功能:', enabled ? '开启' : '关闭');
    }

    // 获取创建图片状态
    isImageGenerationEnabled() {
        return localStorage.getItem('imageGeneration') === 'true';
    }
    
    // 显示欢迎界面
    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.classList.remove('hidden');
        }
    }
    
    // 隐藏欢迎界面
    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
    }
}

// 初始化应用
let app; // 全局变量，用于删除角色功能
document.addEventListener('DOMContentLoaded', () => {
    app = new ChatApp();
});