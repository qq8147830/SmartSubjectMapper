#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
培训画像助手 - 数据处理模块
功能：数据校验、清洗、智能标注、异常检测
"""

import pandas as pd
import re
from datetime import datetime
from typing import Dict, List, Tuple, Any
import json

class TrainingProfileProcessor:
    """培训画像数据处理器"""
    
    def __init__(self):
        self.teacher_data = None
        self.training_data = None
        self.exceptions = []
        self.corrections = []
        
        # 培训层级类型映射
        self.training_level_map = {
            '国培': '国家级培训（国培）',
            '省培': '省级培训（省培）',
            '市县培': '市级培训（市培）',
            '校本研修': '校级培训（校培）',
            '其它': '其它'
        }
        
        # 专业维度映射（基于培训项目名称的语义匹配）
        self.dimension_keywords = {
            '专业理念与师德': ['师德', '师风', '理念', '职业道德', '教育法规'],
            '专业知识': ['学科', '核心考点', '知识', '课程标准'],
            '专业能力': ['教学设计', '教学创新', '课堂教学', '教学策略', '作业设计', 
                       '评价', '班级管理', '班主任', '学生辅导', '特殊学生', '家校共育'],
            '数字素养': ['信息技术', '智慧课堂', 'STEM', '数字化', '在线教学', '数据驱动']
        }
        
    def load_data(self, teacher_file: str, training_file: str):
        """加载数据文件"""
        try:
            self.teacher_data = pd.read_csv(teacher_file, encoding='utf-8')
            self.training_data = pd.read_csv(training_file, encoding='utf-8')
            print(f"✓ 成功加载教师数据：{len(self.teacher_data)}条")
            print(f"✓ 成功加载培训记录数据：{len(self.training_data)}条")
            return True
        except Exception as e:
            self.exceptions.append({
                'type': '文件格式不支持',
                'location': f'文件加载',
                'message': f'加载文件失败：{str(e)}',
                'solution': '请确保文件格式为CSV/Excel，编码为UTF-8'
            })
            return False
    
    def validate_teacher_data(self) -> List[Dict]:
        """校验教师数据"""
        exceptions = []
        
        # 必填字段检查
        required_fields = ['教师ID', '姓名', '教龄', '所在地区', '所在学校', '任教学科', '职务']
        for field in required_fields:
            if field not in self.teacher_data.columns:
                exceptions.append({
                    'type': '必填字段缺失',
                    'location': f'教师数据-字段"{field}"',
                    'message': f'必填字段"{field}"不存在',
                    'solution': f'请在CSV文件中添加"{field}"列'
                })
            elif self.teacher_data[field].isna().any():
                missing_count = self.teacher_data[field].isna().sum()
                exceptions.append({
                    'type': '必填字段缺失',
                    'location': f'教师数据-字段"{field}"',
                    'message': f'字段"{field}"有{missing_count}条记录为空',
                    'solution': f'请补充"{field}"字段的缺失数据'
                })
        
        # 教龄格式检查
        if '教龄' in self.teacher_data.columns:
            invalid_age = self.teacher_data[~self.teacher_data['教龄'].astype(str).str.match(r'^\d+$', na=False)]
            if len(invalid_age) > 0:
                for idx, row in invalid_age.iterrows():
                    old_value = row['教龄']
                    # 尝试自动校正
                    corrected = self._correct_age_format(old_value)
                    if corrected is not None:
                        self.corrections.append({
                            'table': '教师数据',
                            'field': '教龄',
                            'row': idx + 2,  # +2因为CSV有表头
                            'old_value': str(old_value),
                            'new_value': str(corrected),
                            'reason': '格式自动校正'
                        })
                        self.teacher_data.at[idx, '教龄'] = corrected
                    else:
                        exceptions.append({
                            'type': '数据格式错误',
                            'location': f'教师数据-第{idx+2}行-字段"教龄"',
                            'message': f'教龄值"{old_value}"格式不符合要求（要求：数字）',
                            'solution': '请将教龄修改为数字格式，如"4"'
                        })
        
        return exceptions
    
    def validate_training_data(self) -> List[Dict]:
        """校验培训记录数据"""
        exceptions = []
        
        # 必填字段检查
        required_fields = ['培训记录ID', '培训项目名称', '培训类型', '培训完成时间', '学时']
        for field in required_fields:
            if field not in self.training_data.columns:
                exceptions.append({
                    'type': '必填字段缺失',
                    'location': f'培训记录数据-字段"{field}"',
                    'message': f'必填字段"{field}"不存在',
                    'solution': f'请在CSV文件中添加"{field}"列'
                })
            elif self.training_data[field].isna().any():
                missing_count = self.training_data[field].isna().sum()
                exceptions.append({
                    'type': '必填字段缺失',
                    'location': f'培训记录数据-字段"{field}"',
                    'message': f'字段"{field}"有{missing_count}条记录为空',
                    'solution': f'请补充"{field}"字段的缺失数据'
                })
        
        # 培训完成时间格式检查
        if '培训完成时间' in self.training_data.columns:
            for idx, row in self.training_data.iterrows():
                time_str = str(row['培训完成时间'])
                # 检查是否为YYYY-MM-DD格式
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', time_str):
                    exceptions.append({
                        'type': '数据格式错误',
                        'location': f'培训记录数据-第{idx+2}行-字段"培训完成时间"',
                        'message': f'时间值"{time_str}"格式不符合要求（要求：YYYY-MM-DD）',
                        'solution': '请将时间修改为YYYY-MM-DD格式，如"2025-01-15"'
                    })
        
        # 学时格式检查
        if '学时' in self.training_data.columns:
            for idx, row in self.training_data.iterrows():
                credit = row['学时']
                try:
                    credit_float = float(credit)
                    if credit_float < 0:
                        exceptions.append({
                            'type': '数据范围异常',
                            'location': f'培训记录数据-第{idx+2}行-字段"学时"',
                            'message': f'学时值"{credit}"为负数',
                            'solution': '学时必须为非负数，请修正'
                        })
                    elif credit_float > 0 and credit_float < 0.5:
                        exceptions.append({
                            'type': '数据范围异常',
                            'location': f'培训记录数据-第{idx+2}行-字段"学时"',
                            'message': f'学时值"{credit}"小于最小单位0.5学时',
                            'solution': '学时最小单位为0.5，请修正'
                        })
                except (ValueError, TypeError):
                    exceptions.append({
                        'type': '数据格式错误',
                        'location': f'培训记录数据-第{idx+2}行-字段"学时"',
                        'message': f'学时值"{credit}"格式不符合要求（要求：数字）',
                        'solution': '请将学时修改为数字格式'
                    })
        
        # 培训类型检查
        if '培训类型' in self.training_data.columns:
            valid_types = ['国培', '省培', '市县培', '校本研修', '其它']
            invalid_types = self.training_data[~self.training_data['培训类型'].isin(valid_types)]
            if len(invalid_types) > 0:
                for idx, row in invalid_types.iterrows():
                    exceptions.append({
                        'type': '知识库关联失败',
                        'location': f'培训记录数据-第{idx+2}行-字段"培训类型"',
                        'message': f'培训类型"{row["培训类型"]}"未匹配到标准选项',
                        'solution': f'标准选项：{", ".join(valid_types)}，请选择标准选项'
                    })
        
        return exceptions
    
    def _correct_age_format(self, value: Any) -> int:
        """自动校正教龄格式"""
        if pd.isna(value):
            return None
        
        value_str = str(value).strip()
        
        # 数字格式
        if re.match(r'^\d+$', value_str):
            return int(value_str)
        
        # 中文数字转阿拉伯数字
        chinese_to_arabic = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
            '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
            '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5,
            '陆': 6, '柒': 7, '捌': 8, '玖': 9, '拾': 10
        }
        
        # 提取数字部分
        match = re.search(r'(\d+|[' + ''.join(chinese_to_arabic.keys()) + ']+)', value_str)
        if match:
            num_str = match.group(1)
            if num_str.isdigit():
                return int(num_str)
            elif num_str in chinese_to_arabic:
                return chinese_to_arabic[num_str]
        
        # 提取括号中的数字
        bracket_match = re.search(r'\((\d+)\)', value_str)
        if bracket_match:
            return int(bracket_match.group(1))
        
        return None
    
    def annotate_training_records(self) -> pd.DataFrame:
        """对培训记录进行智能标注"""
        annotated_data = self.training_data.copy()
        
        # 添加标注字段
        annotated_data['一级维度'] = ''
        annotated_data['二级维度'] = ''
        annotated_data['三级维度'] = ''
        annotated_data['培训层级类型'] = ''
        annotated_data['完成时间（标准格式）'] = ''
        annotated_data['备注'] = ''
        
        for idx, row in annotated_data.iterrows():
            project_name = str(row['培训项目名称'])
            training_type = str(row['培训类型'])
            training_time = str(row['培训完成时间'])
            
            # 1. 标注培训层级类型
            if training_type in self.training_level_map:
                annotated_data.at[idx, '培训层级类型'] = self.training_level_map[training_type]
            else:
                annotated_data.at[idx, '培训层级类型'] = training_type
            
            # 2. 转换时间格式为"YYYY年MM月"
            try:
                if re.match(r'^\d{4}-\d{2}-\d{2}$', training_time):
                    dt = datetime.strptime(training_time, '%Y-%m-%d')
                    annotated_data.at[idx, '完成时间（标准格式）'] = f"{dt.year}年{dt.month:02d}月"
                else:
                    annotated_data.at[idx, '完成时间（标准格式）'] = training_time
            except:
                annotated_data.at[idx, '完成时间（标准格式）'] = training_time
            
            # 3. 维度标注（基于培训项目名称的语义匹配）
            dimensions = self._match_dimensions(project_name)
            if dimensions:
                annotated_data.at[idx, '一级维度'] = dimensions['primary']
                annotated_data.at[idx, '二级维度'] = dimensions.get('secondary', '')
                annotated_data.at[idx, '三级维度'] = dimensions.get('tertiary', '')
                if dimensions.get('related'):
                    annotated_data.at[idx, '备注'] = f"关联维度：{dimensions['related']}"
        
        return annotated_data
    
    def _match_dimensions(self, project_name: str) -> Dict[str, str]:
        """匹配培训项目的专业维度"""
        project_name_lower = project_name.lower()
        
        # 优先级匹配
        if any(kw in project_name for kw in ['师德', '师风', '职业道德']):
            return {
                'primary': '专业理念与师德',
                'secondary': '专业理念与师德-师德修养',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['信息技术', '智慧课堂', 'STEM', '数字化', '在线教学']):
            return {
                'primary': '数字素养',
                'secondary': '数字素养-教育技术应用能力',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['教学设计', '教学创新', '课堂教学', '教学策略', '作业设计', '评价']):
            return {
                'primary': '专业能力',
                'secondary': '专业能力-教学设计',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['班级管理', '班主任', '学生辅导', '特殊学生', '家校共育']):
            return {
                'primary': '专业能力',
                'secondary': '专业能力-班级管理与学生指导',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['学科', '核心考点', '知识', '课程标准']):
            return {
                'primary': '专业知识',
                'secondary': '专业知识-学科知识',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['科研', '论文', '研究']):
            return {
                'primary': '专业能力',
                'secondary': '专业能力-教育研究能力',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['心理健康', '心理辅导']):
            return {
                'primary': '专业能力',
                'secondary': '专业能力-学生心理辅导',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['校本课程', '课程开发']):
            return {
                'primary': '专业能力',
                'secondary': '专业能力-课程开发能力',
                'tertiary': ''
            }
        elif any(kw in project_name for kw in ['跨学科', '融合']):
            return {
                'primary': '专业能力',
                'secondary': '专业能力-跨学科教学能力',
                'tertiary': ''
            }
        
        return {}
    
    def generate_exception_report(self) -> Dict:
        """生成异常检测报告"""
        all_exceptions = []
        all_exceptions.extend(self.validate_teacher_data())
        all_exceptions.extend(self.validate_training_data())
        
        # 按类型分组统计
        exception_summary = {}
        for exc in all_exceptions:
            exc_type = exc['type']
            if exc_type not in exception_summary:
                exception_summary[exc_type] = {
                    'count': 0,
                    'details': []
                }
            exception_summary[exc_type]['count'] += 1
            exception_summary[exc_type]['details'].append(exc)
        
        return {
            'total': len(all_exceptions),
            'by_type': exception_summary,
            'all_exceptions': all_exceptions,
            'corrections': self.corrections
        }
    
    def save_annotated_data(self, output_file: str):
        """保存标注后的数据"""
        annotated_data = self.annotate_training_records()
        annotated_data.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"✓ 已保存标注后的培训记录数据到：{output_file}")
        return annotated_data


def main():
    """主函数"""
    processor = TrainingProfileProcessor()
    
    # 加载数据
    teacher_file = '教师数据.csv'
    training_file = '培训记录数据.csv'
    
    if not processor.load_data(teacher_file, training_file):
        print("❌ 数据加载失败，请检查文件路径和格式")
        return
    
    # 数据校验和异常检测
    print("\n" + "="*60)
    print("开始数据校验和异常检测...")
    print("="*60)
    
    exception_report = processor.generate_exception_report()
    
    print(f"\n异常检测结果：")
    print(f"  总异常数：{exception_report['total']}")
    print(f"  自动校正数：{len(exception_report['corrections'])}")
    
    if exception_report['by_type']:
        print(f"\n异常类型统计：")
        for exc_type, info in exception_report['by_type'].items():
            print(f"  - {exc_type}：{info['count']}条")
    
    # 保存异常报告
    with open('异常检测报告.json', 'w', encoding='utf-8') as f:
        json.dump(exception_report, f, ensure_ascii=False, indent=2)
    print(f"\n✓ 异常检测报告已保存到：异常检测报告.json")
    
    # 保存校正记录
    if exception_report['corrections']:
        corrections_df = pd.DataFrame(exception_report['corrections'])
        corrections_df.to_csv('数据校正记录表.csv', index=False, encoding='utf-8-sig')
        print(f"✓ 数据校正记录已保存到：数据校正记录表.csv")
    
    # 培训记录智能标注
    print("\n" + "="*60)
    print("开始培训记录智能标注...")
    print("="*60)
    
    annotated_data = processor.save_annotated_data('培训记录数据_已标注.csv')
    
    print(f"\n✓ 标注完成！共标注 {len(annotated_data)} 条培训记录")
    print(f"\n标注字段预览：")
    print(annotated_data[['培训项目名称', '一级维度', '二级维度', '培训层级类型', '完成时间（标准格式）']].head(10).to_string())
    
    print("\n" + "="*60)
    print("数据处理完成！")
    print("="*60)


if __name__ == '__main__':
    main()

