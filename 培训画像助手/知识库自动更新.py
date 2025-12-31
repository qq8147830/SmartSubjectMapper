#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
知识库自动更新脚本
功能：监控knowledgebase目录，自动检测文件更新并更新索引
"""

import os
import json
from pathlib import Path
from datetime import datetime
import hashlib

class KnowledgeBaseAutoUpdater:
    """知识库自动更新器"""
    
    def __init__(self, knowledgebase_dir: str, role_dir: str, state_file: str = '.knowledgebase_state.json'):
        self.knowledgebase_dir = Path(knowledgebase_dir)
        self.role_dir = Path(role_dir)
        self.knowledge_dir = self.role_dir / 'knowledge'
        self.state_file = Path(state_file)
        self.current_state = {}
        self.previous_state = {}
        
    def load_state(self):
        """加载上次的文件状态"""
        if self.state_file.exists():
            with open(self.state_file, 'r', encoding='utf-8') as f:
                self.previous_state = json.load(f)
        else:
            self.previous_state = {}
    
    def save_state(self):
        """保存当前文件状态"""
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.current_state, f, ensure_ascii=False, indent=2)
    
    def get_file_hash(self, file_path: Path) -> str:
        """计算文件哈希值"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except:
            return ''
    
    def scan_files(self):
        """扫描所有文件并生成状态"""
        state = {}
        
        for root, dirs, files in os.walk(self.knowledgebase_dir):
            for file in files:
                # 跳过系统文件
                if file.startswith('.') or file == 'Thumbs.db':
                    continue
                    
                file_path = Path(root) / file
                relative_path = str(file_path.relative_to(self.knowledgebase_dir))
                
                try:
                    stat = file_path.stat()
                    state[relative_path] = {
                        'path': str(file_path),
                        'size': stat.st_size,
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'hash': self.get_file_hash(file_path)
                    }
                except Exception as e:
                    print(f"⚠️ 无法读取文件 {relative_path}: {e}")
        
        return state
    
    def detect_changes(self):
        """检测文件变化"""
        changes = {
            'added': [],
            'modified': [],
            'deleted': []
        }
        
        # 检测新增和修改
        for path, info in self.current_state.items():
            if path not in self.previous_state:
                changes['added'].append(path)
            elif self.previous_state[path].get('hash') != info['hash']:
                changes['modified'].append(path)
        
        # 检测删除
        for path in self.previous_state:
            if path not in self.current_state:
                changes['deleted'].append(path)
        
        return changes
    
    def update_index(self):
        """更新知识库索引"""
        from 知识库整合 import KnowledgeBaseIntegrator
        
        integrator = KnowledgeBaseIntegrator(
            str(self.knowledgebase_dir),
            str(self.role_dir)
        )
        integrator.save_knowledge_index()
    
    def run(self):
        """执行自动更新"""
        print("="*60)
        print("知识库自动更新检测")
        print("="*60)
        
        # 加载上次状态
        self.load_state()
        print(f"✓ 已加载上次状态（{len(self.previous_state)}个文件）")
        
        # 扫描当前文件
        print("\n正在扫描知识库文件...")
        self.current_state = self.scan_files()
        print(f"✓ 当前文件数：{len(self.current_state)}")
        
        # 检测变化
        changes = self.detect_changes()
        
        if not any(changes.values()):
            print("\n✓ 知识库无变化，无需更新")
            return False
        
        # 显示变化
        print("\n检测到文件变化：")
        if changes['added']:
            print(f"  + 新增文件：{len(changes['added'])}个")
            for path in changes['added'][:5]:  # 只显示前5个
                print(f"    - {path}")
            if len(changes['added']) > 5:
                print(f"    ... 还有 {len(changes['added']) - 5} 个文件")
        
        if changes['modified']:
            print(f"  ~ 修改文件：{len(changes['modified'])}个")
            for path in changes['modified'][:5]:
                print(f"    - {path}")
            if len(changes['modified']) > 5:
                print(f"    ... 还有 {len(changes['modified']) - 5} 个文件")
        
        if changes['deleted']:
            print(f"  - 删除文件：{len(changes['deleted'])}个")
            for path in changes['deleted']:
                print(f"    - {path}")
        
        # 更新索引
        print("\n正在更新知识库索引...")
        self.update_index()
        
        # 保存新状态
        self.save_state()
        print(f"✓ 状态已保存到：{self.state_file}")
        
        print("\n" + "="*60)
        print("知识库自动更新完成！")
        print("="*60)
        
        return True


def main():
    """主函数"""
    project_root = Path(__file__).parent
    knowledgebase_dir = project_root / 'knowledgebase'
    role_dir = Path.home() / '.promptx' / 'resource' / 'role' / 'training-profile-assistant'
    state_file = project_root / '.knowledgebase_state.json'
    
    updater = KnowledgeBaseAutoUpdater(
        str(knowledgebase_dir),
        str(role_dir),
        str(state_file)
    )
    
    updater.run()


if __name__ == '__main__':
    main()

