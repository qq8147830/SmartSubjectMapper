#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
知识库整合脚本
功能：从knowledgebase目录提取知识，整合到角色知识库中
"""

import os
import json
from pathlib import Path
from datetime import datetime

class KnowledgeBaseIntegrator:
    """知识库整合器"""
    
    def __init__(self, knowledgebase_dir: str, role_dir: str):
        self.knowledgebase_dir = Path(knowledgebase_dir)
        self.role_dir = Path(role_dir)
        self.knowledge_dir = self.role_dir / 'knowledge'
        self.knowledge_files = []
        
    def scan_knowledgebase(self):
        """扫描knowledgebase目录，生成文件清单"""
        file_list = []
        
        for root, dirs, files in os.walk(self.knowledgebase_dir):
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.knowledgebase_dir)
                
                file_info = {
                    'name': file,
                    'path': str(file_path),
                    'relative_path': str(relative_path),
                    'extension': file_path.suffix.lower(),
                    'size': file_path.stat().st_size,
                    'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                }
                file_list.append(file_info)
        
        return file_list
    
    def generate_knowledge_index(self):
        """生成知识库索引文件"""
        files = self.scan_knowledgebase()
        
        # 按类型分类
        pdf_files = [f for f in files if f['extension'] == '.pdf']
        doc_files = [f for f in files if f['extension'] in ['.doc', '.docx']]
        excel_files = [f for f in files if f['extension'] in ['.xlsx', '.xls']]
        other_files = [f for f in files if f['extension'] not in ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.png', '.jpg']]
        
        index_content = f"""# 教师培训画像知识库索引

## 知识库位置
`{self.knowledgebase_dir}`

## 文件统计
- PDF文件：{len(pdf_files)}个
- Word文档：{len(doc_files)}个
- Excel文件：{len(excel_files)}个
- 其他文件：{len(other_files)}个
- 总计：{len(files)}个文件

## 文件清单

### PDF文件
"""
        for f in pdf_files:
            index_content += f"- **{f['name']}**\n  - 路径：`{f['relative_path']}`\n  - 大小：{f['size']/1024:.1f}KB\n  - 修改时间：{f['modified']}\n\n"
        
        index_content += "\n### Word文档\n"
        for f in doc_files:
            index_content += f"- **{f['name']}**\n  - 路径：`{f['relative_path']}`\n  - 大小：{f['size']/1024:.1f}KB\n  - 修改时间：{f['modified']}\n\n"
        
        index_content += "\n### Excel文件\n"
        for f in excel_files:
            index_content += f"- **{f['name']}**\n  - 路径：`{f['relative_path']}`\n  - 大小：{f['size']/1024:.1f}KB\n  - 修改时间：{f['modified']}\n\n"
        
        index_content += "\n### 其他文件\n"
        for f in other_files:
            index_content += f"- **{f['name']}**\n  - 路径：`{f['relative_path']}`\n  - 大小：{f['size']/1024:.1f}KB\n  - 修改时间：{f['modified']}\n\n"
        
        index_content += f"""
## 知识库更新机制

### 自动检测更新
知识库文件更新后，系统会自动检测以下变化：
1. 新增文件：自动添加到索引
2. 文件修改：更新修改时间和大小
3. 文件删除：从索引中移除

### 文件分类说明

#### 政策文件类
- 教师专业标准（试行）
- 国培计划课程标准
- 新时代基础教育强师计划
- 教师数字素养标准
- 教育评价改革方案

#### 评价指标体系类
- 教师专业发展路径及下级指标体系
- 中小学教师专业发展评价指标体系
- 教情分析表

#### 数据示例类
- 重庆市小学教师培训数据表
- 教师培训数据示例

### 使用说明

当需要查询政策依据、标准规范、评价指标时：
1. 优先查阅对应的政策文件
2. 参考评价指标体系
3. 必要时查看数据示例了解格式要求

## 最后更新时间
{datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}
"""
        
        return index_content
    
    def save_knowledge_index(self):
        """保存知识库索引到角色knowledge目录"""
        index_content = self.generate_knowledge_index()
        index_file = self.knowledge_dir / 'knowledgebase-index.knowledge.md'
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(index_content)
        
        print(f"✓ 知识库索引已保存到：{index_file}")
        return index_file


def main():
    """主函数"""
    # 获取项目根目录
    project_root = Path(__file__).parent
    knowledgebase_dir = project_root / 'knowledgebase'
    role_dir = Path.home() / '.promptx' / 'resource' / 'role' / 'training-profile-assistant'
    
    print("="*60)
    print("知识库整合工具")
    print("="*60)
    print(f"\n知识库目录：{knowledgebase_dir}")
    print(f"角色目录：{role_dir}")
    
    integrator = KnowledgeBaseIntegrator(knowledgebase_dir, role_dir)
    
    # 生成并保存索引
    print("\n正在扫描知识库文件...")
    files = integrator.scan_knowledgebase()
    print(f"✓ 发现 {len(files)} 个文件")
    
    print("\n正在生成知识库索引...")
    integrator.save_knowledge_index()
    
    print("\n" + "="*60)
    print("知识库整合完成！")
    print("="*60)


if __name__ == '__main__':
    main()

