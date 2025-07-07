#!/usr/bin/env python3
"""
LLM剧情生成器 - 核心脚本
基于DeepSeek等LLM生成完整的武侠剧情和故事
"""

import os
import json
import requests
import argparse
import time
from datetime import datetime
from pathlib import Path

class LLMStoryGenerator:
    def __init__(self):
        self.deepseek_token = os.getenv('DEEPSEEK_TOKEN')
        self.base_url = 'https://api.deepseek.com/v1'
        self.output_dir = Path('frontend/src/data/stories')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 故事类型模板
        self.story_templates = {
            'main_quest': self.get_main_quest_template(),
            'side_quest': self.get_side_quest_template(),
            'npc_stories': self.get_npc_story_template(),
            'sect_events': self.get_sect_event_template(),
            'romance_plots': self.get_romance_template(),
            'mystery_cases': self.get_mystery_template(),
            'martial_legends': self.get_martial_legend_template(),
            'world_events': self.get_world_event_template()
        }

    def get_main_quest_template(self):
        return """请为武侠MUD游戏生成一个主线剧情。

【剧情要求】
- 史诗级的主线故事，涉及江湖大事
- 多个章节的完整剧情线
- 重要NPC和反派角色
- 门派政治和江湖恩怨
- 武功秘籍或神兵利器
- 情感线和人物成长

【输出格式】
{
  "title": "剧情标题",
  "type": "main_quest",
  "chapters": [
    {
      "chapter_number": 1,
      "title": "章节标题",
      "description": "详细剧情描述（300-500字）",
      "key_events": ["关键事件1", "关键事件2"],
      "npcs": [{"name": "NPC姓名", "role": "角色作用"}],
      "locations": ["地点1", "地点2"],
      "rewards": {"experience": 500, "items": ["奖励物品"]}
    }
  ],
  "overall_theme": "整体主题",
  "estimated_duration": "预计游戏时长",
  "difficulty_level": "困难等级"
}"""

    def get_side_quest_template(self):
        return """请为武侠MUD游戏生成一个支线任务。

【任务要求】
- 独立完整的小故事
- 有趣的人物和情节
- 适中的挑战难度
- 合理的奖励设置

【输出格式】
{
  "title": "任务标题",
  "type": "side_quest",
  "description": "任务描述（200-300字）",
  "objectives": ["目标1", "目标2"],
  "story_background": "背景故事",
  "npcs": [{"name": "NPC姓名", "personality": "性格特点"}],
  "rewards": {"experience": 100, "wealth": 50, "items": ["物品"]},
  "prerequisites": ["前置条件"],
  "estimated_time": "预计完成时间"
}"""

    def get_npc_story_template(self):
        return """请为武侠MUD游戏生成一个NPC背景故事。

【NPC要求】
- 丰富的个人历史
- 独特的性格特点
- 江湖关系网络
- 个人目标和动机

【输出格式】
{
  "name": "NPC姓名",
  "title": "称号或身份",
  "type": "npc_story",
  "background": "详细背景故事（300-400字）",
  "personality": {
    "traits": ["性格特点"],
    "motivations": ["行为动机"],
    "fears": ["恐惧或弱点"]
  },
  "relationships": {
    "allies": ["盟友"],
    "enemies": ["敌人"],
    "family": ["家人"]
  },
  "abilities": ["特殊能力或技能"],
  "secrets": ["隐藏的秘密"],
  "dialogue_style": "说话风格描述"
}"""

    def generate_story(self, story_type, themes, complexity):
        """生成单个故事"""
        if story_type not in self.story_templates:
            raise ValueError(f"未知的故事类型: {story_type}")
        
        template = self.story_templates[story_type]
        
        # 构建提示词
        prompt = f"""你是一个专业的武侠小说作家和游戏设计师。

【故事类型】{story_type}
【主题】{themes}
【复杂度】{complexity}

{template}

请确保：
1. 符合中国武侠文化传统
2. 情节引人入胜，有深度
3. 人物形象鲜明，有血有肉
4. 对话自然，符合古风
5. JSON格式完全正确"""

        try:
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers={
                    'Authorization': f'Bearer {self.deepseek_token}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'deepseek-chat',
                    'messages': [
                        {'role': 'system', 'content': '你是专业的武侠小说作家和游戏设计师。'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.9,
                    'max_tokens': 4000
                },
                timeout=60
            )
            
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                return self.parse_story_response(content, story_type)
            else:
                print(f"API调用失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"生成故事失败: {e}")
            return None

    def parse_story_response(self, content, story_type):
        """解析LLM响应"""
        try:
            # 提取JSON部分
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("响应中未找到JSON格式")
            
            json_str = content[json_start:json_end]
            story_data = json.loads(json_str)
            
            # 添加元数据
            story_data['id'] = f"{story_type}_{int(time.time())}_{hash(content) % 10000}"
            story_data['generated_at'] = datetime.now().isoformat()
            story_data['source'] = 'DeepSeek LLM'
            
            return story_data
            
        except Exception as e:
            print(f"解析故事响应失败: {e}")
            return None

    def save_story(self, story_data, story_type):
        """保存故事到文件"""
        if not story_data:
            return False
        
        # 创建类型目录
        type_dir = self.output_dir / story_type
        type_dir.mkdir(exist_ok=True)
        
        # 保存JSON文件
        filename = f"{story_data['id']}.json"
        filepath = type_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(story_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 保存故事: {filepath}")
        return True

    def generate_stories_batch(self, story_type, count, themes, complexity):
        """批量生成故事"""
        print(f"🎭 开始生成 {count} 个 {story_type} 故事...")
        
        generated_count = 0
        for i in range(count):
            print(f"📝 生成第 {i+1}/{count} 个故事...")
            
            story = self.generate_story(story_type, themes, complexity)
            if story and self.save_story(story, story_type):
                generated_count += 1
            
            # 避免API限制
            time.sleep(2)
        
        print(f"🎉 成功生成 {generated_count}/{count} 个故事")
        return generated_count

def main():
    parser = argparse.ArgumentParser(description='LLM剧情生成器')
    parser.add_argument('--story-type', required=True, help='故事类型')
    parser.add_argument('--count', type=int, default=10, help='生成数量')
    parser.add_argument('--complexity', default='medium', help='复杂度')
    parser.add_argument('--themes', default='martial_arts', help='主题')
    
    args = parser.parse_args()
    
    generator = LLMStoryGenerator()
    generator.generate_stories_batch(
        args.story_type,
        args.count,
        args.themes,
        args.complexity
    )

if __name__ == '__main__':
    main()
