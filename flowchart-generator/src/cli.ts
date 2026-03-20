#!/usr/bin/env node
/**
 * Flowchart Generator CLI
 * 通用业务流程图生成器命令行工具
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateFlowchart } from './index.js';

interface CLIOptions {
  output?: string;
  help?: boolean;
  version?: boolean;
}

function parseArgs(args: string[]): { input: string; options: CLIOptions } {
  const options: CLIOptions = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
      case '--':
        // Stop parsing flags
        positionalArgs.push(...args.slice(i + 1));
        i = args.length;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`未知选项: ${arg}`);
          process.exit(1);
        }
        positionalArgs.push(arg);
        break;
    }
  }

  return {
    input: positionalArgs.join(' '),
    options
  };
}

function showHelp(): void {
  console.log(`
通用业务流程图生成器 v1.0.0

用法:
  flowchart <业务描述>           直接输入业务描述生成流程图
  flowchart <文件路径>            从文件读取业务描述
  flowchart <描述> [选项]

选项:
  -o, --output <文件>            指定输出 HTML 文件路径
  -h, --help                     显示帮助信息
  -v, --version                  显示版本号

示例:
  # 直接输入描述
  flowchart "用户注册流程：1. 用户：输入信息 2. 系统：验证"

  # 从文件读取
  flowchart ./business-flow.txt

  # 指定输出文件
  flowchart "订单处理流程" -o ./output.html

  # 从文件读取并指定输出
  flowchart ./input.txt -o ./result.html

业务描述格式:
  使用 "阶段" 或 "Phase" 标记阶段
  使用数字标记步骤 (1. 2. 3.)
  使用 "角色：动作" 格式描述操作

示例描述:
  阶段1：用户注册
  1. 用户：输入用户名和密码
  2. 系统：验证用户名唯一性
  3. 系统：发送验证邮件

更多信息:
  https://github.com/claude-skills/flowchart-generator
  `);
}

function showVersion(): void {
  console.log('v1.0.0');
}

function resolveInputPath(input: string): string {
  // Remove quotes if present
  const cleaned = input.replace(/^["']|["']$/g, '');

  // Check if it's a file path
  if (fs.existsSync(cleaned)) {
    return fs.readFileSync(cleaned, 'utf-8');
  }

  // Treat as direct input
  return cleaned;
}

function generateOutputPath(input: string, output?: string): string {
  if (output) {
    // Ensure output directory exists
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return output;
  }

  // Generate default output filename
  const titleMatch = input.match(/^#+\s*(.+)/m) || input.match(/(.+)/);
  let title = titleMatch ? titleMatch[1].trim().substring(0, 20) : 'flowchart';

  // Clean title for filename
  title = title
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .substring(0, 30);

  return `${title}流程图.html`;
}

function main(): void {
  const args = process.argv.slice(2);
  const { input, options } = parseArgs(args);

  // Handle special options
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  // Validate input
  if (!input) {
    console.error('错误: 请提供业务描述或文件路径');
    console.log('使用 "flowchart --help" 查看帮助信息');
    process.exit(1);
  }

  try {
    // Resolve input content
    const inputContent = resolveInputPath(input);

    if (!inputContent.trim()) {
      console.error('错误: 输入内容为空');
      process.exit(1);
    }

    // Generate flowchart
    console.log('正在生成流程图...');
    const { html, data } = generateFlowchart(inputContent);

    // Determine output path
    const outputPath = generateOutputPath(inputContent, options.output);

    // Write output file
    fs.writeFileSync(outputPath, html, 'utf-8');

    console.log(`✓ 流程图生成成功！`);
    console.log(`  标题: ${data.title}`);
    console.log(`  阶段数: ${data.phases.length}`);
    console.log(`  输出文件: ${path.resolve(outputPath)}`);

    // Try to open in default browser (platform-specific)
    const { exec } = require('child_process');
    const platform = process.platform;
    let openCommand: string;

    switch (platform) {
      case 'darwin':
        openCommand = `open "${outputPath}"`;
        break;
      case 'win32':
        openCommand = `start "" "${outputPath}"`;
        break;
      default:
        openCommand = `xdg-open "${outputPath}"`;
    }

    exec(openCommand, (error: Error | null) => {
      if (error) {
        console.log(`\n提示: 请手动在浏览器中打开 ${outputPath}`);
      }
    });

  } catch (error) {
    console.error('生成流程图时出错:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    }
    process.exit(1);
  }
}

main();
