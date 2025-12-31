#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
培训画像助手 - 报告生成模块
功能：生成完整的培训画像报告（HTML格式）
"""

import pandas as pd
import json
from datetime import datetime
from collections import Counter
import math

class TrainingProfileReportGenerator:
    """培训画像报告生成器"""
    
    def __init__(self):
        self.teacher_data = None
        self.training_data = None
        self.annotated_data = None
        
        # 专业发展五阶段
        self.development_stages = [
            '适应期-新手教师',
            '发展期-熟练教师',
            '成熟期-骨干教师',
            '稳定期-卓越教师',
            '创造期-教育家型'
        ]
        
        # 常模值（模拟数据，实际应从知识库获取）
        self.norm_values = {
            '专业理念与师德': 75,
            '专业知识': 72,
            '专业能力': 70,
            '专业发展': 68,
            '数字素养': 65
        }
        
        # 区域平均值（模拟数据）
        self.region_averages = {
            '专业理念与师德': 73,
            '专业知识': 70,
            '专业能力': 68,
            '专业发展': 66,
            '数字素养': 63
        }
    
    def load_data(self, teacher_file: str, annotated_training_file: str):
        """加载数据"""
        self.teacher_data = pd.read_csv(teacher_file, encoding='utf-8')
        self.annotated_data = pd.read_csv(annotated_training_file, encoding='utf-8')
        print(f"✓ 已加载教师数据：{len(self.teacher_data)}条")
        print(f"✓ 已加载培训记录数据：{len(self.annotated_data)}条")
    
    def calculate_teacher_statistics(self, teacher_id: str) -> dict:
        """计算单个教师的统计数据"""
        teacher = self.teacher_data[self.teacher_data['教师ID'] == teacher_id].iloc[0]
        
        # 获取该教师的培训记录（假设培训记录通过某种方式关联到教师）
        # 这里简化处理，统计所有培训记录
        teacher_trainings = self.annotated_data.copy()
        
        # 计算培训统计
        total_hours = teacher_trainings['学时'].sum()
        training_count = len(teacher_trainings)
        
        # 按层级统计
        level_dist = teacher_trainings['培训层级类型'].value_counts().to_dict()
        
        # 按维度统计
        dimension_dist = teacher_trainings['一级维度'].value_counts().to_dict()
        
        # 按年份统计学时
        teacher_trainings['年份'] = teacher_trainings['完成时间（标准格式）'].str[:4]
        yearly_hours = teacher_trainings.groupby('年份')['学时'].sum().to_dict()
        
        # 计算当前专业发展阶段（基于教龄）
        age = int(teacher['教龄'])
        if age <= 3:
            stage = '适应期-新手教师'
            stage_index = 0
        elif age <= 7:
            stage = '发展期-熟练教师'
            stage_index = 1
        elif age <= 15:
            stage = '成熟期-骨干教师'
            stage_index = 2
        elif age <= 25:
            stage = '稳定期-卓越教师'
            stage_index = 3
        else:
            stage = '创造期-教育家型'
            stage_index = 4
        
        # 计算各维度分数（基于培训记录分布，简化计算）
        dimension_scores = {}
        for dim in ['专业理念与师德', '专业知识', '专业能力', '专业发展', '数字素养']:
            dim_trainings = teacher_trainings[teacher_trainings['一级维度'] == dim]
            if len(dim_trainings) > 0:
                # 基于培训数量和层级计算分数
                base_score = 60
                count_bonus = min(len(dim_trainings) * 2, 20)
                level_bonus = 0
                for level in dim_trainings['培训层级类型']:
                    if '国家级' in str(level):
                        level_bonus += 3
                    elif '省级' in str(level):
                        level_bonus += 2
                    elif '市级' in str(level):
                        level_bonus += 1
                dimension_scores[dim] = min(base_score + count_bonus + level_bonus, 100)
            else:
                dimension_scores[dim] = self.region_averages.get(dim, 65)
        
        return {
            'teacher_info': teacher.to_dict(),
            'stage': stage,
            'stage_index': stage_index,
            'total_hours': total_hours,
            'training_count': training_count,
            'level_distribution': level_dist,
            'dimension_distribution': dimension_dist,
            'yearly_hours': yearly_hours,
            'dimension_scores': dimension_scores
        }
    
    def generate_html_report(self, teacher_id: str, output_file: str = '培训画像报告.html'):
        """生成HTML格式的培训画像报告"""
        stats = self.calculate_teacher_statistics(teacher_id)
        teacher = stats['teacher_info']
        
        html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>教师培训画像报告 - {teacher['姓名']}</title>
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
        .teacher-info {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
        }}
        .info-item {{
            display: flex;
            flex-direction: column;
        }}
        .info-label {{
            font-weight: bold;
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }}
        .info-value {{
            color: #2c3e50;
            font-size: 16px;
        }}
        .path-diagram {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
        }}
        .stage {{
            flex: 1;
            text-align: center;
            padding: 15px;
            border-radius: 5px;
            margin: 0 5px;
            transition: all 0.3s;
        }}
        .stage.current {{
            background: #4a90e2;
            color: white;
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
        }}
        .stage:not(.current) {{
            background: #e9ecef;
            color: #666;
        }}
        .stage-name {{
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .arrow {{
            color: #4a90e2;
            font-size: 24px;
        }}
        .chart-container {{
            margin: 20px 0;
            padding: 20px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 5px;
        }}
        .radar-chart {{
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
        }}
        .dimension-list {{
            list-style: none;
            padding: 0;
        }}
        .dimension-item {{
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-left: 3px solid #4a90e2;
            border-radius: 3px;
        }}
        .dimension-item strong {{
            color: #4a90e2;
        }}
        .trend {{
            display: inline-block;
            margin-left: 10px;
            font-size: 18px;
        }}
        .trend.up {{ color: #28a745; }}
        .trend.down {{ color: #dc3545; }}
        .trend.stable {{ color: #6c757d; }}
        .training-stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .stat-card h3 {{
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }}
        .stat-card .value {{
            font-size: 32px;
            font-weight: bold;
        }}
        .bar-chart {{
            margin: 20px 0;
        }}
        .bar-item {{
            display: flex;
            align-items: center;
            margin: 10px 0;
        }}
        .bar-label {{
            width: 150px;
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
            transition: width 0.5s;
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
        .btn-group {{
            text-align: center;
            margin: 30px 0;
        }}
        .btn {{
            display: inline-block;
            padding: 12px 30px;
            margin: 0 10px;
            background: #4a90e2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }}
        .btn:hover {{
            background: #357abd;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>教师培训画像报告</h1>
            <p style="color: #666; margin-top: 10px;">生成时间：{datetime.now().strftime('%Y年%m月%d日 %H:%M')}</p>
        </div>
        
        <!-- 模块1：教师基本信息 -->
        <div class="section">
            <h2 class="section-title">一、教师基本信息</h2>
            <div class="teacher-info">
                <div class="info-item">
                    <span class="info-label">姓名</span>
                    <span class="info-value">{teacher['姓名']}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">教龄</span>
                    <span class="info-value">{teacher['教龄']}年</span>
                </div>
                <div class="info-item">
                    <span class="info-label">所在地区</span>
                    <span class="info-value">{teacher['所在地区']}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">所在学校</span>
                    <span class="info-value">{teacher['所在学校']}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">任教学科</span>
                    <span class="info-value">{teacher['任教学科']}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">职务</span>
                    <span class="info-value">{teacher['职务']}</span>
                </div>
            </div>
            <div class="btn-group">
                <a href="#" class="btn">导出报告</a>
                <a href="#" class="btn">更新数据</a>
                <a href="#" class="btn">查看评分分析报告</a>
            </div>
        </div>
        
        <!-- 模块2：专业发展路径 -->
        <div class="section">
            <h2 class="section-title">二、专业发展路径</h2>
            <div class="path-diagram">
"""
        
        # 生成路径图
        for i, stage_name in enumerate(self.development_stages):
            is_current = (i == stats['stage_index'])
            stage_class = 'stage current' if is_current else 'stage'
            html += f'                <div class="{stage_class}">\n'
            html += f'                    <div class="stage-name">{stage_name}</div>\n'
            if is_current:
                html += f'                    <div style="font-size: 12px; margin-top: 5px;">当前阶段</div>\n'
            html += f'                </div>\n'
            if i < len(self.development_stages) - 1:
                html += '                <div class="arrow">→</div>\n'
        
        html += """            </div>
            
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">多维度能力对比</h3>
                <div class="bar-chart">
"""
        
        # 生成柱状对比图
        for dim in ['专业理念与师德', '专业知识', '专业能力', '专业发展', '数字素养']:
            my_score = stats['dimension_scores'].get(dim, 0)
            norm_score = self.norm_values.get(dim, 0)
            region_score = self.region_averages.get(dim, 0)
            
            html += f"""                    <div class="bar-item">
                        <div class="bar-label">{dim}</div>
                        <div style="flex: 1; display: flex; gap: 5px;">
                            <div style="flex: 1;">
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">我的数据: {my_score}分</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: {my_score}%;">{my_score}</div>
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">区域平均: {region_score}分</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: {region_score}%; background: linear-gradient(90deg, #28a745, #20c997);">{region_score}</div>
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">常模值: {norm_score}分</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: {norm_score}%; background: linear-gradient(90deg, #ffc107, #fd7e14);">{norm_score}</div>
                                </div>
                            </div>
                        </div>
                    </div>
"""
        
        html += """                </div>
            </div>
        </div>
        
        <!-- 模块3：当前阶段分析 -->
        <div class="section">
            <h2 class="section-title">三、当前专业发展阶段分析</h2>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">多维度雷达图</h3>
                <div class="radar-chart">
                    <p style="color: #666;">（雷达图可视化 - 实际应用中可使用Chart.js等库实现）</p>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">细分指标列表</h3>
                <ul class="dimension-list">
"""
        
        # 生成细分指标列表
        for dim, score in stats['dimension_scores'].items():
            trend = '↑' if score > self.region_averages.get(dim, 0) else '↓' if score < self.region_averages.get(dim, 0) else '-'
            trend_class = 'up' if trend == '↑' else 'down' if trend == '↓' else 'stable'
            html += f"""                    <li class="dimension-item">
                        <strong>{dim}</strong>：{score}分
                        <span class="trend {trend_class}">{trend}</span>
                    </li>
"""
        
        html += """                </ul>
            </div>
        </div>
        
        <!-- 模块4：专业发展维度 -->
        <div class="section">
            <h2 class="section-title">四、专业发展维度数据</h2>
            <div class="training-stats">
                <div class="stat-card">
                    <h3>教研活动参与度</h3>
                    <div class="value">{stats['training_count']}</div>
                    <div style="font-size: 12px; margin-top: 5px;">次培训</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h3>专业学习主动性</h3>
                    <div class="value">{len([h for h in stats['yearly_hours'].values() if h > 0])}</div>
                    <div style="font-size: 12px; margin-top: 5px;">年持续学习</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <h3>累计培训学时</h3>
                    <div class="value">{stats['total_hours']}</div>
                    <div style="font-size: 12px; margin-top: 5px;">学时</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">历年培训学时分布</h3>
                <div class="bar-chart">
"""
        
        # 生成历年学时分布图
        sorted_years = sorted(stats['yearly_hours'].items())
        for year, hours in sorted_years:
            html += f"""                    <div class="bar-item">
                        <div class="bar-label">{year}年</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {min(hours / max(stats['yearly_hours'].values()) * 100, 100)}%;">{hours}学时</div>
                        </div>
                    </div>
"""
        
        html += """                </div>
            </div>
        </div>
        
        <!-- 模块5：数字素养维度 -->
        <div class="section">
            <h2 class="section-title">五、数字素养维度数据</h2>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">数字素养能力评估</h3>
                <div class="bar-chart">
"""
        
        # 数字素养相关指标
        digital_score = stats['dimension_scores'].get('数字素养', 0)
        html += f"""                    <div class="bar-item">
                        <div class="bar-label">教育技术应用能力</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {digital_score}%;">{digital_score}分</div>
                        </div>
                    </div>
                    <div class="bar-item">
                        <div class="bar-label">在线教学平台使用</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {digital_score - 5}%;">{max(digital_score - 5, 0)}分</div>
                        </div>
                    </div>
                    <div class="bar-item">
                        <div class="bar-label">数字化教学资源开发</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {digital_score - 3}%;">{max(digital_score - 3, 0)}分</div>
                        </div>
                    </div>
                    <div class="bar-item">
                        <div class="bar-label">数据驱动教学改进</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {digital_score - 8}%;">{max(digital_score - 8, 0)}分</div>
                        </div>
                    </div>
"""
        
        html += """                </div>
            </div>
        </div>
        
        <!-- 模块6：培训画像分析 -->
        <div class="section">
            <h2 class="section-title">六、培训历史智能评估</h2>
            <div class="training-stats">
                <div class="stat-card">
                    <h3>培训项目总数</h3>
                    <div class="value">{stats['training_count']}</div>
                    <div style="font-size: 12px; margin-top: 5px;">项</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h3>累计培训学时</h3>
                    <div class="value">{stats['total_hours']}</div>
                    <div style="font-size: 12px; margin-top: 5px;">学时</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <h3>培训层级分布</h3>
                    <div class="value">{len(stats['level_distribution'])}</div>
                    <div style="font-size: 12px; margin-top: 5px;">种类型</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">培训级别分布</h3>
                <div class="bar-chart">
"""
        
        # 培训级别分布
        for level, count in stats['level_distribution'].items():
            percentage = (count / stats['training_count']) * 100 if stats['training_count'] > 0 else 0
            html += f"""                    <div class="bar-item">
                        <div class="bar-label">{level}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {percentage}%;">{count}项 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
        
        html += """                </div>
            </div>
            
            <div class="chart-container" style="margin-top: 20px;">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">培训维度分布</h3>
                <div class="bar-chart">
"""
        
        # 培训维度分布
        for dim, count in stats['dimension_distribution'].items():
            percentage = (count / stats['training_count']) * 100 if stats['training_count'] > 0 else 0
            html += f"""                    <div class="bar-item">
                        <div class="bar-label">{dim}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {percentage}%;">{count}项 ({percentage:.1f}%)</div>
                        </div>
                    </div>
"""
        
        html += """                </div>
            </div>
        </div>
        
        <!-- 模块7：智能决策分析 -->
        <div class="section">
            <h2 class="section-title">七、智能决策分析</h2>
            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">推荐培训主题</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>推荐培训主题</th>
                            <th>优先级</th>
                            <th>建议学时</th>
                            <th>提升方向</th>
                        </tr>
                    </thead>
                    <tbody>
"""
        
        # 生成推荐培训主题（基于薄弱维度）
        recommendations = []
        for dim, score in stats['dimension_scores'].items():
            if score < self.region_averages.get(dim, 0):
                priority = '高' if score < self.region_averages.get(dim, 0) - 10 else '中'
                recommendations.append({
                    'theme': f'{dim}提升培训',
                    'priority': priority,
                    'hours': 40 if priority == '高' else 20,
                    'direction': f'提升{dim}能力，缩小与区域平均值的差距'
                })
        
        if not recommendations:
            recommendations.append({
                'theme': '专业能力深化培训',
                'priority': '中',
                'hours': 30,
                'direction': '持续提升专业能力，向更高阶段发展'
            })
        
        for rec in recommendations[:5]:  # 最多显示5条
            html += f"""                        <tr>
                            <td>{rec['theme']}</td>
                            <td>{rec['priority']}</td>
                            <td>{rec['hours']}学时</td>
                            <td>{rec['direction']}</td>
                        </tr>
"""
        
        html += """                    </tbody>
                </table>
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
        
        # 保存HTML文件
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"✓ 培训画像报告已生成：{output_file}")
        return output_file


def main():
    """主函数"""
    generator = TrainingProfileReportGenerator()
    
    # 加载数据
    generator.load_data('教师数据.csv', '培训记录数据_已标注.csv')
    
    # 为第一个教师生成报告（示例）
    teacher_id = generator.teacher_data.iloc[0]['教师ID']
    generator.generate_html_report(teacher_id, '培训画像报告.html')
    
    print("\n" + "="*60)
    print("报告生成完成！")
    print("="*60)
    print(f"\n可以打开 '培训画像报告.html' 查看完整报告")


if __name__ == '__main__':
    main()

