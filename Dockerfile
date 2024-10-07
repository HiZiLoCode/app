# 基础镜像
FROM node:18 AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用 Nginx 提供服务
FROM nginx

# 复制构建的文件到 Nginx 目录
COPY --from=build /app/build /usr/share/nginx/html

# 复制 Nginx 配置文件（如果有）
COPY nginx.conf /etc/nginx/nginx.conf

# 监听 80 和 443 端口
EXPOSE 80 443
