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
            
            // 检查是否已经有wrapper，避免重复添加
            if (pre.parentElement.classList.contains('code-block-wrapper')) {
                return;
            }
            
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

    // 手动高亮代码块
    highlightCodeBlocks(element) {
        if (typeof hljs !== 'undefined') {
            const codeBlocks = element.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                if (!block.dataset.highlighted) {
                    hljs.highlightElement(block);
                }
            });
        }
    }

    // 处理思考过程标签
    processThinkTags(text) {
        // 将<think>...</think>标签转换为可折叠的思考过程
        return text.replace(/<think>([\s\S]*?)<\/think>/g, (match, content) => {
            const trimmedContent = content.trim();
            
            // 对think标签内的内容进行Markdown渲染
            let processedContent = this.renderMath(trimmedContent);
            if (typeof marked !== 'undefined') {
                processedContent = marked.parse(processedContent);
            }
            
            return `
                <div class="think-container">
                    <details class="think-details">
                        <summary class="think-summary">思考过程</summary>
                        <div class="think-content">${processedContent}</div>
                    </details>
                </div>
            `;
        });
    }

    // 渲染完整消息
    renderMessage(text, isStreaming = false) {
        let processedText = text;
        
        // 1. 先分离think标签和普通内容
        const thinkTags = [];
        let thinkIndex = 0;
        
        // 提取think标签，用占位符替换
        processedText = processedText.replace(/<think>([\s\S]*?)<\/think>/g, (match, content) => {
            const placeholder = `__THINK_PLACEHOLDER_${thinkIndex}__`;
            thinkTags[thinkIndex] = match;
            thinkIndex++;
            return placeholder;
        });
        
        // 2. 渲染数学公式（在Markdown之前）
        processedText = this.renderMath(processedText);
        
        // 3. 渲染Markdown（包含代码高亮）
        if (typeof marked !== 'undefined') {
            processedText = marked.parse(processedText);
        }
        
        // 4. 恢复think标签并处理
        thinkTags.forEach((thinkTag, index) => {
            const placeholder = `__THINK_PLACEHOLDER_${index}__`;
            const processedThink = this.processThinkTags(thinkTag);
            processedText = processedText.replace(placeholder, processedThink);
        });
        
        // 5. 使用DOMPurify清理HTML
        if (typeof DOMPurify !== 'undefined') {
            processedText = DOMPurify.sanitize(processedText, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                              'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
                              'details', 'summary'],
                ALLOWED_ATTR: ['href', 'class', 'id', 'style', 'data-highlighted'],
                ALLOW_DATA_ATTR: false
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
                
                // 手动高亮代码块
                this.highlightCodeBlocks(element);
                
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
                
                // 手动高亮代码块
                this.highlightCodeBlocks(element);
                
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

    // 立即渲染消息（非流式）- 优化版本
    renderInstant(element, text) {
        // 如果是思考指示器标记，不进行渲染
        if (text === '__THINKING__') {
            return;
        }
        
        // 避免重复渲染相同内容
        if (element.dataset.lastContent === text) {
            return;
        }
        
        element.classList.add('rendering');
        
        const renderedContent = this.renderMessage(text, false);
        
        // 使用requestAnimationFrame优化DOM更新
        requestAnimationFrame(() => {
            element.innerHTML = renderedContent;
            
            // 手动高亮代码块
            this.highlightCodeBlocks(element);
            
            // 添加代码块复制按钮
            this.addCopyButtons(element);
            
            element.classList.remove('rendering');
            element.classList.add('rendered');
            
            // 记录最后渲染的内容
            element.dataset.lastContent = text;
        });
    }
}