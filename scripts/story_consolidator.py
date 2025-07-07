#!/usr/bin/env python3
"""
故事整合器 - 将所有LLM生成的故事整合到游戏数据中
"""

import os
import json
from pathlib import Path
from datetime import datetime

class StoryConsolidator:
    def __init__(self):
        self.stories_dir = Path('frontend/src/data/stories')
        self.output_file = Path('frontend/src/data/consolidated-stories.json')
        self.index_file = Path('frontend/src/data/story-index.json')

    def consolidate_all_stories(self):
        """整合所有故事"""
        all_stories = {}
        story_index = {
            'total_stories': 0,
            'by_type': {},
            'last_updated': datetime.now().isoformat(),
            'categories': []
        }

        # 遍历所有故事类型目录
        for story_type_dir in self.stories_dir.iterdir():
            if not story_type_dir.is_dir():
                continue
                
            story_type = story_type_dir.name
            stories = []
            
            # 读取该类型的所有故事
            for story_file in story_type_dir.glob('*.json'):
                try:
                    with open(story_file, 'r', encoding='utf-8') as f:
                        story_data = json.load(f)
                        stories.append(story_data)
                except Exception as e:
                    print(f"读取故事文件失败 {story_file}: {e}")
            
            if stories:
                all_stories[story_type] = stories
                story_index['by_type'][story_type] = len(stories)
                story_index['total_stories'] += len(stories)
                story_index['categories'].append({
                    'type': story_type,
                    'count': len(stories),
                    'description': self.get_type_description(story_type)
                })
                
                print(f"📚 整合 {story_type}: {len(stories)} 个故事")

        # 保存整合后的故事
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(all_stories, f, ensure_ascii=False, indent=2)
        
        # 保存索引
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(story_index, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 整合完成: {story_index['total_stories']} 个故事")
        return story_index

    def get_type_description(self, story_type):
        """获取故事类型描述"""
        descriptions = {
            'main_quest': '主线剧情 - 史诗级的江湖大事',
            'side_quest': '支线任务 - 有趣的小故事和任务',
            'npc_stories': 'NPC故事 - 丰富的角色背景',
            'sect_events': '门派事件 - 门派相关的剧情',
            'romance_plots': '情感剧情 - 江湖儿女情长',
            'mystery_cases': '悬疑案件 - 扑朔迷离的谜团',
            'martial_legends': '武功传说 - 绝世武功的故事',
            'world_events': '世界事件 - 影响江湖的大事件'
        }
        return descriptions.get(story_type, '未知类型')

if __name__ == '__main__':
    consolidator = StoryConsolidator()
    consolidator.consolidate_all_stories()
