#!/usr/bin/env node

/**
 * 转换脚本
 */
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const signale = require('signale');

const homeDir = os.homedir();
const zanProxyPath = path.join(homeDir, '.front-end-proxy');
const httpTrickPath = path.join(homeDir, '.http-trick');

const getId = () => Math.random().toString().replace('.', '');

// 构建写入json
const buildRule = opt => {
  const { json, id, userId } = opt;
  // 拼接参数
  json.id = id;
  json.userId = userId;
  json.meta = {
    remote: true,
    url: '',
  };
  json.ruleList = json.content.map(item => ({
    ...item,
    name: `规则名称_${getId()}`,
    id: getId(),
  }))
  delete json.content;
  return json;
}
// "id": "e20a298d-12b6-4a84-888d-5a0cc3bb8d8d",
// "userId": "root",
// "readonly": false,
// "default": false,
// content： "192.168.66.240 *.youzanyun.com\n192.168.66.240 baymax.qima-inc.com
// 构建写入 HOST
const buildHost = opt => {
  const { json, id, userId } = opt;
  let content = '';
  // 拼接参数
  json.id = id;
  json.userId = userId;
  json.readonly = false;
  json.default = false;
  for (let key in json.content) {
    content += `${json.content[key]} ${key}\n`;
  }
  json.content = content;
}

// build
const build = async (from, toPath, cb) => {
  const jsonFile = await fs.readFileSync(from, {
    encoding: 'utf8'
  });
  let json = null;
  try {
    json = JSON.parse(jsonFile)
  } catch (err) {
    signale.error(`${from} parse faild!`);
  }
  if (json) {
    const id = getId();
    const userId = 'root';
    cb && cb({ json, id, userId });
    const to = path.join(toPath, `${userId}_${id}.json`)
    await fs.writeFileSync(to, JSON.stringify(json, null, 4), {
      encoding: 'utf8'
    });
  }
}

// 转换 规则
const translateRule = async (fromDir, toDir) => {
  const fromPath = path.join(fromDir, 'rule');
  const toPath = path.join(toDir, 'rule');
  signale.start('start build rule...');
  const files = fs.readdirSync(fromPath);
  files.forEach(async file => {
    await build(
      path.join(fromPath, file),
      toPath,
      buildRule
    )
  });
  signale.start('rule build complate');
}

// 转换host
const translateHost = async (fromDir, toDir) => {
  const fromPath = path.join(fromDir, 'host');
  const toPath = path.join(toDir, 'host');
  signale.start('start build host...');
  const files = fs.readdirSync(fromPath);
  files.forEach(async file => {
    await build(
      path.join(fromPath, file),
      toPath,
      buildHost
    )
  });
  signale.start('host build complate');
}

const run = async () => {
  await translateRule(zanProxyPath, httpTrickPath);
  await translateHost(zanProxyPath, httpTrickPath);
}

run();
