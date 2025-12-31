#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
培训画像报告1.0 - 数据处理脚本
功能：数据采集、清洗、校验、培训记录智能标注
"""

import csv
import json
import re
from datetime import datetime
from collections import Counter, defaultdict

class TrainingProfileDataProcessor:
    """培训画像数据处理类"""
    
    def __init__(self):
        self.teacher_data = []
        self.training_data = []
        self.annotated_training_data = []
        self.data_errors = []
        self.data_corrections = []
        
    def load_teacher_data(self, filepath):
        """加载教师数据"""
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:  # 使用utf-8-sig自动处理BOM
                reader = csv.DictReader(f)
                for row_num, row in enumerate(reader, start=2):  # 从第2行开始（第1行是表头）
                    # 跳过空行
                    if not any(row.values()):
                        continue
                    
                    # 数据清洗：教龄转换为数字
                    age_text = str(row.get('教龄', '')).strip()
                    if age_text:
                        try:
                            row['教龄'] = int(age_text)
                        except:
                            # 处理文本格式的教龄
                            age_map = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, 
                                      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}
                            if age_text in age_map:
                                row['教龄'] = age_map[age_text]
                                self.data_corrections.append({
                                    'type': '数据格式校正',
                                    'field': '教龄',
                                    'original': age_text,
                                    'corrected': age_map[age_text],
                                    'teacher_id': row.get('教师ID', ''),
                                    'row': row_num
                                })
                            else:
                                # 提取数字
                                numbers = re.findall(r'\d+', age_text)
                                if numbers:
                                    row['教龄'] = int(numbers[0])
                                    self.data_corrections.append({
                                        'type': '数据格式校正',
                                        'field': '教龄',
                                        'original': age_text,
                                        'corrected': int(numbers[0]),
                                        'teacher_id': row.get('教师ID', ''),
                                        'row': row_num
                                    })
                                else:
                                    self.data_errors.append({
                                        'type': '数据格式错误',
                                        'field': '教龄',
                                        'value': age_text,
                                        'teacher_id': row.get('教师ID', ''),
                                        'row': row_num,
                                        'message': f"教龄字段格式错误：{age_text}"
                                    })
                                    continue
                    else:
                        self.data_errors.append({
                            'type': '必填字段缺失',
                            'field': '教龄',
                            'value': '',
                            'teacher_id': row.get('教师ID', ''),
                            'row': row_num,
                            'message': "教龄字段为空"
                        })
                        continue
                    
                    # 校验必填字段
                    required_fields = ['教师ID', '姓名', '教龄', '所在地区', '所在学校', '任教学科', '职务']
                    missing_fields = []
                    for f in required_fields:
                        val = row.get(f)
                        if not val or (isinstance(val, str) and val.strip() == ''):
                            missing_fields.append(f)
                    if missing_fields:
                        self.data_errors.append({
                            'type': '必填字段缺失',
                            'fields': missing_fields,
                            'teacher_id': row.get('教师ID', ''),
                            'row': row_num,
                            'message': f"必填字段缺失：{', '.join(missing_fields)}"
                        })
                        continue
                    
                    self.teacher_data.append(row)
            
            print(f"✓ 成功加载 {len(self.teacher_data)} 条教师数据")
            if self.data_errors:
                print(f"  ⚠ 发现 {len([e for e in self.data_errors if '教师' in e.get('message', '')])} 条教师数据错误")
            return True
        except Exception as e:
            print(f"✗ 加载教师数据失败：{e}")
            import traceback
            traceback.print_exc()
            return False
    
    def load_training_data(self, filepath):
        """加载培训记录数据"""
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:  # 使用utf-8-sig自动处理BOM
                reader = csv.DictReader(f)
                for row_num, row in enumerate(reader, start=2):  # 从第2行开始（第1行是表头）
                    # 跳过空行
                    if not any(row.values()):
                        continue
                    
                    # 数据清洗：学时转换为数字
                    hours_text = str(row.get('学时', '')).strip()
                    if hours_text:
                        try:
                            row['学时'] = float(hours_text)
                        except:
                            self.data_errors.append({
                                'type': '数据格式错误',
                                'field': '学时',
                                'value': hours_text,
                                'training_id': row.get('培训记录ID', ''),
                                'row': row_num,
                                'message': f"学时格式错误：{hours_text}"
                            })
                            continue
                    else:
                        self.data_errors.append({
                            'type': '必填字段缺失',
                            'field': '学时',
                            'value': '',
                            'training_id': row.get('培训记录ID', ''),
                            'row': row_num,
                            'message': "学时字段为空"
                        })
                        continue
                    
                    # 数据清洗：培训完成时间格式标准化
                    date_str = str(row.get('培训完成时间', '')).strip()
                    if date_str:
                        try:
                            # 尝试解析日期
                            if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                                dt = datetime.strptime(date_str, '%Y-%m-%d')
                                row['完成时间（标准格式）'] = f"{dt.year}年{dt.month:02d}月"
                            elif re.match(r'\d{4}\.\d{1,2}', date_str):
                                # 处理 2025.2 格式
                                year, month = date_str.split('.')
                                row['完成时间（标准格式）'] = f"{year}年{int(month):02d}月"
                                self.data_corrections.append({
                                    'type': '数据格式校正',
                                    'field': '培训完成时间',
                                    'original': date_str,
                                    'corrected': row['完成时间（标准格式）'],
                                    'training_id': row.get('培训记录ID', ''),
                                    'row': row_num
                                })
                            else:
                                # 尝试提取年月
                                year_match = re.search(r'(\d{4})', date_str)
                                month_match = re.search(r'(\d{1,2})', date_str.split('年')[-1] if '年' in date_str else date_str)
                                if year_match:
                                    year = year_match.group(1)
                                    month = month_match.group(1) if month_match else '1'
                                    row['完成时间（标准格式）'] = f"{year}年{int(month):02d}月"
                                    if date_str != row['完成时间（标准格式）']:
                                        self.data_corrections.append({
                                            'type': '数据格式校正',
                                            'field': '培训完成时间',
                                            'original': date_str,
                                            'corrected': row['完成时间（标准格式）'],
                                            'training_id': row.get('培训记录ID', ''),
                                            'row': row_num
                                        })
                                else:
                                    self.data_errors.append({
                                        'type': '数据格式错误',
                                        'field': '培训完成时间',
                                        'value': date_str,
                                        'training_id': row.get('培训记录ID', ''),
                                        'row': row_num,
                                        'message': f"培训完成时间格式错误：{date_str}"
                                    })
                                    continue
                        except Exception as e:
                            self.data_errors.append({
                                'type': '数据格式错误',
                                'field': '培训完成时间',
                                'value': date_str,
                                'training_id': row.get('培训记录ID', ''),
                                'row': row_num,
                                'message': f"培训完成时间解析失败：{e}"
                            })
                            continue
                    else:
                        self.data_errors.append({
                            'type': '必填字段缺失',
                            'field': '培训完成时间',
                            'value': '',
                            'training_id': row.get('培训记录ID', ''),
                            'row': row_num,
                            'message': "培训完成时间字段为空"
                        })
                        continue
                    
                    # 校验必填字段
                    required_fields = ['培训记录ID', '培训项目名称', '培训类型', '培训完成时间', '学时']
                    missing_fields = []
                    for f in required_fields:
                        val = row.get(f)
                        if not val or (isinstance(val, str) and str(val).strip() == ''):
                            missing_fields.append(f)
                    if missing_fields:
                        self.data_errors.append({
                            'type': '必填字段缺失',
                            'fields': missing_fields,
                            'training_id': row.get('培训记录ID', ''),
                            'row': row_num,
                            'message': f"必填字段缺失：{', '.join(missing_fields)}"
                        })
                        continue
                    
                    self.training_data.append(row)
            
            print(f"✓ 成功加载 {len(self.training_data)} 条培训记录数据")
            if self.data_errors:
                print(f"  ⚠ 发现 {len([e for e in self.data_errors if '培训' in e.get('message', '')])} 条培训记录数据错误")
            return True
        except Exception as e:
            print(f"✗ 加载培训记录数据失败：{e}")
            import traceback
            traceback.print_exc()
            return False
    
    def annotate_training_records(self):
        """培训记录智能标注（基于5.0-2提示词）"""
        print("\n开始培训记录智能标注...")
        
        # 培训类型到层级的映射
        level_mapping = {
            '国培': '国家级培训（国培）',
            '省培': '省级培训（省培）',
            '市县培': '市级培训（市培）',
            '校本研修': '校级培训（校培）',
            '其它': '其它'
        }
        
        # 专业维度标注规则（基于《教师专业标准（试行）》）
        dimension_keywords = {
            '专业理念与师德': {
                '师德修养': ['师德', '师风', '职业道德', '行为规范', '警示', '情怀', '关爱学生', '师生关系'],
                '专业理念': ['教育理念', '素质教育', '核心价值观', '教育情怀', '教育观']
            },
            '专业知识': {
                '学科知识': ['学科', '核心考点', '课程标准', '教材', '知识体系', '跨学科'],
                '学生发展知识': ['学生发展', '认知发展', '心理发展', '语言发展', '学习困难', '学习习惯', '衔接']
            },
            '专业能力': {
                '教学设计': ['教学设计', '教学策略', '课程设计', '教学创新', '核心素养', '作业设计'],
                '教学实施': ['课堂实施', '教学实施', '课堂教学', '教学技巧'],
                '教学评价': ['教学评价', '评价改革', '反馈技巧'],
                '班级管理与学生指导': ['班级管理', '学生辅导', '心理健康', '特殊学生', '家校共育', '沟通技巧', '班主任'],
                '教育研究能力': ['教育科研', '论文写作', '研究方法', '课题研究'],
                '课程开发能力': ['课程开发', '校本课程', '资源开发']
            },
            '数字素养': {
                '教育技术应用能力': ['信息技术', '教育技术', 'STEM', '智慧课堂', '数字化', '在线教学', '平台使用']
            }
        }
        
        for record in self.training_data:
            annotated = record.copy()
            
            # 标注培训层级类型
            training_type = record.get('培训类型', '')
            annotated['培训层级类型'] = level_mapping.get(training_type, '其它')
            
            # 智能标注专业维度
            project_name = record.get('培训项目名称', '')
            annotated['一级维度'] = ''
            annotated['二级维度'] = ''
            annotated['三级维度'] = ''
            annotated['备注'] = ''
            
            # 匹配专业维度
            matched_dimensions = []
            for dim1, dim2_dict in dimension_keywords.items():
                for dim2, keywords in dim2_dict.items():
                    score = 0
                    for keyword in keywords:
                        if keyword in project_name:
                            score += 1
                    if score > 0:
                        matched_dimensions.append({
                            'dim1': dim1,
                            'dim2': dim2,
                            'score': score
                        })
            
            if matched_dimensions:
                # 选择得分最高的维度
                best_match = max(matched_dimensions, key=lambda x: x['score'])
                annotated['一级维度'] = best_match['dim1']
                annotated['二级维度'] = f"{best_match['dim1']}-{best_match['dim2']}"
                
                # 如果有多个匹配，在备注中说明
                if len(matched_dimensions) > 1:
                    other_dims = [f"{m['dim1']}-{m['dim2']}" for m in matched_dimensions if m != best_match]
                    annotated['备注'] = f"关联维度：{', '.join(other_dims[:2])}"
            else:
                # 无法匹配时，根据培训类型推断
                if '师德' in project_name or '师风' in project_name:
                    annotated['一级维度'] = '专业理念与师德'
                    annotated['二级维度'] = '专业理念与师德-师德修养'
                elif '科研' in project_name or '论文' in project_name:
                    annotated['一级维度'] = '专业能力'
                    annotated['二级维度'] = '专业能力-教育研究能力'
                elif '信息' in project_name or '技术' in project_name or 'STEM' in project_name:
                    annotated['一级维度'] = '数字素养'
                    annotated['二级维度'] = '数字素养-教育技术应用能力'
                else:
                    annotated['一级维度'] = '专业能力'
                    annotated['二级维度'] = '专业能力-教学设计'
                    annotated['备注'] = '根据培训名称推断，建议人工复核'
            
            self.annotated_training_data.append(annotated)
        
        print(f"✓ 完成 {len(self.annotated_training_data)} 条培训记录的智能标注")
    
    def save_annotated_data(self, filepath):
        """保存已标注的培训记录数据"""
        if not self.annotated_training_data:
            print("✗ 没有已标注的数据可保存")
            return False
        
        fieldnames = ['培训记录ID', '培训项目名称', '培训类型', '培训完成时间', '学时', 
                     '一级维度', '二级维度', '三级维度', '培训层级类型', '完成时间（标准格式）', '备注']
        
        try:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for record in self.annotated_training_data:
                    writer.writerow(record)
            print(f"✓ 已保存标注数据到 {filepath}")
            return True
        except Exception as e:
            print(f"✗ 保存标注数据失败：{e}")
            return False
    
    def generate_data_report(self, filepath):
        """生成数据采集报告"""
        report = {
            '生成时间': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            '数据统计': {
                '教师数据总数': len(self.teacher_data),
                '培训记录总数': len(self.training_data),
                '已标注培训记录数': len(self.annotated_training_data)
            },
            '数据错误': self.data_errors,
            '数据校正': self.data_corrections,
            '数据质量': {
                '教师数据完整率': f"{(len(self.teacher_data) / max(len(self.teacher_data), 1) * 100):.2f}%",
                '培训记录完整率': f"{(len(self.training_data) / max(len(self.training_data), 1) * 100):.2f}%",
                '标注完成率': f"{(len(self.annotated_training_data) / max(len(self.training_data), 1) * 100):.2f}%"
            }
        }
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            print(f"✓ 已生成数据采集报告到 {filepath}")
            return True
        except Exception as e:
            print(f"✗ 生成数据采集报告失败：{e}")
            return False
    
    def generate_markdown_report(self, filepath):
        """生成Markdown格式的数据采集报告"""
        md_content = f"""# 数据采集报告1.0

## 生成时间
{datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}

## 数据统计

### 教师数据
- **总数**: {len(self.teacher_data)} 条
- **完整率**: {(len(self.teacher_data) / max(len(self.teacher_data), 1) * 100):.2f}%

### 培训记录数据
- **总数**: {len(self.training_data)} 条
- **已标注数**: {len(self.annotated_training_data)} 条
- **标注完成率**: {(len(self.annotated_training_data) / max(len(self.training_data), 1) * 100):.2f}%

## 数据错误清单

"""
        if self.data_errors:
            md_content += f"共发现 {len(self.data_errors)} 条数据错误：\n\n"
            for i, error in enumerate(self.data_errors[:20], 1):  # 只显示前20条
                md_content += f"### 错误 {i}\n"
                md_content += f"- **类型**: {error.get('type', '未知')}\n"
                md_content += f"- **字段**: {error.get('field', error.get('fields', '未知'))}\n"
                md_content += f"- **值**: {error.get('value', '')}\n"
                md_content += f"- **消息**: {error.get('message', '')}\n\n"
            if len(self.data_errors) > 20:
                md_content += f"\n*（还有 {len(self.data_errors) - 20} 条错误未显示）*\n\n"
        else:
            md_content += "✓ 未发现数据错误\n\n"
        
        md_content += "## 数据校正记录\n\n"
        if self.data_corrections:
            md_content += f"共进行 {len(self.data_corrections)} 次数据校正：\n\n"
            for i, correction in enumerate(self.data_corrections[:20], 1):  # 只显示前20条
                md_content += f"### 校正 {i}\n"
                md_content += f"- **类型**: {correction.get('type', '未知')}\n"
                md_content += f"- **字段**: {correction.get('field', '未知')}\n"
                md_content += f"- **原始值**: {correction.get('original', '')}\n"
                md_content += f"- **校正值**: {correction.get('corrected', '')}\n\n"
            if len(self.data_corrections) > 20:
                md_content += f"\n*（还有 {len(self.data_corrections) - 20} 条校正未显示）*\n\n"
        else:
            md_content += "✓ 无需数据校正\n\n"
        
        md_content += "## 数据质量评估\n\n"
        md_content += f"- **教师数据完整率**: {(len(self.teacher_data) / max(len(self.teacher_data), 1) * 100):.2f}%\n"
        md_content += f"- **培训记录完整率**: {(len(self.training_data) / max(len(self.training_data), 1) * 100):.2f}%\n"
        md_content += f"- **标注完成率**: {(len(self.annotated_training_data) / max(len(self.training_data), 1) * 100):.2f}%\n"
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(md_content)
            print(f"✓ 已生成Markdown报告到 {filepath}")
            return True
        except Exception as e:
            print(f"✗ 生成Markdown报告失败：{e}")
            return False

def main():
    """主函数"""
    print("=" * 60)
    print("培训画像报告1.0 - 数据处理")
    print("=" * 60)
    
    processor = TrainingProfileDataProcessor()
    
    # 加载数据
    print("\n[1/5] 加载教师数据...")
    processor.load_teacher_data('教师数据1.0.csv')
    
    print("\n[2/5] 加载培训记录数据...")
    processor.load_training_data('培训记录数据1.0.csv')
    
    # 培训记录智能标注
    print("\n[3/5] 培训记录智能标注...")
    processor.annotate_training_records()
    
    # 保存已标注数据
    print("\n[4/5] 保存已标注数据...")
    processor.save_annotated_data('培训记录数据_已标注1.0.csv')
    
    # 生成报告
    print("\n[5/5] 生成数据采集报告...")
    processor.generate_data_report('数据采集报告1.0.json')
    processor.generate_markdown_report('数据采集报告1.0.md')
    
    print("\n" + "=" * 60)
    print("数据处理完成！")
    print("=" * 60)
    print(f"\n生成文件：")
    print(f"  - 培训记录数据_已标注1.0.csv")
    print(f"  - 数据采集报告1.0.json")
    print(f"  - 数据采集报告1.0.md")
    print(f"\n数据统计：")
    print(f"  - 教师数据: {len(processor.teacher_data)} 条")
    print(f"  - 培训记录: {len(processor.training_data)} 条")
    print(f"  - 已标注记录: {len(processor.annotated_training_data)} 条")
    print(f"  - 数据错误: {len(processor.data_errors)} 条")
    print(f"  - 数据校正: {len(processor.data_corrections)} 条")

if __name__ == '__main__':
    main()
