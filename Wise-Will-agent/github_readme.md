Wise-will Edu agent Platform

地址：https://github.com/zjrwtx/Wise-Will-agent?tab=readme-ov-file


📚 开源教育 AI Agent 产品
这是一个代码开源的教育 AI Agent 产品，
在设计上借鉴了蚂蚁灵光、豆包爱学、飞象老师等优秀产品的设计，
致力于 可视化地解释你的一切问题，真正做到——为教育而生。

🎯 为什么是教育？
我们认为，教育一定是 AI Agent 最大的落地场景之一。
而选择 开源，是希望能够：

🌱 帮助更多 学校
👩‍🎓 赋能更多 同学
👨‍🏫 支持更多 教育工作者
让 AI 教育能力 不只停留在少数平台，而是被更多人真正用起来。

🚧 项目现状
当前版本仍然 较为粗糙
功能与体验都在 持续打磨中
后续会 不断完善与迭代
🤝 共建与参与
欢迎你：

使用它
提出建议
贡献代码
让我们一起打造更好的教育 AI 👏

一起 enjoy education agent time 🚀

功能特点
对话式学习 - 输入想学习的知识点，AI 以引导式教学方式回应
概念地图导航 - 可视化知识结构，点击节点探索相关概念
实时可视化生成 - AI 自动生成交互式 HTML 可视化内容
云端部署 - 通过 EdgeOne Pages MCP 自动部署到云端
进度追踪 - 实时显示 AI 处理阶段（思考 → 编写 → 调用工具 → 部署）
例子
317846db0c0788b24c10613b7d0775c0_720 5cce227b43f6e958c8162b2c917ffc16_720
a747c77f0da7204666b4857ea771958e_720

快速开始
环境要求
Node.js >= 18
Python >= 3.13
pnpm
安装
# 克隆仓库
git clone --recursive https://github.com/your-username/edu-ai-platform.git
cd edu-ai-platform

# 前端依赖
cd frontend && pnpm install

# 后端依赖
cd ../backend && uv sync
配置
复制环境变量模板并填入 API Key：

cp backend/.env.example backend/.env
编辑 backend/.env：

# 使用 Kimi（默认）
KIMI_API_KEY=sk-your-api-key
KIMI_MODEL_NAME=kimi-k2-turbo-preview

# 或使用 DeepSeek / OpenAI 兼容 API
LLM_PROVIDER_TYPE=openai_legacy
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL_NAME=deepseek-chat
OPENAI_REASONING_KEY=reasoning_content
启动
# 终端 1 - 后端
cd backend && python main.py

# 终端 2 - 前端
cd frontend && pnpm dev
访问 http://localhost:3000

项目结构
edu-ai-platform/
├── frontend/           # Next.js 前端
│   └── src/
│       ├── app/        # 页面
│       ├── components/ # 组件
│       └── hooks/      # WebSocket、状态管理
├── backend/            # FastAPI 后端
│   ├── main.py         # 主应用
│   ├── kimi_runner.py  # Kimi CLI 封装
│   ├── mcp.json        # MCP 配置
│   └── agent/          # Agent 配置和提示词
├── kimi-cli/           # AI Agent 核心 (submodule)
└── kosong/             # LLM 抽象层 (submodule)
技术栈
层	技术
前端	Next.js 16, React 19, TypeScript, Tailwind CSS 4
后端	FastAPI, Python 3.13, WebSocket
AI	Kimi CLI, MCP (Model Context Protocol)
部署	EdgeOne Pages
API
方法	路径	说明
GET	/	服务状态
GET	/health	健康检查
GET	/api/history	获取历史
DELETE	/api/history/{task_id}	删除历史
WebSocket	/ws/chat	实时聊天
致谢
本项目基于以下优秀项目构建：

Kimi CLI - Moonshot AI 开源的 coding Agent 框架，提供工具调用、MCP 集成等核心能力
Kosong - Moonshot AI 开源的 LLM 抽象层，统一消息结构与多 Provider 支持，让 Agent 开发更简洁灵活
EdgeOne Pages MCP - EdgeOne Pages 的 MCP 服务，提供一键云端部署能力
感谢 Moonshot AI 团队和 EdgeOne Pages！

联系方式
如有问题或建议，请联系：3038880699@qq.com

License
apache-2.0 https://www.apache.org/licenses/LICENSE-2.0