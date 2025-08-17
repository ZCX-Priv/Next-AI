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
                    if (typeof hljs !== 'undefined' && lang) {
                        try {
                            // 检查语言是否支持
                            if (hljs.getLanguage(lang)) {
                                return hljs.highlight(code, { language: lang }).value;
                            } else {
                                // 尝试自动检测语言
                                const result = hljs.highlightAuto(code);
                                return result.value;
                            }
                        } catch (err) {
                            console.warn('代码高亮失败:', lang, err);
                            return this.escapeHtml(code);
                        }
                    }
                    return this.escapeHtml(code);
                },
                breaks: true,
                gfm: true,
                sanitize: false, // 我们使用DOMPurify进行清理
                smartLists: true,
                smartypants: false
            });
            console.log('Marked初始化完成');
        } else {
            console.warn('Marked未加载，Markdown渲染功能不可用');
        }
    }

    // 初始化代码高亮
    initializeHighlight() {
        if (typeof hljs !== 'undefined') {
            hljs.configure({
                languages: ['javascript', 'python', 'java', 'cpp', 'html', 'css', 'json', 'xml', 'sql', 'bash', 'typescript', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'csharp', 'markdown'],
                ignoreUnescapedHTML: true,
                throwUnescapedHTML: false
            });
            console.log('Highlight.js初始化完成');
        } else {
            console.warn('Highlight.js未加载，代码高亮功能不可用');
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
        if (typeof katex === 'undefined') {
            console.warn('KaTeX未加载，跳过数学公式渲染');
            return text;
        }

        try {
            // 处理块级数学公式 $$...$$ (必须先处理，避免与行内公式冲突)
            text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
                try {
                    const cleanFormula = formula.trim();
                    if (!cleanFormula) return match;
                    return katex.renderToString(cleanFormula, { 
                        displayMode: true,
                        throwOnError: false,
                        errorColor: '#cc0000',
                        strict: false
                    });
                } catch (e) {
                    console.warn('块级数学公式渲染失败:', formula, e);
                    return `<span class="math-error">$$${formula}$$</span>`;
                }
            });

            // 处理行内数学公式 $...$
            text = text.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
                try {
                    const cleanFormula = formula.trim();
                    if (!cleanFormula) return match;
                    return katex.renderToString(cleanFormula, { 
                        displayMode: false,
                        throwOnError: false,
                        errorColor: '#cc0000',
                        strict: false
                    });
                } catch (e) {
                    console.warn('行内数学公式渲染失败:', formula, e);
                    return `<span class="math-error">$${formula}$</span>`;
                }
            });
        } catch (e) {
            console.error('数学公式渲染过程中发生错误:', e);
        }

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

            // 检查是否是HTML代码
            const language = codeBlock.className.match(/language-(\w+)/);
            const isHTML = language && (language[1] === 'html' || language[1] === 'htm');
            
            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'code-buttons';
            
            // 如果是HTML代码，添加预览按钮
            if (isHTML) {
                const previewBtn = document.createElement('button');
                previewBtn.className = 'preview-btn';
                previewBtn.textContent = '预览';
                previewBtn.onclick = () => {
                    this.showHTMLPreview(codeBlock.textContent);
                };
                buttonContainer.appendChild(previewBtn);
            }

            // 添加复制按钮
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
            buttonContainer.appendChild(copyBtn);

            wrapper.appendChild(buttonContainer);
        });
    }

    // 显示HTML预览模态框
    showHTMLPreview(htmlContent) {
        // 解析HTML内容中的title
        let pageTitle = 'HTML预览';
        const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1].trim()) {
            // 对title进行HTML转义，防止XSS
            pageTitle = titleMatch[1].trim()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'html-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${pageTitle}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <iframe class="html-preview-frame" sandbox="allow-scripts allow-same-origin"></iframe>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 获取iframe并设置内容
        const iframe = modal.querySelector('.html-preview-frame');
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };

        // 点击模态框外部关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        // 显示模态框
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
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
    // 渲染思考内容
    renderThinkContent(content) {
        // 对think标签内的内容进行Markdown和数学公式渲染
        let processedContent = this.renderMath(content);
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
    }
    
    // 保持向后兼容的processThinkTags方法
    processThinkTags(text) {
        return text.replace(/<(think|thinking)>([\s\S]*?)<\/(think|thinking)>/g, (match, openTag, content) => {
            return this.renderThinkContent(content.trim());
        });
    }

    // 渲染完整消息
    renderMessage(text, isStreaming = false) {
        let processedText = text;
        
        // 1. 先处理think标签和thinking标签
        const thinkTags = [];
        let thinkIndex = 0;
        
        // 提取think和thinking标签，用占位符替换
        processedText = processedText.replace(/<(think|thinking)>([\s\S]*?)<\/(think|thinking)>/g, (match, openTag, content, closeTag) => {
            const placeholder = `__THINK_PLACEHOLDER_${thinkIndex}__`;
            thinkTags[thinkIndex] = { match, content: content.trim(), tag: openTag };
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
        thinkTags.forEach((thinkData, index) => {
            const placeholder = `__THINK_PLACEHOLDER_${index}__`;
            const processedThink = this.renderThinkContent(thinkData.content);
            processedText = processedText.replace(placeholder, processedThink);
        });
        
        // 5. 使用DOMPurify清理HTML
        if (typeof DOMPurify !== 'undefined') {
            processedText = DOMPurify.sanitize(processedText, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                              'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
                              'details', 'summary', 'annotation', 'semantics', 'mtext', 'mn', 'mo', 'mi', 'mspace', 
                              'mover', 'munder', 'munderover', 'msup', 'msub', 'msubsup', 'mfrac', 'mroot', 'msqrt',
                              'mtable', 'mtr', 'mtd', 'mlabeledtr', 'mrow', 'menclose', 'mstyle', 'mpadded', 'mphantom',
                              'mglyph'],
                ALLOWED_ATTR: ['href', 'class', 'id', 'style', 'data-highlighted', 'aria-hidden', 'title', 'mathvariant',
                              'mathsize', 'mathcolor', 'mathbackground', 'displaystyle', 'scriptlevel', 'dir'],
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
        
        // 避免重复渲染相同内容（但允许增量更新）
        const lastContent = element.dataset.lastContent || '';
        if (lastContent === text) {
            return;
        }
        
        // 检查是否是增量更新（新内容包含旧内容）
        const isIncremental = text.startsWith(lastContent) && text.length > lastContent.length;
        
        element.classList.add('rendering');
        
        const renderedContent = this.renderMessage(text, false);
        
        // 对于增量更新，直接更新DOM以提高性能
        if (isIncremental) {
            element.innerHTML = renderedContent;
            
            // 只对新增的代码块进行高亮
            this.highlightNewCodeBlocks(element);
            
            // 添加代码块复制按钮
            this.addCopyButtons(element);
            
            element.classList.remove('rendering');
            element.classList.add('rendered');
            
            // 记录最后渲染的内容
            element.dataset.lastContent = text;
        } else {
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

    // 只高亮新增的代码块
    highlightNewCodeBlocks(element) {
        if (typeof hljs !== 'undefined') {
            const codeBlocks = element.querySelectorAll('pre code:not([data-highlighted])');
            codeBlocks.forEach(block => {
                hljs.highlightElement(block);
            });
        }
    }
}