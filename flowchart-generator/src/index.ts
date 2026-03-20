/**
 * 通用业务流程图生成器
 * Claude Native UI 风格 + 完整箭头系统
 */

// ==================== 类型定义 ====================

export interface Role {
  id: string;
  name: string;
  color: string;
  tagClass: string;
}

export interface Action {
  role: string;
  title: string;
  detail: string;
  type: 'online' | 'offline' | 'api';
  cardId: string;
}

export interface Step {
  stepNumber: number;
  actions: Action[];
}

export interface ArrowConnection {
  from: string;
  to: string;
}

export interface Phase {
  phaseNumber: number;
  title: string;
  description: string;
  participants: string[];
  roles: Role[];
  steps: Step[];
  keyPoints: string[];
  defaultArrows: ArrowConnection[];
}

export interface FlowchartData {
  title: string;
  subtitle: string;
  phases: Phase[];
}

// ==================== Claude 原生配色 ====================

export const CLAUDE_COLORS = {
  background: '#faf9f5',
  surface: '#ffffff',
  textPrimary: '#141413',
  textSecondary: '#666666',
  brandOrange: '#d97757',
  brandBlue: '#6a9bcc',
  brandGreen: '#788c5d',
  online: '#788c5d',
  offline: '#d97757',
  api: '#6a9bcc',
  border: '#e5e5e5',
  shadowSmall: '0 1px 2px rgba(20, 20, 19, 0.05)',
  shadowMedium: '0 4px 6px rgba(20, 20, 19, 0.07)',
  shadowLarge: '0 10px 15px rgba(20, 20, 19, 0.1)',
};

// ==================== 角色配色映射 ====================

const ROLE_COLOR_MAP: Record<string, { color: string; tagClass: string }> = {
  '用户': { color: CLAUDE_COLORS.brandBlue, tagClass: 'role-blue' },
  '客户': { color: CLAUDE_COLORS.brandBlue, tagClass: 'role-blue' },
  '系统': { color: CLAUDE_COLORS.brandGreen, tagClass: 'role-green' },
  '平台': { color: CLAUDE_COLORS.brandGreen, tagClass: 'role-green' },
  '商家': { color: CLAUDE_COLORS.brandOrange, tagClass: 'role-orange' },
  '银行': { color: CLAUDE_COLORS.brandBlue, tagClass: 'role-blue' },
  '支付': { color: CLAUDE_COLORS.brandOrange, tagClass: 'role-orange' },
  '支付平台': { color: CLAUDE_COLORS.brandOrange, tagClass: 'role-orange' },
  '物流': { color: CLAUDE_COLORS.brandGreen, tagClass: 'role-green' },
  '物流公司': { color: CLAUDE_COLORS.brandGreen, tagClass: 'role-green' },
  '仓库': { color: CLAUDE_COLORS.brandOrange, tagClass: 'role-orange' },
};

// ==================== 工具函数 ====================

export function createRole(name: string): Role {
  const key = Object.keys(ROLE_COLOR_MAP).find(k => name.includes(k));
  const scheme = key ? ROLE_COLOR_MAP[key] : { color: CLAUDE_COLORS.brandBlue, tagClass: 'role-blue' };

  return {
    id: name.toLowerCase().replace(/\s/g, '-'),
    name: name,
    color: scheme.color,
    tagClass: scheme.tagClass
  };
}

function generateCardId(role: string, phaseNum: number, stepNum: number): string {
  const mapping: Record<string, string> = {
    '用户': 'user',
    '客户': 'customer',
    '系统': 'system',
    '商家': 'merchant',
    '支付平台': 'payment',
    '物流公司': 'logistics',
    '银行': 'bank',
  };
  const mapped = mapping[role] || role.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `p${phaseNum}-s${stepNum}-${mapped}`;
}

// ==================== 解析逻辑 ====================

export function parseBusinessDescription(description: string): FlowchartData {
  const lines = description.trim().split('\n').map(l => l.trim()).filter(l => l);
  const phases: Phase[] = [];
  let currentPhase: Partial<Phase> | null = null;
  let currentStep: Partial<Step> | null = null;
  let phaseCounter = 0;
  let stepCounter = 0;

  // 提取标题
  const titleMatch = description.match(/^#+\s*(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : '业务流程图';
  const subtitle = '流程可视化 · Claude Native UI · 可编辑箭头';

  // 角色收集
  const roleSet = new Set<string>();
  const roleOrder: string[] = [];

  for (const line of lines) {
    const match = line.match(/^([^：:，,\s]+)[：:]/);
    if (match) {
      const role = match[1].trim();
      if (!roleSet.has(role)) {
        roleSet.add(role);
        roleOrder.push(role);
      }
    }
  }

  if (roleOrder.length === 0) {
    roleOrder.push('用户', '系统');
  }

  // 解析阶段和步骤
  for (const line of lines) {
    const phaseMatch = line.match(/(?:阶段|第|Phase|Step)\s*(\d+)[：:：\s]*(.+)/);
    if (phaseMatch) {
      if (currentPhase) {
        if (currentStep && currentPhase.steps) {
          currentPhase.steps.push(currentStep as Step);
        }
        finalizePhase(currentPhase, phases);
      }

      phaseCounter++;
      stepCounter = 0;
      currentPhase = {
        phaseNumber: phaseCounter,
        title: `阶段${phaseCounter}：${phaseMatch[2]}`,
        description: '',
        participants: [...roleOrder],
        roles: roleOrder.map(createRole),
        steps: [],
        keyPoints: [],
        defaultArrows: []
      };
      currentStep = null;
      continue;
    }

    const stepMatch = line.match(/^(\d+)[.、\s]*(.+)/);
    if (stepMatch && currentPhase) {
      if (currentStep) {
        currentPhase.steps!.push(currentStep as Step);
      }

      stepCounter++;
      currentStep = {
        stepNumber: stepCounter,
        actions: []
      };

      parseActionsInStep(stepMatch[2], currentStep, currentPhase);
      continue;
    }

    if ((line.includes('：') || line.includes(':')) && currentStep && currentPhase) {
      parseActionsInStep(line, currentStep, currentPhase);
    }
  }

  if (currentPhase) {
    if (currentStep) {
      currentPhase.steps!.push(currentStep as Step);
    }
    finalizePhase(currentPhase, phases);
  }

  // 生成默认箭头
  for (const phase of phases) {
    phase.defaultArrows = generateDefaultArrows(phase);
  }

  return { title, subtitle, phases };
}

function parseActionsInStep(text: string, step: Partial<Step>, phase: Partial<Phase>): void {
  const actionMatch = text.match(/^([^：:]+)[：:](.+)$/);

  if (actionMatch) {
    const role = actionMatch[1].trim();
    const content = actionMatch[2].trim();

    const roleObj = phase.roles!.find(r => r.name === role);
    if (!roleObj) return;

    let type: 'online' | 'offline' | 'api' = 'online';
    if (content.includes('API') || content.includes('接口') || content.includes('推送')) {
      type = 'api';
    } else if (content.includes('线下') || content.includes('人工') ||
               content.includes('打包') || content.includes('发货')) {
      type = 'offline';
    }

    const parts = content.split(/[，,]/);
    const title = parts[0]?.trim() || content.substring(0, 15);
    const detail = parts.slice(1).join('，').trim() || '';

    step.actions!.push({
      role,
      title,
      detail,
      type,
      cardId: generateCardId(role, phase.phaseNumber!, step.stepNumber!)
    });
  }
}

function finalizePhase(phase: Partial<Phase>, phases: Phase[]): void {
  phase.description = phase.description || generatePhaseDescription(phase as Phase);
  phase.keyPoints = (phase.keyPoints && phase.keyPoints.length > 0) ? phase.keyPoints : generateKeyPoints(phase as Phase);
  phases.push(phase as Phase);
}

function generatePhaseDescription(phase: Phase): string {
  const names = phase.participants.slice(0, 3).join('、');
  return `${names}等参与，包含 ${phase.steps.length} 个关键步骤。`;
}

function generateKeyPoints(phase: Phase): string[] {
  const points: string[] = [];
  const allActions = phase.steps.flatMap(s => s.actions);

  const typeCount = {
    online: allActions.filter(a => a.type === 'online').length,
    offline: allActions.filter(a => a.type === 'offline').length,
    api: allActions.filter(a => a.type === 'api').length
  };

  if (typeCount.online) points.push(`${typeCount.online} 个线上操作`);
  if (typeCount.offline) points.push(`${typeCount.offline} 个线下处理`);
  if (typeCount.api) points.push(`${typeCount.api} 个 API 调用`);
  if (phase.participants.length > 2) points.push(`多方协同完成`);

  return points;
}

function generateDefaultArrows(phase: Phase): ArrowConnection[] {
  const arrows: ArrowConnection[] = [];

  for (let i = 0; i < phase.steps.length - 1; i++) {
    const currentStep = phase.steps[i];
    const nextStep = phase.steps[i + 1];

    for (const action of currentStep.actions) {
      const nextAction = nextStep.actions.find(a => a.role === action.role);
      if (nextAction) {
        arrows.push({ from: `${action.cardId}-bottom`, to: `${nextAction.cardId}-top` });
      }
    }

    for (let j = 0; j < currentStep.actions.length - 1; j++) {
      arrows.push({
        from: `${currentStep.actions[j].cardId}-right`,
        to: `${currentStep.actions[j + 1].cardId}-left`
      });
    }
  }

  return arrows;
}

// ==================== HTML 生成 ====================

export function generateFlowchartHTML(data: FlowchartData): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <style>${getCSS()}</style>
</head>
<body>
    ${getBodyHTML(data)}
    <script>${getScriptHTML(data)}</script>
</body>
</html>`;
}

function getCSS(): string {
  return `
        :root {
            --bg-color: ${CLAUDE_COLORS.background};
            --surface-color: ${CLAUDE_COLORS.surface};
            --text-primary: ${CLAUDE_COLORS.textPrimary};
            --text-secondary: ${CLAUDE_COLORS.textSecondary};
            --brand-orange: ${CLAUDE_COLORS.brandOrange};
            --brand-blue: ${CLAUDE_COLORS.brandBlue};
            --brand-green: ${CLAUDE_COLORS.brandGreen};
            --online-color: ${CLAUDE_COLORS.online};
            --offline-color: ${CLAUDE_COLORS.offline};
            --api-color: ${CLAUDE_COLORS.api};
            --border-color: ${CLAUDE_COLORS.border};
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Lora', -apple-system, sans-serif; background: var(--bg-color); color: var(--text-primary); line-height: 1.6; padding: 24px; }
        .container { max-width: 1400px; margin: 0 auto; background: var(--surface-color); border-radius: 12px; box-shadow: ${CLAUDE_COLORS.shadowMedium}; overflow: hidden; }
        .header { background: linear-gradient(135deg, var(--text-primary) 0%, #2a2a2a 100%); color: var(--surface-color); padding: 32px 40px; }
        .header h1 { font-family: 'Poppins', sans-serif; font-size: 28px; font-weight: 600; margin-bottom: 8px; }
        .header .subtitle { font-size: 15px; opacity: 0.8; }
        .phase-selector { display: flex; gap: 8px; padding: 16px 24px; background: var(--bg-color); border-bottom: 1px solid var(--border-color); flex-wrap: wrap; }
        .phase-btn { font-family: 'Poppins', sans-serif; padding: 10px 16px; border: 1px solid var(--border-color); background: var(--surface-color); color: var(--text-primary); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
        .phase-btn:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
        .phase-btn.active { background: var(--brand-blue); color: var(--surface-color); border-color: var(--brand-blue); }
        .flow-content { padding: 32px 40px; }
        .phase-section { display: none; }
        .phase-section.active { display: block; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .phase-title { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
        .phase-description { background: var(--bg-color); padding: 14px 18px; border-radius: 8px; color: var(--text-secondary); font-size: 15px; margin-bottom: 20px; border-left: 3px solid var(--brand-orange); }
        .participants { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .participant-tag { font-family: 'Poppins', sans-serif; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; background: var(--bg-color); color: var(--text-secondary); }
        .flow-container { position: relative; padding: 20px 0 40px 0; }
        .arrow-svg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; }
        .flow-header { display: grid; grid-template-columns: 50px repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .header-number { min-height: 40px; background: var(--text-primary); color: var(--surface-color); display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; border-radius: 6px 0 0 6px; }
        .header-role { min-height: 40px; display: flex; align-items: center; justify-content: center; color: var(--surface-color); font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px; border-radius: 0 6px 6px 0; }
        .header-role.role-blue { background: var(--brand-blue); }
        .header-role.role-green { background: var(--brand-green); }
        .header-role.role-orange { background: var(--brand-orange); }
        .steps-grid { display: grid; grid-template-columns: 50px repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; position: relative; }
        .step-number-cell { display: flex; align-items: flex-start; justify-content: center; padding-top: 10px; }
        .step-number { width: 36px; height: 36px; background: var(--text-primary); color: var(--surface-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 15px; box-shadow: ${CLAUDE_COLORS.shadowSmall}; }
        .role-column { position: relative; min-height: 100px; }
        .action-card { background: var(--surface-color); padding: 14px 16px; border-radius: 8px; box-shadow: ${CLAUDE_COLORS.shadowSmall}; border: 1px solid var(--border-color); border-left: 3px solid var(--brand-blue); transition: all 0.2s; position: relative; z-index: 5; min-height: 100px; display: flex; flex-direction: column; }
        .action-card:hover { box-shadow: ${CLAUDE_COLORS.shadowMedium}; transform: translateY(-2px); }
        .action-card.online { border-left-color: var(--online-color); }
        .action-card.offline { border-left-color: var(--offline-color); }
        .action-card.api { border-left-color: var(--api-color); }
        .action-title { font-family: 'Poppins', sans-serif; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px; }
        .action-detail { font-size: 14px; color: var(--text-secondary); line-height: 1.5; flex-grow: 1; }
        .action-badges { display: flex; gap: 6px; margin-top: 10px; }
        .action-badge { font-family: 'Poppins', sans-serif; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase; }
        .badge-online { background: var(--bg-color); color: var(--online-color); }
        .badge-offline { background: var(--bg-color); color: var(--offline-color); }
        .badge-api { background: var(--bg-color); color: var(--api-color); }
        .empty-cell { background: transparent !important; border: none !important; box-shadow: none !important; }
        .connection-points-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100; }
        .connection-point { position: absolute; width: 12px; height: 12px; background: var(--brand-blue); border: 2px solid var(--surface-color); border-radius: 50%; cursor: crosshair; z-index: 100; opacity: 0; transition: all 0.2s ease; pointer-events: auto; box-shadow: ${CLAUDE_COLORS.shadowSmall}; }
        .connection-point:hover { opacity: 1 !important; transform: scale(1.3); }
        .edit-mode .connection-point { opacity: 0.6; }
        .action-card:hover .connection-point { opacity: 0.6; }
        .connection-point.top { top: -6px; left: 50%; transform: translateX(-50%); }
        .connection-point.bottom { bottom: -6px; left: 50%; transform: translateX(-50%); }
        .connection-point.right { right: -6px; top: 50%; transform: translateY(-50%); }
        .connection-point.left { left: -6px; top: 50%; transform: translateY(-50%); }
        .legend { display: flex; gap: 20px; padding: 14px 18px; background: var(--bg-color); border-radius: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); }
        .legend-color { width: 20px; height: 16px; border-radius: 4px; border-left: 3px solid; }
        .legend-color.online { border-left-color: var(--online-color); }
        .legend-color.offline { border-left-color: var(--offline-color); }
        .legend-color.api { border-left-color: var(--api-color); }
        .key-points { background: var(--bg-color); border-left: 3px solid var(--brand-orange); padding: 14px 18px; border-radius: 8px; margin-top: 20px; }
        .key-points h4 { font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; }
        .key-points ul { list-style: none; }
        .key-points li { font-size: 14px; color: var(--text-secondary); padding: 4px 0; }
        .key-points li::before { content: "• "; color: var(--brand-orange); font-weight: 600; }
        .arrow-controls { position: fixed; bottom: 24px; right: 24px; background: var(--surface-color); padding: 16px; border-radius: 12px; box-shadow: ${CLAUDE_COLORS.shadowLarge}; z-index: 1000; border: 1px solid var(--border-color); }
        .arrow-controls h4 { font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); }
        .arrow-controls button { font-family: 'Poppins', sans-serif; padding: 8px 14px; margin: 4px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; background: var(--surface-color); color: var(--text-primary); }
        .btn-auto:hover { background: var(--brand-green); color: var(--surface-color); border-color: var(--brand-green); }
        .btn-reset:hover { background: var(--offline-color); color: var(--surface-color); border-color: var(--offline-color); }
        .btn-toggle:hover { background: var(--brand-blue); color: var(--surface-color); border-color: var(--brand-blue); }
        .btn-toggle.active { background: var(--brand-blue); color: var(--surface-color); border-color: var(--brand-blue); }
        .instructions { position: fixed; top: 24px; right: 24px; background: var(--surface-color); padding: 16px; border-radius: 12px; box-shadow: ${CLAUDE_COLORS.shadowLarge}; max-width: 280px; z-index: 1000; border: 1px solid var(--border-color); }
        .instructions h4 { font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); }
        .instructions ul { list-style: none; }
        .instructions li { font-size: 13px; color: var(--text-secondary); padding: 5px 0; line-height: 1.5; }
        .instructions .close-btn { position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 18px; cursor: pointer; color: #999; }
        .flow-arrow { stroke: var(--text-secondary); stroke-width: 2; fill: none; transition: stroke 0.2s; }
        .flow-arrow:hover { stroke: var(--brand-blue); }
        .edit-mode .flow-arrow { cursor: pointer; }
        .edit-mode .flow-arrow:hover { stroke: var(--offline-color); stroke-width: 2.5; }
        .flow-arrow-head { fill: var(--text-secondary); transition: fill 0.2s; }
        .flow-arrow:hover + .flow-arrow-head { fill: var(--brand-blue); }
        .edit-mode .flow-arrow:hover + .flow-arrow-head { fill: var(--offline-color); }
        .arrow-group { cursor: default; }
        .edit-mode .arrow-group { cursor: pointer; }
        .arrow-endpoint { position: absolute; width: 16px; height: 16px; background: var(--brand-orange); border: 3px solid white; border-radius: 50%; cursor: move; z-index: 200; opacity: 0; transition: all 0.2s ease; pointer-events: auto; box-shadow: 0 2px 8px rgba(217, 119, 87, 0.4); }
        .edit-mode .arrow-endpoint { opacity: 1; }
        .arrow-endpoint:hover { transform: scale(1.3); background: var(--offline-color); }
        .arrow-endpoint.dragging { opacity: 1; transform: scale(1.4); background: var(--offline-color); }
  `;
}

function getBodyHTML(data: FlowchartData): string {
  return `
    <div class="container">
        <div class="header">
            <h1>${data.title}</h1>
            <p class="subtitle">${data.subtitle}</p>
        </div>
        <div class="phase-selector">
            ${data.phases.map((phase, i) => `<button class="phase-btn ${i === 0 ? 'active' : ''}" onclick="showPhase(${i + 1})">${phase.title}</button>`).join('')}
        </div>
        <div class="flow-content">
            <div class="legend">
                <div class="legend-item"><div class="legend-color online"></div><span>线上操作</span></div>
                <div class="legend-item"><div class="legend-color offline"></div><span>线下操作</span></div>
                <div class="legend-item"><div class="legend-color api"></div><span>API 调用</span></div>
                <div class="legend-item"><span>💡 悬停卡片显示连接点，编辑模式可拖拽</span></div>
            </div>
            ${data.phases.map((phase, i) => generatePhaseHTML(phase, i === 0)).join('')}
        </div>
    </div>
    <div class="arrow-controls">
        <h4>🎯 流程箭头控制</h4>
        <button class="btn-auto" onclick="generateAutoArrows()">生成自动箭头</button>
        <button class="btn-reset" onclick="clearAllArrows()">清除所有箭头</button>
        <button class="btn-toggle" onclick="toggleEditMode()">编辑模式</button>
    </div>
    <div class="instructions" id="instructions">
        <button class="close-btn" onclick="this.parentElement.style.display='none'">&times;</button>
        <h4>📝 使用说明</h4>
        <ul>
            <li>点击阶段按钮切换不同阶段</li>
            <li>悬停卡片显示4个连接点（上下左右）</li>
            <li>开启编辑模式可拖拽连接点创建箭头</li>
            <li>编辑模式下点击箭头可单独删除</li>
            <li>点击"生成自动箭头"恢复默认连接</li>
        </ul>
    </div>
  `;
}

function generatePhaseHTML(phase: Phase, isActive: boolean): string {
  return `
    <div class="phase-section ${isActive ? 'active' : ''}" id="phase${phase.phaseNumber}">
        <h2 class="phase-title">${phase.title}</h2>
        <div class="phase-description">${phase.description}</div>
        <div class="participants">
            ${phase.participants.map(p => `<span class="participant-tag">${p}</span>`).join('')}
        </div>
        <div class="flow-container">
            <div class="arrow-svg-layer"><svg id="arrows-phase${phase.phaseNumber}"></svg></div>
            <div class="flow-header">
                <div class="header-number">步骤</div>
                ${phase.roles.map(r => `<div class="header-role ${r.tagClass}" style="background: ${r.color}">${r.name}</div>`).join('')}
            </div>
            <div class="steps-grid">
                ${phase.steps.map(step => generateStepHTML(step, phase.roles)).join('')}
            </div>
        </div>
        <div class="key-points">
            <h4>关键点</h4>
            <ul>${phase.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
    </div>
  `;
}

function generateStepHTML(step: Step, roles: Role[]): string {
  let html = `<div class="step-number-cell"><div class="step-number">${step.stepNumber}</div></div>`;
  for (const role of roles) {
    const action = step.actions.find(a => a.role === role.name);
    if (action) {
      html += `
        <div class="role-column">
          <div class="action-card ${action.type}" data-card-id="${action.cardId}">
            <div class="connection-points-container">
              <div class="connection-point top" data-point="${action.cardId}-top"></div>
              <div class="connection-point bottom" data-point="${action.cardId}-bottom"></div>
              <div class="connection-point left" data-point="${action.cardId}-left"></div>
              <div class="connection-point right" data-point="${action.cardId}-right"></div>
            </div>
            <div class="action-title">${action.title}</div>
            <div class="action-detail">${action.detail}</div>
            <div class="action-badges">
              <div class="action-badge badge-${action.type}">${action.type === 'online' ? '线上' : action.type === 'offline' ? '线下' : 'API'}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      html += `<div class="role-column empty-cell"></div>`;
    }
  }
  return html;
}

function getScriptHTML(data: FlowchartData): string {
  const defaultArrowsData: Record<string, ArrowConnection[]> = {};
  for (const phase of data.phases) {
    defaultArrowsData[phase.phaseNumber] = phase.defaultArrows;
  }

  return `
    <script>
        let arrows = ${JSON.stringify(defaultArrowsData)};
        let editMode = false;
        let dragState = { isDragging: false, startPoint: null, startPointId: null, tempLine: null };

        function showPhase(phaseNum) {
            document.querySelectorAll('.phase-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('phase' + phaseNum).classList.add('active');
            event.target.classList.add('active');
            setTimeout(() => drawArrows(phaseNum), 50);
        }

        function generateAutoArrows() {
            const activePhase = document.querySelector('.phase-section.active');
            const phaseNum = activePhase.id.replace('phase', '');
            arrows[phaseNum] = JSON.parse(JSON.stringify(${JSON.stringify(defaultArrowsData)}[phaseNum] || []));
            drawArrows(phaseNum);
            saveArrows();
        }

        function clearAllArrows() {
            const activePhase = document.querySelector('.phase-section.active');
            const phaseNum = activePhase.id.replace('phase', '');
            arrows[phaseNum] = [];
            drawArrows(phaseNum);
            saveArrows();
        }

        function toggleEditMode() {
            editMode = !editMode;
            document.body.classList.toggle('edit-mode', editMode);
            document.querySelector('.btn-toggle').classList.toggle('active', editMode);
            const activePhase = document.querySelector('.phase-section.active');
            if (activePhase) {
                const phaseNum = activePhase.id.replace('phase', '');
                drawArrows(phaseNum);
            }
        }

        function getElementPosition(element, container) {
            const rect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            return { x: rect.left + rect.width / 2 - containerRect.left, y: rect.top + rect.height / 2 - containerRect.top };
        }

        function deleteArrow(phaseNum, arrowIndex) {
            if (confirm('确定要删除这条箭头吗？')) {
                arrows[phaseNum].splice(arrowIndex, 1);
                drawArrows(phaseNum);
                saveArrows();
            }
        }

        function drawArrows(phaseNum) {
            const svg = document.getElementById('arrows-phase' + phaseNum);
            if (!svg) return;
            svg.innerHTML = '';
            const phaseArrows = arrows[phaseNum] || [];

            phaseArrows.forEach((arrow, index) => {
                const fromPoint = document.querySelector('[data-point="' + arrow.from + '"]');
                const toPoint = document.querySelector('[data-point="' + arrow.to + '"]');
                if (!fromPoint || !toPoint) return;

                const container = document.getElementById('phase' + phaseNum).querySelector('.flow-container');
                const fromPos = getElementPosition(fromPoint, container);
                const toPos = getElementPosition(toPoint, container);

                const dx = toPos.x - fromPos.x, dy = toPos.y - fromPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                let pathD = distance < 80
                    ? 'M ' + fromPos.x + ' ' + fromPos.y + ' L ' + toPos.x + ' ' + toPos.y
                    : 'M ' + fromPos.x + ' ' + fromPos.y + ' C ' + fromPos.x + ' ' + (fromPos.y + Math.min(distance * 0.25, 80)) + ', ' + toPos.x + ' ' + (toPos.y - Math.min(distance * 0.25, 80)) + ', ' + toPos.x + ' ' + toPos.y;

                const pathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                pathGroup.setAttribute('data-arrow-index', index);
                pathGroup.setAttribute('class', 'arrow-group');
                pathGroup.addEventListener('click', function() { if (editMode) deleteArrow(phaseNum, index); });
                svg.appendChild(pathGroup);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathD);
                path.setAttribute('class', 'flow-arrow');
                path.style.pointerEvents = 'stroke';
                pathGroup.appendChild(path);

                const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
                const headSize = 10;
                const headPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                headPath.setAttribute('points', toPos.x + ',' + toPos.y + ' ' + (toPos.x - headSize * Math.cos(angle - Math.PI / 6)) + ',' + (toPos.y - headSize * Math.sin(angle - Math.PI / 6)) + ' ' + (toPos.x - headSize * Math.cos(angle + Math.PI / 6)) + ',' + (toPos.y - headSize * Math.sin(angle + Math.PI / 6)));
                headPath.setAttribute('class', 'flow-arrow-head');
                pathGroup.appendChild(headPath);
            });
        }

        function saveArrows() { localStorage.setItem('flow-arrows-claude', JSON.stringify(arrows)); }

        function loadArrows() {
            const saved = localStorage.getItem('flow-arrows-claude');
            if (saved) { arrows = JSON.parse(saved); }
        }

        function initConnectionPoints() {
            document.querySelectorAll('.connection-point').forEach(point => {
                point.addEventListener('mousedown', handlePointMouseDown);
                point.addEventListener('mouseup', handlePointMouseUp);
            });
        }

        function handlePointMouseDown(e) {
            if (!editMode) return;
            e.preventDefault();
            e.stopPropagation();
            const point = e.target, pointId = point.dataset.point;
            dragState.isDragging = true;
            dragState.startPoint = point;
            dragState.startPointId = pointId;
            point.classList.add('dragging');

            const activePhase = document.querySelector('.phase-section.active');
            const phaseNum = activePhase.id.replace('phase', '');
            const svg = document.getElementById('arrows-phase' + phaseNum);
            const container = activePhase.querySelector('.flow-container');
            const pos = getElementPosition(point, container);

            dragState.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            dragState.tempLine.setAttribute('x1', pos.x);
            dragState.tempLine.setAttribute('y1', pos.y);
            dragState.tempLine.setAttribute('x2', pos.x);
            dragState.tempLine.setAttribute('y2', pos.y);
            dragState.tempLine.setAttribute('stroke', '#d97757');
            dragState.tempLine.setAttribute('stroke-width', '3');
            dragState.tempLine.setAttribute('stroke-dasharray', '8,4');
            svg.appendChild(dragState.tempLine);
        }

        function handlePointMouseUp(e) {
            if (!dragState.isDragging) return;
            e.preventDefault();
            e.stopPropagation();
            const targetPoint = e.target;
            const targetPointId = targetPoint.dataset.point;

            if (targetPoint !== dragState.startPoint && targetPointId) {
                const activePhase = document.querySelector('.phase-section.active');
                const phaseNum = activePhase.id.replace('phase', '');
                if (!arrows[phaseNum]) { arrows[phaseNum] = []; }
                arrows[phaseNum].push({ from: dragState.startPointId, to: targetPointId });
                drawArrows(phaseNum);
                saveArrows();
            }
            cleanupDrag();
        }

        function handleMouseMove(e) {
            if (!dragState.isDragging || !dragState.tempLine) return;
            const activePhase = document.querySelector('.phase-section.active');
            const container = activePhase.querySelector('.flow-container');
            const rect = container.getBoundingClientRect();
            dragState.tempLine.setAttribute('x2', e.clientX - rect.left);
            dragState.tempLine.setAttribute('y2', e.clientY - rect.top);
        }

        function handleGlobalMouseUp(e) { if (dragState.isDragging) { cleanupDrag(); } }

        function cleanupDrag() {
            if (dragState.startPoint) { dragState.startPoint.classList.remove('dragging'); }
            if (dragState.tempLine) { dragState.tempLine.remove(); }
            dragState.isDragging = false;
            dragState.startPoint = null;
            dragState.startPointId = null;
            dragState.tempLine = null;
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadArrows();
            initConnectionPoints();
            setTimeout(() => {
                const activePhase = document.querySelector('.phase-section.active');
                const phaseNum = activePhase.id.replace('phase', '');
                drawArrows(phaseNum);
            }, 100);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        });

        window.addEventListener('resize', function() {
            const activePhase = document.querySelector('.phase-section.active');
            if (activePhase) {
                const phaseNum = activePhase.id.replace('phase', '');
                setTimeout(() => drawArrows(phaseNum), 100);
            }
        });
    </script>
  `;
}

// 主函数
export function generateFlowchart(input: string): { html: string; data: FlowchartData } {
  const data = parseBusinessDescription(input);
  const html = generateFlowchartHTML(data);
  return { html, data };
}
