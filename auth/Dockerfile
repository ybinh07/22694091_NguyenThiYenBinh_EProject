# Dùng Node 18
FROM node:18

# Tạo thư mục làm việc
WORKDIR /app

# Copy file package.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Mở port 3000
EXPOSE 3000

# Lệnh khởi động
CMD ["node", "index.js"]
