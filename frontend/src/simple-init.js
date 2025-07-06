/**
 * 简化的初始化脚本
 * 用于调试和基本功能测试
 */

console.log('🔧 简化初始化脚本开始');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成');
    
    // 基本的新游戏按钮功能
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        console.log('✅ 找到新游戏按钮');
        
        newGameBtn.addEventListener('click', function() {
            console.log('🎮 新游戏按钮被点击');
            
            const modal = document.getElementById('character-creation');
            if (modal) {
                console.log('✅ 找到角色创建模态框');
                modal.classList.remove('hidden');
                console.log('✅ 模态框已显示');
                
                // 添加基本的关闭功能
                setupModalClose();
            } else {
                console.error('❌ 找不到角色创建模态框');
            }
        });
        
        console.log('✅ 新游戏按钮事件绑定成功');
    } else {
        console.error('❌ 找不到新游戏按钮');
    }
    
    console.log('🔧 简化初始化完成');
});

// 设置模态框关闭功能
function setupModalClose() {
    const modal = document.getElementById('character-creation');
    if (!modal) return;
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
            console.log('📱 点击外部关闭模态框');
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            console.log('⌨️ ESC键关闭模态框');
        }
    });
    
    // 添加关闭按钮（如果不存在）
    if (!modal.querySelector('.close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            z-index: 1001;
        `;
        
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
            console.log('🔘 关闭按钮关闭模态框');
        });
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.position = 'relative';
            modalContent.appendChild(closeBtn);
        }
    }
}

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('🚨 全局错误:', e.error);
    console.error('文件:', e.filename);
    console.error('行号:', e.lineno);
    console.error('列号:', e.colno);
});

console.log('🔧 简化初始化脚本加载完成');
