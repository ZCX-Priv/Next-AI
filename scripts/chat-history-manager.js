// 聊天历史管理器
class ChatHistoryManager {
    constructor() {
        this.currentChatId = null;
        this.chats = this.loadChats();
    }

    // 从localStorage加载聊天历史
    loadChats() {
        try {
            const saved = localStorage.getItem('chat_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载聊天历史失败:', error);
            return [];
        }
    }

    // 保存聊天历史到localStorage
    saveChats() {
        try {
            localStorage.setItem('chat_history', JSON.stringify(this.chats));
        } catch (error) {
            console.error('保存聊天历史失败:', error);
        }
    }

    // 创建新聊天
    createNewChat(title = '新建聊天', isManuallyCreated = false) {
        const chat = {
            id: Date.now().toString(),
            title: title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isManuallyCreated: isManuallyCreated
        };
        
        this.chats.unshift(chat);
        this.saveChats();
        return chat;
    }

    // 获取当前聊天
    getCurrentChat() {
        if (!this.currentChatId) return null;
        return this.chats.find(chat => chat.id === this.currentChatId);
    }

    // 切换到指定聊天
    switchChat(chatId) {
        this.currentChatId = chatId;
        const chat = this.getCurrentChat();
        return chat ? chat.messages : [];
    }

    // 保存当前消息到聊天
    saveMessages(messages) {
        const chat = this.getCurrentChat();
        if (chat) {
            chat.messages = [...messages];
            chat.updatedAt = new Date().toISOString();
            this.saveChats();
        }
    }

    // 重命名聊天
    renameChat(chatId, newTitle) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.title = newTitle;
            chat.updatedAt = new Date().toISOString();
            this.saveChats();
            return true;
        }
        return false;
    }

    // 删除聊天
    deleteChat(chatId) {
        const index = this.chats.findIndex(c => c.id === chatId);
        if (index > -1) {
            this.chats.splice(index, 1);
            this.saveChats();
            return true;
        }
        return false;
    }

    // 获取所有聊天列表
    getChatList() {
        return this.chats;
    }

    // 清空所有聊天
    clearAllChats() {
        this.chats = [];
        this.currentChatId = null;
        this.saveChats();
    }

    // 生成聊天标题（基于第一条消息）
    generateTitle(messages) {
        if (!messages || messages.length === 0) return '新建聊天';
        
        const firstMessage = messages.find(m => m.type === 'user');
        if (!firstMessage) return '新建聊天';
        
        const content = firstMessage.content.trim();
        if (content.length <= 10) return content;
        return content.substring(0, 10) + '...';
    }
}