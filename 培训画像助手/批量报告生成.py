#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
培训画像助手 - 批量报告生成模块
功能：为所有教师生成培训画像报告，并生成汇总分析
"""

import pandas as pd
import json
from datetime import datetime
import os
from 报告生成 import TrainingProfileReportGenerator

def generate_all_reports():
    """为所有教师生成报告"""
    generator = TrainingProfileReportGenerator()
    generator.load_data('教师数据.csv', '培训记录数据_已标注.csv')
    
    # 创建报告目录
    reports_dir = '教师培训画像报告'
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
    
    teacher_data = generator.teacher_data
    total_teachers = len(teacher_data)
    
    print(f"\n开始为 {total_teachers} 位教师生成培训画像报告...")
    print("="*60)
    
    success_count = 0
    failed_count = 0
    
    for idx, teacher in teacher_data.iterrows():
        teacher_id = teacher['教师ID']
        teacher_name = teacher['姓名']
        
        try:
            output_file = os.path.join(reports_dir, f"{teacher_id}_{teacher_name}_培训画像报告.html")
            generator.generate_html_report(teacher_id, output_file)
            success_count += 1
            
            if (idx + 1) % 50 == 0:
                print(f"进度：{idx + 1}/{total_teachers} ({success_count}成功, {failed_count}失败)")
        except Exception as e:
            failed_count += 1
            print(f"❌ 生成 {teacher_name}({teacher_id}) 的报告失败：{str(e)}")
    
    print("\n" + "="*60)
    print(f"批量报告生成完成！")
    print(f"  成功：{success_count} 份")
    print(f"  失败：{failed_count} 份")
    print(f"  报告保存目录：{reports_dir}/")
    print("="*60)
    
    return success_count, failed_count


def generate_summary_report():
    """生成汇总分析报告"""
    generator = TrainingProfileReportGenerator()
    generator.load_data('教师数据.csv', '培训记录数据_已标注.csv')
    
    teacher_data = generator.teacher_data
    training_data = generator.annotated_data
    
    # 统计分析
    total_teachers = len(teacher_data)
    total_trainings = len(training_data)
    total_hours = training_data['学时'].sum()
    
    # 教龄分布
    age_distribution = teacher_data['教龄'].value_counts().sort_index().to_dict()
    
    # 地区分布
    region_distribution = teacher_data['所在地区'].value_counts().to_dict()
    
    # 学科分布
    subject_distribution = teacher_data['任教学科'].value_counts().to_dict()
    
    # 培训层级分布
    level_distribution = training_data['培训层级类型'].value_counts().to_dict()
    
    # 培训维度分布
    dimension_distribution = training_data['一级维度'].value_counts().to_dict()
    
    # 计算人均培训学时
    avg_hours = total_hours / total_teachers if total_teachers > 0 else 0
    
    # 生成汇总报告HTML
    html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>培训画像汇总分析报告</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            border-bottom: 3px solid #4a90e2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section-title {{
            font-size: 20px;
            color: #4a90e2;
            border-left: 4px solid #4a90e2;
            padding-left: 15px;
            margin-bottom: 20px;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
        }}
        .stat-card h3 {{
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }}
        .stat-card .value {{
            font-size: 36px;
            font-weight: bold;
        }}
        .chart-container {{
            margin: 20px 0;
            padding: 20px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 5px;
        }}
        .bar-item {{
            display: flex;
            align-items: center;
            margin: 10px 0;
        }}
        .bar-label {{
            width: 200px;
            font-size: 14px;
            color: #666;
        }}
        .bar-container {{
            flex: 1;
            height: 30px;
            background: #e9ecef;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        }}
        .bar-fill {{
            height: 100%;
            background: linear-gradient(90deg, #4a90e2, #667eea);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: bold;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .table th, .table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }}
        .table th {{
            background: #4a90e2;
            color: white;
            font-weight: bold;
        }}
        .table tr:hover {{
            background: #f8f9fa;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>培训画像汇总分析报告</h1>
            <p style="color: #666; margin-top: 10px;">生成时间：{datetime.now().strftime('%Y年%m月%d日 %H:%M')}</p>
        </div>
        
        <!-- 总体统计 -->
        <div class="section">
            <h2 class="section-title">一、总体统计</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>教师总数</h3>
                    <div class="value">{total_teachers}</div>
                    <div style="font-size: 12px; margin-top: 5px;">位</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h3>培训记录总数</h3>
                    <div class="value">{total_trainings}</div>
                    <div style="font-size: 12px; margin-top: 5px;">项</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <h3>累计培训学时</h3>
                    <div class="value">{total_hours}</div>
                    <div style="font-size: 12px; margin-top: 5px;">学时</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <h3>人均培训学时</h3>
                    <div class="value">{avg_hours:.1f}</div>
                    <div style="font-size: 12px; margin-top: 5px;">学时/人</div>
                </div>
            </div>
        </div>
        
        <!-- 教龄分布 -->
        <div class="section">
            <h2 class="section-title">二、教龄分布</h2>
            <div class="chart-container">
                <div class="bar-chart">
"""
    
    # 教龄分布图表
    max_age_count = max(age_distribution.values()) if age_distribution else 1
    for age in sorted(age_distribution.keys()):
        count = age_distribution[age]
        percentage = (count / total_teachers) * 100 if total_teachers > 0 else 0
        html += f"""                    <div class="bar-item">
                        <div class="bar-label">{age}年教龄</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {(count / max_age_count) * 100}%;">{count}人 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
    
    html += """                </div>
            </div>
        </div>
        
        <!-- 地区分布 -->
        <div class="section">
            <h2 class="section-title">三、地区分布</h2>
            <div class="chart-container">
                <div class="bar-chart">
"""
    
    # 地区分布图表
    max_region_count = max(region_distribution.values()) if region_distribution else 1
    for region in sorted(region_distribution.items(), key=lambda x: x[1], reverse=True)[:10]:  # 显示前10个
        region_name, count = region
        percentage = (count / total_teachers) * 100 if total_teachers > 0 else 0
        html += f"""                    <div class="bar-item">
                        <div class="bar-label">{region_name}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {(count / max_region_count) * 100}%;">{count}人 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
    
    html += """                </div>
            </div>
        </div>
        
        <!-- 学科分布 -->
        <div class="section">
            <h2 class="section-title">四、学科分布</h2>
            <div class="chart-container">
                <div class="bar-chart">
"""
    
    # 学科分布图表
    max_subject_count = max(subject_distribution.values()) if subject_distribution else 1
    for subject in sorted(subject_distribution.items(), key=lambda x: x[1], reverse=True):
        subject_name, count = subject
        percentage = (count / total_teachers) * 100 if total_teachers > 0 else 0
        html += f"""                    <div class="bar-item">
                        <div class="bar-label">{subject_name}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {(count / max_subject_count) * 100}%;">{count}人 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
    
    html += """                </div>
            </div>
        </div>
        
        <!-- 培训层级分布 -->
        <div class="section">
            <h2 class="section-title">五、培训层级分布</h2>
            <div class="chart-container">
                <div class="bar-chart">
"""
    
    # 培训层级分布图表
    max_level_count = max(level_distribution.values()) if level_distribution else 1
    for level in sorted(level_distribution.items(), key=lambda x: x[1], reverse=True):
        level_name, count = level
        percentage = (count / total_trainings) * 100 if total_trainings > 0 else 0
        html += f"""                    <div class="bar-item">
                        <div class="bar-label">{level_name}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {(count / max_level_count) * 100}%;">{count}项 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
    
    html += """                </div>
            </div>
        </div>
        
        <!-- 培训维度分布 -->
        <div class="section">
            <h2 class="section-title">六、培训维度分布</h2>
            <div class="chart-container">
                <div class="bar-chart">
"""
    
    # 培训维度分布图表
    max_dim_count = max(dimension_distribution.values()) if dimension_distribution else 1
    for dim in sorted(dimension_distribution.items(), key=lambda x: x[1], reverse=True):
        dim_name, count = dim
        percentage = (count / total_trainings) * 100 if total_trainings > 0 else 0
        html += f"""                    <div class="bar-item">
                        <div class="bar-label">{dim_name}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {(count / max_dim_count) * 100}%;">{count}项 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
    
    html += """                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666;">
            <p>本报告由培训画像助手自动生成</p>
            <p style="font-size: 12px; margin-top: 10px;">数据来源：教师信息管理系统、培训管理系统</p>
        </div>
    </div>
</body>
</html>
"""
    
    # 保存汇总报告
    with open('培训画像汇总分析报告.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"\n✓ 汇总分析报告已生成：培训画像汇总分析报告.html")


if __name__ == '__main__':
    print("="*60)
    print("培训画像助手 - 批量报告生成")
    print("="*60)
    
    # 生成汇总报告
    print("\n生成汇总分析报告...")
    generate_summary_report()
    
    # 询问是否生成所有教师报告（可选，因为可能耗时较长）
    print("\n" + "="*60)
    print("批量报告生成完成！")
    print("="*60)
    print("\n提示：如需为所有教师生成个人报告，请运行：")
    print("  python 批量报告生成.py --all")

