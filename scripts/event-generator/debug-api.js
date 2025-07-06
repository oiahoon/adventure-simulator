#!/usr/bin/env node

/**
 * DeepSeek API调试脚本
 * 用于测试API连接和诊断问题
 */

const axios = require('axios');
require('dotenv').config();

async function testAPI() {
    console.log('🔍 开始API调试...');
    console.log('🔑 环境变量检查:');
    console.log('- DEEPSEEK_TOKEN存在:', !!process.env.DEEPSEEK_TOKEN);
    console.log('- TOKEN长度:', process.env.DEEPSEEK_TOKEN ? process.env.DEEPSEEK_TOKEN.length : 0);
    console.log('- TOKEN前缀:', process.env.DEEPSEEK_TOKEN ? process.env.DEEPSEEK_TOKEN.substring(0, 10) + '...' : 'N/A');
    
    if (!process.env.DEEPSEEK_TOKEN) {
        console.error('❌ DEEPSEEK_TOKEN环境变量未设置');
        return;
    }
    
    try {
        console.log('\n🌐 测试网络连接...');
        
        // 简单的测试请求
        const testPayload = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: '请回复"测试成功"'
                }
            ],
            max_tokens: 10
        };
        
        console.log('📤 发送测试请求...');
        console.log('请求URL:', 'https://api.deepseek.com/v1/chat/completions');
        console.log('请求头:', {
            'Authorization': `Bearer ${process.env.DEEPSEEK_TOKEN.substring(0, 10)}...`,
            'Content-Type': 'application/json'
        });
        console.log('请求体:', JSON.stringify(testPayload, null, 2));
        
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            testPayload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('\n✅ API调用成功!');
        console.log('响应状态:', response.status);
        console.log('响应头:', JSON.stringify(response.headers, null, 2));
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
        if (response.data.choices && response.data.choices[0]) {
            console.log('AI回复:', response.data.choices[0].message.content);
        }
        
    } catch (error) {
        console.error('\n❌ API调用失败:');
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        console.error('错误代码:', error.code);
        
        if (error.response) {
            console.error('\n📥 服务器响应:');
            console.error('状态码:', error.response.status);
            console.error('状态文本:', error.response.statusText);
            console.error('响应头:', JSON.stringify(error.response.headers, null, 2));
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('\n📤 请求信息:');
            console.error('请求超时:', error.code === 'ECONNABORTED');
            console.error('网络错误:', error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED');
        }
        
        // 提供解决建议
        console.log('\n💡 可能的解决方案:');
        if (error.response && error.response.status === 401) {
            console.log('- 检查API Token是否正确');
            console.log('- 确认Token没有过期');
        } else if (error.response && error.response.status === 429) {
            console.log('- API调用频率过高，请稍后重试');
            console.log('- 检查账户配额是否用完');
        } else if (error.code === 'ECONNABORTED') {
            console.log('- 网络连接超时，检查网络状况');
            console.log('- 尝试增加超时时间');
        } else if (error.code === 'ENOTFOUND') {
            console.log('- DNS解析失败，检查网络连接');
            console.log('- 确认API地址是否正确');
        }
    }
}

// 运行测试
testAPI().catch(console.error);
