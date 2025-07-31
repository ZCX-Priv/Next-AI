// 消息渲染器类
class MessageRenderer {
    constructor() {
        this.initializeMarked();
        this.initializeHighlight();
    }

    // 初始化Marked配置
    initializeMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: (code, lang) => {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.warn('代码高亮失败:', err);
                        }
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });
        }
    }

    // 初始化代码高亮
    initializeHighlight() {
        if (typeof hljs !== 'undefined') {
            hljs.configure({
                languages: ['javascript', 'python', 'java', 'cpp', 'html', 'css', 'json', 'xml', 'sql', 'bash']
            });
        }
    }

    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 渲染数学公式
    renderMath(text) {
        if (typeof katex === 'undefined') return text;

        // 处理行内数学公式 $...$
        text = text.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula, { displayMode: false });
            } catch (e) {
                console.warn('数学公式渲染失败:', e);
                return match;
            }
        });

        // 处理块级数学公式 $$...$$
        text = text.replace(/\$\$([^$]+?)\$\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula, { displayMode: true });
            } catch (e) {
                console.warn('数学公式渲染失败:', e);
                return match;
            }
        });

        return text;
    }

    // 添加代码块复制功能
    addCopyButtons(element) {
        const codeBlocks = element.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = '复制';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    copyBtn.textContent = '已复制';
                    setTimeout(() => {
                        copyBtn.textContent = '复制';
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                });
            };

            wrapper.appendChild(copyBtn);
        });
    }

    // 处理思考过程标签
    processThinkTags(text) {
        // 将<think>...</think>标签转换为可折叠的思考过程
        return text.replace(/<think>([\s\S]*?)<\/think>/g, (match, content) => {
            const escapedContent = this.escapeHtml(content.trim());
            return `
                <div class="think-container">
                    <details class="think-details">
                        <summary class="think-summary">思考过程</summary>
                        <div class="think-content">${escapedContent}</div>
                    </details>
                </div>
            `;
        });
    }

    // 渲染完整消息
    renderMessage(text, isStreaming = false) {
        // 1. 处理思考过程标签
        let processedText = this.processThinkTags(text);
        
        // 2. HTML转义
        processedText = this.escapeHtml(processedText);
        
        // 3. 渲染数学公式
        processedText = this.renderMath(processedText);
        
        // 4. 渲染Markdown
        if (typeof marked !== 'undefined') {
            processedText = marked.parse(processedText);
        }
        
        // 5. 使用DOMPurify清理HTML
        if (typeof DOMPurify !== 'undefined') {
            processedText = DOMPurify.sanitize(processedText, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                              'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
                              'details', 'summary'],
                ALLOWED_ATTR: ['href', 'class', 'id', 'style']
            });
        }
        
        // 6. 添加流式传输光标
        if (isStreaming) {
            processedText += '<span class="streaming-cursor"></span>';
        }
        
        return processedText;
    }

    // 流式传输渲染
    streamMessage(element, text, onComplete = null) {
        const words = text.split('');
        let currentIndex = 0;
        let currentText = '';
        
        element.classList.add('rendering');
        
        const streamInterval = setInterval(() => {
            if (currentIndex < words.length) {
                currentText += words[currentIndex];
                currentIndex++;
                
                // 渲染当前文本（带流式光标）
                const renderedContent = this.renderMessage(currentText, true);
                element.innerHTML = renderedContent;
                
                // 添加代码块复制按钮
                this.addCopyButtons(element);
                
                // 滚动到底部
                element.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
                // 流式传输完成
                clearInterval(streamInterval);
                
                // 最终渲染（不带光标）
                const finalContent = this.renderMessage(currentText, false);
                element.innerHTML = finalContent;
                
                // 添加代码块复制按钮
                this.addCopyButtons(element);
                
                element.classList.remove('rendering');
                element.classList.add('rendered');
                
                if (onComplete) {
                    onComplete();
                }
            }
        }, 30); // 30ms间隔，可以调整速度
        
        return streamInterval;
    }

    // 立即渲染消息（非流式）
    renderInstant(element, text) {
        element.classList.add('rendering');
        
        const renderedContent = this.renderMessage(text, false);
        element.innerHTML = renderedContent;
        
        // 添加代码块复制按钮
        this.addCopyButtons(element);
        
        element.classList.remove('rendering');
        element.classList.add('rendered');
    }
}