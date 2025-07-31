// AI角色配置
const AI_ROLES = [
    {
        id: 'assistant',
        name: '通用助手',
        avatar: '🤖',
        description: '我是一个通用AI助手，可以帮助您解答问题、提供建议和完成各种任务。',
        prompt: '你是一个友善、专业的AI助手。请用简洁明了的语言回答用户的问题，并尽可能提供有用的信息和建议。'
    },
    {
        id: 'programmer',
        name: '编程专家',
        avatar: '👨‍💻',
        description: '专业的编程助手，精通多种编程语言，可以帮助您解决代码问题、优化算法和学习新技术。',
        prompt: '你是一个经验丰富的编程专家，精通多种编程语言和开发框架。请提供清晰的代码示例、最佳实践建议，并解释技术概念。在回答时要考虑代码的可读性、性能和安全性。'
    },
    {
        id: 'writer',
        name: '写作助手',
        avatar: '✍️',
        description: '专业的写作助手，可以帮助您创作文章、优化文案、校对文本和提供写作建议。',
        prompt: '你是一个专业的写作助手，擅长各种文体的创作和编辑。请帮助用户改善文章结构、优化语言表达、纠正语法错误，并提供创意写作建议。注重文章的逻辑性、可读性和吸引力。'
    },
    {
        id: 'teacher',
        name: '学习导师',
        avatar: '👨‍🏫',
        description: '耐心的学习导师，可以解释复杂概念、制定学习计划和提供教育指导。',
        prompt: '你是一个耐心、专业的学习导师。请用通俗易懂的语言解释复杂概念，提供循序渐进的学习建议，并根据学生的水平调整教学方法。鼓励学生思考，培养他们的学习兴趣和自主学习能力。'
    },
    {
        id: 'translator',
        name: '翻译专家',
        avatar: '🌐',
        description: '专业的多语言翻译专家，提供准确、自然的翻译服务和语言学习建议。',
        prompt: '你是一个专业的翻译专家，精通多种语言。请提供准确、自然、符合目标语言习惯的翻译。在翻译时要考虑语境、文化背景和语言风格，必要时提供多种翻译选项和解释。'
    },
    {
        id: 'analyst',
        name: '数据分析师',
        avatar: '📊',
        description: '专业的数据分析师，擅长数据处理、统计分析和商业洞察。',
        prompt: '你是一个专业的数据分析师，擅长数据处理、统计分析和可视化。请提供清晰的数据解读、有价值的商业洞察，并建议合适的分析方法和工具。在分析时要注重数据的准确性和结论的可靠性。'
    },
    {
        id: 'designer',
        name: '设计顾问',
        avatar: '🎨',
        description: '创意设计顾问，提供UI/UX设计建议、视觉创意和设计趋势分析。',
        prompt: '你是一个富有创意的设计顾问，精通UI/UX设计、视觉设计和用户体验。请提供实用的设计建议、创新的解决方案，并关注设计的美观性、可用性和用户体验。分享最新的设计趋势和最佳实践。'
    },
    {
        id: 'consultant',
        name: '商业顾问',
        avatar: '💼',
        description: '经验丰富的商业顾问，提供战略规划、市场分析和商业决策建议。',
        prompt: '你是一个经验丰富的商业顾问，擅长战略规划、市场分析和商业运营。请提供专业的商业建议、市场洞察和可行的解决方案。在分析时要考虑市场趋势、竞争环境和风险因素。'
    },
    {
        id: 'psychologist',
        name: '心理咨询师',
        avatar: '🧠',
        description: '专业的心理咨询师，提供情感支持、心理健康建议和压力管理指导。',
        prompt: '你是一个专业、同理心强的心理咨询师。请提供温暖的情感支持、专业的心理健康建议，帮助用户管理情绪和压力。在交流时要保持耐心、理解和非评判的态度，注重用户的心理健康和个人成长。'
    },
    {
        id: 'scientist',
        name: '科学研究员',
        avatar: '🔬',
        description: '严谨的科学研究员，提供科学知识解释、研究方法指导和学术建议。',
        prompt: '你是一个严谨的科学研究员，具有深厚的科学知识和研究经验。请提供准确的科学解释、合理的研究方法建议，并基于证据进行分析。在回答时要保持客观、严谨的科学态度，区分事实和假设。'
    }
];

// 自定义角色存储键
const CUSTOM_ROLES_KEY = 'custom_roles';

// 角色管理器
class RoleManager {
    constructor() {
        this.customRoles = this.loadCustomRoles();
        this.currentRole = this.getStoredRole() || AI_ROLES[0];
    }

    // 获取所有角色（包括自定义角色）
    getAllRoles() {
        return [...AI_ROLES, ...this.customRoles];
    }

    // 根据ID获取角色
    getRoleById(id) {
        return this.getAllRoles().find(role => role.id === id);
    }

    // 搜索角色
    searchRoles(query) {
        if (!query) return this.getAllRoles();
        
        const lowerQuery = query.toLowerCase();
        return this.getAllRoles().filter(role => 
            role.name.toLowerCase().includes(lowerQuery) ||
            role.description.toLowerCase().includes(lowerQuery)
        );
    }

    // 设置当前角色
    setCurrentRole(roleId) {
        const role = this.getRoleById(roleId);
        if (role) {
            this.currentRole = role;
            this.saveCurrentRole();
            return true;
        }
        return false;
    }

    // 获取当前角色
    getCurrentRole() {
        return this.currentRole;
    }

    // 获取当前角色的系统提示词
    getCurrentPrompt() {
        return this.currentRole.prompt;
    }

    // 添加自定义角色
    addCustomRole(role) {
        const newRole = {
            id: `custom_${Date.now()}`,
            ...role
        };
        this.customRoles.push(newRole);
        this.saveCustomRoles();
        return newRole;
    }

    // 编辑自定义角色
    editCustomRole(roleId, updatedRole) {
        const index = this.customRoles.findIndex(role => role.id === roleId);
        if (index !== -1) {
            this.customRoles[index] = { ...this.customRoles[index], ...updatedRole };
            this.saveCustomRoles();
            
            // 如果编辑的是当前角色，更新当前角色
            if (this.currentRole.id === roleId) {
                this.currentRole = this.customRoles[index];
                this.saveCurrentRole();
            }
            
            return this.customRoles[index];
        }
        return null;
    }

    // 删除自定义角色
    removeCustomRole(roleId) {
        this.customRoles = this.customRoles.filter(role => role.id !== roleId);
        this.saveCustomRoles();
        
        // 如果当前角色是被删除的自定义角色，切换到默认角色
        if (this.currentRole.id === roleId) {
            this.setCurrentRole('assistant');
        }
    }

    // 保存自定义角色到本地存储
    saveCustomRoles() {
        localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(this.customRoles));
    }

    // 从本地存储加载自定义角色
    loadCustomRoles() {
        try {
            const stored = localStorage.getItem(CUSTOM_ROLES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading custom roles:', error);
            return [];
        }
    }

    // 保存当前角色到本地存储
    saveCurrentRole() {
        localStorage.setItem('currentRole', JSON.stringify(this.currentRole));
    }

    // 从本地存储获取角色
    getStoredRole() {
        try {
            const stored = localStorage.getItem('currentRole');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading stored role:', error);
            return null;
        }
    }
}