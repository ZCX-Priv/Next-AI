class ChatApp {
    constructor() {
        this.configManager = new ConfigManager();
        this.roleManager = new RoleManager();
        this.messageRenderer = new MessageRenderer();
        this.chatHistoryManager = new ChatHistoryManager();
        this.currentModel = this.configManager.config.currentModel;
        this.messages = [];
        this.currentStreamInterval = null; // 当前流式传输间隔
        this.isDarkMode = this.getStoredTheme() === 'dark';
        this.selectedRoleId = null; // 角色选择模态框中选中的角色ID
        
        // 性能优化相关属性
        this.lastThinkingContent = {}; // 缓存思考过程内容，避免重复渲染
        this.scrollThrottleTimer = null; // 滚动节流定时器
        this.renderQueue = new Map(); // 渲染队列，批量处理DOM更新
        
        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeModelOptions();
        this.updateModelDisplay();
        this.bindEvents();
        this.loadChatHistory();
        this.loadWelcomeMessage();
    }

    // 初始化主题
    initializeTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
            document.getElementById('themeToggle').classList.add('dark-mode');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
            document.getElementById('themeToggle').classList.remove('dark-mode');
        }
    }

    // 获取存储的主题
    getStoredTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    // 保存主题设置
    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // 初始化模型选项
    initializeModelOptions() {
        const modelOptions = document.getElementById('modelOptions');
        const providers = this.configManager.getProviders();
        
        // 清空现有选项
        modelOptions.innerHTML = '';
        
        // 添加所有提供商的模型
        providers.forEach(provider => {
            provider.models.forEach(model => {
                const option = document.createElement('div');
                option.className = 'model-option';
                option.dataset.model = model;
                option.dataset.provider = provider.key;
                option.textContent = `${provider.name} - ${model}`;
                
                if (model === this.currentModel) {
                    option.classList.add('active');
                }
                
                modelOptions.appendChild(option);
            });
        });
    }

    bindEvents() {
        // 模型选择器事件
        const modelBtn = document.getElementById('modelBtn');
        const modelOptions = document.getElementById('modelOptions');
        
        modelBtn.addEventListener('click', () => {
            modelOptions.classList.toggle('show');
        });

        // 点击模型选项
        document.querySelectorAll('.model-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const model = e.target.dataset.model;
                const provider = e.target.dataset.provider;
                this.selectModel(model, provider);
                modelOptions.classList.remove('show');
            });
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!modelBtn.contains(e.target) && !modelOptions.contains(e.target)) {
                modelOptions.classList.remove('show');
            }
        });

        // 发送消息事件
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        sendBtn.addEventListener('click', () => {
            if (sendBtn.classList.contains('stop-mode')) {
                this.stopGeneration();
            } else {
                this.sendMessage();
            }
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 自动调整输入框高度
        messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight(messageInput);
        });

        // 新建聊天按钮
        document.querySelector('.new-chat-btn').addEventListener('click', (e) => {
            if (e.target.closest('.new-chat-btn').querySelector('.fa-plus')) {
                this.newChat();
            } else if (e.target.closest('.new-chat-btn').querySelector('.fa-edit')) {
                this.renameCurrentChat();
            }
        });

        // 清空列表
        document.querySelector('.user-info').addEventListener('click', () => {
            this.clearChatHistory();
        });

        // 主题切换按钮
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 角色选择按钮
        document.getElementById('roleSelector').addEventListener('click', () => {
            this.showRoleModal();
        });

        // 清空消息按钮
        document.getElementById('clearMessages').addEventListener('click', () => {
            this.clearMessages();
        });

        // 设置按钮（右上角）
        document.getElementById('settingsToggle').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // 角色模态框事件
        this.bindRoleModalEvents();
    }

    selectModel(model, provider) {
        // 设置提供商和模型
        this.configManager.setProvider(provider);
        this.configManager.setModel(model);
        this.currentModel = model;
        
        // 更新UI显示
        this.updateModelDisplay();
        
        // 更新选中状态
        document.querySelectorAll('.model-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-model="${model}"][data-provider="${provider}"]`).classList.add('active');
        
        // 检查API配置
        const validation = this.configManager.validateConfig(provider);
        if (!validation.valid) {
            this.addSystemMessage(`${validation.error}`);
            this.showApiKeyPrompt(provider);
        } else {
            const providerConfig = this.configManager.getCurrentProvider();
            this.addSystemMessage(`已切换到 ${providerConfig.name} - ${model}`);
        }
    }

    // 更新模型显示
    updateModelDisplay() {
        const currentProvider = this.configManager.config.currentProvider;
        const currentModel = this.configManager.config.currentModel;
        
        if (currentProvider && currentModel) {
            const providerConfig = this.configManager.getCurrentProvider();
            document.querySelector('#modelBtn span').textContent = `${providerConfig.name} - ${currentModel}`;
        } else {
            document.querySelector('#modelBtn span').textContent = '选择模型';
        }
    }

    // 显示API密钥输入提示
    showApiKeyPrompt(provider) {
        const providerConfig = API_CONFIG[provider];
        const apiKey = prompt(`请输入 ${providerConfig.name} 的API密钥:`);
        
        if (apiKey) {
            this.configManager.setApiKey(provider, apiKey);
            this.addSystemMessage(`API密钥已设置，可以开始对话了！`);
        } else {
            this.addSystemMessage(`未设置API密钥，无法使用 ${providerConfig.name} 服务`);
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        // 添加用户消息
        this.addMessage('user', message);
        messageInput.value = '';
        this.adjustTextareaHeight(messageInput);

        // 确保用户消息发送后滚动到底部
        this.optimizedScrollToBottom();

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
        const config = this.configManager.getConfig();
        const provider = config.provider;
        
        if (!provider) {
            this.addSystemMessage('没有可用的API提供商，请在设置中启用至少一个API');
            this.resetSendButton();
            return;
        }

        // 验证API配置
        const validation = this.configManager.validateConfig(config.currentProvider);
        if (!validation.valid) {
            this.addSystemMessage(`${validation.error}`);
            this.showApiKeyPrompt(config.currentProvider);
            this.resetSendButton();
            return;
        }

        // 验证API密钥是否有效（仅对OpenRouter）
        if (config.currentProvider === 'openrouter') {
            const isValidKey = await this.validateApiKey(config.currentProvider);
            if (!isValidKey) {
                this.addSystemMessage('API密钥无效或已过期，请重新设置');
                this.showApiKeyPrompt(config.currentProvider);
                this.resetSendButton();
                return;
            }
        }

        // 创建AbortController用于取消请求
        this.currentAbortController = new AbortController();

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
            const apiUrl = `${provider.baseURL}/chat/completions`;
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
                this.addSystemMessage('生成已停止');
            } else {
                console.error('API调用错误:', error);
                this.addSystemMessage(`API调用失败: ${error.message}`);
                
                // 如果是API密钥错误，提示用户重新设置
                if (error.message.includes('401') || error.message.includes('403')) {
                    this.showApiKeyPrompt(config.currentProvider);
                }
            }
        } finally {
            this.currentAbortController = null;
            this.resetSendButton();
        }
    }

    // 停止生成
    stopGeneration() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        
        // 停止流式传输
        if (this.currentStreamInterval) {
            clearInterval(this.currentStreamInterval);
            this.currentStreamInterval = null;
        }
        
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
        
        // 优化：减少DOM更新频率
        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 100; // 100ms更新一次，减少频繁更新

        // 创建AI消息容器
        const messageDiv = this.addMessage('assistant', '', false, true, 0); // 初始时长为0
        const messageContent = messageDiv.querySelector('.message-content');

        try {
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
                            }
                            
                            // 处理常规内容
                            if (delta?.content) {
                                fullResponse += delta.content;
                            }
                            
                            // 优化：限制更新频率
                            const now = Date.now();
                            if (now - lastUpdateTime > UPDATE_INTERVAL) {
                                lastUpdateTime = now;
                                
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
                                
                                // 优化滚动：使用节流机制
                                 this.optimizedScrollToBottom();
                            }
                        } catch (e) {
                            // 忽略JSON解析错误
                        }
                    }
                }
            }
            
            // 最终更新：确保所有内容都被渲染
            if (isDeepSeekR1 && reasoningContent) {
                this.updateThinkingProcess(messageDiv, reasoningContent);
                // 思考过程完成，标记为已完成并自动折叠
                this.completeThinkingProcess(messageDiv);
            }
            
            if (fullResponse) {
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
            this.optimizedScrollToBottom();

        } catch (error) {
            console.error('流式响应处理错误:', error);
            this.addSystemMessage('响应处理失败');
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
                thinkingStatus.textContent = '已完成';
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
        // 解析思考过程和答案内容
        const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
        const thinkingContent = thinkingMatch ? thinkingMatch[1].trim() : '';
        const answerContent = content.replace(/<thinking>[\s\S]*?<\/thinking>\s*/, '').trim();

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

    addMessage(type, content, isStreaming = false, saveMessage = true, responseTime = null) {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.dataset.timestamp = Date.now();

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // 添加消息操作按钮（仅AI消息）
        if (type === 'assistant') {
            const actionButtons = document.createElement('div');
            actionButtons.className = 'message-actions';
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
            messageDiv.appendChild(actionButtons);

            // 添加回复时长显示
            if (responseTime !== null) {
                const timeInfo = document.createElement('div');
                timeInfo.className = 'response-time';
                timeInfo.textContent = `${responseTime}秒`;
                messageDiv.appendChild(timeInfo);
            }
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // 根据消息类型选择渲染方式
        if (type === 'user') {
            // 用户消息立即渲染
            this.messageRenderer.renderInstant(messageContent, content);
        } else if (isStreaming) {
            // AI消息流式渲染
            this.currentStreamInterval = this.messageRenderer.streamMessage(
                messageContent, 
                content,
                () => {
                    // 流式传输完成后的回调
                    this.currentStreamInterval = null;
                    this.bindMessageActions(messageDiv);
                }
            );
        } else {
            // AI消息立即渲染
            // 检查是否包含思考过程
            if (type === 'assistant' && content.includes('<thinking>')) {
                this.renderMessageWithThinking(messageDiv, content);
            } else {
                this.messageRenderer.renderInstant(messageContent, content);
            }
            
            if (type === 'assistant') {
                this.bindMessageActions(messageDiv);
            }
        }

        // 滚动到底部
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;

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
            
            // 更新聊天标题（如果是新建聊天且有第一条用户消息）
            const currentChat = this.chatHistoryManager.getCurrentChat();
            if (currentChat && currentChat.title === '新建聊天' && type === 'user') {
                const newTitle = this.chatHistoryManager.generateTitle(this.messages);
                this.chatHistoryManager.renameChat(currentChat.id, newTitle);
                this.renderChatList();
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
        
        // 从消息数组中移除这两条消息
        const messageIndex = Array.from(messageDiv.parentNode.children).indexOf(messageDiv);
        if (messageIndex > 0) {
            this.messages.splice(messageIndex - 1, 2);
        }

        // 删除DOM元素
        userMessageDiv.remove();
        messageDiv.remove();

        // 重新发送消息
        this.callAI(userMessage);
    }

    // 删除消息
    deleteMessage(messageDiv) {
        // 找到对应的消息索引
        const messageIndex = Array.from(messageDiv.parentNode.children).indexOf(messageDiv);
        if (messageIndex > 0) {
            this.messages.splice(messageIndex - 1, 1);
        }

        // 删除DOM元素
        messageDiv.remove();
    }

    // 添加流式消息方法
    addStreamingMessage(type, content) {
        return this.addMessage(type, content, true);
    }

    addSystemMessage(content) {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-notification';
        
        // 根据消息内容确定类型和图标
        let notificationType = 'info';
        let icon = 'ℹ️';
        
        if (content.includes('✅') || content.includes('成功') || content.includes('已保存') || content.includes('已切换')) {
            notificationType = 'success';
            icon = '✅';
        } else if (content.includes('❌') || content.includes('失败') || content.includes('错误') || content.includes('无效')) {
            notificationType = 'error';
            icon = '❌';
        } else if (content.includes('⚠️') || content.includes('警告') || content.includes('注意')) {
            notificationType = 'warning';
            icon = '⚠️';
        } else if (content.includes('🎨') || content.includes('🎭') || content.includes('🗑️') || content.includes('⏹️')) {
            notificationType = 'info';
            // 保持原有的emoji图标
            icon = content.match(/^[🎨🎭🗑️⏹️✅❌⚠️]/)?.[0] || 'ℹ️';
        }
        
        // 移除内容开头的emoji，因为我们会在通知框中显示
        const cleanContent = content.replace(/^[🎨🎭🗑️⏹️✅❌⚠️]\s*/, '');
        
        messageDiv.innerHTML = `
            <div class="notification-toast ${notificationType}">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">${cleanContent}</div>
                <div class="notification-close" onclick="this.parentElement.parentElement.remove()">×</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        
        // 自动滚动到底部
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // 3秒后自动消失（除了错误消息）
        if (notificationType !== 'error') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.style.opacity = '0';
                    messageDiv.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        if (messageDiv.parentNode) {
                            messageDiv.remove();
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    simulateAIResponse(userMessage) {
        const responses = {
            '你好': '您好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？',
            '你是谁': `我是**${this.currentModel}**，一个AI助手。我可以帮助您回答问题、提供信息和进行对话。`,
            '你是哪个公司的哪个模型': `我是**${this.currentModel}**模型。我可以帮助您处理各种任务，包括：\n\n- 回答问题\n- 文本生成\n- 代码编写\n- 数据分析`,
            '你能做什么': `我可以帮助您：

## 📝 文本处理
- 回答各种问题
- 协助写作和编辑
- 翻译文本

## 💻 编程支持
- 代码编写和调试
- 算法解释
- 技术咨询

## 📊 数据分析
- 数据处理
- 统计分析
- 图表制作

## 🎨 创意思考
- 创意写作
- 头脑风暴
- 问题解决

还有更多功能等您探索！`,
            '代码示例': `这里是一个Python代码示例：

\`\`\`python
def fibonacci(n):
    """计算斐波那契数列的第n项"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 计算前10项
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

这个函数使用递归方法计算斐波那契数列。`,
            '数学公式': `这里是一些数学公式示例：

**行内公式：** 勾股定理 $a^2 + b^2 = c^2$

**块级公式：**
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

**矩阵：**
$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}$$

数学公式使用LaTeX语法渲染。`,
            'markdown': `# Markdown语法示例

## 文本格式
- **粗体文本**
- *斜体文本*
- \`行内代码\`

## 列表
1. 有序列表项1
2. 有序列表项2
   - 无序子项
   - 另一个子项

## 引用
> 这是一个引用块
> 可以包含多行内容

## 表格
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |

## 链接
[这是一个链接](https://example.com)`
        };

        let response = responses[userMessage] || `我理解您说的是"${userMessage}"。作为**${this.currentModel}**，我会尽力为您提供帮助。

请告诉我您需要什么具体的协助？我可以：
- 回答问题
- 编写代码
- 解释概念
- 提供建议

有什么我可以帮您的吗？`;

        // 使用流式传输显示AI回复
        this.addStreamingMessage('assistant', response);
    }

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    loadChatHistory() {
        const chatHistory = document.querySelector('.chat-history');
        chatHistory.innerHTML = '';

        const chats = this.chatHistoryManager.getChatList();
        if (chats.length === 0) {
            // 如果没有聊天，创建一个默认的
            const newChat = this.chatHistoryManager.createNewChat('新建聊天');
            this.chatHistoryManager.currentChatId = newChat.id;
        }

        this.renderChatList();
    }

    renderChatList() {
        const chatHistory = document.querySelector('.chat-history');
        const chats = this.chatHistoryManager.getChatList();
        
        chatHistory.innerHTML = '';
        
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
        
        // 创建新聊天
        const newChat = this.chatHistoryManager.createNewChat('新建聊天');
        this.chatHistoryManager.currentChatId = newChat.id;
        
        this.messages = [];
        document.getElementById('messages').innerHTML = '';
        this.loadWelcomeMessage();
        
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
        
        // 渲染所有消息
        this.messages.forEach(msg => {
            this.addMessage(msg.type, msg.content, false, false, msg.responseTime);
        });
        
        this.renderChatList();
    }

    saveCurrentChat() {
        if (this.chatHistoryManager.currentChatId) {
            this.chatHistoryManager.saveMessages(this.messages);
            
            // 更新聊天标题（如果是新建聊天且有消息）
            const currentChat = this.chatHistoryManager.getCurrentChat();
            if (currentChat && currentChat.title === '新建聊天' && this.messages.length > 0) {
                const newTitle = this.chatHistoryManager.generateTitle(this.messages);
                this.chatHistoryManager.renameChat(currentChat.id, newTitle);
            }
        }
    }

    selectChat(chatItem) {
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        chatItem.classList.add('active');
        
        // 这里可以加载对应的聊天记录
        this.newChat();
    }

    renameChat(chatId) {
        const chat = this.chatHistoryManager.getChatList().find(c => c.id === chatId);
        if (chat) {
            const newTitle = prompt('请输入新的聊天名称：', chat.title);
            if (newTitle && newTitle.trim()) {
                this.chatHistoryManager.renameChat(chatId, newTitle.trim());
                this.renderChatList();
            }
        }
    }

    deleteChat(chatId) {
        const chat = this.chatHistoryManager.getChatList().find(c => c.id === chatId);
        if (chat && confirm(`确定要删除聊天 "${chat.title}" 吗？`)) {
            this.chatHistoryManager.deleteChat(chatId);
            
            // 如果删除的是当前聊天，切换到第一个聊天
            if (this.chatHistoryManager.currentChatId === chatId) {
                const chats = this.chatHistoryManager.getChatList();
                if (chats.length > 0) {
                    this.selectChat(chats[0].id);
                } else {
                    this.newChat();
                }
            } else {
                this.renderChatList();
            }
        }
    }

    clearChatHistory() {
        if (confirm('确定要清空所有聊天记录吗？此操作不可撤销。')) {
            this.chatHistoryManager.clearAllChats();
            this.newChat();
        }
    }

    loadWelcomeMessage() {
        setTimeout(() => {
            const currentProvider = this.configManager.getCurrentProvider();
            const providerName = currentProvider ? currentProvider.name : 'OpenAI';
            
            let welcomeMessage = `# 欢迎使用AI助手！

**当前配置：** ${providerName} - ${this.currentModel}

## 我可以帮助您：
- 📝 回答各种问题
- ✍️ 协助写作和编辑  
- 💻 代码编程支持
- 📊 数据分析
- 🎨 创意思考
- 📚 学习辅导

## 💡 使用提示：
- 点击顶部的模型选择器可以切换不同的AI提供商和模型
- 点击设置按钮⚙️可以启用或禁用API提供商
- 支持**Markdown**语法、\`代码高亮\`和数学公式 $E=mc^2$

请输入您的问题开始对话吧！`;

            // 使用立即显示而不是流式显示
            this.addMessage('assistant', welcomeMessage, false);
        }, 500);
    }

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
                    <button class="btn-secondary" id="cancelBtn">取消</button>
                    <button class="btn-primary" id="saveBtn">保存</button>
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
            }
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
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
                    <button class="btn-secondary" id="cancelBtn">取消</button>
                    <button class="btn-primary" id="saveBtn">保存</button>
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
            }
            .modal-header h3 {
                margin: 0;
                font-size: 18px;
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
                    <div class="provider-models">${provider.models.join(', ')}</div>
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

        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
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
            
            // 重新初始化模型选项
            this.initializeModelOptions();
            
            // 重新绑定事件（因为DOM元素已更新）
            this.rebindModelEvents();
            
            // 更新模型按钮显示
            const currentProvider = this.configManager.getCurrentProvider();
            if (currentProvider) {
                document.querySelector('#modelBtn span').textContent = `${currentProvider.name} - ${this.currentModel}`;
            }

            document.body.removeChild(modal);
            document.head.removeChild(style);

            this.addSystemMessage('API设置已保存，当前模型已自动调整');
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
            option.addEventListener('click', (e) => {
                const model = e.target.dataset.model;
                const provider = e.target.dataset.provider;
                this.selectModel(model, provider);
                modelOptions.classList.remove('show');
            });
        });
    }

    // 主题切换
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const theme = this.isDarkMode ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', theme);
        this.saveTheme(theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (this.isDarkMode) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.classList.add('dark-mode');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.classList.remove('dark-mode');
        }
        
        this.addSystemMessage(`已切换到${this.isDarkMode ? '夜间' : '白昼'}模式`);
    }

    // 清空消息
    clearMessages() {
        if (confirm('确定要清空所有消息吗？此操作不可撤销。')) {
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
            this.messages = [];
            
            // 清空后重新加载欢迎消息
            this.loadWelcomeMessage();
            this.addSystemMessage('消息已清空');
        }
    }

    // 显示角色选择模态框
    showRoleModal() {
        const modal = document.getElementById('roleModal');
        this.loadRoleList();
        modal.style.display = 'flex';
    }

    // 加载角色列表
    loadRoleList() {
        const roleList = document.getElementById('roleList');
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

        // 关闭按钮
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        addRoleCloseBtn.addEventListener('click', closeAddRoleModal);
        addRoleCancelBtn.addEventListener('click', closeAddRoleModal);

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

        // 实时验证表单
        const validateForm = () => {
            const name = document.getElementById('roleName').value.trim();
            const description = document.getElementById('roleDescription').value.trim();
            const prompt = document.getElementById('rolePrompt').value.trim();
            
            saveBtn.disabled = !(name && description && prompt);
        };

        // 监听输入变化
        ['roleName', 'roleDescription', 'rolePrompt'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', validateForm);
            }
        });

        // 回车键保存
        document.getElementById('roleName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !saveBtn.disabled) {
                this.saveNewRole();
            }
        });
    }

    // 保存新角色
    saveNewRole() {
        const name = document.getElementById('roleName').value.trim();
        const avatar = document.getElementById('roleAvatar').value.trim() || '🤖';
        const description = document.getElementById('roleDescription').value.trim();
        const prompt = document.getElementById('rolePrompt').value.trim();

        if (!name || !description || !prompt) {
            alert('请填写所有必填字段！');
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
            this.addSystemMessage(`新角色 "${newRole.name}" 添加成功！`);

            // 重新加载角色列表
            this.loadRoleList();

        } catch (error) {
            console.error('添加角色失败:', error);
            alert('添加角色失败，请重试！');
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
            
            let deleteButton = '';
            if (role.id.startsWith('custom_')) {
                deleteButton = `<button class="delete-role-btn" title="删除角色" onclick="event.stopPropagation(); app.deleteCustomRole('${role.id}')">
                    <i class="fas fa-times"></i>
                </button>`;
            }
            
            roleItem.innerHTML = `
                <div class="role-avatar">${role.avatar}</div>
                <div class="role-info">
                    <div class="role-name">${role.name}</div>
                    <div class="role-description">${role.description}</div>
                </div>
                ${deleteButton}
            `;
            
            roleList.appendChild(roleItem);
        });
        
        this.updateRoleConfirmButton();
    }

    // 删除自定义角色
    deleteCustomRole(roleId) {
        const role = this.roleManager.getRoleById(roleId);
        if (!role) return;

        if (confirm(`确定要删除自定义角色 "${role.name}" 吗？此操作不可撤销。`)) {
            try {
                this.roleManager.removeCustomRole(roleId);
                this.addSystemMessage(`角色 "${role.name}" 已删除`);
                this.loadRoleList();
            } catch (error) {
                console.error('删除角色失败:', error);
                alert('删除角色失败，请重试！');
            }
        }
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
            
            let deleteButton = '';
            if (role.id.startsWith('custom_')) {
                deleteButton = `<button class="delete-role-btn" title="删除角色" onclick="event.stopPropagation(); app.deleteCustomRole('${role.id}')">
                    <i class="fas fa-times"></i>
                </button>`;
            }
            
            roleItem.innerHTML = `
                <div class="role-avatar">${role.avatar}</div>
                <div class="role-info">
                    <div class="role-name">${role.name}</div>
                    <div class="role-description">${role.description}</div>
                </div>
                ${deleteButton}
            `;
            
            roleList.appendChild(roleItem);
        });
        
        this.updateRoleConfirmButton();
    }

    // 优化的滚动方法 - 使用节流机制
    optimizedScrollToBottom() {
        if (this.scrollThrottleTimer) {
            return; // 如果已有滚动请求在等待，直接返回
        }
        
        this.scrollThrottleTimer = requestAnimationFrame(() => {
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            this.scrollThrottleTimer = null;
        });
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
}

// 初始化应用
let app; // 全局变量，用于删除角色功能
document.addEventListener('DOMContentLoaded', () => {
    app = new ChatApp();
});