-- 智能学科定位器数据库结构
-- 创建时间: 2025-12-31

-- 1. 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'text', -- text, image, voice
  analysis JSONB NOT NULL, -- 分析结果JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 用户配置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT true,
  data_sync BOOLEAN DEFAULT true,
  two_factor_sms BOOLEAN DEFAULT false,
  two_factor_email BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'zh-CN',
  theme VARCHAR(20) DEFAULT 'light',
  report_frequency VARCHAR(20) DEFAULT 'weekly',
  default_analysis_type VARCHAR(20) DEFAULT 'text',
  auto_save_history BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 学科映射表
CREATE TABLE IF NOT EXISTS subject_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 主要分类
  subcategory VARCHAR(50), -- 子分类
  grade_level VARCHAR(20), -- 适用年级
  keywords TEXT[], -- 关键词数组
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 用户学科偏好表
CREATE TABLE IF NOT EXISTS user_subject_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_mapping_id UUID REFERENCES subject_mappings(id) ON DELETE CASCADE,
  proficiency_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
  interest_level INTEGER DEFAULT 3, -- 1-5兴趣等级
  study_frequency VARCHAR(20) DEFAULT 'occasional', -- occasional, regular, frequent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, subject_mapping_id)
);

-- 5. 学习报告表
CREATE TABLE IF NOT EXISTS learning_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, monthly, custom
  data JSONB NOT NULL, -- 报告数据
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
);

-- 6. AI分析缓存表
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_hash VARCHAR(64) UNIQUE, -- SHA256哈希
  content_type VARCHAR(20),
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_learning_records_user_id ON learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_created_at ON learning_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_records_content_type ON learning_records(content_type);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_subject_mappings_category ON subject_mappings(category);
CREATE INDEX IF NOT EXISTS idx_subject_mappings_grade_level ON subject_mappings(grade_level);

CREATE INDEX IF NOT EXISTS idx_user_subject_preferences_user_id ON user_subject_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subject_preferences_subject_id ON user_subject_preferences(subject_mapping_id);

CREATE INDEX IF NOT EXISTS idx_learning_reports_user_id ON learning_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_reports_generated_at ON learning_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_hash ON analysis_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
DROP TRIGGER IF EXISTS update_learning_records_updated_at ON learning_records;
CREATE TRIGGER update_learning_records_updated_at 
    BEFORE UPDATE ON learning_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入基础学科数据
INSERT INTO subject_mappings (name, category, subcategory, grade_level, keywords, description) VALUES
('数学', '基础学科', '数理逻辑', '1-12', ARRAY['数字', '计算', '几何', '代数', '函数', '概率'], '基础数学知识，包括算术、几何、代数等内容'),
('语文', '基础学科', '语言文学', '1-12', ARRAY['阅读', '写作', '古诗', '作文', '语法', '文学'], '语文学科，包括阅读理解、写作表达、文学鉴赏等'),
('英语', '基础学科', '外语', '3-12', ARRAY['单词', '语法', '听说读写', '口语', '听力', '阅读'], '英语学科，包括听说读写各项技能'),
('物理', '理科', '自然科学', '7-12', ARRAY['力学', '电磁', '光学', '热学', '原子', '实验'], '物理学科，研究物质的基本结构和运动规律'),
('化学', '理科', '自然科学', '9-12', ARRAY['分子', '原子', '反应', '实验', '有机', '无机'], '化学学科，研究物质的组成、结构、性质及变化规律'),
('生物', '理科', '生命科学', '7-12', ARRAY['细胞', '遗传', '生态', '进化', '解剖', '生理'], '生物学科，研究生命现象和生物活动规律'),
('历史', '文科', '人文社科', '7-12', ARRAY['朝代', '事件', '人物', '文明', '战争', '文化'], '历史学科，研究人类社会发展历程'),
('地理', '文科', '人文社科', '7-12', ARRAY['地形', '气候', '人口', '城市', '环境', '资源'], '地理学科，研究地球表面现象和规律'),
('政治', '文科', '人文社科', '7-12', ARRAY['法律', '经济', '哲学', '道德', '制度', '权利'], '政治学科，研究政治制度和政治理论'),
('艺术', '素质拓展', '美育', '1-12', ARRAY['绘画', '音乐', '舞蹈', '雕塑', '书法', '设计'], '艺术学科，培养审美能力和艺术修养'),
('体育', '素质拓展', '体育', '1-12', ARRAY['运动', '健身', '比赛', '体能', '技巧', '健康'], '体育学科，增强体质和运动技能'),
('信息技术', '素质拓展', '科技', '3-12', ARRAY['编程', '算法', '网络', '数据', '人工智能', '机器人'], '信息技术学科，培养数字化素养和计算思维')
ON CONFLICT (name) DO NOTHING;

-- 启用行级安全策略 (RLS)
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subject_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_reports ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能访问自己的数据
CREATE POLICY "用户只能查看自己的学习记录" ON learning_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的学习记录" ON learning_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的学习记录" ON learning_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的学习记录" ON learning_records
    FOR DELETE USING (auth.uid() = user_id);

-- 用户设置策略
CREATE POLICY "用户只能查看自己的设置" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- 用户学科偏好策略
CREATE POLICY "用户只能查看自己的学科偏好" ON user_subject_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的学科偏好" ON user_subject_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的学科偏好" ON user_subject_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的学科偏好" ON user_subject_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- 学习报告策略
CREATE POLICY "用户只能查看自己的报告" ON learning_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的报告" ON learning_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 学科映射表和缓存表公开读取
ALTER TABLE subject_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人都可以查看学科映射" ON subject_mappings
    FOR SELECT USING (true);

CREATE POLICY "所有人都可以查看分析缓存" ON analysis_cache
    FOR SELECT USING (true);

CREATE POLICY "用户可以创建分析缓存" ON analysis_cache
    FOR INSERT WITH CHECK (true);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户设置表添加触发器
DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 清理过期缓存的函数
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM analysis_cache 
    WHERE expires_at < now();
END;
$$ language 'plpgsql';

-- 定时清理过期缓存（每天执行一次）
SELECT cron.schedule('clean-cache', '0 2 * * *', 'SELECT clean_expired_cache();');

COMMENT ON TABLE learning_records IS '用户学习内容分析记录';
COMMENT ON TABLE user_settings IS '用户个人设置';
COMMENT ON TABLE subject_mappings IS '学科知识体系映射';
COMMENT ON TABLE user_subject_preferences IS '用户学科学习偏好';
COMMENT ON TABLE learning_reports IS '生成的学习报告';
COMMENT ON TABLE analysis_cache IS 'AI分析结果缓存';

-- 创建视图便于统计
CREATE OR REPLACE VIEW user_learning_stats AS
SELECT 
    lr.user_id,
    COUNT(*) as total_analyses,
    COUNT(DISTINCT jsonb_array_elements_text(lr.analysis->'subjects'->'name')) as unique_subjects,
    AVG((lr.analysis->'difficulty'->>'matchRate')::float) as avg_accuracy,
    DATE_TRUNC('day', lr.created_at) as analysis_date
FROM learning_records lr
GROUP BY lr.user_id, DATE_TRUNC('day', lr.created_at);

COMMENT ON VIEW user_learning_stats IS '用户学习统计数据视图';