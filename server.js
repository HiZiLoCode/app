const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// 读取 SSL 证书
const options = {
    key: fs.readFileSync('/etc/ssl/private/server.key'),
    cert: fs.readFileSync('/etc/ssl/certs/server.crt'),
};

// 创建 HTTPS 服务器
https.createServer(options, app).listen(443, () => {
    console.log('HTTPS Server running on port 443');
});

// 简单的路由
app.get('/', (req, res) => {
    console.log('HTTP Server running on port 80');
});
